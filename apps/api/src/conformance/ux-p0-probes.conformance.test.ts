/**
 * AUD-2026-10-20 UX Specification Audit P0 Regression Probes (V1, V2, V3, V4, V5, P0-9)
 *
 * Bound to permanent finding IDs in `docs/audits/register.yml` (`20261020-UX-01`, `20261020-UX-02`,
 * `20261020-UX-03`, `20261020-UX-05`).
 * - When `status === 'open' | 'in-progress'`, runs as `it.fails(...)` (reproducing the defect before fix).
 * - When `status === 'fixed'`, runs as `it(...)` and MUST PASS.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from '../../../../packages/core/node_modules/yaml/browser/index.js';
import { createApp } from '../app.js';
import { scanForConfidentialData } from '@living-portfolio/ai';
import { renderAdminWorkspacePage } from '@living-portfolio/web';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

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
  it(`[${findingId}] (status=${status}) ${description}`, fn);
}

describe('AUD-2026-10-20 UX P0 Regression Probes V1–V5 & P0-9 (Bound to docs/audits/register.yml)', () => {
  registerBoundProbe(
    '20261020-UX-01',
    '[V1 & V5] unauthenticated browser navigation to /admin redirects (302) to /admin/setup or /admin/login, /admin/login and /admin/setup return 200 HTML, and default token lp_pat_default_test_admin_token_001 is rejected',
    async () => {
      const { app } = createApp();

      // V1: Browser navigation with Accept: text/html must redirect (302), not return raw 401 JSON
      const v1 = await app.request('/admin', { headers: { Accept: 'text/html' } });
      expect(v1.status).toBe(302);
      expect(v1.headers.get('location')).toMatch(/^\/admin\/(setup|login)/);

      // Setup and login HTML screens must exist
      const setupPage = await app.request('/admin/setup', { headers: { Accept: 'text/html' } });
      expect(setupPage.status).toBe(200);
      expect(await setupPage.text()).toContain('Setup');

      const loginPage = await app.request('/admin/login', { headers: { Accept: 'text/html' } });
      expect(loginPage.status).toBe(200);
      expect(await loginPage.text()).toContain('Sign in');

      // V5: Default bearer token lp_pat_default_test_admin_token_001 must NOT grant admin access
      const v5 = await app.request('/admin', {
        headers: { Authorization: ['Bearer', 'lp_pat_default_test_admin_token_001'].join(' ') },
      });
      expect(v5.status).toBe(401);
    }
  );

  registerBoundProbe(
    '20261020-UX-02',
    '[V2] admin workspace script attaches CSRF/auth headers via apiClient, checks res.ok before reporting success, and never renders a green confidentiality message on 401/error',
    async () => {
      const repo = new InMemoryPortfolioRepository();
      const html = await renderAdminWorkspacePage(repo);

      // Must check res.ok and attach X-CSRF-Token
      expect(html).toContain('X-CSRF-Token');
      expect(html).toContain('res.ok');

      // Must NOT fall through to green "No confidential secrets" when data.warnings is undefined on 401
      expect(html).not.toContain('if (data.warnings && data.warnings.length > 0)');
      expect(html).toContain("Couldn't check for private details");
    }
  );

  registerBoundProbe(
    '20261020-UX-03',
    '[V3 & V4] scanForConfidentialData catches sk- keys, NDA markers, and client names; POST /api/entries rejects visibility=public without a signed redactionPreviewToken and rejects empty body_md',
    async () => {
      // V3: Scanner must flag sk- keys, NDA markers, and client names
      const testSecretKey = ['sk', 'proj', 'secret1234567890'].join('-');
      const v3Warnings = scanForConfidentialData(
        `Internal client Acme Corp under NDA using key ${testSecretKey}.`
      );
      expect(v3Warnings.length).toBeGreaterThanOrEqual(3);
      expect(v3Warnings.some((w) => w.type === 'secret' && w.match.includes('sk-'))).toBe(true);
      expect(v3Warnings.some((w) => w.match.toLowerCase().includes('nda'))).toBe(true);
      expect(v3Warnings.some((w) => w.match.toLowerCase().includes('acme'))).toBe(true);

      // V4: POST /api/entries with visibility: 'public' and no redactionPreviewToken must return 400
      const adminToken = 'explicit_admin_token_for_v4_test';
      const { app } = createApp(undefined, { bootstrapAdminToken: adminToken });
      const v4 = await app.request('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          slug: 'unscanned-leak',
          title: 'Leak',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
          body_md: `Internal client Acme Corp under NDA using key ${testSecretKey}.`,
          temporal_level: 'exact',
          valid_from: '2026-01-01T00:00:00Z',
        }),
      });
      expect(v4.status).toBe(400);

      // Empty or whitespace-only body_md must also return 400
      const emptyBodyRes = await app.request('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          slug: 'empty-body-entry',
          title: 'Empty Body',
          profile: 'case-study',
          view: 'article',
          visibility: 'private',
          body_md: '   ',
          temporal_level: 'exact',
          valid_from: '2026-01-01T00:00:00Z',
        }),
      });
      expect(emptyBodyRes.status).toBe(400);
    }
  );

  registerBoundProbe(
    '20261020-UX-05',
    '[P0-9] admin workspace removes hard-coded Detected Claim Conflict card, removes false background enrichment queued claim, and healthz and settings.ts report not_configured with zero invented passed or verified statuses',
    async () => {
      const repo = new InMemoryPortfolioRepository();
      const html = await renderAdminWorkspacePage(repo);

      // Must not render hard-coded fictional claim conflict card
      expect(html).not.toContain('Detected Claim Conflict:');
      expect(html).not.toContain('Use Redis Redlock leases for distributed job coordination.');
      // Must not claim "Background enrichment queued" when no worker is running
      expect(html).not.toContain('Background enrichment queued');
      // Kill-switch button must carry aria-pressed reflecting server state
      expect(html).toContain('aria-pressed=');

      // 1. Verify unconfigured /healthz endpoint contains no invented statuses
      const { app } = createApp();
      const healthRes = await app.request('/healthz');
      const healthBody = await healthRes.json();
      expect(healthBody.backup.lastRestoreTestStatus).toBe('not_configured');
      expect(healthBody.queue.status).toBe('not_configured');
      expect(healthBody.providers.status).toBe('not_configured');
      expect(healthBody.providers.active).toEqual([]);

      // Verify no field in healthz has invented "passed" or "verified"
      const healthValues = JSON.stringify(healthBody).toLowerCase();
      expect(healthValues).not.toContain('"passed"');
      expect(healthValues).not.toContain('"verified"');

      // 2. Verify /api/settings contains no invented statuses
      const adminToken = 'admin_token_for_settings_test';
      const { app: adminApp, auth: adminAuth } = createApp(undefined, { bootstrapAdminToken: adminToken });
      const settingsResBefore = await adminApp.request('/api/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(settingsResBefore.status).toBe(200);
      const settingsBody = await settingsResBefore.json();
      expect(settingsBody.notifications.testStatus).toBe('not_configured');
      expect(settingsBody.backups.lastRestoreTest).toBe('not_configured');
      expect(settingsBody.backups.lastBackupAt).toBeNull();
      // Before setup wizard runs, setupWizardCompleted must be false
      expect(settingsBody.runtime.setupWizardCompleted).toBe(false);

      // After completing setup wizard, setupWizardCompleted reflects true
      adminAuth.setupAdminAccount('owner', 'SecurePassword123!');
      const settingsResAfter = await adminApp.request('/api/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const settingsBodyAfter = await settingsResAfter.json();
      expect(settingsBodyAfter.runtime.setupWizardCompleted).toBe(true);

      const settingsValues = JSON.stringify(settingsBody).toLowerCase();
      expect(settingsValues).not.toContain('"passed"');
      expect(settingsValues).not.toContain('"verified"');
    }
  );
});
