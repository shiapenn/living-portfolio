import { describe, it, expect, vi } from 'vitest';
import { LivingPortfolioClient, createLivingPortfolioClient } from './client.js';

describe('LivingPortfolioClient (@living-portfolio/client, OSR-12)', () => {
  it('normalizes base URLs correctly to canonical /api/v1 endpoint', () => {
    const c1 = createLivingPortfolioClient({ baseUrl: 'https://example.com' });
    expect(c1.getBaseUrl()).toBe('https://example.com/api/v1');

    const c2 = createLivingPortfolioClient({ baseUrl: 'https://example.com/api/v1' });
    expect(c2.getBaseUrl()).toBe('https://example.com/api/v1');

    const c3 = createLivingPortfolioClient({ baseUrl: 'https://example.com/api' });
    expect(c3.getBaseUrl()).toBe('https://example.com/api/v1');

    const c4 = createLivingPortfolioClient({ baseUrl: '/api/v1' });
    expect(c4.getBaseUrl()).toBe('/api/v1');

    const c5 = createLivingPortfolioClient({ baseUrl: '' });
    expect(c5.getBaseUrl()).toBe('/api/v1');
  });

  it('attaches Authorization bearer and CSRF token headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'healthy', version: '0.1.0' }),
    });

    const client = new LivingPortfolioClient({
      baseUrl: 'https://api.example.com',
      token: 'secret-token-123',
      csrfToken: 'csrf-xyz',
      fetch: mockFetch as any,
    });

    const res = await client.health();
    expect(res.status).toBe('healthy');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/v1/health');
    expect(init.headers['Authorization']).toBe('Bearer secret-token-123');
    expect(init.headers['X-CSRF-Token']).toBe('csrf-xyz');
    expect(init.headers['Accept']).toBe('application/json');
  });

  it('serializes request bodies as JSON and sets Content-Type', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ query_class: 'lookup', synthesis: 'Extracted fact', citations: [] }),
    });

    const client = new LivingPortfolioClient({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch as any,
    });

    await client.ask.query({
      query: 'What is your background?',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/v1/ask');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      query: 'What is your background?',
    });
  });

  it('handles and throws typed API errors on non-200 responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Unauthorized: admin authentication required' }),
    });

    const client = new LivingPortfolioClient({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch as any,
    });

    await expect(client.entries.listRevisions('test-entry-id')).rejects.toThrow(
      'Unauthorized: admin authentication required'
    );
  });

  it('routes query parameters cleanly for entries and timeline', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ entries: [] }),
    });

    const client = new LivingPortfolioClient({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch as any,
    });

    await client.entries.list({ visibility: 'public', as_of: '2026-01-01T00:00:00Z' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://api.example.com/api/v1/entries?visibility=public&as_of=2026-01-01T00%3A00%3A00Z'
    );
  });
});
