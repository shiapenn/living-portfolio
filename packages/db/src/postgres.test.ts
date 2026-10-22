/**
 * PostgreSQL + pgvector Persistence & Migration Harness Test Suite (Fix 7, Fix 10, P1, P2, OSR-14, OSR-15)
 *
 * Verifies:
 * 1. Connection pooling factory and health check handling.
 * 2. Forward-only migration harness, DDL integrity, and QRXP schema version tracking (§9, §19).
 * 3. Schema boot check enforcement (refusal to boot on uninitialized/mismatched schema with exact command).
 * 4. Real PostgreSQL + pgvector live integration operations when DATABASE_URL is configured (in CI service container).
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import {
  createDbPool,
  createDrizzleDb,
  closeDbPool,
  checkDbHealth,
} from './connection.js';
import {
  QRXP_SCHEMA_VERSION,
  MIGRATIONS,
  getSchemaVersion,
  assertSchemaVersion,
  runMigrations,
} from './migrate.js';
import {
  ventures,
  entries,
  entryRevisions,
  spans,
  embeddingSets,
  chunkVectors,
} from './schema/index.js';
import { eq } from 'drizzle-orm';

describe('Postgres Scaffolding & Migration Harness Unit Verification (Fix 7, P2, §9, §19)', () => {
  it('defines valid semantic QRXP schema version', () => {
    expect(QRXP_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(QRXP_SCHEMA_VERSION).toBe('0.1.0');
  });

  it('declares 0001_init migration with pgvector extension and core tables', () => {
    expect(MIGRATIONS.length).toBeGreaterThan(0);
    const initMigration = MIGRATIONS.find((m) => m.name === '0001_init');
    expect(initMigration).toBeDefined();
    expect(initMigration!.sql).toContain('CREATE EXTENSION IF NOT EXISTS "vector"');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS schema_info');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS ventures');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS entries');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS entry_revisions');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS spans');
    expect(initMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS chunk_vectors');
    expect(initMigration!.sql).toContain('vector(384)');
  });

  it('assertSchemaVersion throws when schema is uninitialized and prints exact command (§19)', async () => {
    const mockClient = {
      query: async () => ({ rows: [] }),
    };

    await expect(assertSchemaVersion(mockClient)).rejects.toThrow(
      "Database schema version mismatch or uninitialized. Expected '0.1.0', found 'none'. Refusing to start. Run 'pnpm --filter @living-portfolio/db migrate' to apply pending migrations."
    );
  });

  it('assertSchemaVersion throws when schema version is mismatched (§19)', async () => {
    const mockClient = {
      query: async () => ({ rows: [{ qrxp_schema_version: '0.0.9' }] }),
    };

    await expect(assertSchemaVersion(mockClient)).rejects.toThrow(
      "Database schema version mismatch or uninitialized. Expected '0.1.0', found '0.0.9'. Refusing to start. Run 'pnpm --filter @living-portfolio/db migrate' to apply pending migrations."
    );
  });

  it('assertSchemaVersion succeeds when schema version matches expected version', async () => {
    const mockClient = {
      query: async () => ({ rows: [{ qrxp_schema_version: '0.1.0' }] }),
    };

    await expect(assertSchemaVersion(mockClient)).resolves.toBeUndefined();
  });

  it('getSchemaVersion returns null when schema_info table does not exist (42P01)', async () => {
    const mockClient = {
      query: async () => {
        const error: any = new Error('relation "schema_info" does not exist');
        error.code = '42P01';
        throw error;
      },
    };

    const version = await getSchemaVersion(mockClient);
    expect(version).toBeNull();
  });

  it('createDbPool creates pool instance with configured defaults', () => {
    const pool = createDbPool({ max: 5 });
    expect(pool).toBeDefined();
    expect(pool.totalCount).toBe(0);
    pool.end().catch(() => {});
  });

  it('checkDbHealth returns ok=false on unreachable database without crashing', async () => {
    const health = await checkDbHealth('postgresql://nonexistent_user:invalid_pass@127.0.0.1:59999/dummy_db');
    expect(health.ok).toBe(false);
    expect(health.error).toBeDefined();
  });
});

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

describe.skipIf(!isDatabaseConfigured)(
  'Postgres + pgvector Live Integration Suite (CI Service Container, Fix 7, Fix 10, OSR-15)',
  () => {
    let pool: ReturnType<typeof createDbPool>;
    let db: ReturnType<typeof createDrizzleDb>;

    beforeAll(() => {
      pool = createDbPool();
      db = createDrizzleDb(pool);
    });

    afterAll(async () => {
      if (pool) {
        await closeDbPool(pool);
      }
    });

    it('connects to live Postgres service and passes health check', async () => {
      const health = await checkDbHealth(pool);
      expect(health.ok).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('runs migrations, enables pgvector, and sets QRXP schema version', async () => {
      const result = await runMigrations(pool);
      expect(result.applied).toContain('0001_init');
      expect(result.currentVersion).toBe(QRXP_SCHEMA_VERSION);

      // Verify pgvector extension
      const extRes = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector';");
      expect(extRes.rows.length).toBe(1);
      expect(extRes.rows[0].extname).toBe('vector');

      // Verify schema_info table contains QRXP_SCHEMA_VERSION
      const version = await getSchemaVersion(pool);
      expect(version).toBe(QRXP_SCHEMA_VERSION);

      // Verify boot check passes
      await expect(assertSchemaVersion(pool)).resolves.toBeUndefined();
    });

    it('executes migrations idempotently without errors', async () => {
      const secondRun = await runMigrations(pool);
      expect(secondRun.applied).toContain('0001_init');
      expect(secondRun.currentVersion).toBe(QRXP_SCHEMA_VERSION);
    });

    it('performs Drizzle ORM operations including 384-dimensional vector embedding storage', async () => {
      const testSlug = `ci-test-entry-${Date.now()}`;

      // 1. Create Venture
      const [venture] = await db
        .insert(ventures)
        .values({
          name: 'CI Integration Venture',
          status: 'building',
          facets: { domain: 'systems' },
        })
        .returning();
      expect(venture.id).toBeDefined();

      // 2. Create Entry
      const [entry] = await db
        .insert(entries)
        .values({
          slug: testSlug,
          title: 'CI Test Entry',
          profile: 'case-study',
          view: 'article',
          visibility: 'private',
          venture_id: venture.id,
        })
        .returning();
      expect(entry.slug).toBe(testSlug);

      // 3. Create Entry Revision
      const [revision] = await db
        .insert(entryRevisions)
        .values({
          entry_id: entry.id,
          body_md: '# Postgres Scaffolding Test\n\nTesting persistence.',
          body_hash: 'test-hash-1234',
        })
        .returning();
      expect(revision.id).toBeDefined();

      // 4. Create Span
      const [span] = await db
        .insert(spans)
        .values({
          revision_id: revision.id,
          ordinal: 0,
          start_off: 0,
          end_off: 30,
          text_exact: 'Postgres Scaffolding Test',
          token_count: 3,
        })
        .returning();
      expect(span.id).toBeDefined();

      // 5. Create Embedding Set
      const [embSet] = await db
        .insert(embeddingSets)
        .values({
          model_id: 'bge-small-en-v1.5',
          model_version: '1.0',
          dim: 384,
          status: 'active',
        })
        .returning();
      expect(embSet.id).toBeDefined();

      // 6. Create Chunk Vector with 384 floats
      const vectorData = new Array(384).fill(0).map((_, i) => Number((Math.sin(i) * 0.1).toFixed(4)));
      const [chunkVec] = await db
        .insert(chunkVectors)
        .values({
          chunk_id: span.id,
          embedding_set_id: embSet.id,
          vector: vectorData,
          text_snippet: 'Postgres Scaffolding Test',
        })
        .returning();
      expect(chunkVec.id).toBeDefined();
      expect(chunkVec.vector.length).toBe(384);

      // 7. Cleanup
      await db.delete(entries).where(eq(entries.id, entry.id));
      await db.delete(ventures).where(eq(ventures.id, venture.id));
      await db.delete(embeddingSets).where(eq(embeddingSets.id, embSet.id));
    });
  }
);
