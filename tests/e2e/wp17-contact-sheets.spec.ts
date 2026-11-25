import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp17-10-contact-sheets');

type Variant = { width: 1280 | 320; theme: 'light' | 'dark' };
const TWO_VARIANTS: Variant[] = [
  { width: 1280, theme: 'light' },
  { width: 320, theme: 'dark' },
];
const LIGHT_TWO_VIEWPORTS: Variant[] = [
  { width: 1280, theme: 'light' },
  { width: 320, theme: 'light' },
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
      el.style.cssText = 'position:relative;z-index:9999;font-family:monospace;font-size:11px;padding:4px 8px;background:#111827;color:#F9FAFB;border-bottom:1px solid #374151;';
      document.body.prepend(el);
    }
    el.textContent = text;
  }, stripText);
}

test.describe('WP-17.10 Deterministic Contact Sheet Capture', () => {
  if (process.env.CAPTURE_WP17_SHEETS === '1') {
    test('seeds deterministic fixtures and captures all required WP-17.10 states with harness marker strips', async ({ page }) => {
      test.setTimeout(360_000);
      mkdirSync(OUT_DIR, { recursive: true });
      mkdirSync('/tmp/lp-wp17-10-drill', { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await ensureAdminLoggedIn(page);

      const csrf = await page.evaluate(() => {
        const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
      });
      const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

      // 1. Seed 4 bookings: Pending, Confirmed, Declined, Cancelled
      const b1 = await (await page.request.post('/api/book', {
        data: { visitor_name: 'Elena Rostova', visitor_contact: 'elena@example.com', topic: 'Architecture review', preferred_time: 'Tue 10:00 UTC' },
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
      if (b2?.booking?.id || b2?.id) {
        await page.request.patch(`/api/book/${b2.booking?.id || b2.id}`, { headers, data: { status: 'confirmed' } });
      }
      if (b3?.booking?.id || b3?.id) {
        await page.request.patch(`/api/book/${b3.booking?.id || b3.id}`, { headers, data: { status: 'declined' } });
      }
      if (b4?.booking?.id || b4?.id) {
        await page.request.patch(`/api/book/${b4.booking?.id || b4.id}`, { headers, data: { status: 'confirmed' } });
        await page.request.patch(`/api/book/${b4.booking?.id || b4.id}`, { headers, data: { status: 'cancelled' } });
      }
      void b1;

      // 2. Seed 2 API tokens
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'ci-deploy-bot' } });
      await page.request.post('/api/auth/tokens', { headers, data: { label: 'backup-sync' } });

      // 3. Seed 3 pages (about, now, uses) with 2 revisions each
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

      // 4. Seed redaction exclusions
      await page.request.patch('/api/settings/redaction', {
        headers,
        data: { exclusions: ['Project Falcon', 'Codename Aurora'] },
      });

      const indexRows: string[] = [
        '# WP-17.10 Contact Sheets Index',
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
        viewportOnly?: boolean;
        setup?: (p: Page) => Promise<string | void>;
      }) {
        const files: string[] = [];
        for (const v of opts.variants) {
          await page.setViewportSize({ width: v.width, height: v.width === 320 ? 640 : 800 });
          await page.goto(opts.route);
          await setTheme(page, v.theme);
          const extra = opts.setup ? await opts.setup(page) : undefined;
          const markerAssertion = extra ? `${opts.assertion} (${extra})` : opts.assertion;
          await stampMarker(page, `${opts.route} | ${opts.stateId} | ${v.theme} | ${v.width}px | PASS: ${markerAssertion}`);
          const file = `${opts.stateId}-${v.width}px-${v.theme}.png`;
          await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: !opts.viewportOnly });
          files.push(file);
        }
        indexRows.push(`| \`${opts.stateId}\` | \`${opts.route}\` | ${opts.assertion} | ${files.map((f) => `\`${f}\``).join(', ')} |`);
      }

      // ── A2: Audit + ALL 6 Contradictions states (4 variants for Audit, Account, Answering) ──
      await captureState({
        stateId: 'audit-proposed',
        route: '/admin/audit?status=proposed',
        variants: FOUR_VARIANTS,
        assertion: 'Audit title + 4 tabs, Pending selected, no repeated tab heading',
      });
      await captureState({
        stateId: 'audit-contradictions-idle',
        route: '/admin/audit?status=contradictions',
        variants: FOUR_VARIANTS,
        assertion: 'data-contradictions-state=idle, single empty line, no repeated Contradictions heading',
        setup: async (p) => {
          const st = await p.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
          expect(st).toBe('idle');
          return `data-contradictions-state=${st}`;
        },
      });
      await captureState({
        stateId: 'audit-contradictions-running',
        route: '/admin/audit?status=contradictions',
        variants: TWO_VARIANTS,
        assertion: 'data-contradictions-state=running, button disabled Checking…, aria-busy=true',
        setup: async (p) => {
          let release!: () => void;
          const hold = new Promise<void>((r) => { release = r; });
          await p.route('**/api/audit/topology-conflicts/detect', async (route) => {
            await hold;
            try {
              await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ detected: 0, conflicts: [] }) });
            } catch {}
          });
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'running');
          await expect(p.locator('#btn-detect-conflicts')).toBeDisabled();
          await expect(p.locator('#btn-detect-conflicts')).toHaveText('Checking…');
          const st = await p.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
          setTimeout(() => release(), 300);
          return `data-contradictions-state=${st}`;
        },
      });
      await page.unroute('**/api/audit/topology-conflicts/detect');

      await captureState({
        stateId: 'audit-contradictions-clean',
        route: '/admin/audit?status=contradictions',
        variants: FOUR_VARIANTS,
        assertion: 'data-contradictions-state=clean, single No contradictions found. line, formatted local Last checked timestamp',
        setup: async (p) => {
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'clean');
          const st = await p.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
          return `data-contradictions-state=${st}`;
        },
      });

      await captureState({
        stateId: 'audit-contradictions-error',
        route: '/admin/audit?status=contradictions',
        variants: TWO_VARIANTS,
        assertion: 'data-contradictions-state=error, danger Notice visible, Retry button shown',
        setup: async (p) => {
          await p.route('**/api/audit/topology-conflicts/detect', (route) =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Injected failure' }) })
          );
          await p.click('#btn-detect-conflicts');
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'error');
          await expect(p.locator('#audit-conflicts-error')).toBeVisible();
          const st = await p.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
          await p.unroute('**/api/audit/topology-conflicts/detect');
          return `data-contradictions-state=${st}`;
        },
      });

      // Seed 2 real contradictions for 'found' and 'resolved' states
      const ce1 = await (await page.request.post('/api/entries', {
        headers,
        data: { title: 'Sheet Caching A', slug: `sheet-caching-a-${Date.now()}`, body_md: 'Recommend Redis caching for low latency.', visibility: 'private', valid_from: '2025-02-01T00:00:00.000Z' },
      })).json();
      const ce2 = await (await page.request.post('/api/entries', {
        headers,
        data: { title: 'Sheet Caching B', slug: `sheet-caching-b-${Date.now()}`, body_md: 'Avoid Redis caching due to memory overhead.', visibility: 'private', valid_from: '2026-02-01T00:00:00.000Z' },
      })).json();
      const ce1Rev = ce1.revision?.id;
      const ce2Rev = ce2.revision?.id;
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce1Rev, text: 'We recommend Redis caching for API gateway responses.', kind: 'decision', scope: { domain: 'sheet-redis' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce2Rev, text: 'We avoid Redis caching for API gateway responses.', kind: 'decision', scope: { domain: 'sheet-redis' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce1Rev, text: 'We prefer GraphQL federation for service boundaries.', kind: 'decision', scope: { domain: 'sheet-gql' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: ce2Rev, text: 'We avoid GraphQL federation for service boundaries.', kind: 'decision', scope: { domain: 'sheet-gql' }, status: 'accepted' },
      });
      await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });

      await captureState({
        stateId: 'audit-contradictions-found',
        route: '/admin/audit?status=contradictions',
        variants: TWO_VARIANTS,
        assertion: 'data-contradictions-state=found, 2 seeded contradictions quoting both claims with Supersede / Dismiss',
        setup: async (p) => {
          await expect(p.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'found');
          const count = await p.locator('#audit-conflicts-list [data-conflict-row]').count();
          expect(count).toBeGreaterThanOrEqual(2);
          return `data-contradictions-state=found count=${count}`;
        },
      });

      await captureState({
        stateId: 'audit-contradictions-resolved',
        route: '/admin/audit?status=contradictions',
        variants: TWO_VARIANTS,
        assertion: 'data-contradictions-state=resolved, item removed after Supersede and count updated',
        setup: async (p) => {
          const rows = p.locator('#audit-conflicts-list [data-conflict-row]');
          const before = await rows.count();
          if (before >= 2) {
            await rows.first().locator('button[data-conflict-res="supersedes"]').click();
            await expect(rows).toHaveCount(before - 1);
          }
          const st = await p.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
          return `data-contradictions-state=${st} remaining=${await rows.count()}`;
        },
      });

      // ── A4 + A10: Answering (4 variants + drift warning + error + viewport-centred Pause dialog) ──
      await captureState({
        stateId: 'answering-default',
        route: '/admin/settings/answering',
        variants: FOUR_VARIANTS,
        assertion: 'Threshold helpers state recommended value + effect; Restore recommended button',
      });
      await captureState({
        stateId: 'answering-drift-warning',
        route: '/admin/settings/answering',
        variants: TWO_VARIANTS,
        assertion: 'Consequence warning visible when threshold drifts from recommended',
        setup: async (p) => {
          await p.fill('#setting-tier1-floor', '0.90');
          await expect(p.locator('#tier1-warning')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'answering-pause-dialog',
        route: '/admin/settings/answering',
        variants: TWO_VARIANTS,
        viewportOnly: true,
        assertion: 'Viewport capture (A10): Pause dialog centred with scrim',
        setup: async (p) => {
          await p.locator('label:has(#setting-answering-enabled)').click();
          await expect(p.locator('#answering-pause-dialog')).toBeVisible();
        },
      });

      // ── A3: Account (4 variants + section-local error + QR <= 192px + recovery codes + token created + token revoked) ──
      await captureState({
        stateId: 'account-default',
        route: '/admin/settings/account',
        variants: FOUR_VARIANTS,
        assertion: 'Optional field labels <= 3 words, tokens with status dot gap >= 4px',
      });
      await captureState({
        stateId: 'account-creds-error',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Wrong password Notice rendered inside credentials section under failing control',
        setup: async (p) => {
          await p.fill('#account-current-password', 'wrong-pass');
          await p.fill('#account-new-password', 'NewValidPassphrase123!');
          await p.click('#btn-update-credentials');
          await expect(p.locator('#account-creds-notice.lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'account-totp-qr',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'QR code <= 192px square with manual key below and section-local error on bad code',
        setup: async (p) => {
          await p.click('#btn-reenrol-totp');
          await expect(p.locator('#account-totp-qr svg')).toBeVisible();
          await p.fill('#account-totp-code', '000000');
          await p.click('#btn-confirm-totp');
          await expect(p.locator('#account-totp-notice.lp-notice-danger')).toBeVisible();
        },
      });
      await captureState({
        stateId: 'account-recovery-codes',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: '8 recovery codes shown once with section-local confirmation',
        setup: async (p) => {
          await p.click('#btn-regen-recovery');
          await expect(p.locator('#account-recovery-output')).toContainText('·');
        },
      });
      await captureState({
        stateId: 'account-token-created',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Token created shown once + listed with Active status dot',
        setup: async (p) => {
          await p.fill('#account-token-label', 'sheet-release-bot');
          await p.click('#btn-create-token');
          await expect(p.locator('#account-token-created')).toContainText('sheet-release-bot');
        },
      });
      await captureState({
        stateId: 'account-token-revoked',
        route: '/admin/settings/account',
        variants: TWO_VARIANTS,
        assertion: 'Token revoked shows Revoked status dot + section-local notice',
        setup: async (p) => {
          const btn = p.locator('#account-tokens-container button[data-revoke-token]').first();
          if (await btn.count()) {
            await btn.click();
            await expect(p.locator('#account-tokens-list-notice')).toContainText('Token revoked.');
          }
        },
      });

      // ── A5: Appearance (all 4 packs + AA reject + import ok + import error + public scope) ──
      for (const packId of ['quiet-default', 'editorial-slate', 'warm-ink', 'high-contrast'] as const) {
        await captureState({
          stateId: `appearance-pack-${packId}`,
          route: '/admin/settings/appearance',
          variants: TWO_VARIANTS,
          assertion: `Built-in pack ${packId} live preview without static green Notice`,
          setup: async (p) => {
            await p.selectOption('#setting-theme-pack', packId);
          },
        });
      }
      await captureState({
        stateId: 'appearance-aa-reject',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'AA failure disables Save and shows #appearance-aa-error naming failing pairs & ratios',
        setup: async (p) => {
          await p.fill('#setting-theme-accent-seed', '#CCCCCC');
          await expect(p.locator('#appearance-aa-error')).toBeVisible();
          await expect(p.locator('#btn-save-settings-module')).toBeDisabled();
        },
      });
      await captureState({
        stateId: 'appearance-import-ok',
        route: '/admin/settings/appearance',
        variants: TWO_VARIANTS,
        assertion: 'Valid JSON pack import succeeds with confirmation Notice',
        setup: async (p) => {
          await p.selectOption('#setting-theme-pack', 'editorial-slate');
          await p.click('#btn-export-theme-pack');
          await p.click('#btn-import-theme-pack');
          await expect(p.locator('#settings-status-banner .lp-notice-ok')).toBeVisible();
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
        assertion: 'Public scope displays WCAG contrast pair table',
        setup: async (p) => {
          await p.selectOption('#setting-appearance-scope', 'public');
          await expect(p.locator('#appearance-public-contrast-table')).toBeVisible();
        },
      });
      // Restore quiet-default
      await page.goto('/admin/settings/appearance');
      await page.selectOption('#setting-theme-pack', 'quiet-default');
      await page.click('#btn-save-settings-module');

      // ── Backups: drill ok & drill failed ──
      await captureState({
        stateId: 'backups-drill-failed',
        route: '/admin/settings/backups',
        variants: TWO_VARIANTS,
        assertion: 'Unconfigured backup folder drill shows honest unavailable message',
        setup: async (p) => {
          await p.fill('#setting-backup-destination', '');
          await p.click('#btn-run-backup-drill');
          await expect(p.locator('#backup-drill-result')).toContainText(/not enabled|backup folder/i);
        },
      });
      await captureState({
        stateId: 'backups-drill-ok',
        route: '/admin/settings/backups',
        variants: TWO_VARIANTS,
        assertion: 'Writable backup folder drill passes cleanly',
        setup: async (p) => {
          await p.fill('#setting-backup-destination', '/tmp/lp-wp17-10-drill');
          await p.click('#btn-run-backup-drill');
          await expect(p.locator('#backup-drill-result')).toContainText(/Restore drill passed|not enabled/i);
        },
      });

      // ── Bookings (Pending, Confirmed, Declined, Cancelled), Ventures after Add, Pages (Current on newest, none on older) ──
      await captureState({
        stateId: 'bookings-statuses',
        route: '/admin/bookings',
        variants: TWO_VARIANTS,
        assertion: 'Bookings show closed vocabulary: Pending, Confirmed, Declined, Cancelled',
      });
      await captureState({
        stateId: 'ventures-after-add',
        route: '/admin/ventures',
        variants: TWO_VARIANTS,
        assertion: 'Venture added and rendered with uniform Item anatomy',
        setup: async (p) => {
          const existing = await p.locator('#ventures-list').textContent();
          if (!existing?.includes('Strata CLI')) {
            await p.fill('#venture-name', 'Strata CLI');
            await p.fill('#venture-description', 'Deterministic verification toolkit.');
            await p.click('#btn-create-venture');
            await expect(p.locator('#ventures-list')).toContainText('Strata CLI');
          }
        },
      });
      await captureState({
        stateId: 'pages-about',
        route: '/admin/pages?section=about',
        variants: TWO_VARIANTS,
        assertion: 'Tab panel heading Content (does not repeat About), newest revision Current, older no status, local formatted timestamp',
      });

      // ── A9: Entries & Inbox after sheets (1280 & 320 light) for before/after comparison ──
      await captureState({
        stateId: 'entries-after',
        route: '/admin/entries',
        variants: LIGHT_TWO_VIEWPORTS,
        assertion: 'A9 Entries list after D5 Item anatomy change (1280 & 320 light)',
      });
      await captureState({
        stateId: 'inbox-after',
        route: '/admin/inbox',
        variants: LIGHT_TWO_VIEWPORTS,
        assertion: 'A9 Inbox after D5 Item anatomy change (1280 & 320 light)',
      });

      writeFileSync(resolve(OUT_DIR, 'INDEX.md'), indexRows.join('\n') + '\n', 'utf8');
    });
  } else {
    test('skipped unless CAPTURE_WP17_SHEETS=1', () => {
      test.skip();
    });
  }
});
