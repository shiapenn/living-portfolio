import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { deliveryMiddleware } from './delivery.js';

describe('HTTP delivery middleware (ETag, 304, brotli/gzip, Vary)', () => {
  function makeApp() {
    const app = new Hono();
    app.use('*', deliveryMiddleware);
    app.get('/page', (c) => c.html(`<!doctype html><html><body>${'Editorial prose '.repeat(120)}</body></html>`));
    app.get('/style.css', (c) => {
      c.header('Content-Type', 'text/css; charset=utf-8');
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
      return c.body(`:root { --pub-a: 1; }\n`.repeat(100));
    });
    return app;
  }

  it('adds weak ETag to HTML responses and returns 304 when If-None-Match matches', async () => {
    const app = makeApp();
    const res1 = await app.request('/page');
    expect(res1.status).toBe(200);
    const etag = res1.headers.get('etag');
    expect(etag).toMatch(/^W\/"[a-f0-9]{16}"$/);

    const res2 = await app.request('/page', { headers: { 'If-None-Match': etag! } });
    expect(res2.status).toBe(304);
  });

  it('compresses HTML and CSS with brotli when Accept-Encoding includes br', async () => {
    const app = makeApp();
    const res = await app.request('/style.css', { headers: { 'Accept-Encoding': 'gzip, br' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-encoding')).toBe('br');
    expect(res.headers.get('vary')).toContain('Accept-Encoding');
    expect(res.headers.get('cache-control')).toContain('immutable');
    const decoded = brotliDecompressSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
    expect(decoded).toContain('--pub-a: 1');
  });

  it('falls back to gzip when Accept-Encoding includes gzip only', async () => {
    const app = makeApp();
    const res = await app.request('/page', { headers: { 'Accept-Encoding': 'gzip' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-encoding')).toBe('gzip');
    const decoded = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
    expect(decoded).toContain('Editorial prose');
  });
});
