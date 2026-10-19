import { describe, it, expect } from 'vitest';
import { PortfolioWorker } from './worker.js';

describe('PortfolioWorker Pipeline (§8, §13.7, §13.9, §15)', () => {
  it('ingests an entry at L0, embeds spans, and enriches with machine-suggested structure', async () => {
    const worker = new PortfolioWorker();

    // 1. Ingest
    const ingestResult = await worker.runIngestJob({
      slug: 'zero-downtime-migration',
      title: 'Zero Downtime Postgres Migration',
      body_md: `We built with Postgres and Node to migrate 100k daily active users. It worked with zero downtime. See https://github.com/example/repo/pull/101`,
      profile: 'case-study',
      visibility: 'public',
      valid_from: '2025-01-15T00:00:00Z',
      temporal_level: 'exact',
    });

    expect(ingestResult.structureLevel).toBe('L0');
    expect(ingestResult.spans.length).toBeGreaterThan(0);

    // 2. Embed
    const embedResult = await worker.runEmbedJob(ingestResult.revision.id);
    expect(embedResult.embeddedCount).toBe(ingestResult.spans.length);
    expect(embedResult.dim).toBe(384);

    // 3. Enrich (all outputs must be machine suggestions)
    const enrichResult = await worker.runEnrichJob(ingestResult.entry.id, ingestResult.revision.id);
    expect(enrichResult.facetsSuggested).toBeGreaterThan(0);
    expect(enrichResult.annotationsSuggested).toBeGreaterThan(0);
    expect(enrichResult.claimsSuggested).toBeGreaterThan(0);
    expect(enrichResult.evidenceDiscovered).toBe(1);
    expect(enrichResult.gapQuestions.length).toBeLessThanOrEqual(3);
  });

  it('enforces publish debounce window and daily build cap (§13.7)', async () => {
    const worker = new PortfolioWorker({
      publishConfig: { debounceMinutes: 10, maxBuildsPerDay: 2 },
    });

    const t0 = 1700000000000;
    const first = await worker.runPublishStaticSiteJob({ nowMs: t0 });
    expect(first.built).toBe(true);
    expect(first.buildsToday).toBe(1);

    // 3 minutes later -> debounced
    const second = await worker.runPublishStaticSiteJob({ nowMs: t0 + 3 * 60 * 1000 });
    expect(second.built).toBe(false);
    expect(second.reason).toContain('Debounced');

    // 11 minutes later -> allowed (build #2)
    const third = await worker.runPublishStaticSiteJob({ nowMs: t0 + 11 * 60 * 1000 });
    expect(third.built).toBe(true);
    expect(third.buildsToday).toBe(2);

    // 25 minutes later -> blocked by daily build cap (max 2)
    const fourth = await worker.runPublishStaticSiteJob({ nowMs: t0 + 25 * 60 * 1000 });
    expect(fourth.built).toBe(false);
    expect(fourth.reason).toContain('Daily build cap');

    // Manual "publish now" overrides debounce/cap
    const manual = await worker.runPublishStaticSiteJob({ forceNow: true, nowMs: t0 + 26 * 60 * 1000 });
    expect(manual.built).toBe(true);
  });

  it('executes encrypted backup and scratch restore verification drill (§13.9)', async () => {
    const worker = new PortfolioWorker();
    await worker.runIngestJob({
      slug: 'test-backup-entry',
      title: 'Backup Test Entry',
      body_md: 'Testing backup and restore drill.',
    });

    const drill = await worker.runBackupAndRestoreDrillJob();
    expect(drill.encryptedWith).toBe('age');
    expect(drill.restoreDrillPassed).toBe(true);
    expect(drill.verifiedRowCounts.entries).toBe(1);
  });

  it('deletes entry and all derived records in a single cascading job (§15)', async () => {
    const worker = new PortfolioWorker();
    const { entry, revision } = await worker.runIngestJob({
      slug: 'ephemeral-entry',
      title: 'Ephemeral Entry',
      body_md: 'We built with Postgres and Node. It worked.',
    });
    await worker.runEnrichJob(entry.id, revision.id);

    const deletionReport = await worker.runDeleteEntryJob(entry.id);
    expect(deletionReport.deletedRevisions).toBe(1);
    expect(deletionReport.deletedSpans).toBeGreaterThan(0);
  });
});
