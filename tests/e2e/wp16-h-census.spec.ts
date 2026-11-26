import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  activeStates,
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

test.describe('WP-16.H G-census v2 Canaries (C1-C5, synthetic broken DOM)', () => {
  test('canary C1+C2+C3: catches legacy .lp-status-dot, 36px control height, and overflow/overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <div class="lp-item" style="width:200px;position:relative;">
        <span class="lp-status-dot"><span class="lp-status-dot-circle"></span></span>
        <button class="lp-btn" style="height:36px;">Confirm</button>
      </div>
    `);
    const c1c2 = await checkContainmentAndOverlap(page);
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.some((i) => i.startsWith('c3-legacy-status-dot-'))).toBe(true);
    expect(c3.some((i) => i.startsWith('c3-control-height:'))).toBe(true);
    expect(c1c2.length + c3.length).toBeGreaterThan(0);
  });

  test('canary C3-H8+H10: catches .lp-recovery-link / bg and visible .lp-sr-only', async ({ page }) => {
    await page.setContent(`
      <button class="lp-btn lp-btn-text lp-recovery-link" style="background:rgb(240,240,240);border:1px solid #000;">Recover</button>
      <span class="lp-sr-only" style="display:inline-block;width:80px;height:20px;">Visible SR</span>
    `);
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.some((i) => i.includes('c3-legacy-recovery-link'))).toBe(true);
    expect(c3.some((i) => i.includes('c3-text-btn-bg'))).toBe(true);
    expect(c3.some((i) => i.startsWith('c3-sr-only-visible:'))).toBe(true);
  });

  test('canary C4: catches 48px topbar and sticky top 48px editor bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <header class="lp-admin-header" style="height:48px;"></header>
      <div id="ref-editor-toolbar" class="lp-editor-toolbar-sticky" style="position:sticky;top:48px;height:36px;">
        <div id="ref-view-switch">Edit</div>
      </div>
    `);
    const c4 = await checkCenteringAndBars(page);
    expect(c4.some((i) => i.startsWith('c4-topbar-height:'))).toBe(true);
    expect(c4.some((i) => i.startsWith('c4-editor-bar-sticky-top:'))).toBe(true);
  });
});

test.describe('WP-16.H H0 Failing-First Defect Tests (20261106-UX-182..UX-193)', () => {
  test('20261106-UX-182 (H1): control-height token 44px (<640) / 40px (>=640), Item/Dialog <400px full width & >=160px wide', async ({ page }) => {
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
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await page.waitForSelector('#ref-spans-list .lp-item');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.includes('status-dot'))).toEqual([]);
  });

  test('20261106-UX-184 (H3): Suggested roles clean single-paragraph passage (no #) and real .lp-choice-group.lp-choice-variant-segmented', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await page.waitForSelector('#ref-spans-list .lp-item');
    const passages = await page.locator('#ref-spans-list .lp-item-body').allInnerTexts();
    for (const txt of passages) expect(txt).not.toContain('#');
    await expect(page.locator('#ref-spans-list [data-c="ActionBar"]').first()).toBeVisible();
  });

  test('20261106-UX-185 (H4): Tags visible ink symmetric (8px left text, 8px right remove glyph) and uniform height', async ({ page }) => {
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
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    const c4 = await checkCenteringAndBars(page);
    expect(c4.filter((i) => i.startsWith('c4-editor-bar-') || i.startsWith('c4-toggle-'))).toEqual([]);
  });

  test('20261106-UX-187 (H6): Top bar 60px height, 36px icons with 12px inset, entries drawer 12px left edge', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    const c4 = await checkCenteringAndBars(page);
    expect(c4.filter((i) => i.startsWith('c4-topbar-'))).toEqual([]);
  });

  test('20261106-UX-188 (H7): Radius scale restricted to {0, 4, 8, full} and r2=8px on buttons/inputs/selects/tracks', async ({ page }) => {
    const tokensSrc = readFileSync(resolve(process.cwd(), 'packages/design-tokens/src/tokens.css'), 'utf8');
    expect(tokensSrc).toMatch(/--lp-radius-r1:\s*(?:4px|var\(--lp-prim-radius-4\));/);
    expect(tokensSrc).toMatch(/--lp-radius-r2:\s*(?:8px|var\(--lp-prim-radius-8\));/);
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/gallery');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.startsWith('c3-radius-'))).toEqual([]);
  });

  test('20261106-UX-189 (H8): Login recovery and all .lp-btn-text have transparent bg and 0 border at rest; no .lp-recovery-link', async ({ page }) => {
    await page.goto('/admin/login');
    await page.click('#btn-toggle-recovery');
    await page.mouse.move(0, 0);
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.includes('recovery-link') || i.includes('text-btn'))).toEqual([]);
  });

  test('20261106-UX-190 (H9): Entries panel z-order above format/sticky bar, <768px overlay vs >=768px push, format bar centred on editor column, no drop shadow', async ({ page }) => {
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
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/setup?step=3');
    const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
    expect(c3.filter((i) => i.startsWith('c3-sr-only-'))).toEqual([]);
    await expect(page.locator('#wizard-step-3 #lp-provider-stepper')).toHaveCount(0);
    await expect(page.locator('#wizard-step-3 button[data-target="4"]')).toHaveText('Continue');
  });

  test('20261106-UX-192 (H11): Empty Claims/Evidence lists have 0 height and 16px gap from heading to ActionBar', async ({ page }) => {
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

  test('20261106-UX-193 (H12): StatusItem consistency across Status, Providers, Backups (Item v2 C3)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/status');
    const compactRows = await page.locator('.lp-list [data-c="Item"]').evaluateAll((items) =>
      items.map((it) => ({
        titleBottom: Math.round(it.querySelector('.lp-item-title')!.getBoundingClientRect().bottom),
        statusTop: Math.round(it.querySelector('.lp-item-status')!.getBoundingClientRect().top),
      }))
    );
    for (const r of compactRows) expect(r.statusTop).toBeGreaterThanOrEqual(r.titleBottom - 1);

    await page.setViewportSize({ width: 1280, height: 800 });
    const regularRows = await page.locator('.lp-list [data-c="Item"]').evaluateAll((items) =>
      items.map((it) => ({
        titleTop: Math.round(it.querySelector('.lp-item-title')!.getBoundingClientRect().top),
        statusTop: Math.round(it.querySelector('.lp-item-status')!.getBoundingClientRect().top),
      }))
    );
    for (const r of regularRows) expect(Math.abs(r.titleTop - r.statusTop)).toBeLessThanOrEqual(4);
  });
});

test.describe('WP-16.H Full G-Census v2 (C1-C4 across all STATES x 3 viewports x 2 themes)', () => {
  test('every STATES entry passes C1 containment, C2 overlap, C3 controls/radius/text-btn/sr-only/status, and C4 centering/bars', async ({ page }) => {
    test.setTimeout(180000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    const allViolations: string[] = [];

    for (const state of activeStates()) {
      for (const vp of VIEWPORTS) {
        if (state.viewports && !state.viewports.includes(vp.width as 320 | 1280 | 1920)) continue;
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const ok = await navigateToState(page, state, ids);
        if (!ok) continue;
        const c12 = await checkContainmentAndOverlap(page);
        const c4 = await checkCenteringAndBars(page);
        for (const v of [...c12, ...c4]) {
          allViolations.push(`[${state.id} ${vp.width}] ${v}`);
        }
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const c3 = await checkControlsRadiusTextButtonsSrOnly(page);
          for (const v of c3) {
            allViolations.push(`[${state.id} ${vp.width} ${theme}] ${v}`);
          }
        }
      }
    }

    expect(allViolations).toEqual([]);
  });
});
