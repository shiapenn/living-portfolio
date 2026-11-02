import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider, OpenAICompatibleProvider } from '@living-portfolio/ai';
import { PortfolioWorker } from './worker.js';
import { msUntilNextUtcMidnight, scheduleUtcMidnightReset } from './index.js';

describe('PortfolioWorker Pipeline (§8, §13.7, §13.9, §15)', () => {
  it('ingests an entry at L0, embeds spans with vector persistence, and enriches with machine-suggested structure', async () => {
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo });

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

    // 2. Embed with persistence (Fix 8, P3)
    const embedResult = await worker.runEmbedJob(ingestResult.revision.id);
    expect(embedResult.embeddedCount).toBe(ingestResult.spans.length);
    expect(embedResult.savedVectorsCount).toBe(ingestResult.spans.length);
    expect(embedResult.dim).toBe(384);

    const savedChunkVectors = await repo.getChunkVectorsForRevision(ingestResult.revision.id);
    expect(savedChunkVectors.length).toBe(ingestResult.spans.length);
    expect(savedChunkVectors[0].vector.length).toBe(384);

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

  it('resets buildsToday counter across UTC midnight boundaries (§13.7, Finding P5, Fix 19)', async () => {
    const worker = new PortfolioWorker({
      publishConfig: { debounceMinutes: 10, maxBuildsPerDay: 2 },
    });

    // Day 1: 2026-11-02 23:40:00 UTC (1793662800000)
    const tDay1Build1 = Date.parse('2026-11-02T23:40:00.000Z');
    const first = await worker.runPublishStaticSiteJob({ nowMs: tDay1Build1 });
    expect(first.built).toBe(true);
    expect(first.buildsToday).toBe(1);
    expect(worker.getBuildsToday(tDay1Build1)).toBe(1);

    // Day 1: 2026-11-02 23:52:00 UTC (12 min later -> allowed build #2, reaching daily cap of 2)
    const tDay1Build2 = Date.parse('2026-11-02T23:52:00.000Z');
    const second = await worker.runPublishStaticSiteJob({ nowMs: tDay1Build2 });
    expect(second.built).toBe(true);
    expect(second.buildsToday).toBe(2);
    expect(worker.getBuildsToday(tDay1Build2)).toBe(2);

    // Day 1: 2026-11-02 23:58:00 UTC -> rejected by daily build cap
    const tDay1Build3 = Date.parse('2026-11-02T23:58:00.000Z');
    const third = await worker.runPublishStaticSiteJob({ nowMs: tDay1Build3 });
    expect(third.built).toBe(false);
    expect(third.reason).toContain('Daily build cap (2) reached');
    expect(third.buildsToday).toBe(2);

    // Day 2 (across UTC midnight): 2026-11-03 00:05:00 UTC (13 min after build #2)
    // buildsToday MUST reset to 0, allowing build #1 of the new day!
    const tDay2Build1 = Date.parse('2026-11-03T00:05:00.000Z');
    expect(worker.checkAndResetBuildsToday(tDay2Build1)).toBe(true);
    expect(worker.getBuildsToday(tDay2Build1)).toBe(0);

    const fourth = await worker.runPublishStaticSiteJob({ nowMs: tDay2Build1 });
    expect(fourth.built).toBe(true);
    expect(fourth.buildsToday).toBe(1);
    expect(worker.getBuildsToday(tDay2Build1)).toBe(1);
  });

  it('emits real static HTML bundle, keyword search index, and manifest to disk (§13.7, Finding P5, Fix 19)', async () => {
    const tmpDir = path.join('/tmp', `lp-static-export-test-${Date.now()}`);
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo, publishConfig: { outputDir: tmpDir } });

    // 1. Ingest public case study
    const publicCaseStudy = await worker.runIngestJob({
      slug: 'event-driven-architecture',
      title: 'Event Driven Architecture at Scale',
      body_md: '## Overview\nWe migrated distributed workloads to asynchronous event streams with 99.99% uptime.',
      profile: 'case-study',
      visibility: 'public',
      valid_from: '2025-06-01T00:00:00Z',
    });
    await worker.runEmbedJob(publicCaseStudy.revision.id);
    await worker.runEnrichJob(publicCaseStudy.entry.id, publicCaseStudy.revision.id);

    // 2. Ingest public freeform writing
    const publicWriting = await worker.runIngestJob({
      slug: 'principles-of-resilience',
      title: 'Principles of Resilience',
      body_md: 'Systems should be designed with graceful degradation and offline read-only fallbacks.',
      profile: 'freeform',
      visibility: 'public',
      valid_from: '2025-07-01T00:00:00Z',
    });

    // 3. Ingest private entry (must NEVER appear in static export)
    await worker.runIngestJob({
      slug: 'private-internal-notes',
      title: 'Private Internal Architecture Notes',
      body_md: 'Confidential strategic roadmap for internal engineering teams only.',
      profile: 'case-study',
      visibility: 'private',
    });

    // 4. Run static build job
    const publishResult = await worker.runPublishStaticSiteJob({ outputDir: tmpDir });
    expect(publishResult.built).toBe(true);
    expect(publishResult.outputDir).toBe(tmpDir);
    expect(publishResult.bundleSummary).toBeDefined();

    const summary = publishResult.bundleSummary!;
    expect(summary.pagesCount).toBeGreaterThanOrEqual(13); // 11 base pages + 2 public entry detail pages
    expect(summary.keywordIndexEntries).toBe(2); // exactly 2 public entries
    expect(summary.filesCount).toBeGreaterThanOrEqual(16);

    // 5. Verify real files on disk
    // 5a. Home page
    const indexHtml = await fs.readFile(path.join(tmpDir, 'index.html'), 'utf8');
    expect(indexHtml).toContain('<!DOCTYPE html>');
    expect(indexHtml).toContain('Event Driven Architecture at Scale');

    // 5b. Work and writing index pages
    const workIndexHtml = await fs.readFile(path.join(tmpDir, 'work/index.html'), 'utf8');
    expect(workIndexHtml).toContain('Event Driven Architecture at Scale');

    const writingIndexHtml = await fs.readFile(path.join(tmpDir, 'writing/index.html'), 'utf8');
    expect(writingIndexHtml).toContain('Principles of Resilience');

    // 5c. Core static views
    const timelineHtml = await fs.readFile(path.join(tmpDir, 'timeline/index.html'), 'utf8');
    expect(timelineHtml).toContain('Timeline');

    const askHtml = await fs.readFile(path.join(tmpDir, 'ask/index.html'), 'utf8');
    expect(askHtml).toContain('Ask');

    const aboutHtml = await fs.readFile(path.join(tmpDir, 'about/index.html'), 'utf8');
    expect(aboutHtml).toContain('About');

    const notFoundHtml = await fs.readFile(path.join(tmpDir, '404.html'), 'utf8');
    expect(notFoundHtml).toContain('404');

    // 5d. Public entry detail pages
    const caseStudyDetailHtml = await fs.readFile(
      path.join(tmpDir, 'work/event-driven-architecture/index.html'),
      'utf8'
    );
    expect(caseStudyDetailHtml).toContain('Event Driven Architecture at Scale');

    const writingDetailHtml = await fs.readFile(
      path.join(tmpDir, 'writing/principles-of-resilience/index.html'),
      'utf8'
    );
    expect(writingDetailHtml).toContain('Principles of Resilience');

    // 5e. Confidential entry must NOT exist on disk
    await expect(
      fs.access(path.join(tmpDir, 'work/private-internal-notes/index.html'))
    ).rejects.toThrow();

    // 5f. CSS design tokens asset
    const cssContent = await fs.readFile(path.join(tmpDir, 'assets/strata.css'), 'utf8');
    expect(cssContent).toContain('--surface-raised');

    // 5g. Build-time keyword search index (§13.7)
    const keywordIndexRaw = await fs.readFile(path.join(tmpDir, 'keyword-index.json'), 'utf8');
    const keywordIndex = JSON.parse(keywordIndexRaw);
    expect(Array.isArray(keywordIndex)).toBe(true);
    expect(keywordIndex.length).toBe(2);

    const indexedSlugs = keywordIndex.map((k: any) => k.slug);
    expect(indexedSlugs).toContain('event-driven-architecture');
    expect(indexedSlugs).toContain('principles-of-resilience');
    expect(indexedSlugs).not.toContain('private-internal-notes');

    const caseStudyIndexItem = keywordIndex.find((k: any) => k.slug === 'event-driven-architecture');
    expect(caseStudyIndexItem.keywords.length).toBeGreaterThan(0);
    expect(caseStudyIndexItem.url).toBe('/work/event-driven-architecture');

    // search-index.json alias
    const searchIndexRaw = await fs.readFile(path.join(tmpDir, 'search-index.json'), 'utf8');
    expect(JSON.parse(searchIndexRaw)).toEqual(keywordIndex);

    // 5h. Bundle manifest
    const manifestRaw = await fs.readFile(path.join(tmpDir, 'manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);
    expect(manifest.version).toBe('1.0');
    expect(manifest.pagesCount).toBe(summary.pagesCount);
    expect(manifest.keywordIndexEntries).toBe(2);
    expect(manifest.files).toContain('index.html');
    expect(manifest.files).toContain('keyword-index.json');
    expect(manifest.files).toContain('assets/strata.css');

    // Clean up temporary files
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('calculates ms until next UTC midnight and manages reset timer (§13.7, Finding P5, Fix 19)', async () => {
    // Test at 23:59:50.000Z -> exactly 10,000ms until UTC midnight
    const fixedTime = Date.parse('2026-11-02T23:59:50.000Z');
    const msUntilMidnight = msUntilNextUtcMidnight(fixedTime);
    expect(msUntilMidnight).toBe(10_000);

    // Test at 00:00:00.000Z -> 24 hours (86,400,000ms) until next midnight
    const midnightTime = Date.parse('2026-11-03T00:00:00.000Z');
    const msNext = msUntilNextUtcMidnight(midnightTime);
    expect(msNext).toBe(24 * 60 * 60 * 1000);

    // Test timer scheduling and graceful cleanup
    const worker = new PortfolioWorker();
    let resetCount = 0;
    const cancel = scheduleUtcMidnightReset(worker, () => {
      resetCount += 1;
    });
    expect(typeof cancel).toBe('function');
    cancel(); // Gracefully stops timer without leaking handles
  });

  it('throws 501 Not Implemented on simulated backup and restore drill job per AUD-18 (§13.9)', async () => {
    const worker = new PortfolioWorker();
    await expect(worker.runBackupAndRestoreDrillJob()).rejects.toThrow(/501 Not Implemented \[SIMULATED\(M1\)\]/);
  });

  it('runs real age-encrypted backup and restore drill when options are configured (§13.9, OSR-20, M8)', async () => {
    const tmpDir = `/tmp/lp-worker-backup-test-${Date.now()}`;
    const worker = new PortfolioWorker();
    await worker.runIngestJob({
      slug: 'backup-entry',
      title: 'Backup Entry',
      body_md: 'This is real backup test content.',
    });

    const result = await worker.runBackupAndRestoreDrillJob({
      destinationDir: tmpDir,
      agePublicKey: 'lp_worker_test_recipient_key_2026',
    });

    expect(result.backupFile).toBeDefined();
    expect(result.metadata.entryCount).toBeGreaterThanOrEqual(1);
    expect(result.drillResult?.ok).toBe(true);
    expect(result.drillResult?.checksumVerified).toBe(true);
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

  describe('WP-3.4 / S7 Privacy Router and Enrichment Scanner (§4.3, §8, §13.5, §15, Fix 13)', () => {
    it('determines data-class strictly and skips external cloud transmission for sensitive secrets/NDA/exclusions', async () => {
      const repo = new InMemoryPortfolioRepository();
      const cloudProvider = new OpenAICompatibleProvider({
        apiKey: 'test-cloud-key-99',
        baseURL: 'https://api.openai.com/v1',
        dataPolicy: {
          trainsOnInputs: false,
          retentionDays: 30, // Cloud retention > 0 -> forbidden for sensitive
          humanReview: false,
          zeroRetentionOption: true,
        },
      });

      const worker = new PortfolioWorker({
        repo,
        providers: [cloudProvider],
        redactionExclusions: ['ProjectSecretAurora'],
      });

      // 1. Entry with secret token
      const testSecretKey = ['sk', 'proj', 'dummytesttoken123456789'].join('-');
      const { entry: secretEntry, revision: secretRev } = await worker.runIngestJob({
        slug: 'internal-secret-token',
        title: 'Internal Secret Token Entry',
        body_md: `Found credentials: ${testSecretKey} in configuration file.`,
        visibility: 'public',
      });

      const secretEnrich = await worker.runEnrichJob(secretEntry.id, secretRev.id);
      expect(secretEnrich.dataClass).toBe('sensitive');
      expect(secretEnrich.providerUsed).toBeNull();
      expect(secretEnrich.skippedReason).toBe('sensitive_content_no_local_provider');
      expect(secretEnrich.claimsSuggested).toBe(0);
      expect(secretEnrich.facetsSuggested).toBe(0);

      // 2. Entry with owner exclusion rule match
      const { entry: exclEntry, revision: exclRev } = await worker.runIngestJob({
        slug: 'aurora-notes',
        title: 'Aurora Architecture Notes',
        body_md: 'We designed the architecture for ProjectSecretAurora over three quarters.',
        visibility: 'public',
      });

      const exclEnrich = await worker.runEnrichJob(exclEntry.id, exclRev.id);
      expect(exclEnrich.dataClass).toBe('sensitive');
      expect(exclEnrich.providerUsed).toBeNull();
      expect(exclEnrich.skippedReason).toBe('sensitive_content_no_local_provider');
    });

    it('routes sensitive content to local provider and extracts structured claims with outcome and scope', async () => {
      const repo = new InMemoryPortfolioRepository();
      const cloudProvider = new OpenAICompatibleProvider({
        apiKey: 'test-cloud-key-100',
        baseURL: 'https://api.openai.com/v1',
        dataPolicy: {
          trainsOnInputs: false,
          retentionDays: 30,
          humanReview: false,
          zeroRetentionOption: true,
        },
      });
      const localProvider = new MockModelProvider('local-onnx-mock', 'Local In-Process Mock');

      const worker = new PortfolioWorker({
        repo,
        providers: [cloudProvider, localProvider],
        redactionExclusions: ['TopSecretProject'],
      });

      const { entry, revision } = await worker.runIngestJob({
        slug: 'sensitive-with-local-provider',
        title: 'Sensitive with Local Provider',
        body_md: 'Worked on TopSecretProject under strictly confidential terms. We migrated 100k DAU with Postgres.',
        visibility: 'public',
      });

      const enrich = await worker.runEnrichJob(entry.id, revision.id);
      expect(enrich.dataClass).toBe('sensitive');
      expect(enrich.providerUsed).toBe('local-onnx-mock');
      expect(enrich.facetsSuggested).toBeGreaterThan(0);
      expect(enrich.claimsSuggested).toBeGreaterThan(0);

      // Verify extracted claim structure (Fix 13: replacing keyword matching)
      const claims = await repo.getClaimsForRevision(revision.id);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0].kind).toBe('outcome');
      expect(claims[0].outcome_status).toBe('worked');
      expect(claims[0].scope).toEqual({ database: 'PostgreSQL', stack: 'Node.js' });
      expect(claims[0].status).toBe('suggested');
    });

    it('enforces budget governor background limits and reserves during enrichment', async () => {
      const repo = new InMemoryPortfolioRepository();
      const governor = new BudgetGovernor({ backgroundReserve: 0.3 });
      const mockProvider = new MockModelProvider('test-provider', 'Test Provider');

      // Consume the non-background reserve so background work is capped
      const ledger = governor.getLedger(mockProvider.id);
      ledger.tokensToday = 8000000; // limits dailyTokens is 10000000, 80% > (1 - backgroundReserve 0.3 = 70%)

      const worker = new PortfolioWorker({
        repo,
        providers: [mockProvider],
        governor,
      });

      const { entry, revision } = await worker.runIngestJob({
        slug: 'budget-constrained-enrichment',
        title: 'Budget Constrained',
        body_md: 'Normal public post without any secrets or exclusions.',
        visibility: 'public',
      });

      const res = await worker.runEnrichJob(entry.id, revision.id);
      expect(res.dataClass).toBe('public');
      expect(res.providerUsed).toBeNull();
      expect(res.skippedReason).toBe('budget_exhausted_or_policy_forbidden');
      expect(res.claimsSuggested).toBe(0);
    });
  });
});
