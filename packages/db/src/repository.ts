import type {
  Annotation,
  CalibrationChange,
  Claim,
  CorrectionLog,
  Entry,
  EntryRevision,
  Escalation,
  Evidence,
  Facet,
  MediaAsset,
  Relation,
  ScopedConstraint,
  Span,
  TopologyReport,
  Venture,
  Visibility,
} from '@living-portfolio/core';
import { isTemporallyValid } from '@living-portfolio/core';

export interface SearchResult {
  span: Span;
  entry: Entry;
  revision: EntryRevision;
  similarity: number;
  bm25Score: number;
  rrfScore: number;
}

export interface TemporalExpandOptions {
  seedClaimIds: string[];
  t_q: string | Date;
  hops?: number; // default 2
}

export interface IPortfolioRepository {
  // Ventures
  createVenture(v: Omit<Venture, 'id'>): Promise<Venture>;
  getVenture(id: string): Promise<Venture | null>;
  listVentures(): Promise<Venture[]>;

  // Entries & Revisions
  createEntry(e: Omit<Entry, 'id' | 'created_at'>, rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'>): Promise<{ entry: Entry; revision: EntryRevision }>;
  getEntryBySlug(slug: string): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null>;
  getEntry(id: string): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null>;
  listEntries(filter?: { visibility?: Visibility[]; venture_id?: string }): Promise<Entry[]>;
  createRevision(entry_id: string, rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'>): Promise<EntryRevision>;
  getRevisions(entry_id: string): Promise<EntryRevision[]>;

  // Spans & Annotations
  saveSpans(spans: Omit<Span, 'id'>[]): Promise<Span[]>;
  getSpans(revision_id: string): Promise<Span[]>;
  saveAnnotation(a: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation>;
  getAnnotations(span_id: string): Promise<Annotation[]>;
  listAnnotationsForRevision(revision_id: string): Promise<Annotation[]>;

  // Facets
  saveFacet(f: Omit<Facet, 'id'>): Promise<Facet>;
  getFacetsForEntry(entry_id: string): Promise<Facet[]>;

  // Claims & Relations
  saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim>;
  getClaimsForRevision(revision_id: string): Promise<Claim[]>;
  listClaimsForEntry(entry_id: string): Promise<Claim[]>;
  saveRelation(r: Omit<Relation, 'id' | 'recorded_at'>): Promise<Relation>;
  getRelationsForClaim(claim_id: string): Promise<Relation[]>;
  listAcceptedRelations(): Promise<Relation[]>;

  // Evidence
  saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence>;
  getEvidenceForEntry(entry_id: string): Promise<Evidence[]>;

  // Media
  saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset>;
  getMedia(id: string): Promise<MediaAsset | null>;

  // Operational: Escalations, Calibration, Logs
  saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation>;
  getEscalations(status?: string): Promise<Escalation[]>;
  updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation>;
  saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog>;
  getCorrectionLogs(kind?: string): Promise<CorrectionLog[]>;
  saveCalibrationChange(c: Omit<CalibrationChange, 'id' | 'at'>): Promise<CalibrationChange>;
  getCalibrationChanges(): Promise<CalibrationChange[]>;
  saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint>;
  getScopedConstraints(status?: string): Promise<ScopedConstraint[]>;

  // Search & Graph Traversal
  hybridSearch(query: string, options: {
    visibility: Visibility[];
    as_of_date?: string | Date;
    limit?: number;
    embedding?: number[];
  }): Promise<SearchResult[]>;

  temporalExpand(options: TemporalExpandOptions): Promise<Claim[]>;
}

/**
 * In-memory repository implementing IPortfolioRepository.
 * Fully functional for development, fast tests, and deployments without external Postgres.
 */
export class InMemoryPortfolioRepository implements IPortfolioRepository {
  private ventures = new Map<string, Venture>();
  private entries = new Map<string, Entry>();
  private revisions = new Map<string, EntryRevision>();
  private spans = new Map<string, Span>();
  private annotations = new Map<string, Annotation>();
  private facets = new Map<string, Facet>();
  private claims = new Map<string, Claim>();
  private relations = new Map<string, Relation>();
  private evidence = new Map<string, Evidence>();
  private media = new Map<string, MediaAsset>();
  private escalations = new Map<string, Escalation>();
  private correctionLogs = new Map<string, CorrectionLog>();
  private calibrationChanges = new Map<string, CalibrationChange>();
  private scopedConstraints = new Map<string, ScopedConstraint>();

  async createVenture(v: Omit<Venture, 'id'>): Promise<Venture> {
    const id = crypto.randomUUID();
    const venture: Venture = { ...v, id };
    this.ventures.set(id, venture);
    return venture;
  }

  async getVenture(id: string): Promise<Venture | null> {
    return this.ventures.get(id) || null;
  }

  async listVentures(): Promise<Venture[]> {
    return Array.from(this.ventures.values());
  }

  async createEntry(
    e: Omit<Entry, 'id' | 'created_at'>,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'>
  ): Promise<{ entry: Entry; revision: EntryRevision }> {
    const entryId = crypto.randomUUID();
    const revId = crypto.randomUUID();
    const now = new Date().toISOString();

    const revision: EntryRevision = {
      ...rev,
      id: revId,
      entry_id: entryId,
      written_at: now,
    };
    this.revisions.set(revId, revision);

    const entry: Entry = {
      ...e,
      id: entryId,
      current_revision_id: revId,
      created_at: now,
    };
    this.entries.set(entryId, entry);

    return { entry, revision };
  }

  async getEntryBySlug(slug: string): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    for (const entry of this.entries.values()) {
      if (entry.slug === slug) {
        const rev = entry.current_revision_id ? this.revisions.get(entry.current_revision_id) || null : null;
        return { entry, currentRevision: rev };
      }
    }
    return null;
  }

  async getEntry(id: string): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;
    const rev = entry.current_revision_id ? this.revisions.get(entry.current_revision_id) || null : null;
    return { entry, currentRevision: rev };
  }

  async listEntries(filter?: { visibility?: Visibility[]; venture_id?: string }): Promise<Entry[]> {
    let result = Array.from(this.entries.values());
    if (filter?.visibility && filter.visibility.length > 0) {
      result = result.filter((e) => filter.visibility!.includes(e.visibility));
    }
    if (filter?.venture_id) {
      result = result.filter((e) => e.venture_id === filter.venture_id);
    }
    return result;
  }

  async createRevision(
    entry_id: string,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'>
  ): Promise<EntryRevision> {
    const revId = crypto.randomUUID();
    const revision: EntryRevision = {
      ...rev,
      id: revId,
      entry_id,
      written_at: new Date().toISOString(),
    };
    this.revisions.set(revId, revision);

    const entry = this.entries.get(entry_id);
    if (entry) {
      entry.current_revision_id = revId;
    }
    return revision;
  }

  async getRevisions(entry_id: string): Promise<EntryRevision[]> {
    return Array.from(this.revisions.values()).filter((r) => r.entry_id === entry_id);
  }

  async saveSpans(spansToSave: Omit<Span, 'id'>[]): Promise<Span[]> {
    const saved: Span[] = [];
    for (const s of spansToSave) {
      const id = crypto.randomUUID();
      const span: Span = { ...s, id };
      this.spans.set(id, span);
      saved.push(span);
    }
    return saved;
  }

  async getSpans(revision_id: string): Promise<Span[]> {
    return Array.from(this.spans.values())
      .filter((s) => s.revision_id === revision_id)
      .sort((a, b) => a.ordinal - b.ordinal);
  }

  async saveAnnotation(a: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation> {
    const id = crypto.randomUUID();
    const annotation: Annotation = { ...a, id, created_at: new Date().toISOString() };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async getAnnotations(span_id: string): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter((a) => a.span_id === span_id);
  }

  async listAnnotationsForRevision(revision_id: string): Promise<Annotation[]> {
    const revisionSpanIds = new Set(
      Array.from(this.spans.values())
        .filter((s) => s.revision_id === revision_id)
        .map((s) => s.id)
    );
    return Array.from(this.annotations.values()).filter((a) => revisionSpanIds.has(a.span_id));
  }

  async saveFacet(f: Omit<Facet, 'id'>): Promise<Facet> {
    const id = crypto.randomUUID();
    const facet: Facet = { ...f, id };
    this.facets.set(id, facet);
    return facet;
  }

  async getFacetsForEntry(entry_id: string): Promise<Facet[]> {
    return Array.from(this.facets.values()).filter((f) => f.entry_id === entry_id);
  }

  async saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim> {
    const id = crypto.randomUUID();
    const claim: Claim = { ...c, id, recorded_at: new Date().toISOString() };
    this.claims.set(id, claim);
    return claim;
  }

  async getClaimsForRevision(revision_id: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter((c) => c.revision_id === revision_id);
  }

  async listClaimsForEntry(entry_id: string): Promise<Claim[]> {
    const entryRevIds = new Set(
      Array.from(this.revisions.values())
        .filter((r) => r.entry_id === entry_id)
        .map((r) => r.id)
    );
    return Array.from(this.claims.values()).filter((c) => entryRevIds.has(c.revision_id));
  }

  async saveRelation(r: Omit<Relation, 'id' | 'recorded_at'>): Promise<Relation> {
    const id = crypto.randomUUID();
    const relation: Relation = { ...r, id, recorded_at: new Date().toISOString() };
    this.relations.set(id, relation);
    return relation;
  }

  async getRelationsForClaim(claim_id: string): Promise<Relation[]> {
    return Array.from(this.relations.values()).filter(
      (r) => r.src_claim === claim_id || r.dst_claim === claim_id
    );
  }

  async listAcceptedRelations(): Promise<Relation[]> {
    return Array.from(this.relations.values()).filter((r) => r.status === 'accepted');
  }

  async saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence> {
    const id = crypto.randomUUID();
    const item: Evidence = { ...ev, id };
    this.evidence.set(id, item);
    return item;
  }

  async getEvidenceForEntry(entry_id: string): Promise<Evidence[]> {
    return Array.from(this.evidence.values()).filter((e) => e.entry_id === entry_id);
  }

  async saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
    const id = crypto.randomUUID();
    const asset: MediaAsset = { ...m, id };
    this.media.set(id, asset);
    return asset;
  }

  async getMedia(id: string): Promise<MediaAsset | null> {
    return this.media.get(id) || null;
  }

  async saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation> {
    const id = crypto.randomUUID();
    const item: Escalation = { ...esc, id, at: new Date().toISOString() };
    this.escalations.set(id, item);
    return item;
  }

  async getEscalations(status?: string): Promise<Escalation[]> {
    let list = Array.from(this.escalations.values());
    if (status) {
      list = list.filter((e) => e.status === status);
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  async updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation> {
    const existing = this.escalations.get(id);
    if (!existing) throw new Error(`Escalation ${id} not found`);
    const updated = { ...existing, ...updates };
    this.escalations.set(id, updated);
    return updated;
  }

  async saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog> {
    const id = crypto.randomUUID();
    const item: CorrectionLog = { ...log, id, at: new Date().toISOString() };
    this.correctionLogs.set(id, item);
    return item;
  }

  async getCorrectionLogs(kind?: string): Promise<CorrectionLog[]> {
    let list = Array.from(this.correctionLogs.values());
    if (kind) {
      list = list.filter((l) => l.kind === kind);
    }
    return list;
  }

  async saveCalibrationChange(c: Omit<CalibrationChange, 'id' | 'at'>): Promise<CalibrationChange> {
    const id = crypto.randomUUID();
    const item: CalibrationChange = { ...c, id, at: new Date().toISOString() };
    this.calibrationChanges.set(id, item);
    return item;
  }

  async getCalibrationChanges(): Promise<CalibrationChange[]> {
    return Array.from(this.calibrationChanges.values()).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }

  async saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint> {
    const id = crypto.randomUUID();
    const item: ScopedConstraint = { ...sc, id, at: new Date().toISOString() };
    this.scopedConstraints.set(id, item);
    return item;
  }

  async getScopedConstraints(status?: string): Promise<ScopedConstraint[]> {
    let list = Array.from(this.scopedConstraints.values());
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return list;
  }

  /**
   * Hybrid Search: Combines keyword search (BM25 simulation) with similarity scoring
   * using Reciprocal Rank Fusion (RRF) (§10.4).
   */
  async hybridSearch(
    query: string,
    options: {
      visibility: Visibility[];
      as_of_date?: string | Date;
      limit?: number;
      embedding?: number[];
    }
  ): Promise<SearchResult[]> {
    const limit = options.limit ?? 10;
    const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];

    for (const span of this.spans.values()) {
      const revision = this.revisions.get(span.revision_id);
      if (!revision) continue;
      const entry = this.entries.get(revision.entry_id);
      if (!entry) continue;

      // Visibility filter
      if (!options.visibility.includes(entry.visibility)) {
        continue;
      }

      // Temporal filter (§10.4)
      if (options.as_of_date) {
        const tempCheck = isTemporallyValid(revision, options.as_of_date);
        if (!tempCheck.valid) continue;
      }

      // Compute keyword match score (BM25 simulation)
      const textLower = span.text_exact.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (textLower.includes(token)) matchCount++;
      }

      const bm25Score = queryTokens.length > 0 ? matchCount / queryTokens.length : 0;
      // Heuristic text similarity
      const similarity = bm25Score > 0 ? 0.5 + bm25Score * 0.45 : 0.1;

      if (bm25Score > 0 || !query) {
        results.push({
          span,
          entry,
          revision,
          similarity,
          bm25Score,
          rrfScore: 0,
        });
      }
    }

    // Sort by BM25 to get rank
    results.sort((a, b) => b.bm25Score - a.bm25Score);
    const k = 60; // standard RRF constant
    results.forEach((res, rank) => {
      res.rrfScore = 1 / (k + rank + 1);
    });

    results.sort((a, b) => b.rrfScore - a.rrfScore);
    return results.slice(0, limit);
  }

  /**
   * CTE-equivalent graph traversal: TemporalExpand (§10.4)
   * Expands seed claims across valid active relations up to N hops.
   */
  async temporalExpand(options: TemporalExpandOptions): Promise<Claim[]> {
    const { seedClaimIds, t_q, hops = 2 } = options;
    const visited = new Set<string>(seedClaimIds);
    let frontier = new Set<string>(seedClaimIds);

    for (let hop = 0; hop < hops; hop++) {
      const nextFrontier = new Set<string>();

      for (const claimId of frontier) {
        const relations = await this.getRelationsForClaim(claimId);
        for (const rel of relations) {
          if (rel.status !== 'accepted') continue;

          // Temporal check on relation
          const relTemp = isTemporallyValid(rel, t_q);
          if (!relTemp.valid) continue;

          const otherEndId = rel.src_claim === claimId ? rel.dst_claim : rel.src_claim;
          if (visited.has(otherEndId)) continue;

          const otherClaim = this.claims.get(otherEndId);
          if (!otherClaim) continue;

          // Temporal check on other end claim
          const claimTemp = isTemporallyValid(otherClaim, t_q);
          if (!claimTemp.valid) continue;

          visited.add(otherEndId);
          nextFrontier.add(otherEndId);
        }
      }

      frontier = nextFrontier;
      if (frontier.size === 0) break;
    }

    return Array.from(visited)
      .map((id) => this.claims.get(id))
      .filter((c): c is Claim => c != null);
  }
}
