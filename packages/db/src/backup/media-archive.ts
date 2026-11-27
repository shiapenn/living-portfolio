import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface ArchivedMediaRecord {
  id: string;
  entry_id?: string | null;
  original_filename?: string;
  uri?: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  sha256: string;
  storage_key: string;
  alt_text: string | null;
  caption?: string | null;
  visibility: string;
}

export interface ArchivedMediaPayload {
  assets: ArchivedMediaRecord[];
  blobs: Record<string, string>; // storage_key -> base64 bytes
}

const MEDIA_URI_RE = /\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function extractMediaIdsFromMarkdown(md: string): string[] {
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  MEDIA_URI_RE.lastIndex = 0;
  while ((m = MEDIA_URI_RE.exec(md)) !== null) {
    ids.add(m[1].toLowerCase());
  }
  return Array.from(ids);
}

export async function exportMediaArchivePayload(
  repo: any,
  mediaDir?: string
): Promise<ArchivedMediaPayload> {
  const assets: ArchivedMediaRecord[] =
    typeof repo?.listMedia === 'function' ? await repo.listMedia() : [];
  const blobs: Record<string, string> = {};

  if (mediaDir && existsSync(mediaDir)) {
    const root = resolve(mediaDir);
    for (const asset of assets) {
      if (!asset.storage_key || blobs[asset.storage_key]) continue;
      const fullPath = resolve(root, asset.storage_key);
      if (!fullPath.startsWith(root)) continue;
      if (existsSync(fullPath)) {
        blobs[asset.storage_key] = readFileSync(fullPath).toString('base64');
      }
    }
  }

  return { assets, blobs };
}

export async function restoreMediaArchivePayload(
  payload: ArchivedMediaPayload | undefined,
  scratchRepo: any,
  restoreMediaDir?: string
): Promise<{ mediaCount: number; blobCount: number }> {
  if (!payload || !Array.isArray(payload.assets)) {
    return { mediaCount: 0, blobCount: 0 };
  }

  let mediaCount = 0;
  let blobCount = 0;

  if (typeof scratchRepo?.saveMedia === 'function') {
    for (const asset of payload.assets) {
      await scratchRepo.saveMedia({
        id: asset.id,
        entry_id: asset.entry_id ?? null,
        mime_type: asset.mime_type,
        uri: asset.uri || `/api/media/${asset.id}`,
        storage_key: asset.storage_key,
        original_filename: asset.original_filename || `${asset.id}.bin`,
        size_bytes: asset.size_bytes,
        width: asset.width ?? null,
        height: asset.height ?? null,
        sha256: asset.sha256,
        alt_text: asset.alt_text ?? null,
        caption: asset.caption ?? null,
        visibility: asset.visibility || 'private',
      });
      mediaCount++;
    }
  }

  if (restoreMediaDir && payload.blobs && typeof payload.blobs === 'object') {
    const root = resolve(restoreMediaDir);
    mkdirSync(root, { recursive: true });
    for (const [storageKey, b64] of Object.entries(payload.blobs)) {
      const cleanKey = storageKey.replace(/^\/+/, '');
      if (cleanKey.includes('..')) continue;
      const dest = resolve(root, cleanKey);
      if (!dest.startsWith(root)) continue;
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, Buffer.from(b64, 'base64'));
      blobCount++;
    }
  }

  return { mediaCount, blobCount };
}
