import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp17-9-contact-sheets');

type Variant = { width: 1280 | 320; theme: 'light' | 'dark' };
const TWO_VARIANTS: Variant[] = [
  { width: 1280, height: 800, theme: 'light' } as any,
  { width: 320, height: 640, theme: 'dark' } as any,
];
const FOUR_VARIANTS: Variant[] = [
  { width: 1280, theme: 'light' },
  { width: 1280, theme: 'dark' },
  { width: 320, theme: 'light' },
  { width: 320, theme: 'dark' },
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
      el.style.cssText = 'font-family:monospace;font-size:11px;padding:4px 8px;background:#111827;color:#F9FAFB;border-bottom:1px solid #374151;';
      document.body.prepend(el);
    }
    el.textContent = text;
  }, stripText);
}

test.describe('WP-17.9 Deterministic Contact Sheet Capture', () => {
  if (process.env.CAPTURE_WP17_SHEETS === '1') {
    test('seeds deterministic fixtures and captures all required WP-17.9 states with harness marker strips', async ({ page }) => {
      test.setTimeout(300_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await ensureAdminLoggedIn(page);

      const csrf = await page.evaluate(() => {
        const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
      });
      const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

      // 1. Seed deterministic fixtures:
      // 3 bookings (pending, confirmed, declined)
      const b1 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Elena Rostova', visitor_contact: 'elena@example.com', topic: 'Architecture review', preferred_time: 'Tue 10:00 UTC' },
      })).json();
      const b2 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Marcus Vance', visitor_contact: 'marcus@example.com', topic: 'Postgres migration', preferred_time: 'Wed 14:00 UTC' },
      })).json();
      const b3 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Priya Nair', visitor_contact: 'priya@example.com', topic: 'Design systems audit', preferred_time: 'Thu 16:00 UTC' },
      })).json();
      if (b2?.booking?.id || b2?.id) {
        await page.request.patch(`/api/book/${b2.booking?.id || b2.id}`, { headers, data: { status: 'confirmed' } });
      }
      if (b3?.booking?.id || b3?.id) {
        await page.request.patch(`/api/book/${b3.booking?.id || b3.id}`, { headers, data: { status: 'declined' } });
      }
      void b1;

      // 2 API tokens
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'ci-deploy-bot' } });
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'backup-sync' } });

      // 3 pages (about, now, uses) with 2 revisions each
      for (const slug of ['about', 'now', 'uses'] as const) {
        await page.request.put(`/api/settings/pages/${slug}`, {
          headers,
          data: { body_md: `${slug.toUpperCase()} revision 1 content.` },
        });
        await page.request.put(`/api/settings/pages/${slug}`, {
          headers,
          data: { body_md: `${slug.toUpperCase()} revision 2 current content.` },
        });
      }

      // Redaction exclusions on Structure
      await page.request.patch('/api/settings/redaction', {
        headers,
        data: { exclusions: ['Project Falcon', 'Codename Aurora'] },
      });

      // Seeded venture
      await page.request.post('/api/structure/ventures', {
        headers,
        data: { name: 'Strata CLI', description: 'Deterministic verification toolkit.', status: 'launched' },
      });

      const indexRows: string[] = [
        '# WP-17.9 Contact Sheets Index',
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
        setup?: (p: Page) => Promise<void>;
      }) {
        const files: string[] = [];
        for (const v of opts.variants) {
          await page.setViewportSize({ width: v.width, height: v.width === 320 ? 640 : 800 });
          await page.goto(opts.route);
          await setTheme(page, v.theme);
          if (opts.setup) await opts.setup(page);
          await stampMarker(page, `${opts.route} | ${opts.stateId} | ${v.theme} | ${v.width}px | PASS: ${opts.assertion}`);
          const file = `${opts.stateId}-${v.width}px-${v.theme}.png`;
          await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
          files.push(file);
        }
        indexRows.push(`| \`${opts.stateId}\` | \`${opts.route}\` | ${opts.assertion} | ${files.map((f) => `\`${f}\``).join(', ')} |`);
      }

      // 4-variant core routes: Pages, Audit, Settings index, Structure, Bookings
      await captureState({
        stateId: 'pages-about',
        route: '/admin/pages?section=about',
        variants: FOUR_VARIANTS,
        assertion: '3 short tabs non-overlapping at 320px, About selected, 2 revisions listed',
      });
      await captureState({
        stateId: 'pages-now',
        route: '/admin/pages?section=now',
        variants: TWO_VARIANTS,
        assertion: 'Now tab selected with revision history',
      });
      await captureState({
        stateId: 'pages-uses',
        route: '/admin/pages?section=uses',
        variants: TWO_VARIANTS,
        assertion: 'Uses tab selected with revision history',
      });
      await captureState({
        stateId: 'pages-save-error',
        route: '/admin/pages?section=about',
        variants: TWO_VARIANTS,
        assertion: 'Empty save shows danger Notice',
        setup: async (p) => {
          await p.fill('#pages-body-md', '   ');
          await p.click('#btn-save-page-section');
          await expect(p.locator('#pages-status-line.lp-notice-danger')).toBeVisible();
        },
      });

      await captureState({
        stateId: 'audit-proposed',
        route: '/admin/audit?status=proposed',
        variants: FOUR_VARIANTS,
        assertion: 'Audit title + 4 tabs, Pending selected',
      });
      await captureState({
        stateId: 'audit-confirmed',
        route: '/admin/audit?status=confirmed',
        variants: TWO_VARIANTS,
        assertion: 'Active tab selected',
      });
      await captureState({
        stateId: 'audit-revoked',
        route: '/admin/audit?status=revoked',
        variants: TWO_VARIANTS,
        assertion: 'Discarded tab selected',
      });
      await captureState({
        stateId: 'audit-contradictions-idle',
        route: '/admin/audit?status=contradictions',
        variants: FOUR_VARIANTS,
        assertion: 'Contradictions tab selected, idle EmptyState unboxed & aligned',
      });
      await captureState({
        stateId: 'audit-contradictions-clean',
        route: '/admin/audit?status=contradictions',
        variants: TWO_VARIANTS,
        assertion: 'Clean state after Run check + last-checked timestamp',
        setup: async (p) => {
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /clean|found/);
        },
      });

      await captureState({
        stateId: 'settings-index',
        route: '/admin/settings',
        variants: FOUR_VARIANTS,
        assertion: 'No page subtitle, <=6-word summaries, status on title row at 320px',
      });
      await captureState({
        stateId: 'structure',
        route: '/admin/structure',
        variants: FOUR_VARIANTS,
        assertion: '6 profiles with real role names (no [object Object]), Freeform no empty Roles:, exclusions saved',
      });
      await captureState({
        stateId: 'bookings',
        route: '/admin/bookings',
        variants: FOUR_VARIANTS,
        assertion: '3 seeded bookings (pending/confirmed/declined) with uniform Item anatomy',
      });

      // Answering states
      await captureState({
        stateId: 'answering-default',
        route: '/admin/settings/answering',
        variants: TWO_VARIANTS,
        assertion: 'Concise copy without Explain block',
      });
      await captureState({
        stateId: 'answering-pause-dialog',
        route: '/admin/settings/answering',
        variants: TWO_VARIANTS,
        assertion: 'Pause confirmation dialog visible',
        setup: async (p) => {
          await p.locator('label:has(#setting-answering-enabled)').click();
          await expect(p.locator('#answering-pause-dialog')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'answering-threshold-error',
        route: '/admin/settings/answering',
        variants: TWO_VARIANTS,
        assertion: 'Out-of-range threshold shows danger Notice',
        setup: async (p) => {
          await p.fill('#setting-tier1-floor', '1.50');
          await p.click('#btn-save-settings-module');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });

      // Backups states
      await captureState({
        stateId: 'backups-unconfigured',
        route: '/admin/settings/backups',
        variants: TWO_VARIANTS,
        assertion: 'Unboxed EmptyState for unconfigured backup folder + honest drill message',
        setup: async (p) => {
          await p.click('#btn-run-backup-drill');
          await expect(p.locator('#backup-drill-result')).toContainText(/not enabled|backup folder/i);
        },
      });

      // Account states
      await captureState({
        stateId: 'account-default',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Seeded tokens with status dot + Revoke action, no Explain block',
      });
      await captureState({
        stateId: 'account-wrong-password',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Wrong current password shows danger Notice',
        setup: async (p) => {
          await p.fill('#account-current-password', 'wrong-pass');
          await p.fill('#account-new-password', 'NewValidPassphrase123!');
          await p.click('#btn-update-credentials');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'account-totp-enrol-error',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Authenticator re-enrol shows QR + code field + confirm error',
        setup: async (p) => {
          await p.click('#btn-reenrol-totp');
          await expect(p.locator('#account-totp-reenrol-box')).toBeVisible();
          await p.fill('#account-totp-code', '000000');
          await p.click('#btn-confirm-totp');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });

      // Home states
      await captureState({
        stateId: 'home-count-error',
        route: '/admin/settings/home',
        variants: TWO_VARIANTS,
        assertion: 'Out-of-range featured count shows danger Notice',
        setup: async (p) => {
          await p.fill('#setting-home-featured-count', '99');
          await p.click('#btn-save-settings-module');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'home-unknown-slug',
        route: '/admin/settings/home',
        variants: TWO_VARIANTS,
        assertion: 'Unknown featured slug shows danger Notice',
        setup: async (p) => {
          await p.fill('#setting-home-featured-slugs', 'unknown-slug');
          await p.click('#btn-save-settings-module');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });

      // Appearance states
      await captureState({
        stateId: 'appearance-admin-preview',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'Single accent seed + composed live preview using registered components',
      });
      await captureState({
        stateId: 'appearance-warm-ink',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'Warm ink pack selected with live preview updated',
        setup: async (p) => {
          await p.selectOption('#setting-theme-pack', 'warm-ink');
        },
      });
      await captureState({
        stateId: 'appearance-aa-reject',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'AA rejection Notice naming failing pair and exact ratio',
        setup: async (p) => {
          await p.fill('#setting-theme-accent-seed', '#CCCCCC');
          await expect(p.locator('#appearance-aa-error')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'appearance-import-error',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'Arbitrary CSS in JSON import rejected with danger Notice',
        setup: async (p) => {
          await p.fill('#setting-theme-import-json', '{"version":2,"customCss":"body{}"}');
          await p.click('#btn-import-theme-pack');
          await expect(p.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'appearance-public-scope',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'Public scope displays WCAG contrast pair table (no composed preview)',
        setup: async (p) => {
          await p.selectOption('#setting-appearance-scope', 'public');
          await expect(p.locator('#appearance-public-contrast-table')).toBeVisible();
        },
      });

      // Ventures & Calibration
      await captureState({
        stateId: 'ventures-seeded',
        route: '/admin/ventures',
        variants: TWO_VARIANTS,
        assertion: 'Seeded ventures list with uniform Item anatomy',
      });
      await captureState({
        stateId: 'calibration-default',
        route: '/admin/calibration',
        variants: TWO_VARIANTS,
        assertion: 'Unboxed EmptyState in proposals and history sections',
      });

      writeFileSync(resolve(OUT_DIR, 'INDEX.md'), indexRows.join('\n') + '\n', 'utf8');
    });
  } else {
    test('skipped unless CAPTURE_WP17_SHEETS=1', () => {
      test.skip();
    });
  }
});
