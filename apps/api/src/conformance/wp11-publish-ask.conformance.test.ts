import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider } from '@living-portfolio/ai';
import { PortfolioWorker } from '@living-portfolio/worker';
import { chunkMarkdown } from '@living-portfolio/core';
import { createApp } from '../app.js';
import { mountBundledWeb } from '../adapter/bundled-web.js';
import { renderAskPage, renderAdminEntriesPage } from '@living-portfolio/web';

describe('WP-11.1 Conformance: Debounced Static Rebuild UI & Ask Flow Repair (20261020-UX-05 & 20261020-UX-10)', () => {
  const adminToken = 'test-admin-token-suite-001';

  it('[UX-05] GET /api/v1/publish/status reports debounced build window and 12/day cap counters', async () => {
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo, publishConfig: { debounceMinutes: 10, maxBuildsPerDay: 12 } });
    const { app } = createApp(repo, { worker, bootstrapAdminToken: adminToken });

    const res = await app.request('/api/v1/publish/status');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.state).toBe('idle');
    expect(body.status).toBe('idle');
    expect(body.buildsToday).toBe(0);
    expect(body.maxBuildsPerDay).toBe(12);
    expect(body.debounceMinutes).toBe(10);
    expect(body.minutesRemaining).toBe(0);
  });

  it('[UX-05] POST /api/v1/publish/now bypasses 10-minute debounce window and requires admin authentication', async () => {
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo, publishConfig: { debounceMinutes: 10, maxBuildsPerDay: 12 } });
    const { app } = createApp(repo, { worker, bootstrapAdminToken: adminToken });

    // 1. Unauthenticated request -> 401
    const unauthRes = await app.request('/api/v1/publish/now', { method: 'POST' });
    expect(unauthRes.status).toBe(401);

    // 2. Authenticated request -> 200 with built: true
    const authRes = await app.request('/api/v1/publish/now', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(authRes.status).toBe(200);
    const body = await authRes.json();
    expect(body.ok).toBe(true);
    expect(body.built).toBe(true);
    expect(body.buildsToday).toBe(1);

    // 3. Immediately checking status -> queued debounce countdown
    const statusRes = await app.request('/api/v1/publish/status');
    const statusBody = await statusRes.json();
    expect(statusBody.state).toBe('queued');
    expect(statusBody.buildsToday).toBe(1);
    expect(statusBody.minutesRemaining).toBeGreaterThanOrEqual(9);
    expect(statusBody.nextAllowedBuildTime).toBeDefined();

    // 4. Manual /now immediately bypasses the debounce window
    const bypassRes = await app.request('/api/v1/publish/now', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(bypassRes.status).toBe(200);
    const bypassBody = await bypassRes.json();
    expect(bypassBody.built).toBe(true);
    expect(bypassBody.buildsToday).toBe(2);
  });

  it('[UX-05] POST /api/v1/publish/enrich enqueues background enrichment and tracks pending status', async () => {
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo });
    const { app } = createApp(repo, { worker, bootstrapAdminToken: adminToken });

    // Seed a test entry
    const { entry, revision } = await repo.createEntry(
      { slug: 'enrich-test', title: 'Enrich Test', profile: 'case-study', visibility: 'public', view: 'article', current_revision_id: null },
      { body_md: '## Context\nTest content for background enrichment.', body_hash: 'hash1', valid_from: new Date().toISOString() }
    );

    // Unauthenticated -> 401
    const unauth = await app.request('/api/v1/publish/enrich', {
      method: 'POST',
      body: JSON.stringify({ entryId: entry.id }),
    });
    expect(unauth.status).toBe(401);

    // Authenticated -> 200 queued
    const auth = await app.request('/api/v1/publish/enrich', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryId: entry.id, revisionId: revision.id }),
    });
    expect(auth.status).toBe(200);
    const resBody = await auth.json();
    expect(resBody.ok).toBe(true);
    expect(resBody.queued).toBe(true);
    expect(resBody.entryId).toBe(entry.id);

    // Check status probe
    const statusRes = await app.request(`/api/v1/publish/enrich/status/${entry.id}`);
    expect(statusRes.status).toBe(200);
  });

  it('[UX-05 / D-WORKSPACE] Admin editor removes legacy Publish Now and Enrichment pipeline controls', async () => {
    const repo = new InMemoryPortfolioRepository();
    const html = await renderAdminEntriesPage(repo as any);

    expect(html).toContain('id="ref-main"');
    expect(html).not.toContain('Publish Now');
    expect(html).not.toContain('id="btn-trigger-enrichment"');
  });

  it('[UX-10] Ask flow returns needs_context state for indeterminate advisory queries', async () => {
    const repo = new InMemoryPortfolioRepository();
    const mockProvider = new MockModelProvider();
    const governor = new BudgetGovernor({}, repo);
    const { app } = createApp(repo, {
      providers: [mockProvider],
      governor,
      bootstrapAdminToken: adminToken,
    });

    const bodyMd = 'Advisory architecture documentation on PostgreSQL advisory locks for distributed workers.';
    // Create public entry with confirmed stack facet
    const { entry, revision } = await repo.createEntry(
      { slug: 'advisory-target', title: 'Advisory Target', profile: 'case-study', visibility: 'public', view: 'article', current_revision_id: null },
      { body_md: bodyMd, body_hash: 'hash2', valid_from: new Date().toISOString() }
    );
    const chunks = chunkMarkdown(revision.id, bodyMd);
    await repo.saveSpans(chunks);

    await repo.saveFacet({
      entry_id: entry.id,
      revision_id: revision.id,
      key: 'database',
      value: 'Postgres 16',
      status: 'confirmed',
      source: 'owner',
    });

    // Ask advisory question without required facets -> returns needs_context
    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should we adopt PostgreSQL advisory locks for our distributed workers?',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tier).toBe('needs_context');
    expect(data.queryClass).toBe('advisory');
    expect(Array.isArray(data.missingFacets)).toBe(true);
    expect(data.missingFacets.length).toBeGreaterThan(0);

    // Resubmitting with context_asked: true bypasses the needs_context prompt
    const bypassRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should we adopt PostgreSQL advisory locks for our distributed workers?',
        context_asked: true,
      }),
    });
    expect(bypassRes.status).toBe(200);
    const bypassData = await bypassRes.json();
    expect(bypassData.tier).not.toBe('needs_context');
  });

  it('[UX-10] Ask flow enforces hourly question rate limit with 429 and rate_limited tier', async () => {
    const repo = new InMemoryPortfolioRepository();
    // Budget governor with 1 request per hour visitor limit
    const governor = new BudgetGovernor({ perVisitorHourlyCap: 1 }, repo);
    const { app } = createApp(repo, { governor, bootstrapAdminToken: adminToken });

    // Request 1: allowed
    const res1 = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the system architecture?' }),
    });
    expect(res1.status).not.toBe(429);

    // Request 2: exceeds rate limit -> 429
    const res2 = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Tell me more about the database?' }),
    });
    expect(res2.status).toBe(429);
    const body2 = await res2.json();
    expect(body2.tier).toBe('rate_limited');
    expect(body2.retryAfter).toBeDefined();
    expect(body2.answer).toContain('Hourly question limit reached');
  });

  it('[UX-10] Ask page renders dynamic question examples, entry scope indicator, and double-submit lockout', async () => {
    const repo = new InMemoryPortfolioRepository();
    await repo.createEntry(
      { slug: 'real-pipeline', title: 'PostgreSQL Advisory Lock Migration', profile: 'case-study', visibility: 'public', view: 'article', current_revision_id: null },
      { body_md: 'Real pipeline documentation.', body_hash: 'hash3', valid_from: new Date().toISOString() }
    );

    // Render with client and active scope
    const html = await renderAskPage(repo as any, undefined, 'real-pipeline');

    // Dynamic question examples from entry title
    expect(html).toContain('What approach was used in PostgreSQL Advisory Lock Migration?');
    // Scope chip displayed prominently
    expect(html).toContain('Scope: <strong>real-pipeline</strong>');
    expect(html).toContain('id="btn-clear-scope"');
    // Lockout attributes present in script
    expect(html).toContain("submitBtn.setAttribute('disabled', 'true')");
    expect(html).toContain("submitBtn.setAttribute('aria-busy', 'true')");
    // Needs context interactive form present in script
    expect(html).toContain('btn-submit-with-context');
    expect(html).toContain('btn-skip-context');
    // Scoped notice retained in result view
    expect(html).toContain('ask-scoped-notice');
  });
});
