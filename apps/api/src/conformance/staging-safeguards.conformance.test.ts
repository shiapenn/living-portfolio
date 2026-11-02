/**
 * Staging Safeguards & DEPLOYMENT_CLASS Conformance Test (OSR-19, Gate G3, Spec §6.4, §13.1, §15)
 *
 * Verifies that:
 * 1. DEPLOYMENT_CLASS=staging renders an inescapable persistent banner: "Staging: synthetic data only."
 * 2. Search engine indexing is prevented via robots.txt (Disallow: /), <meta name="robots">, and X-Robots-Tag.
 * 3. Import and connector features are disabled on staging, returning 403 STAGING_IMPORT_DISABLED.
 * 4. Synthetic data seeds are isolated, and demo seeding is forbidden in production.
 * 5. Production configuration refuses to start without Gate G4 sign-off record (docs/releases/g4-signoff.md).
 */
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { loadConfig, ConfigValidationError } from '@living-portfolio/config';
import { createApp } from '../app.js';
import { createWebApp, createTestClient } from '@living-portfolio/web';

describe('Staging Safeguards & DEPLOYMENT_CLASS Handling (OSR-19, Gate G3, Spec §6.4)', () => {
  const root = resolve(__dirname, '../../../../');

  describe('1. Persistent Staging Warning Banner (§6.4 item 1)', () => {
    it('renders sticky "Staging: synthetic data only." banner on public and admin pages when DEPLOYMENT_CLASS=staging', async () => {
      process.env.DEPLOYMENT_CLASS = 'staging';

      const { app } = createWebApp({ client: createTestClient() });

      const routesToTest = ['/home', '/work', '/writing', '/build', '/timeline', '/ask', '/admin', '/admin/setup', '/admin/login'];

      for (const route of routesToTest) {
        const res = await app.request(route);
        expect(res.status).toBe(200);
        const html = await res.text();

        expect(html).toContain('data-banner="staging-synthetic-only"');
        expect(html).toContain('<strong>Staging: synthetic data only.</strong>');
        expect(html).toContain('position:sticky');
      }

      delete process.env.DEPLOYMENT_CLASS;
    });

    it('does not render staging synthetic banner in development mode', async () => {
      process.env.DEPLOYMENT_CLASS = 'development';

      const { app } = createWebApp({ client: createTestClient() });
      const res = await app.request('/home');
      expect(res.status).toBe(200);
      const html = await res.text();

      expect(html).not.toContain('data-banner="staging-synthetic-only"');
      expect(html).not.toContain('Staging: synthetic data only.');

      delete process.env.DEPLOYMENT_CLASS;
    });
  });

  describe('2. Search Engine Crawler Indexing Prevention (§6.4 item 2)', () => {
    it('GET /robots.txt disallows all indexing and sets X-Robots-Tag when DEPLOYMENT_CLASS=staging', async () => {
      process.env.DEPLOYMENT_CLASS = 'staging';

      // 1. Web application
      const { app: webApp } = createWebApp({ client: createTestClient() });
      const webRobotsRes = await webApp.request('/robots.txt');
      expect(webRobotsRes.status).toBe(200);
      expect(webRobotsRes.headers.get('content-type')).toContain('text/plain');
      expect(webRobotsRes.headers.get('x-robots-tag')).toBe('noindex, nofollow');

      const webRobotsText = await webRobotsRes.text();
      expect(webRobotsText).toContain('User-agent: *');
      expect(webRobotsText).toContain('Disallow: /');

      // 2. Web HTML meta tag
      const homeRes = await webApp.request('/home');
      const homeHtml = await homeRes.text();
      expect(homeHtml).toContain('<meta name="robots" content="noindex, nofollow" />');
      expect(homeRes.headers.get('x-robots-tag')).toBe('noindex, nofollow');

      // 3. API application
      const { app: apiApp } = createApp();
      const apiRobotsRes = await apiApp.request('/robots.txt');
      expect(apiRobotsRes.status).toBe(200);
      expect(apiRobotsRes.headers.get('content-type')).toContain('text/plain');
      expect(apiRobotsRes.headers.get('x-robots-tag')).toBe('noindex, nofollow');

      const apiRobotsText = await apiRobotsRes.text();
      expect(apiRobotsText).toContain('User-agent: *');
      expect(apiRobotsText).toContain('Disallow: /');

      delete process.env.DEPLOYMENT_CLASS;
    });

    it('allows crawler indexing and provides sitemap in development/production mode', async () => {
      process.env.DEPLOYMENT_CLASS = 'development';

      const { app: webApp } = createWebApp({ client: createTestClient() });
      const webRobotsRes = await webApp.request('/robots.txt');
      expect(webRobotsRes.status).toBe(200);

      const webRobotsText = await webRobotsRes.text();
      expect(webRobotsText).toContain('User-agent: *');
      expect(webRobotsText).toContain('Allow: /');
      expect(webRobotsText).toContain('Sitemap:');

      const homeRes = await webApp.request('/home');
      const homeHtml = await homeRes.text();
      expect(homeHtml).not.toContain('<meta name="robots" content="noindex, nofollow" />');

      delete process.env.DEPLOYMENT_CLASS;
    });
  });

  describe('3. Disabled Import and Connector Features (§6.4 item 2)', () => {
    it('returns 403 STAGING_IMPORT_DISABLED for all import endpoints when DEPLOYMENT_CLASS=staging', async () => {
      process.env.DEPLOYMENT_CLASS = 'staging';

      const { app } = createApp();

      const importEndpoints = [
        { path: '/api/v1/import', method: 'POST' },
        { path: '/api/v1/import/plan', method: 'POST' },
        { path: '/api/v1/import/batch', method: 'POST' },
        { path: '/api/import/plan', method: 'POST' },
        { path: '/api/import/batch', method: 'POST' },
      ];

      for (const ep of importEndpoints) {
        const res = await app.request(ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: [{ text: 'sample' }], items: [] }),
        });

        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('STAGING_IMPORT_DISABLED');
        expect(data.error).toContain('disabled in staging environment');
      }

      delete process.env.DEPLOYMENT_CLASS;
    });

    it('renders disabled notice on admin import UI page when DEPLOYMENT_CLASS=staging', async () => {
      process.env.DEPLOYMENT_CLASS = 'staging';

      const { app } = createWebApp({ client: createTestClient() });
      const res = await app.request('/admin/import');
      expect(res.status).toBe(200);
      const html = await res.text();

      expect(html).toContain('data-banner="staging-import-disabled"');
      expect(html).toContain('Import Disabled on Staging');

      delete process.env.DEPLOYMENT_CLASS;
    });
  });

  describe('4. Synthetic Seed Isolation & Production Seeding Ban (§6.4 item 3, OSR-04)', () => {
    it('rejects POST /api/v1/seed in production mode with 403', async () => {
      const { app, auth } = createApp(undefined, {
        config: {
          DEPLOYMENT_CLASS: 'production',
          SITE_ORIGIN: 'http://localhost:4000',
          ADMIN_ORIGIN: 'http://localhost:4000',
        } as any,
        databaseKind: 'in-memory',
      });
      const { rawToken } = auth.issueBearerToken('admin-key');

      const res = await app.request('/api/v1/seed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawToken}`,
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('disabled in production');
    });
  });

  describe('5. Production Startup Guard (§6.4 item 5)', () => {
    it('refuses to start when DEPLOYMENT_CLASS=production without Gate G4 sign-off record', () => {
      const fakeG4Path = resolve(root, 'tmp-missing-g4-signoff.md');
      if (existsSync(fakeG4Path)) unlinkSync(fakeG4Path);

      expect(() => {
        loadConfig({
          env: {
            DEPLOYMENT_CLASS: 'production',
            DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/portfolio',
            SESSION_SECRET: 'super-secret-random-key-at-least-16-bytes',
            G4_SIGNOFF_PATH: fakeG4Path,
          },
        });
      }).toThrow(ConfigValidationError);

      try {
        loadConfig({
          env: {
            DEPLOYMENT_CLASS: 'production',
            DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/portfolio',
            SESSION_SECRET: 'super-secret-random-key-at-least-16-bytes',
            G4_SIGNOFF_PATH: fakeG4Path,
          },
        });
      } catch (err) {
        const configErr = err as ConfigValidationError;
        const issues = configErr.issues.map((i) => i.key);
        expect(issues).toContain('DEPLOYMENT_CLASS');

        const deploymentIssue = configErr.issues.find((i) => i.key === 'DEPLOYMENT_CLASS');
        expect(deploymentIssue?.message).toContain('Gate G4 sign-off record');
      }
    });

    it('allows production configuration to load when Gate G4 sign-off record exists', () => {
      const tempG4Dir = resolve(root, 'node_modules/.tmp');
      if (!existsSync(tempG4Dir)) mkdirSync(tempG4Dir, { recursive: true });
      const tempG4Path = resolve(tempG4Dir, 'mock-g4-signoff.md');
      writeFileSync(tempG4Path, '# Gate G4 Sign-off Record\nCertified for production.\n');

      try {
        const cfg = loadConfig({
          env: {
            DEPLOYMENT_CLASS: 'production',
            DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/portfolio',
            SESSION_SECRET: 'super-secret-random-key-at-least-16-bytes',
            G4_SIGNOFF_PATH: tempG4Path,
          },
        });

        expect(cfg.DEPLOYMENT_CLASS).toBe('production');
        expect(cfg.DATABASE_URL).toBe('postgresql://postgres:pass@localhost:5432/portfolio');
      } finally {
        if (existsSync(tempG4Path)) unlinkSync(tempG4Path);
      }
    });
  });
});
