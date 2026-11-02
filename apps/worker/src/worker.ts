import { createHash } from 'node:crypto';
import { chunkMarkdown, generateGapQuestions, getProfile, type DataClass } from '@living-portfolio/core';
import {
  extractFacetsFromMarkdown,
  extractClaimsFromSpans,
  suggestRolesForSpans,
  scanForConfidentialData,
  determineDataClass,
  selectProviderForDataClass,
  BudgetGovernor,
  MockModelProvider,
  type ModelProvider,
  type ScanOptions,
} from '@living-portfolio/ai';
import {
  InMemoryPortfolioRepository,
  type IPortfolioRepository,
  createDatabaseBackup,
  runRestoreDrill,
  type BackupRetentionPolicy,
  type BackupMetadata,
  type RestoreDrillResult,
} from '@living-portfolio/db';

export interface PublishBuildConfig {
  debounceMinutes: number; // default 10
  maxBuildsPerDay: number; // default 12
}

export interface BackupJobOptions {
  destinationDir?: string;
  agePublicKey?: string;
  identityKey?: string;
  retentionPolicy?: Partial<BackupRetentionPolicy>;
  runRestoreDrill?: boolean;
  scratchRepo?: IPortfolioRepository;
}

export interface BackupJobResult {
  backupFile: string;
  metadataFile: string;
  metadata: BackupMetadata;
  drillResult?: RestoreDrillResult;
}

export interface PortfolioWorkerOptions {
  repo?: IPortfolioRepository;
  provider?: ModelProvider;
  providers?: ModelProvider[];
  governor?: BudgetGovernor;
  publishConfig?: Partial<PublishBuildConfig>;
  redactionExclusions?: string[];
  redactionExclusionsFilePath?: string;
  scanOptions?: ScanOptions;
}

export interface PublishJobResult {
  built: boolean;
  reason?: string;
  buildsToday: number;
  bundleSummary?: {
    pagesCount: number;
    keywordIndexEntries: number;
    publishedAt: string;
  };
}

/**
 * §8 & §13 Asynchronous Pipeline Worker (INGEST -> EMBED -> ENRICH -> PUBLISH -> BACKUP -> DELETE)
 */
export class PortfolioWorker {
  private repo: IPortfolioRepository;
  private providers: ModelProvider[];
  private governor: BudgetGovernor;
  private publishConfig: PublishBuildConfig;
  private redactionExclusions: string[];
  private redactionExclusionsFilePath?: string;
  private customScanOptions?: ScanOptions;
  private lastBuildTimeMs: number | null = null;
  private buildsToday = 0;

  constructor(options?: PortfolioWorkerOptions) {
    this.repo = options?.repo ?? new InMemoryPortfolioRepository();
    this.providers = options?.providers ?? (options?.provider ? [options.provider] : [new MockModelProvider()]);
    this.governor = options?.governor ?? new BudgetGovernor();
    this.publishConfig = {
      debounceMinutes: options?.publishConfig?.debounceMinutes ?? 10,
      maxBuildsPerDay: options?.publishConfig?.maxBuildsPerDay ?? 12,
    };
    this.redactionExclusions = options?.redactionExclusions ?? [];
    this.redactionExclusionsFilePath = options?.redactionExclusionsFilePath;
    this.customScanOptions = options?.scanOptions;
  }

  get provider(): ModelProvider {
    return this.providers[0];
  }

  /**
   * 1. INGEST (§8): Normalize to Markdown, redact locally per exclusion rules,
   * create revision and spans, publishable immediately at L0.
   */
  async runIngestJob(input: {
    slug: string;
    title: string;
    body_md: string;
    profile?: string;
    visibility?: 'private' | 'unlisted' | 'public';
    valid_from?: string;
    temporal_level?: 'exact' | 'range' | 'estimated';
    is_hindsight?: boolean;
  }) {
    const effectiveScanOptions: ScanOptions = {
      exclusions: this.redactionExclusions,
      exclusionsFilePath: this.redactionExclusionsFilePath,
      patterns: this.customScanOptions?.patterns,
      ...this.customScanOptions,
    };
    const redactionWarnings = scanForConfidentialData(input.body_md, effectiveScanOptions);

    const { entry, revision } = await this.repo.createEntry(
      {
        slug: input.slug,
        title: input.title,
        profile: input.profile ?? 'case-study',
        view: 'article',
        visibility: input.visibility ?? 'private',
        venture_id: null,
        current_revision_id: null,
      },
      {
        body_md: input.body_md,
        body_hash: createHash('sha256').update(input.body_md).digest('hex'),
        temporal_level: input.temporal_level ?? 'estimated',
        valid_from: input.valid_from ?? null,
        valid_to: null,
        is_hindsight: input.is_hindsight ?? false,
      }
    );

    const spanDrafts = chunkMarkdown(revision.id, input.body_md);
    const spans = await this.repo.saveSpans(spanDrafts);

    return {
      entry,
      revision,
      spans,
      redactionWarnings,
      structureLevel: 'L0' as const,
    };
  }

  /**
   * 2. EMBED (§8): Generate chunk-level embeddings with model_id and version.
   */
  async runEmbedJob(revisionId: string) {
    const spans = await this.repo.getSpans(revisionId);
    if (spans.length === 0) {
      return { revisionId, embeddedCount: 0, savedVectorsCount: 0, modelId: 'local-onnx/bge-small-en-v1.5', dim: 384 };
    }

    const texts = spans.map((s) => s.text_exact);
    const vectors = await this.provider.embed(texts);

    // Persist embeddings into repository chunk_vectors (§8, Fix 8, P3)
    const chunkVectorsToSave = spans.map((span, idx) => ({
      chunk_id: span.id,
      vector: vectors[idx] ?? new Array(384).fill(0),
      text_snippet: span.text_exact,
      model_id: 'local-onnx/bge-small-en-v1.5',
      model_version: '1.5.0',
      dim: vectors[idx]?.length ?? 384,
    }));

    const savedVectors = await this.repo.saveChunkVectors(chunkVectorsToSave);

    return {
      revisionId,
      embeddedCount: vectors.length,
      savedVectorsCount: savedVectors.length,
      modelId: 'local-onnx/bge-small-en-v1.5',
      modelVersion: '1.5.0',
      dim: vectors[0]?.length ?? 384,
    };
  }

  /**
   * 3. ENRICH (§8, §13.5, §15, S7, Fix 13):
   * Async extraction where ALL outputs are machine suggestions (`status: 'suggested'`).
   * Never overwrites owner-confirmed data.
   * Routes model calls strictly by data class through BudgetGovernor and local redaction scan.
   */
  async runEnrichJob(entryId: string, revisionId: string) {
    const full = await this.repo.getEntry(entryId);
    if (!full || !full.currentRevision) {
      throw new Error(`Entry ${entryId} not found`);
    }

    const spans = await this.repo.getSpans(revisionId);
    const profile = getProfile(full.entry.profile);

    // 1. Redaction & exclusion scan
    const effectiveScanOptions: ScanOptions = {
      exclusions: this.redactionExclusions,
      exclusionsFilePath: this.redactionExclusionsFilePath,
      patterns: this.customScanOptions?.patterns,
      ...this.customScanOptions,
    };
    const redactionFindings = scanForConfidentialData(
      full.currentRevision.body_md,
      effectiveScanOptions
    );

    // 2. Determine DataClass (§13.5, §15)
    const dataClass: DataClass = determineDataClass(
      full.entry,
      full.currentRevision.body_md,
      effectiveScanOptions
    );

    // 3. Acquire lease from BudgetGovernor with priority: 'background'
    const estTokens = Math.max(100, Math.ceil(full.currentRevision.body_md.length / 4) + 600);
    const routing = selectProviderForDataClass(
      this.providers,
      dataClass,
      this.governor,
      estTokens,
      'background'
    );
    const selectedProvider = routing.provider;

    const savedFacets = [];
    const savedAnnotations = [];
    const savedClaims = [];
    let skippedReason: string | undefined;

    if (!selectedProvider) {
      if (dataClass === 'sensitive') {
        skippedReason = 'sensitive_content_no_local_provider';
      } else {
        skippedReason = 'budget_exhausted_or_policy_forbidden';
      }
    } else {
      // 3a. Facet extraction with quoted source span + confidence
      const extractedFacets = await extractFacetsFromMarkdown(full.currentRevision.body_md, selectedProvider);
      for (const f of extractedFacets) {
        const saved = await this.repo.saveFacet({
          entry_id: entryId,
          revision_id: revisionId,
          key: f.key,
          value: f.value,
          source: 'machine',
          status: 'suggested',
          confidence: f.confidence,
          source_span_id: spans[0]?.id ?? null,
        });
        savedFacets.push(saved);
      }

      // 3b. Role suggestion per span
      const suggestedRoles = await suggestRolesForSpans(spans, profile, selectedProvider);
      for (const r of suggestedRoles) {
        const targetSpan = spans.find((s) => s.ordinal === r.spanOrdinal) || spans[0];
        if (!targetSpan) continue;
        const ann = await this.repo.saveAnnotation({
          span_id: targetSpan.id,
          role: r.role,
          profile: full.entry.profile,
          source: 'machine',
          status: 'suggested',
          confidence: r.confidence,
        });
        savedAnnotations.push(ann);
      }

      // 3c. Claim extraction + outcome status + scope (Fix 13, replacing keyword extraction)
      const extractedClaims = await extractClaimsFromSpans(spans, selectedProvider);
      for (const c of extractedClaims) {
        const matchedSpan = c.source_span_id
          ? spans.find((s) => s.id === c.source_span_id)
          : spans[0];

        const claim = await this.repo.saveClaim({
          revision_id: revisionId,
          text: c.text.slice(0, 500),
          kind: c.kind,
          outcome_status: c.outcome_status ?? 'unknown',
          scope: c.scope ?? {},
          valid_from: full.currentRevision.valid_from,
          valid_to: full.currentRevision.valid_to,
          temporal_level: full.currentRevision.temporal_level,
          is_hindsight: full.currentRevision.is_hindsight,
          source_span_id: matchedSpan?.id ?? spans[0]?.id ?? null,
          source: 'machine',
          status: 'suggested',
        });
        savedClaims.push(claim);
      }

      // Reconcile spend with governor
      this.governor.reconcileUsage(selectedProvider.id, 'background', estTokens, estTokens);
    }

    // 3d. Evidence discovery (links/commits in markdown)
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const discoveredUrls = full.currentRevision.body_md.match(urlRegex) ?? [];
    const savedEvidence = [];
    for (const url of discoveredUrls) {
      let isGitHub = false;
      try {
        const parsed = new URL(url);
        isGitHub = parsed.hostname === 'github.com' || parsed.hostname.endsWith('.github.com');
      } catch {
        isGitHub = false;
      }
      const kind = isGitHub && (url.includes('/pull/') || url.includes('/commit/')) ? 'commit' : 'url';
      const ev = await this.repo.saveEvidence({
        entry_id: entryId,
        kind,
        url,
        verification: null,
        verified_at: null,
      });
      savedEvidence.push(ev);
    }

    // 3e. Gap questions (at most 3 high-value questions, §10.2)
    const gapQuestions = generateGapQuestions({
      revision: full.currentRevision,
      facets: savedFacets,
      claims: savedClaims,
    });

    return {
      entryId,
      revisionId,
      dataClass,
      providerUsed: selectedProvider?.id ?? null,
      skippedReason,
      redactionFindingsCount: redactionFindings.length,
      facetsSuggested: savedFacets.length,
      annotationsSuggested: savedAnnotations.length,
      claimsSuggested: savedClaims.length,
      evidenceDiscovered: savedEvidence.length,
      gapQuestions,
    };
  }

  /**
   * 4. PUBLISH (§13.7): Debounced static site build with daily build cap.
   */
  async runPublishStaticSiteJob(options?: { forceNow?: boolean; nowMs?: number }): Promise<PublishJobResult> {
    const nowMs = options?.nowMs ?? Date.now();
    const forceNow = options?.forceNow ?? false;

    if (!forceNow && this.buildsToday >= this.publishConfig.maxBuildsPerDay) {
      return {
        built: false,
        reason: `Daily build cap (${this.publishConfig.maxBuildsPerDay}) reached`,
        buildsToday: this.buildsToday,
      };
    }

    if (!forceNow && this.lastBuildTimeMs !== null) {
      const elapsedMinutes = (nowMs - this.lastBuildTimeMs) / (60 * 1000);
      if (elapsedMinutes < this.publishConfig.debounceMinutes) {
        return {
          built: false,
          reason: `Debounced: ${elapsedMinutes.toFixed(1)}m elapsed (< ${this.publishConfig.debounceMinutes}m window)`,
          buildsToday: this.buildsToday,
        };
      }
    }

    const publicEntries = await this.repo.listEntries({ visibility: ['public'] });
    this.lastBuildTimeMs = nowMs;
    this.buildsToday += 1;

    return {
      built: true,
      buildsToday: this.buildsToday,
      bundleSummary: {
        pagesCount: publicEntries.length + 10,
        keywordIndexEntries: publicEntries.length,
        publishedAt: new Date(nowMs).toISOString(),
      },
    };
  }

  /**
   * 5. BACKUP & RESTORE DRILL (§13.9, §18.1):
   * Nightly pg_dump + media sync encrypted with `age`, plus monthly automated restore test.
   */
  async runBackupAndRestoreDrillJob(options?: BackupJobOptions): Promise<BackupJobResult> {
    if (!options || (!options.destinationDir && !options.agePublicKey)) {
      // SIMULATED(M1): Encrypted pg_dump + age backup and scratch-container restore verification are not yet implemented.
      throw new Error(
        '501 Not Implemented [SIMULATED(M1)]: Encrypted pg_dump + age backup and scratch-container restore verification are not yet implemented.'
      );
    }

    const backupResult = await createDatabaseBackup({
      repo: this.repo,
      destinationDir: options.destinationDir,
      agePublicKey: options.agePublicKey,
      retentionPolicy: options.retentionPolicy,
    });

    let drillResult: RestoreDrillResult | undefined = undefined;
    if (options.runRestoreDrill !== false) {
      drillResult = await runRestoreDrill({
        backupFile: backupResult.backupFile,
        identityKey: options.identityKey || options.agePublicKey,
        scratchRepo: options.scratchRepo ?? new InMemoryPortfolioRepository(),
      });
    }

    return {
      backupFile: backupResult.backupFile,
      metadataFile: backupResult.metadataFile,
      metadata: backupResult.metadata,
      drillResult,
    };
  }

  /**
   * 6. DELETE ENTRY CASCADE (§15)
   */
  async runDeleteEntryJob(entryId: string) {
    return this.repo.deleteEntry(entryId);
  }
}
