import { describe, it, expect, beforeEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import {
  BudgetGovernor,
  MockModelProvider,
  type ModelProvider,
  type CompletionRequest,
  type CompletionResponse,
} from '@living-portfolio/ai';
import type { NotificationChannel, AlertPayload } from '@living-portfolio/core';
import { createApp } from '../app.js';
import { MetricsCollector } from '../observability/metrics.js';

class MockNotificationChannel implements NotificationChannel {
  id = 'mock-notify';
  name = 'Mock Notification Channel';
  sentAlerts: AlertPayload[] = [];

  async send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }> {
    this.sentAlerts.push(alert);
    return { delivered: true, timestamp: new Date().toISOString() };
  }

  async test(): Promise<{ ok: boolean; latencyMs: number }> {
    return { ok: true, latencyMs: 5 };
  }
}

class ControlledProvider implements ModelProvider {
  id: string;
  name: string;
  isLocal = false;
  dataPolicy = {
    trainsOnInputs: false,
    retentionDays: 0,
    humanReview: false,
    zeroRetentionOption: true,
  };
  dailyTokensLimit: number;
  throw429: boolean;
  throw500: boolean;

  constructor(id: string, name: string, dailyTokensLimit = 1000, throw429 = false, throw500 = false) {
    this.id = id;
    this.name = name;
    this.dailyTokensLimit = dailyTokensLimit;
    this.throw429 = throw429;
    this.throw500 = throw500;
  }

  limits() {
    return {
      rpm: 60,
      tpm: 10000,
      dailyRequests: 500,
      dailyTokens: this.dailyTokensLimit,
    };
  }

  async listModels(): Promise<string[]> {
    return ['controlled-model'];
  }

  async complete(_req: CompletionRequest): Promise<CompletionResponse> {
    if (this.throw429) {
      const err: any = new Error('Rate limit exceeded (429)');
      err.status = 429;
      throw err;
    }
    if (this.throw500) {
      throw new Error('Upstream LLM server failure (500)');
    }
    return {
      text: 'Controlled response text from model.',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    };
  }

  async embed(_texts: string[]): Promise<number[][]> {
    return [[0.1, 0.2]];
  }
}

describe('Observability, Budget Caps, Error Rate Monitoring & Spend Alerts (Spec §13.5, §13.9, OSR-21)', () => {
  let testBackupDir: string;

  beforeEach(() => {
    testBackupDir = resolve(tmpdir(), `lp-obs-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testBackupDir, { recursive: true });
    return () => {
      rmSync(testBackupDir, { recursive: true, force: true });
    };
  });

  describe('1. MetricsCollector & Error Rate Threshold Monitoring (§13.5, §13.9)', () => {
    it('accurately tracks requests, error counts, and computes sliding-window error rates', () => {
      const collector = new MetricsCollector({ windowDurationMs: 60_000, errorRateThreshold: 0.20, minRequestsForErrorRate: 5 });

      // 4 successful requests (200)
      collector.recordRequest(200, 10);
      collector.recordRequest(200, 15);
      collector.recordRequest(204, 5);
      collector.recordRequest(200, 12);

      // 1 client error (404), 1 rate limited (429), 1 server error (500)
      collector.recordRequest(404, 8);
      collector.recordRequest(429, 20);
      collector.recordRequest(500, 50);

      const metrics = collector.getMetrics();
      expect(metrics.totalRequests).toBe(7);
      expect(metrics.errorCount5xx).toBe(1);
      expect(metrics.errorCount4xx).toBe(2);
      expect(metrics.rateLimitedCount429).toBe(1);
      expect(metrics.errorRate5xx).toBeCloseTo(1 / 7, 3);
    });

    it('stages failure: triggers HIGH_ERROR_RATE critical alert when 5xx rate exceeds threshold on sufficient volume', () => {
      let dispatchedAlert = false;
      const collector = new MetricsCollector({
        windowDurationMs: 60_000,
        errorRateThreshold: 0.20, // 20%
        minRequestsForErrorRate: 5,
        onAlert: (alert) => {
          if (alert.code === 'HIGH_ERROR_RATE') {
            dispatchedAlert = true;
          }
        },
      });

      // Inject 2 failures out of 5 requests (40% error rate > 20% threshold)
      collector.recordRequest(200, 10);
      collector.recordRequest(200, 10);
      collector.recordRequest(200, 10);
      collector.recordRequest(500, 50);
      collector.recordRequest(503, 40);

      const alerts = collector.getAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].code).toBe('HIGH_ERROR_RATE');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].subsystem).toBe('api');
      expect(alerts[0].message).toContain('High HTTP 5xx error rate detected');
      expect(dispatchedAlert).toBe(true);
    });

    it('stages recovery: clears HIGH_ERROR_RATE alert when error rate falls back below threshold', () => {
      const collector = new MetricsCollector({
        windowDurationMs: 60_000,
        errorRateThreshold: 0.25,
        minRequestsForErrorRate: 5,
      });

      // Stage failure (2/5 = 40%)
      collector.recordRequest(200, 10);
      collector.recordRequest(200, 10);
      collector.recordRequest(200, 10);
      collector.recordRequest(500, 50);
      collector.recordRequest(500, 50);

      expect(collector.getAlerts().length).toBe(1);

      // Stage recovery: add 15 successful requests -> 2/20 = 10% < 25% threshold
      for (let i = 0; i < 15; i++) {
        collector.recordRequest(200, 10);
      }

      expect(collector.getAlerts().length).toBe(0);
    });
  });

  describe('2. BudgetGovernor Spend Tracking, Soft/Hard Caps & Rate Limit Alerts (§13.5)', () => {
    it('stages soft budget cap (>= 80%): fires BUDGET_SOFT_CAP warning alert and triggers smaller_model step', () => {
      const governor = new BudgetGovernor({ softThreshold: 0.8, hardThreshold: 1.0 });
      const provider = new ControlledProvider('provider-soft', 'Soft Cap Provider', 1000);

      // Spend 820 tokens out of 1000 (82% >= 80% soft threshold)
      const res = governor.acquire([provider], 820, 'owner_interactive', 'public');
      expect(res.provider?.id).toBe('provider-soft');
      expect(res.degradationStep).toBe('smaller_model');

      const utilization = governor.getUtilization([provider]);
      expect(utilization[0].utilizationPercent).toBe(82);
      expect(utilization[0].softThresholdReached).toBe(true);
      expect(utilization[0].hardThresholdReached).toBe(false);

      const alerts = governor.getAlerts([provider]);
      expect(alerts.length).toBe(1);
      expect(alerts[0].code).toBe('BUDGET_SOFT_CAP');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].subsystem).toBe('provider');
      expect(alerts[0].message).toContain('82.0% of daily limit');
    });

    it('stages hard budget cap (100%): fires BUDGET_HARD_CAP critical alert and falls back to extractive degradation', () => {
      const governor = new BudgetGovernor({ softThreshold: 0.8, hardThreshold: 1.0 });
      const provider = new ControlledProvider('provider-hard', 'Hard Cap Provider', 1000);

      // Spend up to 1000 tokens (100% hard threshold)
      governor.acquire([provider], 1000, 'owner_interactive', 'public');

      // Subsequent attempt fails to acquire generative provider and steps down to extractive mode
      const nextLease = governor.acquire([provider], 50, 'visitor_interactive', 'public');
      expect(nextLease.provider).toBeNull();
      expect(nextLease.degradationStep).toBe('extractive');

      const utilization = governor.getUtilization([provider]);
      expect(utilization[0].hardThresholdReached).toBe(true);
      expect(utilization[0].utilizationPercent).toBe(100);

      const alerts = governor.getAlerts([provider]);
      const hardAlert = alerts.find((a) => a.code === 'BUDGET_HARD_CAP');
      expect(hardAlert).toBeDefined();
      expect(hardAlert?.severity).toBe('critical');
      expect(hardAlert?.subsystem).toBe('provider');
      expect(hardAlert?.message).toContain('100% of daily limit');
    });

    it('stages 429 response: records jittered backoff and fires PROVIDER_RATE_LIMITED warning alert', () => {
      let notifiedAlert: AlertPayload | null = null;
      const channel = new MockNotificationChannel();
      const governor = new BudgetGovernor();
      governor.setAlertListener((alert) => {
        channel.send({
          title: alert.code,
          message: alert.message,
          severity: alert.severity,
        });
      });

      const provider = new ControlledProvider('provider-429', 'Rate Limited Provider', 5000);

      // Provider returns 429 rate limit
      governor.recordRateLimitError(provider.id, 3600);

      const utilization = governor.getUtilization([provider]);
      expect(utilization[0].isRateLimited).toBe(true);
      expect(utilization[0].rateLimitedUntil).not.toBeNull();

      const alerts = governor.getAlerts([provider]);
      const rateAlert = alerts.find((a) => a.code === 'PROVIDER_RATE_LIMITED');
      expect(rateAlert).toBeDefined();
      expect(rateAlert?.severity).toBe('warning');
      expect(rateAlert?.message).toContain('429 rate limit backoff');

      // Proves notification dispatch occurred
      expect(channel.sentAlerts.length).toBeGreaterThan(0);
      expect(channel.sentAlerts[0].title).toBe('PROVIDER_RATE_LIMITED');
    });
  });

  describe('3. End-to-End Route Integration & Staged Failures via HTTP API (§13.5, §13.9, OSR-21)', () => {
    it('GET /api/v1/health and GET /healthz report measured monitoring metrics and clear alerts initially', async () => {
      const repo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(repo);

      const testApp = createApp(repo);
      await testApp.app.request('/api/v1/entries');
      const res = await testApp.app.request('/api/v1/health');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('healthy');
      expect(body.monitoring).toBeDefined();
      expect(body.monitoring.metrics.totalRequests).toBeGreaterThanOrEqual(1);
      expect(body.monitoring.alerts).toEqual([]);
    });

    it('staged failure: high 5xx rate triggers HIGH_ERROR_RATE critical alert and degrades /healthz', async () => {
      const repo = new InMemoryPortfolioRepository();
      const metricsCollector = new MetricsCollector({
        windowDurationMs: 60_000,
        errorRateThreshold: 0.15,
        minRequestsForErrorRate: 5,
      });

      const testApp = createApp(repo, { metricsCollector });

      // Inject 4 success requests and 2 500 error requests (2/6 = 33% > 15%)
      for (let i = 0; i < 4; i++) {
        metricsCollector.recordRequest(200, 10);
      }
      metricsCollector.recordRequest(500, 50);
      metricsCollector.recordRequest(503, 40);

      const healthRes = await testApp.app.request('/healthz');
      expect(healthRes.status).toBe(200);

      const health = await healthRes.json();
      expect(health.status).toBe('degraded');
      expect(health.monitoring.alerts.length).toBeGreaterThanOrEqual(1);

      const errorAlert = health.monitoring.alerts.find((a: any) => a.code === 'HIGH_ERROR_RATE');
      expect(errorAlert).toBeDefined();
      expect(errorAlert.severity).toBe('critical');
      expect(errorAlert.subsystem).toBe('api');
    });

    it('staged failure: budget hard cap triggers BUDGET_HARD_CAP critical alert and degrades Ask flow to extractive', async () => {
      const repo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(repo);

      const provider = new ControlledProvider('primary-groq', 'Primary Inference', 500);
      const governor = new BudgetGovernor({ hardThreshold: 1.0 });

      const testApp = createApp(repo, {
        providers: [provider],
        governor,
      });

      // Drive spend to 100% (500 tokens)
      governor.acquire([provider], 500, 'owner_interactive', 'public');

      // Health check reports degraded with BUDGET_HARD_CAP
      const healthRes = await testApp.app.request('/api/v1/health');
      const health = await healthRes.json();
      expect(health.status).toBe('degraded');

      const hardAlert = health.monitoring.alerts.find((a: any) => a.code === 'BUDGET_HARD_CAP');
      expect(hardAlert).toBeDefined();
      expect(hardAlert.severity).toBe('critical');

      // Ask query degrades cleanly to extractive excerpts without 500 error
      const askRes = await testApp.app.request('/api/v1/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What database did you migrate to?' }),
      });

      expect(askRes.status).toBe(200);
      const askBody = await askRes.json();
      expect(askBody.tier).toBe('extractive');
      expect(askBody.degradationStep).toBe('extractive');
      expect(askBody.provider_disclosure).toContain("Showing excerpts from the owner's records.");
      expect(askBody.citations.length).toBeGreaterThan(0);
    });

    it('staged failure: upstream 429 backoff fires PROVIDER_RATE_LIMITED warning alert in /health', async () => {
      const repo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(repo);

      const rateLimitedProvider = new ControlledProvider('rate-limited-groq', 'Groq API', 2000, true);
      const governor = new BudgetGovernor();

      const testApp = createApp(repo, {
        providers: [rateLimitedProvider],
        governor,
      });

      // Make Ask request; provider throws 429
      const askRes = await testApp.app.request('/api/v1/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What database did you migrate to?' }),
      });

      expect(askRes.status).toBe(200);
      const askBody = await askRes.json();
      expect(askBody.tier).toBe('extractive');

      // /health reports PROVIDER_RATE_LIMITED alert
      const healthRes = await testApp.app.request('/api/v1/health');
      const health = await healthRes.json();

      const rateAlert = health.monitoring.alerts.find((a: any) => a.code === 'PROVIDER_RATE_LIMITED');
      expect(rateAlert).toBeDefined();
      expect(rateAlert.severity).toBe('warning');
      expect(rateAlert.subsystem).toBe('provider');
    });

    it('staged failure: stale backup (> 24 hours) triggers BACKUP_STALE critical alert in /health', async () => {
      const repo = new InMemoryPortfolioRepository();

      // Create a stale backup (28 hours old)
      const staleTimestamp = new Date(Date.now() - 28 * 3600 * 1000).toISOString();
      const meta = {
        timestamp: staleTimestamp,
        database: 'portfolio',
        encrypted: true,
        checksum: 'fake-checksum',
        format: 'custom',
        sourceUrl: 'postgres://test',
      };
      writeFileSync(resolve(testBackupDir, 'backup-stale.dump.age'), 'stale-encrypted-bytes');
      writeFileSync(resolve(testBackupDir, 'backup-stale.meta.json'), JSON.stringify(meta, null, 2));

      const testApp = createApp(repo);
      const healthRoutes = (await import('../routes/health.js')).createHealthRoutes(
        async () => true,
        { backupDir: testBackupDir }
      );

      // Mount into test router
      const testHono = new (await import('hono')).Hono();
      testHono.route('/health', healthRoutes);

      const res = await testHono.request('/health');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('degraded');
      expect(body.backup.lastRestoreTestStatus).toBe('stale');
      expect(body.backup.alert).toBe('BACKUP_STALE');

      const staleAlert = body.monitoring.alerts.find((a: any) => a.code === 'BACKUP_STALE');
      expect(staleAlert).toBeDefined();
      expect(staleAlert.severity).toBe('critical');
      expect(staleAlert.subsystem).toBe('backup');
    });

    it('GET /api/v1/settings returns real provider utilization under budgets schema', async () => {
      const repo = new InMemoryPortfolioRepository();
      const provider = new ControlledProvider('groq-settings', 'Groq Settings Test', 5000);
      const governor = new BudgetGovernor();

      // Provisionally acquire 1200 tokens
      governor.acquire([provider], 1200, 'visitor_interactive', 'public');

      const testApp = createApp(repo, {
        providers: [provider],
        governor,
        bootstrapAdminToken: 'test-admin-settings-token',
      });

      const res = await testApp.app.request('/api/v1/settings', {
        headers: { Authorization: 'Bearer test-admin-settings-token' },
      });

      expect(res.status).toBe(200);
      const settings = await res.json();
      expect(settings.budgets).toBeDefined();
      expect(settings.budgets.utilization).toBeDefined();
      expect(settings.budgets.utilization.length).toBeGreaterThanOrEqual(1);

      const tracked = settings.budgets.utilization.find((u: any) => u.providerId === 'groq-settings');
      expect(tracked).toBeDefined();
      expect(tracked.tokensToday).toBe(1200);
      expect(tracked.dailyLimitTokens).toBe(5000);
      expect(tracked.utilizationPercent).toBe(24);
    });
  });
});
