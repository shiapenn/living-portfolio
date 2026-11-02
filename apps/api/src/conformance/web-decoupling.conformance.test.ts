import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../app.js';
import { mountBundledWeb } from '../adapter/bundled-web.js';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import { createLivingPortfolioClient } from '@living-portfolio/client';
import { createWebApp } from '@living-portfolio/web';

const ROOT = resolve(import.meta.dirname, '../../../..');

describe('OSR-13: Frontend & Backend Decoupling Conformance Gate (Gate G2, Spec §4.2, §4.3)', () => {
  let repo: InMemoryPortfolioRepository;

  beforeAll(async () => {
    repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);
  });

  describe('1. Pure API Mode (Default createApp - No Web Coupling)', () => {
    it('does not mount web renderer by default; /work, /home, /timeline return 404 while API endpoints succeed', async () => {
      const { app } = createApp(repo);

      // Root endpoint returns pure API JSON status, never HTML
      const rootRes = await app.fetch(new Request('http://localhost/'));
      expect(rootRes.status).toBe(200);
      expect(rootRes.headers.get('content-type')).toContain('application/json');
      const rootJson = await rootRes.json();
      expect(rootJson.api_version).toBe('/api/v1');
      expect(rootJson.status).toBe('online');

      // Canonical API routes work
      const healthRes = await app.fetch(new Request('http://localhost/healthz'));
      expect(healthRes.status).toBe(200);

      const entriesRes = await app.fetch(new Request('http://localhost/api/v1/entries'));
      expect(entriesRes.status).toBe(200);
      const entriesJson = await entriesRes.json();
      expect(Array.isArray(entriesJson.entries)).toBe(true);

      // Web routes MUST NOT be mounted in default pure API mode
      const workRes = await app.fetch(new Request('http://localhost/work'));
      expect(workRes.status).toBe(404);

      const homeRes = await app.fetch(new Request('http://localhost/home'));
      expect(homeRes.status).toBe(404);

      const timelineRes = await app.fetch(new Request('http://localhost/timeline'));
      expect(timelineRes.status).toBe(404);

      const adminRes = await app.fetch(new Request('http://localhost/admin'));
      expect(adminRes.status).toBe(404);
    });
  });

  describe('2. Optional Bundled Web Adapter (Single-Process Convenience Mode behind Flag)', () => {
    it('mounts web and admin renderer only when bundledWeb and bundledWebAdapter are explicitly enabled', async () => {
      const { app } = createApp(repo, {
        bundledWeb: true,
        bundledWebAdapter: mountBundledWeb,
      });

      // Public web routes are mounted
      const homeRes = await app.fetch(new Request('http://localhost/home'));
      expect(homeRes.status).toBe(200);
      const homeHtml = await homeRes.text();
      expect(homeHtml).toContain('Strata timeline');

      const workRes = await app.fetch(new Request('http://localhost/work'));
      expect(workRes.status).toBe(200);

      const timelineRes = await app.fetch(new Request('http://localhost/timeline'));
      expect(timelineRes.status).toBe(200);

      const adminLoginRes = await app.fetch(new Request('http://localhost/admin/login'));
      expect(adminLoginRes.status).toBe(200);
      expect(await adminLoginRes.text()).toContain('Owner Sign in');
    });
  });

  describe('3. Standalone apps/web Running Against Remote API over HTTP', () => {
    it('renders complete Strata site and feed via @living-portfolio/client HTTP calls to decoupled API', async () => {
      // 1. Create pure API application (no web renderer)
      const { app: apiApp } = createApp(repo);

      // 2. Create typed client calling pure API via fetch
      const client = createLivingPortfolioClient({
        baseUrl: 'http://localhost:3000/api/v1',
        fetch: apiApp.fetch.bind(apiApp) as any,
      });

      // 3. Create standalone web application powered by the client
      const { app: webApp } = createWebApp({ client });

      // Home route
      const homeRes = await webApp.fetch(new Request('http://localhost/'));
      expect(homeRes.status).toBe(200);
      const homeHtml = await homeRes.text();
      expect(homeHtml).toContain('Strata timeline');
      expect(homeHtml).toContain('Advisory Locks, Revisited');

      // Entry detail route
      const entryRes = await webApp.fetch(new Request('http://localhost/work/advisory-locks-revisited'));
      expect(entryRes.status).toBe(200);
      const entryHtml = await entryRes.text();
      expect(entryHtml).toContain('Advisory Locks, Revisited: Dropping Redis for Postgres 15');

      // Timeline route
      const timelineRes = await webApp.fetch(new Request('http://localhost/timeline'));
      expect(timelineRes.status).toBe(200);

      // RSS feed
      const rssRes = await webApp.fetch(new Request('http://localhost/rss.xml'));
      expect(rssRes.status).toBe(200);
      expect(rssRes.headers.get('content-type')).toContain('application/rss+xml');

      // Sitemap
      const sitemapRes = await webApp.fetch(new Request('http://localhost/sitemap.xml'));
      expect(sitemapRes.status).toBe(200);
      expect(sitemapRes.headers.get('content-type')).toContain('application/xml');
    });
  });

  describe('4. Dependency-Rule Check (Spec §4.2, §4.3)', () => {
    it('verifies CI dependency-rule checker passes with zero database imports in apps/web', () => {
      const output = execSync('node scripts/verify-dependency-rules', {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(output).toContain('zero database dependencies');
      expect(output).toContain('0 database imports found');
      expect(output).toContain('0 static imports of @living-portfolio/web');
      expect(output).toContain('All frontend & backend decoupling dependency rules PASSED');
    });

    it('verifies apps/web/package.json has zero database dependencies', () => {
      const webPkg = JSON.parse(readFileSync(resolve(ROOT, 'apps/web/package.json'), 'utf8'));
      const deps = { ...(webPkg.dependencies || {}), ...(webPkg.devDependencies || {}) };
      expect(deps['@living-portfolio/db']).toBeUndefined();
      expect(deps['pg']).toBeUndefined();
      expect(deps['pgvector']).toBeUndefined();
      expect(deps['pg-boss']).toBeUndefined();
      expect(deps['@living-portfolio/client']).toBeDefined();
    });

    it('verifies apps/api/src/app.ts has zero static imports of @living-portfolio/web', () => {
      const appContent = readFileSync(resolve(ROOT, 'apps/api/src/app.ts'), 'utf8');
      const lines = appContent.split('\n');
      const webImports = lines.filter((l) => /^\s*import\b.*from\s*['"]@living-portfolio\/web['"]/.test(l));
      expect(webImports).toHaveLength(0);
    });
  });
});
