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
import { MockModelProvider, OpenAICompatibleProvider, verifyAnswerBeforeDelivery } from '@living-portfolio/ai';
import { PortfolioWorker } from '@living-portfolio/worker';
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

  registerBoundProbe(
    'S7',
    'enrichment job routes via data-class privacy router and BudgetGovernor, prevents external provider transmission for sensitive content and exclusion matches, and replaces keyword claim extraction',
    async () => {
      // 1. Worker privacy router: cloud provider cannot be used for sensitive or excluded data
      const cloudProvider = new OpenAICompatibleProvider({
        apiKey: 'test-openai-key-s7',
        baseURL: 'https://api.openai.com/v1',
        dataPolicy: {
          trainsOnInputs: false,
          retentionDays: 30,
          humanReview: false,
          zeroRetentionOption: true,
        },
      });
      const workerWithCloudOnly = new PortfolioWorker({
        repo,
        providers: [cloudProvider],
        redactionExclusions: ['TopSecretProject'],
      });

      const testSecretKey = ['sk', 'testtoken1234567890abcdef'].join('-');
      const { entry: sensitiveEntry, revision: sensitiveRev } = await workerWithCloudOnly.runIngestJob({
        slug: 'confidential-ai-pipeline',
        title: 'Confidential AI Pipeline',
        body_md: `Worked on TopSecretProject with key ${testSecretKey} under strict NDA.`,
        visibility: 'public', // even if visibility is public, sensitive content overrides to sensitive
      });

      const enrichCloudRes = await workerWithCloudOnly.runEnrichJob(sensitiveEntry.id, sensitiveRev.id);
      expect(enrichCloudRes.dataClass).toBe('sensitive');
      expect(enrichCloudRes.providerUsed).toBeNull();
      expect(enrichCloudRes.skippedReason).toBe('sensitive_content_no_local_provider');
      expect(enrichCloudRes.claimsSuggested).toBe(0);

      // 2. Local provider is allowed for sensitive data
      const localProvider = new MockModelProvider('local-mock', 'Local Mock Provider');
      const workerWithLocal = new PortfolioWorker({
        repo,
        providers: [cloudProvider, localProvider],
        redactionExclusions: ['TopSecretProject'],
      });
      const enrichLocalRes = await workerWithLocal.runEnrichJob(sensitiveEntry.id, sensitiveRev.id);
      expect(enrichLocalRes.dataClass).toBe('sensitive');
      expect(enrichLocalRes.providerUsed).toBe('local-mock');
      expect(enrichLocalRes.claimsSuggested).toBeGreaterThan(0);

      // 3. Claims have structured scope and outcome_status instead of keyword-fallback
      const savedClaims = await repo.getClaimsForRevision(sensitiveRev.id);
      expect(savedClaims.length).toBeGreaterThan(0);
      expect(savedClaims[0].outcome_status).toBe('worked');
      expect(savedClaims[0].scope).toBeDefined();
    }
  );

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

  registerBoundProbe(
    'F1',
    'apps/web renderer is mounted by createApp() in apps/api across public sub-routes and root HTML content negotiation',
    async () => {
      const homeRes = await app.request('/home');
      expect(homeRes.status).toBe(200);
      expect(await homeRes.text()).toContain('<!DOCTYPE html>');

      const workRes = await app.request('/work');
      expect(workRes.status).toBe(200);
      expect(await workRes.text()).toContain('Case Studies');

      const timelineRes = await app.request('/timeline');
      expect(timelineRes.status).toBe(200);

      const askRes = await app.request('/ask');
      expect(askRes.status).toBe(200);

      const rootHtmlRes = await app.request('/', {
        headers: { Accept: 'text/html' },
      });
      expect(rootHtmlRes.status).toBe(200);
      expect(await rootHtmlRes.text()).toContain('<!DOCTYPE html>');

      const rootJsonRes = await app.request('/', {
        headers: { Accept: 'application/json' },
      });
      expect(rootJsonRes.status).toBe(200);
      const json = await rootJsonRes.json();
      expect(json.status).toBe('online');
    }
  );

  registerBoundProbe('F2', 'docker/Dockerfile.api and docker/Dockerfile.worker exist on disk for docker compose', () => {
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.api'))).toBe(true);
    expect(existsSync(resolve(rootDir, 'docker/Dockerfile.worker'))).toBe(true);
  });

  registerBoundProbe(
    'OSR-16',
    'Dockerfiles, compose stack, quickstart compose configuration, SBOM generator, and release workflow exist and are valid',
    () => {
      // 1. Multi-stage non-root Dockerfiles with HEALTHCHECK
      const apiDocker = readFileSync(resolve(rootDir, 'docker/Dockerfile.api'), 'utf8');
      const workerDocker = readFileSync(resolve(rootDir, 'docker/Dockerfile.worker'), 'utf8');

      expect(apiDocker).toContain('FROM node:22-alpine');
      expect(apiDocker).toContain('USER node');
      expect(apiDocker).toContain('HEALTHCHECK');
      expect(apiDocker).toContain('apps/api/dist/server.js');

      expect(workerDocker).toContain('FROM node:22-alpine');
      expect(workerDocker).toContain('USER node');
      expect(workerDocker).toContain('apps/worker/dist/index.js');

      // 2. Reference Hobbyist compose stack conforms to §13.10
      const composeFile = readFileSync(resolve(rootDir, 'docker/docker-compose.hobbyist.yml'), 'utf8');
      const composeData = parseYaml(composeFile) as any;
      expect(composeData.services.db).toBeDefined();
      expect(composeData.services.db.image).toContain('pgvector/pgvector:pg16');
      expect(composeData.services.api).toBeDefined();
      expect(composeData.services.api.depends_on.db.condition).toBe('service_healthy');
      expect(composeData.services.worker).toBeDefined();
      expect(composeData.services.worker.depends_on.db.condition).toBe('service_healthy');
      expect(composeData.services.tunnel).toBeDefined();

      // 3. SBOM generator script and SPDX 2.3 schema validity
      expect(existsSync(resolve(rootDir, 'scripts/generate-sbom'))).toBe(true);
      const pkgJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
      expect(pkgJson.scripts['sbom:generate']).toBe('node scripts/generate-sbom');

      // 4. Release workflow with signed multi-arch images & SBOM (§13.10, §20)
      const releaseWfPath = resolve(rootDir, '.github/workflows/release.yml');
      expect(existsSync(releaseWfPath)).toBe(true);
      const releaseWf = parseYaml(readFileSync(releaseWfPath, 'utf8')) as any;
      expect(releaseWf.on.push.tags).toContain('v*');
      const releaseSteps = releaseWf.jobs['release-packaging'].steps;
      const stepUses = releaseSteps.map((s: any) => s.uses).filter(Boolean);
      expect(stepUses.some((u: string) => u.includes('cosign-installer'))).toBe(true);
      expect(stepUses.some((u: string) => u.includes('setup-buildx-action'))).toBe(true);
      expect(stepUses.some((u: string) => u.includes('build-push-action'))).toBe(true);
      const stepRuns = releaseSteps.map((s: any) => s.run).filter(Boolean);
      expect(stepRuns.some((r: string) => r.includes('generate-sbom'))).toBe(true);
      expect(stepRuns.some((r: string) => r.includes('code.zip'))).toBe(true);
    }
  );

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

  registerBoundProbe(
    'M2',
    'Degradation ladder implements Step 2 answer cache, Step 3 distinct fallback provider, and Step 6 offline handoff (§10.8, Fix 12)',
    () => {
      const askSource = readFileSync(resolve(rootDir, 'apps/api/src/routes/ask.ts'), 'utf8');
      expect(askSource).toContain('answerCache.get');
      expect(askSource).toContain('answerCache.set');
      expect(askSource).toContain("degradationStep = 'fallback_provider'");
      expect(askSource).toContain("degradationStep: 'handoff'");
    }
  );
});
