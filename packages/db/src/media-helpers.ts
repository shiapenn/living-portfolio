import { desc, eq, sql } from 'drizzle-orm';
import type { Entry, MediaAsset, Visibility } from '@living-portfolio/core';
import * as schema from './schema/index.js';

const MEDIA_REF_RE = /\/api(?:\/v1)?\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function extractReferencedMediaIds(bodyMd: string | null | undefined): string[] {
  if (!bodyMd) return [];
  const ids = new Set<string>();
  for (const match of bodyMd.matchAll(MEDIA_REF_RE)) {
    ids.add(match[1].toLowerCase());
  }
  return Array.from(ids);
}

export interface MediaReferenceCounts {
  reference_count: number;
  public_reference_count: number;
}

function toIso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d.toISOString() : String(d);
}

export function mapMediaRow(
  row: typeof schema.mediaAssets.$inferSelect,
  counts?: MediaReferenceCounts
): MediaAsset {
  const pubCount = counts?.public_reference_count ?? 0;
  const refCount = counts?.reference_count ?? 0;
  const derivedVisibility: Visibility = pubCount > 0 ? 'public' : 'private';
  return {
    id: row.id,
    entry_id: row.entry_id ?? undefined,
    mime_type: row.mime_type,
    uri: row.uri,
    storage_key: row.storage_key ?? undefined,
    original_filename: row.original_filename ?? undefined,
    size_bytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sha256: row.sha256 ?? undefined,
    visibility: derivedVisibility,
    reference_count: refCount,
    public_reference_count: pubCount,
    alt_text: row.alt_text ?? undefined,
    caption: row.caption ?? undefined,
    ocr_text: row.ocr_text ?? undefined,
    transcript: (row.transcript as any) ?? undefined,
    duration_sec: row.duration_sec ?? undefined,
    created_at: toIso(row.created_at),
  };
}

async function pgLoadReferenceCounts(
  db: any,
  mediaId?: string
): Promise<Map<string, MediaReferenceCounts>> {
  const map = new Map<string, MediaReferenceCounts>();
  const rows = mediaId
    ? await db
        .select({
          media_id: schema.mediaReferences.media_id,
          entry_id: schema.mediaReferences.entry_id,
          revision_id: schema.mediaReferences.revision_id,
          entry_visibility: schema.entries.visibility,
          current_revision_id: schema.entries.current_revision_id,
        })
        .from(schema.mediaReferences)
        .innerJoin(schema.entries, eq(schema.entries.id, schema.mediaReferences.entry_id))
        .where(eq(schema.mediaReferences.media_id, mediaId))
    : await db
        .select({
          media_id: schema.mediaReferences.media_id,
          entry_id: schema.mediaReferences.entry_id,
          revision_id: schema.mediaReferences.revision_id,
          entry_visibility: schema.entries.visibility,
          current_revision_id: schema.entries.current_revision_id,
        })
        .from(schema.mediaReferences)
        .innerJoin(schema.entries, eq(schema.entries.id, schema.mediaReferences.entry_id));

  const perMedia = new Map<string, { allEntries: Set<string>; publicEntries: Set<string> }>();
  for (const r of rows) {
    let bucket = perMedia.get(r.media_id);
    if (!bucket) {
      bucket = { allEntries: new Set(), publicEntries: new Set() };
      perMedia.set(r.media_id, bucket);
    }
    bucket.allEntries.add(r.entry_id);
    if (r.entry_visibility === 'public' && r.current_revision_id === r.revision_id) {
      bucket.publicEntries.add(r.entry_id);
    }
  }
  for (const [id, bucket] of perMedia.entries()) {
    map.set(id, {
      reference_count: bucket.allEntries.size,
      public_reference_count: bucket.publicEntries.size,
    });
  }
  return map;
}

export async function pgSyncRevisionMediaReferences(
  db: any,
  entryId: string,
  revisionId: string,
  bodyMd: string
): Promise<void> {
  await db
    .delete(schema.mediaReferences)
    .where(eq(schema.mediaReferences.revision_id, revisionId));
  const mediaIds = extractReferencedMediaIds(bodyMd);
  if (mediaIds.length === 0) return;
  await db
    .insert(schema.mediaReferences)
    .values(
      mediaIds.map((media_id) => ({
        media_id,
        entry_id: entryId,
        revision_id: revisionId,
      }))
    )
    .onConflictDoNothing();
}

export async function pgSyncEntryMediaReferences(db: any, entryId: string): Promise<void> {
  const entryRows = await db
    .select({ current_revision_id: schema.entries.current_revision_id })
    .from(schema.entries)
    .where(eq(schema.entries.id, entryId));
  const currentRevId = entryRows[0]?.current_revision_id;
  if (!currentRevId) return;
  const revRows = await db
    .select({ body_md: schema.entryRevisions.body_md })
    .from(schema.entryRevisions)
    .where(eq(schema.entryRevisions.id, currentRevId));
  if (revRows.length > 0) {
    await pgSyncRevisionMediaReferences(db, entryId, currentRevId, revRows[0].body_md);
  }
}

export async function pgSaveMedia(db: any, m: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
  const [row] = await db
    .insert(schema.mediaAssets)
    .values({
      id: (m as any).id ?? undefined,
      entry_id: m.entry_id ?? null,
      mime_type: m.mime_type,
      uri: m.uri,
      storage_key: m.storage_key ?? null,
      original_filename: m.original_filename ?? null,
      size_bytes: m.size_bytes ?? null,
      width: m.width ?? null,
      height: m.height ?? null,
      sha256: m.sha256 ?? null,
      visibility: 'private',
      alt_text: m.alt_text ?? null,
      caption: m.caption ?? null,
      ocr_text: m.ocr_text ?? null,
      transcript: m.transcript ?? null,
      duration_sec: m.duration_sec ?? null,
    })
    .returning();
  const countsMap = await pgLoadReferenceCounts(db, row.id);
  return mapMediaRow(row, countsMap.get(row.id));
}

export async function pgUpdateMedia(
  db: any,
  id: string,
  updates: { alt_text?: string | null; caption?: string | null }
): Promise<MediaAsset | null> {
  const patch: Record<string, any> = {};
  if (updates.alt_text !== undefined) patch.alt_text = updates.alt_text;
  if (updates.caption !== undefined) patch.caption = updates.caption;
  if (Object.keys(patch).length > 0) {
    await db.update(schema.mediaAssets).set(patch).where(eq(schema.mediaAssets.id, id));
  }
  return pgGetMedia(db, id);
}

export async function pgGetMedia(db: any, id: string): Promise<MediaAsset | null> {
  const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
  if (rows.length === 0) return null;
  const countsMap = await pgLoadReferenceCounts(db, id);
  return mapMediaRow(rows[0], countsMap.get(id));
}

export async function pgListMedia(db: any): Promise<MediaAsset[]> {
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .orderBy(desc(schema.mediaAssets.created_at));
  const countsMap = await pgLoadReferenceCounts(db);
  return rows.map((r: any) => mapMediaRow(r, countsMap.get(r.id)));
}

export async function pgDeleteMedia(db: any, id: string): Promise<boolean> {
  await db.delete(schema.mediaReferences).where(eq(schema.mediaReferences.media_id, id));
  const rows = await db
    .delete(schema.mediaAssets)
    .where(eq(schema.mediaAssets.id, id))
    .returning({ id: schema.mediaAssets.id });
  return rows.length > 0;
}

export async function pgGetTotalMediaBytes(db: any): Promise<number> {
  const rows = await db
    .select({ size_bytes: sql<number>`COALESCE(SUM(${schema.mediaAssets.size_bytes}), 0)` })
    .from(schema.mediaAssets);
  return Number(rows[0]?.size_bytes ?? 0);
}

export class InMemoryMediaStore {
  private readonly items = new Map<string, MediaAsset>();
  private readonly revisionRefs = new Map<string, { entryId: string; mediaIds: string[] }>();

  syncRevision(entryId: string, revisionId: string, bodyMd: string): void {
    const mediaIds = extractReferencedMediaIds(bodyMd);
    this.revisionRefs.set(revisionId, { entryId, mediaIds });
  }

  removeEntry(entryId: string): void {
    for (const [revId, rec] of this.revisionRefs.entries()) {
      if (rec.entryId === entryId) {
        this.revisionRefs.delete(revId);
      }
    }
  }

  private computeCounts(mediaId: string, entries?: Map<string, Entry>): MediaReferenceCounts {
    const normalized = mediaId.toLowerCase();
    const allEntries = new Set<string>();
    const publicEntries = new Set<string>();
    for (const [revId, rec] of this.revisionRefs.entries()) {
      if (!rec.mediaIds.includes(normalized)) continue;
      const entry = entries?.get(rec.entryId);
      if (entries && !entry) continue;
      allEntries.add(rec.entryId);
      if (entry && entry.visibility === 'public' && entry.current_revision_id === revId) {
        publicEntries.add(rec.entryId);
      }
    }
    return {
      reference_count: allEntries.size,
      public_reference_count: publicEntries.size,
    };
  }

  private enrich(asset: MediaAsset, entries?: Map<string, Entry>): MediaAsset {
    const counts = this.computeCounts(asset.id, entries);
    return {
      ...asset,
      visibility: counts.public_reference_count > 0 ? 'public' : 'private',
      reference_count: counts.reference_count,
      public_reference_count: counts.public_reference_count,
    };
  }

  save(m: Omit<MediaAsset, 'id'>, entries?: Map<string, Entry>): MediaAsset {
    const id = (m as any).id ?? crypto.randomUUID();
    const asset: MediaAsset = {
      ...m,
      id,
      visibility: 'private',
      created_at: m.created_at ?? new Date().toISOString(),
    };
    this.items.set(id, asset);
    return this.enrich(asset, entries);
  }

  update(
    id: string,
    updates: { alt_text?: string | null; caption?: string | null },
    entries?: Map<string, Entry>
  ): MediaAsset | null {
    const existing = this.items.get(id);
    if (!existing) return null;
    const next: MediaAsset = {
      ...existing,
      ...(updates.alt_text !== undefined ? { alt_text: updates.alt_text ?? undefined } : {}),
      ...(updates.caption !== undefined ? { caption: updates.caption ?? undefined } : {}),
    };
    this.items.set(id, next);
    return this.enrich(next, entries);
  }

  get(id: string, entries?: Map<string, Entry>): MediaAsset | null {
    const item = this.items.get(id);
    return item ? this.enrich(item, entries) : null;
  }

  list(entries?: Map<string, Entry>): MediaAsset[] {
    return Array.from(this.items.values())
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .map((item) => this.enrich(item, entries));
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  totalBytes(): number {
    let total = 0;
    for (const item of this.items.values()) total += item.size_bytes ?? 0;
    return total;
  }
}
