import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import { checkBackupFreshness } from '@living-portfolio/db';

export interface HealthRouteOptions {
  databaseKind?: 'in-memory' | 'postgres' | 'dual-write';
  configuredProviders?: string[];
  backupDir?: string;
}

/**
 * Health endpoint (P0-9 / 20261020-UX-05): every field must come from a measured source.
 * Queue, worker, backup, and model subsystems report `not_configured` when not wired
 * instead of fabricated values (previously: activeWorkers=1, lastRestoreTestStatus='passed',
 * providers.mock='available', and a made-up lastBackup timestamp 12 hours in the past).
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

    const health = {
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      database: dbOk ? 'connected' : 'error',
      databaseKind: options?.databaseKind ?? 'in-memory',
      queue: {
        status: 'not_configured',
        depth: null,
        activeWorkers: null,
      },
      backup: (() => {
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
            }
          }
        }
        return backupStatus;
      })(),
      providers: {
        status: configuredProviders.length > 0 ? 'configured' : 'not_configured',
        active: configuredProviders,
      },
    };

    return c.json(health, dbOk ? 200 : 503);
  });

  return router;
}
