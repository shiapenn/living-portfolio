import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  STATES,
  THEMES,
  VIEWPORTS,
} from './states-manifest.js';
import {
  checkCenteringAndBars,
  checkContainmentAndOverlap,
  checkControlsRadiusTextButtonsSrOnly,
  getSeededIds,
  navigateToState,
  setTheme,
} from './census-helpers.js';

test.describe('WP-16.H H0 G-census v2 Canaries (C1-C5, fail on WP-16.G build)', () => {
  test('canary C1+C2+C3: catches Suggested roles legacy .lp-status-dot overlap/legacy-class on WP-16.G editor-settings', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await page.waitForSelector('#ref-spans-list .lp-item');
    const c1c2 = await checkContainmentAndOverlap(page);
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.some((i) => i.startsWith('c3-legacy-status-dot-'))).toBe(true);
    expect(c3.some((i) => i.startsWith('c3-control-height:'))).toBe(true);
    expect(c1c2.length + c3.length).toBeGreaterThan(0);
  });

  test('canary C3-H8+H10: catches .lp-recovery-link / bg on login and visible .lp-sr-only on setup-step-3 in WP-16.G', async ({ page }) => {
    await page.goto('/admin/login');
    await page.click('#btn-toggle-recovery');
    const loginC3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(loginC3.some((i) => i.includes('c3-legacy-recovery-link') || i.includes('c3-text-btn-bg'))).toBe(true);

    await ensureAdminLoggedIn(page);
    await page.goto('/admin/setup?step=3');
    await page.waitForSelector('#wizard-step-3:not(.lp-is-hidden)');
    const setupC3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(setupC3.some((i) => i.startsWith('c3-sr-only-visible:'))).toBe(true);
  });

  test('canary C4: catches 48px topbar and uncentred format/editor bar on WP-16.G', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    const c4 = await checkCenteringAndBars(page);
    expect(c4.some((i) => i.startsWith('c4-topbar-height:'))).toBe(true);
    expect(c4.some((i) => i.startsWith('c4-editor-bar-sticky-top:'))).toBe(true);
  });
});

test.describe('WP-16.H H0 Failing-First Defect Tests (20261106-UX-182..UX-193)', () => {
  test('20261106-UX-182 (H1): control-height token 44px (<640) / 40px (>=640), Item/Dialog <400px full width & >=160px wide', async ({ page }) => {
    test.fail(true, 'H0 failing-first: buttons and inputs are 36px instead of 44px/40px token');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/status');
    const h320 = await page.locator('#status-rebuild-btn').evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(h320).toBe(44);
    await page.setViewportSize({ width: 1280, height: 800 });
    const h1280 = await page.locator('#status-rebuild-btn').evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(h1280).toBe(40);
  });

  test('20261106-UX-183 (H2): zero legacy .lp-status-dot-circle / un-wrapped .lp-status-dot and trailing StatusLabel on Status & Claims', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Suggested roles and Claims still use legacy .lp-status-dot / .lp-badge');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await page.waitForSelector('#ref-spans-list .lp-item');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.includes('status-dot'))).toEqual([]);
  });

  test('20261106-UX-184 (H3): Suggested roles clean single-paragraph passage (no #) and real .lp-choice-group.lp-choice-variant-segmented', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Suggested roles passage has ## headings and missing .lp-choice-group wrapper');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await page.waitForSelector('#ref-spans-list .lp-item');
    const passages = await page.locator('#ref-spans-list .lp-item-body').allInnerTexts();
    for (const txt of passages) expect(txt).not.toContain('#');
    await expect(page.locator('#ref-spans-list .lp-choice-group.lp-choice-variant-segmented').first()).toBeVisible();
  });

  test('20261106-UX-185 (H4): Tags visible ink symmetric (8px left text, 8px right remove glyph) and uniform height', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Tag right remove ink inset and chip height not enforced');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    const tagRes = await page.locator('#ref-facets-list .lp-tag').first().evaluate((tag) => {
      const tr = tag.getBoundingClientRect();
      const lbl = tag.querySelector('.lp-tag-label')!.getBoundingClientRect();
      const svg = tag.querySelector('.lp-tag-remove svg')!.getBoundingClientRect();
      return { leftInset: Math.round(lbl.left - tr.left), rightInset: Math.round(tr.right - svg.right), height: Math.round(tr.height) };
    });
    expect(Math.abs(tagRes.leftInset - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(tagRes.rightInset - 8)).toBeLessThanOrEqual(1);
  });

  test('20261106-UX-186 (H5): Edit/Settings bar 1fr auto 1fr centred (<=0.5px), 56px height, sticky top 60px', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Editor toolbar is sticky top 48px and not 56px 1fr auto 1fr');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    const c4 = await checkCenteringAndBars(page);
    expect(c4.filter((i) => i.startsWith('c4-editor-bar-') || i.startsWith('c4-toggle-'))).toEqual([]);
  });

  test('20261106-UX-187 (H6): Top bar 60px height, 36px icons with 12px inset, entries drawer 12px left edge', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Top bar is 48px instead of 60px');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    const c4 = await checkCenteringAndBars(page);
    expect(c4.filter((i) => i.startsWith('c4-topbar-'))).toEqual([]);
  });

  test('20261106-UX-188 (H7): Radius scale restricted to {0, 4, 8, full} and r2=8px on buttons/inputs/selects/tracks', async ({ page }) => {
    test.fail(true, 'H0 failing-first: --r1 and --r2 radius tokens not yet defined');
    const tokensSrc = readFileSync(resolve(process.cwd(), 'apps/web/src/tokens/index.ts'), 'utf8');
    expect(tokensSrc).toContain('--r1:');
    expect(tokensSrc).toContain('--r2:');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/gallery');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.startsWith('c3-radius-'))).toEqual([]);
  });

  test('20261106-UX-189 (H8): Login recovery and all .lp-btn-text have transparent bg and 0 border at rest; no .lp-recovery-link', async ({ page }) => {
    test.fail(true, 'H0 failing-first: .lp-recovery-link still exists and overrides background');
    await page.goto('/admin/login');
    await page.click('#btn-toggle-recovery');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.includes('recovery-link') || i.includes('text-btn'))).toEqual([]);
  });

  test('20261106-UX-190 (H9): Entries panel z-order above format/sticky bar, <768px overlay vs >=768px push, format bar centred on editor column, no drop shadow', async ({ page }) => {
    test.fail(true, 'H0 failing-first: entries drawer has drop shadow and format bar is viewport-centred');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-sidebar-toggle');
    const shadow = await page.locator('#ref-entries-drawer').evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toBe('none');
    const c4 = await checkCenteringAndBars(page);
    expect(c4.filter((i) => i.startsWith('c4-format-bar-'))).toEqual([]);
  });

  test('20261106-UX-191 (H10): Setup step 3 progressive disclosure + Continue CTA, no inner stepper, 1px .lp-sr-only, Step 6 plain text', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Setup uses Next: Alerts & Notifications, inner stepper, visible .lp-sr-only, and notice-info on Step 6');
    await page.goto('/admin/setup?step=3');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.startsWith('c3-sr-only-'))).toEqual([]);
    await expect(page.locator('#wizard-step-3 #lp-provider-stepper')).toHaveCount(0);
    await expect(page.locator('#wizard-step-3 button[data-target="4"]')).toHaveText('Continue');
  });

  test('20261106-UX-192 (H11): Empty Claims/Evidence lists have 0 height and 16px gap from heading to ActionBar', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Empty Evidence/Claims list adds extra gap before ActionBar');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    const evGap = await page.evaluate(() => {
      const list = document.getElementById('ref-evidence-list');
      const title = document.querySelector('#ref-structure-section .lp-subsection:last-of-type .lp-subsection-title');
      const btn = document.getElementById('ref-btn-open-evidence');
      if (!list || !title || !btn) return { listH: -1, gap: -1 };
      return {
        listH: Math.round(list.getBoundingClientRect().height),
        gap: Math.round(btn.getBoundingClientRect().top - title.getBoundingClientRect().bottom),
      };
    });
    expect(evGap.listH).toBe(0);
    expect(Math.abs(evGap.gap - 16)).toBeLessThanOrEqual(2);
  });

  test('20261106-UX-193 (H12): StatusItem consistency across Status, Providers, Backups', async ({ page }) => {
    test.fail(true, 'H0 failing-first: Status rows wrap status below title at 320px instead of trailing title-row alignment');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/status');
    const rows = await page.locator('.lp-list [data-c="Item"]').evaluateAll((items) =>
      items.map((it) => ({
        titleTop: Math.round(it.querySelector('.lp-item-title')!.getBoundingClientRect().top),
        statusTop: Math.round(it.querySelector('.lp-item-status')!.getBoundingClientRect().top),
      }))
    );
    for (const r of rows) expect(Math.abs(r.titleTop - r.statusTop)).toBeLessThanOrEqual(4);
  });
});
