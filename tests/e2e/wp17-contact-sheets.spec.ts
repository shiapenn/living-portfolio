import { test, expect } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = join(process.cwd(), 'test-results', 'wp17-13-contact-sheets');
const BEFORE_STAGING = '/tmp/wp17-13-sheets-staging';

type ShotSpec = { width: number; height: number; theme: 'light' | 'dark' };
const SHOTS_FULL: ShotSpec[] = [
  { width: 320, height: 640, theme: 'dark' },
  { width: 320, height: 640, theme: 'light' },
  { width: 1280, height: 800, theme: 'light' },
  { width: 1920, height: 900, theme: 'light' },
];
const SHOTS_B3: ShotSpec[] = [
  { width: 320, height: 640, theme: 'dark' },
  { width: 320, height: 640, theme: 'light' },
  { width: 1280, height: 800, theme: 'light' },
];

test.describe('WP-17.13 Contact Sheets Capture', () => {
  test.skip(process.env.CAPTURE_WP17_SHEETS !== '1', 'Run with CAPTURE_WP17_SHEETS=1 to capture contact sheets');

  test('seeds fixtures and captures all required WP-17.13 states across 320/1280/1920', async ({ page }) => {
    test.setTimeout(300_000);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };
    const manifest: Array<{ file: string; state: string; assertion: string }> = [];

    // Include e29cc38 before-sheets if staged
    if (existsSync(BEFORE_STAGING)) {
      for (const f of readdirSync(BEFORE_STAGING).filter((n) => n.endsWith('.png')).sort()) {
        copyFileSync(join(BEFORE_STAGING, f), join(OUT_DIR, f));
        manifest.push({ file: f, state: 'e29cc38 baseline (before WP-17.13)', assertion: 'Pre-fix baseline comparison sheet' });
      }
    }

    const shoot = async (slug: string, state: string, assertion: string, shots: ShotSpec[], fullPage = true) => {
      for (const s of shots) {
        await page.setViewportSize({ width: s.width, height: s.height });
        // D7(c): Move pointer off-page and blur focus before non-state sheets
        await page.mouse.move(0, 0);
        await page.evaluate(({ theme, strip }) => {
          if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
            (document.activeElement as HTMLElement).blur();
          }
          document.documentElement.setAttribute('data-theme', theme);
          let bar = document.getElementById('wp17-marker-strip');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'wp17-marker-strip';
            bar.style.cssText = 'position:static;margin-top:24px;background:#14202A;color:#E6ECEF;font:11px/16px monospace;padding:4px 8px;pointer-events:none;';
            document.body.appendChild(bar);
          }
          bar.textContent = strip;
        }, { theme: s.theme, strip: `${slug} | ${state} | ${s.width}px ${s.theme} | ${assertion}` });
        const file = `${slug}-${s.width}px-${s.theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, file), fullPage });
        manifest.push({ file, state: `${slug} (${s.width}px ${s.theme})`, assertion });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    };

    // 1. B3 After-sheets: Settings index, Answering, Account (320/1280)
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await shoot('settings-index-after', 'B3 type & B2 rhythm normalised', 'K12: 8 type roles & S1-S5 spacing', SHOTS_B3);

    await page.goto('/admin/settings/answering', { waitUntil: 'networkidle' });
    await shoot('settings-answering-after', 'B3 type, B2 rhythm, B4 16px mobile inputs', 'K12 + K13: inputs >=16px at 320px', SHOTS_B3);

    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });
    await shoot('settings-account-after', 'B3 type & Active tokens single-status', 'A5: Active tokens hide status + show Created date', SHOTS_B3);

    // 2. Type Specimen (/admin/_gallery#gallery-type-specimen)
    await page.goto('/admin/_gallery', { waitUntil: 'networkidle' });
    for (const s of [
      { width: 320, height: 640, theme: 'light' as const },
      { width: 320, height: 640, theme: 'dark' as const },
      { width: 1280, height: 800, theme: 'light' as const },
    ]) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), s.theme);
      const file = `type-specimen-${s.width}px-${s.theme}.png`;
      await page.locator('#gallery-type-specimen').screenshot({ path: join(OUT_DIR, file) });
      manifest.push({ file, state: `type-specimen (${s.width}px ${s.theme})`, assertion: 'D3: 7 closed roles, secondary 13px/400/text-2, no text <13px' });
    }
    for (const s of [
      { width: 1280, height: 900, theme: 'light' as const },
      { width: 1280, height: 900, theme: 'dark' as const },
      { width: 320, height: 640, theme: 'dark' as const },
    ]) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), s.theme);
      const file = `state-matrix-${s.width}px-${s.theme}.png`;
      await page.locator('#gallery-state-matrix').screenshot({ path: join(OUT_DIR, file) });
      manifest.push({ file, state: `state-matrix (${s.width}px ${s.theme})`, assertion: 'D7(c): Button, Link, Choice, Field, Tab, Item across states' });
    }

    // 3. Today, Entries, Inbox
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await shoot('today', 'Today workspace', 'A5 + K11: trailing chevron on row 1 when status omitted', SHOTS_FULL);

    await page.goto('/admin/entries', { waitUntil: 'networkidle' });
    await shoot('entries', 'Entries list', 'C2: human profile subtitle + Updated date', SHOTS_FULL);

    await page.goto('/admin/inbox', { waitUntil: 'networkidle' });
    await shoot('inbox', 'Inbox list', 'A5 + K11: unclamped content title + row-1 chevron + Received date', SHOTS_FULL);

    // 4. Account: Recovery codes, TOTP, Token created, Active tokens
    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output .lp-credential-cell')).toHaveCount(8);
    await shoot('account-recovery-codes', 'Recovery codes (1/2 col nowrap + Copy all inside surface)', 'A1 + K6 + K7', SHOTS_FULL);

    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-manual-cred')).toBeVisible();
    await shoot('account-totp', 'TOTP QR + manual key helper (no Notice) + 6-digit field', 'A1 + K7', SHOTS_FULL);

    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });
    await page.fill('#account-token-label', 'sheet-deploy-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created')).toBeVisible();
    await shoot('account-token-created', 'API token created (wrapping Credential + Copy inside surface)', 'A1 + K1 + K7', SHOTS_FULL);

    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });
    await shoot('account-active-tokens', 'Active tokens (no status, Created date)', 'A5: single-status token list', SHOTS_FULL);

    // 5. Bookings list + detail (Pending, Confirmed, Declined)
    const bPend = await (await page.request.post('/api/book', {
      data: { topic: 'Distributed Locking Architecture Review', visitor_name: 'Maya Chen', visitor_contact: 'maya@acme.dev', facets: { scale: 'high_volume', stack: 'postgres' }, preferred_time: '2026-12-03T10:00:00Z', notes: 'Comparing Redis vs Postgres advisory locks.' },
    })).json();
    const bConf = await (await page.request.post('/api/book', {
      data: { topic: 'API Gateway Migration Strategy', visitor_name: 'David Park', visitor_contact: 'david@northstar.io', facets: { cloud: 'aws' }, preferred_time: '2026-12-05T14:00:00Z', notes: 'Planning phased rollout.' },
    })).json();
    const bDecl = await (await page.request.post('/api/book', {
      data: { topic: 'Frontend Framework Selection', visitor_name: 'Sam Patel', visitor_contact: 'sam@startup.co', preferred_time: '2026-12-06T09:00:00Z', notes: 'General advisory chat.' },
    })).json();
    await page.request.patch(`/api/book/${bConf.booking.id}`, { headers, data: { status: 'confirmed' } });
    await page.request.patch(`/api/book/${bDecl.booking.id}`, { headers, data: { status: 'declined' } });

    await page.goto('/admin/bookings', { waitUntil: 'networkidle' });
    await shoot('bookings-list', 'Bookings list (date+tz slot, requester, Received, no email)', 'A4 + K10', SHOTS_FULL);

    await page.goto(`/admin/bookings/${bPend.booking.id}`, { waitUntil: 'networkidle' });
    await shoot('booking-detail-pending', 'Booking detail (Pending)', 'A4 + K10: all fields, mailto, history, visitor helper', SHOTS_FULL);

    await page.goto(`/admin/bookings/${bConf.booking.id}`, { waitUntil: 'networkidle' });
    await shoot('booking-detail-confirmed', 'Booking detail (Confirmed)', 'A4 + K10: Cancel + Email requester + history', SHOTS_FULL);

    await page.goto(`/admin/bookings/${bDecl.booking.id}`, { waitUntil: 'networkidle' });
    await shoot('booking-detail-declined', 'Booking detail (Declined)', 'A4 + K10: Email requester + history', SHOTS_FULL);

    // 6. Contradictions: all 6 states (idle, running, clean, error, found with older/newer dates, resolved)
    await page.goto('/admin/audit?status=contradictions', { waitUntil: 'networkidle' });
    await shoot('contradictions-idle', 'state=idle', 'A2 + K8: fixed 5-part order, ActionBar top stable', SHOTS_FULL);

    let releaseRun!: () => void;
    const runGate = new Promise<void>((r) => { releaseRun = r; });
    await page.route('**/api/audit/topology-conflicts/detect', async (route) => {
      await runGate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ detected: 0, conflicts: [] }) });
    });
    const clickP = page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'running');
    await shoot('contradictions-running', 'state=running', 'A2 + K8: Checking… + disabled button at same top', SHOTS_FULL);
    releaseRun();
    await clickP;
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'clean');
    await shoot('contradictions-clean', 'state=clean', 'A2 + K8: No contradictions found + Last checked + Check again', SHOTS_FULL);
    await page.unroute('**/api/audit/topology-conflicts/detect');

    await page.route('**/api/audit/topology-conflicts/detect', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Check failed' }) })
    );
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'error');
    await shoot('contradictions-error', 'state=error', 'A2 + K8: keeps last headline, danger Notice below ActionBar', SHOTS_FULL);
    await page.unroute('**/api/audit/topology-conflicts/detect');

    // Seed 2 dated contradictions for found & resolved
    const entriesData = await (await page.request.get('/api/entries?visibility=all&limit=5', { headers })).json();
    const list = entriesData.entries || [];
    const e1 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[0].id)}`, { headers })).json();
    const e2 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[1].id)}`, { headers })).json();
    const rev1Id = e1.revision?.id || e1.revisions?.[0]?.id;
    const rev2Id = e2.revision?.id || e2.revisions?.[0]?.id;
    await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev1Id, text: 'We recommend Redis locks for webhook coordination across workers.', kind: 'decision', scope: { domain: 'sheet-locks' }, status: 'accepted' },
    });
    await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev2Id, text: 'We avoid Redis locks for webhook coordination due to failovers.', kind: 'decision', scope: { domain: 'sheet-locks' }, status: 'accepted' },
    });
    await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev1Id, text: 'We prefer GraphQL federation for internal service APIs.', kind: 'decision', scope: { domain: 'sheet-gql' }, status: 'accepted' },
    });
    await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev2Id, text: 'We avoid GraphQL federation because it fails under burst load.', kind: 'decision', scope: { domain: 'sheet-gql' }, status: 'accepted' },
    });
    await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });

    await page.goto('/admin/audit?status=contradictions', { waitUntil: 'networkidle' });
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'found');
    await shoot('contradictions-found', 'state=found (Older/Newer + dates, >=640 side-by-side, <640 stacked+vs)', 'A3 + K9', SHOTS_FULL);

    await page.locator('[data-conflict-row] button[data-conflict-res="supersedes"]').first().click();
    await expect(page.locator('#audit-conflicts-resolved-status.lp-status-line-ok')).toHaveText('Resolved');
    await shoot('contradictions-resolved', 'state=resolved (StatusLine Resolved, count updated)', 'A2 + A3 + K8', SHOTS_FULL);

    const idxLines = [
      '# WP-17.13 Contact Sheets Index',
      '',
      '| File | State | Assertion |',
      '| --- | --- | --- |',
      ...manifest.map((m) => `| \`${m.file}\` | ${m.state} | ${m.assertion} |`),
      '',
    ];
    writeFileSync(join(OUT_DIR, 'INDEX.md'), idxLines.join('\n'), 'utf8');
    console.log(`Captured ${manifest.length} WP-17.13 contact sheets.`);
  });
});
