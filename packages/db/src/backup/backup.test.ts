import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { rmSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { InMemoryPortfolioRepository } from '../repository.js';
import { seedDemoPortfolio } from '../seed.js';
import {
  encryptWithAge,
  decryptWithAge,
  createDatabaseBackup,
  runRestoreDrill,
  enforceRetentionPolicy,
  checkBackupFreshness,
} from './engine.js';

describe('Database Backup, Restore Drill, Retention & Freshness (§13.9, §18.1, OSR-20, M8)', () => {
  const testBackupDir = resolve(__dirname, '../../../node_modules/.tmp/test-backups');
  const mockRecipientKey = 'age1mockkeyforliveunitandconformance2026';

  beforeEach(() => {
    if (existsSync(testBackupDir)) rmSync(testBackupDir, { recursive: true, force: true });
    mkdirSync(testBackupDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testBackupDir)) rmSync(testBackupDir, { recursive: true, force: true });
  });

  describe('1. Age & Authenticated Encryption / Decryption (§13.9)', () => {
    it('round-trips payload through encryption and decryption', () => {
      const plaintext = 'Secret portfolio data with sensitive credentials';
      const encrypted = encryptWithAge(plaintext, mockRecipientKey);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
      expect(encrypted.toString('utf8')).not.toContain('Secret portfolio');

      const decrypted = decryptWithAge(encrypted, mockRecipientKey);
      expect(decrypted.toString('utf8')).toBe(plaintext);
    });

    it('fails decryption when identity key does not match', () => {
      const plaintext = 'Critical state';
      const encrypted = encryptWithAge(plaintext, mockRecipientKey);

      expect(() => decryptWithAge(encrypted, 'wrong-identity-key')).toThrow();
    });
  });

  describe('2. Automated Backup Creation & Metadata Sidecar (§13.9, OSR-20)', () => {
    it('creates age-encrypted backup archive and metadata sidecar from repository', async () => {
      const repo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(repo);

      const result = await createDatabaseBackup({
        repo,
        destinationDir: testBackupDir,
        agePublicKey: mockRecipientKey,
      });

      expect(existsSync(result.backupFile)).toBe(true);
      expect(existsSync(result.metadataFile)).toBe(true);
      expect(result.metadata.entryCount).toBeGreaterThan(0);
      expect(result.metadata.schemaVersion).toBe('0.1.0');
      expect(result.metadata.payloadChecksumSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(result.metadata.backupSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('3. Automated Scratch Restore Drill (§13.9, §18.1, OSR-20)', () => {
    it('decrypts archive, verifies checksum, and restores entries into scratch repository', async () => {
      const primaryRepo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(primaryRepo);

      const backup = await createDatabaseBackup({
        repo: primaryRepo,
        destinationDir: testBackupDir,
        agePublicKey: mockRecipientKey,
      });

      const scratchRepo = new InMemoryPortfolioRepository();
      const drillResult = await runRestoreDrill({
        backupFile: backup.backupFile,
        identityKey: mockRecipientKey,
        scratchRepo,
      });

      expect(drillResult.ok).toBe(true);
      expect(drillResult.checksumVerified).toBe(true);
      expect(drillResult.embeddingVerified).toBe(true);
      expect(drillResult.restoredCounts.entries).toBe(backup.metadata.entryCount);

      // Verify scratch repository contains restored entries
      const scratchEntries = await scratchRepo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
      expect(scratchEntries.length).toBe(backup.metadata.entryCount);
    });

    it('fails restore drill when backup payload has corrupted checksum', async () => {
      const primaryRepo = new InMemoryPortfolioRepository();
      await seedDemoPortfolio(primaryRepo);

      const backup = await createDatabaseBackup({
        repo: primaryRepo,
        destinationDir: testBackupDir,
        agePublicKey: mockRecipientKey,
      });

      // Modify metadata expected checksum to simulate corruption
      const corruptedMeta = {
        ...backup.metadata,
        payloadChecksumSha256: '0000000000000000000000000000000000000000000000000000000000000000',
      };
      writeFileSync(backup.metadataFile, JSON.stringify(corruptedMeta, null, 2), 'utf8');

      const scratchRepo = new InMemoryPortfolioRepository();
      const drillResult = await runRestoreDrill({
        backupFile: backup.backupFile,
        identityKey: mockRecipientKey,
        scratchRepo,
      });

      expect(drillResult.ok).toBe(false);
      expect(drillResult.checksumVerified).toBe(false);
      expect(drillResult.details).toContain('Checksum mismatch');
    });
  });

  describe('4. Retention Policy Enforcement (§13.9)', () => {
    it('prunes older backups exceeding daily, weekly, and monthly policy thresholds', async () => {
      const repo = new InMemoryPortfolioRepository();
      const baseTime = new Date('2026-11-01T12:00:00Z').getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      // Create 10 daily backups
      for (let i = 0; i < 10; i++) {
        await createDatabaseBackup({
          repo,
          destinationDir: testBackupDir,
          agePublicKey: mockRecipientKey,
          nowMs: baseTime - i * oneDay,
          skipRetention: true,
          retentionPolicy: { daily: 7, weekly: 2, monthly: 1 },
        });
      }

      const report = enforceRetentionPolicy(testBackupDir, { daily: 7, weekly: 2, monthly: 1 });
      expect(report.retained.length).toBeLessThanOrEqual(9);
      expect(report.pruned.length).toBeGreaterThan(0);
    });
  });

  describe('5. Backup Freshness & Stale Age Alert (§13.9, OSR-20)', () => {
    it('reports not_configured when backup directory has no archives', () => {
      const freshness = checkBackupFreshness(testBackupDir);
      expect(freshness.status).toBe('not_configured');
      expect(freshness.fresh).toBe(false);
      expect(freshness.stale).toBe(false);
    });

    it('reports fresh when latest backup is within 24 hours', async () => {
      const repo = new InMemoryPortfolioRepository();
      await createDatabaseBackup({
        repo,
        destinationDir: testBackupDir,
        agePublicKey: mockRecipientKey,
        nowMs: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      });

      const freshness = checkBackupFreshness(testBackupDir, 24);
      expect(freshness.status).toBe('fresh');
      expect(freshness.fresh).toBe(true);
      expect(freshness.stale).toBe(false);
      expect(freshness.ageHours).toBeLessThan(3);
    });

    it('reports stale and raises BACKUP_STALE alert when latest backup is older than 24 hours', async () => {
      const repo = new InMemoryPortfolioRepository();
      await createDatabaseBackup({
        repo,
        destinationDir: testBackupDir,
        agePublicKey: mockRecipientKey,
        nowMs: Date.now() - 36 * 60 * 60 * 1000, // 36 hours ago
      });

      const freshness = checkBackupFreshness(testBackupDir, 24);
      expect(freshness.status).toBe('stale');
      expect(freshness.fresh).toBe(false);
      expect(freshness.stale).toBe(true);
      expect(freshness.alert).toBe('BACKUP_STALE');
      expect(freshness.ageHours).toBeGreaterThan(24);
    });
  });
});
