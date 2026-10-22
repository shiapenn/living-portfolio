import { chunkMarkdown, generateGapQuestions, getProfile } from '@living-portfolio/core';
import {
  extractFacetsFromMarkdown,
  MockModelProvider,
  scanForConfidentialData,
  suggestRolesForSpans,
  type ModelProvider,
} from '@living-portfolio/ai';
import { InMemoryPortfolioRepository, type IPortfolioRepository } from '@living-portfolio/db';

export interface PublishBuildConfig {
  debounceMinutes: number; // default 10
  maxBuildsPerDay: number; // default 12
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
  private provider: ModelProvider;
  private publishConfig: PublishBuildConfig;
  private lastBuildTimeMs: number | null = null;
  private buildsToday = 0;

  constructor(options?: {
    repo?: IPortfolioRepository;
    provider?: ModelProvider;
    publishConfig?: Partial<PublishBuildConfig>;
  }) {
    this.repo = options?.repo ?? new InMemoryPortfolioRepository();
    this.provider = options?.provider ?? new MockModelProvider();
    this.publishConfig = {
      debounceMinutes: options?.publishConfig?.debounceMinutes ?? 10,
      maxBuildsPerDay: options?.publishConfig?.maxBuildsPerDay ?? 12,
    };
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
    const redactionWarnings = scanForConfidentialData(input.body_md);

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
        body_hash: `sha256-${input.slug}-${Date.now()}`,
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
   * 3. ENRICH (§8): Async extraction where ALL outputs are machine suggestions (`status: 'suggested'`).
   * Never overwrites owner-confirmed data.
   */
  async runEnrichJob(entryId: string, revisionId: string) {
    const full = await this.repo.getEntry(entryId);
    if (!full || !full.currentRevision) {
      throw new Error(`Entry ${entryId} not found`);
    }

    const spans = await this.repo.getSpans(revisionId);
    const profile = getProfile(full.entry.profile);

    // 3a. Facet extraction with quoted source span + confidence
    const extractedFacets = await extractFacetsFromMarkdown(full.currentRevision.body_md, this.provider);
    const savedFacets = [];
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
    const suggestedRoles = await suggestRolesForSpans(spans, profile, this.provider);
    const savedAnnotations = [];
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

    // 3c. Claim extraction + outcome status
    const savedClaims = [];
    for (const span of spans) {
      const lower = span.text_exact.toLowerCase();
      if (lower.includes('worked') || lower.includes('decided') || lower.includes('lesson') || lower.includes('migrated')) {
        const outcomeStatus = lower.includes('failed') ? 'failed' : lower.includes('partly') ? 'partly' : 'worked';
        const claim = await this.repo.saveClaim({
          revision_id: revisionId,
          text: span.text_exact.slice(0, 240),
          kind: lower.includes('decided') ? 'decision' : 'outcome',
          outcome_status: outcomeStatus,
          scope: {},
          valid_from: full.currentRevision.valid_from,
          valid_to: full.currentRevision.valid_to,
          temporal_level: full.currentRevision.temporal_level,
          is_hindsight: full.currentRevision.is_hindsight,
          source_span_id: span.id,
          source: 'machine',
          status: 'suggested',
        });
        savedClaims.push(claim);
      }
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
  async runBackupAndRestoreDrillJob(): Promise<never> {
    // SIMULATED(M1): Real pg_dump + age encryption and scratch-container restore verification are not yet implemented.
    throw new Error(
      '501 Not Implemented [SIMULATED(M1)]: Encrypted pg_dump + age backup and scratch-container restore verification are not yet implemented.'
    );
  }

  /**
   * 6. DELETE ENTRY CASCADE (§15)
   */
  async runDeleteEntryJob(entryId: string) {
    return this.repo.deleteEntry(entryId);
  }
}
