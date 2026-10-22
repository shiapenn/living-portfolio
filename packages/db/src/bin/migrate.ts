#!/usr/bin/env node
import { createDbPool, closeDbPool } from '../connection.js';
import { runMigrations, QRXP_SCHEMA_VERSION } from '../migrate.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is required to run migrations.');
    process.exit(1);
  }

  console.log(`Connecting to database to apply migrations (target QRXP schema version: ${QRXP_SCHEMA_VERSION})...`);
  const pool = createDbPool({ connectionString: databaseUrl });

  try {
    const result = await runMigrations(pool);
    console.log(`✓ Migrations completed successfully. Applied: [${result.applied.join(', ')}]. Current version: ${result.currentVersion}`);
  } catch (err: any) {
    console.error(`✗ Migration failed: ${err?.message || err}`);
    process.exit(1);
  } finally {
    await closeDbPool(pool);
  }
}

main();
