import type { MiddlewareHandler } from 'hono';
import { createHash } from 'node:crypto';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

const COMPRESSIBLE_RE = /^(text\/html|text\/css|application\/javascript|text\/javascript|application\/xml|application\/rss\+xml|image\/svg\+xml)/i;
const MIN_COMPRESS_BYTES = 1024;

/**
 * HTTP Delivery Middleware (WP-16.N D-N4):
 * - Weak ETag + conditional 304 Not Modified for GET HTML responses
 * - Brotli / gzip compression for text/CSS/JS/HTML payloads >= 1 KB
 * - Preserves Cache-Control: immutable on hashed assets
 */
export const deliveryMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  if (c.req.method !== 'GET' || c.res.status !== 200) return;

  const contentType = c.res.headers.get('content-type') || '';
  if (!COMPRESSIBLE_RE.test(contentType)) return;

  const existingEncoding = c.res.headers.get('content-encoding');
  if (existingEncoding) return;

  const rawBuf = Buffer.from(await c.res.arrayBuffer());
  const headers = new Headers(c.res.headers);
  headers.delete('content-length');

  // Weak ETag + 304 Not Modified for HTML responses
  if (contentType.toLowerCase().startsWith('text/html')) {
    const hash = createHash('sha256').update(rawBuf).digest('hex').slice(0, 16);
    const etag = `W/"${hash}"`;
    headers.set('ETag', etag);
    const inm = c.req.header('if-none-match');
    if (inm && inm.split(',').map((s) => s.trim()).includes(etag)) {
      headers.append('Vary', 'Accept-Encoding');
      c.res = new Response(null, { status: 304, headers });
      return;
    }
  }

  // Negotiate brotli or gzip when payload >= 1 KB
  const acceptEncoding = (c.req.header('accept-encoding') || '').toLowerCase();
  let body: Buffer = rawBuf;
  if (rawBuf.length >= MIN_COMPRESS_BYTES) {
    if (acceptEncoding.includes('br')) {
      body = brotliCompressSync(rawBuf, {
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
      });
      headers.set('Content-Encoding', 'br');
    } else if (acceptEncoding.includes('gzip')) {
      body = gzipSync(rawBuf, { level: 6 });
      headers.set('Content-Encoding', 'gzip');
    }
  }

  const vary = headers.get('Vary');
  if (!vary || !vary.toLowerCase().includes('accept-encoding')) {
    headers.set('Vary', vary ? `${vary}, Accept-Encoding` : 'Accept-Encoding');
  }
  headers.set('Content-Length', String(body.length));
  c.res = new Response(new Uint8Array(body), { status: 200, headers });
};
