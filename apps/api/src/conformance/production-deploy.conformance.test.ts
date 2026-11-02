/**
 * Production Deployment & Automated Rollback Conformance Test (OSR-22, Gate G4, Spec §13.1, §19)
 *
 * Verifies that:
 * 1. Declarative production blueprint (deploy/render/render.production.yaml) defines all 4 services
 *    with PostgreSQL 16 (portfolio_production), DEPLOYMENT_CLASS=production, and /healthz probes.
 * 2. Production deploy workflow (.github/workflows/deploy-production.yml) targets production environment
 *    with required reviewer protection, immutable digest validation, SHA action pinning, and auto-rollback.
 * 3. scripts/deploy-with-rollback strictly enforces immutable SHA-256 digests, polls the health gate,
 *    and automatically initiates rollback to previous known-healthy digests on failure.
 * 4. Staging deployment workflow (.github/workflows/deploy-staging.yml) contains the rollback drill proof.
 * 5. deploy/render/README.md documents the complete production deploy, review, and rollback runbooks.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseYaml } from '@living-portfolio/core';
import {
  validateDigest,
  triggerDeployHook,
  pollHealthGate,
  executeDeployWithRollback,
} from '../../../../scripts/deploy-with-rollback';

describe('Production Deploy Workflow, Health Gate & Auto-Rollback Conformance (OSR-22, Gate G4)', () => {
  const root = resolve(__dirname, '../../../../');
  const prodRenderYamlPath = resolve(root, 'deploy/render/render.production.yaml');
  const prodWorkflowPath = resolve(root, '.github/workflows/deploy-production.yml');
  const stagingWorkflowPath = resolve(root, '.github/workflows/deploy-staging.yml');
  const renderReadmePath = resolve(root, 'deploy/render/README.md');

  const validDigest1 = 'ghcr.io/shiapenn/living-portfolio/api@sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const validDigest2 = 'ghcr.io/shiapenn/living-portfolio/web@sha256:cb8927cf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015bc';
  const validDigest3 = 'ghcr.io/shiapenn/living-portfolio/worker@sha256:dc9038df8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015cd';

  const prevDigest1 = 'ghcr.io/shiapenn/living-portfolio/api@sha256:0000000000000000000000000000000000000000000000000000000000000001';
  const prevDigest2 = 'ghcr.io/shiapenn/living-portfolio/web@sha256:0000000000000000000000000000000000000000000000000000000000000002';
  const prevDigest3 = 'ghcr.io/shiapenn/living-portfolio/worker@sha256:0000000000000000000000000000000000000000000000000000000000000003';

  describe('1. Declarative Production Blueprint (deploy/render/render.production.yaml)', () => {
    it('exists and parses as valid YAML', () => {
      expect(existsSync(prodRenderYamlPath)).toBe(true);
      const content = readFileSync(prodRenderYamlPath, 'utf8');
      const doc = parseYaml(content);
      expect(doc).toBeDefined();
      expect(Array.isArray(doc.services)).toBe(true);
      expect(Array.isArray(doc.databases)).toBe(true);
    });

    it('declares living-portfolio-web-prod with production safeguards and health check', () => {
      const content = readFileSync(prodRenderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const web = doc.services.find((s: any) => s.name === 'living-portfolio-web-prod');
      expect(web).toBeDefined();
      expect(web.type).toBe('web');
      expect(web.healthCheckPath).toBe('/healthz');

      const envMap = Object.fromEntries(web.envVars.map((e: any) => [e.key, e.value || e.fromService]));
      expect(envMap.DEPLOYMENT_CLASS).toBe('production');
      expect(envMap.NODE_ENV).toBe('production');
      expect(envMap.PORT).toBe(3001);
    });

    it('declares living-portfolio-api-prod with production database and secrets', () => {
      const content = readFileSync(prodRenderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const api = doc.services.find((s: any) => s.name === 'living-portfolio-api-prod');
      expect(api).toBeDefined();
      expect(api.type).toBe('web');
      expect(api.healthCheckPath).toBe('/healthz');

      const envKeys = api.envVars.map((e: any) => e.key);
      expect(envKeys).toContain('DATABASE_URL');
      expect(envKeys).toContain('DEPLOYMENT_CLASS');
      expect(envKeys).toContain('JWT_SECRET');
      expect(envKeys).toContain('SESSION_SECRET');
      expect(envKeys).toContain('REPOSITORY_STORAGE_DRIVER');

      const envMap = Object.fromEntries(api.envVars.map((e: any) => [e.key, e.value]));
      expect(envMap.DEPLOYMENT_CLASS).toBe('production');
      expect(envMap.REPOSITORY_STORAGE_DRIVER).toBe('postgres');
    });

    it('declares living-portfolio-worker-prod background daemon', () => {
      const content = readFileSync(prodRenderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const worker = doc.services.find((s: any) => s.name === 'living-portfolio-worker-prod');
      expect(worker).toBeDefined();
      expect(worker.type).toBe('worker');

      const envMap = Object.fromEntries(worker.envVars.map((e: any) => [e.key, e.value]));
      expect(envMap.DEPLOYMENT_CLASS).toBe('production');
    });

    it('declares managed PostgreSQL 16 database for production', () => {
      const content = readFileSync(prodRenderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const db = doc.databases.find((d: any) => d.name === 'living-portfolio-db-prod');
      expect(db).toBeDefined();
      expect(db.databaseName).toBe('portfolio_production');
      expect(db.postgresMajorVersion).toBe(16);
    });
  });

  describe('2. Production Deployment Workflow (.github/workflows/deploy-production.yml)', () => {
    it('exists and parses as valid YAML', () => {
      expect(existsSync(prodWorkflowPath)).toBe(true);
      const content = readFileSync(prodWorkflowPath, 'utf8');
      const doc = parseYaml(content);
      expect(doc).toBeDefined();
    });

    it('targets production environment enforcing required reviewer protection', () => {
      const content = readFileSync(prodWorkflowPath, 'utf8');
      const doc = parseYaml(content) as any;

      const job = doc.jobs['deploy-production'];
      expect(job).toBeDefined();
      expect(job.environment).toBe('production');
      expect(doc.concurrency.group).toBe('deploy-production');
      expect(doc.concurrency['cancel-in-progress']).toBe(false);
    });

    it('is triggered on release publication and manual workflow dispatch', () => {
      const content = readFileSync(prodWorkflowPath, 'utf8');
      const doc = parseYaml(content) as any;

      expect(doc.on.release.types).toContain('published');
      expect(doc.on.workflow_dispatch).toBeDefined();
      expect(doc.on.workflow_dispatch.inputs.api_digest).toBeDefined();
      expect(doc.on.workflow_dispatch.inputs.simulate_failure).toBeDefined();
    });

    it('pins all actions to full 40-character commit SHAs', () => {
      const content = readFileSync(prodWorkflowPath, 'utf8');
      const actionMatches = [...content.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)];
      expect(actionMatches.length).toBeGreaterThan(0);

      for (const match of actionMatches) {
        const [, , sha] = match;
        expect(sha).toMatch(/^[0-9a-f]{40}$/);
      }
    });

    it('invokes scripts/deploy-with-rollback with scoped production secrets', () => {
      const content = readFileSync(prodWorkflowPath, 'utf8');
      expect(content).toContain('node scripts/deploy-with-rollback');
      expect(content).toContain('RENDER_PRODUCTION_API_DEPLOY_HOOK');
      expect(content).toContain('RENDER_PRODUCTION_WEB_DEPLOY_HOOK');
      expect(content).toContain('RENDER_PRODUCTION_WORKER_DEPLOY_HOOK');
      expect(content).toContain('PRODUCTION_API_URL');
      expect(content).toContain('PRODUCTION_WEB_URL');
    });
  });

  describe('3. Automated Deploy & Rollback Engine (scripts/deploy-with-rollback)', () => {
    describe('validateDigest', () => {
      it('accepts valid SHA-256 immutable image digests', () => {
        expect(validateDigest(validDigest1)).toBe(true);
        expect(validateDigest(validDigest2)).toBe(true);
        expect(validateDigest('api@sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')).toBe(true);
        expect(validateDigest('sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')).toBe(true);
      });

      it('rejects mutable tags and invalid digests (Spec §13.1, OSR-18, OSR-22)', () => {
        expect(validateDigest('ghcr.io/shiapenn/living-portfolio/api:latest')).toBe(false);
        expect(validateDigest('ghcr.io/shiapenn/living-portfolio/api:staging-latest')).toBe(false);
        expect(validateDigest('ghcr.io/shiapenn/living-portfolio/api:v0.1.0')).toBe(false);
        expect(validateDigest('ghcr.io/shiapenn/living-portfolio/api:sha-1234567')).toBe(false);
        expect(validateDigest('ghcr.io/shiapenn/living-portfolio/api@sha256:short')).toBe(false);
        expect(validateDigest('')).toBe(false);
      });
    });

    describe('triggerDeployHook', () => {
      it('handles dry-run when hookUrl is undefined', async () => {
        const res = await triggerDeployHook(undefined, validDigest1);
        expect(res.success).toBe(true);
        expect(res.status).toBe(200);
        expect(res.message).toContain('Dry-run verified');
      });

      it('calls deploy hook with imgURL parameter', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => 'Deploy accepted: job-123',
        });

        const hook = 'https://api.render.com/deploy/srv-12345';
        const res = await triggerDeployHook(hook, validDigest1, mockFetch as any);

        expect(res.success).toBe(true);
        expect(res.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`imgURL=${encodeURIComponent(validDigest1)}`),
          expect.objectContaining({ method: 'POST' })
        );
      });

      it('handles hook dispatch network errors gracefully', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));
        const hook = 'https://api.render.com/deploy/srv-12345';
        const res = await triggerDeployHook(hook, validDigest1, mockFetch as any);

        expect(res.success).toBe(false);
        expect(res.status).toBe(500);
        expect(res.message).toContain('Failed to trigger deploy hook');
      });
    });

    describe('pollHealthGate', () => {
      it('passes when both API and Web endpoints return healthy status', async () => {
        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes('/api/v1/health')) {
            return {
              status: 200,
              json: async () => ({ status: 'healthy', database: { status: 'connected' } }),
            };
          }
          if (url.includes(':3000/healthz')) {
            return {
              status: 200,
              json: async () => ({ status: 'healthy' }),
            };
          }
          if (url.includes(':3001/healthz')) {
            return {
              status: 200,
              json: async () => ({ status: 'ok', service: 'web' }),
            };
          }
          return { status: 404, json: async () => ({}) };
        });

        const result = await pollHealthGate({
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          maxAttempts: 3,
          intervalMs: 10,
          fetchFn: mockFetch as any,
        });

        expect(result.healthy).toBe(true);
        expect(result.attempts).toBe(1);
        expect(result.statusText).toContain('All services healthy');
      });

      it('fails when API healthz returns 500 error', async () => {
        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes(':3000/healthz')) {
            return {
              status: 500,
              json: async () => ({ status: 'down', error: 'Database unreachable' }),
            };
          }
          return {
            status: 200,
            json: async () => ({ status: 'ok', service: 'web' }),
          };
        });

        const result = await pollHealthGate({
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          maxAttempts: 2,
          intervalMs: 5,
          fetchFn: mockFetch as any,
        });

        expect(result.healthy).toBe(false);
        expect(result.attempts).toBe(2);
        expect(result.statusText).toContain('Health gate probe failed');
      });

      it('fails when Web healthz returns non-200', async () => {
        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes(':3000/healthz')) {
            return { status: 200, json: async () => ({ status: 'healthy' }) };
          }
          return { status: 503, json: async () => ({ status: 'unavailable' }) };
        });

        const result = await pollHealthGate({
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          maxAttempts: 2,
          intervalMs: 5,
          fetchFn: mockFetch as any,
        });

        expect(result.healthy).toBe(false);
      });
    });

    describe('executeDeployWithRollback', () => {
      const services = [
        { name: 'api', hookUrl: 'https://api.render.com/hook/api', targetImage: validDigest1, rollbackImage: prevDigest1 },
        { name: 'web', hookUrl: 'https://api.render.com/hook/web', targetImage: validDigest2, rollbackImage: prevDigest2 },
        { name: 'worker', hookUrl: 'https://api.render.com/hook/worker', targetImage: validDigest3, rollbackImage: prevDigest3 },
      ];

      it('happy path: deploys target digests, passes health gate, and returns success exit code 0', async () => {
        const deployedImages: string[] = [];
        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes('api.render.com')) {
            const parsed = new URL(url);
            deployedImages.push(parsed.searchParams.get('imgURL') || '');
            return { ok: true, status: 200, text: async () => 'Deploy queued' };
          }
          if (url.includes(':3000/healthz')) {
            return { status: 200, json: async () => ({ status: 'healthy' }) };
          }
          if (url.includes(':3000/api/v1/health')) {
            return { status: 200, json: async () => ({ status: 'healthy' }) };
          }
          if (url.includes(':3001/healthz')) {
            return { status: 200, json: async () => ({ status: 'ok' }) };
          }
          return { status: 200, json: async () => ({}) };
        });

        const result = await executeDeployWithRollback({
          services,
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          timeoutSeconds: 10,
          intervalSeconds: 1,
          fetchFn: mockFetch as any,
        });

        expect(result.success).toBe(true);
        expect(result.rolledBack).toBe(false);
        expect(result.exitCode).toBe(0);
        expect(deployedImages).toEqual([validDigest1, validDigest2, validDigest3]);
        expect(result.activeImages.api).toBe(validDigest1);
      });

      it('staged failure & auto-rollback: health gate failure triggers automated rollback and recovers healthy state', async () => {
        const deployedImages: string[] = [];

        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes('api.render.com')) {
            const parsed = new URL(url);
            deployedImages.push(parsed.searchParams.get('imgURL') || '');
            return { ok: true, status: 200, text: async () => 'Deploy queued' };
          }
          const isRollbackActive = deployedImages.includes(prevDigest1);
          // Health check behavior: fail on target deploy, succeed once rollback images are deployed
          if (url.includes(':3000/healthz') || url.includes(':3000/api/v1/health')) {
            if (!isRollbackActive) {
              return { status: 500, json: async () => ({ status: 'down', error: 'Broken image' }) };
            }
            return { status: 200, json: async () => ({ status: 'healthy' }) };
          }
          if (url.includes(':3001/healthz')) {
            return { status: 200, json: async () => ({ status: 'ok', service: 'web' }) };
          }
          return { status: 200, json: async () => ({}) };
        });

        const result = await executeDeployWithRollback({
          services,
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          timeoutSeconds: 2,
          intervalSeconds: 1,
          fetchFn: mockFetch as any,
        });

        expect(result.success).toBe(false);
        expect(result.rolledBack).toBe(true);
        expect(result.rollbackHealthy).toBe(true);
        expect(result.exitCode).toBe(1);

        // Verifies target images were deployed first, then rollback images were deployed
        expect(deployedImages).toEqual([
          validDigest1,
          validDigest2,
          validDigest3,
          prevDigest1,
          prevDigest2,
          prevDigest3,
        ]);
        expect(result.activeImages.api).toBe(prevDigest1);
      });

      it('staging rollback drill proof: simulateFailure=true triggers auto-rollback sequence cleanly', async () => {
        const deployedRollbacks: string[] = [];

        const mockFetch = vi.fn().mockImplementation(async (url: string) => {
          if (url.includes('api.render.com')) {
            const parsed = new URL(url);
            deployedRollbacks.push(parsed.searchParams.get('imgURL') || '');
            return { ok: true, status: 200, text: async () => 'Deploy queued' };
          }
          if (url.includes(':3001/healthz')) {
            return { status: 200, json: async () => ({ status: 'ok', service: 'web' }) };
          }
          return { status: 200, json: async () => ({ status: 'healthy', service: 'api' }) };
        });

        const result = await executeDeployWithRollback({
          services,
          apiHealthUrl: 'http://localhost:3000',
          webHealthUrl: 'http://localhost:3001',
          simulateFailure: true,
          timeoutSeconds: 2,
          intervalSeconds: 1,
          fetchFn: mockFetch as any,
        });

        expect(result.success).toBe(false);
        expect(result.rolledBack).toBe(true);
        expect(result.rollbackHealthy).toBe(true);
        expect(result.exitCode).toBe(1);
        expect(deployedRollbacks).toContain(prevDigest1);
        expect(deployedRollbacks).toContain(prevDigest2);
        expect(deployedRollbacks).toContain(prevDigest3);
      });

      it('rejects mutable image tags and throws error before triggering any deployment', async () => {
        const badServices = [
          { name: 'api', hookUrl: 'https://api.render.com/hook/api', targetImage: 'ghcr.io/shiapenn/living-portfolio/api:latest', rollbackImage: prevDigest1 },
        ];

        await expect(executeDeployWithRollback({
          services: badServices as any,
        })).rejects.toThrow(/strictly require immutable @sha256/);
      });
    });
  });

  describe('4. Staging Rollback Drill Proof Integration', () => {
    it('staging workflow (.github/workflows/deploy-staging.yml) exposes trigger_rollback_drill input and step', () => {
      const content = readFileSync(stagingWorkflowPath, 'utf8');
      const doc = parseYaml(content) as any;

      expect(doc.on.workflow_dispatch.inputs.trigger_rollback_drill).toBeDefined();
      expect(content).toContain('Staging Rollback Drill Proof (OSR-22 Gate G4)');
      expect(content).toContain('node scripts/deploy-with-rollback --simulate-failure --dry-run');
    });
  });

  describe('5. Operational Documentation & Runbooks (deploy/render/README.md)', () => {
    it('documents production architecture, required reviewers, health gate, and auto-rollback', () => {
      const content = readFileSync(renderReadmePath, 'utf8');

      expect(content).toContain('Production Blueprint & Deployment Architecture (Gate G4, OSR-22)');
      expect(content).toContain('Required Reviewer & Environment Protection');
      expect(content).toContain('Health Gate & Automated Rollback Protocol');
      expect(content).toContain('Rollback Drill Proof in Staging (Gate G4)');
      expect(content).toContain('scripts/deploy-with-rollback');
    });
  });
});
