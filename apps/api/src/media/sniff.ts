import { createHash } from 'node:crypto';

export type SupportedMediaMime =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'video/mp4'
  | 'video/webm';

export interface SniffResult {
  mimeType: SupportedMediaMime | null;
  extension: string | null;
  category: 'image' | 'video' | null;
  rejectedReason?: 'svg' | 'html_or_script' | 'unknown';
}

const MIME_TO_EXT: Record<SupportedMediaMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const VALID_MP4_BRANDS = new Set([
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'M4V ',
  'M4VH',
  'M4VP',
  'qt  ',
  'MSNV',
  'dash',
]);

function matchesBytes(buf: Uint8Array, offset: number, sig: readonly number[]): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

function readAscii(buf: Uint8Array, start: number, len: number): string {
  if (buf.length < start + len) return '';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += String.fromCharCode(buf[start + i]);
  }
  return out;
}

/**
 * Sniffs media content strictly from magic bytes (never trusts client MIME or extension).
 * Explicitly detects and rejects SVG, XML, HTML, and script payloads.
 */
export function sniffMediaBytes(bytes: Uint8Array): SniffResult {
  if (bytes.length < 4) {
    return { mimeType: null, extension: null, category: null, rejectedReason: 'unknown' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: 'png', category: 'image' };
  }

  // JPEG: FF D8 FF
  if (matchesBytes(bytes, 0, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', extension: 'jpg', category: 'image' };
  }

  // GIF: GIF87a or GIF89a
  if (
    matchesBytes(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matchesBytes(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { mimeType: 'image/gif', extension: 'gif', category: 'image' };
  }

  // WebP: RIFF....WEBP
  if (
    matchesBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return { mimeType: 'image/webp', extension: 'webp', category: 'image' };
  }

  // MP4 / ISO BMFF: bytes 4..7 === 'ftyp' with an allowed video brand
  if (bytes.length >= 12 && readAscii(bytes, 4, 4) === 'ftyp') {
    const majorBrand = readAscii(bytes, 8, 4);
    if (VALID_MP4_BRANDS.has(majorBrand)) {
      return { mimeType: 'video/mp4', extension: 'mp4', category: 'video' };
    }
  }

  // WebM: EBML header 1A 45 DF A3 containing 'webm' doctype within first 64 bytes
  if (matchesBytes(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3])) {
    const headerSlice = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 64))).toString('latin1');
    if (headerSlice.includes('webm')) {
      return { mimeType: 'video/webm', extension: 'webm', category: 'video' };
    }
  }

  // Explicitly detect SVG / XML / HTML / script payloads (including after UTF-8 BOM / whitespace)
  const headText = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 512)))
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();

  if (
    headText.startsWith('<svg') ||
    (headText.startsWith('<?xml') && headText.includes('<svg')) ||
    (headText.startsWith('<!doctype svg'))
  ) {
    return { mimeType: null, extension: null, category: null, rejectedReason: 'svg' };
  }

  if (
    headText.startsWith('<!doctype html') ||
    headText.startsWith('<html') ||
    headText.startsWith('<script') ||
    headText.startsWith('<?xml')
  ) {
    return { mimeType: null, extension: null, category: null, rejectedReason: 'html_or_script' };
  }

  return { mimeType: null, extension: null, category: null, rejectedReason: 'unknown' };
}

/**
 * Sanitises a client-provided filename by stripping path components, traversal segments,
 * null bytes, and non-safe characters. Never used as a filesystem path.
 */
export function sanitiseFilename(rawName: string | undefined | null): string {
  if (!rawName || typeof rawName !== 'string') return 'upload';
  // Strip null bytes and split on both POSIX and Windows separators
  const withoutNull = rawName.replace(/\0/g, '');
  const base = withoutNull.split(/[\\/]/).pop() ?? '';
  // Remove leading dots and traversal sequences, keep only safe ASCII characters
  const cleaned = base
    .replace(/\.\.+/g, '.')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'upload';
}

export function computeSha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Generates a strict, content-addressed hashed storage key derived exclusively from
 * the SHA-256 digest and sniffed MIME extension (never from client filename).
 */
export function buildHashedStorageKey(sha256Hex: string, mimeType: SupportedMediaMime): string {
  const normalizedHash = sha256Hex.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalizedHash)) {
    throw new Error('Invalid SHA-256 hex digest');
  }
  const ext = MIME_TO_EXT[mimeType];
  return `${normalizedHash.slice(0, 2)}/${normalizedHash}.${ext}`;
}
