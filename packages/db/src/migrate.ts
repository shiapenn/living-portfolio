import type pg from 'pg';
import { MIGRATION_0001_INIT_NAME, MIGRATION_0001_INIT_SQL } from './migrations/0001_init.js';
import { MIGRATION_0002_GOVERNOR_LEDGER_NAME, MIGRATION_0002_GOVERNOR_LEDGER_SQL } from './migrations/0002_governor_ledger.js';

/**
 * Authoritative QRXP schema version tracked in schema_info table (§9, §19).
 */
export const QRXP_SCHEMA_VERSION = '0.1.0';

export interface MigrationStep {
  name: string;
  version: string;
  sql: string;
}

export const MIGRATIONS: MigrationStep[] = [
  {
    name: MIGRATION_0001_INIT_NAME,
    version: QRXP_SCHEMA_VERSION,
    sql: MIGRATION_0001_INIT_SQL,
  },
  {
    name: MIGRATION_0002_GOVERNOR_LEDGER_NAME,
    version: QRXP_SCHEMA_VERSION,
    sql: MIGRATION_0002_GOVERNOR_LEDGER_SQL,
  },
];

export interface Queryable {
  query: (sql: string, params?: any[]) => Promise<any>;
}

/**
 * Retrieves the currently recorded QRXP schema version from schema_info table.
 * Returns null if the table does not exist or has no entries.
 */
export async function getSchemaVersion(client: Queryable): Promise<string | null> {
  try {
    const res = await client.query(
      'SELECT qrxp_schema_version FROM schema_info ORDER BY applied_at DESC LIMIT 1;'
    );
    if (res && res.rows && res.rows.length > 0) {
      return res.rows[0].qrxp_schema_version;
    }
    return null;
  } catch (err: any) {
    // 42P01 is PostgreSQL code for undefined_table
    if (err?.code === '42P01' || err?.message?.includes('relation "schema_info" does not exist')) {
      return null;
    }
    throw err;
  }
}

/**
 * Verifies that the database is running the expected schema version (§9, §19).
 * Throws a descriptive error refusing to boot and providing the exact migration command if mismatched.
 */
export async function assertSchemaVersion(
  client: Queryable,
  expectedVersion: string = QRXP_SCHEMA_VERSION
): Promise<void> {
  const currentVersion = await getSchemaVersion(client);

  if (!currentVersion || currentVersion !== expectedVersion) {
    throw new Error(
      `Database schema version mismatch or uninitialized. Expected '${expectedVersion}', found '${
        currentVersion ?? 'none'
      }'. Refusing to start. Run 'pnpm --filter @living-portfolio/db migrate' to apply pending migrations.`
    );
  }
}

/**
 * Alias for assertSchemaVersion (§9, §19, P2).
 */
export const verifySchemaVersion = assertSchemaVersion;

/**
 * Runs all forward migrations idempotently and records the applied schema version in schema_info (§9, §19).
 */
export async function runMigrations(
  client: Queryable
): Promise<{ applied: string[]; currentVersion: string }> {
  const applied: string[] = [];

  for (const migration of MIGRATIONS) {
    // Execute DDL batch
    await client.query(migration.sql);

    // Record schema version in schema_info table
    await client.query(
      `INSERT INTO schema_info (qrxp_schema_version, applied_at)
       VALUES ($1, now())
       ON CONFLICT (qrxp_schema_version) DO UPDATE SET applied_at = now();`,
      [migration.version]
    );

    applied.push(migration.name);
  }

  return {
    applied,
    currentVersion: QRXP_SCHEMA_VERSION,
  };
}
