/**
 * P0 Conformance Regression Test Suite (DR-AUD-001 AUD-14, AUD-15, D.1, D.2)
 *
 * Every probe in this suite is bound to its permanent finding ID in `docs/audits/register.yml`:
 * - When `status === 'fixed'` (Phase 1a: S1, S2, S3, S4, S5, S6), the probe runs as `it(...)` and MUST PASS.
 * - When `status === 'open' | 'in-progress'` (G1, G5, F2), the probe runs as `it.fails(...)` (expected failure)
 *   and FAILS THE BUILD if it is skipped or if it unexpectedly passes without `register.yml` being updated (D.1, D.2).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from '../../../../packages/core/node_modules/yaml/browser/index.js';
import { createApp } from '../app.js';
import { seedDemoPortfolio } from '@living-portfolio/db';
import { checkGate } from '@living-portfolio/core';
import { verifyAnswerBeforeDelivery } from '@living-portfolio/ai';
import { renderAskPage, renderEntryDetailPage } from '@living-portfolio/web';

const rootDir = resolve(import.meta.dirname, '../../../..');
const registerEntries = parseYaml(readFileSync(resolve(rootDir, 'docs/audits/register.yml'), 'utf8')) as Array<{
  id: string;
  status: string;
}>;
const statusByFindingId = new Map(registerEntries.map((entry) => [entry.id, entry.status]));

function registerBoundProbe(findingId: string, description: string, fn: () => Promise<void> | void) {
  const status = statusByFindingId.get(findingId);
  if (!status) {
    throw new Error(`[D.1] Finding ${findingId} not found in docs/audits/register.yml`);
  }
  if (status === 'fixed') {
    it(`[${findingId}] (status=fixed) ${description}`, fn);
  } else {
    it.fails(`[${findingId}] (expected-failure while status=${status}) ${description}`, fn);
  }
}

describe('AUD-2026-10-19 P0 Regression Probes (Bound to docs/audits/register.yml per D.1 & D.2)', () => {
  let app: ReturnType<typeof createApp>['app'];
  let repo: ReturnType<typeof createApp>['repo'];

  beforeEach(async () => {
    const instance = createApp();
    app = instance.app;
    repo = instance.repo;
    await seedDemoPortfolio(repo);
  });

  registerBoundProbe(
    'S1',
    'rejects unauthenticated access to private entries, visibility=all, settings mutation, inbox, and seed',
    async () => {
      const listAll = await app.request('/api/entries?visibility=all');
      const privateSlug = await app.request('/api/entries/private-nda-architecture-notes');
      const patchRouting = await app.request('/api/settings/routing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier1_floor: 0.1, automatedAnsweringEnabled: false }),
      });
      const inbox = await app.request('/api/inbox');
      const seed = await app.request('/api/seed', { method: 'POST' });

      expect(listAll.status).toBe(401);
      expect(privateSlug.status).toBe(401);
      expect(patchRouting.status).toBe(401);
      expect(inbox.status).toBe(401);
      expect(seed.status).toBe(401);
    }
  );

  registerBoundProbe(
    'S2',
    'prevents unauthenticated visibility escalation of private NDA entry into /api/ask citations',
    async () => {
      const allEntries = await repo.listEntries({ visibility: ['private'] });
      const privateEntry = allEntries.find((e) => e.slug === 'private-nda-architecture-notes')!;

      const putRes = await app.request(`/api/entries/${privateEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'public' }),
      });
      expect(putRes.status).toBe(401);
    }
  );

  registerBoundProbe(
    'S3',
    'Ask widget client script does not write untrusted answer or citation fields via raw innerHTML',
    async () => {
      const html = await renderAskPage();
      expect(html).not.toContain(
        "'<div class=\"reading-column\" style=\"white-space:pre-wrap;margin-bottom:16px\">' + data.answer"
      );
      expect(html).toContain('esc(data.answer)');
      expect(html).toContain('esc(c.title)');
      expect(html).toContain('esc(c.text)');
    }
  );

  registerBoundProbe(
    'S4',
    'rate-limits /api/ask even when client rotates session_id on every request',
    async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 15; i++) {
        const res = await app.request('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'What distributed lock architecture did you use?',
            session_id: `attacker-rotated-session-${i}`,
          }),
        });
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
    }
  );

  registerBoundProbe(
    'S5',
    'does not return wildcard Access-Control-Allow-Origin: * and sets Content-Security-Policy header',
    async () => {
      const res = await app.request('/healthz', {
        headers: { Origin: 'https://evil.example.com' },
      });
      expect(res.headers.get('access-control-allow-origin')).not.toBe('*');
      expect(res.headers.get('content-security-policy')).toBeTruthy();
    }
  );

  registerBoundProbe('S6', 'rejects javascript: protocol URLs in rendered evidence links', async () => {
    const { entry } = await repo.createEntry(
      {
        slug: 'xss-ev',
        title: 'Test',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        venture_id: null,
        current_revision_id: null,
      },
      {
        body_md: 'Body',
        body_hash: 'h1',
        temporal_level: 'exact',
        valid_from: '2025-01-01T00:00:00Z',
        valid_to: null,
        is_hindsight: false,
      }
    );
    await repo.saveEvidence({
      entry_id: entry.id,
      kind: 'url',
      url: 'javascript:alert(1)',
      verification: null,
      verified_at: null,
    });
    const rendered = await renderEntryDetailPage(repo, 'xss-ev');
    expect(rendered.html).not.toContain('href="javascript:alert(1)"');
  });

  registerBoundProbe('G1', 'checkGate returns INDETERMINATE when entry-side hard facet is unknown', () => {
    const res = checkGate({
      clientFacets: { database: 'PostgreSQL', stack: 'Node.js' },
      entryScope: {},
      domain: { name: 'Systems', hard_facets: ['database', 'stack'], soft_facets: [] },
    });
    expect(res.result).toBe('INDETERMINATE');
  });

  registerBoundProbe(
    'G5',
    'verifyAnswerBeforeDelivery strips or blocks anachronistic years from verifiedText in time-travel mode',
    () => {
      const res = verifyAnswerBeforeDelivery({
        draftText: 'In 2025 we migrated to Postgres 17.',
        citedSpans: [{ id: 's1', text_exact: 'In 2025 we migrated to Postgres 17.' } as any],
        visitorFacets: {},
        citedScopes: [],
        asOfDate: '2021-06-01T00:00:00Z',
      });
      expect(res.anachronismDetected).toBe(true);
      expect(res.verifiedText).not.toContain('2025');
    }
  );

  registerBoundProbe('F2', 'docker/Dockerfile.api and docker/Dockerfile.worker exist on disk for docker compose', () => {
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.api'))).toBe(true);
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.worker'))).toBe(true);
  });
});
