import type {
  Annotation,
  BookingRequest,
  CalibrationChange,
  Claim,
  CorrectionLog,
  Entry,
  EntryRevision,
  Escalation,
  Evidence,
  Facet,
  ImportJob,
  MediaAsset,
  Relation,
  ScopedConstraint,
  Span,
  TopologyReport,
  Venture,
  Visibility,
} from '@living-portfolio/core';
import { isTemporallyValid } from '@living-portfolio/core';
import { InMemoryMediaStore } from './media-helpers.js';

export interface SearchResult {
  span: Span;
  entry: Entry;
  revision: EntryRevision;
  similarity: number;
  bm25Score: number;
  rrfScore: number;
}

export interface TemporalExpandOptions {
  seedClaimIds?: string[];
  seed_claim_ids?: string[];
  t_q: string | Date;
  hops?: number; // default 2
  max_hops?: number;
}

export interface IPortfolioRepository {
  // Ventures
  createVenture(v: Omit<Venture, 'id'>): Promise<Venture>;
  getVenture(id: string): Promise<Venture | null>;
  listVentures(): Promise<Venture[]>;

  // Entries & Revisions
  createEntry(e: Omit<Entry, 'id' | 'created_at'>, rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }): Promise<{ entry: Entry; revision: EntryRevision }>;
  getEntryBySlug(slug: string, allowedVisibilities?: Visibility[]): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null>;
  getEntry(id: string, allowedVisibilities?: Visibility[]): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null>;
  updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null>;
  deleteEntry(id: string): Promise<{ deletedRevisions: number; deletedSpans: number; deletedClaims: number; deletedRelations: number; deletedFacets: number }>;
  listEntries(filter?: { visibility?: Visibility[]; venture_id?: string }): Promise<Entry[]>;
  createRevision(entry_id: string, rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }): Promise<EntryRevision>;
  getRevisions(entry_id: string): Promise<EntryRevision[]>;

  // Spans & Annotations
  saveSpans(spans: Omit<Span, 'id'>[]): Promise<Span[]>;
  getSpans(revision_id: string): Promise<Span[]>;
  saveAnnotation(a: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation>;
  updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation | null>;
  getAnnotations(span_id: string): Promise<Annotation[]>;
  listAnnotationsForRevision(revision_id: string): Promise<Annotation[]>;

  // Facets
  saveFacet(f: Omit<Facet, 'id'>): Promise<Facet>;
  updateFacet(id: string, updates: Partial<Facet>): Promise<Facet | null>;
  getFacetsForEntry(entry_id: string): Promise<Facet[]>;

  // Claims & Relations
  saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim>;
  updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null>;
  getClaimsForRevision(revision_id: string): Promise<Claim[]>;
  listClaimsForEntry(entry_id: string): Promise<Claim[]>;
  saveRelation(r: Omit<Relation, 'id' | 'recorded_at'>): Promise<Relation>;
  updateRelation(id: string, updates: Partial<Relation>): Promise<Relation | null>;
  getRelationsForClaim(claim_id: string): Promise<Relation[]>;
  listAcceptedRelations(): Promise<Relation[]>;

  // Evidence
  saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence>;
  getEvidenceForEntry(entry_id: string): Promise<Evidence[]>;

  // Media
  saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset>;
  getMedia(id: string): Promise<MediaAsset | null>;
  listMedia(): Promise<MediaAsset[]>;
  deleteMedia(id: string): Promise<boolean>;
  getTotalMediaBytes(): Promise<number>;

  // Operational: Escalations, Calibration, Logs, Bookings
  saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation>;
  getEscalations(status?: string): Promise<Escalation[]>;
  getEscalation(id: string): Promise<Escalation | null>;
  getEscalationByStatusToken(token: string): Promise<Escalation | null>;
  updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation>;
  saveBooking(booking: Omit<BookingRequest, 'id' | 'at'>): Promise<BookingRequest>;
  getBookings(status?: string): Promise<BookingRequest[]>;
  getBooking(id: string): Promise<BookingRequest | null>;
  saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog>;
  getCorrectionLogs(kind?: string): Promise<CorrectionLog[]>;
  saveCalibrationChange(c: Omit<CalibrationChange, 'id' | 'at'>): Promise<CalibrationChange>;
  getCalibrationChanges(): Promise<CalibrationChange[]>;
  saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint>;
  getScopedConstraints(status?: string): Promise<ScopedConstraint[]>;
  updateScopedConstraint(id: string, updates: Partial<Pick<ScopedConstraint, 'status'>>): Promise<ScopedConstraint | null>;

  // Topology Reports (§11, Fix 17)
  saveTopologyReport(report: Omit<TopologyReport, 'id' | 'at'>): Promise<TopologyReport>;
  getTopologyReports(status?: string): Promise<TopologyReport[]>;
  updateTopologyReport(id: string, updates: Partial<TopologyReport>): Promise<TopologyReport | null>;

  // Resumable Import Jobs (§13.6, Fix 21)
  createImportJob(job: Omit<ImportJob, 'id' | 'created_at' | 'updated_at'>): Promise<ImportJob>;
  getImportJob(id: string): Promise<ImportJob | null>;
  updateImportJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null>;


  // Search & Graph Traversal
  hybridSearch(query: string, options: {
    visibility: Visibility[];
    as_of_date?: string | Date;
    limit?: number;
    embedding?: number[];
  }): Promise<SearchResult[]>;

  temporalExpand(options: TemporalExpandOptions): Promise<Claim[]>;

  // Vectors & Embeddings (§8, Fix 8, P3)
  saveChunkVectors(vectors: Array<{
    chunk_id: string;
    vector: number[];
    text_snippet: string;
    model_id?: string;
    model_version?: string;
    dim?: number;
  }>): Promise<ChunkVectorRecord[]>;
  getChunkVectors(chunk_id: string): Promise<ChunkVectorRecord[]>;
  getChunkVectorsForRevision(revision_id: string): Promise<ChunkVectorRecord[]>;

  // BudgetGovernor Ledger (§13.5, B1-B4, Fix 11)
  getGovernorLedger(provider_id: string, day_utc: string): Promise<GovernorLedgerEntry | null>;
  saveGovernorLedger(ledger: GovernorLedgerEntry): Promise<GovernorLedgerEntry>;

  // Subsystem Health & Readiness (WP-2.5, Fix 8, F3)
  checkHealth?(): Promise<boolean>;
}

export interface GovernorLedgerEntry {
  id?: string;
  provider_id: string;
  day_utc: string;
  visitor_tokens: number;
  owner_tokens: number;
  background_tokens: number;
  requests_count: number;
  last_reset: string;
  is_rate_limited_until?: string | null;
  effective_tpm_discount: number;
  updated_at?: string;
}

export interface ChunkVectorRecord {
  id: string;
  chunk_id: string;
  vector: number[];
  text_snippet: string;
  embedding_set_id?: string;
}

/**
 * In-memory repository implementing IPortfolioRepository.
 *
 * @deprecated In-memory storage is deprecated for production deployments (§13.10, Fix 7, P1).
 * Use `PostgresPortfolioRepository` for persistent production environments,
 * or `DualWritePortfolioRepository` for verification and migration harnesses.
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
  private media = new InMemoryMediaStore();
  private escalations = new Map<string, Escalation>();
  private bookings = new Map<string, BookingRequest>();
  private correctionLogs = new Map<string, CorrectionLog>();
  private calibrationChanges = new Map<string, CalibrationChange>();
  private scopedConstraints = new Map<string, ScopedConstraint>();
  private topologyReports = new Map<string, TopologyReport>();
  private importJobs = new Map<string, ImportJob>();
  private chunkVectors = new Map<string, ChunkVectorRecord>();
  private governorLedgers = new Map<string, GovernorLedgerEntry>();

  async createVenture(v: Omit<Venture, 'id'>): Promise<Venture> {
    const id = (v as any).id ?? crypto.randomUUID();
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
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<{ entry: Entry; revision: EntryRevision }> {
    for (const entry of this.entries.values()) {
      if (entry.slug === e.slug) {
        throw new Error(`Duplicate entry slug: '${e.slug}' already exists`);
      }
    }

    const entryId = (e as any).id ?? crypto.randomUUID();
    const revId = (rev as any).id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const writtenAt = rev.written_at ?? now;

    const revision: EntryRevision = {
      ...rev,
      id: revId,
      entry_id: entryId,
      written_at: writtenAt,
      temporal_level: rev.temporal_level ?? 'estimated',
      is_hindsight: rev.is_hindsight ?? false,
    };
    this.revisions.set(revId, revision);

    const entry: Entry = {
      ...e,
      id: entryId,
      title: e.title ?? 'Untitled',
      profile: e.profile ?? 'case-study',
      view: (e.view as any) ?? 'article',
      visibility: e.visibility ?? 'private',
      current_revision_id: revId,
      created_at: (e as any).created_at ?? writtenAt,
    };
    this.entries.set(entryId, entry);

    return { entry, revision };
  }

  async getEntryBySlug(
    slug: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    for (const entry of this.entries.values()) {
      if (entry.slug === slug) {
        if (allowedVisibilities && !allowedVisibilities.includes(entry.visibility)) {
          return null;
        }
        const rev = entry.current_revision_id ? this.revisions.get(entry.current_revision_id) || null : null;
        return { entry, currentRevision: rev };
      }
    }
    return null;
  }

  async getEntry(
    id: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;
    if (allowedVisibilities && !allowedVisibilities.includes(entry.visibility)) {
      return null;
    }
    const rev = entry.current_revision_id ? this.revisions.get(entry.current_revision_id) || null : null;
    return { entry, currentRevision: rev };
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
    const existing = this.entries.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    this.entries.set(id, updated);
    return updated;
  }

  async deleteEntry(id: string): Promise<{ deletedRevisions: number; deletedSpans: number; deletedClaims: number; deletedRelations: number; deletedFacets: number }> {
    let deletedRevisions = 0;
    let deletedSpans = 0;
    let deletedClaims = 0;
    let deletedRelations = 0;
    let deletedFacets = 0;

    const revIds = new Set<string>();
    for (const [revId, rev] of this.revisions.entries()) {
      if (rev.entry_id === id) {
        revIds.add(revId);
        this.revisions.delete(revId);
        deletedRevisions++;
      }
    }

    const spanIds = new Set<string>();
    for (const [spanId, span] of this.spans.entries()) {
      if (revIds.has(span.revision_id)) {
        spanIds.add(spanId);
        this.spans.delete(spanId);
        deletedSpans++;
      }
    }

    for (const [annId, ann] of this.annotations.entries()) {
      if (spanIds.has(ann.span_id)) {
        this.annotations.delete(annId);
      }
    }

    const claimIds = new Set<string>();
    for (const [claimId, claim] of this.claims.entries()) {
      if (revIds.has(claim.revision_id)) {
        claimIds.add(claimId);
        this.claims.delete(claimId);
        deletedClaims++;
      }
    }

    for (const [relId, rel] of this.relations.entries()) {
      if (claimIds.has(rel.src_claim) || claimIds.has(rel.dst_claim)) {
        this.relations.delete(relId);
        deletedRelations++;
      }
    }

    for (const [facetId, facet] of this.facets.entries()) {
      if (facet.entry_id === id) {
        this.facets.delete(facetId);
        deletedFacets++;
      }
    }

    for (const [evId, ev] of this.evidence.entries()) {
      if (ev.entry_id === id) {
        this.evidence.delete(evId);
      }
    }

    this.entries.delete(id);
    return { deletedRevisions, deletedSpans, deletedClaims, deletedRelations, deletedFacets };
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
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<EntryRevision> {
    const revId = (rev as any).id ?? crypto.randomUUID();
    const revision: EntryRevision = {
      ...rev,
      id: revId,
      entry_id,
      written_at: rev.written_at ?? new Date().toISOString(),
      temporal_level: rev.temporal_level ?? 'estimated',
      is_hindsight: rev.is_hindsight ?? false,
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
      const id = (s as any).id ?? crypto.randomUUID();
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
    const id = (a as any).id ?? crypto.randomUUID();
    const annotation: Annotation = {
      ...a,
      id,
      created_at: (a as any).created_at ?? new Date().toISOString(),
    };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation | null> {
    const existing = this.annotations.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    this.annotations.set(id, updated);
    return updated;
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
    const id = (f as any).id ?? crypto.randomUUID();
    const facet: Facet = { ...f, id };
    this.facets.set(id, facet);
    return facet;
  }

  async updateFacet(id: string, updates: Partial<Facet>): Promise<Facet | null> {
    const existing = this.facets.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    this.facets.set(id, updated);
    return updated;
  }

  async getFacetsForEntry(entry_id: string): Promise<Facet[]> {
    return Array.from(this.facets.values()).filter((f) => f.entry_id === entry_id);
  }

  async saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim> {
    const id = (c as any).id ?? crypto.randomUUID();
    const claim: Claim = {
      ...c,
      id,
      recorded_at: (c as any).recorded_at ?? new Date().toISOString(),
    };
    this.claims.set(id, claim);
    return claim;
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    const existing = this.claims.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    this.claims.set(id, updated);
    return updated;
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
    const id = (r as any).id ?? crypto.randomUUID();
    const relation: Relation = {
      ...r,
      id,
      recorded_at: (r as any).recorded_at ?? new Date().toISOString(),
    };
    this.relations.set(id, relation);
    return relation;
  }

  async updateRelation(id: string, updates: Partial<Relation>): Promise<Relation | null> {
    const existing = this.relations.get(id);
    if (!existing) return null;
    const updated: Relation = {
      ...existing,
      ...updates,
      id,
    };
    this.relations.set(id, updated);
    return updated;
  }

  async getRelationsForClaim(claim_id: string): Promise<Relation[]> {
    return Array.from(this.relations.values()).filter(
      (r) => r.src_claim === claim_id || r.dst_claim === claim_id
    );
  }

  async listAcceptedRelations(): Promise<Relation[]> {
    return Array.from(this.relations.values())
      .filter((r) => r.status === 'accepted')
      .map((r) => {
        const dstClaim = this.claims.get(r.dst_claim);
        const dstRev = dstClaim ? this.revisions.get(dstClaim.revision_id) : undefined;
        const dstEntry = dstRev ? this.entries.get(dstRev.entry_id) : undefined;
        return {
          ...r,
          ...(dstClaim ? { dst_claim_text: dstClaim.text, dst_claim_scope: dstClaim.scope } : {}),
          ...(dstEntry ? { dst_entry_slug: dstEntry.slug, dst_entry_title: dstEntry.title } : {}),
          ...(dstRev ? { dst_written_at: dstRev.written_at } : {}),
        };
      });
  }

  async saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence> {
    const id = (ev as any).id ?? crypto.randomUUID();
    const item: Evidence = { ...ev, id };
    this.evidence.set(id, item);
    return item;
  }

  async getEvidenceForEntry(entry_id: string): Promise<Evidence[]> {
    return Array.from(this.evidence.values()).filter((e) => e.entry_id === entry_id);
  }

  async saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset> { return this.media.save(m); }
  async getMedia(id: string): Promise<MediaAsset | null> { return this.media.get(id); }
  async listMedia(): Promise<MediaAsset[]> { return this.media.list(); }
  async deleteMedia(id: string): Promise<boolean> { return this.media.delete(id); }
  async getTotalMediaBytes(): Promise<number> { return this.media.totalBytes(); }

  async saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation> {
    const id = (esc as any).id ?? crypto.randomUUID();
    const item: Escalation = {
      ...esc,
      id,
      at: (esc as any).at ?? new Date().toISOString(),
    };
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

  async getEscalation(id: string): Promise<Escalation | null> {
    return this.escalations.get(id) || null;
  }

  async getEscalationByStatusToken(token: string): Promise<Escalation | null> {
    for (const esc of this.escalations.values()) {
      if (esc.status_token === token) return esc;
    }
    return null;
  }

  async updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation> {
    const existing = this.escalations.get(id);
    if (!existing) throw new Error(`Escalation ${id} not found`);
    const updated = { ...existing, ...updates };
    this.escalations.set(id, updated);
    return updated;
  }

  async saveBooking(booking: Omit<BookingRequest, 'id' | 'at'>): Promise<BookingRequest> {
    const id = (booking as any).id ?? crypto.randomUUID();
    const item: BookingRequest = {
      ...booking,
      id,
      at: (booking as any).at ?? new Date().toISOString(),
    };
    this.bookings.set(id, item);
    return item;
  }

  async getBookings(status?: string): Promise<BookingRequest[]> {
    let list = Array.from(this.bookings.values());
    if (status) {
      list = list.filter((b) => b.status === status);
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  async getBooking(id: string): Promise<BookingRequest | null> {
    return this.bookings.get(id) || null;
  }

  async saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog> {
    const id = (log as any).id ?? crypto.randomUUID();
    const item: CorrectionLog = {
      ...log,
      id,
      at: (log as any).at ?? new Date().toISOString(),
    };
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
    const id = (c as any).id ?? crypto.randomUUID();
    const item: CalibrationChange = {
      ...c,
      id,
      at: (c as any).at ?? new Date().toISOString(),
    };
    this.calibrationChanges.set(id, item);
    return item;
  }

  async getCalibrationChanges(): Promise<CalibrationChange[]> {
    return Array.from(this.calibrationChanges.values()).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }

  async saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint> {
    const id = (sc as any).id ?? crypto.randomUUID();
    const item: ScopedConstraint = {
      ...sc,
      id,
      at: (sc as any).at ?? new Date().toISOString(),
    };
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

  async updateScopedConstraint(id: string, updates: Partial<Pick<ScopedConstraint, 'status'>>): Promise<ScopedConstraint | null> {
    const existing = this.scopedConstraints.get(id);
    if (!existing) return null;
    const updated: ScopedConstraint = {
      ...existing,
      ...updates,
    };
    this.scopedConstraints.set(id, updated);
    return updated;
  }

  async saveTopologyReport(report: Omit<TopologyReport, 'id' | 'at'>): Promise<TopologyReport> {
    const id = (report as any).id ?? crypto.randomUUID();
    const item: TopologyReport = {
      ...report,
      id,
      at: (report as any).at ?? new Date().toISOString(),
    };
    this.topologyReports.set(id, item);
    return item;
  }

  async getTopologyReports(status?: string): Promise<TopologyReport[]> {
    let list = Array.from(this.topologyReports.values());
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.sort((a, b) => b.confidence - a.confidence);
  }

  async updateTopologyReport(id: string, updates: Partial<TopologyReport>): Promise<TopologyReport | null> {
    const existing = this.topologyReports.get(id);
    if (!existing) return null;
    const updated: TopologyReport = {
      ...existing,
      ...updates,
      id,
    };
    this.topologyReports.set(id, updated);
    return updated;
  }

  async createImportJob(job: Omit<ImportJob, 'id' | 'created_at' | 'updated_at'>): Promise<ImportJob> {
    const id = (job as any).id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const item: ImportJob = {
      ...job,
      id,
      created_at: now,
      updated_at: now,
    };
    this.importJobs.set(id, item);
    return item;
  }

  async getImportJob(id: string): Promise<ImportJob | null> {
    return this.importJobs.get(id) || null;
  }

  async updateImportJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null> {
    const existing = this.importJobs.get(id);
    if (!existing) return null;
    const updated: ImportJob = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };
    this.importJobs.set(id, updated);
    return updated;
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
    const seeds = options.seedClaimIds ?? options.seed_claim_ids ?? [];
    const hops = options.hops ?? options.max_hops ?? 2;
    const { t_q } = options;
    const visited = new Set<string>(seeds);
    let frontier = new Set<string>(seeds);

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

  // --- Vectors & Embeddings (§8, Fix 8, P3) ---
  async saveChunkVectors(vectors: Array<{
    chunk_id: string;
    vector: number[];
    text_snippet: string;
    model_id?: string;
    model_version?: string;
    dim?: number;
  }>): Promise<ChunkVectorRecord[]> {
    const results: ChunkVectorRecord[] = [];
    for (const v of vectors) {
      const id = (v as any).id ?? crypto.randomUUID();
      const rec: ChunkVectorRecord = {
        id,
        chunk_id: v.chunk_id,
        vector: v.vector,
        text_snippet: v.text_snippet,
        embedding_set_id: (v as any).embedding_set_id ?? 'in-memory-embedding-set',
      };
      this.chunkVectors.set(id, rec);
      results.push(rec);
    }
    return results;
  }

  async getChunkVectors(chunk_id: string): Promise<ChunkVectorRecord[]> {
    return Array.from(this.chunkVectors.values()).filter((v) => v.chunk_id === chunk_id);
  }

  async getChunkVectorsForRevision(revision_id: string): Promise<ChunkVectorRecord[]> {
    const revisionSpans = await this.getSpans(revision_id);
    const spanIds = new Set(revisionSpans.map((s) => s.id));
    return Array.from(this.chunkVectors.values()).filter((v) => spanIds.has(v.chunk_id));
  }

  // --- BudgetGovernor Ledger (§13.5, B1-B4, Fix 11) ---
  async getGovernorLedger(provider_id: string, day_utc: string): Promise<GovernorLedgerEntry | null> {
    const key = `${provider_id}:${day_utc}`;
    const found = this.governorLedgers.get(key);
    return found ? { ...found } : null;
  }

  async saveGovernorLedger(ledger: GovernorLedgerEntry): Promise<GovernorLedgerEntry> {
    const key = `${ledger.provider_id}:${ledger.day_utc}`;
    const entry: GovernorLedgerEntry = {
      id: ledger.id || crypto.randomUUID(),
      provider_id: ledger.provider_id,
      day_utc: ledger.day_utc,
      visitor_tokens: ledger.visitor_tokens,
      owner_tokens: ledger.owner_tokens,
      background_tokens: ledger.background_tokens,
      requests_count: ledger.requests_count,
      last_reset: ledger.last_reset,
      is_rate_limited_until: ledger.is_rate_limited_until,
      effective_tpm_discount: ledger.effective_tpm_discount,
      updated_at: new Date().toISOString(),
    };
    this.governorLedgers.set(key, entry);
    return { ...entry };
  }

  // --- Subsystem Health & Readiness (WP-2.5, Fix 8, F3) ---
  async checkHealth(): Promise<boolean> {
    return true;
  }
}
