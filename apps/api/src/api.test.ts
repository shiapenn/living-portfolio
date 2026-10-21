import { describe, it, expect, beforeEach } from 'vitest';
import { MockModelProvider } from '@living-portfolio/ai';
import { createApp } from './app.js';
import { computeTotpCode } from './auth/security.js';

describe('Living Portfolio API Integration Tests', () => {
  let app: ReturnType<typeof createApp>['app'];
  let repo: ReturnType<typeof createApp>['repo'];
  let adminToken: string;
  let authHeaders: Record<string, string>;

  beforeEach(() => {
    const instance = createApp(undefined, {
      bootstrapAdminToken: 'test-admin-token-suite-001',
      providers: [new MockModelProvider()],
    });
    app = instance.app;
    repo = instance.repo;
    adminToken = instance.adminToken;
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
  });

  async function createPublicEntry(entryData: any) {
    const previewRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: entryData.body_md }),
    });
    const previewData = await previewRes.json();
    return app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        ...entryData,
        redactionPreviewToken: previewData.redactionPreviewToken,
      }),
    });
  }

  it('GET /healthz returns healthy system status', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
    expect(body.version).toBe('0.1.0');
  });

  it('POST /api/entries creates entry, revision, chunks, redaction warnings, and signed redactionPreviewToken', async () => {
    const text = `# The Goal\n\nWe needed to synchronize workers across our distributed cluster.\n\n# The Decision\n\nWe decided to use Postgres advisory locks instead of Redis.\n\n# What Happened\n\nIt reduced p99 latency by 40%.`;
    const previewRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text }),
    });
    const previewData = await previewRes.json();

    const res = await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'high-concurrency-postgres',
        title: 'High Concurrency PostgreSQL Advisory Locks',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: text,
        temporal_level: 'exact',
        valid_from: '2024-03-01T00:00:00Z',
        redactionPreviewToken: previewData.redactionPreviewToken,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.slug).toBe('high-concurrency-postgres');
    expect(body.spansCount).toBeGreaterThan(0);
    expect(Array.isArray(body.redactionWarnings)).toBe(true);
    expect(typeof body.redactionPreviewToken).toBe('string');
  });

  it('GET /api/entries/:slug computes structure level and gap questions', async () => {
    const text = `We investigated distributed locking for our fleet.`;
    const previewRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text }),
    });
    const previewData = await previewRes.json();

    await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'distributed-locks',
        title: 'Distributed Locks in Practice',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: text,
        temporal_level: 'estimated',
        redactionPreviewToken: previewData.redactionPreviewToken,
      }),
    });

    const res = await app.request('/api/entries/distributed-locks');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.entry.slug).toBe('distributed-locks');
    expect(body.structureLevel).toBe('L0');
    expect(body.levelDetails.label).toBe('L0 Text');
    expect(body.gapQuestions.length).toBeGreaterThan(0);
  });

  it('POST /api/ask handles lookup and advisory queries with citations', async () => {
    await createPublicEntry({
      slug: 'cache-stampede-solution',
      title: 'Mitigating Cache Stampedes',
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: `We solved cache stampedes using probabilistic early expiration algorithms with Redis and Node.js. It worked reliably under 50k requests per second.`,
      temporal_level: 'exact',
      valid_from: '2023-05-01T00:00:00Z',
    });

    const res = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What did you use to solve cache stampedes?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('tier1');
    expect(body.citations.length).toBeGreaterThan(0);
    expect(body.aiDisclosure).toContain('Automated answer');
  });

  it('[Spec §10.8 / 20261021-AI-01] with no configured model provider, /api/ask degrades to extractive excerpts and discloses it', async () => {
    await createPublicEntry({
      slug: 'cache-stampede-unconfigured',
      title: 'Mitigating Cache Stampedes (Degraded Mode)',
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: `We solved cache stampedes using probabilistic early expiration algorithms with Redis and Node.js. It worked reliably under 50k requests per second.`,
      temporal_level: 'exact',
      valid_from: '2023-05-01T00:00:00Z',
    });

    // Unconfigured createApp has providers = []
    const unconfigured = createApp(repo);
    const res = await unconfigured.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What did you use to solve cache stampedes?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('extractive');
    expect(body.degradationStep).toBe('extractive');
    expect(body.aiDisclosure).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.answer).toContain("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.answer).not.toContain("Based on the owner's records, this project utilized");
  });

  it('GET /api/timeline returns Strata Timeline layers and as_of filtering', async () => {
    await createPublicEntry({
      slug: 'early-days-2020',
      title: 'Early Days Architecture',
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: `Architecture decisions in 2020.`,
      temporal_level: 'exact',
      valid_from: '2020-04-15T00:00:00Z',
    });

    await createPublicEntry({
      slug: 'modern-era-2025',
      title: 'Modern Architecture',
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: `Architecture decisions in 2025.`,
      temporal_level: 'exact',
      valid_from: '2025-08-01T00:00:00Z',
    });

    const res = await app.request('/api/timeline?as_of=2021-01-01T00:00:00Z');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.strataBuckets.length).toBeGreaterThan(0);
    expect(body.timeTravelView).not.toBeNull();
    expect(body.timeTravelView.visibleEntries.some((e: any) => e.slug === 'early-days-2020')).toBe(true);
    expect(body.timeTravelView.futureExcludedCount).toBeGreaterThan(0);
  });

  it('[C.3] enforces first-run admin setup, TOTP login, CSRF protection, login throttling, and revocable Bearer tokens', async () => {
    // 1. Setup owner account
    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner',
        password: 'correct-horse-battery-staple',
      }),
    });
    expect(setupRes.status).toBe(201);
    const setupData = await setupRes.json();
    expect(setupData.totpSecret).toBeTruthy();

    // Second setup call is rejected with 409
    const duplicateSetup = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'owner2', password: 'another-long-password' }),
    });
    expect(duplicateSetup.status).toBe(409);

    // 2. Login with valid password + TOTP code
    const totpCode = computeTotpCode(setupData.totpSecret);
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner',
        password: 'correct-horse-battery-staple',
        totpCode,
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const sessionCookie = setCookie.split(';')[0];

    // 3. State-changing request with session cookie but WITHOUT X-CSRF-Token fails with 403
    const noCsrfRes = await app.request('/api/settings/routing', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ tier1_floor: 0.85 }),
    });
    expect(noCsrfRes.status).toBe(403);

    // With valid X-CSRF-Token succeeds
    const withCsrfRes = await app.request('/api/settings/routing', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
        'X-CSRF-Token': loginData.csrfToken,
      },
      body: JSON.stringify({ tier1_floor: 0.85 }),
    });
    expect(withCsrfRes.status).toBe(200);

    // 4. Issue and revoke a Bearer token
    const tokenRes = await app.request('/api/auth/tokens', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ label: 'ci-runner' }),
    });
    expect(tokenRes.status).toBe(201);
    const tokenData = await tokenRes.json();

    const checkValidToken = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${tokenData.token}` },
    });
    expect(checkValidToken.status).toBe(200);

    const revokeRes = await app.request(`/api/auth/tokens/${tokenData.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(revokeRes.status).toBe(200);

    const checkRevokedToken = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${tokenData.token}` },
    });
    expect(checkRevokedToken.status).toBe(401);

    // 5. Login throttling after 5 failed attempts returns 429
    for (let i = 0; i < 5; i++) {
      const badLogin = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'owner', password: 'wrong-password-123', totpCode: '000000' }),
      });
      expect(badLogin.status).toBe(401);
    }
    const throttledLogin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'owner',
        password: 'correct-horse-battery-staple',
        totpCode,
      }),
    });
    expect(throttledLogin.status).toBe(429);
  });

  it('[C.4] requires a signed redactionPreviewToken bound to entryId, bodyHash, and scan result before publishing private entry to public', async () => {
    const createRes = await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'confidential-draft',
        title: 'Confidential Draft',
        profile: 'case-study',
        view: 'article',
        visibility: 'private',
        body_md: 'Internal architecture notes before public release.',
        temporal_level: 'exact',
        valid_from: '2025-02-01T00:00:00Z',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const entryId = created.entry.id;

    // 1. Attempting to flip visibility to public with a boolean or missing token fails with 400
    const booleanAttempt = await app.request(`/api/entries/${entryId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ visibility: 'public', redactionPreviewConfirmed: true }),
    });
    expect(booleanAttempt.status).toBe(400);

    // 2. Attempting with a token bound to different body text fails with 400
    const mismatchedPreview = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ entryId, text: 'Some other body text' }),
    });
    const mismatchedData = await mismatchedPreview.json();
    const mismatchedAttempt = await app.request(`/api/entries/${entryId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ visibility: 'public', redactionPreviewToken: mismatchedData.redactionPreviewToken }),
    });
    expect(mismatchedAttempt.status).toBe(400);

    // 3. Valid signed token bound to entryId, exact body_md, and scan result succeeds
    const validPreview = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ entryId, text: 'Internal architecture notes before public release.' }),
    });
    const validData = await validPreview.json();
    const validAttempt = await app.request(`/api/entries/${entryId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ visibility: 'public', redactionPreviewToken: validData.redactionPreviewToken }),
    });
    expect(validAttempt.status).toBe(200);
    const updated = await validAttempt.json();
    expect(updated.entry.visibility).toBe('public');
  });

  it('[C.9] preserves working owner kill-switch and routing floor warning behind admin authentication', async () => {
    const patchRes = await app.request('/api/settings/routing', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        automatedAnsweringEnabled: false,
        tier1_floor: 0.75,
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.runtime.automatedAnsweringEnabled).toBe(false);
    expect(patchData.routing.warning).toContain('below the shipped default (0.82)');

    // Verify /api/ask immediately honors the kill-switch
    const askRes = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Test question while kill-switch is active' }),
    });
    expect(askRes.status).toBe(200);
    const askData = await askRes.json();
    expect(askData.tier).toBe('disabled');
  });
});
