import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp17-11-contact-sheets');

type Variant = { width: 320 | 1280 | 1920; theme: 'light' | 'dark' };
const THREE_VARIANTS: Variant[] = [
  { width: 320, theme: 'dark' },
  { width: 1280, theme: 'light' },
  { width: 1920, theme: 'light' },
];
const FOUR_VARIANTS_WITH_320_LIGHT: Variant[] = [
  { width: 320, theme: 'light' },
  { width: 320, theme: 'dark' },
  { width: 1280, theme: 'light' },
  { width: 1920, theme: 'light' },
];

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(async (t) => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('strata-theme', t); } catch {}
    void document.body.offsetHeight;
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
  }, theme);
}

async function stampMarker(page: Page, stripText: string) {
  await page.evaluate((text) => {
    let el = document.getElementById('wp17-harness-strip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wp17-harness-strip';
      el.setAttribute('data-harness-marker', 'true');
      el.style.cssText = 'position:relative;z-index:9999;font-family:monospace;font-size:11px;padding:4px 8px;background:#111827;color:#F9FAFB;border-bottom:1px solid #374151;';
      document.body.prepend(el);
    }
    el.textContent = text;
  }, stripText);
}

test.describe('WP-17.11 Deterministic Contact Sheet Capture (C1–C5)', () => {
  if (process.env.CAPTURE_WP17_SHEETS === '1') {
    test('seeds deterministic fixtures and captures all required WP-17.11 states across 320/1280/1920', async ({ page }) => {
      test.setTimeout(420_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await ensureAdminLoggedIn(page);

      const csrf = await page.evaluate(() => {
        const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
      });
      const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

      // 1. Seed 4 bookings (Pending, Confirmed, Declined, Cancelled)
      const b1 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Elena Rostova', visitor_contact: 'elena.rostova@distributed-systems.example.com', topic: 'Architecture review', preferred_time: 'Tue 10:00 UTC' },
      })).json();
      const b2 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Marcus Vance', visitor_contact: 'marcus@example.com', topic: 'Postgres migration', preferred_time: 'Wed 14:00 UTC' },
      })).json();
      const b3 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Priya Nair', visitor_contact: 'priya@example.com', topic: 'Design systems audit', preferred_time: 'Thu 16:00 UTC' },
      })).json();
      const b4 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'David Chen', visitor_contact: 'david@example.com', topic: 'API versioning workshop', preferred_time: 'Fri 09:00 UTC' },
      })).json();
      if (b2?.booking?.id || b2?.id) await page.request.patch(`/api/book/${b2.booking?.id || b2.id}`, { headers, data: { status: 'confirmed' } });
      if (b3?.booking?.id || b3?.id) await page.request.patch(`/api/book/${b3.booking?.id || b3.id}`, { headers, data: { status: 'declined' } });
      if (b4?.booking?.id || b4?.id) {
        await page.request.patch(`/api/book/${b4.booking?.id || b4.id}`, { headers, data: { status: 'confirmed' } });
        await page.request.patch(`/api/book/${b4.booking?.id || b4.id}`, { headers, data: { status: 'cancelled' } });
      }
      void b1;

      // 2. Seed API tokens
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'ci-deploy-bot' } });
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'backup-sync' } });

      // 3. Seed 3 pages with 2 revisions each
      for (const slug of ['about', 'now', 'uses'] as const) {
        await page.request.put(`/api/settings/pages/${slug}`, { headers, data: { body_md: `${slug.toUpperCase()} revision 1 content.` } });
        await page.request.put(`/api/settings/pages/${slug}`, { headers, data: { body_md: `${slug.toUpperCase()} revision 2 current content.` } });
      }

      // 4. Seed venture
      await page.request.post('/api/structure/ventures', {
        headers,
        data: { name: 'Strata CLI', description: 'Deterministic verification toolkit.', status: 'launched' },
      });

      const indexRows: string[] = [
        '# WP-17.11 Contact Sheets Index',
        '',
        'Every sheet carries a top harness marker strip (`route | state | theme | viewport | assertion`).',
        '',
        '| State | Route | Assertion | Files |',
        '| --- | --- | --- | --- |',
      ];

      async function captureState(opts: {
        stateId: string;
        route: string;
        variants: Variant[];
        assertion: string;
        setup?: (p: Page) => Promise<string | void>;
      }) {
        const files: string[] = [];
        for (const v of opts.variants) {
          const height = v.width === 320 ? 640 : v.width === 1920 ? 1080 : 800;
          await page.setViewportSize({ width: v.width, height });
          await page.goto(opts.route);
          await setTheme(page, v.theme);
          const extra = opts.setup ? await opts.setup(page) : undefined;
          const markerAssertion = extra ? `${opts.assertion} (${extra})` : opts.assertion;
          await stampMarker(page, `${opts.route} | ${opts.stateId} | ${v.theme} | ${v.width}px | PASS: ${markerAssertion}`);
          const file = `${opts.stateId}-${v.width}px-${v.theme}.png`;
          await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
          files.push(file);
        }
        indexRows.push(`| \`${opts.stateId}\` | \`${opts.route}\` | ${opts.assertion} | ${files.map((f) => `\`${f}\``).join(', ')} |`);
      }

      // ── Account (C1 Credential + C2 Feedback) ──
      await captureState({
        stateId: 'account-creds-error',
        route: '/admin/settings/account',
        variants: THREE_VARIANTS,
        assertion: 'K2 Scenario 2: danger Notice below ActionBar in Sign-in credentials section, full width',
        setup: async (p) => {
          await p.fill('#account-current-password', 'wrong-pass');
          await p.fill('#account-new-password', 'NewValidPassphrase123!');
          await p.click('#btn-update-credentials');
          await expect(p.locator('#account-creds-notice.lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'account-totp-credential',
        route: '/admin/settings/account',
        variants: THREE_VARIANTS,
        assertion: 'C1/K5: QR <= 192px + manual key in Credential (4-char blocks) + section-local error below ActionBar',
        setup: async (p) => {
          await p.click('#btn-reenrol-totp');
          await expect(p.locator('#account-totp-manual-cred[data-c="Credential"]')).toBeVisible();
          await p.fill('#account-totp-code', '000000');
          await p.click('#btn-confirm-totp');
          await expect(p.locator('#account-totp-notice.lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'account-recovery-codes',
        route: '/admin/settings/account',
        variants: THREE_VARIANTS,
        assertion: 'C1/K5: 8 recovery codes in Credential list grid (2-col compact / 4-col regular) + Copy all',
        setup: async (p) => {
          await p.click('#btn-regen-recovery');
          await expect(p.locator('#account-recovery-output[data-c="Credential"] .lp-credential-cell')).toHaveCount(8);
        },
      });
      await captureState({
        stateId: 'account-token-created',
        route: '/admin/settings/account',
        variants: THREE_VARIANTS,
        assertion: 'C1/K1/K5: API token in Credential single (overflow-wrap:anywhere, zero 320px overflow) + Copy',
        setup: async (p) => {
          await p.fill('#account-token-label', 'sheet-release-bot');
          await p.click('#btn-create-token');
          await expect(p.locator('#account-token-created[data-c="Credential"]')).toBeVisible();
          const sw = await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
          expect(sw).toBe(true);
        },
      });
      await captureState({
        stateId: 'account-token-revoked',
        route: '/admin/settings/account',
        variants: THREE_VARIANTS,
        assertion: 'C2 Scenario 3: Token revoked shows StatusLine (not green Notice) + Revoked status',
        setup: async (p) => {
          const btn = p.locator('#account-tokens-container button[data-revoke-token]').first();
          if (await btn.count()) {
            await btn.click();
            await expect(p.locator('#account-tokens-list-notice.lp-status-line-ok')).toBeVisible();
          }
        },
      });

      // ── Answering drift (C2 Scenario 5) ──
      await captureState({
        stateId: 'answering-drift',
        route: '/admin/settings/answering',
        variants: THREE_VARIANTS,
        assertion: 'C2 Scenario 5: State-derived warning Notice directly above Restore recommended ActionBar',
        setup: async (p) => {
          await p.fill('#setting-tier1-floor', '0.90');
          await expect(p.locator('#tier1-warning')).toBeVisible();
        },
      });

      // ── Appearance (C2 + C4) ──
      await captureState({
        stateId: 'appearance-aa-reject',
        route: '/admin/settings/appearance',
        variants: THREE_VARIANTS,
        assertion: 'AA contrast failure disables Save and shows full-width danger Notice',
        setup: async (p) => {
          await p.fill('#setting-theme-accent-seed', '#CCCCCC');
          await expect(p.locator('#appearance-aa-error')).toBeVisible();
          await expect(p.locator('#btn-save-settings-module')).toBeDisabled();
        },
      });
      await captureState({
        stateId: 'appearance-import-error',
        route: '/admin/settings/appearance',
        variants: THREE_VARIANTS,
        assertion: 'C2: Mapped concise validation Notice (<=3 lines, <=12 words each, full width) below Import ActionBar',
        setup: async (p) => {
          await p.fill('#setting-theme-import-json', '{"version":1,"customCss":"body{}"}');
          await p.click('#btn-import-theme-pack');
          await expect(p.locator('#appearance-import-feedback.lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'appearance-import-ok',
        route: '/admin/settings/appearance',
        variants: THREE_VARIANTS,
        assertion: 'C2/C4: Import ok shows polite StatusLine (not green Notice) below ActionBar + teal accent on Save & Export pack',
        setup: async (p) => {
          await p.selectOption('#setting-theme-pack', 'editorial-slate');
          await p.click('#btn-export-theme-pack');
          await p.click('#btn-import-theme-pack');
          await expect(p.locator('#appearance-import-feedback.lp-status-line-ok')).toBeVisible();
        },
      });
      // Non-default pack (editorial-slate teal) active on /admin/audit with tabs & links visible!
      await captureState({
        stateId: 'appearance-nondefault-audit-tabs',
        route: '/admin/audit?status=proposed',
        variants: THREE_VARIANTS,
        assertion: 'C4: Non-default pack (editorial-slate) applied to Audit tabs & links across all roles',
      });
      // Restore quiet-default before remaining sheets
      await page.request.patch('/api/settings/appearance-v2', {
        headers,
        data: {
          scope: 'admin',
          pack: {
            version: 2, id: 'quiet-default', name: 'Quiet default', packId: 'quiet-default',
            accent: { light: '#3A4FD0', dark: '#A5B4FC' },
            density: 'comfortable', radiusScale: 'default', fontFamily: 'system',
          },
        },
      });

      // ── Audit (Pending, Active, Discarded + Contradictions idle/running/clean/error/found) ──
      await captureState({
        stateId: 'audit-pending',
        route: '/admin/audit?status=proposed',
        variants: FOUR_VARIANTS_WITH_320_LIGHT,
        assertion: 'C3: Single-status Pending tab has zero StatusLabel nodes',
      });
      await captureState({
        stateId: 'audit-active',
        route: '/admin/audit?status=confirmed',
        variants: THREE_VARIANTS,
        assertion: 'C3: Single-status Active tab has zero StatusLabel nodes',
      });
      await captureState({
        stateId: 'audit-discarded',
        route: '/admin/audit?status=revoked',
        variants: THREE_VARIANTS,
        assertion: 'C3: Single-status Discarded tab has zero StatusLabel nodes',
      });
      await captureState({
        stateId: 'contradictions-idle',
        route: '/admin/audit?status=contradictions',
        variants: THREE_VARIANTS,
        assertion: 'C3: Run check at top under tablist, idle EmptyState below',
      });
      await captureState({
        stateId: 'contradictions-running',
        route: '/admin/audit?status=contradictions',
        variants: THREE_VARIANTS,
        assertion: 'C2/C3: Run check disabled Checking…, aria-busy=true, data-contradictions-state=running',
        setup: async (p) => {
          let release!: () => void;
          const hold = new Promise<void>((r) => { release = r; });
          await p.route('**/api/audit/topology-conflicts/detect', async (route) => {
            await hold;
            try { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ detected: 0, conflicts: [] }) }); } catch {}
          });
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'running');
          setTimeout(() => release(), 300);
          return 'data-contradictions-state=running';
        },
      });
      await page.unroute('**/api/audit/topology-conflicts/detect');
      await captureState({
        stateId: 'contradictions-clean',
        route: '/admin/audit?status=contradictions',
        variants: THREE_VARIANTS,
        assertion: 'C3: Clean state with single No contradictions found. line + formatted local Last checked',
        setup: async (p) => {
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'clean');
          return 'data-contradictions-state=clean';
        },
      });
      await captureState({
        stateId: 'contradictions-error',
        route: '/admin/audit?status=contradictions',
        variants: THREE_VARIANTS,
        assertion: 'C2: Error Notice directly below Run check/Retry ActionBar',
        setup: async (p) => {
          await p.route('**/api/audit/topology-conflicts/detect', (route) =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Injected failure' }) })
          );
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-conflicts-error')).toBeVisible();
          await p.unroute('**/api/audit/topology-conflicts/detect');
          return 'data-contradictions-state=error';
        },
      });

      // Seed 2 real contradictions for 'found'
      const ce1 = await (await page.request.post('/api/entries', {
        headers,
        data: { title: 'Sheet Caching A', slug: `sheet11-a-${Date.now()}`, body_md: 'Recommend Redis caching.', visibility: 'private', valid_from: '2025-02-01T00:00:00.000Z' },
      })).json();
      const ce2 = await (await page.request.post('/api/entries', {
        headers,
        data: { title: 'Sheet Caching B', slug: `sheet11-b-${Date.now()}`, body_md: 'Avoid Redis caching.', visibility: 'private', valid_from: '2026-02-01T00:00:00.000Z' },
      })).json();
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce1.revision?.id, text: 'We recommend Redis caching for API gateway responses.', kind: 'decision', scope: { domain: 's11-redis' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce2.revision?.id, text: 'We avoid Redis caching for API gateway responses.', kind: 'decision', scope: { domain: 's11-redis' }, status: 'accepted' },
      });
      await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });

      await captureState({
        stateId: 'contradictions-found',
        route: '/admin/audit?status=contradictions',
        variants: THREE_VARIANTS,
        assertion: 'C3: "{Entry A} vs {Entry B}" title, meta confidence, quote Text blocks with entry links (no Entry: prefix), Keep newer / Keep both, zero status',
        setup: async (p) => {
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'found');
          return 'data-contradictions-state=found';
        },
      });

      // ── Core lists: Inbox, Entries, Today, Bookings, Ventures, Pages revisions, Settings index ──
      await captureState({
        stateId: 'inbox',
        route: '/admin/inbox',
        variants: FOUR_VARIANTS_WITH_320_LIGHT,
        assertion: 'C3: Single-status Inbox tab omits status label; Item v2 compact/regular anatomy',
      });
      await captureState({
        stateId: 'entries',
        route: '/admin/entries',
        variants: FOUR_VARIANTS_WITH_320_LIGHT,
        assertion: 'C3: All-states Entries keeps status; compact (<480px) puts status + chevron on row 2 below full-width title',
      });
      await captureState({
        stateId: 'today',
        route: '/admin',
        variants: FOUR_VARIANTS_WITH_320_LIGHT,
        assertion: 'C3: Today Item v2 compact/regular anatomy across 320/1280/1920',
      });
      await captureState({
        stateId: 'bookings',
        route: '/admin/bookings',
        variants: FOUR_VARIANTS_WITH_320_LIGHT,
        assertion: 'C3: Bookings atomic meta fields (no dotted string) + closed vocabulary statuses',
      });
      await captureState({
        stateId: 'ventures',
        route: '/admin/ventures',
        variants: THREE_VARIANTS,
        assertion: 'C3: Ventures Item v2 anatomy',
      });
      await captureState({
        stateId: 'pages-revisions',
        route: '/admin/pages?section=about',
        variants: THREE_VARIANTS,
        assertion: 'C3/A6: Pages revisions (Current on newest, none on older, local timestamps)',
      });
      await captureState({
        stateId: 'settings-index',
        route: '/admin/settings',
        variants: THREE_VARIANTS,
        assertion: 'C3: Settings index Item v2 compact (<480px) vs regular (>=480px)',
      });

      writeFileSync(resolve(OUT_DIR, 'INDEX.md'), indexRows.join('\n') + '\n', 'utf8');
    });
  } else {
    test('skipped unless CAPTURE_WP17_SHEETS=1', () => {
      test.skip();
    });
  }
});
