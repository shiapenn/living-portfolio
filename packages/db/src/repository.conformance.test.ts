/**
 * Repository Conformance Contract Test Suite (OSR-14, Fix 7, Fix 10)
 *
 * Verifies that both InMemoryPortfolioRepository and PostgresPortfolioRepository
 * strictly conform to the IPortfolioRepository interface across all domains:
 * - Ventures CRUD
 * - Entries and Revisions lifecycle (cascading delete, temporal stamps)
 * - Spans and Annotations
 * - Facets
 * - Claims, Relations, and Accepted Relation joins
 * - Evidence and Media Assets
 * - Operational Entities (Escalations, CorrectionLog, CalibrationChanges, ScopedConstraints)
 * - Hybrid Search (visibility filtering, keyword matching, temporal filtering)
 * - Temporal Graph Expansion (temporalExpand across relations as of t_q)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { IPortfolioRepository } from './repository.js';
import { InMemoryPortfolioRepository } from './repository.js';
import { PostgresPortfolioRepository } from './postgres-repository.js';
import { createDbPool, closeDbPool, createDrizzleDb } from './connection.js';
import { runMigrations } from './migrate.js';

export function defineRepositoryConformanceTests(
  name: string,
  setupRepo: () => Promise<IPortfolioRepository> | IPortfolioRepository,
  teardownRepo?: () => Promise<void> | void
) {
  describe(`IPortfolioRepository Conformance Suite (${name})`, () => {
    let repo: IPortfolioRepository;

    beforeAll(async () => {
      repo = await setupRepo();
    });

    afterAll(async () => {
      if (teardownRepo) {
        await teardownRepo();
      }
    });

    // --- Ventures ---
    it('creates, retrieves, and lists ventures', async () => {
      const created = await repo.createVenture({
        name: `${name} Venture Alpha`,
        status: 'building',
        links: [{ label: 'Source', url: 'https://example.com' }],
        facets: { domain: 'systems' },
      });
      expect(created.id).toBeDefined();
      expect(created.name).toBe(`${name} Venture Alpha`);
      expect(created.status).toBe('building');

      const fetched = await repo.getVenture(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe(`${name} Venture Alpha`);

      const all = await repo.listVentures();
      expect(all.some((v) => v.id === created.id)).toBe(true);
    });

    // --- Entries & Revisions ---
    it('manages entry and revision lifecycle with current_revision pointer and visibility filters', async () => {
      const slug = `entry-${name.toLowerCase()}-${Date.now()}`;
      const { entry, revision } = await repo.createEntry(
        {
          slug,
          title: 'Conforming Entry',
          profile: 'case-study',
          view: 'article',
          visibility: 'private',
        },
        {
          body_md: '# Conformance Title\n\nBody content.',
          body_hash: 'hash-conformance-1',
          temporal_level: 'exact',
          valid_from: '2024-01-01T00:00:00.000Z',
        }
      );

      expect(entry.id).toBeDefined();
      expect(entry.slug).toBe(slug);
      expect(entry.visibility).toBe('private');
      expect(entry.current_revision_id).toBe(revision.id);
      expect(revision.entry_id).toBe(entry.id);
      expect(revision.body_md).toContain('Conformance Title');

      // Visibility filter on getEntryBySlug
      const publicFetch = await repo.getEntryBySlug(slug, ['public']);
      expect(publicFetch).toBeNull();

      const privateFetch = await repo.getEntryBySlug(slug, ['public', 'private']);
      expect(privateFetch).not.toBeNull();
      expect(privateFetch?.entry.id).toBe(entry.id);
      expect(privateFetch?.currentRevision?.id).toBe(revision.id);

      // getEntry by ID
      const byId = await repo.getEntry(entry.id);
      expect(byId?.entry.slug).toBe(slug);

      // Update entry visibility to public
      const updated = await repo.updateEntry(entry.id, { visibility: 'public', title: 'Public Conformance Entry' });
      expect(updated?.visibility).toBe('public');
      expect(updated?.title).toBe('Public Conformance Entry');

      const publicFetchAfter = await repo.getEntryBySlug(slug, ['public']);
      expect(publicFetchAfter).not.toBeNull();
      expect(publicFetchAfter?.entry.title).toBe('Public Conformance Entry');

      // Create a second revision
      const rev2 = await repo.createRevision(entry.id, {
        body_md: '# Updated Conformance Title\n\nRevision 2.',
        body_hash: 'hash-conformance-2',
        temporal_level: 'exact',
      });
      expect(rev2.id).not.toBe(revision.id);
      expect(rev2.entry_id).toBe(entry.id);

      // Verify current_revision_id moved
      const afterRev2 = await repo.getEntry(entry.id);
      expect(afterRev2?.entry.current_revision_id).toBe(rev2.id);

      const allRevs = await repo.getRevisions(entry.id);
      expect(allRevs.length).toBeGreaterThanOrEqual(2);
      expect(allRevs.some((r) => r.id === rev2.id)).toBe(true);
      expect(allRevs.some((r) => r.id === revision.id)).toBe(true);
    });

    // --- Spans & Annotations ---
    it('saves and queries spans and annotations for a revision', async () => {
      const slug = `spans-${name.toLowerCase()}-${Date.now()}`;
      const { revision } = await repo.createEntry(
        { slug, title: 'Span Test', visibility: 'public' },
        { body_md: 'Text span for testing.', body_hash: 'h-span' }
      );

      const savedSpans = await repo.saveSpans([
        {
          revision_id: revision.id,
          ordinal: 0,
          start_off: 0,
          end_off: 9,
          text_exact: 'Text span',
          token_count: 2,
        },
        {
          revision_id: revision.id,
          ordinal: 1,
          start_off: 10,
          end_off: 22,
          text_exact: 'for testing.',
          token_count: 2,
        },
      ]);
      expect(savedSpans.length).toBe(2);
      expect(savedSpans[0].id).toBeDefined();

      const retrievedSpans = await repo.getSpans(revision.id);
      expect(retrievedSpans.length).toBe(2);
      expect(retrievedSpans[0].text_exact).toBe('Text span');

      // Save Annotation on first span
      const annotation = await repo.saveAnnotation({
        span_id: savedSpans[0].id,
        role: 'architecture',
        profile: 'case-study',
        source: 'owner',
        status: 'accepted',
        confidence: 0.95,
      });
      expect(annotation.id).toBeDefined();
      expect(annotation.status).toBe('accepted');

      const spanAnns = await repo.getAnnotations(savedSpans[0].id);
      expect(spanAnns.length).toBe(1);
      expect(spanAnns[0].role).toBe('architecture');

      const revAnns = await repo.listAnnotationsForRevision(revision.id);
      expect(revAnns.some((a) => a.id === annotation.id)).toBe(true);

      // Update annotation status
      const updatedAnn = await repo.updateAnnotation(annotation.id, { status: 'rejected' });
      expect(updatedAnn?.status).toBe('rejected');
    });

    // --- Facets ---
    it('saves and retrieves facets per entry', async () => {
      const slug = `facet-${name.toLowerCase()}-${Date.now()}`;
      const { entry, revision } = await repo.createEntry(
        { slug, title: 'Facet Test', visibility: 'public' },
        { body_md: 'Content with facets.', body_hash: 'h-facet' }
      );

      const facet = await repo.saveFacet({
        entry_id: entry.id,
        revision_id: revision.id,
        key: 'stack',
        value: 'TypeScript',
        source: 'owner',
        status: 'confirmed',
        confidence: 1.0,
      });
      expect(facet.id).toBeDefined();

      const facets = await repo.getFacetsForEntry(entry.id);
      expect(facets.length).toBe(1);
      expect(facets[0].key).toBe('stack');
      expect(facets[0].value).toBe('TypeScript');

      const updatedFacet = await repo.updateFacet(facet.id, { status: 'rejected' });
      expect(updatedFacet?.status).toBe('rejected');
    });

    // --- Claims, Relations & Accepted Relations ---
    it('records claims, relations, and enriches accepted relations with destination details', async () => {
      const slug1 = `claim1-${name.toLowerCase()}-${Date.now()}`;
      const slug2 = `claim2-${name.toLowerCase()}-${Date.now()}`;
      const { revision: rev1 } = await repo.createEntry(
        { slug: slug1, title: 'Claim Entry 1', visibility: 'public' },
        { body_md: 'First claim body.', body_hash: 'h-c1' }
      );
      const { revision: rev2 } = await repo.createEntry(
        { slug: slug2, title: 'Claim Entry 2', visibility: 'public' },
        { body_md: 'Second claim body.', body_hash: 'h-c2' }
      );

      const claim1 = await repo.saveClaim({
        revision_id: rev1.id,
        text: 'Claim 1 text statement.',
        kind: 'outcome',
        outcome_status: 'worked',
        source: 'owner',
        status: 'accepted',
      });
      const claim2 = await repo.saveClaim({
        revision_id: rev2.id,
        text: 'Claim 2 refined statement.',
        kind: 'finding',
        source: 'owner',
        status: 'accepted',
      });

      expect(claim1.id).toBeDefined();
      expect(claim2.id).toBeDefined();

      const rev1Claims = await repo.getClaimsForRevision(rev1.id);
      expect(rev1Claims.some((c) => c.id === claim1.id)).toBe(true);

      const relation = await repo.saveRelation({
        src_claim: claim1.id,
        dst_claim: claim2.id,
        type: 'refines',
        status: 'accepted',
      });
      expect(relation.id).toBeDefined();

      const forClaim1 = await repo.getRelationsForClaim(claim1.id);
      expect(forClaim1.some((r) => r.id === relation.id)).toBe(true);

      const accepted = await repo.listAcceptedRelations();
      const targetRel = accepted.find((r) => r.id === relation.id);
      expect(targetRel).toBeDefined();
      expect(targetRel?.dst_claim_text).toBe('Claim 2 refined statement.');
      expect(targetRel?.dst_entry_slug).toBe(slug2);
      expect(targetRel?.dst_entry_title).toBe('Claim Entry 2');
    });

    // --- Evidence & Media ---
    it('manages evidence and media asset storage', async () => {
      const slug = `ev-${name.toLowerCase()}-${Date.now()}`;
      const { entry } = await repo.createEntry(
        { slug, title: 'Evidence Test', visibility: 'public' },
        { body_md: 'Evidence content.', body_hash: 'h-ev' }
      );

      const ev = await repo.saveEvidence({
        entry_id: entry.id,
        kind: 'url',
        url: 'https://github.com/shiapenn/living-portfolio',
        verification: { verified: true },
        verified_at: '2026-01-01T00:00:00.000Z',
      });
      expect(ev.id).toBeDefined();

      const listEv = await repo.getEvidenceForEntry(entry.id);
      expect(listEv.some((e) => e.id === ev.id)).toBe(true);

      const media = await repo.saveMedia({
        entry_id: entry.id,
        mime_type: 'image/png',
        uri: '/media/arch-diagram.png',
        alt_text: 'Architecture diagram',
      });
      expect(media.id).toBeDefined();

      const fetchedMedia = await repo.getMedia(media.id);
      expect(fetchedMedia?.uri).toBe('/media/arch-diagram.png');
    });

    // --- Operational Entities ---
    it('records escalations, corrections, calibration changes, and scoped constraints', async () => {
      // Escalation
      const esc = await repo.saveEscalation({
        question: 'How do you handle zero downtime database migrations?',
        query_class: 'architecture',
        facets: { database: 'PostgreSQL' },
        status: 'pending',
      });
      expect(esc.id).toBeDefined();
      const updatedEsc = await repo.updateEscalation(esc.id, { status: 'approved', final: 'Answer text.' });
      expect(updatedEsc.status).toBe('approved');
      const allEsc = await repo.getEscalations('approved');
      expect(allEsc.some((e) => e.id === esc.id)).toBe(true);

      // Correction log
      const corr = await repo.saveCorrection({
        kind: 'facet',
        role: 'architecture',
        domain: 'systems',
        owner_action: 'accept',
        edit_distance: 0,
      });
      expect(corr.id).toBeDefined();
      const corrList = await repo.getCorrectionLogs('facet');
      expect(corrList.some((c) => c.id === corr.id)).toBe(true);

      // Calibration change
      const calib = await repo.saveCalibrationChange({
        parameter: 'tier1_threshold',
        old_value: 0.75,
        new_value: 0.82,
        evidence_count: 14,
        applied_by: 'owner',
        reversible: true,
      });
      expect(calib.id).toBeDefined();
      const allCalib = await repo.getCalibrationChanges();
      expect(allCalib.some((c) => c.id === calib.id)).toBe(true);

      // Scoped constraint
      const sc = await repo.saveScopedConstraint({
        constraint: { max_latency_ms: 100 },
        scope: { environment: 'production' },
        status: 'confirmed',
      });
      expect(sc.id).toBeDefined();
      const scList = await repo.getScopedConstraints('confirmed');
      expect(scList.some((s) => s.id === sc.id)).toBe(true);
    });

    // --- Hybrid Search (§10.4) ---
    it('executes hybridSearch with visibility filtering and temporal traversal', async () => {
      const publicSlug = `search-pub-${name.toLowerCase()}-${Date.now()}`;
      const privateSlug = `search-priv-${name.toLowerCase()}-${Date.now()}`;

      const { revision: pubRev } = await repo.createEntry(
        { slug: publicSlug, title: 'Public Monolith Retrospective', visibility: 'public' },
        { body_md: 'PostgreSQL advisory locks for job queueing.', body_hash: 'h-s1', valid_from: '2022-01-01T00:00:00.000Z' }
      );
      const { revision: privRev } = await repo.createEntry(
        { slug: privateSlug, title: 'Confidential Aurora Notes', visibility: 'private' },
        { body_md: 'Aurora proprietary architecture design.', body_hash: 'h-s2' }
      );

      await repo.saveSpans([
        {
          revision_id: pubRev.id,
          ordinal: 0,
          start_off: 0,
          end_off: 43,
          text_exact: 'PostgreSQL advisory locks for job queueing.',
          token_count: 6,
        },
      ]);
      await repo.saveSpans([
        {
          revision_id: privRev.id,
          ordinal: 0,
          start_off: 0,
          end_off: 41,
          text_exact: 'Aurora proprietary architecture design.',
          token_count: 4,
        },
      ]);

      // Public search should find public entry and exclude private entry
      const pubResults = await repo.hybridSearch('PostgreSQL advisory locks', {
        visibility: ['public'],
      });
      expect(pubResults.length).toBeGreaterThan(0);
      expect(pubResults[0].entry.slug).toBe(publicSlug);

      const privResults = await repo.hybridSearch('Aurora proprietary', {
        visibility: ['public'],
      });
      expect(privResults.length).toBe(0);

      // Authorized search with private visibility finds private entry
      const privAuthorized = await repo.hybridSearch('Aurora proprietary', {
        visibility: ['public', 'private'],
      });
      expect(privAuthorized.length).toBeGreaterThan(0);
      expect(privAuthorized[0].entry.slug).toBe(privateSlug);
    });

    // --- Cascading Delete ---
    it('deletes an entry and cascades across revisions, spans, and claims', async () => {
      const slug = `delete-${name.toLowerCase()}-${Date.now()}`;
      const { entry, revision } = await repo.createEntry(
        { slug, title: 'Delete Test', visibility: 'public' },
        { body_md: 'Entry to be deleted.', body_hash: 'h-del' }
      );

      await repo.saveSpans([
        { revision_id: revision.id, ordinal: 0, start_off: 0, end_off: 10, text_exact: 'Entry to be', token_count: 3 },
      ]);
      await repo.saveClaim({
        revision_id: revision.id,
        text: 'Claim will be deleted.',
        kind: 'fact',
        source: 'owner',
        status: 'accepted',
      });
      await repo.saveFacet({
        entry_id: entry.id,
        key: 'toBeDeleted',
        value: 'yes',
        source: 'owner',
        status: 'confirmed',
      });

      const delResult = await repo.deleteEntry(entry.id);
      expect(delResult.deletedRevisions).toBeGreaterThanOrEqual(1);

      const afterDelete = await repo.getEntry(entry.id);
      expect(afterDelete).toBeNull();
      const revsAfter = await repo.getRevisions(entry.id);
      expect(revsAfter.length).toBe(0);
      const spansAfter = await repo.getSpans(revision.id);
      expect(spansAfter.length).toBe(0);
      const claimsAfter = await repo.getClaimsForRevision(revision.id);
      expect(claimsAfter.length).toBe(0);
      const facetsAfter = await repo.getFacetsForEntry(entry.id);
      expect(facetsAfter.length).toBe(0);
    });

    // --- Vector Embeddings Storage (§8, Fix 8, P3) ---
    it('saves, queries, and retrieves chunk vectors per revision and span (§8, Fix 8, P3)', async () => {
      const slug = `vector-${name.toLowerCase()}-${Date.now()}`;
      const { entry, revision } = await repo.createEntry(
        { slug, title: 'Vector Test', visibility: 'public' },
        { body_md: 'Vector embedding conformance testing.', body_hash: 'h-vec' }
      );

      const [span] = await repo.saveSpans([
        { revision_id: revision.id, ordinal: 0, start_off: 0, end_off: 30, text_exact: 'Vector embedding conformance', token_count: 3 },
      ]);

      const testVector = new Array(384).fill(0).map((_, i) => Number((Math.sin(i) * 0.1).toFixed(4)));

      const [savedVec] = await repo.saveChunkVectors([
        {
          chunk_id: span.id,
          vector: testVector,
          text_snippet: span.text_exact,
          model_id: 'local-onnx/bge-small-en-v1.5',
          model_version: '1.5.0',
          dim: 384,
        },
      ]);

      expect(savedVec.id).toBeDefined();
      expect(savedVec.chunk_id).toBe(span.id);
      expect(savedVec.vector.length).toBe(384);

      // Query by chunk
      const byChunk = await repo.getChunkVectors(span.id);
      expect(byChunk.length).toBe(1);
      expect(byChunk[0].id).toBe(savedVec.id);

      // Query by revision
      const byRev = await repo.getChunkVectorsForRevision(revision.id);
      expect(byRev.length).toBe(1);
      expect(byRev[0].id).toBe(savedVec.id);

      // Cleanup
      await repo.deleteEntry(entry.id);
    });

    // --- Temporal Bisimulation (§10.4, Fix 1, OSR-14) ---
    it('preserves strict temporal bisimulation and hindsight exclusion across engines (§10.4, Fix 1, OSR-14)', async () => {
      const slug = `temporal-${name.toLowerCase()}-${Date.now()}`;
      const { entry, revision: rev1 } = await repo.createEntry(
        { slug, title: 'Temporal Bisimulation Entry', visibility: 'public' },
        {
          body_md: 'Historical revision 1 content.',
          body_hash: 'h-temp-1',
          written_at: '2024-01-01T00:00:00.000Z',
          valid_from: '2024-01-01T00:00:00.000Z',
          valid_to: '2024-06-01T00:00:00.000Z',
          temporal_level: 'exact',
          is_hindsight: false,
        }
      );

      await repo.saveSpans([
        { revision_id: rev1.id, ordinal: 0, start_off: 0, end_off: 30, text_exact: 'Historical revision 1 content.', token_count: 4 },
      ]);

      const claimA = await repo.saveClaim({
        revision_id: rev1.id,
        text: 'Claim established in early 2024.',
        kind: 'fact',
        source: 'owner',
        status: 'accepted',
        valid_from: '2024-01-01T00:00:00.000Z',
        is_hindsight: false,
      });

      // Create future hindsight revision
      const rev2 = await repo.createRevision(entry.id, {
        body_md: 'Hindsight revision 2 content looking back.',
        body_hash: 'h-temp-2',
        written_at: '2025-01-01T00:00:00.000Z',
        valid_from: '2025-01-01T00:00:00.000Z',
        valid_to: null,
        temporal_level: 'exact',
        is_hindsight: true,
      });

      await repo.saveSpans([
        { revision_id: rev2.id, ordinal: 0, start_off: 0, end_off: 40, text_exact: 'Hindsight revision 2 content looking back.', token_count: 6 },
      ]);

      const claimB = await repo.saveClaim({
        revision_id: rev2.id,
        text: 'Hindsight realization recorded in 2025.',
        kind: 'lesson',
        source: 'owner',
        status: 'accepted',
        valid_from: '2025-01-01T00:00:00.000Z',
        is_hindsight: true,
      });

      await repo.saveRelation({
        src_claim: claimA.id,
        dst_claim: claimB.id,
        type: 'supersedes',
        status: 'accepted',
        valid_from: '2025-01-01T00:00:00.000Z',
      });

      // Query as of 2024-03-01 -> only historical Claim A is valid; future hindsight Claim B is excluded
      const expanded2024 = await repo.temporalExpand({
        seed_claim_ids: [claimA.id],
        t_q: new Date('2024-03-01T00:00:00.000Z'),
        max_hops: 2,
      });

      expect(expanded2024.map((c) => c.id)).toContain(claimA.id);
      expect(expanded2024.map((c) => c.id)).not.toContain(claimB.id);

      // Search as of 2024-03-01 -> matches Rev 1, excludes future Rev 2
      const search2024 = await repo.hybridSearch('content', {
        visibility: ['public'],
        as_of_date: new Date('2024-03-01T00:00:00.000Z'),
      });
      const matching = search2024.filter((r) => r.entry.id === entry.id);
      expect(matching.length).toBeGreaterThan(0);
      expect(matching[0].revision.id).toBe(rev1.id);

      // Cleanup
      await repo.deleteEntry(entry.id);
    });
  });
}

// 1. Conformance Suite: InMemoryPortfolioRepository (Runs in all environments)
defineRepositoryConformanceTests('InMemoryPortfolioRepository', () => {
  return new InMemoryPortfolioRepository();
});

// 2. Conformance Suite: PostgresPortfolioRepository (Runs in CI service container / with DATABASE_URL)
const isPostgresConfigured = Boolean(process.env.DATABASE_URL);

if (isPostgresConfigured) {
  let pool: ReturnType<typeof createDbPool>;
  let pgRepo: PostgresPortfolioRepository;

  defineRepositoryConformanceTests(
    'PostgresPortfolioRepository',
    async () => {
      pool = createDbPool();
      await runMigrations(pool);
      pgRepo = new PostgresPortfolioRepository(createDrizzleDb(pool));
      return pgRepo;
    },
    async () => {
      if (pool) {
        await closeDbPool(pool);
      }
    }
  );
} else {
  describe.skip('PostgresPortfolioRepository (Skipped: DATABASE_URL not set in local environment)', () => {
    it('executes in CI with PostgreSQL 16 + pgvector container service (OSR-15)', () => {});
  });
}
