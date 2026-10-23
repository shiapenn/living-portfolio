/**
 * Dual-Write Verification Harness & Shadow Parity Test Suite (Fix 8, Fix 10, OSR-15)
 *
 * Verifies:
 * 1. Synchronous dual-write replication across all entity types with preserved primary IDs.
 * 2. Concurrent shadow read parity comparison, latency recording, and operational metrics.
 * 3. Shadow fault tolerance (shadow failures do not disrupt primary user operations).
 * 4. Mismatch tracking, ring-buffer event capture, and strictParity enforcement.
 * 5. Live PostgreSQL 16 + pgvector dual-write verification in CI service container.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  InMemoryPortfolioRepository,
  PostgresPortfolioRepository,
  DualWritePortfolioRepository,
  ParityMismatchError,
  compareResults,
  createDbPool,
  closeDbPool,
  runMigrations,
} from './index.js';

describe('DualWritePortfolioRepository Unit & Parity Verification (Fix 8, Fix 10)', () => {
  let primary: InMemoryPortfolioRepository;
  let shadow: InMemoryPortfolioRepository;
  let dualRepo: DualWritePortfolioRepository;

  beforeEach(() => {
    primary = new InMemoryPortfolioRepository();
    shadow = new InMemoryPortfolioRepository();
    dualRepo = new DualWritePortfolioRepository({
      primary,
      shadow,
      shadowWrites: true,
      shadowReads: true,
      recordMetrics: true,
    });
  });

  it('replicates venture creation and preserves primary ID in shadow', async () => {
    const venture = await dualRepo.createVenture({
      name: 'Dual Write Venture',
      status: 'active',
      facets: { domain: 'systems' },
    });

    expect(venture.id).toBeDefined();

    // Verify presence in primary and shadow with exact same ID
    const pV = await primary.getVenture(venture.id);
    const sV = await shadow.getVenture(venture.id);
    expect(pV).toEqual(venture);
    expect(sV).toEqual(venture);

    // Verify dualRepo read records match in metrics
    const readV = await dualRepo.getVenture(venture.id);
    expect(readV).toEqual(venture);

    const metrics = dualRepo.getShadowMetrics();
    expect(metrics.totalMatches).toBeGreaterThan(0);
    expect(metrics.totalMismatches).toBe(0);
    expect(metrics.health).toBe('HEALTHY');
  });

  it('replicates entries, revisions, spans, annotations, and claims end to end', async () => {
    // 1. Entry & Revision
    const { entry, revision } = await dualRepo.createEntry(
      {
        slug: 'dual-test-entry',
        title: 'Dual Test Entry',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
      },
      {
        body_md: '# Test\n\nDual write body content.',
        body_hash: 'hash-dual-001',
        valid_from: '2026-01-01T00:00:00.000Z',
      }
    );

    expect(entry.id).toBeDefined();
    expect(revision.id).toBeDefined();

    // Verify shadow entry has identical ID and revision ID
    const sEntry = await shadow.getEntry(entry.id);
    expect(sEntry?.entry.id).toBe(entry.id);
    expect(sEntry?.currentRevision?.id).toBe(revision.id);

    // 2. Spans
    const spans = await dualRepo.saveSpans([
      {
        revision_id: revision.id,
        ordinal: 0,
        start_off: 0,
        end_off: 6,
        text_exact: '# Test',
        token_count: 2,
      },
    ]);
    expect(spans[0].id).toBeDefined();

    const sSpans = await shadow.getSpans(revision.id);
    expect(sSpans.length).toBe(1);
    expect(sSpans[0].id).toBe(spans[0].id);

    // 3. Annotations
    const annotation = await dualRepo.saveAnnotation({
      span_id: spans[0].id,
      role: 'evidence',
      profile: 'technical',
      source: 'owner',
      status: 'accepted',
      confidence: 1.0,
    });
    expect(annotation.id).toBeDefined();

    const sAnn = await shadow.getAnnotations(spans[0].id);
    expect(sAnn.length).toBe(1);
    expect(sAnn[0].id).toBe(annotation.id);

    // 4. Claims
    const claim = await dualRepo.saveClaim({
      revision_id: revision.id,
      text: 'Dual-write operates with zero parity drift.',
      kind: 'achievement',
      source_span_id: spans[0].id,
      source: 'owner',
      status: 'accepted',
    });
    expect(claim.id).toBeDefined();

    const sClaims = await shadow.getClaimsForRevision(revision.id);
    expect(sClaims.length).toBe(1);
    expect(sClaims[0].id).toBe(claim.id);

    // 5. Chunk Vectors
    const chunkVectors = await dualRepo.saveChunkVectors([
      {
        chunk_id: spans[0].id,
        vector: [0.1, 0.2, 0.3],
        text_snippet: '# Test',
      },
    ]);
    expect(chunkVectors.length).toBe(1);

    const sVectors = await shadow.getChunkVectors(spans[0].id);
    expect(sVectors.length).toBe(1);
    expect(sVectors[0].vector).toEqual([0.1, 0.2, 0.3]);

    // 6. Verify Read Parity
    const readEntry = await dualRepo.getEntryBySlug('dual-test-entry');
    expect(readEntry?.entry.id).toBe(entry.id);

    const parity = await dualRepo.verifyParity();
    expect(parity.isParityClean).toBe(true);
    expect(parity.mismatches.length).toBe(0);
    expect(parity.metrics.totalMismatches).toBe(0);
  });

  it('detects shadow divergence and records mismatch details without breaking primary traffic', async () => {
    const { entry } = await dualRepo.createEntry(
      {
        slug: 'divergence-test',
        title: 'Original Title',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
      },
      {
        body_md: 'Content',
        body_hash: 'hash-div',
      }
    );

    // Manually mutate shadow to simulate divergence
    await shadow.updateEntry(entry.id, { title: 'Divergent Modified Shadow Title' });

    // Primary read should return original title without throwing
    const fetched = await dualRepo.getEntryBySlug('divergence-test');
    expect(fetched?.entry.title).toBe('Original Title');

    // Metrics should record mismatch and health as DRIFT_DETECTED
    const metrics = dualRepo.getShadowMetrics();
    expect(metrics.totalMismatches).toBeGreaterThan(0);
    expect(metrics.health).toBe('DRIFT_DETECTED');
    expect(metrics.recentMismatches.length).toBeGreaterThan(0);
    expect(metrics.recentMismatches[0].diffReason).toContain('Original Title');
  });

  it('throws ParityMismatchError when strictParity is enabled and divergence occurs', async () => {
    const strictDualRepo = new DualWritePortfolioRepository({
      primary,
      shadow,
      strictParity: true,
    });

    const { entry } = await strictDualRepo.createEntry(
      {
        slug: 'strict-parity-test',
        title: 'Strict Parity',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
      },
      {
        body_md: 'Strict content',
        body_hash: 'hash-strict',
      }
    );

    // Mutate shadow
    await shadow.updateEntry(entry.id, { title: 'Shadow Divergence' });

    await expect(strictDualRepo.getEntryBySlug('strict-parity-test')).rejects.toThrow(
      ParityMismatchError
    );
  });

  it('gracefully handles shadow errors without disrupting primary operations', async () => {
    const failingShadow = new InMemoryPortfolioRepository();
    failingShadow.createEntry = async () => {
      throw new Error('Shadow database connection timeout');
    };

    const resilientRepo = new DualWritePortfolioRepository({
      primary,
      shadow: failingShadow,
      strictParity: false,
    });

    // Primary write succeeds despite shadow throwing
    const res = await resilientRepo.createEntry(
      {
        slug: 'fault-tolerant-test',
        title: 'Fault Tolerant',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
      },
      {
        body_md: 'Fault tolerant body',
        body_hash: 'hash-ft',
      }
    );

    expect(res.entry.id).toBeDefined();

    const metrics = resilientRepo.getShadowMetrics();
    expect(metrics.totalShadowErrors).toBe(1);
    expect(metrics.health).toBe('DEGRADED');
  });

  it('resets shadow metrics when resetShadowMetrics is invoked', async () => {
    await dualRepo.createVenture({ name: 'Reset Test', status: 'building' });
    expect(dualRepo.getShadowMetrics().totalCalls).toBeGreaterThan(0);

    dualRepo.resetShadowMetrics();
    const clean = dualRepo.getShadowMetrics();
    expect(clean.totalCalls).toBe(0);
    expect(clean.totalMatches).toBe(0);
    expect(clean.totalMismatches).toBe(0);
    expect(clean.recentMismatches.length).toBe(0);
    expect(clean.health).toBe('HEALTHY');
  });
});

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

describe.skipIf(!isDatabaseConfigured)(
  'Postgres Live Dual-Write Integration Suite (CI Service Container, Fix 8, Fix 10, OSR-15)',
  () => {
    let pool: ReturnType<typeof createDbPool>;
    let primary: InMemoryPortfolioRepository;
    let postgresRepo: PostgresPortfolioRepository;
    let dualRepo: DualWritePortfolioRepository;

    beforeAll(async () => {
      pool = createDbPool();
      await runMigrations(pool);
      primary = new InMemoryPortfolioRepository();
      postgresRepo = new PostgresPortfolioRepository();
      dualRepo = new DualWritePortfolioRepository({
        primary,
        shadow: postgresRepo,
        shadowWrites: true,
        shadowReads: true,
        recordMetrics: true,
      });
    });

    afterAll(async () => {
      if (pool) {
        await closeDbPool(pool);
      }
    });

    it('dual-writes from InMemory to live PostgreSQL and verifies bit-for-bit parity across engines', async () => {
      const slug = `live-dual-${Date.now()}`;

      // 1. Dual-write venture
      const venture = await dualRepo.createVenture({
        name: 'Live Dual Venture',
        status: 'active',
      });
      expect(venture.id).toBeDefined();

      // 2. Dual-write entry & revision
      const { entry, revision } = await dualRepo.createEntry(
        {
          slug,
          title: 'Live Dual Entry Title',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
          venture_id: venture.id,
        },
        {
          body_md: '# Live Dual Testing\n\nAsserting persistence fidelity.',
          body_hash: 'hash-live-dual',
        }
      );
      expect(entry.id).toBeDefined();
      expect(revision.id).toBeDefined();

      // 3. Dual-write span & annotation
      const [span] = await dualRepo.saveSpans([
        {
          revision_id: revision.id,
          ordinal: 0,
          start_off: 0,
          end_off: 18,
          text_exact: '# Live Dual Testing',
          token_count: 3,
        },
      ]);
      expect(span.id).toBeDefined();

      const annotation = await dualRepo.saveAnnotation({
        span_id: span.id,
        role: 'evidence',
        profile: 'technical',
        source: 'owner',
        status: 'accepted',
        confidence: 0.95,
      });
      expect(annotation.id).toBeDefined();

      // 4. Dual-write claim
      const claim = await dualRepo.saveClaim({
        revision_id: revision.id,
        text: 'Live dual-write to PostgreSQL 16 container succeeds.',
        kind: 'achievement',
        source_span_id: span.id,
        source: 'owner',
        status: 'accepted',
      });
      expect(claim.id).toBeDefined();

      // 5. Dual-read and verify zero drift
      const readEntry = await dualRepo.getEntryBySlug(slug);
      expect(readEntry?.entry.id).toBe(entry.id);
      expect(readEntry?.entry.slug).toBe(slug);

      const readSpans = await dualRepo.getSpans(revision.id);
      expect(readSpans.length).toBe(1);
      expect(readSpans[0].id).toBe(span.id);

      const readClaims = await dualRepo.getClaimsForRevision(revision.id);
      expect(readClaims.length).toBe(1);
      expect(readClaims[0].id).toBe(claim.id);

      // Verify parity check
      const parity = await dualRepo.verifyParity();
      expect(parity.isParityClean).toBe(true);
      expect(parity.mismatches.length).toBe(0);

      const metrics = dualRepo.getShadowMetrics();
      expect(metrics.totalMismatches).toBe(0);
      expect(metrics.totalShadowErrors).toBe(0);
      expect(metrics.health).toBe('HEALTHY');

      // Cleanup
      await dualRepo.deleteEntry(entry.id);
    });
  }
);
