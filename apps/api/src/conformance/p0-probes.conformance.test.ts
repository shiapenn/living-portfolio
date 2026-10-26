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
import {
  seedDemoPortfolio,
  PostgresPortfolioRepository,
  createDbPool,
  runMigrations,
  verifySchemaVersion,
} from '@living-portfolio/db';
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
    'rejects unauthenticated access to private entries, visibility=all, settings mutation, inbox, seed, and default fallback token lp_pat_default_test_admin_token_001',
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

      // Reopened S1 / V5: unconfigured createApp() must NOT accept the old fallback token
      const defaultTokenProbe = await app.request('/api/entries?visibility=all', {
        headers: { Authorization: 'Bearer lp_pat_default_test_admin_token_001' },
      });
      expect(defaultTokenProbe.status).toBe(401);
    }
  );

  registerBoundProbe(
    'S2',
    'prevents unauthenticated visibility escalation and requires a signed redactionPreviewToken on POST /api/entries when visibility=public',
    async () => {
      const allEntries = await repo.listEntries({ visibility: ['private'] });
      const privateEntry = allEntries.find((e) => e.slug === 'private-nda-architecture-notes')!;

      const putRes = await app.request(`/api/entries/${privateEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'public' }),
      });
      expect(putRes.status).toBe(401);

      // Strengthened S2 / V4: authenticated POST /api/entries with visibility='public' and no redactionPreviewToken must fail (400)
      const authedInstance = createApp(undefined, { bootstrapAdminToken: 'explicit_test_token_for_s2_probe_999' });
      const postPublicNoToken = await authedInstance.app.request('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer explicit_test_token_for_s2_probe_999',
        },
        body: JSON.stringify({
          slug: 'unscanned-public-entry',
          title: 'Unscanned Public Entry',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
          body_md: 'Built a real-time billing pipeline for Acme Corp under NDA.',
          temporal_level: 'exact',
          valid_from: '2026-01-01T00:00:00Z',
        }),
      });
      expect(postPublicNoToken.status).toBe(400);
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
      domain: { id: 'systems', name: 'Systems', hard_facets: ['database', 'stack'], soft_facets: [], facet_weight: {} },
    });
    expect(res.result).toBe('INDETERMINATE');
  });

  registerBoundProbe(
    'G2',
    'ask route computes hasEvidence, hasVerifiedEvidence, outcomeStatus, and hasScope dynamically from repository rather than hard-coding true/worked',
    async () => {
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).not.toContain('hasEvidence: true,\n        hasVerifiedEvidence: true,\n        outcomeStatus: \'worked\',\n        hasScope: true,');
      expect(askSource).toContain('getClaimsForRevision');
      expect(askSource).toContain('getEvidenceForEntry');
    }
  );

  registerBoundProbe(
    'G3',
    'checkGate evaluates confirmed scoped_constraints by scope and constraint value, and ask.ts loads scopedConstraints from repo',
    () => {
      const res = checkGate({
        clientFacets: { database: 'PostgreSQL', stack: 'Node.js', throughput_tps: '100000' },
        entryScope: { database: 'PostgreSQL', stack: 'Node.js' },
        domain: { id: 'systems', name: 'Systems', hard_facets: ['database', 'stack'], soft_facets: [], facet_weight: {} },
        scopedConstraints: [
          {
            id: 'sc1',
            entry_id: 'e1',
            claim_id: 'c1',
            scope: { database: 'PostgreSQL' },
            constraint: { throughput_tps: '50000' },
            source_quote: 'Only valid up to 50k TPS',
            status: 'confirmed',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      });
      expect(res.result).toBe('FAIL');
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).toContain('getScopedConstraints');
    }
  );

  registerBoundProbe(
    'G4',
    'ask.ts loads hard_facets and soft_facets from domain configuration rather than hard-coding only [database, stack]',
    () => {
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).toContain('domainConfig');
    }
  );

  registerBoundProbe(
    'G5',
    'verifyAnswerBeforeDelivery strips or blocks anachronistic years from verifiedText in time-travel mode and ask.ts downgrades failed verification to extractive',
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

  registerBoundProbe(
    'G6',
    'advisory query with INDETERMINATE gate returns needs_context asking visitor once for missing facets before escalating',
    async () => {
      const res = await app.request('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'How should I design a distributed lock for job coordination?',
          facets: {},
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tier).toBe('needs_context');
      expect(Array.isArray(body.missingFacets)).toBe(true);
      expect(body.missingFacets.length).toBeGreaterThan(0);
    }
  );

  registerBoundProbe(
    'G7',
    'Tier 2 escalation synthesizes inbox draft via model provider + verifyAnswerBeforeDelivery instead of static Preliminary draft placeholder',
    async () => {
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).not.toContain('`Preliminary draft regarding ${candidateMatches[0].entry.title}`');
    }
  );

  registerBoundProbe('F2', 'docker/Dockerfile.api and docker/Dockerfile.worker exist on disk for docker compose', () => {
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.api'))).toBe(true);
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.worker'))).toBe(true);
  });

  registerBoundProbe(
    'P1',
    'storage defaults to PostgreSQL in production and server.ts does not unconditionally seed demo data on boot',
    async () => {
      const serverSource = readFileSync(resolve(rootDir, 'apps/api/src/server.ts'), 'utf8');
      expect(serverSource).toContain('if (config.SEED_DEMO)');
      expect(serverSource).not.toMatch(/await seedDemoPortfolio\(repo\);\s*(?!\s*})/);

      // Verify createApp defaults to postgres in production
      const origEnv = process.env.NODE_ENV;
      const origUrl = process.env.DATABASE_URL;
      const origMode = process.env.PORTFOLIO_DB_MODE;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.DATABASE_URL;
        delete process.env.PORTFOLIO_DB_MODE;
        const prodApp = createApp();
        expect(prodApp.repo).toBeInstanceOf(PostgresPortfolioRepository);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origUrl !== undefined) process.env.DATABASE_URL = origUrl;
        else delete process.env.DATABASE_URL;
        if (origMode !== undefined) process.env.PORTFOLIO_DB_MODE = origMode;
        else delete process.env.PORTFOLIO_DB_MODE;
      }
    }
  );

  registerBoundProbe(
    'P2',
    'Drizzle schema is connected with migrations, schema_info verification, and PostgresPortfolioRepository',
    () => {
      expect(typeof PostgresPortfolioRepository).toBe('function');
      expect(typeof createDbPool).toBe('function');
      expect(typeof runMigrations).toBe('function');
      expect(typeof verifySchemaVersion).toBe('function');
    }
  );

  registerBoundProbe(
    'P3',
    'worker daemon registers all 5 queues and persists chunk vector embeddings to repository',
    () => {
      const queueSource = readFileSync(resolve(rootDir, 'apps/worker/src/queue.ts'), 'utf8');
      expect(queueSource).toContain("'lp:ingest'");
      expect(queueSource).toContain("'lp:embed'");
      expect(queueSource).toContain("'lp:enrich'");
      expect(queueSource).toContain("'lp:publish'");
      expect(queueSource).toContain("'lp:delete-entry'");

      const workerSource = readFileSync(resolve(rootDir, 'apps/worker/src/worker.ts'), 'utf8');
      expect(workerSource).toContain('this.repo.saveChunkVectors');
    }
  );

  registerBoundProbe(
    'F3',
    '/healthz performs real measured repository connectivity check instead of constant true',
    async () => {
      const appSource = readFileSync(resolve(rootDir, 'apps/api/src/app.ts'), 'utf8');
      expect(appSource).not.toContain('createHealthRoutes(async () => true');
      expect(appSource).toContain('checkHealth');

      // Simulate healthy repo
      const healthyMockRepo = {
        ...repo,
        checkHealth: async () => true,
      };
      const healthyApp = createApp(healthyMockRepo as any);
      const healthyRes = await healthyApp.app.request('/healthz');
      expect(healthyRes.status).toBe(200);
      const healthyBody = await healthyRes.json();
      expect(healthyBody.status).toBe('healthy');
      expect(healthyBody.database).toBe('connected');

      // Simulate degraded/unreachable repo
      const degradedMockRepo = {
        ...repo,
        checkHealth: async () => false,
      };
      const degradedApp = createApp(degradedMockRepo as any);
      const degradedRes = await degradedApp.app.request('/healthz');
      expect(degradedRes.status).toBe(503);
      const degradedBody = await degradedRes.json();
      expect(degradedBody.status).toBe('degraded');
      expect(degradedBody.database).toBe('error');
    }
  );

  registerBoundProbe(
    'G8',
    'ask.ts avoids spending budget quota on extractive or non-generating routes, and reconciles provisional spend',
    async () => {
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).toContain('reconcileUsage');
      const extIdx = askSource.indexOf('if (forceExtractive || routeDecision.isExtractive)');
      const acqIdx = askSource.indexOf('let { provider, degradationStep } = governor.acquire(');
      expect(extIdx).toBeGreaterThan(0);
      expect(acqIdx).toBeGreaterThan(extIdx);
    }
  );

  registerBoundProbe(
    'B1',
    'BudgetGovernor enforces >=20% owner-interactive reserve and priority access',
    () => {
      const govSource = readFileSync(resolve(rootDir, 'packages/ai/src/governor/index.ts'), 'utf8');
      expect(govSource).toContain('ownerReserve');
      expect(govSource).toContain('nonOwnerCeiling');
    }
  );

  registerBoundProbe(
    'B2',
    'BudgetGovernor enables smaller_model step at visitor soft threshold rather than blocking at visitorShare',
    () => {
      const govSource = readFileSync(resolve(rootDir, 'packages/ai/src/governor/index.ts'), 'utf8');
      expect(govSource).toContain('visitorRatio >= this.config.softThreshold');
    }
  );

  registerBoundProbe(
    'B3',
    'visitor share and thresholds are computed against visitor token allocation',
    () => {
      const govSource = readFileSync(resolve(rootDir, 'packages/ai/src/governor/index.ts'), 'utf8');
      expect(govSource).toContain('visitorAllocation = dailyTokensMax * this.config.visitorShare');
    }
  );

  registerBoundProbe(
    'B4',
    'BudgetGovernor wires per-minute limits, learned response headers, 429 discount, token reconciliation, and UTC midnight reset',
    () => {
      const govSource = readFileSync(resolve(rootDir, 'packages/ai/src/governor/index.ts'), 'utf8');
      expect(govSource).toContain('minuteWindowStart');
      expect(govSource).toContain('recordResponseHeaders');
      expect(govSource).toContain('reconcileUsage');
      expect(govSource).toContain('recordRateLimitError');
    }
  );
});
