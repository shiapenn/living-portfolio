import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

describe('Redaction Scanner & Publish Gate Conformance (§4.3, §15, UX-03 / P0-3, WP-1 Task 3)', () => {
  const adminToken = 'redaction_scanner_conformance_test_token';

  it('returns four-state preview response schema with clean=true for unflagged text', async () => {
    const { app } = createApp(new InMemoryPortfolioRepository(), {
      bootstrapAdminToken: adminToken,
    });

    const res = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        text: 'This is clean public technical writing about modern distributed databases.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state).toBe('clean');
    expect(body.clean).toBe(true);
    expect(Array.isArray(body.warnings)).toBe(true);
    expect(body.warnings.length).toBe(0);
    expect(typeof body.redactionPreviewToken).toBe('string');
  });

  it('matches owner exclusion list loaded from data file and marks state as "needs review"', async () => {
    const { app } = createApp(new InMemoryPortfolioRepository(), {
      bootstrapAdminToken: adminToken,
    });

    // Uses exclusion terms defined in data/redaction-exclusions.json
    const res = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        text: 'Architecture document referencing internal.corp.example.com and secret-project-alpha.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state).toBe('needs review');
    expect(body.clean).toBe(false);
    expect(body.warnings.length).toBeGreaterThanOrEqual(2);
    expect(body.exclusionsMatched.length).toBeGreaterThanOrEqual(2);
    expect(body.warnings.some((w: any) => w.match === 'internal.corp.example.com')).toBe(true);
    expect(body.warnings.some((w) => w.match === 'secret-project-alpha')).toBe(true);
  });

  it('supports runtime settings updates via PATCH /api/settings/redaction for dynamic exclusions', async () => {
    const { app } = createApp(new InMemoryPortfolioRepository(), {
      bootstrapAdminToken: adminToken,
    });

    // 1. Initially unflagged custom project
    const preCheck = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        text: 'Design notes for Project Chimera.',
      }),
    });
    expect((await preCheck.json()).state).toBe('clean');

    // 2. Add "Project Chimera" to runtime exclusions
    const patchRes = await app.request('/api/settings/redaction', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        exclusions: ['Project Chimera', 'Vendor Titan'],
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.redaction.exclusions).toContain('Project Chimera');

    // 3. Re-scan now flags "Project Chimera" without hardcoded literals
    const postCheck = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        text: 'Design notes for Project Chimera.',
      }),
    });
    const postBody = await postCheck.json();
    expect(postBody.state).toBe('needs review');
    expect(postBody.clean).toBe(false);
    expect(postBody.warnings.some((w: any) => w.match === 'Project Chimera')).toBe(true);
  });

  it('rejects public publish with warnings if NDA confirmation is absent or false (§4.3, UX-03)', async () => {
    const { app } = createApp(new InMemoryPortfolioRepository(), {
      bootstrapAdminToken: adminToken,
    });

    const bodyText = 'Client deployment notes citing internal.corp.example.com.';

    // 1. Acquire valid signed preview token for the body text
    const previewRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ text: bodyText }),
    });
    const previewData = await previewRes.json();
    expect(previewData.state).toBe('needs review');
    const token = previewData.redactionPreviewToken;

    // 2. Attempt to publish public without confirming NDA declaration -> 400
    const failPublish = await app.request('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug: 'flagged-without-nda',
        title: 'Flagged Without NDA',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: bodyText,
        temporal_level: 'exact',
        valid_from: '2026-01-01T00:00:00Z',
        redactionPreviewToken: token,
        nda_confirmed: false,
      }),
    });
    expect(failPublish.status).toBe(400);
    const failData = await failPublish.json();
    expect(failData.error).toContain('Confidentiality & NDA confirmation required');

    // 3. Publish public WITH nda_confirmed: true -> 201
    const passPublish = await app.request('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slug: 'flagged-with-nda',
        title: 'Flagged With NDA',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: bodyText,
        temporal_level: 'exact',
        valid_from: '2026-01-01T00:00:00Z',
        redactionPreviewToken: token,
        nda_confirmed: true,
      }),
    });
    expect(passPublish.status).toBe(201);
  });
});
