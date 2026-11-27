import { desc, eq } from 'drizzle-orm';
import type { MediaAsset, Visibility } from '@living-portfolio/core';
import * as schema from './schema/index.js';

function toIso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d.toISOString() : String(d);
}

export function mapMediaRow(row: typeof schema.mediaAssets.$inferSelect): MediaAsset {
  return {
    id: row.id,
    entry_id: row.entry_id ?? undefined,
    mime_type: row.mime_type,
    uri: row.uri,
    storage_key: row.storage_key ?? undefined,
    original_filename: row.original_filename ?? undefined,
    size_bytes: row.size_bytes ?? undefined,
    sha256: row.sha256 ?? undefined,
    visibility: (row.visibility as Visibility) ?? 'private',
    alt_text: row.alt_text ?? undefined,
    caption: row.caption ?? undefined,
    ocr_text: row.ocr_text ?? undefined,
    transcript: (row.transcript as any) ?? undefined,
    duration_sec: row.duration_sec ?? undefined,
    created_at: toIso(row.created_at),
  };
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
      sha256: m.sha256 ?? null,
      visibility: m.visibility ?? 'private',
      alt_text: m.alt_text ?? null,
      caption: m.caption ?? null,
      ocr_text: m.ocr_text ?? null,
      transcript: m.transcript ?? null,
      duration_sec: m.duration_sec ?? null,
    })
    .returning();
  return mapMediaRow(row);
}

export async function pgGetMedia(db: any, id: string): Promise<MediaAsset | null> {
  const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
  return rows.length > 0 ? mapMediaRow(rows[0]) : null;
}

export async function pgListMedia(db: any): Promise<MediaAsset[]> {
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .orderBy(desc(schema.mediaAssets.created_at));
  return rows.map(mapMediaRow);
}

export async function pgDeleteMedia(db: any, id: string): Promise<boolean> {
  const rows = await db
    .delete(schema.mediaAssets)
    .where(eq(schema.mediaAssets.id, id))
    .returning({ id: schema.mediaAssets.id });
  return rows.length > 0;
}

export async function pgGetTotalMediaBytes(db: any): Promise<number> {
  const rows = await db
    .select({ size_bytes: schema.mediaAssets.size_bytes })
    .from(schema.mediaAssets);
  return rows.reduce((acc: number, row: any) => acc + (Number(row.size_bytes) || 0), 0);
}

export class InMemoryMediaStore {
  private readonly items = new Map<string, MediaAsset>();

  save(m: Omit<MediaAsset, 'id'>): MediaAsset {
    const id = (m as any).id ?? crypto.randomUUID();
    const asset: MediaAsset = {
      ...m,
      id,
      visibility: m.visibility ?? 'private',
      created_at: m.created_at ?? new Date().toISOString(),
    };
    this.items.set(id, asset);
    return asset;
  }

  get(id: string): MediaAsset | null {
    return this.items.get(id) || null;
  }

  list(): MediaAsset[] {
    return Array.from(this.items.values()).sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? '')
    );
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
