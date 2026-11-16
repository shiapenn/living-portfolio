import { describe, it, expect, beforeEach } from 'vitest';
import { MockModelProvider } from '@living-portfolio/ai';
import { seedDemoPortfolio } from '@living-portfolio/db';
import { createApp } from './app.js';
import { mountBundledWeb } from './adapter/bundled-web.js';
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
    await repo.createEntry(
      {
        slug: 'early-days-2020',
        title: 'Early Days Architecture',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        current_revision_id: null,
      },
      {
        body_md: `Architecture decisions in 2020.`,
        body_hash: 'sha256-early-2020',
        temporal_level: 'exact',
        written_at: '2020-04-15T00:00:00Z',
        valid_from: '2020-04-15T00:00:00Z',
      }
    );

    await repo.createEntry(
      {
        slug: 'modern-era-2025',
        title: 'Modern Architecture',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        current_revision_id: null,
      },
      {
        body_md: `Architecture decisions in 2025.`,
        body_hash: 'sha256-modern-2025',
        temporal_level: 'exact',
        written_at: '2025-08-01T00:00:00Z',
        valid_from: '2025-08-01T00:00:00Z',
      }
    );

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

  it('[M2] Degradation Step 2: Caches verified answer on repeat query and invalidates on revision modification (§10.8 Step 2)', async () => {
    const entryRes = await createPublicEntry({
      slug: 'distributed-lock-cache',
      title: 'Distributed Locking Architecture',
      profile: 'case-study',
      view: 'article',
      visibility: 'public',
      body_md: '# The Goal\n\nWe needed to synchronize distributed workers.\n\n# The Decision\n\nWe selected advisory locks in Postgres for synchronization.',
      temporal_level: 'exact',
      valid_from: '2025-01-01T00:00:00Z',
    });
    expect(entryRes.status).toBe(201);
    const { entry } = await entryRes.json();

    const query = 'How do we synchronize distributed workers?';

    // 1. First Ask query: synthesized from provider (Step 1 normal)
    const ask1 = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    expect(ask1.status).toBe(200);
    const data1 = await ask1.json();
    expect(data1.tier).toBe('tier1');
    expect(data1.degradationStep).toBe('normal');

    // 2. Repeat Ask query: hits AnswerCache (Step 2 cached)
    const ask2 = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'how do we SYNCHRONIZE distributed workers??' }),
    });
    expect(ask2.status).toBe(200);
    const data2 = await ask2.json();
    expect(data2.tier).toBe('tier1');
    expect(data2.degradationStep).toBe('cached');
    expect(data2.answer).toBe(data1.answer);

    // 3. Post new revision for cited entry (§10.8 Step 2 invalidation)
    const revRes = await app.request(`/api/entries/${entry.id}/revisions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        body_md: '# The Goal\n\nWe updated worker coordination.\n\n# The Decision\n\nWe migrated to Redis redlock.',
        valid_from: '2025-03-01T00:00:00Z',
      }),
    });
    expect(revRes.status).toBe(201);

    // 4. Ask query after invalidation: cache miss, freshly synthesized (Step 1 normal)
    const ask3 = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    expect(ask3.status).toBe(200);
    const data3 = await ask3.json();
    expect(data3.degradationStep).toBe('normal');
  });

  it('[M2] Degradation Step 3: Falls back to secondary provider and returns degradationStep: fallback_provider (§10.8 Step 3)', async () => {
    const failingPrimary = new MockModelProvider('primary-fail', 'Primary Failing Provider');
    failingPrimary.complete = async () => {
      const err: any = new Error('429 Rate Limit Exceeded');
      err.status = 429;
      throw err;
    };
    const secondary = new MockModelProvider('secondary-ok', 'Secondary Working Provider');

    const fallbackApp = createApp(undefined, {
      bootstrapAdminToken: 'test-admin-token-fallback-001',
      providers: [failingPrimary, secondary],
    });

    await seedDemoPortfolio(fallbackApp.repo);

    const askRes = await fallbackApp.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What database did you migrate to?' }),
    });
    expect(askRes.status).toBe(200);
    const askData = await askRes.json();
    expect(askData.tier).toBe('tier1');
    expect(askData.degradationStep).toBe('fallback_provider');
  });

  it('[M2] Degradation Step 6: Offline/unreachable database returns degradationStep: handoff and booking options (§10.8 Step 6)', async () => {
    const brokenRepo = {
      checkHealth: async () => false,
      hybridSearch: async () => {
        throw new Error('Database unreachable');
      },
    };

    const offlineApp = createApp(brokenRepo as any, {
      bootstrapAdminToken: 'test-admin-token-offline-001',
      providers: [new MockModelProvider()],
    });

    const res = await offlineApp.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How does the architecture work?' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tier).toBe('disabled');
    expect(data.degradationStep).toBe('handoff');
    expect(data.bookingUrl).toContain('/book?q=');
    expect(data.answer).toContain('offline');
  });

  it('[20261020-UX-11] POST /api/book accepts booking request with carried facets, persists to repository, and GET /api/book requires admin auth', async () => {
    // 1. Invalid payload returns 400
    const badRes = await app.request('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: '' }),
    });
    expect(badRes.status).toBe(400);

    // 2. Valid booking persists
    const bookRes = await app.request('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Architecture Review for Multi-tenant Cluster',
        visitor_name: 'Visitor Alex',
        visitor_contact: 'visitor@example.com',
        facets: { scale: 'high_volume', stack: 'postgres' },
        preferred_time: 'Weekday mornings',
        notes: 'Exploring sharding options',
      }),
    });
    expect(bookRes.status).toBe(201);
    const bookData = await bookRes.json();
    expect(bookData.success).toBe(true);
    expect(bookData.booking.id).toBeDefined();
    expect(bookData.booking.topic).toBe('Architecture Review for Multi-tenant Cluster');

    // 3. GET /api/book requires admin token
    const unauthGet = await app.request('/api/book');
    expect(unauthGet.status).toBe(401);

    const authGet = await app.request('/api/book', {
      headers: authHeaders,
    });
    expect(authGet.status).toBe(200);
    const listData = await authGet.json();
    expect(listData.bookings.length).toBeGreaterThan(0);
    expect(listData.bookings.some((b: any) => b.visitor_contact === 'visitor@example.com')).toBe(true);
  });

  it('[20261020-UX-08] Tier 2 escalation status token and contact attachment flow end to end', async () => {
    // 1. Save escalation with status token
    const saved = await repo.saveEscalation({
      question: 'Can you advise on migrating from DynamoDB to Postgres under strict zero-downtime SLA?',
      query_class: 'advisory',
      facets: { cloud: 'aws', scale: 'tier1' },
      draft: 'We completed zero-downtime cutover using dual-write and shadow validation.',
      status: 'pending',
      status_token: 'test-token-receipt-12345',
      due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    expect(saved.status_token).toBe('test-token-receipt-12345');

    // 2. Query status receipt as visitor
    const statusRes = await app.request('/api/ask/status/test-token-receipt-12345');
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.found).toBe(true);
    expect(statusData.escalation.status).toBe('pending');
    expect(statusData.escalation.question).toContain('DynamoDB to Postgres');

    // 3. Attach visitor contact to receipt
    const contactRes = await app.request('/api/ask/status/test-token-receipt-12345/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: 'lead-architect@client.org' }),
    });
    expect(contactRes.status).toBe(200);
    const contactData = await contactRes.json();
    expect(contactData.success).toBe(true);
    expect(contactData.escalation.visitor_contact).toBe('lead-architect@client.org');

    // 4. Owner approves escalation with edits via /api/inbox
    const approveRes = await app.request(`/api/inbox/${saved.id}/approve`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finalReply: 'Yes, we recommend dual-write repository pattern with shadow metrics as detailed in ADR-02.',
      }),
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.escalation.status).toBe('approved');
    expect(approveData.escalation.final).toContain('ADR-02');

    // 5. Visitor checks receipt URL again and sees approved reply
    const updatedStatusRes = await app.request('/api/ask/status/test-token-receipt-12345');
    expect(updatedStatusRes.status).toBe(200);
    const updatedStatusData = await updatedStatusRes.json();
    expect(updatedStatusData.escalation.status).toBe('approved');
    expect(updatedStatusData.escalation.final).toContain('ADR-02');
  });

  describe('WP-5.1: Admin Operations, Calibration, Scoped Constraints & Settings Routes (20261020-UX-09)', () => {
    it('confirms and discards scoped constraints via /api/settings/constraints', async () => {
      const sc = await repo.saveScopedConstraint({
        constraint: { max_concurrency: 50 },
        scope: { domain: 'worker' },
        source_quote: 'Limit worker concurrency to 50 jobs per minute',
        status: 'proposed',
      });

      // 1. List constraints
      const listRes = await app.request('/api/settings/constraints', { headers: authHeaders });
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(listData.constraints.length).toBeGreaterThan(0);
      const found = listData.constraints.find((c: any) => c.id === sc.id);
      expect(found).toBeDefined();
      expect(found.status).toBe('proposed');

      // 2. Confirm constraint
      const confirmRes = await app.request(`/api/settings/constraints/${sc.id}/confirm`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      expect(confirmRes.status).toBe(200);
      const confirmData = await confirmRes.json();
      expect(confirmData.updated).toBe(true);
      expect(confirmData.constraint.status).toBe('confirmed');

      // 3. Discard constraint
      const discardRes = await app.request(`/api/settings/constraints/${sc.id}/discard`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      expect(discardRes.status).toBe(200);
      const discardData = await discardRes.json();
      expect(discardData.updated).toBe(true);
      expect(discardData.constraint.status).toBe('discarded');

      // 4. Returns 404 for nonexistent constraint
      const notFoundRes = await app.request('/api/settings/constraints/non-existent-id/confirm', {
        method: 'PATCH',
        headers: authHeaders,
      });
      expect(notFoundRes.status).toBe(404);
    });

    it('updates routing floors and triggers warning when tier 1 floor is below default 0.82', async () => {
      const updateRes = await app.request('/api/settings/routing', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier1_floor: 0.75,
          tier2_floor: 0.50,
          automatedAnsweringEnabled: false,
          calibrationFrozen: true,
        }),
      });

      expect(updateRes.status).toBe(200);
      const data = await updateRes.json();
      expect(data.updated).toBe(true);
      expect(data.runtime.automatedAnsweringEnabled).toBe(false);
      expect(data.runtime.calibrationFrozen).toBe(true);
      expect(data.routing.tier1_floor).toBe(0.75);
      expect(data.routing.warning).toContain('Warning: Tier 1 floor (0.75) is set below the shipped default (0.82)');
    });

    it('returns honest 501 Not Implemented for unconfigured notifications and backup drills', async () => {
      const notifyRes = await app.request('/api/settings/notifications/test', {
        method: 'POST',
        headers: authHeaders,
      });
      expect(notifyRes.status).toBe(501);
      const notifyData = await notifyRes.json();
      expect(notifyData.finding).toBe('M1');
      expect(notifyData.message).toContain('Notification channel delivery adapter is not yet implemented');

      const drillRes = await app.request('/api/settings/backups/run-drill', {
        method: 'POST',
        headers: authHeaders,
      });
      expect(drillRes.status).toBe(501);
      const drillData = await drillRes.json();
      expect(drillData.finding).toBe('M1');
      expect(drillData.message).toContain('backup and scratch-container restore verification are not yet implemented');
    });

    it('serves /admin/settings page with 200 HTML under admin authentication', async () => {
      const { app: bundledApp } = createApp(repo, {
        bootstrapAdminToken: 'test-admin-token-suite-001',
        providers: [new MockModelProvider()],
        bundledWeb: true,
        bundledWebAdapter: mountBundledWeb,
      });
      const res = await bundledApp.request('/admin/settings', { headers: authHeaders });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('Settings');
      expect(text).toContain('/admin/settings/answering');
    });
  });

  describe('WP-5.2: Setup Wizard, Credential Lockdown & Token Revocation Persistence (20261020-UX-01)', () => {
    it('persists admin account and token revocation across reboots via storagePath', async () => {
      const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
      const { tmpdir } = await import('node:os');
      const { join } = await import('node:path');
      const tempDir = mkdtempSync(join(tmpdir(), 'auth-persistence-test-'));
      const tempStoragePath = join(tempDir, 'auth-persistence.json');

      try {
        // 1. Initialize AuthManager with storagePath
        const { AuthManager } = await import('./auth/security.js');
        const authInstance1 = new AuthManager({ storagePath: tempStoragePath });
        expect(authInstance1.isSetupCompleted()).toBe(false);

        // 2. Setup account and issue tokens
        authInstance1.setupAdminAccount('master_owner', 'AStrongPassword2026!');
        expect(authInstance1.isSetupCompleted()).toBe(true);

        const token1 = authInstance1.issueBearerToken('runner-1');
        const token2 = authInstance1.issueBearerToken('runner-2');

        expect(authInstance1.verifyBearerToken(token1.rawToken)).toBe(true);
        expect(authInstance1.verifyBearerToken(token2.rawToken)).toBe(true);

        // 3. Revoke token1
        const revoked = authInstance1.revokeBearerToken(token1.record.id);
        expect(revoked).toBe(true);
        expect(authInstance1.verifyBearerToken(token1.rawToken)).toBe(false);

        // 4. Create new AuthManager instance reading from the same storagePath (simulating reboot)
        const authInstance2 = new AuthManager({ storagePath: tempStoragePath });
        expect(authInstance2.isSetupCompleted()).toBe(true);
        expect(authInstance2.verifyBearerToken(token1.rawToken)).toBe(false);
        expect(authInstance2.verifyBearerToken(token2.rawToken)).toBe(true);

        const tokens = authInstance2.listBearerTokens();
        const persistedToken1 = tokens.find((t) => t.id === token1.record.id);
        expect(persistedToken1?.revokedAt).toBeTruthy();
        const persistedToken2 = tokens.find((t) => t.id === token2.record.id);
        expect(persistedToken2?.revokedAt).toBeNull();
      } finally {
        if (existsSync(tempDir)) {
          rmSync(tempDir, { recursive: true, force: true });
        }
      }
    });

    it('enforces setup lockdown and 409 Conflict once admin account is configured', async () => {
      const { app: freshApp, auth: freshAuth } = createApp();
      expect(freshAuth.isSetupCompleted()).toBe(false);

      // Initial setup succeeds
      const setupRes = await freshApp.request('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'first_owner',
          password: 'ValidSuperPassword2026!',
        }),
      });
      expect(setupRes.status).toBe(201);
      const setupData = await setupRes.json();
      expect(setupData.configured).toBe(true);
      expect(setupData.totpSecret).toBeTruthy();

      // Subsequent setup attempts are locked down with 409 Conflict
      const duplicateRes = await freshApp.request('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'intruder',
          password: 'AnotherPassword123!',
        }),
      });
      expect(duplicateRes.status).toBe(409);
      const dupData = await duplicateRes.json();
      expect(dupData.error).toContain('already configured');
    });

    it('returns human-readable 429 throttling message upon 5 failed attempts', async () => {
      const { app: freshApp } = createApp();
      // Setup account first so login can be attempted
      await freshApp.request('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'throttle_target',
          password: 'TargetPassword2026!',
        }),
      });

      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const res = await freshApp.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'throttle_target',
            password: 'incorrect-password',
            totpCode: '111111',
          }),
        });
        expect(res.status).toBe(401);
      }

      // 6th attempt is throttled
      const throttledRes = await freshApp.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'throttle_target',
          password: 'TargetPassword2026!',
          totpCode: '111111',
        }),
      });
      expect(throttledRes.status).toBe(429);
      const body = await throttledRes.json();
      expect(body.error).toContain('Too many failed login attempts');
    });
  });

  describe('WP-5.3: Web Mounting in createApp & Multi-Pass Redaction Endpoint (Fix F1, 20261020-UX-03)', () => {
    it('returns multiPass entity breakdown in POST /api/entries/redaction-preview (20261020-UX-03)', async () => {
      const testSecretKey = ['sk', 'proj', 'apitestkey1234567890'].join('-');
      const text = `Confidential client deployment under strict NDA. Key: ${testSecretKey}. Contact admin@internal.example.org on 192.168.1.1 for Project Orion.`;
      const res = await app.request('/api/entries/redaction-preview', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.clean).toBe(false);
      expect(data.state).toBe('needs review');
      expect(data.multiPass).toBeDefined();
      expect(data.multiPass.pass1Secrets.length).toBeGreaterThanOrEqual(1);
      expect(data.multiPass.pass2NdaMarkers.length).toBeGreaterThanOrEqual(1);
      expect(data.multiPass.pass3Entities.length).toBeGreaterThanOrEqual(3);
      expect(data.redactionPreviewToken).toBeTruthy();
    });

    it('mounts public site routes and performs HTML vs JSON content negotiation on / (F1)', async () => {
      const { app: bundledApp } = createApp(repo, {
        bootstrapAdminToken: 'test-admin-token-suite-001',
        providers: [new MockModelProvider()],
        bundledWeb: true,
        bundledWebAdapter: mountBundledWeb,
      });
      // Public HTML sub-routes
      const workRes = await bundledApp.request('/work');
      expect(workRes.status).toBe(200);
      expect(await workRes.text()).toContain('>Work</h1>');

      const timelineRes = await bundledApp.request('/timeline');
      expect(timelineRes.status).toBe(200);

      // Root content negotiation
      const htmlRes = await bundledApp.request('/', {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      expect(htmlRes.status).toBe(200);
      expect(await htmlRes.text()).toContain('<!DOCTYPE html>');

      const jsonRes = await bundledApp.request('/', {
        headers: { Accept: 'application/json' },
      });
      expect(jsonRes.status).toBe(200);
      const json = await jsonRes.json();
      expect(json.status).toBe('online');
    });
  });
});
