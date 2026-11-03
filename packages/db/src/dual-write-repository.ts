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
import type {
  IPortfolioRepository,
  SearchResult,
  TemporalExpandOptions,
  ChunkVectorRecord,
  GovernorLedgerEntry,
} from './repository.js';

export interface ShadowOperationMetric {
  calls: number;
  matches: number;
  mismatches: number;
  shadowErrors: number;
  primaryDurationTotalMs: number;
  shadowDurationTotalMs: number;
}

export interface ShadowMismatchEvent {
  operation: string;
  timestamp: string;
  diffReason?: string;
  primarySummary?: any;
  shadowSummary?: any;
}

export interface ShadowMetrics {
  totalCalls: number;
  totalMatches: number;
  totalMismatches: number;
  totalShadowErrors: number;
  operations: Record<string, ShadowOperationMetric>;
  recentMismatches: ShadowMismatchEvent[];
  health: 'HEALTHY' | 'DEGRADED' | 'DRIFT_DETECTED';
}

export interface DualWriteOptions {
  primary: IPortfolioRepository;
  shadow: IPortfolioRepository;
  shadowWrites?: boolean;
  shadowReads?: boolean;
  recordMetrics?: boolean;
  strictParity?: boolean;
  maxRecentMismatches?: number;
  onMismatch?: (event: ShadowMismatchEvent) => void;
}

export class ParityMismatchError extends Error {
  constructor(
    public readonly operation: string,
    public readonly diffReason: string,
    public readonly primaryResult: any,
    public readonly shadowResult: any
  ) {
    super(`[ParityMismatchError] Divergence in '${operation}': ${diffReason}`);
    this.name = 'ParityMismatchError';
  }
}

/**
 * Deep parity comparator between primary and shadow operation results.
 * Handles Date objects, ISO strings, null vs undefined equivalences,
 * array ID-set ordering, and numeric epsilon matching.
 */
export function compareResults(
  op: string,
  primary: any,
  shadow: any,
  path = ''
): { isMatch: boolean; diffReason?: string } {
  if (primary === shadow) return { isMatch: true };

  // Treat undefined and null as equivalent for optional record properties
  if (
    (primary === undefined && shadow === null) ||
    (primary === null && shadow === undefined)
  ) {
    return { isMatch: true };
  }

  // Treat undefined and boolean false as equivalent for default boolean schema flags (e.g. is_hindsight, booked)
  if (
    (primary === undefined && shadow === false) ||
    (primary === false && shadow === undefined)
  ) {
    return { isMatch: true };
  }

  // Treat undefined and 'estimated' as equivalent for temporal_level schema default
  if (
    (primary === undefined && shadow === 'estimated') ||
    (primary === 'estimated' && shadow === undefined)
  ) {
    return { isMatch: true };
  }

  // Treat undefined and 0 as equivalent for numeric counter defaults (e.g. token_count, citation_clicks)
  if (
    (primary === undefined && shadow === 0) ||
    (primary === 0 && shadow === undefined)
  ) {
    return { isMatch: true };
  }

  if (primary == null || shadow == null) {
    return {
      isMatch: false,
      diffReason: `Nullability mismatch at '${path || op}': primary=${JSON.stringify(
        primary
      )}, shadow=${JSON.stringify(shadow)}`,
    };
  }

  // Numbers (floating point tolerance)
  if (typeof primary === 'number' && typeof shadow === 'number') {
    if (Math.abs(primary - shadow) < 0.001) return { isMatch: true };
    return {
      isMatch: false,
      diffReason: `Numeric mismatch at '${path || op}': ${primary} !== ${shadow}`,
    };
  }

  // Dates or ISO Date Strings
  const isDateLike = (v: any) =>
    v instanceof Date ||
    (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v));
  if (isDateLike(primary) && isDateLike(shadow)) {
    const tA = new Date(primary).getTime();
    const tB = new Date(shadow).getTime();
    if (Math.abs(tA - tB) <= 1000) return { isMatch: true };
    return {
      isMatch: false,
      diffReason: `Date timestamp mismatch at '${path || op}': ${primary} vs ${shadow}`,
    };
  }

  // Arrays
  if (Array.isArray(primary) && Array.isArray(shadow)) {
    if (primary.length !== shadow.length) {
      return {
        isMatch: false,
        diffReason: `Array length mismatch at '${path || op}': primary=${primary.length}, shadow=${shadow.length}`,
      };
    }
    // If elements have 'id', match by id
    if (primary.length > 0 && primary[0] && typeof primary[0] === 'object' && 'id' in primary[0]) {
      const shadowMap = new Map<string, any>();
      for (const item of shadow) {
        if (item && 'id' in item) shadowMap.set(String(item.id), item);
      }
      for (let i = 0; i < primary.length; i++) {
        const pItem = primary[i];
        const sItem = shadowMap.get(String(pItem.id));
        if (!sItem) {
          return {
            isMatch: false,
            diffReason: `Missing element id '${pItem.id}' in shadow at '${path || op}[${i}]'`,
          };
        }
        const cmp = compareResults(op, pItem, sItem, `${path || op}[id=${pItem.id}]`);
        if (!cmp.isMatch) return cmp;
      }
      return { isMatch: true };
    }

    // Default sequential array comparison
    for (let i = 0; i < primary.length; i++) {
      const cmp = compareResults(op, primary[i], shadow[i], `${path || op}[${i}]`);
      if (!cmp.isMatch) return cmp;
    }
    return { isMatch: true };
  }

  // Objects
  if (typeof primary === 'object' && typeof shadow === 'object') {
    const allKeys = new Set([...Object.keys(primary), ...Object.keys(shadow)]);
    for (const key of allKeys) {
      // Ignore internal test fixture metadata
      if (key.startsWith('_')) continue;
      const cmp = compareResults(op, primary[key], shadow[key], path ? `${path}.${key}` : key);
      if (!cmp.isMatch) return cmp;
    }
    return { isMatch: true };
  }

  return {
    isMatch: false,
    diffReason: `Value mismatch at '${path || op}': primary=${JSON.stringify(
      primary
    )}, shadow=${JSON.stringify(shadow)}`,
  };
}

/**
 * DualWritePortfolioRepository (Fix 8, Fix 10, OSR-15)
 *
 * Implements transparent dual-engine replication and shadow verification:
 * - Writes to primary first, then synchronously replicates to shadow engine with preserved IDs.
 * - Reads query primary and shadow concurrently, verifies result parity, and tracks operational shadow metrics.
 * - Errors or mismatches in shadow never disrupt user-facing primary traffic unless strictParity is requested.
 */
export class DualWritePortfolioRepository implements IPortfolioRepository {
  private primary: IPortfolioRepository;
  private shadow: IPortfolioRepository;
  private options: Required<Omit<DualWriteOptions, 'onMismatch'>> & {
    onMismatch?: (event: ShadowMismatchEvent) => void;
  };

  private operations: Record<string, ShadowOperationMetric> = {};
  private recentMismatches: ShadowMismatchEvent[] = [];
  private totalCalls = 0;
  private totalMatches = 0;
  private totalMismatches = 0;
  private totalShadowErrors = 0;

  constructor(options: DualWriteOptions) {
    this.primary = options.primary;
    this.shadow = options.shadow;
    this.options = {
      primary: options.primary,
      shadow: options.shadow,
      shadowWrites: options.shadowWrites ?? true,
      shadowReads: options.shadowReads ?? true,
      recordMetrics: options.recordMetrics ?? true,
      strictParity: options.strictParity ?? false,
      maxRecentMismatches: options.maxRecentMismatches ?? 50,
      onMismatch: options.onMismatch,
    };
  }

  getPrimary(): IPortfolioRepository {
    return this.primary;
  }

  getShadow(): IPortfolioRepository {
    return this.shadow;
  }

  getShadowMetrics(): ShadowMetrics {
    let health: 'HEALTHY' | 'DEGRADED' | 'DRIFT_DETECTED' = 'HEALTHY';
    if (this.totalMismatches > 0) {
      health = 'DRIFT_DETECTED';
    } else if (this.totalShadowErrors > 0) {
      health = 'DEGRADED';
    }

    return {
      totalCalls: this.totalCalls,
      totalMatches: this.totalMatches,
      totalMismatches: this.totalMismatches,
      totalShadowErrors: this.totalShadowErrors,
      operations: { ...this.operations },
      recentMismatches: [...this.recentMismatches],
      health,
    };
  }

  resetShadowMetrics(): void {
    this.operations = {};
    this.recentMismatches = [];
    this.totalCalls = 0;
    this.totalMatches = 0;
    this.totalMismatches = 0;
    this.totalShadowErrors = 0;
  }

  private recordMetric(
    op: string,
    isMatch: boolean,
    isError: boolean,
    pDuration: number,
    sDuration: number,
    diffReason?: string,
    primaryResult?: any,
    shadowResult?: any
  ) {
    if (!this.options.recordMetrics) return;

    this.totalCalls++;
    if (!this.operations[op]) {
      this.operations[op] = {
        calls: 0,
        matches: 0,
        mismatches: 0,
        shadowErrors: 0,
        primaryDurationTotalMs: 0,
        shadowDurationTotalMs: 0,
      };
    }

    const opStat = this.operations[op];
    opStat.calls++;
    opStat.primaryDurationTotalMs += pDuration;
    opStat.shadowDurationTotalMs += sDuration;

    if (isError) {
      opStat.shadowErrors++;
      this.totalShadowErrors++;
    } else if (isMatch) {
      opStat.matches++;
      this.totalMatches++;
    } else {
      opStat.mismatches++;
      this.totalMismatches++;

      const mismatchEvent: ShadowMismatchEvent = {
        operation: op,
        timestamp: new Date().toISOString(),
        diffReason,
        primarySummary: summarizeEntity(primaryResult),
        shadowSummary: summarizeEntity(shadowResult),
      };

      this.recentMismatches.push(mismatchEvent);
      if (this.recentMismatches.length > this.options.maxRecentMismatches) {
        this.recentMismatches.shift();
      }

      this.options.onMismatch?.(mismatchEvent);

      if (this.options.strictParity) {
        throw new ParityMismatchError(op, diffReason ?? 'Unknown parity difference', primaryResult, shadowResult);
      }
    }
  }

  private async executeRead<T>(
    op: string,
    primaryFn: () => Promise<T>,
    shadowFn: () => Promise<T>
  ): Promise<T> {
    const pStart = performance.now();
    const primaryResult = await primaryFn();
    const pDuration = performance.now() - pStart;

    if (!this.options.shadowReads) {
      return primaryResult;
    }

    const sStart = performance.now();
    try {
      const shadowResult = await shadowFn();
      const sDuration = performance.now() - sStart;
      const cmp = compareResults(op, primaryResult, shadowResult);
      this.recordMetric(op, cmp.isMatch, false, pDuration, sDuration, cmp.diffReason, primaryResult, shadowResult);
    } catch (err: any) {
      const sDuration = performance.now() - sStart;
      this.recordMetric(op, false, true, pDuration, sDuration, `Shadow read error: ${err.message}`, primaryResult, null);
      if (this.options.strictParity) {
        throw err;
      }
    }

    return primaryResult;
  }

  private async executeWrite<T>(
    op: string,
    primaryFn: () => Promise<T>,
    shadowFn: (primaryResult: T) => Promise<any>
  ): Promise<T> {
    const pStart = performance.now();
    const primaryResult = await primaryFn();
    const pDuration = performance.now() - pStart;

    if (!this.options.shadowWrites) {
      return primaryResult;
    }

    const sStart = performance.now();
    try {
      const shadowResult = await shadowFn(primaryResult);
      const sDuration = performance.now() - sStart;
      const cmp = compareResults(op, primaryResult, shadowResult);
      this.recordMetric(op, cmp.isMatch, false, pDuration, sDuration, cmp.diffReason, primaryResult, shadowResult);
    } catch (err: any) {
      const sDuration = performance.now() - sStart;
      this.recordMetric(op, false, true, pDuration, sDuration, `Shadow write error: ${err.message}`, primaryResult, null);
      if (this.options.strictParity) {
        throw err;
      }
    }

    return primaryResult;
  }

  async verifyParity(filter?: { venture_id?: string }): Promise<{
    isParityClean: boolean;
    mismatches: ShadowMismatchEvent[];
    metrics: ShadowMetrics;
  }> {
    // Read entity lists across both engines and verify complete alignment
    await this.listVentures();
    await this.listEntries(filter);
    await this.listAcceptedRelations();

    const metrics = this.getShadowMetrics();
    return {
      isParityClean: metrics.totalMismatches === 0 && metrics.totalShadowErrors === 0,
      mismatches: metrics.recentMismatches,
      metrics,
    };
  }

  // --- Ventures ---
  async createVenture(v: Omit<Venture, 'id'>): Promise<Venture> {
    return this.executeWrite(
      'createVenture',
      () => this.primary.createVenture(v),
      (created) => this.shadow.createVenture({ ...v, ...(created.id ? { id: created.id } : {}) } as any)
    );
  }

  async getVenture(id: string): Promise<Venture | null> {
    return this.executeRead(
      'getVenture',
      () => this.primary.getVenture(id),
      () => this.shadow.getVenture(id)
    );
  }

  async listVentures(): Promise<Venture[]> {
    return this.executeRead(
      'listVentures',
      () => this.primary.listVentures(),
      () => this.shadow.listVentures()
    );
  }

  // --- Entries & Revisions ---
  async createEntry(
    e: Omit<Entry, 'id' | 'created_at'>,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<{ entry: Entry; revision: EntryRevision }> {
    return this.executeWrite(
      'createEntry',
      () => this.primary.createEntry(e, rev),
      (res) =>
        this.shadow.createEntry(
          { ...e, id: res.entry.id, created_at: res.entry.created_at } as any,
          { ...rev, id: res.revision.id, written_at: res.revision.written_at } as any
        )
    );
  }

  async getEntryBySlug(
    slug: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    return this.executeRead(
      'getEntryBySlug',
      () => this.primary.getEntryBySlug(slug, allowedVisibilities),
      () => this.shadow.getEntryBySlug(slug, allowedVisibilities)
    );
  }

  async getEntry(
    id: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    return this.executeRead(
      'getEntry',
      () => this.primary.getEntry(id, allowedVisibilities),
      () => this.shadow.getEntry(id, allowedVisibilities)
    );
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
    return this.executeWrite(
      'updateEntry',
      () => this.primary.updateEntry(id, updates),
      () => this.shadow.updateEntry(id, updates)
    );
  }

  async deleteEntry(id: string): Promise<{
    deletedRevisions: number;
    deletedSpans: number;
    deletedClaims: number;
    deletedRelations: number;
    deletedFacets: number;
  }> {
    return this.executeWrite(
      'deleteEntry',
      () => this.primary.deleteEntry(id),
      () => this.shadow.deleteEntry(id)
    );
  }

  async listEntries(filter?: { visibility?: Visibility[]; venture_id?: string }): Promise<Entry[]> {
    return this.executeRead(
      'listEntries',
      () => this.primary.listEntries(filter),
      () => this.shadow.listEntries(filter)
    );
  }

  async createRevision(
    entry_id: string,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<EntryRevision> {
    return this.executeWrite(
      'createRevision',
      () => this.primary.createRevision(entry_id, rev),
      (res) =>
        this.shadow.createRevision(entry_id, {
          ...rev,
          id: res.id,
          written_at: res.written_at,
        } as any)
    );
  }

  async getRevisions(entry_id: string): Promise<EntryRevision[]> {
    return this.executeRead(
      'getRevisions',
      () => this.primary.getRevisions(entry_id),
      () => this.shadow.getRevisions(entry_id)
    );
  }

  // --- Spans & Annotations ---
  async saveSpans(spans: Omit<Span, 'id'>[]): Promise<Span[]> {
    return this.executeWrite(
      'saveSpans',
      () => this.primary.saveSpans(spans),
      (savedSpans) => this.shadow.saveSpans(savedSpans as any)
    );
  }

  async getSpans(revision_id: string): Promise<Span[]> {
    return this.executeRead(
      'getSpans',
      () => this.primary.getSpans(revision_id),
      () => this.shadow.getSpans(revision_id)
    );
  }

  async saveAnnotation(a: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation> {
    return this.executeWrite(
      'saveAnnotation',
      () => this.primary.saveAnnotation(a),
      (res) =>
        this.shadow.saveAnnotation({
          ...a,
          id: res.id,
          created_at: res.created_at,
        } as any)
    );
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation | null> {
    return this.executeWrite(
      'updateAnnotation',
      () => this.primary.updateAnnotation(id, updates),
      () => this.shadow.updateAnnotation(id, updates)
    );
  }

  async getAnnotations(span_id: string): Promise<Annotation[]> {
    return this.executeRead(
      'getAnnotations',
      () => this.primary.getAnnotations(span_id),
      () => this.shadow.getAnnotations(span_id)
    );
  }

  async listAnnotationsForRevision(revision_id: string): Promise<Annotation[]> {
    return this.executeRead(
      'listAnnotationsForRevision',
      () => this.primary.listAnnotationsForRevision(revision_id),
      () => this.shadow.listAnnotationsForRevision(revision_id)
    );
  }

  // --- Facets ---
  async saveFacet(f: Omit<Facet, 'id'>): Promise<Facet> {
    return this.executeWrite(
      'saveFacet',
      () => this.primary.saveFacet(f),
      (res) => this.shadow.saveFacet({ ...f, id: res.id } as any)
    );
  }

  async updateFacet(id: string, updates: Partial<Facet>): Promise<Facet | null> {
    return this.executeWrite(
      'updateFacet',
      () => this.primary.updateFacet(id, updates),
      () => this.shadow.updateFacet(id, updates)
    );
  }

  async getFacetsForEntry(entry_id: string): Promise<Facet[]> {
    return this.executeRead(
      'getFacetsForEntry',
      () => this.primary.getFacetsForEntry(entry_id),
      () => this.shadow.getFacetsForEntry(entry_id)
    );
  }

  // --- Claims & Relations ---
  async saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim> {
    return this.executeWrite(
      'saveClaim',
      () => this.primary.saveClaim(c),
      (res) =>
        this.shadow.saveClaim({
          ...c,
          id: res.id,
          recorded_at: res.recorded_at,
        } as any)
    );
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    return this.executeWrite(
      'updateClaim',
      () => this.primary.updateClaim(id, updates),
      () => this.shadow.updateClaim(id, updates)
    );
  }

  async getClaimsForRevision(revision_id: string): Promise<Claim[]> {
    return this.executeRead(
      'getClaimsForRevision',
      () => this.primary.getClaimsForRevision(revision_id),
      () => this.shadow.getClaimsForRevision(revision_id)
    );
  }

  async listClaimsForEntry(entry_id: string): Promise<Claim[]> {
    return this.executeRead(
      'listClaimsForEntry',
      () => this.primary.listClaimsForEntry(entry_id),
      () => this.shadow.listClaimsForEntry(entry_id)
    );
  }

  async saveRelation(r: Omit<Relation, 'id' | 'recorded_at'>): Promise<Relation> {
    return this.executeWrite(
      'saveRelation',
      () => this.primary.saveRelation(r),
      (res) =>
        this.shadow.saveRelation({
          ...r,
          id: res.id,
          recorded_at: res.recorded_at,
        } as any)
    );
  }

  async updateRelation(id: string, updates: Partial<Relation>): Promise<Relation | null> {
    return this.executeWrite(
      'updateRelation',
      () => this.primary.updateRelation(id, updates),
      () => this.shadow.updateRelation(id, updates)
    );
  }

  async getRelationsForClaim(claim_id: string): Promise<Relation[]> {
    return this.executeRead(
      'getRelationsForClaim',
      () => this.primary.getRelationsForClaim(claim_id),
      () => this.shadow.getRelationsForClaim(claim_id)
    );
  }

  async listAcceptedRelations(): Promise<Relation[]> {
    return this.executeRead(
      'listAcceptedRelations',
      () => this.primary.listAcceptedRelations(),
      () => this.shadow.listAcceptedRelations()
    );
  }

  // --- Evidence ---
  async saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence> {
    return this.executeWrite(
      'saveEvidence',
      () => this.primary.saveEvidence(ev),
      (res) => this.shadow.saveEvidence({ ...ev, id: res.id } as any)
    );
  }

  async getEvidenceForEntry(entry_id: string): Promise<Evidence[]> {
    return this.executeRead(
      'getEvidenceForEntry',
      () => this.primary.getEvidenceForEntry(entry_id),
      () => this.shadow.getEvidenceForEntry(entry_id)
    );
  }

  // --- Media ---
  async saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
    return this.executeWrite(
      'saveMedia',
      () => this.primary.saveMedia(m),
      (res) => this.shadow.saveMedia({ ...m, id: res.id } as any)
    );
  }

  async getMedia(id: string): Promise<MediaAsset | null> {
    return this.executeRead(
      'getMedia',
      () => this.primary.getMedia(id),
      () => this.shadow.getMedia(id)
    );
  }

  // --- Operational: Escalations, Calibration, Logs ---
  async saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation> {
    return this.executeWrite(
      'saveEscalation',
      () => this.primary.saveEscalation(esc),
      (res) => this.shadow.saveEscalation({ ...esc, id: res.id, at: res.at } as any)
    );
  }

  async getEscalations(status?: string): Promise<Escalation[]> {
    return this.executeRead(
      'getEscalations',
      () => this.primary.getEscalations(status),
      () => this.shadow.getEscalations(status)
    );
  }

  async getEscalation(id: string): Promise<Escalation | null> {
    return this.executeRead(
      'getEscalation',
      () => this.primary.getEscalation(id),
      () => this.shadow.getEscalation(id)
    );
  }

  async getEscalationByStatusToken(token: string): Promise<Escalation | null> {
    return this.executeRead(
      'getEscalationByStatusToken',
      () => this.primary.getEscalationByStatusToken(token),
      () => this.shadow.getEscalationByStatusToken(token)
    );
  }

  async updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation> {
    return this.executeWrite(
      'updateEscalation',
      () => this.primary.updateEscalation(id, updates),
      () => this.shadow.updateEscalation(id, updates)
    );
  }

  async saveBooking(booking: Omit<BookingRequest, 'id' | 'at'>): Promise<BookingRequest> {
    return this.executeWrite(
      'saveBooking',
      () => this.primary.saveBooking(booking),
      (res) => this.shadow.saveBooking({ ...booking, id: res.id, at: res.at } as any)
    );
  }

  async getBookings(status?: string): Promise<BookingRequest[]> {
    return this.executeRead(
      'getBookings',
      () => this.primary.getBookings(status),
      () => this.shadow.getBookings(status)
    );
  }

  async getBooking(id: string): Promise<BookingRequest | null> {
    return this.executeRead(
      'getBooking',
      () => this.primary.getBooking(id),
      () => this.shadow.getBooking(id)
    );
  }

  async saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog> {
    return this.executeWrite(
      'saveCorrection',
      () => this.primary.saveCorrection(log),
      (res) => this.shadow.saveCorrection({ ...log, id: res.id, at: res.at } as any)
    );
  }

  async getCorrectionLogs(kind?: string): Promise<CorrectionLog[]> {
    return this.executeRead(
      'getCorrectionLogs',
      () => this.primary.getCorrectionLogs(kind),
      () => this.shadow.getCorrectionLogs(kind)
    );
  }

  async saveCalibrationChange(c: Omit<CalibrationChange, 'id' | 'at'>): Promise<CalibrationChange> {
    return this.executeWrite(
      'saveCalibrationChange',
      () => this.primary.saveCalibrationChange(c),
      (res) => this.shadow.saveCalibrationChange({ ...c, id: res.id, at: res.at } as any)
    );
  }

  async getCalibrationChanges(): Promise<CalibrationChange[]> {
    return this.executeRead(
      'getCalibrationChanges',
      () => this.primary.getCalibrationChanges(),
      () => this.shadow.getCalibrationChanges()
    );
  }

  async saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint> {
    return this.executeWrite(
      'saveScopedConstraint',
      () => this.primary.saveScopedConstraint(sc),
      (res) => this.shadow.saveScopedConstraint({ ...sc, id: res.id, at: res.at } as any)
    );
  }

  async getScopedConstraints(status?: string): Promise<ScopedConstraint[]> {
    return this.executeRead(
      'getScopedConstraints',
      () => this.primary.getScopedConstraints(status),
      () => this.shadow.getScopedConstraints(status)
    );
  }

  async updateScopedConstraint(id: string, updates: Partial<Pick<ScopedConstraint, 'status'>>): Promise<ScopedConstraint | null> {
    return this.executeWrite(
      'updateScopedConstraint',
      () => this.primary.updateScopedConstraint(id, updates),
      (res) => (res ? this.shadow.updateScopedConstraint(id, updates) : Promise.resolve(null))
    );
  }

  // --- Topology Reports (§11, Fix 17) ---
  async saveTopologyReport(report: Omit<TopologyReport, 'id' | 'at'>): Promise<TopologyReport> {
    return this.executeWrite(
      'saveTopologyReport',
      () => this.primary.saveTopologyReport(report),
      (res) => this.shadow.saveTopologyReport({ ...report, id: res.id, at: res.at } as any)
    );
  }

  async getTopologyReports(status?: string): Promise<TopologyReport[]> {
    return this.executeRead(
      'getTopologyReports',
      () => this.primary.getTopologyReports(status),
      () => this.shadow.getTopologyReports(status)
    );
  }

  async updateTopologyReport(id: string, updates: Partial<TopologyReport>): Promise<TopologyReport | null> {
    return this.executeWrite(
      'updateTopologyReport',
      () => this.primary.updateTopologyReport(id, updates),
      (res) => (res ? this.shadow.updateTopologyReport(id, updates) : Promise.resolve(null))
    );
  }

  async createImportJob(job: Omit<ImportJob, 'id' | 'created_at' | 'updated_at'>): Promise<ImportJob> {
    return this.executeWrite(
      'createImportJob',
      () => this.primary.createImportJob(job),
      (res) => this.shadow.createImportJob({ ...job, id: res.id } as any)
    );
  }

  async getImportJob(id: string): Promise<ImportJob | null> {
    return this.executeRead(
      'getImportJob',
      () => this.primary.getImportJob(id),
      () => this.shadow.getImportJob(id)
    );
  }

  async updateImportJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null> {
    return this.executeWrite(
      'updateImportJob',
      () => this.primary.updateImportJob(id, updates),
      (res) => (res ? this.shadow.updateImportJob(id, updates) : Promise.resolve(null))
    );
  }

  // --- Search & Graph Traversal ---
  async hybridSearch(
    query: string,
    options: {
      visibility: Visibility[];
      as_of_date?: string | Date;
      limit?: number;
      embedding?: number[];
    }
  ): Promise<SearchResult[]> {
    return this.executeRead(
      'hybridSearch',
      () => this.primary.hybridSearch(query, options),
      () => this.shadow.hybridSearch(query, options)
    );
  }

  async temporalExpand(options: TemporalExpandOptions): Promise<Claim[]> {
    return this.executeRead(
      'temporalExpand',
      () => this.primary.temporalExpand(options),
      () => this.shadow.temporalExpand(options)
    );
  }

  // --- Vectors & Embeddings ---
  async saveChunkVectors(
    vectors: Array<{
      chunk_id: string;
      vector: number[];
      text_snippet: string;
      model_id?: string;
      model_version?: string;
      dim?: number;
    }>
  ): Promise<ChunkVectorRecord[]> {
    return this.executeWrite(
      'saveChunkVectors',
      () => this.primary.saveChunkVectors(vectors),
      (saved) =>
        this.shadow.saveChunkVectors(
          vectors.map((v, i) => ({
            ...v,
            ...(saved[i]?.id ? { id: saved[i].id } : {}),
          })) as any
        )
    );
  }

  async getChunkVectors(chunk_id: string): Promise<ChunkVectorRecord[]> {
    return this.executeRead(
      'getChunkVectors',
      () => this.primary.getChunkVectors(chunk_id),
      () => this.shadow.getChunkVectors(chunk_id)
    );
  }

  async getChunkVectorsForRevision(revision_id: string): Promise<ChunkVectorRecord[]> {
    return this.executeRead(
      'getChunkVectorsForRevision',
      () => this.primary.getChunkVectorsForRevision(revision_id),
      () => this.shadow.getChunkVectorsForRevision(revision_id)
    );
  }

  // --- BudgetGovernor Ledger (§13.5, B1-B4, Fix 11) ---
  async getGovernorLedger(provider_id: string, day_utc: string): Promise<GovernorLedgerEntry | null> {
    return this.executeRead(
      'getGovernorLedger',
      () => this.primary.getGovernorLedger(provider_id, day_utc),
      () => this.shadow.getGovernorLedger(provider_id, day_utc)
    );
  }

  async saveGovernorLedger(ledger: GovernorLedgerEntry): Promise<GovernorLedgerEntry> {
    return this.executeWrite(
      'saveGovernorLedger',
      () => this.primary.saveGovernorLedger(ledger),
      (saved) => this.shadow.saveGovernorLedger({ ...ledger, ...(saved.id ? { id: saved.id } : {}) })
    );
  }

  // --- Subsystem Health & Readiness (WP-2.5, Fix 8, F3) ---
  async checkHealth(): Promise<boolean> {
    try {
      const primaryOk = typeof (this.primary as any).checkHealth === 'function'
        ? await (this.primary as any).checkHealth()
        : true;
      const shadowOk = typeof (this.shadow as any).checkHealth === 'function'
        ? await (this.shadow as any).checkHealth()
        : true;
      return primaryOk && shadowOk;
    } catch {
      return false;
    }
  }
}

function summarizeEntity(val: any): any {
  if (val == null) return val;
  if (Array.isArray(val)) {
    return `Array(${val.length})`;
  }
  if (typeof val === 'object') {
    if ('id' in val) return { id: val.id, ...(val.slug ? { slug: val.slug } : {}) };
    return Object.keys(val);
  }
  return val;
}
