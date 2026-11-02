import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOpenApiDocument } from '@living-portfolio/core';
import { createApp } from '../app.js';
import { createLivingPortfolioClient } from '@living-portfolio/client';

const ROOT = resolve(import.meta.dirname, '../../../..');
const SPEC_PATH = resolve(ROOT, 'docs/spec/openapi.json');

describe('OpenAPI Specification & Versioned API Conformance (OSR-12, Spec §7, §8)', () => {
  it('1. committed docs/spec/openapi.json exists, is valid OpenAPI 3.1.0, and has zero drift', () => {
    expect(existsSync(SPEC_PATH)).toBe(true);

    const fileContent = readFileSync(SPEC_PATH, 'utf8');
    const parsed = JSON.parse(fileContent);

    expect(parsed.openapi).toBe('3.1.0');
    expect(parsed.info.title).toBe('Living Portfolio API');
    expect(parsed.info.version).toBe('1.0.0');
    expect(parsed.servers).toEqual([
      { url: '/api/v1', description: 'Living Portfolio API v1 canonical endpoint' },
    ]);

    // Zero-drift invariant: in-memory generator output must equal committed file
    const generated = buildOpenApiDocument();
    const expectedContent = JSON.stringify(generated, null, 2) + '\n';
    expect(fileContent).toBe(expectedContent);
  });

  it('2. openapi.json defines schemas matching Zod definitions for entries, ask, and structure', () => {
    const parsed = JSON.parse(readFileSync(SPEC_PATH, 'utf8'));
    const schemas = parsed.components.schemas;

    expect(schemas).toBeDefined();
    expect(schemas.EntryCreate).toBeDefined();
    expect(schemas.EntryCreate.type).toBe('object');
    expect(schemas.EntryCreate.required).toContain('body_md');
    expect(schemas.EntryCreate.required).toContain('slug');

    expect(schemas.AskQuery).toBeDefined();
    expect(schemas.AskQuery.required).toContain('query');

    expect(schemas.BookingCreate).toBeDefined();
    expect(schemas.BookingCreate.required).toContain('topic');
    expect(schemas.BookingCreate.required).toContain('visitor_contact');

    expect(schemas.RoutingConfig).toBeDefined();
    expect(schemas.RoutingConfig.properties.tier1_floor).toBeDefined();

    expect(schemas.ClaimUpsert).toBeDefined();
    expect(schemas.FacetUpsert).toBeDefined();
    expect(schemas.RelationUpsert).toBeDefined();
    expect(schemas.EvidenceUpsert).toBeDefined();
  });

  it('3. openapi.json specifies securitySchemes for Bearer, session cookie, and CSRF header', () => {
    const parsed = JSON.parse(readFileSync(SPEC_PATH, 'utf8'));
    const sec = parsed.components.securitySchemes;

    expect(sec.BearerAuth).toEqual({
      type: 'http',
      scheme: 'bearer',
      description: 'Hashed revocable API bearer token issued to the owner or automated tools.',
    });
    expect(sec.SessionAuth).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'lp_session',
      description: 'HTTP-only authenticated owner session cookie.',
    });
    expect(sec.CsrfToken).toEqual({
      type: 'apiKey',
      in: 'header',
      name: 'X-CSRF-Token',
      description: 'Cross-Site Request Forgery prevention token bound to the current session.',
    });
  });

  it('4. Hono app serves OpenAPI specification on /api/v1/openapi.json and root alias', async () => {
    const { app } = createApp();

    const resV1 = await app.request('/api/v1/openapi.json');
    expect(resV1.status).toBe(200);
    const bodyV1 = await resV1.json();
    expect(bodyV1.openapi).toBe('3.1.0');
    expect(bodyV1.info.title).toBe('Living Portfolio API');

    const resRoot = await app.request('/openapi.json');
    expect(resRoot.status).toBe(200);
    const bodyRoot = await resRoot.json();
    expect(bodyRoot.info.title).toBe('Living Portfolio API');
  });

  it('5. Hono app mounts versioned /api/v1 endpoints and preserves backward compatibility', async () => {
    const { app } = createApp();

    // Health on versioned and legacy paths
    const healthV1 = await app.request('/api/v1/health');
    expect(healthV1.status).toBe(200);
    const healthV1Json = await healthV1.json();
    expect(healthV1Json.status).toBeDefined();

    const healthLegacy = await app.request('/api/health');
    expect(healthLegacy.status).toBe(200);

    // Entries list on versioned and legacy paths
    const entriesV1 = await app.request('/api/v1/entries');
    expect(entriesV1.status).toBe(200);

    const entriesLegacy = await app.request('/api/entries');
    expect(entriesLegacy.status).toBe(200);

    // Timeline on versioned and legacy paths
    const timelineV1 = await app.request('/api/v1/timeline');
    expect(timelineV1.status).toBe(200);

    const timelineLegacy = await app.request('/api/timeline');
    expect(timelineLegacy.status).toBe(200);
  });

  it('6. @living-portfolio/client executes typed requests against versioned /api/v1 endpoints', async () => {
    const { app } = createApp();

    const client = createLivingPortfolioClient({
      baseUrl: 'http://test-server',
      fetch: (url, init) => {
        // Adapt fetch to Hono app.request
        const reqUrl = typeof url === 'string' ? url : url.toString();
        const parsed = new URL(reqUrl);
        const path = parsed.pathname + parsed.search;
        return app.request(path, init);
      },
    });

    // Check health through client
    const health = await client.health();
    expect(health.version).toBe('0.1.0');
    expect(health.status).toBeDefined();

    // Check openapi through client
    const spec = await client.getOpenApiSpec();
    expect(spec.openapi).toBe('3.1.0');

    // Check entries through client
    const entriesRes = await client.entries.list();
    expect(Array.isArray(entriesRes.entries)).toBe(true);

    // Check timeline through client
    const timeline = await client.timeline.get();
    expect(timeline.strataBuckets).toBeDefined();

    // Check session through client
    const session = await client.auth.session();
    expect(session.authenticated).toBe(false);
  });
});
