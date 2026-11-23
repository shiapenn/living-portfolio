import pg from 'pg';
import { createDbPool, createDrizzleDb, closeDbPool, type LivingPortfolioDb } from './connection.js';

export interface IsolatedTestDatabase {
  databaseName: string;
  databaseUrl: string;
  pool: pg.Pool;
  db: LivingPortfolioDb;
  cleanup: () => Promise<void>;
}

function deriveAdminAndTargetUrls(baseUrl: string, dbName: string): { adminUrl: string; targetUrl: string } {
  const parsed = new URL(baseUrl);
  const adminUrl = new URL(parsed.toString());
  adminUrl.pathname = '/postgres';
  const targetUrl = new URL(parsed.toString());
  targetUrl.pathname = `/${dbName}`;
  return {
    adminUrl: adminUrl.toString(),
    targetUrl: targetUrl.toString(),
  };
}

/**
 * Creates a per-worker isolated PostgreSQL database derived from DATABASE_URL.
 * Eliminates concurrent `CREATE EXTENSION IF NOT EXISTS "vector"` catalog races
 * (`pg_extension_name_index`) and cross-suite table interference across parallel Vitest workers.
 */
export async function createIsolatedTestDatabase(suiteTag: string): Promise<IsolatedTestDatabase> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is required to create an isolated test database.');
  }

  const safeTag = suiteTag.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24);
  const uniqueSuffix = `${process.pid}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const databaseName = `lp_test_${safeTag}_${uniqueSuffix}`.slice(0, 62);
  const { adminUrl, targetUrl } = deriveAdminAndTargetUrls(baseUrl, databaseName);

  const adminPool = new pg.Pool({ connectionString: adminUrl, max: 2 });
  try {
    await adminPool.query(`CREATE DATABASE "${databaseName}";`);
  } finally {
    await adminPool.end();
  }

  const pool = createDbPool({ connectionString: targetUrl });
  const db = createDrizzleDb(pool);

  const cleanup = async () => {
    await closeDbPool(pool);
    const dropPool = new pg.Pool({ connectionString: adminUrl, max: 2 });
    try {
      await dropPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`);
    } catch {
      await dropPool.query(`DROP DATABASE IF EXISTS "${databaseName}";`).catch(() => {});
    } finally {
      await dropPool.end().catch(() => {});
    }
  };

  return { databaseName, databaseUrl: targetUrl, pool, db, cleanup };
}
