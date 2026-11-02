/**
 * Staging Deployment & Provider Config Conformance Test (OSR-18, Gate G3, Spec §13.1)
 *
 * Verifies that:
 * 1. Declarative provider configuration (deploy/render/render.yaml) is valid and specifies
 *    all 4 decoupled components (web, api, worker, db) with PostgreSQL 16 and health checks.
 * 2. Staging deploy workflow (.github/workflows/deploy-staging.yml) deploys from main
 *    by immutable image digest using scoped deploy credentials and includes smoke verification.
 * 3. All production Dockerfiles (web, api, worker) adhere to multi-stage unprivileged standards.
 * 4. Web service implements the /healthz liveness probe.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseYaml } from '@living-portfolio/core';
import { createWebApp } from '@living-portfolio/web';

describe('Staging Deployment & Provider Configuration Conformance (OSR-18, Gate G3)', () => {
  const root = resolve(__dirname, '../../../../');
  const renderYamlPath = resolve(root, 'deploy/render/render.yaml');
  const renderReadmePath = resolve(root, 'deploy/render/README.md');
  const deployWorkflowPath = resolve(root, '.github/workflows/deploy-staging.yml');

  const dockerfileWeb = resolve(root, 'docker/Dockerfile.web');
  const dockerfileApi = resolve(root, 'docker/Dockerfile.api');
  const dockerfileWorker = resolve(root, 'docker/Dockerfile.worker');

  describe('1. Declarative Render Provider Configuration (deploy/render/render.yaml)', () => {
    it('exists and parses as valid YAML', () => {
      expect(existsSync(renderYamlPath)).toBe(true);
      expect(existsSync(renderReadmePath)).toBe(true);

      const content = readFileSync(renderYamlPath, 'utf8');
      const doc = parseYaml(content);
      expect(doc).toBeDefined();
      expect(Array.isArray(doc.services)).toBe(true);
      expect(Array.isArray(doc.databases)).toBe(true);
    });

    it('declares living-portfolio-web with health checks and environment contract', () => {
      const content = readFileSync(renderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const webService = doc.services.find((s: any) => s.name === 'living-portfolio-web');
      expect(webService).toBeDefined();
      expect(webService.type).toBe('web');
      expect(webService.healthCheckPath).toBe('/healthz');
      expect(webService.dockerfilePath).toBe('docker/Dockerfile.web');

      const envVars = Object.fromEntries(webService.envVars.map((e: any) => [e.key, e.value || e.fromService]));
      expect(envVars.NODE_ENV).toBe('production');
      expect(envVars.DEPLOYMENT_CLASS).toBe('staging');
      expect(envVars.PORT).toBe(3001);
      expect(envVars.PUBLIC_API_BASE_URL).toBeDefined();
    });

    it('declares living-portfolio-api with health checks and PostgreSQL connection', () => {
      const content = readFileSync(renderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const apiService = doc.services.find((s: any) => s.name === 'living-portfolio-api');
      expect(apiService).toBeDefined();
      expect(apiService.type).toBe('web');
      expect(apiService.healthCheckPath).toBe('/healthz');
      expect(apiService.dockerfilePath).toBe('docker/Dockerfile.api');

      const envKeys = apiService.envVars.map((e: any) => e.key);
      expect(envKeys).toContain('DATABASE_URL');
      expect(envKeys).toContain('DEPLOYMENT_CLASS');
      expect(envKeys).toContain('JWT_SECRET');
      expect(envKeys).toContain('PORT');
    });

    it('declares living-portfolio-worker background daemon', () => {
      const content = readFileSync(renderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const workerService = doc.services.find((s: any) => s.name === 'living-portfolio-worker');
      expect(workerService).toBeDefined();
      expect(workerService.type).toBe('worker');
      expect(workerService.dockerfilePath).toBe('docker/Dockerfile.worker');

      const envKeys = workerService.envVars.map((e: any) => e.key);
      expect(envKeys).toContain('DATABASE_URL');
      expect(envKeys).toContain('DEPLOYMENT_CLASS');
    });

    it('declares living-portfolio-db with PostgreSQL 16', () => {
      const content = readFileSync(renderYamlPath, 'utf8');
      const doc = parseYaml(content) as any;

      const db = doc.databases.find((d: any) => d.name === 'living-portfolio-db');
      expect(db).toBeDefined();
      expect(db.postgresMajorVersion).toBe(16);
      expect(db.databaseName).toBe('portfolio_staging');
    });
  });

  describe('2. Continuous Staging Deploy Workflow (.github/workflows/deploy-staging.yml)', () => {
    it('exists and parses as valid YAML', () => {
      expect(existsSync(deployWorkflowPath)).toBe(true);
      const content = readFileSync(deployWorkflowPath, 'utf8');
      const doc = parseYaml(content);
      expect(doc).toBeDefined();
    });

    it('is triggered by pushes to main and manual dispatch', () => {
      const content = readFileSync(deployWorkflowPath, 'utf8');
      const doc = parseYaml(content) as any;

      expect(doc.on.push.branches).toContain('main');
      expect(doc.on.workflow_dispatch).toBeDefined();
    });

    it('targets staging environment with non-concurrent deployments', () => {
      const content = readFileSync(deployWorkflowPath, 'utf8');
      const doc = parseYaml(content) as any;

      const job = doc.jobs['deploy-staging'];
      expect(job.environment).toBe('staging');
      expect(doc.concurrency.group).toBe('deploy-staging');
      expect(doc.concurrency['cancel-in-progress']).toBe(false);
    });

    it('pins all actions to full 40-character commit SHAs', () => {
      const content = readFileSync(deployWorkflowPath, 'utf8');
      const actionMatches = [...content.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)];
      expect(actionMatches.length).toBeGreaterThan(0);

      for (const match of actionMatches) {
        const [, action, sha] = match;
        expect(sha).toMatch(/^[0-9a-f]{40}$/);
      }
    });

    it('deploys by immutable image digest using scoped deploy credentials', () => {
      const content = readFileSync(deployWorkflowPath, 'utf8');

      // Verifies deploy by digest notation
      expect(content).toContain('@${API_DIGEST}');
      expect(content).toContain('@${WEB_DIGEST}');
      expect(content).toContain('@${WORKER_DIGEST}');

      // Verifies scoped deploy credentials
      expect(content).toContain('RENDER_STAGING_API_DEPLOY_HOOK');
      expect(content).toContain('RENDER_STAGING_WEB_DEPLOY_HOOK');
      expect(content).toContain('RENDER_STAGING_WORKER_DEPLOY_HOOK');

      // Verifies smoke test / health check step
      expect(content).toContain('/healthz');
    });
  });

  describe('3. Production Container Standards', () => {
    const dockerfiles = [
      { name: 'web', path: dockerfileWeb, hasHealthcheck: true },
      { name: 'api', path: dockerfileApi, hasHealthcheck: true },
      { name: 'worker', path: dockerfileWorker, hasHealthcheck: false },
    ];

    for (const df of dockerfiles) {
      it(`Dockerfile.${df.name} specifies non-root user and multi-stage build`, () => {
        expect(existsSync(df.path)).toBe(true);
        const content = readFileSync(df.path, 'utf8');

        // Non-root node user (§13.10)
        expect(content).toMatch(/USER node/);

        // Multi-stage builder
        expect(content).toMatch(/FROM .* AS builder/);
        expect(content).toMatch(/FROM .* AS runner/);

        if (df.hasHealthcheck) {
          expect(content).toMatch(/HEALTHCHECK/);
          expect(content).toMatch(/\/healthz/);
        }
      });
    }
  });

  describe('4. Web App Health Check Endpoint', () => {
    it('GET /healthz returns 200 OK with service identifier', async () => {
      const { app } = createWebApp();
      const res = await app.request('/healthz');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({
        status: 'ok',
        service: 'web',
      });
    });
  });
});
