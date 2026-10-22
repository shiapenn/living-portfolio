import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

const { Pool } = pg;

export interface DbConnectionOptions extends pg.PoolConfig {
  connectionString?: string;
}

export type LivingPortfolioDb = NodePgDatabase<typeof schema>;

let defaultPool: pg.Pool | null = null;
let defaultDb: LivingPortfolioDb | null = null;

/**
 * Creates and configures a PostgreSQL connection pool with sensible defaults.
 */
export function createDbPool(options?: DbConnectionOptions | string): pg.Pool {
  const config: pg.PoolConfig =
    typeof options === 'string'
      ? { connectionString: options }
      : { ...(options || {}) };

  if (!config.connectionString && process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
  }

  // Sensible defaults for server/container environments
  config.max = config.max ?? 10;
  config.idleTimeoutMillis = config.idleTimeoutMillis ?? 30000;
  config.connectionTimeoutMillis = config.connectionTimeoutMillis ?? 5000;

  return new Pool(config);
}

/**
 * Creates a Drizzle ORM database client instance bound to a pg.Pool or connection options.
 */
export function createDrizzleDb(poolOrOptions?: pg.Pool | DbConnectionOptions | string): LivingPortfolioDb {
  if (poolOrOptions && typeof (poolOrOptions as pg.Pool).query === 'function') {
    return drizzle(poolOrOptions as pg.Pool, { schema });
  }
  const pool = createDbPool(poolOrOptions as DbConnectionOptions | string | undefined);
  return drizzle(pool, { schema });
}

/**
 * Returns a shared default pool instance, instantiating one if needed.
 */
export function getDefaultPool(): pg.Pool {
  if (!defaultPool) {
    defaultPool = createDbPool();
  }
  return defaultPool;
}

/**
 * Returns a shared default Drizzle instance.
 */
export function getDefaultDb(): LivingPortfolioDb {
  if (!defaultDb) {
    defaultDb = createDrizzleDb(getDefaultPool());
  }
  return defaultDb;
}

/**
 * Gracefully shuts down a PostgreSQL connection pool.
 */
export async function closeDbPool(pool?: pg.Pool): Promise<void> {
  const targetPool = pool || defaultPool;
  if (targetPool) {
    await targetPool.end();
    if (targetPool === defaultPool) {
      defaultPool = null;
      defaultDb = null;
    }
  }
}

/**
 * Performs a lightweight health check against the PostgreSQL database.
 */
export async function checkDbHealth(
  poolOrOptions?: pg.Pool | DbConnectionOptions | string
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  let pool: pg.Pool | null = null;
  let shouldClose = false;

  try {
    if (poolOrOptions && typeof (poolOrOptions as pg.Pool).query === 'function') {
      pool = poolOrOptions as pg.Pool;
    } else {
      pool = createDbPool(poolOrOptions as DbConnectionOptions | string | undefined);
      shouldClose = true;
    }

    const start = Date.now();
    await pool.query('SELECT 1 AS health_check;');
    const latencyMs = Date.now() - start;

    return { ok: true, latencyMs };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: -1,
      error: err?.message || String(err),
    };
  } finally {
    if (shouldClose && pool) {
      await pool.end().catch(() => {});
    }
  }
}
