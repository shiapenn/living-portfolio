/**
 * API Dual-Write Verification Harness & Shadow Metrics Conformance Suite (Fix 8, Fix 10, OSR-15)
 *
 * Verifies:
 * 1. API instantiation with databaseKind: 'dual-write' attaches DualWritePortfolioRepository.
 * 2. Authenticated endpoints write to primary and replicate to shadow transparently.
 * 3. GET /api/admin/metrics/shadow returns operational health, call counts, and zero drift.
 * 4. GET /api/admin/metrics/shadow/parity verifies deep result equality across repository engines.
 * 5. POST /api/admin/metrics/shadow/reset clears operational metrics on demand.
 * 6. Non-admin calls to /api/admin/metrics/shadow are rejected with 401 Unauthorized.
 */
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import {
  InMemoryPortfolioRepository,
  DualWritePortfolioRepository,
} from '@living-portfolio/db';

describe('API Dual-Write Harness & Shadow Metrics Conformance (Fix 8, Fix 10, OSR-15)', () => {
  const bootstrapToken = 'test_admin_token_dual_write_001';

  function createDualWriteApp() {
    const primary = new InMemoryPortfolioRepository();
    const shadow = new InMemoryPortfolioRepository();
    const dualRepo = new DualWritePortfolioRepository({
      primary,
      shadow,
      shadowWrites: true,
      shadowReads: true,
      recordMetrics: true,
    });

    return createApp(dualRepo, {
      bootstrapAdminToken: bootstrapToken,
    });
  }

  it('rejects unauthenticated requests to /api/admin/metrics/shadow with 401', async () => {
    const { app } = createDualWriteApp();

    const res = await app.request('/api/admin/metrics/shadow');
    expect(res.status).toBe(401);
  });

  it('serves shadow metrics to authenticated admin with healthy initial state', async () => {
    const { app } = createDualWriteApp();

    const res = await app.request('/api/admin/metrics/shadow', {
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('dual-write');
    expect(body.metrics).toBeDefined();
    expect(body.metrics.health).toBe('HEALTHY');
    expect(body.metrics.totalMismatches).toBe(0);
    expect(body.metrics.totalShadowErrors).toBe(0);
  });

  it('records matches and tracks latency when performing API write and read operations', async () => {
    const { app } = createDualWriteApp();

    // 1. First get preview token
    const text = 'Dual write API testing content with clean text verification.';
    const previewRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    });
    expect(previewRes.status).toBe(200);
    const { redactionPreviewToken } = (await previewRes.json()) as any;

    // 2. Publish Entry
    const createRes = await app.request('/api/entries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'dual-write-api-entry',
        title: 'Dual Write API Entry',
        body_md: text,
        visibility: 'public',
        redactionPreviewToken,
        nda_confirmed: true,
      }),
    });
    expect(createRes.status).toBe(201);

    // 3. Public Read
    const getRes = await app.request('/api/entries/dual-write-api-entry');
    expect(getRes.status).toBe(200);
    const entryData = (await getRes.json()) as any;
    expect(entryData.entry.slug).toBe('dual-write-api-entry');

    // 4. Verify Metrics
    const metricsRes = await app.request('/api/admin/metrics/shadow', {
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });
    expect(metricsRes.status).toBe(200);
    const { metrics } = (await metricsRes.json()) as any;
    expect(metrics.totalCalls).toBeGreaterThan(0);
    expect(metrics.totalMatches).toBeGreaterThan(0);
    expect(metrics.totalMismatches).toBe(0);
    expect(metrics.health).toBe('HEALTHY');

    // 5. Parity verification endpoint
    const parityRes = await app.request('/api/admin/metrics/shadow/parity', {
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });
    expect(parityRes.status).toBe(200);
    const { parity } = (await parityRes.json()) as any;
    expect(parity.isParityClean).toBe(true);

    // 6. Reset endpoint
    const resetRes = await app.request('/api/admin/metrics/shadow/reset', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });
    expect(resetRes.status).toBe(200);

    const postResetRes = await app.request('/api/admin/metrics/shadow', {
      headers: {
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });
    const postResetBody = (await postResetRes.json()) as any;
    expect(postResetBody.metrics.totalCalls).toBe(0);
  });
});
