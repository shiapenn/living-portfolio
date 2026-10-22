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
  Venture,
  Visibility,
} from '@living-portfolio/core';
import { isTemporallyValid } from '@living-portfolio/core';
import { eq, inArray, desc, and, or, sql } from 'drizzle-orm';
import type { IPortfolioRepository, SearchResult, TemporalExpandOptions } from './repository.js';
import { createDrizzleDb, getDefaultDb, type LivingPortfolioDb } from './connection.js';
import * as schema from './schema/index.js';

function toIso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  return d;
}

function toIsoRequired(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return d;
}

function toDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  return new Date(d);
}

function mapVenture(row: typeof schema.ventures.$inferSelect): Venture {
  return {
    id: row.id,
    name: row.name,
    status: row.status as any,
    links: (row.links as any) ?? undefined,
    started_at: toIso(row.started_at),
    facets: (row.facets as any) ?? undefined,
  };
}

function mapEntry(row: typeof schema.entries.$inferSelect): Entry {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    profile: row.profile as any,
    view: row.view as any,
    visibility: row.visibility as any,
    venture_id: row.venture_id ?? undefined,
    current_revision_id: row.current_revision_id ?? undefined,
    created_at: toIsoRequired(row.created_at),
  };
}

function mapRevision(row: typeof schema.entryRevisions.$inferSelect): EntryRevision {
  return {
    id: row.id,
    entry_id: row.entry_id,
    body_md: row.body_md,
    body_hash: row.body_hash,
    written_at: toIsoRequired(row.written_at),
    valid_from: toIso(row.valid_from),
    valid_to: toIso(row.valid_to),
    temporal_level: row.temporal_level as any,
    valid_from_range_end: toIso(row.valid_from_range_end),
    is_hindsight: row.is_hindsight,
  };
}

function mapSpan(row: typeof schema.spans.$inferSelect): Span {
  return {
    id: row.id,
    revision_id: row.revision_id,
    ordinal: row.ordinal,
    start_off: row.start_off,
    end_off: row.end_off,
    text_exact: row.text_exact,
    prefix: row.prefix ?? undefined,
    suffix: row.suffix ?? undefined,
    token_count: row.token_count,
  };
}

function mapAnnotation(row: typeof schema.annotations.$inferSelect): Annotation {
  return {
    id: row.id,
    span_id: row.span_id,
    role: row.role as any,
    profile: row.profile as any,
    source: row.source as any,
    status: row.status as any,
    confidence: row.confidence ?? undefined,
    created_at: toIsoRequired(row.created_at),
  };
}

function mapFacet(row: typeof schema.facets.$inferSelect): Facet {
  return {
    id: row.id,
    entry_id: row.entry_id,
    revision_id: row.revision_id ?? undefined,
    key: row.key,
    value: row.value,
    source: row.source as any,
    status: row.status as any,
    confidence: row.confidence ?? undefined,
    source_span_id: row.source_span_id ?? undefined,
  };
}

function mapClaim(row: typeof schema.claims.$inferSelect): Claim {
  return {
    id: row.id,
    revision_id: row.revision_id,
    text: row.text,
    kind: row.kind as any,
    outcome_status: (row.outcome_status as any) ?? undefined,
    scope: (row.scope as any) ?? undefined,
    valid_from: toIso(row.valid_from),
    valid_to: toIso(row.valid_to),
    recorded_at: toIsoRequired(row.recorded_at),
    temporal_level: (row.temporal_level as any) ?? undefined,
    is_hindsight: row.is_hindsight,
    source_span_id: row.source_span_id ?? undefined,
    source: row.source as any,
    status: row.status as any,
  };
}

function mapRelation(row: typeof schema.relations.$inferSelect): Relation {
  return {
    id: row.id,
    src_claim: row.src_claim,
    dst_claim: row.dst_claim,
    type: row.type as any,
    scope: (row.scope as any) ?? undefined,
    status: row.status as any,
    recorded_at: toIsoRequired(row.recorded_at),
    valid_from: toIso(row.valid_from),
  };
}

function mapEvidence(row: typeof schema.evidence.$inferSelect): Evidence {
  return {
    id: row.id,
    entry_id: row.entry_id ?? undefined,
    span_id: row.span_id ?? undefined,
    claim_id: row.claim_id ?? undefined,
    kind: row.kind as any,
    url: row.url ?? undefined,
    media_id: row.media_id ?? undefined,
    verification: (row.verification as any) ?? undefined,
    verified_at: toIso(row.verified_at),
  };
}

function mapMedia(row: typeof schema.mediaAssets.$inferSelect): MediaAsset {
  return {
    id: row.id,
    entry_id: row.entry_id ?? undefined,
    mime_type: row.mime_type,
    uri: row.uri,
    alt_text: row.alt_text ?? undefined,
    caption: row.caption ?? undefined,
    ocr_text: row.ocr_text ?? undefined,
    transcript: (row.transcript as any) ?? undefined,
    duration_sec: row.duration_sec ?? undefined,
  };
}

function mapEscalation(row: typeof schema.escalations.$inferSelect): Escalation {
  return {
    id: row.id,
    question: row.question,
    query_class: row.query_class as any,
    facets: (row.facets as any) ?? undefined,
    draft: row.draft ?? undefined,
    final: row.final ?? undefined,
    draft_edit_distance: row.draft_edit_distance ?? undefined,
    citation_clicks: row.citation_clicks ?? 0,
    booked: row.booked ?? false,
    status: row.status as any,
    due_at: toIso(row.due_at),
    at: toIsoRequired(row.at),
  };
}

function mapCorrection(row: typeof schema.correctionLog.$inferSelect): CorrectionLog {
  return {
    id: row.id,
    kind: (row.kind as any) ?? undefined,
    role: (row.role as any) ?? undefined,
    domain: row.domain ?? undefined,
    machine_confidence: row.machine_confidence ?? undefined,
    owner_action: row.owner_action as any,
    edit_distance: row.edit_distance ?? undefined,
    at: toIsoRequired(row.at),
  };
}

function mapCalibration(row: typeof schema.calibrationChanges.$inferSelect): CalibrationChange {
  return {
    id: row.id,
    parameter: row.parameter,
    old_value: row.old_value,
    new_value: row.new_value,
    evidence_count: row.evidence_count,
    applied_by: row.applied_by as any,
    reversible: row.reversible,
    at: toIsoRequired(row.at),
  };
}

function mapScopedConstraint(row: typeof schema.scopedConstraints.$inferSelect): ScopedConstraint {
  return {
    id: row.id,
    constraint: row.constraint as any,
    scope: row.scope as any,
    source_escalation: row.source_escalation ?? undefined,
    source_quote: row.source_quote ?? undefined,
    status: row.status as any,
    at: toIsoRequired(row.at),
  };
}

/**
 * PostgreSQL + pgvector persistence repository implementing IPortfolioRepository (§9, §10.4, OSR-14).
 */
export class PostgresPortfolioRepository implements IPortfolioRepository {
  private db: LivingPortfolioDb;

  constructor(customDb?: LivingPortfolioDb) {
    this.db = customDb ?? (process.env.DATABASE_URL ? createDrizzleDb() : getDefaultDb());
  }

  // --- Ventures ---
  async createVenture(v: Omit<Venture, 'id'>): Promise<Venture> {
    const [row] = await this.db
      .insert(schema.ventures)
      .values({
        name: v.name,
        status: v.status,
        links: v.links ?? null,
        started_at: toDate(v.started_at),
        facets: v.facets ?? null,
      })
      .returning();
    return mapVenture(row);
  }

  async getVenture(id: string): Promise<Venture | null> {
    const rows = await this.db.select().from(schema.ventures).where(eq(schema.ventures.id, id));
    return rows.length > 0 ? mapVenture(rows[0]) : null;
  }

  async listVentures(): Promise<Venture[]> {
    const rows = await this.db.select().from(schema.ventures);
    return rows.map(mapVenture);
  }

  // --- Entries & Revisions ---
  async createEntry(
    e: Omit<Entry, 'id' | 'created_at'>,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<{ entry: Entry; revision: EntryRevision }> {
    const now = new Date();
    const writtenAt = rev.written_at
      ? new Date(rev.written_at)
      : (!rev.is_hindsight && rev.valid_from ? new Date(rev.valid_from) : now);

    const [entryRow] = await this.db
      .insert(schema.entries)
      .values({
        slug: e.slug,
        title: e.title ?? 'Untitled',
        profile: e.profile ?? 'case-study',
        view: (e.view as any) ?? 'article',
        visibility: e.visibility ?? 'private',
        venture_id: e.venture_id ?? null,
        created_at: writtenAt,
      })
      .returning();

    const [revRow] = await this.db
      .insert(schema.entryRevisions)
      .values({
        entry_id: entryRow.id,
        body_md: rev.body_md,
        body_hash: rev.body_hash,
        written_at: writtenAt,
        valid_from: toDate(rev.valid_from),
        valid_to: toDate(rev.valid_to),
        temporal_level: rev.temporal_level ?? 'estimated',
        valid_from_range_end: toDate(rev.valid_from_range_end),
        is_hindsight: rev.is_hindsight ?? false,
      })
      .returning();

    await this.db
      .update(schema.entries)
      .set({ current_revision_id: revRow.id })
      .where(eq(schema.entries.id, entryRow.id));

    entryRow.current_revision_id = revRow.id;
    return {
      entry: mapEntry(entryRow),
      revision: mapRevision(revRow),
    };
  }

  async getEntryBySlug(
    slug: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    const rows = await this.db.select().from(schema.entries).where(eq(schema.entries.slug, slug));
    if (rows.length === 0) return null;
    const entry = mapEntry(rows[0]);
    if (allowedVisibilities && !allowedVisibilities.includes(entry.visibility)) {
      return null;
    }
    let currentRevision: EntryRevision | null = null;
    if (entry.current_revision_id) {
      const revRows = await this.db
        .select()
        .from(schema.entryRevisions)
        .where(eq(schema.entryRevisions.id, entry.current_revision_id));
      if (revRows.length > 0) {
        currentRevision = mapRevision(revRows[0]);
      }
    }
    return { entry, currentRevision };
  }

  async getEntry(
    id: string,
    allowedVisibilities?: Visibility[]
  ): Promise<{ entry: Entry; currentRevision: EntryRevision | null } | null> {
    const rows = await this.db.select().from(schema.entries).where(eq(schema.entries.id, id));
    if (rows.length === 0) return null;
    const entry = mapEntry(rows[0]);
    if (allowedVisibilities && !allowedVisibilities.includes(entry.visibility)) {
      return null;
    }
    let currentRevision: EntryRevision | null = null;
    if (entry.current_revision_id) {
      const revRows = await this.db
        .select()
        .from(schema.entryRevisions)
        .where(eq(schema.entryRevisions.id, entry.current_revision_id));
      if (revRows.length > 0) {
        currentRevision = mapRevision(revRows[0]);
      }
    }
    return { entry, currentRevision };
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
    const updatesObj: any = {};
    if (updates.slug !== undefined) updatesObj.slug = updates.slug;
    if (updates.title !== undefined) updatesObj.title = updates.title;
    if (updates.profile !== undefined) updatesObj.profile = updates.profile;
    if (updates.view !== undefined) updatesObj.view = updates.view;
    if (updates.visibility !== undefined) updatesObj.visibility = updates.visibility;
    if (updates.venture_id !== undefined) updatesObj.venture_id = updates.venture_id ?? null;
    if (updates.current_revision_id !== undefined) updatesObj.current_revision_id = updates.current_revision_id ?? null;

    const [updated] = await this.db
      .update(schema.entries)
      .set(updatesObj)
      .where(eq(schema.entries.id, id))
      .returning();
    return updated ? mapEntry(updated) : null;
  }

  async deleteEntry(id: string): Promise<{
    deletedRevisions: number;
    deletedSpans: number;
    deletedClaims: number;
    deletedRelations: number;
    deletedFacets: number;
  }> {
    const revRows = await this.db
      .select({ id: schema.entryRevisions.id })
      .from(schema.entryRevisions)
      .where(eq(schema.entryRevisions.entry_id, id));
    const revIds = revRows.map((r) => r.id);

    let deletedSpans = 0;
    let deletedClaims = 0;
    let deletedRelations = 0;

    if (revIds.length > 0) {
      const spanRows = await this.db
        .select({ id: schema.spans.id })
        .from(schema.spans)
        .where(inArray(schema.spans.revision_id, revIds));
      deletedSpans = spanRows.length;

      const claimRows = await this.db
        .select({ id: schema.claims.id })
        .from(schema.claims)
        .where(inArray(schema.claims.revision_id, revIds));
      deletedClaims = claimRows.length;

      const claimIds = claimRows.map((c) => c.id);
      if (claimIds.length > 0) {
        const relRows = await this.db
          .select({ id: schema.relations.id })
          .from(schema.relations)
          .where(or(inArray(schema.relations.src_claim, claimIds), inArray(schema.relations.dst_claim, claimIds)));
        deletedRelations = relRows.length;
      }
    }

    const facetRows = await this.db
      .select({ id: schema.facets.id })
      .from(schema.facets)
      .where(eq(schema.facets.entry_id, id));
    const deletedFacets = facetRows.length;

    await this.db.delete(schema.entries).where(eq(schema.entries.id, id));

    return {
      deletedRevisions: revIds.length,
      deletedSpans,
      deletedClaims,
      deletedRelations,
      deletedFacets,
    };
  }

  async listEntries(filter?: { visibility?: Visibility[]; venture_id?: string }): Promise<Entry[]> {
    let query = this.db.select().from(schema.entries);
    const conditions: any[] = [];
    if (filter?.visibility && filter.visibility.length > 0) {
      conditions.push(inArray(schema.entries.visibility, filter.visibility));
    }
    if (filter?.venture_id) {
      conditions.push(eq(schema.entries.venture_id, filter.venture_id));
    }
    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.entries.created_at))
      : await query.orderBy(desc(schema.entries.created_at));
    return rows.map(mapEntry);
  }

  async createRevision(
    entry_id: string,
    rev: Omit<EntryRevision, 'id' | 'entry_id' | 'written_at'> & { written_at?: string }
  ): Promise<EntryRevision> {
    const now = new Date();
    const writtenAt = rev.written_at
      ? new Date(rev.written_at)
      : (!rev.is_hindsight && rev.valid_from ? new Date(rev.valid_from) : now);

    const [row] = await this.db
      .insert(schema.entryRevisions)
      .values({
        entry_id,
        body_md: rev.body_md,
        body_hash: rev.body_hash,
        written_at: writtenAt,
        valid_from: toDate(rev.valid_from),
        valid_to: toDate(rev.valid_to),
        temporal_level: rev.temporal_level ?? 'estimated',
        valid_from_range_end: toDate(rev.valid_from_range_end),
        is_hindsight: rev.is_hindsight ?? false,
      })
      .returning();

    await this.db
      .update(schema.entries)
      .set({ current_revision_id: row.id })
      .where(eq(schema.entries.id, entry_id));

    return mapRevision(row);
  }

  async getRevisions(entry_id: string): Promise<EntryRevision[]> {
    const rows = await this.db
      .select()
      .from(schema.entryRevisions)
      .where(eq(schema.entryRevisions.entry_id, entry_id))
      .orderBy(desc(schema.entryRevisions.written_at));
    return rows.map(mapRevision);
  }

  // --- Spans & Annotations ---
  async saveSpans(spansList: Omit<Span, 'id'>[]): Promise<Span[]> {
    if (spansList.length === 0) return [];
    const rows = await this.db
      .insert(schema.spans)
      .values(
        spansList.map((s) => ({
          revision_id: s.revision_id,
          ordinal: s.ordinal,
          start_off: s.start_off,
          end_off: s.end_off,
          text_exact: s.text_exact,
          prefix: s.prefix ?? null,
          suffix: s.suffix ?? null,
          token_count: s.token_count,
        }))
      )
      .returning();
    return rows.map(mapSpan);
  }

  async getSpans(revision_id: string): Promise<Span[]> {
    const rows = await this.db
      .select()
      .from(schema.spans)
      .where(eq(schema.spans.revision_id, revision_id))
      .orderBy(schema.spans.ordinal);
    return rows.map(mapSpan);
  }

  async saveAnnotation(a: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation> {
    const [row] = await this.db
      .insert(schema.annotations)
      .values({
        span_id: a.span_id,
        role: a.role,
        profile: a.profile,
        source: a.source,
        status: a.status,
        confidence: a.confidence ?? null,
      })
      .returning();
    return mapAnnotation(row);
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation | null> {
    const updatesObj: any = {};
    if (updates.status !== undefined) updatesObj.status = updates.status;
    if (updates.role !== undefined) updatesObj.role = updates.role;
    if (updates.profile !== undefined) updatesObj.profile = updates.profile;
    if (updates.confidence !== undefined) updatesObj.confidence = updates.confidence;

    const [updated] = await this.db
      .update(schema.annotations)
      .set(updatesObj)
      .where(eq(schema.annotations.id, id))
      .returning();
    return updated ? mapAnnotation(updated) : null;
  }

  async getAnnotations(span_id: string): Promise<Annotation[]> {
    const rows = await this.db
      .select()
      .from(schema.annotations)
      .where(eq(schema.annotations.span_id, span_id));
    return rows.map(mapAnnotation);
  }

  async listAnnotationsForRevision(revision_id: string): Promise<Annotation[]> {
    const spansList = await this.getSpans(revision_id);
    if (spansList.length === 0) return [];
    const spanIds = spansList.map((s) => s.id);
    const rows = await this.db
      .select()
      .from(schema.annotations)
      .where(inArray(schema.annotations.span_id, spanIds));
    return rows.map(mapAnnotation);
  }

  // --- Facets ---
  async saveFacet(f: Omit<Facet, 'id'>): Promise<Facet> {
    const [row] = await this.db
      .insert(schema.facets)
      .values({
        entry_id: f.entry_id,
        revision_id: f.revision_id ?? null,
        key: f.key,
        value: f.value,
        source: f.source,
        status: f.status,
        confidence: f.confidence ?? null,
        source_span_id: f.source_span_id ?? null,
      })
      .returning();
    return mapFacet(row);
  }

  async updateFacet(id: string, updates: Partial<Facet>): Promise<Facet | null> {
    const updatesObj: any = {};
    if (updates.key !== undefined) updatesObj.key = updates.key;
    if (updates.value !== undefined) updatesObj.value = updates.value;
    if (updates.status !== undefined) updatesObj.status = updates.status;
    if (updates.confidence !== undefined) updatesObj.confidence = updates.confidence;

    const [updated] = await this.db
      .update(schema.facets)
      .set(updatesObj)
      .where(eq(schema.facets.id, id))
      .returning();
    return updated ? mapFacet(updated) : null;
  }

  async getFacetsForEntry(entry_id: string): Promise<Facet[]> {
    const rows = await this.db
      .select()
      .from(schema.facets)
      .where(eq(schema.facets.entry_id, entry_id));
    return rows.map(mapFacet);
  }

  // --- Claims & Relations ---
  async saveClaim(c: Omit<Claim, 'id' | 'recorded_at'>): Promise<Claim> {
    const [row] = await this.db
      .insert(schema.claims)
      .values({
        revision_id: c.revision_id,
        text: c.text,
        kind: c.kind,
        outcome_status: c.outcome_status ?? null,
        scope: c.scope ?? null,
        valid_from: toDate(c.valid_from),
        valid_to: toDate(c.valid_to),
        temporal_level: c.temporal_level ?? null,
        is_hindsight: c.is_hindsight ?? false,
        source_span_id: c.source_span_id ?? null,
        source: c.source,
        status: c.status,
      })
      .returning();
    return mapClaim(row);
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    const updatesObj: any = {};
    if (updates.text !== undefined) updatesObj.text = updates.text;
    if (updates.kind !== undefined) updatesObj.kind = updates.kind;
    if (updates.outcome_status !== undefined) updatesObj.outcome_status = updates.outcome_status;
    if (updates.scope !== undefined) updatesObj.scope = updates.scope;
    if (updates.status !== undefined) updatesObj.status = updates.status;
    if (updates.valid_from !== undefined) updatesObj.valid_from = toDate(updates.valid_from);
    if (updates.valid_to !== undefined) updatesObj.valid_to = toDate(updates.valid_to);

    const [updated] = await this.db
      .update(schema.claims)
      .set(updatesObj)
      .where(eq(schema.claims.id, id))
      .returning();
    return updated ? mapClaim(updated) : null;
  }

  async getClaimsForRevision(revision_id: string): Promise<Claim[]> {
    const rows = await this.db
      .select()
      .from(schema.claims)
      .where(eq(schema.claims.revision_id, revision_id));
    return rows.map(mapClaim);
  }

  async listClaimsForEntry(entry_id: string): Promise<Claim[]> {
    const revRows = await this.db
      .select({ id: schema.entryRevisions.id })
      .from(schema.entryRevisions)
      .where(eq(schema.entryRevisions.entry_id, entry_id));
    if (revRows.length === 0) return [];
    const revIds = revRows.map((r) => r.id);
    const rows = await this.db
      .select()
      .from(schema.claims)
      .where(inArray(schema.claims.revision_id, revIds));
    return rows.map(mapClaim);
  }

  async saveRelation(r: Omit<Relation, 'id' | 'recorded_at'>): Promise<Relation> {
    const [row] = await this.db
      .insert(schema.relations)
      .values({
        src_claim: r.src_claim,
        dst_claim: r.dst_claim,
        type: r.type,
        scope: r.scope ?? null,
        status: r.status,
        valid_from: toDate(r.valid_from),
      })
      .returning();
    return mapRelation(row);
  }

  async getRelationsForClaim(claim_id: string): Promise<Relation[]> {
    const rows = await this.db
      .select()
      .from(schema.relations)
      .where(or(eq(schema.relations.src_claim, claim_id), eq(schema.relations.dst_claim, claim_id)));
    return rows.map(mapRelation);
  }

  async listAcceptedRelations(): Promise<Relation[]> {
    const relRows = await this.db
      .select()
      .from(schema.relations)
      .where(eq(schema.relations.status, 'accepted'));

    if (relRows.length === 0) return [];

    const dstClaimIds = Array.from(new Set(relRows.map((r) => r.dst_claim)));
    const claimRows = await this.db
      .select()
      .from(schema.claims)
      .where(inArray(schema.claims.id, dstClaimIds));
    const claimMap = new Map(claimRows.map((c) => [c.id, c]));

    const revIds = Array.from(new Set(claimRows.map((c) => c.revision_id)));
    const revRows = revIds.length > 0
      ? await this.db.select().from(schema.entryRevisions).where(inArray(schema.entryRevisions.id, revIds))
      : [];
    const revMap = new Map(revRows.map((r) => [r.id, r]));

    const entryIds = Array.from(new Set(revRows.map((r) => r.entry_id)));
    const entryRows = entryIds.length > 0
      ? await this.db.select().from(schema.entries).where(inArray(schema.entries.id, entryIds))
      : [];
    const entryMap = new Map(entryRows.map((e) => [e.id, e]));

    return relRows.map((r) => {
      const dstClaim = claimMap.get(r.dst_claim);
      const dstRev = dstClaim ? revMap.get(dstClaim.revision_id) : undefined;
      const dstEntry = dstRev ? entryMap.get(dstRev.entry_id) : undefined;

      return {
        ...mapRelation(r),
        ...(dstClaim ? { dst_claim_text: dstClaim.text } : {}),
        ...(dstEntry ? { dst_entry_slug: dstEntry.slug, dst_entry_title: dstEntry.title } : {}),
        ...(dstRev ? { dst_written_at: toIso(dstRev.written_at) } : {}),
      };
    });
  }

  // --- Evidence ---
  async saveEvidence(ev: Omit<Evidence, 'id'>): Promise<Evidence> {
    const [row] = await this.db
      .insert(schema.evidence)
      .values({
        entry_id: ev.entry_id ?? null,
        span_id: ev.span_id ?? null,
        claim_id: ev.claim_id ?? null,
        kind: ev.kind,
        url: ev.url ?? null,
        media_id: ev.media_id ?? null,
        verification: ev.verification ?? null,
        verified_at: toDate(ev.verified_at),
      })
      .returning();
    return mapEvidence(row);
  }

  async getEvidenceForEntry(entry_id: string): Promise<Evidence[]> {
    const rows = await this.db
      .select()
      .from(schema.evidence)
      .where(eq(schema.evidence.entry_id, entry_id));
    return rows.map(mapEvidence);
  }

  // --- Media Assets ---
  async saveMedia(m: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
    const [row] = await this.db
      .insert(schema.mediaAssets)
      .values({
        entry_id: m.entry_id ?? null,
        mime_type: m.mime_type,
        uri: m.uri,
        alt_text: m.alt_text ?? null,
        caption: m.caption ?? null,
        ocr_text: m.ocr_text ?? null,
        transcript: m.transcript ?? null,
        duration_sec: m.duration_sec ?? null,
      })
      .returning();
    return mapMedia(row);
  }

  async getMedia(id: string): Promise<MediaAsset | null> {
    const rows = await this.db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
    return rows.length > 0 ? mapMedia(rows[0]) : null;
  }

  // --- Operational ---
  async saveEscalation(esc: Omit<Escalation, 'id' | 'at'>): Promise<Escalation> {
    const [row] = await this.db
      .insert(schema.escalations)
      .values({
        question: esc.question,
        query_class: esc.query_class,
        facets: esc.facets ?? null,
        draft: esc.draft ?? null,
        final: esc.final ?? null,
        draft_edit_distance: esc.draft_edit_distance ?? null,
        citation_clicks: esc.citation_clicks ?? 0,
        booked: esc.booked ?? false,
        status: esc.status,
        due_at: toDate(esc.due_at),
      })
      .returning();
    return mapEscalation(row);
  }

  async getEscalations(status?: string): Promise<Escalation[]> {
    let query = this.db.select().from(schema.escalations);
    const rows = status
      ? await query.where(eq(schema.escalations.status, status)).orderBy(desc(schema.escalations.at))
      : await query.orderBy(desc(schema.escalations.at));
    return rows.map(mapEscalation);
  }

  async updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation> {
    const updatesObj: any = {};
    if (updates.status !== undefined) updatesObj.status = updates.status;
    if (updates.draft !== undefined) updatesObj.draft = updates.draft;
    if (updates.final !== undefined) updatesObj.final = updates.final;
    if (updates.draft_edit_distance !== undefined) updatesObj.draft_edit_distance = updates.draft_edit_distance;
    if (updates.citation_clicks !== undefined) updatesObj.citation_clicks = updates.citation_clicks;
    if (updates.booked !== undefined) updatesObj.booked = updates.booked;
    if (updates.due_at !== undefined) updatesObj.due_at = toDate(updates.due_at);

    const [updated] = await this.db
      .update(schema.escalations)
      .set(updatesObj)
      .where(eq(schema.escalations.id, id))
      .returning();
    if (!updated) throw new Error(`Escalation ${id} not found`);
    return mapEscalation(updated);
  }

  async saveCorrection(log: Omit<CorrectionLog, 'id' | 'at'>): Promise<CorrectionLog> {
    const [row] = await this.db
      .insert(schema.correctionLog)
      .values({
        kind: log.kind ?? null,
        role: log.role ?? null,
        domain: log.domain ?? null,
        machine_confidence: log.machine_confidence ?? null,
        owner_action: log.owner_action,
        edit_distance: log.edit_distance ?? null,
      })
      .returning();
    return mapCorrection(row);
  }

  async getCorrectionLogs(kind?: string): Promise<CorrectionLog[]> {
    let query = this.db.select().from(schema.correctionLog);
    const rows = kind
      ? await query.where(eq(schema.correctionLog.kind, kind)).orderBy(desc(schema.correctionLog.at))
      : await query.orderBy(desc(schema.correctionLog.at));
    return rows.map(mapCorrection);
  }

  async saveCalibrationChange(c: Omit<CalibrationChange, 'id' | 'at'>): Promise<CalibrationChange> {
    const [row] = await this.db
      .insert(schema.calibrationChanges)
      .values({
        parameter: c.parameter,
        old_value: c.old_value,
        new_value: c.new_value,
        evidence_count: c.evidence_count,
        applied_by: c.applied_by,
        reversible: c.reversible,
      })
      .returning();
    return mapCalibration(row);
  }

  async getCalibrationChanges(): Promise<CalibrationChange[]> {
    const rows = await this.db
      .select()
      .from(schema.calibrationChanges)
      .orderBy(desc(schema.calibrationChanges.at));
    return rows.map(mapCalibration);
  }

  async saveScopedConstraint(sc: Omit<ScopedConstraint, 'id' | 'at'>): Promise<ScopedConstraint> {
    const [row] = await this.db
      .insert(schema.scopedConstraints)
      .values({
        constraint: sc.constraint,
        scope: sc.scope,
        source_escalation: sc.source_escalation ?? null,
        source_quote: sc.source_quote ?? null,
        status: sc.status,
      })
      .returning();
    return mapScopedConstraint(row);
  }

  async getScopedConstraints(status?: string): Promise<ScopedConstraint[]> {
    let query = this.db.select().from(schema.scopedConstraints);
    const rows = status
      ? await query.where(eq(schema.scopedConstraints.status, status)).orderBy(desc(schema.scopedConstraints.at))
      : await query.orderBy(desc(schema.scopedConstraints.at));
    return rows.map(mapScopedConstraint);
  }

  // --- Hybrid Search & Graph Traversal (§10.4) ---
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

    // Fetch entries matching visibility
    const entriesRows = await this.db
      .select()
      .from(schema.entries)
      .where(inArray(schema.entries.visibility, options.visibility));
    if (entriesRows.length === 0) return [];

    const entryIds = entriesRows.map((e) => e.id);
    const entryMap = new Map(entriesRows.map((e) => [e.id, mapEntry(e)]));

    // Fetch revisions for these entries
    const revRows = await this.db
      .select()
      .from(schema.entryRevisions)
      .where(inArray(schema.entryRevisions.entry_id, entryIds));
    if (revRows.length === 0) return [];

    // Filter by temporal validity if as_of_date is provided
    const validRevRows: typeof schema.entryRevisions.$inferSelect[] = [];
    for (const r of revRows) {
      const mappedRev = mapRevision(r);
      if (options.as_of_date) {
        const check = isTemporallyValid(mappedRev, options.as_of_date);
        if (check.valid) {
          validRevRows.push(r);
        }
      } else {
        validRevRows.push(r);
      }
    }
    if (validRevRows.length === 0) return [];

    const revIds = validRevRows.map((r) => r.id);
    const revMap = new Map(validRevRows.map((r) => [r.id, mapRevision(r)]));

    // Fetch spans for valid revisions
    const spanRows = await this.db
      .select()
      .from(schema.spans)
      .where(inArray(schema.spans.revision_id, revIds));
    if (spanRows.length === 0) return [];

    // Compute BM25 simulated keyword scores
    const scoredSpans: Array<{
      span: Span;
      entry: Entry;
      revision: EntryRevision;
      bm25Score: number;
      similarity: number;
    }> = [];

    for (const spanRow of spanRows) {
      const span = mapSpan(spanRow);
      const rev = revMap.get(span.revision_id);
      if (!rev) continue;
      const entry = entryMap.get(rev.entry_id);
      if (!entry) continue;

      const textLower = span.text_exact.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (textLower.includes(token)) matchCount++;
      }

      const bm25Score = queryTokens.length > 0 ? matchCount / queryTokens.length : 0;
      scoredSpans.push({
        span,
        entry,
        revision: rev,
        bm25Score,
        similarity: 0,
      });
    }

    // Sort by BM25
    scoredSpans.sort((a, b) => b.bm25Score - a.bm25Score);

    // Compute Reciprocal Rank Fusion (RRF)
    const results: SearchResult[] = scoredSpans.map((item, index) => {
      const bm25Rank = index + 1;
      const rrfScore = item.bm25Score > 0 ? 1 / (60 + bm25Rank) : 0;
      return {
        ...item,
        rrfScore,
      };
    });

    return results
      .filter((r) => r.bm25Score > 0 || !query.trim())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, limit);
  }

  async temporalExpand(options: TemporalExpandOptions): Promise<Claim[]> {
    const hops = options.hops ?? 2;
    const visitedClaimIds = new Set<string>(options.seedClaimIds);
    let frontier = Array.from(visitedClaimIds);

    for (let hop = 0; hop < hops; hop++) {
      if (frontier.length === 0) break;

      const relRows = await this.db
        .select()
        .from(schema.relations)
        .where(
          and(
            eq(schema.relations.status, 'accepted'),
            or(inArray(schema.relations.src_claim, frontier), inArray(schema.relations.dst_claim, frontier))
          )
        );

      const nextFrontier: string[] = [];
      for (const rel of relRows) {
        const neighborId = frontier.includes(rel.src_claim) ? rel.dst_claim : rel.src_claim;
        if (!visitedClaimIds.has(neighborId)) {
          visitedClaimIds.add(neighborId);
          nextFrontier.push(neighborId);
        }
      }
      frontier = nextFrontier;
    }

    const allClaimIds = Array.from(visitedClaimIds);
    if (allClaimIds.length === 0) return [];

    const claimRows = await this.db
      .select()
      .from(schema.claims)
      .where(inArray(schema.claims.id, allClaimIds));

    // Filter by temporal validity as of t_q
    const validClaims: Claim[] = [];
    for (const c of claimRows) {
      const claim = mapClaim(c);
      const revRows = await this.db
        .select()
        .from(schema.entryRevisions)
        .where(eq(schema.entryRevisions.id, claim.revision_id));
      if (revRows.length > 0) {
        const rev = mapRevision(revRows[0]);
        const check = isTemporallyValid(rev, options.t_q);
        if (check.valid) {
          validClaims.push(claim);
        }
      } else {
        validClaims.push(claim);
      }
    }

    return validClaims;
  }
}
