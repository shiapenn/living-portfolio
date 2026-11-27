import { randomUUID } from 'node:crypto';
import type { Hono } from 'hono';
import type { AppConfig } from '@living-portfolio/config';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { MediaStorageAdapter } from '../media/storage.js';
import { buildHashedStorageKey, computeSha256Hex, sanitiseFilename, sniffMediaBytes } from '../media/sniff.js';
import { parseImageDimensions, stripImageMetadata } from '../media/image-process.js';
import { parseSingleImportFile, type ExtractedBinaryImage } from '../import/file-parsers.js';

const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024;

async function uploadEmbeddedImage(
  img: ExtractedBinaryImage,
  repo: IPortfolioRepository,
  storage: MediaStorageAdapter,
  cfg: AppConfig
): Promise<{ id: string; uri: string; filename: string } | null> {
  const sniff = sniffMediaBytes(img.bytes);
  if (!sniff.mimeType || sniff.category !== 'image') return null;

  const stripped = stripImageMetadata(img.bytes, sniff.mimeType);
  const dims = parseImageDimensions(stripped, sniff.mimeType);
  if (!dims) return null;

  const currentTotal = await repo.getTotalMediaBytes();
  if (currentTotal + stripped.length > cfg.MEDIA_MAX_TOTAL_BYTES) return null;
  if (stripped.length > cfg.MEDIA_MAX_IMAGE_BYTES) return null;

  const sha256 = computeSha256Hex(stripped);
  const storageKey = buildHashedStorageKey(sha256, sniff.mimeType);
  await storage.put(storageKey, stripped, sniff.mimeType);

  const safeName = sanitiseFilename(img.name);
  const id = randomUUID();
  const saved = await repo.saveMedia({
    entry_id: null,
    mime_type: sniff.mimeType,
    uri: `/api/media/${id}`,
    storage_key: storageKey,
    original_filename: safeName,
    size_bytes: stripped.length,
    width: dims.width,
    height: dims.height,
    sha256,
    alt_text: safeName.replace(/\.[^.]+$/, ''),
    caption: null,
    visibility: 'private',
  } as any);

  const finalId = saved?.id || id;
  return { id: finalId, uri: `/api/media/${finalId}`, filename: img.name };
}

export function registerImportFileRoutes(
  router: Hono,
  repo: IPortfolioRepository,
  storage?: MediaStorageAdapter,
  cfg?: AppConfig
): void {
  router.post('/files', async (c) => {
    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: 'Expected multipart/form-data payload with "files" field.' }, 400);
    }

    const rawFiles = [...formData.getAll('files'), ...formData.getAll('file')].filter(
      (v): v is File => typeof v !== 'string' && typeof v.arrayBuffer === 'function'
    );
    if (rawFiles.length === 0) {
      return c.json({ error: 'At least one file is required in "files" field.' }, 400);
    }

    const documents: Array<{ title: string; slug: string; body_md: string; sourceFilename: string }> = [];
    const uploadedMedia: Array<{ id: string; uri: string; filename: string }> = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of rawFiles) {
      const filename = file.name || 'upload.txt';
      try {
        if (file.size > MAX_IMPORT_FILE_BYTES) {
          errors.push({ filename, error: 'File exceeds maximum import size limit.' });
          continue;
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const parsed = parseSingleImportFile(filename, buf);

        const mediaMap = new Map<string, string>();
        if (storage && cfg) {
          for (const img of parsed.standaloneImages) {
            const uploaded = await uploadEmbeddedImage(img, repo, storage, cfg);
            if (uploaded) {
              uploadedMedia.push(uploaded);
              mediaMap.set(img.name, uploaded.uri);
            }
          }
        }

        for (const doc of parsed.docs) {
          let bodyMd = doc.body_md;
          if (storage && cfg && doc.embeddedImages.length > 0) {
            const appendedRefs: string[] = [];
            for (const img of doc.embeddedImages) {
              const uploaded = await uploadEmbeddedImage(img, repo, storage, cfg);
              if (uploaded) {
                uploadedMedia.push(uploaded);
                mediaMap.set(img.name, uploaded.uri);
                appendedRefs.push(`![${img.name.replace(/\.[^.]+$/, '')}](${uploaded.uri})`);
              }
            }
            if (appendedRefs.length > 0) {
              bodyMd = `${bodyMd}\n\n${appendedRefs.join('\n\n')}`;
            }
          }

          // Rewrite relative image references from ZIP bundles to uploaded /api/media/:id URIs
          for (const [imgName, uri] of mediaMap.entries()) {
            const escName = imgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            bodyMd = bodyMd.replace(new RegExp(`\\((?:[^)\\s]*/)?${escName}\\)`, 'g'), `(${uri})`);
          }

          documents.push({
            title: doc.title,
            slug: doc.slug,
            body_md: bodyMd,
            sourceFilename: doc.sourceFilename,
          });
        }
      } catch (err: any) {
        errors.push({ filename, error: err?.message || 'Failed to parse file.' });
      }
    }

    return c.json({ documents, uploadedMedia, errors }, 200);
  });
}
