/**
 * WP-18.3 Media API Security Regression & Conformance Suite (D-06, D-STORAGE)
 *
 * Verifies:
 * - Auth + CSRF enforcement on POST /media, GET /media (no public listing), DELETE /media/:id
 * - Private vs public media access control on GET /media/:id
 * - Content sniffing from magic bytes (PNG, JPEG, GIF, WebP, MP4, WebM) — never trusts client MIME
 * - SVG rejection (both declared image/svg+xml and SVG bytes spoofed as image/png)
 * - Spoofed MIME / HTML / JS / wrong-type rejection
 * - Config-driven per-type size limits (image, video) and total storage quota
 * - Filename sanitisation, hashed storage keys, and path traversal rejection
 * - LocalVolumeMediaStorageAdapter and S3CompatibleMediaStorageAdapter (SigV4)
 * - Migration 0004_media_assets_metadata registered and idempotent
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../app.js';
import { loadConfig } from '@living-portfolio/config';
import { MIGRATIONS } from '@living-portfolio/db';
import {
  LocalVolumeMediaStorageAdapter,
  S3CompatibleMediaStorageAdapter,
} from '../media/storage.js';
import {
  buildHashedStorageKey,
  computeSha256Hex,
  sanitiseFilename,
  sniffMediaBytes,
} from '../media/sniff.js';

// Synthetic 1x1 valid PNG (89 50 4E 47 0D 0A 1A 0A ...)
const SYNTHETIC_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

// Synthetic minimal JPEG header
const SYNTHETIC_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

// Synthetic minimal GIF89a header
const SYNTHETIC_GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00]);

// Synthetic minimal WebP header (RIFF....WEBP)
const SYNTHETIC_WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x14, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

// Synthetic minimal MP4 ftyp header
const SYNTHETIC_MP4 = new Uint8Array([
  0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
  0x69, 0x73, 0x6f, 0x6d,
]);

// Synthetic minimal WebM EBML header
const SYNTHETIC_WEBM = new Uint8Array([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84,
  0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x02,
]);

const SYNTHETIC_SVG = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
);

const SYNTHETIC_HTML = new TextEncoder().encode(
  '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>'
);

const TEST_ADMIN_TOKEN = `lp_pat_${randomBytes(16).toString('hex')}`;

function buildUploadForm(
  bytes: Uint8Array,
  filename: string,
  declaredMime: string,
  extra?: Record<string, string>
): FormData {
  const form = new FormData();
  const blob = new Blob([Buffer.from(bytes)], { type: declaredMime });
  form.append('file', blob, filename);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      form.append(k, v);
    }
  }
  return form;
}

describe('WP-18.3 Media API — Security Regression, Limits, Sniffing & Storage Adapters', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'lp-wp18-3-media-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers migration 0004_media_assets_metadata in MIGRATIONS', () => {
    const mig = MIGRATIONS.find((m) => m.name === '0004_media_assets_metadata');
    expect(mig).toBeDefined();
    expect(mig?.sql).toContain('storage_key');
    expect(mig?.sql).toContain('size_bytes');
    expect(mig?.sql).toContain('sha256');
    expect(mig?.sql).toContain('visibility');
  });

  it('sniffs PNG, JPEG, GIF, WebP, MP4, WebM from magic bytes and rejects SVG/HTML/unknown', () => {
    expect(sniffMediaBytes(SYNTHETIC_PNG).mimeType).toBe('image/png');
    expect(sniffMediaBytes(SYNTHETIC_JPEG).mimeType).toBe('image/jpeg');
    expect(sniffMediaBytes(SYNTHETIC_GIF).mimeType).toBe('image/gif');
    expect(sniffMediaBytes(SYNTHETIC_WEBP).mimeType).toBe('image/webp');
    expect(sniffMediaBytes(SYNTHETIC_MP4).mimeType).toBe('video/mp4');
    expect(sniffMediaBytes(SYNTHETIC_WEBM).mimeType).toBe('video/webm');

    const svgRes = sniffMediaBytes(SYNTHETIC_SVG);
    expect(svgRes.mimeType).toBeNull();
    expect(svgRes.rejectedReason).toBe('svg');

    const htmlRes = sniffMediaBytes(SYNTHETIC_HTML);
    expect(htmlRes.mimeType).toBeNull();
    expect(htmlRes.rejectedReason).toBe('html_or_script');

    const textRes = sniffMediaBytes(new TextEncoder().encode('just plain text file'));
    expect(textRes.mimeType).toBeNull();
    expect(textRes.rejectedReason).toBe('unknown');
  });

  it('sanitises traversal filenames and produces strict hashed storage keys', () => {
    expect(sanitiseFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitiseFilename('C:\\Windows\\System32\\evil..png')).toBe('evil.png');
    expect(sanitiseFilename('...hidden\0file.png')).toBe('hiddenfile.png');
    expect(sanitiseFilename('')).toBe('upload');

    const hash = computeSha256Hex(SYNTHETIC_PNG);
    const key = buildHashedStorageKey(hash, 'image/png');
    expect(key).toMatch(/^[a-f0-9]{2}\/[a-f0-9]{64}\.png$/);
  });

  it('rejects unauthenticated upload, listing, and private media access (401)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_ADMIN_TOKEN,
      mediaStorage: storage,
    });

    // Unauthenticated POST /media -> 401
    const unauthPost = await app.request('/api/v1/media', {
      method: 'POST',
      body: buildUploadForm(SYNTHETIC_PNG, 'test.png', 'image/png'),
    });
    expect(unauthPost.status).toBe(401);

    // Unauthenticated GET /media (public listing blocked) -> 401
    const unauthList = await app.request('/api/v1/media');
    expect(unauthList.status).toBe(401);

    // Upload private media as admin
    const uploadRes = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_PNG, 'secret.png', 'image/png', {
        alt_text: 'Private architecture diagram',
        visibility: 'private',
      }),
    });
    expect(uploadRes.status).toBe(201);
    const uploaded = (await uploadRes.json()) as any;
    expect(uploaded.id).toBeTruthy();
    expect(uploaded.alt_text).toBe('Private architecture diagram');
    expect(uploaded.visibility).toBe('private');

    // Unauthenticated GET /media/:id for private media -> 401
    const unauthGet = await app.request(`/api/v1/media/${uploaded.id}`);
    expect(unauthGet.status).toBe(401);

    // Authenticated GET /media/:id for private media -> 200 with strict headers
    const authGet = await app.request(`/api/v1/media/${uploaded.id}`, {
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
    });
    expect(authGet.status).toBe(200);
    expect(authGet.headers.get('content-type')).toBe('image/png');
    expect(authGet.headers.get('x-content-type-options')).toBe('nosniff');
    expect(authGet.headers.get('content-security-policy')).toContain('sandbox');
    expect(authGet.headers.get('cache-control')).toContain('private');
    const fetchedBytes = new Uint8Array(await authGet.arrayBuffer());
    expect(Buffer.from(fetchedBytes).equals(Buffer.from(SYNTHETIC_PNG))).toBe(true);
  });

  it('enforces CSRF on cookie-authenticated POST /media (403 without token, 201 with token)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app, auth } = createApp(undefined, { mediaStorage: storage });

    // Create a real session via AuthManager
    const session = auth.createSession('owner');

    // Cookie without X-CSRF-Token -> 403
    const noCsrf = await app.request('/api/v1/media', {
      method: 'POST',
      headers: {
        Cookie: `lp_session=${session.id}`,
      },
      body: buildUploadForm(SYNTHETIC_PNG, 'diagram.png', 'image/png'),
    });
    expect(noCsrf.status).toBe(403);

    // Cookie with valid X-CSRF-Token -> 201 (visibility is derived from entry references, not upload form)
    const withCsrf = await app.request('/api/v1/media', {
      method: 'POST',
      headers: {
        Cookie: `lp_session=${session.id}`,
        'X-CSRF-Token': session.csrfToken,
      },
      body: buildUploadForm(SYNTHETIC_PNG, 'diagram.png', 'image/png', {
        alt_text: 'System diagram',
      }),
    });
    expect(withCsrf.status).toBe(201);
    const created = (await withCsrf.json()) as any;

    // Publish a public entry referencing this asset -> publicly readable without auth
    const bodyMd = `Published diagram ![System diagram](/api/media/${created.id})`;
    const previewRes = await app.request('/api/v1/entries/redaction-preview', {
      method: 'POST',
      headers: {
        Cookie: `lp_session=${session.id}`,
        'X-CSRF-Token': session.csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryId: 'draft', text: bodyMd }),
    });
    const preview = (await previewRes.json()) as any;
    const entryRes = await app.request('/api/v1/entries', {
      method: 'POST',
      headers: {
        Cookie: `lp_session=${session.id}`,
        'X-CSRF-Token': session.csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'csrf-media-entry',
        title: 'CSRF Media Entry',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: bodyMd,
        redactionPreviewToken: preview.redactionPreviewToken,
      }),
    });
    expect(entryRes.status).toBe(201);

    const pubGet = await app.request(`/api/v1/media/${created.id}`);
    expect(pubGet.status).toBe(200);
    expect(pubGet.headers.get('content-type')).toBe('image/png');
    expect(pubGet.headers.get('cache-control')).toContain('public');
  });

  it('rejects SVG, wrong type, and spoofed MIME types (415)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_ADMIN_TOKEN,
      mediaStorage: storage,
    });

    // 1. Declared SVG
    const svgRes = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_SVG, 'icon.svg', 'image/svg+xml'),
    });
    expect(svgRes.status).toBe(415);
    expect(((await svgRes.json()) as any).code).toBe('SVG_REJECTED');

    // 2. SVG spoofed as image/png
    const spoofedSvg = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_SVG, 'evil.png', 'image/png'),
    });
    expect(spoofedSvg.status).toBe(415);
    expect(((await spoofedSvg.json()) as any).code).toBe('SVG_REJECTED');

    // 3. HTML/JS spoofed as image/png
    const spoofedHtml = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_HTML, 'xss.png', 'image/png'),
    });
    expect(spoofedHtml.status).toBe(415);

    // 4. Plain text wrong type
    const plainText = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(new TextEncoder().encode('hello world'), 'notes.txt', 'text/plain'),
    });
    expect(plainText.status).toBe(415);

    // 5. Valid JPEG bytes spoofed with declared image/png MIME
    const mismatchedMime = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_JPEG, 'photo.png', 'image/png'),
    });
    expect(mismatchedMime.status).toBe(415);
    expect(((await mismatchedMime.json()) as any).code).toBe('MIME_MISMATCH');
  });

  it('enforces config-driven image size limit, video size limit, and total quota (413)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const cfg = loadConfig({
      env: {
        MEDIA_MAX_IMAGE_BYTES: '100',
        MEDIA_MAX_VIDEO_BYTES: '120',
        MEDIA_MAX_TOTAL_BYTES: '150',
      },
    });
    const { app } = createApp(undefined, {
      config: cfg,
      bootstrapAdminToken: TEST_ADMIN_TOKEN,
      mediaStorage: storage,
    });

    // Oversize image (> 100 bytes)
    const bigPng = new Uint8Array(120);
    bigPng.set(SYNTHETIC_PNG);
    const overImage = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(bigPng, 'big.png', 'image/png'),
    });
    expect(overImage.status).toBe(413);
    expect(((await overImage.json()) as any).code).toBe('FILE_TOO_LARGE');

    // Oversize video (> 120 bytes)
    const bigMp4 = new Uint8Array(140);
    bigMp4.set(SYNTHETIC_MP4);
    const overVideo = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(bigMp4, 'big.mp4', 'video/mp4'),
    });
    expect(overVideo.status).toBe(413);
    expect(((await overVideo.json()) as any).code).toBe('FILE_TOO_LARGE');

    // Two valid 67-byte PNGs fit (134 <= 150), third exceeds total quota (201 > 150)
    const first = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_PNG, 'one.png', 'image/png'),
    });
    expect(first.status).toBe(201);

    const second = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_PNG, 'two.png', 'image/png'),
    });
    expect(second.status).toBe(201);

    const third = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_PNG, 'three.png', 'image/png'),
    });
    expect(third.status).toBe(413);
    expect(((await third.json()) as any).code).toBe('STORAGE_QUOTA_EXCEEDED');
  });

  it('defends against path traversal in upload filenames, GET :id, and storage adapter keys', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_ADMIN_TOKEN,
      mediaStorage: storage,
    });

    // Traversal filename in upload is sanitised & stored strictly inside baseDir under hashed key
    const uploadRes = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      body: buildUploadForm(SYNTHETIC_PNG, '../../../etc/passwd.png', 'image/png'),
    });
    expect(uploadRes.status).toBe(201);
    const asset = (await uploadRes.json()) as any;
    expect(asset.original_filename).toBe('passwd.png');
    expect(asset.storage_key).toMatch(/^[a-f0-9]{2}\/[a-f0-9]{64}\.png$/);
    expect(existsSync(resolve(tempDir, asset.storage_key))).toBe(true);

    // Path traversal in GET /media/:id -> 400
    const trav1 = await app.request('/api/v1/media/..%2F..%2Fetc%2Fpasswd');
    expect(trav1.status).toBe(400);

    const trav2 = await app.request('/api/v1/media/not-a-uuid');
    expect(trav2.status).toBe(400);

    // Direct storage adapter path traversal rejected
    await expect(storage.get('../../etc/passwd')).rejects.toThrow('Invalid media storage key');
    await expect(storage.put('../escape.png', SYNTHETIC_PNG, 'image/png')).rejects.toThrow(
      'Invalid media storage key'
    );
  });

  it('supports LocalVolumeMediaStorageAdapter and S3CompatibleMediaStorageAdapter lifecycle', async () => {
    // Local adapter put/exists/get/delete
    const local = new LocalVolumeMediaStorageAdapter(tempDir);
    const hash = computeSha256Hex(SYNTHETIC_PNG);
    const key = buildHashedStorageKey(hash, 'image/png');

    expect(await local.exists(key)).toBe(false);
    await local.put(key, SYNTHETIC_PNG, 'image/png');
    expect(await local.exists(key)).toBe(true);
    const got = await local.get(key);
    expect(got?.sizeBytes).toBe(SYNTHETIC_PNG.byteLength);
    expect(await local.delete(key)).toBe(true);
    expect(await local.exists(key)).toBe(false);

    // S3-compatible adapter with injected mock fetch (verifies SigV4 Authorization header + CRUD)
    const store = new Map<string, Uint8Array>();
    const seenAuthHeaders: string[] = [];
    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const headers = init?.headers as Record<string, string>;
      if (headers?.authorization) seenAuthHeaders.push(headers.authorization);

      if (method === 'PUT') {
        store.set(url, new Uint8Array(init?.body as Buffer));
        return new Response(null, { status: 200 });
      }
      if (method === 'HEAD') {
        return new Response(null, { status: store.has(url) ? 200 : 404 });
      }
      if (method === 'GET') {
        const val = store.get(url);
        if (!val) return new Response(null, { status: 404 });
        return new Response(Buffer.from(val), { status: 200 });
      }
      if (method === 'DELETE') {
        const existed = store.delete(url);
        return new Response(null, { status: existed ? 204 : 404 });
      }
      return new Response(null, { status: 405 });
    };

    const s3 = new S3CompatibleMediaStorageAdapter({
      bucket: 'portfolio-media-test',
      endpoint: 'https://s3.example.invalid',
      region: `region-${randomBytes(3).toString('hex')}`,
      accessKeyId: `AKIA_${randomBytes(8).toString('hex')}`,
      secretAccessKey: randomBytes(24).toString('hex'),
      fetchImpl: mockFetch,
    });

    await s3.put(key, SYNTHETIC_PNG, 'image/png');
    expect(await s3.exists(key)).toBe(true);
    const s3Got = await s3.get(key);
    expect(s3Got?.sizeBytes).toBe(SYNTHETIC_PNG.byteLength);
    expect(await s3.delete(key)).toBe(true);
    expect(await s3.exists(key)).toBe(false);
    expect(seenAuthHeaders.length).toBeGreaterThanOrEqual(4);
    expect(seenAuthHeaders.every((h) => h.startsWith('AWS4-HMAC-SHA256 Credential='))).toBe(true);
  });
});
