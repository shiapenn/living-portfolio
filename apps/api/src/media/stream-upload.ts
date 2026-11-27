import { sniffMediaBytes } from './sniff.js';

const MULTIPART_OVERHEAD_BYTES = 16 * 1024;

export type StreamUploadResult =
  | { ok: true; formData: FormData; bytesRead: number }
  | {
      ok: false;
      status: 400 | 413;
      code: 'INVALID_MULTIPART' | 'FILE_TOO_LARGE' | 'STORAGE_QUOTA_EXCEEDED';
      error: string;
      limit_bytes?: number;
    };

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Attempts to locate the `name="file"` multipart payload offset within the initial header window
 * so per-type limits (e.g. 10 MB image vs 100 MB video) are enforced on the stream immediately.
 */
function detectStreamCategoryLimit(
  prefix: Uint8Array,
  maxImageBytes: number,
  maxVideoBytes: number
): { category: 'image' | 'video' | null; payloadOffset: number | null; maxBytes: number } {
  const scanLen = Math.min(prefix.byteLength, 4096);
  const latin1 = Buffer.from(prefix.subarray(0, scanLen)).toString('latin1');
  const fileFieldIdx = latin1.search(/name\s*=\s*"file"/i);
  if (fileFieldIdx === -1) {
    return {
      category: null,
      payloadOffset: null,
      maxBytes: Math.max(maxImageBytes, maxVideoBytes),
    };
  }
  const sepIdx = latin1.indexOf('\r\n\r\n', fileFieldIdx);
  if (sepIdx === -1) {
    return {
      category: null,
      payloadOffset: null,
      maxBytes: Math.max(maxImageBytes, maxVideoBytes),
    };
  }
  const payloadOffset = sepIdx + 4;
  if (prefix.byteLength < payloadOffset + 16) {
    return {
      category: null,
      payloadOffset,
      maxBytes: Math.max(maxImageBytes, maxVideoBytes),
    };
  }
  const sniff = sniffMediaBytes(prefix.subarray(payloadOffset, Math.min(prefix.byteLength, payloadOffset + 512)));
  if (sniff.category === 'image') {
    return { category: 'image', payloadOffset, maxBytes: maxImageBytes };
  }
  if (sniff.category === 'video') {
    return { category: 'video', payloadOffset, maxBytes: maxVideoBytes };
  }
  // Unrecognised or SVG/HTML payload: cap tightly so invalid oversize uploads abort immediately
  return { category: null, payloadOffset, maxBytes: Math.min(maxImageBytes, maxVideoBytes) };
}

/**
 * Enforces Content-Length and streaming byte-count limits BEFORE buffering the full request body.
 * Cancels the underlying ReadableStream immediately upon exceeding `MEDIA_MAX_*_BYTES`.
 */
export async function readBoundedMultipartFormData(
  req: Request,
  limits: {
    maxImageBytes: number;
    maxVideoBytes: number;
    maxTotalBytes: number;
    currentTotalBytes: number;
  }
): Promise<StreamUploadResult> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MULTIPART',
      error: 'Expected multipart/form-data body with a file field.',
    };
  }

  const maxAnyMedia = Math.max(limits.maxImageBytes, limits.maxVideoBytes);
  const hardMaxCeiling = maxAnyMedia + MULTIPART_OVERHEAD_BYTES;

  // 1. Pre-check Content-Length header before touching the stream
  const contentLengthHeader = req.headers.get('content-length');
  if (contentLengthHeader !== null && contentLengthHeader.trim() !== '') {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > hardMaxCeiling) {
      if (req.body) {
        try {
          await req.body.cancel('FILE_TOO_LARGE');
        } catch {}
      }
      return {
        ok: false,
        status: 413,
        code: 'FILE_TOO_LARGE',
        error: `Upload exceeds maximum allowed size of ${maxAnyMedia} bytes.`,
        limit_bytes: maxAnyMedia,
      };
    }
  }

  if (!req.body) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MULTIPART',
      error: 'Expected multipart/form-data body with a file field.',
    };
  }

  // 2. Stream through a counting reader and abort immediately when threshold is exceeded
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  let activeMaxMediaBytes = maxAnyMedia;
  let sniffEvaluated = false;
  let detectedPayloadOffset: number | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      chunks.push(value);
      bytesRead += value.byteLength;

      if (!sniffEvaluated && bytesRead >= 64) {
        const prefixLen = Math.min(bytesRead, 8192);
        const prefixBuf = concatChunks(chunks, bytesRead).subarray(0, prefixLen);
        const detected = detectStreamCategoryLimit(
          prefixBuf,
          limits.maxImageBytes,
          limits.maxVideoBytes
        );
        detectedPayloadOffset = detected.payloadOffset;
        activeMaxMediaBytes = detected.maxBytes;
        if (detectedPayloadOffset !== null && bytesRead >= detectedPayloadOffset + 16) {
          sniffEvaluated = true;
        }
      }

      const activeCeiling = activeMaxMediaBytes + MULTIPART_OVERHEAD_BYTES;
      if (bytesRead > activeCeiling) {
        await reader.cancel('FILE_TOO_LARGE');
        chunks.length = 0;
        return {
          ok: false,
          status: 413,
          code: 'FILE_TOO_LARGE',
          error: `File exceeds the size limit of ${activeMaxMediaBytes} bytes.`,
          limit_bytes: activeMaxMediaBytes,
        };
      }
    }
  } catch {
    chunks.length = 0;
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MULTIPART',
      error: 'Failed reading multipart upload stream.',
    };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  const bodyBytes = concatChunks(chunks, bytesRead);
  chunks.length = 0;

  try {
    const syntheticReq = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: Buffer.from(bodyBytes),
    });
    const formData = await syntheticReq.formData();
    return { ok: true, formData, bytesRead };
  } catch {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MULTIPART',
      error: 'Expected multipart/form-data body with a file field.',
    };
  }
}

export type ByteRangeParseResult =
  | { valid: true; start: number; end: number }
  | { valid: false };

/**
 * Parses an HTTP `Range` header (`bytes=start-end`, `bytes=start-`, `bytes=-suffix`) per RFC 9110.
 */
export function parseHttpByteRange(rangeHeader: string, totalBytes: number): ByteRangeParseResult {
  if (totalBytes <= 0) return { valid: false };
  const trimmed = rangeHeader.trim();
  if (!trimmed.startsWith('bytes=')) return { valid: false };
  const spec = trimmed.slice('bytes='.length).trim();
  // Reject empty or multi-part ranges
  if (!spec || spec.includes(',')) return { valid: false };

  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match) return { valid: false };
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return { valid: false };

  if (rawStart === '') {
    // Suffix byte-range-spec: bytes=-N
    const suffixLength = Number(rawEnd);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return { valid: false };
    const start = Math.max(0, totalBytes - suffixLength);
    return { valid: true, start, end: totalBytes - 1 };
  }

  const start = Number(rawStart);
  if (!Number.isInteger(start) || start < 0 || start >= totalBytes) {
    return { valid: false };
  }

  if (rawEnd === '') {
    return { valid: true, start, end: totalBytes - 1 };
  }

  const end = Number(rawEnd);
  if (!Number.isInteger(end) || end < start) {
    return { valid: false };
  }

  return { valid: true, start, end: Math.min(end, totalBytes - 1) };
}
