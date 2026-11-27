/**
 * WP-18.3a Media API Hardening — Behavioural Canary & Conformance Suite
 *
 * Covers all 7 hardening requirements without importing any new post-437f6b4 module paths
 * so every canary executes behaviourally against 437f6b4 in an isolated worktree:
 * 1. Delete refcount: content-addressed object removed only when no other row shares the hash.
 * 2. Image metadata stripping: EXIF/GPS/XMP stripped from JPEG/PNG/WebP without re-encoding;
 *    video metadata limitation noted in docs/design/content.md.
 * 3. HTTP Range: GET /media/:id supports Range (206, Content-Range, Accept-Ranges: bytes; 416 invalid)
 *    across both LocalVolumeMediaStorageAdapter and S3CompatibleMediaStorageAdapter.
 * 4. Dimensions: parse width/height at upload (PNG/JPEG/GIF/WebP), store in asset row (migration 0005),
 *    return in API, reject unparseable images (415).
 * 5. Streaming size limit: enforced before buffering body (Content-Length + counting stream reader);
 *    413 beyond MEDIA_MAX_*_BYTES with proof of early stream cancellation and bounded memory.
 * 6. Derived visibility: publicly readable iff referenced by >= 1 published public entry (current revision);
 *    media-reference index updated on entry save, publish, unpublish, and delete; upload form visibility ignored.
 * 7. CodeQL & secret hygiene: zero suppression comments, zero SARIF dismissals, zero fallback secrets.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../app.js';
import {
  AuthManager,
  computeRecoveryCodeHash,
  generateRecoveryCodes,
} from '../auth/security.js';
import {
  LocalVolumeMediaStorageAdapter,
  S3CompatibleMediaStorageAdapter,
} from '../media/storage.js';
import { loadConfig } from '@living-portfolio/config';
import { MIGRATIONS } from '@living-portfolio/db';

const TEST_TOKEN = `lp_pat_${randomBytes(16).toString('hex')}`;

// ── Synthetic Binary Builders (Pure JS, zero personal/third-party assets) ───

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcInput = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, p) => acc + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

/**
 * Builds a valid PNG with exact width/height and optional metadata chunks (eXIf, iTXt, tEXt).
 */
function buildSyntheticPng(
  width: number,
  height: number,
  extraChunks: Uint8Array[] = []
): { png: Uint8Array; idatPayload: Uint8Array } {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // Minimal zlib stream payload
  const idatPayload = new Uint8Array([0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01]);
  const parts = [
    sig,
    pngChunk('IHDR', ihdr),
    ...extraChunks,
    pngChunk('IDAT', idatPayload),
    pngChunk('IEND', new Uint8Array(0)),
  ];
  return { png: concatBytes(parts), idatPayload };
}

function jpegSegment(marker: number, payload: Uint8Array): Uint8Array {
  const len = payload.length + 2;
  const out = new Uint8Array(2 + len);
  out[0] = 0xff;
  out[1] = marker;
  out[2] = (len >>> 8) & 0xff;
  out[3] = len & 0xff;
  out.set(payload, 4);
  return out;
}

/**
 * Builds a valid minimal baseline JPEG with exact width/height and optional extra marker segments.
 */
function buildSyntheticJpeg(
  width: number,
  height: number,
  extraSegments: Uint8Array[] = []
): { jpeg: Uint8Array; scanBytes: Uint8Array } {
  const soi = new Uint8Array([0xff, 0xd8]);
  const jfif = jpegSegment(
    0xe0,
    new Uint8Array([
      0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    ])
  );
  const dqtPayload = new Uint8Array(65);
  dqtPayload[0] = 0x00;
  dqtPayload.fill(16, 1);
  const dqt = jpegSegment(0xdb, dqtPayload);

  const sof0Payload = new Uint8Array([
    0x08,
    (height >>> 8) & 0xff,
    height & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    0x01,
    0x01,
    0x11,
    0x00,
  ]);
  const sof0 = jpegSegment(0xc0, sof0Payload);

  const dhtPayload = new Uint8Array(1 + 16 + 1);
  dhtPayload[0] = 0x00;
  dhtPayload[1] = 0x01;
  dhtPayload[17] = 0x00;
  const dht = jpegSegment(0xc4, dhtPayload);

  const sosHeader = jpegSegment(
    0xda,
    new Uint8Array([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00])
  );
  const scanBytes = new Uint8Array([0x7f, 0xff, 0x00, 0x2a]); // includes byte-stuffed 0xFF 0x00
  const eoi = new Uint8Array([0xff, 0xd9]);

  return {
    jpeg: concatBytes([soi, jfif, ...extraSegments, dqt, sof0, dht, sosHeader, scanBytes, eoi]),
    scanBytes,
  };
}

/**
 * Builds a valid GIF89a with exact width/height.
 */
function buildSyntheticGif(width: number, height: number): Uint8Array {
  const out = new Uint8Array(14);
  const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
  out.set(header, 0);
  out[6] = width & 0xff;
  out[7] = (width >>> 8) & 0xff;
  out[8] = height & 0xff;
  out[9] = (height >>> 8) & 0xff;
  out[10] = 0x00; // no GCT
  out[11] = 0x00;
  out[12] = 0x00;
  out[13] = 0x3b; // trailer
  return out;
}

function riffChunk(fourcc: string, payload: Uint8Array): Uint8Array {
  const pad = payload.byteLength % 2 === 1 ? 1 : 0;
  const out = new Uint8Array(8 + payload.byteLength + pad);
  for (let i = 0; i < 4; i++) out[i] = fourcc.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, payload.byteLength, true);
  out.set(payload, 8);
  return out;
}

/**
 * Builds a valid lossless WebP (VP8L, optionally wrapped in VP8X with EXIF/XMP chunks).
 */
function buildSyntheticWebp(
  width: number,
  height: number,
  extraMeta?: { exif?: Uint8Array; xmp?: Uint8Array }
): { webp: Uint8Array; vp8lChunk: Uint8Array } {
  // VP8L: byte 0 = 0x2F signature, bytes 1..4 = (w-1) | ((h-1) << 14)
  const vp8lPayload = new Uint8Array(8);
  vp8lPayload[0] = 0x2f;
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14);
  new DataView(vp8lPayload.buffer).setUint32(1, bits >>> 0, true);
  vp8lPayload[5] = 0x00;
  vp8lPayload[6] = 0x00;
  vp8lPayload[7] = 0x00;
  const vp8lChunk = riffChunk('VP8L', vp8lPayload);

  const chunks: Uint8Array[] = [];
  if (extraMeta?.exif || extraMeta?.xmp) {
    const vp8xPayload = new Uint8Array(10);
    let flags = 0;
    if (extraMeta.exif) flags |= 0x08; // EXIF bit
    if (extraMeta.xmp) flags |= 0x04; // XMP bit
    vp8xPayload[0] = flags;
    const wMinus1 = width - 1;
    const hMinus1 = height - 1;
    vp8xPayload[4] = wMinus1 & 0xff;
    vp8xPayload[5] = (wMinus1 >>> 8) & 0xff;
    vp8xPayload[6] = (wMinus1 >>> 16) & 0xff;
    vp8xPayload[7] = hMinus1 & 0xff;
    vp8xPayload[8] = (hMinus1 >>> 8) & 0xff;
    vp8xPayload[9] = (hMinus1 >>> 16) & 0xff;
    chunks.push(riffChunk('VP8X', vp8xPayload));
  }
  chunks.push(vp8lChunk);
  if (extraMeta?.exif) chunks.push(riffChunk('EXIF', extraMeta.exif));
  if (extraMeta?.xmp) chunks.push(riffChunk('XMP ', extraMeta.xmp));

  const body = concatBytes([new TextEncoder().encode('WEBP'), ...chunks]);
  const riffHeader = new Uint8Array(8);
  riffHeader.set(new TextEncoder().encode('RIFF'), 0);
  new DataView(riffHeader.buffer).setUint32(4, body.byteLength, true);
  return { webp: concatBytes([riffHeader, body]), vp8lChunk };
}

function buildUploadForm(
  bytes: Uint8Array,
  filename: string,
  declaredMime: string,
  extra?: Record<string, string>
): FormData {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(bytes)], { type: declaredMime }), filename);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      form.append(k, v);
    }
  }
  return form;
}

function containsSubsequence(haystack: Uint8Array, needle: Uint8Array): boolean {
  if (needle.length === 0) return true;
  if (haystack.length < needle.length) return false;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

async function createPublishedPublicEntryWithBody(
  app: ReturnType<typeof createApp>['app'],
  token: string,
  slug: string,
  bodyMd: string
): Promise<{ entryId: string }> {
  const previewRes = await app.request('/api/v1/entries/redaction-preview', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entryId: 'draft', text: bodyMd }),
  });
  expect(previewRes.status).toBe(200);
  const preview = (await previewRes.json()) as any;

  const createRes = await app.request('/api/v1/entries', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug,
      title: `Entry ${slug}`,
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: bodyMd,
      redactionPreviewToken: preview.redactionPreviewToken,
    }),
  });
  expect(createRes.status).toBe(201);
  const created = (await createRes.json()) as any;
  return { entryId: created.entry.id };
}

describe('WP-18.3a Media API Hardening — Conformance & Behavioural Canaries (1–7)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'lp-wp18-3a-media-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ── 1. Delete refcount ────────────────────────────────────────────────────
  it('[1-REFCOUNT] removes content-addressed storage object only when no other row shares the hash', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const { png } = buildSyntheticPng(4, 4);

    const up1 = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(png, 'first.png', 'image/png', { alt_text: 'First copy' }),
    });
    expect(up1.status).toBe(201);
    const row1 = (await up1.json()) as any;

    const up2 = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(png, 'second.png', 'image/png', { alt_text: 'Second copy' }),
    });
    expect(up2.status).toBe(201);
    const row2 = (await up2.json()) as any;

    expect(row1.id).not.toBe(row2.id);
    expect(row1.sha256).toBe(row2.sha256);
    expect(row1.storage_key).toBe(row2.storage_key);

    // Delete row1 -> row2 still shares the content-addressed object, so GET row2 MUST be 200
    const del1 = await app.request(`/api/v1/media/${row1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(del1.status).toBe(200);

    expect(await storage.exists(row2.storage_key)).toBe(true);

    const get2 = await app.request(`/api/v1/media/${row2.id}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(get2.status).toBe(200);
    const get2Bytes = new Uint8Array(await get2.arrayBuffer());
    expect(get2Bytes.byteLength).toBeGreaterThan(0);

    // Delete row2 (last reference) -> storage object is now removed
    const del2 = await app.request(`/api/v1/media/${row2.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(del2.status).toBe(200);
    expect(await storage.exists(row2.storage_key)).toBe(false);
  });

  // ── 2. Image metadata stripping (EXIF/GPS/XMP) without re-encoding ────────
  it('[2-METADATA-JPEG] strips EXIF, GPS IFD, XMP, and COM segments from JPEG without re-encoding', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const fakeGpsMarker = new TextEncoder().encode('Exif\0\0II*\0GPS_FAKE_37.7749N_122.4194W');
    const fakeXmpMarker = new TextEncoder().encode(
      'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>exif:GPSLatitude="37,46.49N"</x:xmpmeta>'
    );
    const fakeComment = new TextEncoder().encode('CameraOwnerSecretComment');

    const { jpeg, scanBytes } = buildSyntheticJpeg(8, 6, [
      jpegSegment(0xe1, fakeGpsMarker),
      jpegSegment(0xe1, fakeXmpMarker),
      jpegSegment(0xfe, fakeComment),
    ]);

    // Sanity-check fixture contains the tags before upload
    expect(containsSubsequence(jpeg, new TextEncoder().encode('GPS_FAKE_37.7749N_122.4194W'))).toBe(true);

    const up = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(jpeg, 'photo-gps.jpg', 'image/jpeg', { alt_text: 'Stripped photo' }),
    });
    expect(up.status).toBe(201);
    const asset = (await up.json()) as any;

    const stored = await storage.get(asset.storage_key);
    expect(stored).not.toBeNull();
    const storedBytes = stored!.data;

    expect(containsSubsequence(storedBytes, new TextEncoder().encode('Exif\0\0'))).toBe(false);
    expect(containsSubsequence(storedBytes, new TextEncoder().encode('GPS_FAKE_37.7749N_122.4194W'))).toBe(false);
    expect(containsSubsequence(storedBytes, new TextEncoder().encode('ns.adobe.com/xap'))).toBe(false);
    expect(containsSubsequence(storedBytes, fakeComment)).toBe(false);
    // Compressed scan data preserved byte-for-byte (no re-encoding)
    expect(containsSubsequence(storedBytes, scanBytes)).toBe(true);
  });

  it('[2-METADATA-PNG-WEBP] strips EXIF/GPS/XMP from PNG and WebP without re-encoding and documents video limitation', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const gpsBytes = new TextEncoder().encode('Exif\0\0GPS_PNG_51.5074N_0.1278W');
    const xmpBytes = new TextEncoder().encode('XML:com.adobe.xmp\0\0\0\0\0<rdf:Description exif:GPSLongitude="0.1278W"/>');
    const { png, idatPayload } = buildSyntheticPng(6, 5, [
      pngChunk('eXIf', gpsBytes),
      pngChunk('iTXt', xmpBytes),
      pngChunk('tEXt', new TextEncoder().encode('Software\0GPSLogger')),
    ]);

    const upPng = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(png, 'map.png', 'image/png'),
    });
    expect(upPng.status).toBe(201);
    const pngAsset = (await upPng.json()) as any;
    const storedPng = (await storage.get(pngAsset.storage_key))!.data;
    expect(containsSubsequence(storedPng, new TextEncoder().encode('GPS_PNG_51.5074N_0.1278W'))).toBe(false);
    expect(containsSubsequence(storedPng, new TextEncoder().encode('com.adobe.xmp'))).toBe(false);
    expect(containsSubsequence(storedPng, new TextEncoder().encode('GPSLogger'))).toBe(false);
    expect(containsSubsequence(storedPng, idatPayload)).toBe(true);

    const webpGps = new TextEncoder().encode('Exif\0\0GPS_WEBP_35.6762N_139.6503E');
    const webpXmp = new TextEncoder().encode('<x:xmpmeta>GPSLatitude=35.6762N</x:xmpmeta>');
    const { webp, vp8lChunk } = buildSyntheticWebp(10, 8, { exif: webpGps, xmp: webpXmp });

    const upWebp = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(webp, 'tokyo.webp', 'image/webp'),
    });
    expect(upWebp.status).toBe(201);
    const webpAsset = (await upWebp.json()) as any;
    const storedWebp = (await storage.get(webpAsset.storage_key))!.data;
    expect(containsSubsequence(storedWebp, new TextEncoder().encode('GPS_WEBP_35.6762N_139.6503E'))).toBe(false);
    expect(containsSubsequence(storedWebp, new TextEncoder().encode('GPSLatitude=35.6762N'))).toBe(false);
    expect(containsSubsequence(storedWebp, vp8lChunk)).toBe(true);

    // Verify docs/design/content.md notes video metadata non-stripping limitation
    const repoRoot = resolve(import.meta.dirname, '../../../../');
    const contentDoc = readFileSync(resolve(repoRoot, 'docs/design/content.md'), 'utf8');
    expect(contentDoc.toLowerCase()).toContain('video metadata');
  });

  // ── 3. HTTP Range support (local + S3) ────────────────────────────────────
  it('[3-RANGE-LOCAL] supports Range (206, Content-Range, Accept-Ranges: bytes, suffix/open ranges) and 416 on Local adapter', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const mp4 = new Uint8Array(128);
    mp4.set([
      0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d,
    ]);
    for (let i = 20; i < 128; i++) mp4[i] = i & 0xff;

    const up = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(mp4, 'clip.mp4', 'video/mp4'),
    });
    expect(up.status).toBe(201);
    const asset = (await up.json()) as any;

    const fullRes = await app.request(`/api/v1/media/${asset.id}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(fullRes.status).toBe(200);
    expect(fullRes.headers.get('accept-ranges')).toBe('bytes');

    const rangeRes = await app.request(`/api/v1/media/${asset.id}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        Range: 'bytes=10-29',
      },
    });
    expect(rangeRes.status).toBe(206);
    expect(rangeRes.headers.get('accept-ranges')).toBe('bytes');
    expect(rangeRes.headers.get('content-range')).toBe('bytes 10-29/128');
    expect(rangeRes.headers.get('content-length')).toBe('20');
    const slice = new Uint8Array(await rangeRes.arrayBuffer());
    expect(Buffer.from(slice).equals(Buffer.from(mp4.subarray(10, 30)))).toBe(true);

    // Suffix range bytes=-16
    const suffixRes = await app.request(`/api/v1/media/${asset.id}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        Range: 'bytes=-16',
      },
    });
    expect(suffixRes.status).toBe(206);
    expect(suffixRes.headers.get('content-range')).toBe('bytes 112-127/128');
    const suffixSlice = new Uint8Array(await suffixRes.arrayBuffer());
    expect(Buffer.from(suffixSlice).equals(Buffer.from(mp4.subarray(112, 128)))).toBe(true);

    // Invalid ranges -> 416
    for (const badRange of ['bytes=200-300', 'bytes=50-20', 'items=0-10', 'bytes=-0']) {
      const invalidRes = await app.request(`/api/v1/media/${asset.id}`, {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          Range: badRange,
        },
      });
      expect(invalidRes.status).toBe(416);
      expect(invalidRes.headers.get('content-range')).toBe('bytes */128');
    }
  });

  it('[3-RANGE-S3] supports Range (206, Content-Range, Accept-Ranges: bytes; 416 invalid) on S3 adapter', async () => {
    const store = new Map<string, Uint8Array>();
    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (method === 'PUT') {
        store.set(url, new Uint8Array(init?.body as Buffer));
        return new Response(null, { status: 200 });
      }
      if (method === 'HEAD') {
        const val = store.get(url);
        if (!val) return new Response(null, { status: 404 });
        return new Response(null, {
          status: 200,
          headers: { 'Content-Length': String(val.byteLength) },
        });
      }
      if (method === 'GET') {
        const val = store.get(url);
        if (!val) return new Response(null, { status: 404 });
        const rangeHeader = headers.range ?? headers.Range;
        if (rangeHeader) {
          const m = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
          if (m) {
            const s = Number(m[1]);
            const e = Math.min(Number(m[2]), val.byteLength - 1);
            const part = val.subarray(s, e + 1);
            return new Response(Buffer.from(part), {
              status: 206,
              headers: {
                'Content-Range': `bytes ${s}-${e}/${val.byteLength}`,
                'Content-Length': String(part.byteLength),
              },
            });
          }
        }
        return new Response(Buffer.from(val), { status: 200 });
      }
      return new Response(null, { status: 405 });
    };

    const s3 = new S3CompatibleMediaStorageAdapter({
      bucket: 'range-test-bucket',
      endpoint: 'https://s3.example.invalid',
      region: `region-${randomBytes(3).toString('hex')}`,
      accessKeyId: `AKIA_${randomBytes(8).toString('hex')}`,
      secretAccessKey: randomBytes(24).toString('hex'),
      fetchImpl: mockFetch,
    });

    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: s3,
    });

    const mp4 = new Uint8Array(96);
    mp4.set([
      0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d,
    ]);
    for (let i = 20; i < 96; i++) mp4[i] = (i * 3) & 0xff;

    const up = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(mp4, 's3-clip.mp4', 'video/mp4'),
    });
    expect(up.status).toBe(201);
    const asset = (await up.json()) as any;

    const r206 = await app.request(`/api/v1/media/${asset.id}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        Range: 'bytes=20-35',
      },
    });
    expect(r206.status).toBe(206);
    expect(r206.headers.get('accept-ranges')).toBe('bytes');
    expect(r206.headers.get('content-range')).toBe('bytes 20-35/96');
    const part = new Uint8Array(await r206.arrayBuffer());
    expect(Buffer.from(part).equals(Buffer.from(mp4.subarray(20, 36)))).toBe(true);

    const r416 = await app.request(`/api/v1/media/${asset.id}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        Range: 'bytes=500-600',
      },
    });
    expect(r416.status).toBe(416);
    expect(r416.headers.get('content-range')).toBe('bytes */96');
  });

  // ── 4. Dimensions + Migration 0005 + 415 unparseable images ───────────────
  it('[4a-MIGRATION-0005] registers migration 0005 with width, height, and media_references DDL', () => {
    const mig5 = MIGRATIONS.find((m) => m.name.startsWith('0005_'));
    expect(mig5).toBeDefined();
    expect(mig5!.sql).toContain('width');
    expect(mig5!.sql).toContain('height');
    expect(mig5!.sql).toContain('media_references');
  });

  it('[4b-DIMENSIONS] parses width/height for PNG/JPEG/GIF/WebP and rejects unparseable images (415)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const cases = [
      { bytes: buildSyntheticPng(12, 7).png, name: 'dim.png', mime: 'image/png', w: 12, h: 7 },
      { bytes: buildSyntheticJpeg(19, 11).jpeg, name: 'dim.jpg', mime: 'image/jpeg', w: 19, h: 11 },
      { bytes: buildSyntheticGif(23, 13), name: 'dim.gif', mime: 'image/gif', w: 23, h: 13 },
      { bytes: buildSyntheticWebp(17, 9).webp, name: 'dim.webp', mime: 'image/webp', w: 17, h: 9 },
    ];

    for (const tc of cases) {
      const res = await app.request('/api/v1/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        body: buildUploadForm(tc.bytes, tc.name, tc.mime),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.width).toBe(tc.w);
      expect(body.height).toBe(tc.h);
    }

    const listRes = await app.request('/api/v1/media', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(listRes.status).toBe(200);
    const listed = ((await listRes.json()) as any).items as any[];
    expect(listed.every((it) => typeof it.width === 'number' && typeof it.height === 'number')).toBe(true);

    // Unparseable / truncated images -> 415
    const corruptImages = [
      { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]), name: 'bad.png', mime: 'image/png' },
      { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]), name: 'no-sof.jpg', mime: 'image/jpeg' },
      { bytes: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3b]), name: 'zero.gif', mime: 'image/gif' },
      { bytes: new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), name: 'bad.webp', mime: 'image/webp' },
    ];

    for (const bad of corruptImages) {
      const badRes = await app.request('/api/v1/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        body: buildUploadForm(bad.bytes, bad.name, bad.mime),
      });
      expect(badRes.status).toBe(415);
    }
  });

  // ── 5. Streaming size limit enforced before buffering ─────────────────────
  it('[5a-STREAM-LIMIT] aborts oversize chunked upload stream before buffering full body (413)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const cfg = loadConfig({
      env: {
        MEDIA_MAX_IMAGE_BYTES: '4096',
        MEDIA_MAX_VIDEO_BYTES: '104857600',
        MEDIA_MAX_TOTAL_BYTES: '536870912',
      },
    });
    const { app } = createApp(undefined, {
      config: cfg,
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const boundary = '----LPStreamBoundary987654321';
    const partHeader = new TextEncoder().encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="oversize-stream.png"\r\nContent-Type: image/png\r\n\r\n`
    );
    const closingFooter = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
    const pngSig = buildSyntheticPng(4, 4).png;
    const firstChunk = concatBytes([partHeader, pngSig]);
    const chunk64k = new Uint8Array(64 * 1024);
    chunk64k.fill(0xab);

    const totalBodyChunks = 200; // 12.8 MB total if buffered
    let chunksPulled = 0;
    let bytesEnqueued = 0;
    let streamCancelled = false;

    const memBefore = process.memoryUsage().heapUsed;
    let peakDeltaBytes = 0;

    const oversizeStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        const delta = Math.max(0, process.memoryUsage().heapUsed - memBefore);
        if (delta > peakDeltaBytes) peakDeltaBytes = delta;
        if (chunksPulled === 0) {
          chunksPulled++;
          bytesEnqueued += firstChunk.byteLength;
          controller.enqueue(firstChunk);
          return;
        }
        if (chunksPulled <= totalBodyChunks) {
          chunksPulled++;
          bytesEnqueued += chunk64k.byteLength;
          controller.enqueue(chunk64k);
          return;
        }
        chunksPulled++;
        bytesEnqueued += closingFooter.byteLength;
        controller.enqueue(closingFooter);
        controller.close();
      },
      cancel() {
        streamCancelled = true;
      },
    });

    const res = await app.request('/api/v1/media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: oversizeStream,
      duplex: 'half',
    } as any);

    console.log(
      `[WP-18.3a STREAM PROOF] status=${res.status} chunksPulled=${chunksPulled}/${totalBodyChunks + 2} bytesEnqueued=${bytesEnqueued} streamCancelled=${streamCancelled} peakHeapDeltaKB=${Math.round(peakDeltaBytes / 1024)}`
    );

    expect(res.status).toBe(413);
    expect(streamCancelled).toBe(true);
    // Must abort within the first 2 chunks (< 128 KB) instead of buffering all 200 chunks (12.8 MB)
    expect(chunksPulled).toBeLessThanOrEqual(3);
    expect(bytesEnqueued).toBeLessThan(192 * 1024);
  });

  it('[5b-CONTENT-LENGTH-PRECHECK] rejects oversize Content-Length before reading any stream chunk (413)', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const cfg = loadConfig({
      env: {
        MEDIA_MAX_IMAGE_BYTES: '4096',
        MEDIA_MAX_VIDEO_BYTES: '8192',
      },
    });
    const { app } = createApp(undefined, {
      config: cfg,
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    let chunksPulled = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          chunksPulled++;
          if (chunksPulled > 20) {
            controller.close();
            return;
          }
          controller.enqueue(new Uint8Array(1024));
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 }
    );

    const res = await app.request('/api/v1/media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'multipart/form-data; boundary=----BoundaryCL',
        'Content-Length': String(50 * 1024 * 1024),
      },
      body: stream,
      duplex: 'half',
    } as any);

    expect(res.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(chunksPulled).toBe(0);
  });

  // ── 6. Derived visibility & media-reference index ─────────────────────────
  it('[6a-DERIVED-VISIBILITY-LIFECYCLE] unreferenced = 401 anonymous; referenced by published entry = 200; after unpublish = 401', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const { png } = buildSyntheticPng(10, 10);

    const up = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(png, 'derived.png', 'image/png', {
        alt_text: 'Derived visibility diagram',
      }),
    });
    expect(up.status).toBe(201);
    const asset = (await up.json()) as any;

    // 1. Unreferenced -> 401 anonymous
    const anonUnref = await app.request(`/api/media/${asset.id}`);
    expect(anonUnref.status).toBe(401);

    // 2. Referenced only by a draft (private) entry -> still 401 anonymous
    const draftRes = await app.request('/api/v1/entries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'draft-with-image',
        title: 'Draft Entry',
        profile: 'case-study',
        view: 'article',
        visibility: 'private',
        body_md: `Draft body with ![Alt](/api/media/${asset.id})`,
      }),
    });
    expect(draftRes.status).toBe(201);
    expect((await app.request(`/api/media/${asset.id}`)).status).toBe(401);

    // 3. Referenced by a published public entry -> 200 anonymous
    const { entryId } = await createPublishedPublicEntryWithBody(
      app,
      TEST_TOKEN,
      'public-with-image',
      `Published body referencing ![Diagram](/api/media/${asset.id})`
    );
    const anonPub = await app.request(`/api/media/${asset.id}`);
    expect(anonPub.status).toBe(200);
    expect(anonPub.headers.get('cache-control')).toContain('public');
    expect(asset.uri).toBe(`/api/media/${asset.id}`);

    // 4. Unpublish entry (visibility -> private) -> immediately 401 anonymous
    const unpubRes = await app.request(`/api/v1/entries/${entryId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'private' }),
    });
    expect(unpubRes.status).toBe(200);
    expect((await app.request(`/api/media/${asset.id}`)).status).toBe(401);

    // 5. Re-publish entry -> 200, then save new revision removing the media reference -> 401
    const bodyWithMedia = `Published body referencing ![Diagram](/api/media/${asset.id})`;
    const prev2 = await (
      await app.request('/api/v1/entries/redaction-preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, text: bodyWithMedia }),
      })
    ).json();
    const repubRes = await app.request(`/api/v1/entries/${entryId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility: 'public',
        redactionPreviewToken: (prev2 as any).redactionPreviewToken,
      }),
    });
    expect(repubRes.status).toBe(200);
    expect((await app.request(`/api/media/${asset.id}`)).status).toBe(200);

    const revWithoutMedia = await app.request(`/api/v1/entries/${entryId}/revisions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body_md: 'Updated public body with no media reference.' }),
    });
    expect(revWithoutMedia.status).toBe(201);
    expect((await app.request(`/api/media/${asset.id}`)).status).toBe(401);
  });

  it('[6b-UPLOAD-FORM-VISIBILITY-REMOVED] ignores visibility=public on upload form when asset is unreferenced', async () => {
    const storage = new LocalVolumeMediaStorageAdapter(tempDir);
    const { app } = createApp(undefined, {
      bootstrapAdminToken: TEST_TOKEN,
      mediaStorage: storage,
    });

    const { png } = buildSyntheticPng(8, 8);
    const up = await app.request('/api/v1/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: buildUploadForm(png, 'sneaky.png', 'image/png', {
        visibility: 'public',
      }),
    });
    expect(up.status).toBe(201);
    const asset = (await up.json()) as any;
    expect((await app.request(`/api/media/${asset.id}`)).status).toBe(401);
    expect(asset.visibility).toBe('private');
  });

  // ── 7. CodeQL & zero fallback secrets / zero suppressions ─────────────────
  it('[7-NO-FALLBACK-SECRET] rejects missing HMAC/session/S3 secrets and has zero suppressions or dismissals', () => {
    // Recovery code helpers must never fall back to a hardcoded secret
    expect(() => (computeRecoveryCodeHash as any)('abcd-1234-ef56-7890', 'salt123', '')).toThrow();
    expect(() => (computeRecoveryCodeHash as any)('abcd-1234-ef56-7890', 'salt123')).toThrow();
    expect(() => (generateRecoveryCodes as any)(8, '')).toThrow();

    // Production AuthManager must refuse missing signingKey / SESSION_SECRET
    const prevClass = process.env.DEPLOYMENT_CLASS;
    const prevSecret = process.env.SESSION_SECRET;
    try {
      process.env.DEPLOYMENT_CLASS = 'production';
      delete process.env.SESSION_SECRET;
      expect(() => new AuthManager()).toThrow();
    } finally {
      if (prevClass === undefined) delete process.env.DEPLOYMENT_CLASS;
      else process.env.DEPLOYMENT_CLASS = prevClass;
      if (prevSecret !== undefined) process.env.SESSION_SECRET = prevSecret;
    }

    // S3 backend config must reject empty S3 credentials
    expect(() =>
      loadConfig({
        env: {
          MEDIA_STORAGE_BACKEND: 's3',
        },
      })
    ).toThrow();

    // Zero hardcoded fallback secret or CodeQL suppression comments in source
    const repoRoot = resolve(import.meta.dirname, '../../../../');
    const securitySrc = readFileSync(resolve(repoRoot, 'apps/api/src/auth/security.ts'), 'utf8');
    expect(securitySrc).not.toContain('lp-recovery-secret');

    const sarifBaseline = JSON.parse(
      readFileSync(resolve(repoRoot, 'docs/audits/sarif-baseline.json'), 'utf8')
    );
    expect(sarifBaseline.baselined_alerts).toEqual([]);

    const scanDirs = [resolve(repoRoot, 'apps/api/src'), resolve(repoRoot, 'packages/config/src')];
    const walkFiles = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walkFiles(full));
        else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full);
      }
      return out;
    };
    for (const dir of scanDirs) {
      for (const f of walkFiles(dir)) {
        const src = readFileSync(f, 'utf8');
        expect(src).not.toMatch(/codeql\[|lgtm\[|nosemgrep/i);
      }
    }
  });
});
