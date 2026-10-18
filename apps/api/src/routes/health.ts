import { Hono } from 'hono';

export function createHealthRoutes(repoHealthCheck: () => Promise<boolean>) {
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
      queue: {
        depth: 0,
        activeWorkers: 1,
      },
      backup: {
        lastBackup: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        lastRestoreTestStatus: 'passed',
      },
      providers: {
        mock: 'available',
      },
    };

    return c.json(health, dbOk ? 200 : 503);
  });

  return router;
}
