import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  createDatabaseBackup,
  runRestoreDrill,
  enforceRetentionPolicy,
  checkBackupFreshness,
  encryptWithAge,
  decryptWithAge,
  InMemoryPortfolioRepository,
} from '@living-portfolio/db';
import { PortfolioWorker } from '@living-portfolio/worker';
import { createApp } from '../app.js';

describe('Database Backup, Restore Drill, Retention & Freshness Conformance (§13.9, §18.1, §20, OSR-20, M8)', () => {
  const testDir = resolve(process.cwd(), '.tmp-backup-conformance-test');
  const mockRecipientKey = 'lp_conformance_test_recipient_key_2026';

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  describe('1. Age Authenticated Encryption & Decryption (§13.9)', () => {
    it('round-trips arbitrary database payloads using authenticated encryption', () => {
      const plaintext = 'SELECT * FROM entries WHERE visibility = "public";';
      const ciphertext = encryptWithAge(plaintext, mockRecipientKey);
      expect(ciphertext).toBeInstanceOf(Buffer);
      expect(ciphertext.length).toBeGreaterThan(plaintext.length);

      const decrypted = decryptWithAge(ciphertext, mockRecipientKey);
      expect(decrypted.toString('utf8')).toBe(plaintext);
    });

    it('rejects decryption when recipient key does not match', () => {
      const plaintext = 'secret data';
      const ciphertext = encryptWithAge(plaintext, mockRecipientKey);
      expect(() => decryptWithAge(ciphertext, 'wrong_key_12345')).toThrow();
    });
  });

  describe('2. Automated Backup Creation & Metadata Sidecar (§13.9, OSR-20)', () => {
    it('exports repository data, computes SHA-256, encrypts archive, and creates sidecar', async () => {
      const repo = new InMemoryPortfolioRepository();
      await repo.createEntry(
        {
          slug: 'backup-entry-1',
          title: 'Backup Entry 1',
          profile: 'builder',
          view: 'public',
          visibility: 'public',
        },
        {
          body_md: 'Entry content for backup verification.',
          written_at: new Date().toISOString(),
        }
      );

      const result = await createDatabaseBackup({
        repo,
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
      });

      expect(existsSync(result.backupFile)).toBe(true);
      expect(existsSync(result.metadataFile)).toBe(true);
      expect(result.metadata.entryCount).toBe(1);
      expect(result.metadata.revisionCount).toBe(1);
      expect(result.metadata.payloadChecksumSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(result.metadata.backupSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('3. Automated Scratch Restore Drill (§13.9, §18.1, OSR-20)', () => {
    it('decrypts backup archive, verifies checksum, and restores data into scratch repo', async () => {
      const sourceRepo = new InMemoryPortfolioRepository();
      await sourceRepo.createEntry(
        {
          slug: 'restore-drill-entry',
          title: 'Drill Entry',
          profile: 'builder',
          view: 'public',
          visibility: 'public',
        },
        {
          body_md: 'Drill content body.',
          written_at: new Date().toISOString(),
        }
      );

      const backup = await createDatabaseBackup({
        repo: sourceRepo,
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
      });

      const scratchRepo = new InMemoryPortfolioRepository();
      const drill = await runRestoreDrill({
        backupFile: backup.backupFile,
        identityKey: mockRecipientKey,
        scratchRepo,
      });

      expect(drill.ok).toBe(true);
      expect(drill.checksumVerified).toBe(true);
      expect(drill.embeddingVerified).toBe(true);
      expect(drill.restoredCounts.entries).toBe(1);

      const restored = await scratchRepo.listEntries();
      expect(restored.length).toBe(1);
      expect(restored[0].title).toBe('Drill Entry');
    });
  });

  describe('4. Configurable Retention Policy Enforcement (§13.9)', () => {
    it('enforces retention thresholds (daily, weekly, monthly) and prunes expired backups', async () => {
      const repo = new InMemoryPortfolioRepository();
      const baseTime = new Date('2026-11-01T12:00:00Z').getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      for (let i = 0; i < 10; i++) {
        await createDatabaseBackup({
          repo,
          destinationDir: testDir,
          agePublicKey: mockRecipientKey,
          nowMs: baseTime - i * oneDay,
          skipRetention: true,
        });
      }

      const report = enforceRetentionPolicy(testDir, { daily: 7, weekly: 2, monthly: 1 });
      expect(report.retained.length).toBeLessThanOrEqual(9);
      expect(report.pruned.length).toBeGreaterThan(0);
    });
  });

  describe('5. Backup Freshness & BACKUP_STALE Alerts (§13.9, OSR-20)', () => {
    it('detects unconfigured, fresh, and stale backups with BACKUP_STALE alert', async () => {
      const emptyFreshness = checkBackupFreshness(testDir);
      expect(emptyFreshness.status).toBe('not_configured');
      expect(emptyFreshness.fresh).toBe(false);

      const repo = new InMemoryPortfolioRepository();
      await createDatabaseBackup({
        repo,
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
        nowMs: Date.now(),
      });

      const freshStatus = checkBackupFreshness(testDir);
      expect(freshStatus.status).toBe('fresh');
      expect(freshStatus.fresh).toBe(true);
      expect(freshStatus.stale).toBe(false);

      // Stale: older than 24 hours
      await createDatabaseBackup({
        repo,
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
        nowMs: Date.now() - 30 * 60 * 60 * 1000, // 30 hours ago
      });

      // Clear the fresh one to test stale alert specifically
      const files = existsSync(testDir) ? require('node:fs').readdirSync(testDir) : [];
      // Test stale by inspecting checkBackupFreshness with an explicit old backup
      const staleDir = join(testDir, 'stale-test');
      mkdirSync(staleDir, { recursive: true });
      await createDatabaseBackup({
        repo,
        destinationDir: staleDir,
        agePublicKey: mockRecipientKey,
        nowMs: Date.now() - 30 * 60 * 60 * 1000,
      });

      const staleFreshness = checkBackupFreshness(staleDir);
      expect(staleFreshness.status).toBe('stale');
      expect(staleFreshness.stale).toBe(true);
      expect(staleFreshness.alert).toBe('BACKUP_STALE');
      expect(staleFreshness.ageHours).toBeGreaterThan(24);
    });
  });

  describe('6. HTTP Routes Integration (Settings & Health)', () => {
    const { app, adminToken } = createApp(undefined, { bootstrapAdminToken: 'test-admin-token' });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    it('POST /api/settings/backups/run-drill returns 501 SIMULATED(M1) when unconfigured', async () => {
      const res = await app.request('/api/settings/backups/run-drill', {
        method: 'POST',
        headers: authHeaders,
      });
      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.code).toBe('SIMULATED');
      expect(data.finding).toBe('M1');
    });

    it('POST /api/v1/settings/backups/run-drill executes real backup drill when options are configured', async () => {
      const res = await app.request('/api/v1/settings/backups/run-drill', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          destinationDir: testDir,
          agePublicKey: mockRecipientKey,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.backupFile).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.drillResult?.ok).toBe(true);
    });

    it('GET /api/v1/settings and GET /health report measured backup freshness', async () => {
      // Create a backup in testDir
      const repo = new InMemoryPortfolioRepository();
      await createDatabaseBackup({
        repo,
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
      });

      const originalBackupDir = process.env.BACKUP_DIR;
      process.env.BACKUP_DIR = testDir;

      try {
        const settingsRes = await app.request('/api/v1/settings', { headers: authHeaders });
        expect(settingsRes.status).toBe(200);
        const settingsData = await settingsRes.json();
        expect(settingsData.backups.lastBackupAt).not.toBeNull();
        expect(settingsData.backups.lastRestoreTest).toBe('passed');

        const healthRes = await app.request('/api/v1/health');
        expect(healthRes.status).toBe(200);
        const healthData = await healthRes.json();
        expect(healthData.backup.lastBackup).not.toBeNull();
        expect(healthData.backup.lastRestoreTestStatus).toBe('passed');
      } finally {
        if (originalBackupDir !== undefined) {
          process.env.BACKUP_DIR = originalBackupDir;
        } else {
          delete process.env.BACKUP_DIR;
        }
      }
    });
  });

  describe('7. Asynchronous Worker Integration (§8, §13.9)', () => {
    it('PortfolioWorker throws 501 when unconfigured, runs real backup drill when options are passed', async () => {
      const worker = new PortfolioWorker();
      await expect(worker.runBackupAndRestoreDrillJob()).rejects.toThrow(/501 Not Implemented \[SIMULATED\(M1\)\]/);

      const result = await worker.runBackupAndRestoreDrillJob({
        destinationDir: testDir,
        agePublicKey: mockRecipientKey,
      });

      expect(result.backupFile).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.drillResult?.ok).toBe(true);
    });
  });

  describe('8. CLI Scripts & Workflow Integrity (§13.9, §18.1, OSR-20)', () => {
    it('verifies CLI scripts and GitHub Actions workflow exist and are configured', () => {
      const monorepoRoot = resolve(import.meta.dirname, '../../../..');
      expect(existsSync(resolve(monorepoRoot, 'scripts/backup-db'))).toBe(true);
      expect(existsSync(resolve(monorepoRoot, 'scripts/restore-drill'))).toBe(true);

      const workflowPath = resolve(monorepoRoot, '.github/workflows/backup-restore-drill.yml');
      expect(existsSync(workflowPath)).toBe(true);
      const workflowContent = readFileSync(workflowPath, 'utf8');
      expect(workflowContent).toContain("cron: '0 2 * * *'");
      expect(workflowContent).toContain('pgvector/pgvector:pg16');
      expect(workflowContent).toContain('pnpm db:backup');
      expect(workflowContent).toContain('pnpm db:restore-drill');
    });
  });
});
