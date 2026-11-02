import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import { checkBackupFreshness } from '@living-portfolio/db';
import type { BudgetGovernor, ModelProvider } from '@living-portfolio/ai';
import type { ObservabilityAlert } from '@living-portfolio/core';
import type { MetricsCollector } from '../observability/metrics.js';

export interface HealthRouteOptions {
  databaseKind?: 'in-memory' | 'postgres' | 'dual-write';
  configuredProviders?: string[];
  backupDir?: string;
  governor?: BudgetGovernor;
  metricsCollector?: MetricsCollector;
  providers?: ModelProvider[];
}

/**
 * Health endpoint (P0-9 / 20261020-UX-05, Spec §13.5, §13.9, OSR-21):
 * Subsystems report measured status, budget utilization, error rates, and active alerts.
 */
export function createHealthRoutes(
  repoHealthCheck: () => Promise<boolean>,
  options?: HealthRouteOptions
) {
  const router = new Hono();

  router.get('/', async (c) => {
    let dbOk = false;
    try {
      dbOk = await repoHealthCheck();
    } catch {
      dbOk = false;
    }

    const configuredProviders = options?.configuredProviders ?? [];
    const allAlerts: ObservabilityAlert[] = [];

    // 1. Backup freshness & alerts (§13.9, OSR-20)
    const backupDir = options?.backupDir ?? process.env.BACKUP_DIR;
    const backupStatus: {
      lastBackup: string | null;
      lastRestoreTestStatus: string;
      alert?: string;
    } = {
      lastBackup: null,
      lastRestoreTestStatus: 'not_configured',
    };

    if (backupDir && existsSync(backupDir)) {
      const freshness = checkBackupFreshness(backupDir);
      if (freshness.lastBackupAt) {
        backupStatus.lastBackup = freshness.lastBackupAt;
        backupStatus.lastRestoreTestStatus = freshness.fresh ? 'passed' : 'stale';
        if (freshness.alert) {
          backupStatus.alert = freshness.alert;
          allAlerts.push({
            code: freshness.alert,
            severity: 'critical',
            subsystem: 'backup',
            message: 'Latest database backup is older than 24 hours or missing.',
            timestamp: new Date().toISOString(),
            metadata: {
              lastBackupAt: freshness.lastBackupAt,
              ageHours: freshness.ageHours,
            },
          });
        }
      }
    }

    // 2. Provider budget governor alerts (§13.5, §13.9, OSR-21)
    if (options?.governor) {
      const govAlerts = options.governor.getAlerts(options.providers);
      allAlerts.push(...govAlerts);
    }

    // 3. API request error rate alerts (§13.5, §13.9, OSR-21)
    if (options?.metricsCollector) {
      const apiAlerts = options.metricsCollector.getAlerts();
      allAlerts.push(...apiAlerts);
    }

    // 4. Subsystem & aggregate health status determination
    const hasCriticalAlert = allAlerts.some((a) => a.severity === 'critical');
    const isHealthy = dbOk && !hasCriticalAlert;

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      database: dbOk ? 'connected' : 'error',
      databaseKind: options?.databaseKind ?? 'in-memory',
      queue: {
        status: 'not_configured',
        depth: null,
        activeWorkers: null,
      },
      backup: backupStatus,
      providers: {
        status: configuredProviders.length > 0 ? 'configured' : 'not_configured',
        active: configuredProviders,
        ...(options?.governor && configuredProviders.length > 0
          ? { utilization: options.governor.getUtilization(options.providers) }
          : {}),
      },
      monitoring: {
        metrics: options?.metricsCollector?.getMetrics() ?? {
          totalRequests: 0,
          errorCount5xx: 0,
          errorCount4xx: 0,
          rateLimitedCount429: 0,
          errorRate5xx: 0,
          uptimeSeconds: 0,
          windowDurationMs: 60000,
        },
        alerts: allAlerts,
      },
    };

    return c.json(health, dbOk ? 200 : 503);
  });

  return router;
}
