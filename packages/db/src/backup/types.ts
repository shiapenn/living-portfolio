/**
 * Backup, Restore Drill, Retention, and Freshness Types (§13.9, §18.1, §20, OSR-20, M8)
 */

export interface BackupRetentionPolicy {
  daily: number; // default 7
  weekly: number; // default 4
  monthly: number; // default 6
}

export interface BackupMetadata {
  id: string;
  timestamp: string; // ISO-8601
  schemaVersion: string;
  databaseKind: 'postgres' | 'in-memory';
  entryCount: number;
  revisionCount: number;
  chunkCount: number;
  payloadChecksumSha256: string;
  encryptionMethod: 'age-cli' | 'age-compat';
  recipientKey: string;
  backupSizeBytes: number;
}

export interface CreateBackupOptions {
  databaseUrl?: string;
  agePublicKey?: string;
  destinationDir?: string;
  mediaDir?: string;
  repo?: any;
  retentionPolicy?: Partial<BackupRetentionPolicy>;
  nowMs?: number;
  skipRetention?: boolean;
}

export interface RestoreDrillOptions {
  backupFile: string;
  identityKey?: string;
  targetDatabaseUrl?: string;
  restoreMediaDir?: string;
  scratchRepo?: any;
}

export interface RestoreDrillResult {
  ok: boolean;
  drilledAt: string;
  restoredCounts: {
    entries: number;
    revisions: number;
    chunks: number;
  };
  embeddingVerified: boolean;
  checksumVerified: boolean;
  durationMs: number;
  details?: string;
}

export interface BackupFreshnessStatus {
  lastBackupAt: string | null;
  ageHours: number | null;
  fresh: boolean;
  stale: boolean;
  status: 'fresh' | 'stale' | 'not_configured';
  alert?: 'BACKUP_STALE';
}
