import { Hono } from 'hono';

/**
 * Health endpoint (P0-9 / 20261020-UX-05): every field must come from a measured source.
 * Queue, worker and backup subsystems are not wired yet, so they report `not_configured`
 * instead of fabricated values (previously: activeWorkers=1, lastRestoreTestStatus='passed',
 * and a made-up lastBackup timestamp 12 hours in the past).
 */
export function createHealthRoutes(
  repoHealthCheck: () => Promise<boolean>,
  options?: { databaseKind?: 'in-memory' | 'postgres' }
) {
  const router = new Hono();

  router.get('/', async (c) => {
    let dbOk = false;
    try {
      dbOk = await repoHealthCheck();
    } catch {
      dbOk = false;
    }

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
      backup: {
        lastBackup: null,
        lastRestoreTestStatus: 'not_configured',
      },
      providers: {
        mock: 'available',
      },
    };

    return c.json(health, dbOk ? 200 : 503);
  });

  return router;
}
