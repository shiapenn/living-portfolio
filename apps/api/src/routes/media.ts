import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { AppConfig } from '@living-portfolio/config';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { Visibility } from '@living-portfolio/core';
import type { AuthManager } from '../auth/security.js';
import type { MediaStorageAdapter } from '../media/storage.js';
import {
  buildHashedStorageKey,
  computeSha256Hex,
  sanitiseFilename,
  sniffMediaBytes,
} from '../media/sniff.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_VISIBILITIES = new Set<Visibility>(['private', 'unlisted', 'public']);

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

  // Admin-only listing: never expose private media publicly
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

  // Admin-only upload with auth + CSRF (enforced by requireAdminMiddleware)
  router.post('/', auth.requireAdminMiddleware(), async (c) => {
    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json(
        {
          error: 'Expected multipart/form-data body with a file field.',
          code: 'INVALID_MULTIPART',
        },
        400
      );
    }

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

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    if (bytes.byteLength === 0) {
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
    const sniffed = sniffMediaBytes(bytes);

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

    // Reject spoofed MIME declarations when client declares a concrete mismatched type
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

    // 3. Enforce per-type size limits from configuration
    const maxBytes =
      sniffed.category === 'video' ? cfg.MEDIA_MAX_VIDEO_BYTES : cfg.MEDIA_MAX_IMAGE_BYTES;
    if (bytes.byteLength > maxBytes) {
      return c.json(
        {
          error: `File exceeds the ${sniffed.category} size limit of ${maxBytes} bytes.`,
          code: 'FILE_TOO_LARGE',
          limit_bytes: maxBytes,
          actual_bytes: bytes.byteLength,
        },
        413
      );
    }

    // 4. Enforce total storage quota
    const currentTotal = await repo.getTotalMediaBytes();
    if (currentTotal + bytes.byteLength > cfg.MEDIA_MAX_TOTAL_BYTES) {
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

    // 5. Parse optional metadata fields
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

    const rawVisibility = formData.get('visibility');
    let visibility: Visibility = 'private';
    if (typeof rawVisibility === 'string' && rawVisibility.trim().length > 0) {
      const candidate = rawVisibility.trim().toLowerCase() as Visibility;
      if (!ALLOWED_VISIBILITIES.has(candidate)) {
        return c.json({ error: 'Invalid visibility value.', code: 'INVALID_VISIBILITY' }, 400);
      }
      visibility = candidate;
    }

    // 6. Sanitise filename, compute SHA-256, store under hashed key
    const safeFilename = sanitiseFilename(fileEntry.name);
    const sha256 = computeSha256Hex(bytes);
    const storageKey = buildHashedStorageKey(sha256, sniffed.mimeType);

    await storage.put(storageKey, bytes, sniffed.mimeType);

    const id = randomUUID();
    const asset = await repo.saveMedia({
      id,
      entry_id: entryId,
      mime_type: sniffed.mimeType,
      uri: `/api/v1/media/${id}`,
      storage_key: storageKey,
      original_filename: safeFilename,
      size_bytes: bytes.byteLength,
      sha256,
      visibility,
      alt_text: altText,
      caption,
    } as any);

    return c.json(asset, 201);
  });

  // Serve media by UUID with private access enforcement & strict headers
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    if (!UUID_RE.test(id)) {
      return c.json({ error: 'Invalid media ID.', code: 'INVALID_MEDIA_ID' }, 400);
    }

    const asset = await repo.getMedia(id);
    if (!asset || !asset.storage_key) {
      return c.json({ error: 'Media asset not found.', code: 'NOT_FOUND' }, 404);
    }

    // Enforce visibility: private media (or media linked to a private entry) requires admin auth
    let requiresAuth = (asset.visibility ?? 'private') === 'private';
    if (!requiresAuth && asset.entry_id) {
      const linked = await repo.getEntry(asset.entry_id, ['public', 'unlisted', 'private']);
      if (linked && linked.entry.visibility === 'private') {
        requiresAuth = true;
      }
    }

    if (requiresAuth) {
      const authCheck = auth.isAdminAuthenticated(c);
      if (!authCheck.authenticated) {
        return c.json(
          { error: 'Unauthorized: authentication required for private media.', code: 'UNAUTHORIZED' },
          401
        );
      }
    }

    const stored = await storage.get(asset.storage_key);
    if (!stored) {
      return c.json({ error: 'Media binary not found in storage.', code: 'NOT_FOUND' }, 404);
    }

    const safeDispositionName = sanitiseFilename(asset.original_filename ?? `${asset.id}`);
    const cacheControl = requiresAuth
      ? 'private, max-age=0, no-store'
      : 'public, max-age=31536000, immutable';

    c.header('Content-Type', asset.mime_type);
    c.header('Content-Length', String(stored.sizeBytes));
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Content-Security-Policy', "default-src 'none'; sandbox");
    c.header('Content-Disposition', `inline; filename="${safeDispositionName}"`);
    c.header('Cache-Control', cacheControl);
    if (asset.sha256) {
      c.header('ETag', `"${asset.sha256}"`);
    }

    return c.body(Buffer.from(stored.data), 200);
  });

  // Admin-only delete
  router.delete('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') ?? '';
    if (!UUID_RE.test(id)) {
      return c.json({ error: 'Invalid media ID.', code: 'INVALID_MEDIA_ID' }, 400);
    }

    const asset = await repo.getMedia(id);
    if (!asset) {
      return c.json({ error: 'Media asset not found.', code: 'NOT_FOUND' }, 404);
    }

    if (asset.storage_key) {
      await storage.delete(asset.storage_key);
    }
    await repo.deleteMedia(id);
    return c.json({ deleted: true, id });
  });

  return router;
}
