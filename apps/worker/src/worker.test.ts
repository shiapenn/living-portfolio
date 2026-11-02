import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider, OpenAICompatibleProvider } from '@living-portfolio/ai';
import { PortfolioWorker } from './worker.js';

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
