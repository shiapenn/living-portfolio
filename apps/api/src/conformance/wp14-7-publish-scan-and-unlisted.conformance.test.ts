import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { MockModelProvider } from '@living-portfolio/ai';
import { mountBundledWeb } from '../adapter/bundled-web.js';

describe('WP-14.7 Conformance: Server-side Publish Scan Enforcement & Unlisted Visibility (UX-57, UX-59)', () => {
  const adminToken = 'wp14_7_conformance_admin_token';
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  it('refuses publishing without a passing private-detail scan across every path (POST, PUT, Undo, and public revision updates) and does not mint tokens on draft saves (UX-57)', async () => {
    const repo = new InMemoryPortfolioRepository();
    const { app } = createApp(repo, {
      bootstrapAdminToken: adminToken,
      providers: [new MockModelProvider()],
    });

    // 1. Saving a private draft MUST NOT mint a redactionPreviewToken
    const draftRes = await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'wp14-7-draft-no-token',
        title: 'WP-14.7 Draft Without Scan',
        profile: 'case-study',
        view: 'article',
        visibility: 'private',
        body_md: 'Clean technical body that has not yet been scanned through /api/entries/redaction-preview.',
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(draftRes.status).toBe(201);
    const draftData = await draftRes.json();
    expect(draftData.redactionPreviewToken).toBeUndefined();
    const draftId = draftData.entry.id;

    // 2. Direct PUT /api/entries/:id to public without a token is refused (400)
    const putNoToken = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ visibility: 'public' }),
    });
    expect(putNoToken.status).toBe(400);

    // 3. Direct POST /api/entries with visibility='public' and no token is refused (400)
    const postPublicNoToken = await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'wp14-7-direct-public-no-token',
        title: 'WP-14.7 Direct Public No Token',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: 'Attempting to publish directly without scanning.',
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(postPublicNoToken.status).toBe(400);

    // 4. Scan clean draft and publish to public -> succeeds (200)
    const scanCleanRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        entryId: draftId,
        text: 'Clean technical body that has not yet been scanned through /api/entries/redaction-preview.',
      }),
    });
    expect(scanCleanRes.status).toBe(200);
    const scanCleanData = await scanCleanRes.json();
    expect(scanCleanData.clean).toBe(true);

    const publishRes = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        visibility: 'public',
        redactionPreviewToken: scanCleanData.redactionPreviewToken,
      }),
    });
    expect(publishRes.status).toBe(200);

    // 5. Unpublish back to private, edit body to introduce a secret, and attempt Undo / PUT to public without passing scan + NDA -> refused (400)
    const unpubRes = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ visibility: 'private' }),
    });
    expect(unpubRes.status).toBe(200);

    const secretKey = ['sk', 'proj', 'wp147secretkey1234567890'].join('-');
    const secretBody = `Updated draft body containing secret ${secretKey} under strict NDA.`;
    const revSecretRes = await app.request(`/api/entries/${draftId}/revisions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        body_md: secretBody,
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(revSecretRes.status).toBe(201);

    // Attempt Undo / PUT to public using old clean token -> refused (400 bodyHash mismatch)
    const undoStaleTokenRes = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        visibility: 'public',
        redactionPreviewToken: scanCleanData.redactionPreviewToken,
      }),
    });
    expect(undoStaleTokenRes.status).toBe(400);

    // Even if scanned, attempting PUT to public without nda_confirmed: true when warnings > 0 -> refused (400)
    const scanSecretRes = await app.request('/api/entries/redaction-preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        entryId: draftId,
        text: secretBody,
      }),
    });
    const scanSecretData = await scanSecretRes.json();
    expect(scanSecretData.warnings.length).toBeGreaterThan(0);

    const undoWithoutNdaRes = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        visibility: 'public',
        redactionPreviewToken: scanSecretData.redactionPreviewToken,
        nda_confirmed: false,
      }),
    });
    expect(undoWithoutNdaRes.status).toBe(400);

    // 6. On an already-public entry, posting a new revision containing private details without a valid scan + nda_confirmed is refused (400)
    const cleanBody2 = 'Restored clean public body without any secrets.';
    const revCleanRes = await app.request(`/api/entries/${draftId}/revisions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        body_md: cleanBody2,
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(revCleanRes.status).toBe(201);

    const scanClean2 = await (
      await app.request('/api/entries/redaction-preview', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ entryId: draftId, text: cleanBody2 }),
      })
    ).json();
    const rePubRes = await app.request(`/api/entries/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        visibility: 'public',
        redactionPreviewToken: scanClean2.redactionPreviewToken,
      }),
    });
    expect(rePubRes.status).toBe(200);

    // Now entry is public; attempting to post a revision with a secret without scan/NDA confirmation must be refused (400)
    const unverifiedPublicRevRes = await app.request(`/api/entries/${draftId}/revisions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        body_md: `Injecting secret ${secretKey} directly into a live public entry without scan.`,
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(unverifiedPublicRevRes.status).toBe(400);
  });

  it('keeps Unlisted entries out of public lists (GET /api/entries, /, /work) while serving them by direct link (/work/:slug, GET /api/entries/:slug) (UX-59)', async () => {
    const repo = new InMemoryPortfolioRepository();
    const { app } = createApp(repo, {
      bootstrapAdminToken: adminToken,
      providers: [new MockModelProvider()],
      bundledWeb: true,
      bundledWebAdapter: mountBundledWeb,
    });

    const unlistedSlug = 'wp14-7-unlisted-architecture-note';
    const unlistedTitle = 'WP-14.7 Unlisted Architecture Note';
    const unlistedBody = 'This unlisted entry must only be reachable via direct link and never listed on public index pages.';

    const createRes = await app.request('/api/entries', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: unlistedSlug,
        title: unlistedTitle,
        profile: 'case-study',
        view: 'article',
        visibility: 'unlisted',
        body_md: unlistedBody,
        temporal_level: 'exact',
        valid_from: '2026-11-13T00:00:00Z',
      }),
    });
    expect(createRes.status).toBe(201);

    // 1. Public API list (GET /api/entries) must exclude unlisted entry
    const listRes = await app.request('/api/entries');
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.entries.some((e: any) => e.slug === unlistedSlug)).toBe(false);

    // 2. Public HTML index pages (GET / and GET /work) must exclude unlisted entry
    const homeRes = await app.request('/', { headers: { Accept: 'text/html' } });
    expect(homeRes.status).toBe(200);
    const homeHtml = await homeRes.text();
    expect(homeHtml).not.toContain(unlistedTitle);
    expect(homeHtml).not.toContain(`/work/${unlistedSlug}`);

    const workRes = await app.request('/work', { headers: { Accept: 'text/html' } });
    expect(workRes.status).toBe(200);
    const workHtml = await workRes.text();
    expect(workHtml).not.toContain(unlistedTitle);
    expect(workHtml).not.toContain(`/work/${unlistedSlug}`);

    // 3. Direct link (GET /work/:slug and GET /api/entries/:slug) must succeed (200) and render content
    const directHtmlRes = await app.request(`/work/${unlistedSlug}`, { headers: { Accept: 'text/html' } });
    expect(directHtmlRes.status).toBe(200);
    const directHtml = await directHtmlRes.text();
    expect(directHtml).toContain(unlistedTitle);
    expect(directHtml).toContain(unlistedBody);

    const directApiRes = await app.request(`/api/entries/${unlistedSlug}`);
    expect(directApiRes.status).toBe(200);
    const directApiData = await directApiRes.json();
    expect(directApiData.entry.visibility).toBe('unlisted');
    expect(directApiData.entry.title).toBe(unlistedTitle);
  });
});
