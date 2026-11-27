import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { AppConfig } from '@living-portfolio/config';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { AuthManager } from '../auth/security.js';
import type { MediaStorageAdapter } from '../media/storage.js';
import {
  buildHashedStorageKey,
  computeSha256Hex,
  sanitiseFilename,
  sniffMediaBytes,
} from '../media/sniff.js';
import { parseImageDimensions, stripImageMetadata } from '../media/image-process.js';
import { parseHttpByteRange, readBoundedMultipartFormData } from '../media/stream-upload.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseAllowedMimeTypes(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s !== 'image/svg+xml')
  );
}

function normalizeClientMime(raw: string | undefined): string {
  if (!raw) return '';
  return raw.split(';')[0].trim().toLowerCase();
}

export function createMediaRoutes(
  repo: IPortfolioRepository,
  auth: AuthManager,
  storage: MediaStorageAdapter,
  cfg: AppConfig
) {
  const router = new Hono();

  // Admin-only listing: never expose unreferenced/private media publicly
  router.get('/', auth.requireAdminMiddleware(), async (c) => {
    const items = await repo.listMedia();
    const totalBytes = await repo.getTotalMediaBytes();
    const allowedMimeTypes = Array.from(parseAllowedMimeTypes(cfg.MEDIA_ALLOWED_MIME_TYPES));
    return c.json({
      items,
      total_bytes: totalBytes,
      quota_bytes: cfg.MEDIA_MAX_TOTAL_BYTES,
      backend: storage.kind,
      limits: {
        max_image_bytes: cfg.MEDIA_MAX_IMAGE_BYTES,
        max_video_bytes: cfg.MEDIA_MAX_VIDEO_BYTES,
        max_total_bytes: cfg.MEDIA_MAX_TOTAL_BYTES,
        allowed_mime_types: allowedMimeTypes,
      },
    });
  });

  // Admin-only upload with auth + CSRF + pre-buffer streaming size limit
  router.post('/', auth.requireAdminMiddleware(), async (c) => {
    const currentTotal = await repo.getTotalMediaBytes();
    const bounded = await readBoundedMultipartFormData(c.req.raw, {
      maxImageBytes: cfg.MEDIA_MAX_IMAGE_BYTES,
      maxVideoBytes: cfg.MEDIA_MAX_VIDEO_BYTES,
      maxTotalBytes: cfg.MEDIA_MAX_TOTAL_BYTES,
      currentTotalBytes: currentTotal,
    });
    if (!bounded.ok) {
      return c.json(
        {
          error: bounded.error,
          code: bounded.code,
          ...(bounded.limit_bytes !== undefined ? { limit_bytes: bounded.limit_bytes } : {}),
        },
        bounded.status
      );
    }

    const formData = bounded.formData;
    const fileEntry = formData.get('file');
    if (!fileEntry || typeof fileEntry === 'string' || typeof fileEntry.arrayBuffer !== 'function') {
      return c.json(
        {
          error: 'Missing media file in form field "file".',
          code: 'MISSING_FILE',
        },
        400
      );
    }

    const rawBytes = new Uint8Array(await fileEntry.arrayBuffer());
    if (rawBytes.byteLength === 0) {
      return c.json(
        {
          error: 'Uploaded file is empty.',
          code: 'EMPTY_FILE',
        },
        400
      );
    }

    // 1. Content sniffing (never trust client Content-Type or filename)
    const clientMime = normalizeClientMime(fileEntry.type);
    const sniffed = sniffMediaBytes(rawBytes);

    if (sniffed.rejectedReason === 'svg' || clientMime === 'image/svg+xml') {
      return c.json(
        {
          error: 'SVG files are not permitted for security reasons.',
          code: 'SVG_REJECTED',
        },
        415
      );
    }

    if (!sniffed.mimeType || !sniffed.category) {
      return c.json(
        {
          error: 'Unsupported or unrecognised media file content.',
          code: 'UNSUPPORTED_MEDIA_TYPE',
        },
        415
      );
    }

    if (
      clientMime &&
      clientMime !== 'application/octet-stream' &&
      clientMime !== sniffed.mimeType &&
      !(clientMime === 'image/jpg' && sniffed.mimeType === 'image/jpeg')
    ) {
      return c.json(
        {
          error: `Declared content type (${clientMime}) does not match file content (${sniffed.mimeType}).`,
          code: 'MIME_MISMATCH',
        },
        415
      );
    }

    // 2. Check configured allowed MIME types
    const allowedMimeTypes = parseAllowedMimeTypes(cfg.MEDIA_ALLOWED_MIME_TYPES);
    if (!allowedMimeTypes.has(sniffed.mimeType)) {
      return c.json(
        {
          error: `Media type ${sniffed.mimeType} is not allowed by configuration.`,
          code: 'DISALLOWED_MEDIA_TYPE',
        },
        415
      );
    }

    // 3. Enforce per-type size limits before parsing/storing
    const maxBytes =
      sniffed.category === 'video' ? cfg.MEDIA_MAX_VIDEO_BYTES : cfg.MEDIA_MAX_IMAGE_BYTES;
    if (rawBytes.byteLength > maxBytes) {
      return c.json(
        {
          error: `File exceeds the ${sniffed.category} size limit of ${maxBytes} bytes.`,
          code: 'FILE_TOO_LARGE',
          limit_bytes: maxBytes,
          actual_bytes: rawBytes.byteLength,
        },
        413
      );
    }

    // 4. Parse image dimensions & strip EXIF/GPS/XMP metadata without re-encoding
    let width: number | null = null;
    let height: number | null = null;
    let cleanBytes: Uint8Array = rawBytes;
    if (sniffed.category === 'image') {
      const dims = parseImageDimensions(rawBytes, sniffed.mimeType);
      if (!dims) {
        return c.json(
          {
            error: 'Corrupt or unparseable image dimensions.',
            code: 'UNPARSEABLE_IMAGE',
          },
          415
        );
      }
      width = dims.width;
      height = dims.height;
      cleanBytes = stripImageMetadata(rawBytes, sniffed.mimeType);
    }

    // 5. Enforce total storage quota against stored byte count
    if (currentTotal + cleanBytes.byteLength > cfg.MEDIA_MAX_TOTAL_BYTES) {
      return c.json(
        {
          error: 'Storage quota exceeded.',
          code: 'STORAGE_QUOTA_EXCEEDED',
          used_bytes: currentTotal,
          quota_bytes: cfg.MEDIA_MAX_TOTAL_BYTES,
        },
        413
      );
    }

    // 6. Parse optional metadata fields (visibility is derived from entry references, never accepted from upload form)
    const rawAlt = formData.get('alt_text');
    const altText = typeof rawAlt === 'string' ? rawAlt.trim().slice(0, 1000) : null;
    const rawCaption = formData.get('caption');
    const caption = typeof rawCaption === 'string' ? rawCaption.trim().slice(0, 2000) : null;
    const rawEntryId = formData.get('entry_id');
    const entryId =
      typeof rawEntryId === 'string' && rawEntryId.trim().length > 0 ? rawEntryId.trim() : null;
    if (entryId && !UUID_RE.test(entryId)) {
      return c.json({ error: 'Invalid entry_id format.', code: 'INVALID_ENTRY_ID' }, 400);
    }

    const safeFilename = sanitiseFilename(fileEntry.name);
    const sha256 = computeSha256Hex(cleanBytes);
    const storageKey = buildHashedStorageKey(sha256, sniffed.mimeType);

    await storage.put(storageKey, cleanBytes, sniffed.mimeType);

    const id = randomUUID();
    const asset = await repo.saveMedia({
      id,
      entry_id: entryId,
      mime_type: sniffed.mimeType,
      uri: `/api/media/${id}`,
      storage_key: storageKey,
      original_filename: safeFilename,
      size_bytes: cleanBytes.byteLength,
      width,
      height,
      sha256,
      visibility: 'private',
      alt_text: altText,
      caption,
    } as any);

    return c.json(asset, 201);
  });

  // Admin-only metadata update (alt_text, caption)
  router.patch('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') ?? '';
    if (!UUID_RE.test(id)) {
      return c.json({ error: 'Invalid media ID.', code: 'INVALID_MEDIA_ID' }, 400);
    }
    const existing = await repo.getMedia(id);
    if (!existing) {
      return c.json({ error: 'Media asset not found.', code: 'NOT_FOUND' }, 404);
    }
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Invalid JSON body.', code: 'INVALID_BODY' }, 400);
    }
    const updates: { alt_text?: string | null; caption?: string | null } = {};
    if ('alt_text' in body) {
      updates.alt_text =
        typeof body.alt_text === 'string' ? body.alt_text.trim().slice(0, 1000) : null;
    }
    if ('caption' in body) {
      updates.caption =
        typeof body.caption === 'string' ? body.caption.trim().slice(0, 2000) : null;
    }
    const updated = repo.updateMedia
      ? await repo.updateMedia(id, updates)
      : existing;
    return c.json(updated);
  });

  // Serve media by UUID with derived visibility & HTTP Range (206 / 416) support
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    if (!UUID_RE.test(id)) {
      return c.json({ error: 'Invalid media ID.', code: 'INVALID_MEDIA_ID' }, 400);
    }

    const asset = await repo.getMedia(id);
    if (!asset || !asset.storage_key) {
      return c.json({ error: 'Media asset not found.', code: 'NOT_FOUND' }, 404);
    }

    // Derived visibility: publicly readable iff referenced by >= 1 published public entry
    const isPubliclyReadable = (asset.public_reference_count ?? 0) > 0;
    if (!isPubliclyReadable) {
      const authCheck = auth.isAdminAuthenticated(c);
      if (!authCheck.authenticated) {
        return c.json(
          {
            error: 'Unauthorized: media asset is not referenced by any published public entry.',
            code: 'UNAUTHORIZED',
          },
          401
        );
      }
    }

    const safeDispositionName = sanitiseFilename(asset.original_filename ?? `${asset.id}`);
    const cacheControl = isPubliclyReadable
      ? 'public, max-age=31536000, immutable'
      : 'private, max-age=0, no-store';

    const setSecurityHeaders = () => {
      c.header('Content-Type', asset.mime_type);
      c.header('Accept-Ranges', 'bytes');
      c.header('X-Content-Type-Options', 'nosniff');
      c.header('Content-Security-Policy', "default-src 'none'; sandbox");
      c.header('Content-Disposition', `inline; filename="${safeDispositionName}"`);
      c.header('Cache-Control', cacheControl);
      if (asset.sha256) {
        c.header('ETag', `"${asset.sha256}"`);
      }
    };

    const rangeHeader = c.req.header('range');
    if (rangeHeader) {
      const headInfo = storage.head
        ? await storage.head(asset.storage_key)
        : await storage.get(asset.storage_key);
      if (!headInfo) {
        return c.json({ error: 'Media binary not found in storage.', code: 'NOT_FOUND' }, 404);
      }
      const totalBytes = headInfo.sizeBytes;
      const parsedRange = parseHttpByteRange(rangeHeader, totalBytes);
      if (!parsedRange.valid) {
        c.header('Accept-Ranges', 'bytes');
        c.header('Content-Range', `bytes */${totalBytes}`);
        return c.body(null, 416);
      }
      const ranged = storage.getRange
        ? await storage.getRange(asset.storage_key, parsedRange.start, parsedRange.end)
        : null;
      let sliceData: Uint8Array;
      if (ranged) {
        sliceData = ranged.data;
      } else {
        const full = await storage.get(asset.storage_key);
        if (!full) {
          return c.json({ error: 'Media binary not found in storage.', code: 'NOT_FOUND' }, 404);
        }
        sliceData = full.data.subarray(parsedRange.start, parsedRange.end + 1);
      }
      setSecurityHeaders();
      c.header('Content-Range', `bytes ${parsedRange.start}-${parsedRange.end}/${totalBytes}`);
      c.header('Content-Length', String(sliceData.byteLength));
      return c.body(Buffer.from(sliceData), 206);
    }

    const stored = await storage.get(asset.storage_key);
    if (!stored) {
      return c.json({ error: 'Media binary not found in storage.', code: 'NOT_FOUND' }, 404);
    }

    setSecurityHeaders();
    c.header('Content-Length', String(stored.sizeBytes));
    return c.body(Buffer.from(stored.data), 200);
  });

  // Admin-only delete: blocks if referenced by a published public entry; refcounts content-addressed storage
  router.delete('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') ?? '';
    if (!UUID_RE.test(id)) {
      return c.json({ error: 'Invalid media ID.', code: 'INVALID_MEDIA_ID' }, 400);
    }

    const asset = await repo.getMedia(id);
    if (!asset) {
      return c.json({ error: 'Media asset not found.', code: 'NOT_FOUND' }, 404);
    }

    if ((asset.public_reference_count ?? 0) > 0) {
      return c.json(
        {
          error: 'Asset is still referenced by a published entry. Unpublish or remove the reference first.',
          code: 'MEDIA_IN_USE',
          public_reference_count: asset.public_reference_count,
        },
        409
      );
    }

    await repo.deleteMedia(id);

    if (asset.storage_key) {
      const remaining = await repo.listMedia();
      const shared = remaining.some(
        (other) =>
          other.id !== id &&
          (other.storage_key === asset.storage_key ||
            (Boolean(asset.sha256) && other.sha256 === asset.sha256))
      );
      if (!shared) {
        await storage.delete(asset.storage_key);
      }
    }

    return c.json({ deleted: true, id });
  });

  return router;
}
