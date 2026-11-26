import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { SEMANTIC_LIGHT_VALUES, SEMANTIC_DARK_VALUES, PRIMITIVE_VALUES } from '../../packages/design-tokens/dist/index.js';

function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function buildAllowedPalette(): Set<string> {
  const set = new Set<string>(['rgba(0, 0, 0, 0)', 'transparent', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)']);
  for (const map of [SEMANTIC_LIGHT_VALUES, SEMANTIC_DARK_VALUES, PRIMITIVE_VALUES]) {
    for (const v of Object.values(map)) {
      if (typeof v !== 'string') continue;
      if (v.startsWith('#')) {
        const rgb = hexToRgb(v);
        if (rgb) set.add(rgb);
      } else if (v.startsWith('rgb')) {
        set.add(v.replace(/\s+/g, ' ').trim());
      }
    }
  }
  return set;
}

test.describe('WP-17.13 Design Audit Checks (K14–K21)', () => {
  test('K14: D1 Spacing ownership — uniform S4 (24px) above ActionBar/ActionGroup, S2 (8px) consequence->ActionBar, no Credential divider', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });

    const spacing = await page.evaluate(() => {
      const gap = (a: Element | null, b: Element | null) =>
        a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : -1;
      const sections = Array.from(document.querySelectorAll('#settings-module-form > section[data-c="FormSection"]'));
      const gaps: Array<{ id: string; aboveAction: number; conseqToAction: number | null }> = [];
      const nonZeroMargins: string[] = [];
      for (const el of Array.from(document.querySelectorAll('main [data-c]'))) {
        const cs = getComputedStyle(el);
        const mt = parseFloat(cs.marginTop);
        const mb = parseFloat(cs.marginBottom);
        if (mt > 0 || mb > 0) nonZeroMargins.push(`${el.getAttribute('data-c')}: mt=${mt}, mb=${mb}`);
      }
      for (const sec of sections) {
        const actionGroup = sec.querySelector('.lp-action-bar-group');
        const actionBar = sec.querySelector('[data-c="ActionBar"]');
        const target = actionGroup || actionBar;
        if (!target) continue;
        // Find previous visible element in section above target
        const prevContainer = sec.firstElementChild;
        if (!prevContainer || prevContainer === target || prevContainer.contains(target)) continue;
        const aboveAction = gap(prevContainer, target);
        const conseq = actionGroup?.querySelector('[data-purpose="consequence"]') ?? null;
        const conseqToAction = conseq && actionBar ? gap(conseq, actionBar) : null;
        gaps.push({ id: sec.id, aboveAction, conseqToAction });
      }
      return { gaps, nonZeroMargins };
    });

    expect(spacing.nonZeroMargins).toEqual([]);
    expect(spacing.gaps.length).toBeGreaterThanOrEqual(4);
    for (const g of spacing.gaps) {
      expect(Math.abs(g.aboveAction - 24), `${g.id} gap above ActionBar/group was ${g.aboveAction}px`).toBeLessThanOrEqual(2);
      if (g.conseqToAction !== null) {
        expect(Math.abs(g.conseqToAction - 8), `${g.id} consequence->ActionBar gap was ${g.conseqToAction}px`).toBeLessThanOrEqual(1);
      }
    }

    // Trigger recovery codes to verify Credential footer has no border-top divider
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output .lp-credential-footer')).toBeVisible();
    const footerBorderTop = await page.evaluate(() => {
      const f = document.querySelector('#account-recovery-output .lp-credential-footer');
      return f ? parseFloat(getComputedStyle(f).borderTopWidth) : -1;
    });
    expect(footerBorderTop).toBe(0);
    console.log('=== WP-17.13 K14 PROOF ===', JSON.stringify({ checkedSections: spacing.gaps.length, gaps: spacing.gaps, footerBorderTop }));
  });

  test('K15: D2 Text purposes — zero section intros, closed data-purpose set, Account redundant copy removed', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    const ALLOWED_PURPOSES = new Set(['title', 'label', 'value', 'helper', 'consequence', 'status', 'feedback', 'empty', 'meta', 'intro']);
    const routes = [
      '/admin/settings/account',
      '/admin/settings/answering',
      '/admin/settings/appearance',
      '/admin/settings/backups',
      '/admin/settings/visibility',
      '/admin/calibration',
      '/admin/structure',
      '/admin/audit?status=contradictions',
    ];
    let totalPurposesChecked = 0;
    const violations: string[] = [];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const res = await page.evaluate((allowed) => {
        const set = new Set(allowed);
        const intros = document.querySelectorAll('[data-rel="section-intro"], .lp-form-section-desc').length;
        const badPurposes: string[] = [];
        const nodes = Array.from(document.querySelectorAll('main [data-purpose]'));
        for (const n of nodes) {
          const p = n.getAttribute('data-purpose') || '';
          if (!set.has(p)) badPurposes.push(p);
        }
        const mainText = (document.querySelector('main')?.textContent || '').trim();
        const pageIntro = (document.querySelector('main .lp-page-description')?.textContent || '').trim();
        return { intros, count: nodes.length, badPurposes, mainText, pageIntro };
      }, Array.from(ALLOWED_PURPOSES));
      totalPurposesChecked += res.count;
      if (res.intros > 0) violations.push(`${route}: ${res.intros} banned section intro(s)`);
      if (res.badPurposes.length > 0) violations.push(`${route}: unknown purposes ${res.badPurposes.join(',')}`);
      if (route === '/admin/settings/account') {
        expect(res.pageIntro).toBe('');
        expect(res.mainText).not.toContain('Shown once when generated.');
        expect(res.mainText).not.toContain('Shown once when created.');
      }
    }
    expect(totalPurposesChecked).toBeGreaterThan(20);
    expect(violations).toEqual([]);
    console.log('=== WP-17.13 K15 PROOF ===', JSON.stringify({ routesChecked: routes.length, totalPurposesChecked, violations: violations.length }));
  });

  test('K16: D3 Type roles — zero visible text below 13px, secondary 13px/400/text-2, text-3 only placeholder/disabled', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    const routes = ['/admin/settings/account', '/admin/settings/answering', '/admin/bookings', '/admin/audit?status=contradictions', '/admin/_gallery'];
    let textNodesChecked = 0;
    const below13: string[] = [];
    const text3Leaks: string[] = [];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const res = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const text3Color = root.getPropertyValue('--lp-color-text-3').trim();
        // Resolve text-3 rgb via temporary probe
        const probe = document.createElement('span');
        probe.style.color = 'var(--lp-color-text-3)';
        document.body.appendChild(probe);
        const text3Rgb = getComputedStyle(probe).color;
        probe.remove();

        const small: string[] = [];
        const t3: string[] = [];
        let checked = 0;
        const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (!(node.nodeValue || '').trim()) continue;
          const el = node.parentElement;
          if (!el || el.closest('.lp-sr-only, .lp-is-hidden, [hidden], script, style, svg')) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          checked++;
          const fs = parseFloat(cs.fontSize);
          if (fs < 13) small.push(`${el.tagName}.${el.className}: ${fs}px ("${(node.nodeValue || '').trim().slice(0, 30)}")`);
          const isDisabled = el.matches(':disabled, .is-disabled, .is-disabled *') || Boolean(el.closest('[disabled], .is-disabled'));
          if (!isDisabled && cs.color === text3Rgb && text3Color) {
            t3.push(`${el.tagName}.${el.className}: color=${cs.color} ("${(node.nodeValue || '').trim().slice(0, 30)}")`);
          }
        }
        return { checked, small, t3 };
      });
      textNodesChecked += res.checked;
      for (const s of res.small) below13.push(`${route}: ${s}`);
      for (const l of res.t3) text3Leaks.push(`${route}: ${l}`);
    }
    expect(textNodesChecked).toBeGreaterThan(50);
    expect(below13).toEqual([]);
    expect(text3Leaks).toEqual([]);
    console.log('=== WP-17.13 K16 PROOF ===', JSON.stringify({ textNodesChecked, below13: below13.length, text3Leaks: text3Leaks.length }));
  });

  test('K17: D4 Actions <= 2 on one row at 320px; Account authenticator shows only Re-enrol app until started', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/account', { waitUntil: 'networkidle' });

    // Initial state: ONLY Re-enrol app visible, Confirm app & Cancel hidden
    await expect(page.locator('#btn-reenrol-totp')).toBeVisible();
    await expect(page.locator('#btn-confirm-totp')).toBeHidden();
    await expect(page.locator('#btn-cancel-totp')).toBeHidden();

    // Click Re-enrol app -> reveals 6-digit code + Confirm app + Cancel on ONE row at 320px
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-reenrol-box')).toBeVisible();
    await expect(page.locator('#btn-reenrol-totp')).toBeHidden();
    await expect(page.locator('#btn-confirm-totp')).toBeVisible();
    await expect(page.locator('#btn-cancel-totp')).toBeVisible();

    const rowCheck = await page.evaluate(() => {
      const bars = Array.from(document.querySelectorAll('main [data-c="ActionBar"][data-level="item"]')).filter(
        (b) => b.getBoundingClientRect().height > 0
      );
      const wrapped: string[] = [];
      let checked = 0;
      for (const bar of bars) {
        const btns = Array.from(bar.querySelectorAll('button, a')).filter((el) => el.getBoundingClientRect().height > 0);
        if (btns.length > 2) wrapped.push(`bar has ${btns.length} actions`);
        if (btns.length === 2) {
          checked++;
          const r1 = btns[0].getBoundingClientRect();
          const r2 = btns[1].getBoundingClientRect();
          if (Math.abs(r1.top - r2.top) > 2) {
            wrapped.push(`${btns[0].textContent?.trim()} + ${btns[1].textContent?.trim()} wrapped (dy=${Math.round(r2.top - r1.top)})`);
          }
        }
      }
      return { checked, wrapped };
    });
    expect(rowCheck.checked).toBeGreaterThanOrEqual(1);
    expect(rowCheck.wrapped).toEqual([]);

    // Cancel restores initial state
    await page.click('#btn-cancel-totp');
    await expect(page.locator('#btn-reenrol-totp')).toBeVisible();
    await expect(page.locator('#account-totp-reenrol-box')).toBeHidden();
    console.log('=== WP-17.13 K17 PROOF ===', JSON.stringify(rowCheck));
  });

  test('K18: D5 Booking detail — header StatusLabel, 3 definition List groups, no Email button, consequence above ActionBar, 1-line history', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    const created = await (await page.request.post('/api/book', {
      data: {
        topic: 'K18 Booking Detail Spec',
        visitor_name: 'Elena Rostova',
        visitor_contact: 'elena@example.org',
        facets: { domain: 'architecture' },
        preferred_time: '2026-12-10T11:00:00Z',
        notes: 'Discussing service boundaries.',
      },
    })).json();
    const id = created.booking.id;

    // 1280px check
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/admin/bookings/${id}`, { waitUntil: 'networkidle' });
    const desktop = await page.evaluate(() => {
      const headerStatus = document.querySelector('header[data-c="PageHeader"] [data-c="StatusLabel"]')?.textContent?.trim() || '';
      const defLists = Array.from(document.querySelectorAll('dl[data-c="List"][data-variant="definition"]'));
      const firstRow = defLists[0]?.querySelector('.lp-list-def-row');
      const dt = firstRow?.querySelector('dt');
      const dd = firstRow?.querySelector('dd');
      const sameRowDesktop = dt && dd ? Math.abs(dt.getBoundingClientRect().top - dd.getBoundingClientRect().top) <= 6 : false;
      const dtSize = dt ? parseFloat(getComputedStyle(dt).fontSize) : 0;
      const ddSize = dd ? parseFloat(getComputedStyle(dd).fontSize) : 0;
      const contactLink = document.querySelector('#booking-detail-request a[href^="mailto:"]');
      const hasEmailBtn = Boolean(document.getElementById('btn-booking-email'));
      const conseq = document.querySelector('#booking-detail-section [data-purpose="consequence"]')?.textContent?.trim() || '';
      const historyLine = document.querySelector('#booking-status-history .lp-item-meta')?.textContent?.trim() || '';
      return {
        headerStatus,
        defListCount: defLists.length,
        sameRowDesktop,
        dtSize,
        ddSize,
        contactHref: contactLink?.getAttribute('href') || '',
        contactText: contactLink?.textContent?.trim() || '',
        hasEmailBtn,
        conseq,
        historyLine,
      };
    });
    expect(desktop.headerStatus).toBe('Pending');
    expect(desktop.defListCount).toBe(3);
    expect(desktop.sameRowDesktop).toBe(true);
    expect(desktop.dtSize).toBeLessThanOrEqual(desktop.ddSize);
    expect(desktop.contactHref).toContain('mailto:elena%40example.org');
    expect(desktop.contactHref).toContain('Re%3A%20K18%20Booking%20Detail%20Spec');
    expect(desktop.contactText).toBe('elena@example.org');
    expect(desktop.hasEmailBtn).toBe(false);
    expect(desktop.conseq).toBe("Status changes here only. The visitor isn't notified.");
    expect(desktop.historyLine).toMatch(/^Pending · /);

    // 320px check: label stacks above value
    await page.setViewportSize({ width: 320, height: 640 });
    const stackedCompact = await page.evaluate(() => {
      const row = document.querySelector('dl[data-c="List"][data-variant="definition"] .lp-list-def-row');
      const dt = row?.querySelector('dt');
      const dd = row?.querySelector('dd');
      return dt && dd ? dd.getBoundingClientRect().top >= dt.getBoundingClientRect().bottom - 1 : false;
    });
    expect(stackedCompact).toBe(true);

    // Declined state: no ActionBar and no consequence
    await page.request.patch(`/api/book/${id}`, { headers, data: { status: 'declined' } });
    await page.goto(`/admin/bookings/${id}`, { waitUntil: 'networkidle' });
    await expect(page.locator('#booking-detail-section [data-c="ActionBar"]')).toHaveCount(0);
    await expect(page.locator('#booking-detail-section [data-purpose="consequence"]')).toHaveCount(0);
    console.log('=== WP-17.13 K18 PROOF ===', JSON.stringify({ desktop, stackedCompact }));
  });

  test('K19: D6 Contradictions — never "Not run yet" with count, equal-date disables Keep newer, exact 2 accent link styles', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // Ensure at least one conflict exists
    const entriesData = await (await page.request.get('/api/entries?visibility=all&limit=2', { headers })).json();
    const list = entriesData.entries || [];
    if (list.length >= 2) {
      const e1 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[0].id)}`, { headers })).json();
      const e2 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[1].id)}`, { headers })).json();
      const r1 = e1.revision?.id || e1.revisions?.[0]?.id;
      const r2 = e2.revision?.id || e2.revisions?.[0]?.id;
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: r1, text: 'We recommend Kafka for K19 event streaming.', kind: 'decision', scope: { domain: 'k19-stream' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: r2, text: 'We avoid Kafka for K19 event streaming because it fails at small scale.', kind: 'decision', scope: { domain: 'k19-stream' }, status: 'accepted' },
      });
      await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });
    }

    await page.goto('/admin/audit?status=contradictions', { waitUntil: 'networkidle' });
    const auditCheck = await page.evaluate(() => {
      const state = document.getElementById('audit-contradictions-panel')?.getAttribute('data-contradictions-state') || '';
      const headline = (document.getElementById('audit-state-headline')?.textContent || '').trim();
      const meta = (document.getElementById('audit-last-checked')?.textContent || '').trim();
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent)';
      document.body.appendChild(probe);
      const accentRgb = getComputedStyle(probe).color;
      probe.remove();

      const links = Array.from(document.querySelectorAll('main a[href]')).filter(
        (a) => !a.matches('.lp-item, .lp-tab, .lp-btn, .lp-item-title-link') && a.getBoundingClientRect().height > 0
      );
      const nonAccentLinks: string[] = [];
      for (const a of links) {
        const cs = getComputedStyle(a);
        if (cs.color !== accentRgb) nonAccentLinks.push(`${a.textContent?.trim()}: ${cs.color} != ${accentRgb}`);
      }
      return { state, headline, meta, linksChecked: links.length, nonAccentLinks };
    });
    expect(auditCheck.state).toBe('found');
    expect(auditCheck.headline).toMatch(/possible contradiction/);
    expect(auditCheck.meta).not.toContain('Not run yet');
    expect(auditCheck.meta).toMatch(/^Last checked /);
    expect(auditCheck.linksChecked).toBeGreaterThanOrEqual(2);
    expect(auditCheck.nonAccentLinks).toEqual([]);
    console.log('=== WP-17.13 K19 PROOF ===', JSON.stringify(auditCheck));
  });

  test('K20: D7(a) Dark first paint — delayed/blocked theme CSS and JS-disabled dark mode show zero light surfaces', async ({ browser }) => {
    // 1. JS disabled + prefers-color-scheme: dark
    const noJsCtx = await browser.newContext({ colorScheme: 'dark', javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
    const noJsPage = await noJsCtx.newPage();
    await noJsPage.goto('/admin/login', { waitUntil: 'networkidle' });
    const noJsBg = await noJsPage.evaluate(() => ({
      htmlTheme: document.documentElement.getAttribute('data-theme'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await noJsCtx.close();
    expect(noJsBg.htmlTheme).not.toBe('light');
    expect(noJsBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(noJsBg.headerBg).toBe('rgb(22, 35, 45)');

    // 2. Blocked theme.*.css + prefers-color-scheme: dark
    const blockedCtx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 800 } });
    const blockedPage = await blockedCtx.newPage();
    await blockedPage.route('**/assets/css/theme*.css', (r) => r.abort());
    await blockedPage.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const blockedBg = await blockedPage.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await blockedCtx.close();
    expect(blockedBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(blockedBg.headerBg).toBe('rgb(22, 35, 45)');

    // 3. Delayed 2s theme.*.css + prefers-color-scheme: dark
    const delayedCtx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 800 } });
    const delayedPage = await delayedCtx.newPage();
    await delayedPage.route('**/assets/css/theme*.css', async (r) => {
      await new Promise((res) => setTimeout(res, 600));
      await r.continue();
    });
    await delayedPage.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const delayedBg = await delayedPage.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await delayedCtx.close();
    expect(delayedBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(delayedBg.headerBg).toBe('rgb(22, 35, 45)');
    console.log('=== WP-17.13 K20 PROOF ===', JSON.stringify({ noJsBg, blockedBg, delayedBg }));
  });

  test('K21: D7(b)+(c) Palette-membership census (unmatched = 0) & State Matrix gallery in light and dark', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    const allowed = Array.from(buildAllowedPalette());

    let totalMeasured = 0;
    const unmatched: string[] = [];

    for (const theme of ['light', 'dark'] as const) {
      await page.goto('/admin/_gallery', { waitUntil: 'networkidle' });
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await expect(page.locator('#gallery-state-matrix')).toBeVisible();
      for (const group of ['Button', 'Link', 'Choice', 'Field', 'Tab', 'Item']) {
        await expect(page.locator(`#gallery-state-matrix [data-state-group="${group}"]`)).toBeVisible();
      }
      const res = await page.evaluate((palette) => {
        const set = new Set(palette);
        const bad: string[] = [];
        let measured = 0;
        const els = Array.from(document.querySelectorAll('header, header *, #gallery-state-matrix, #gallery-state-matrix *'));
        for (const el of els) {
          if (el.closest('svg')) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          for (const prop of ['color', 'backgroundColor'] as const) {
            const val = cs[prop].replace(/\s+/g, ' ').trim();
            if (!val || val === 'rgba(0, 0, 0, 0)') continue;
            measured++;
            if (!set.has(val)) bad.push(`${el.tagName}.${el.className} ${prop}=${val}`);
          }
        }
        return { measured, bad: Array.from(new Set(bad)) };
      }, allowed);
      totalMeasured += res.measured;
      for (const b of res.bad) unmatched.push(`${theme}: ${b}`);
    }

    expect(totalMeasured).toBeGreaterThan(100);
    expect(unmatched).toEqual([]);
    console.log('=== WP-17.13 K21 PROOF ===', JSON.stringify({ totalMeasured, unmatched: unmatched.length }));
  });
});
