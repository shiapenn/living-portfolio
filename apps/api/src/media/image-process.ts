import type { SupportedMediaMime } from './sniff.js';

export interface ImageDimensions {
  width: number;
  height: number;
}

const MAX_DIMENSION = 65535;
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const PNG_VALID_COLOR_TYPES = new Set([0, 2, 3, 4, 6]);
const PNG_VALID_BIT_DEPTHS = new Set([1, 2, 4, 8, 16]);
const PNG_STRIP_CHUNKS = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

// Baseline, progressive, extended, and lossless JPEG SOF markers (excludes 0xC4 DHT, 0xC8 JPG, 0xCC DAC)
const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
// Strip APP1 (EXIF/GPS/XMP), APP13 (IPTC/Photoshop), and COM (JPEG comments)
const JPEG_STRIP_MARKERS = new Set([0xe1, 0xed, 0xfe]);

function readU16BE(b: Uint8Array, off: number): number {
  return (b[off] << 8) | b[off + 1];
}

function readU16LE(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8);
}

function readU24LE(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8) | (b[off + 2] << 16);
}

function readU32BE(b: Uint8Array, off: number): number {
  return ((b[off] << 24) | (b[off + 1] << 16) | (b[off + 2] << 8) | b[off + 3]) >>> 0;
}

function readU32LE(b: Uint8Array, off: number): number {
  return (b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24)) >>> 0;
}

function ascii4(b: Uint8Array, off: number): string {
  return String.fromCharCode(b[off], b[off + 1], b[off + 2], b[off + 3]);
}

function concatUint8(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function parsePngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.byteLength < 33) return null;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) return null;
  }
  const ihdrLen = readU32BE(bytes, 8);
  if (ihdrLen !== 13 || ascii4(bytes, 12) !== 'IHDR') return null;
  const width = readU32BE(bytes, 16);
  const height = readU32BE(bytes, 20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    !PNG_VALID_BIT_DEPTHS.has(bitDepth) ||
    !PNG_VALID_COLOR_TYPES.has(colorType)
  ) {
    return null;
  }
  // Verify chunk framing reaches IEND cleanly
  let pos = 8;
  let sawIend = false;
  while (pos + 12 <= bytes.byteLength) {
    const len = readU32BE(bytes, pos);
    const type = ascii4(bytes, pos + 4);
    const next = pos + 12 + len;
    if (next > bytes.byteLength) return null;
    if (type === 'IEND') {
      sawIend = true;
      break;
    }
    pos = next;
  }
  if (!sawIend) return null;
  return { width, height };
}

function parseGifDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.byteLength < 13) return null;
  const header = ascii4(bytes, 0) + String.fromCharCode(bytes[4], bytes[5]);
  if (header !== 'GIF87a' && header !== 'GIF89a') return null;
  const width = readU16LE(bytes, 6);
  const height = readU16LE(bytes, 8);
  if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
  return { width, height };
}

function parseJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let pos = 2;
  while (pos < bytes.byteLength) {
    if (bytes[pos] !== 0xff) return null;
    while (pos < bytes.byteLength && bytes[pos] === 0xff) pos++;
    if (pos >= bytes.byteLength) return null;
    const marker = bytes[pos++];

    if (marker === 0xd9) return null; // EOI before SOF
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (pos + 2 > bytes.byteLength) return null;
    const segLen = readU16BE(bytes, pos);
    if (segLen < 2 || pos + segLen > bytes.byteLength) return null;

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (segLen < 8) return null;
      const height = readU16BE(bytes, pos + 3);
      const width = readU16BE(bytes, pos + 5);
      if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      return { width, height };
    }
    if (marker === 0xda) {
      // SOS reached before any SOF
      return null;
    }
    pos += segLen;
  }
  return null;
}

function parseWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.byteLength < 20) return null;
  if (ascii4(bytes, 0) !== 'RIFF' || ascii4(bytes, 8) !== 'WEBP') return null;
  let pos = 12;
  while (pos + 8 <= bytes.byteLength) {
    const fourcc = ascii4(bytes, pos);
    const chunkSize = readU32LE(bytes, pos + 4);
    const dataStart = pos + 8;
    const dataEnd = dataStart + chunkSize;
    if (dataEnd > bytes.byteLength) return null;

    if (fourcc === 'VP8X') {
      if (chunkSize < 10) return null;
      const width = readU24LE(bytes, dataStart + 4) + 1;
      const height = readU24LE(bytes, dataStart + 7) + 1;
      if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      return { width, height };
    }
    if (fourcc === 'VP8 ') {
      if (chunkSize < 10) return null;
      if (
        bytes[dataStart + 3] !== 0x9d ||
        bytes[dataStart + 4] !== 0x01 ||
        bytes[dataStart + 5] !== 0x2a
      ) {
        return null;
      }
      const width = readU16LE(bytes, dataStart + 6) & 0x3fff;
      const height = readU16LE(bytes, dataStart + 8) & 0x3fff;
      if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      return { width, height };
    }
    if (fourcc === 'VP8L') {
      if (chunkSize < 5 || bytes[dataStart] !== 0x2f) return null;
      const bits = readU32LE(bytes, dataStart + 1);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >>> 14) & 0x3fff) + 1;
      if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
      return { width, height };
    }

    pos = dataEnd + (chunkSize % 2 === 1 ? 1 : 0);
  }
  return null;
}

export function parseImageDimensions(
  bytes: Uint8Array,
  mimeType: SupportedMediaMime
): ImageDimensions | null {
  switch (mimeType) {
    case 'image/png':
      return parsePngDimensions(bytes);
    case 'image/jpeg':
      return parseJpegDimensions(bytes);
    case 'image/gif':
      return parseGifDimensions(bytes);
    case 'image/webp':
      return parseWebpDimensions(bytes);
    default:
      return null;
  }
}

function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let pos = 8;
  while (pos + 12 <= bytes.byteLength) {
    const len = readU32BE(bytes, pos);
    const type = ascii4(bytes, pos + 4);
    const end = pos + 12 + len;
    if (end > bytes.byteLength) return bytes;
    if (!PNG_STRIP_CHUNKS.has(type)) {
      kept.push(bytes.subarray(pos, end));
    }
    pos = end;
    if (type === 'IEND') break;
  }
  return concatUint8(kept);
}

function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let pos = 2;
  while (pos < bytes.byteLength) {
    const segStart = pos;
    if (bytes[pos] !== 0xff) {
      kept.push(bytes.subarray(pos));
      break;
    }
    while (pos < bytes.byteLength && bytes[pos] === 0xff) pos++;
    if (pos >= bytes.byteLength) break;
    const marker = bytes[pos++];

    if (marker === 0xd9) {
      kept.push(bytes.subarray(segStart, pos));
      break;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(bytes.subarray(segStart, pos));
      continue;
    }
    if (pos + 2 > bytes.byteLength) {
      kept.push(bytes.subarray(segStart));
      break;
    }
    const segLen = readU16BE(bytes, pos);
    const segEnd = pos + segLen;
    if (segLen < 2 || segEnd > bytes.byteLength) {
      kept.push(bytes.subarray(segStart));
      break;
    }

    if (marker === 0xda) {
      // SOS header + compressed entropy scan data through end of file (lossless, no re-encoding)
      kept.push(bytes.subarray(segStart));
      break;
    }

    if (!JPEG_STRIP_MARKERS.has(marker)) {
      kept.push(bytes.subarray(segStart, segEnd));
    }
    pos = segEnd;
  }
  return concatUint8(kept);
}

function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength < 12 || ascii4(bytes, 0) !== 'RIFF' || ascii4(bytes, 8) !== 'WEBP') {
    return bytes;
  }
  const chunks: Uint8Array[] = [];
  let pos = 12;
  while (pos + 8 <= bytes.byteLength) {
    const fourcc = ascii4(bytes, pos);
    const chunkSize = readU32LE(bytes, pos + 4);
    const paddedEnd = pos + 8 + chunkSize + (chunkSize % 2 === 1 ? 1 : 0);
    const rawEnd = Math.min(paddedEnd, bytes.byteLength);
    if (pos + 8 + chunkSize > bytes.byteLength) return bytes;

    if (fourcc === 'EXIF' || fourcc === 'XMP ') {
      pos = rawEnd;
      continue;
    }
    if (fourcc === 'VP8X' && chunkSize >= 10) {
      const copy = new Uint8Array(bytes.subarray(pos, rawEnd));
      // Clear EXIF (0x08) and XMP (0x04) presence flags in VP8X header byte
      copy[8] = copy[8] & ~0x0c;
      chunks.push(copy);
    } else {
      chunks.push(bytes.subarray(pos, rawEnd));
    }
    pos = rawEnd;
  }

  const webpTag = new TextEncoder().encode('WEBP');
  const bodyLen = webpTag.byteLength + chunks.reduce((s, c) => s + c.byteLength, 0);
  const riffHeader = new Uint8Array(8);
  riffHeader.set(new TextEncoder().encode('RIFF'), 0);
  new DataView(riffHeader.buffer).setUint32(4, bodyLen, true);
  return concatUint8([riffHeader, webpTag, ...chunks]);
}

/**
 * Strips EXIF, GPS, XMP, IPTC, and text/comment metadata chunks from JPEG, PNG, and WebP
 * losslessly without re-encoding image pixel data.
 */
export function stripImageMetadata(bytes: Uint8Array, mimeType: SupportedMediaMime): Uint8Array {
  switch (mimeType) {
    case 'image/jpeg':
      return stripJpegMetadata(bytes);
    case 'image/png':
      return stripPngMetadata(bytes);
    case 'image/webp':
      return stripWebpMetadata(bytes);
    default:
      return bytes;
  }
}
