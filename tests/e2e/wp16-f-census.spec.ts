import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES, THEMES, VIEWPORTS } from './states-manifest.js';
import {
  checkColoursAndNativeControls,
  checkEditorEdgeAlignment,
  checkLines,
  checkPaintedGaps,
  checkRenderedText,
  getSeededIds,
  navigateToState,
  setTheme,
} from './census-helpers.js';

test.describe('WP-16.F F0 Canaries (must pass: prove checks catch real defects)', () => {
  test('canary: painted-gap check ignores hidden 80px spacer and catches painted 80px gap & collapsed margin', async ({ page }) => {
    await page.setContent(`
      <main>
        <div class="lp-page-header"><h1>Title</h1></div>
        <div style="display:none; height:80px;"></div>
        <div style="height:80px; width:100px;"><!-- empty wrapper --></div>
        <p id="p1" style="margin-top:0">First painted block</p>
        <p id="p2" style="margin-top:80px">Second painted block (80px gap)</p>
      </main>
    `);
    const res = await checkPaintedGaps(page);
    expect(res.violations.some((v) => v.includes('oversized-painted-gap'))).toBe(true);
  });

  test('canary: rendered-text check catches arrows, internal words, <slug>, and raw JSON', async ({ page }) => {
    await page.setContent(`
      <main>
        <button>Next: Model Providers -></button>
        <label>Add facet tag</label>
        <p>Publishes at /writing/&lt;slug&gt;</p>
        <p>{"status":"ok"}</p>
      </main>
    `);
    const issues = await checkRenderedText(page);
    expect(issues.some((i) => i.startsWith('arrow:'))).toBe(true);
    expect(issues.some((i) => i.startsWith('internal-word:'))).toBe(true);
    expect(issues.some((i) => i.startsWith('placeholder:'))).toBe(true);
    expect(issues.some((i) => i.startsWith('raw-json:'))).toBe(true);
  });

  test('canary: colour check catches white native select in dark mode', async ({ page }) => {
    await page.setContent(`
      <style>:root { color-scheme: light; --surface-page: #0F1A22; }</style>
      <main><select id="c-select" style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);"><option>A</option></select></main>
    `);
    const issues = await checkColoursAndNativeControls(page, 'dark');
    expect(issues.some((i) => i.includes('dark-native-select-bg'))).toBe(true);
    expect(issues.some((i) => i.includes('color-scheme'))).toBe(true);
  });

  test('canary: line check catches missing top-bar hairline and forbidden hr', async ({ page }) => {
    await page.setContent(`
      <header class="lp-top-bar" style="border-bottom: 0;"></header>
      <main><hr /></main>
    `);
    const issues = await checkLines(page, { hasTopBar: true });
    expect(issues.some((i) => i.includes('missing-top-bar-bottom-hairline'))).toBe(true);
    expect(issues.some((i) => i.includes('forbidden-hr-count'))).toBe(true);
  });

  test('canary: edge-alignment check catches Save 4px off top bar right edge and format bar 116px above bottom', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <div style="position:relative; width:100%;">
        <button id="lp-account-menu-btn" style="position:absolute; right:24px; width:36px; height:36px;">U</button>
        <button id="ref-btn-save" style="position:absolute; right:28px; top:50px; width:60px; height:36px;">Save</button>
        <div id="ref-format-bar" style="position:fixed; bottom:116px; left:400px; height:36px;">B</div>
      </div>
    `);
    const issues = await checkEditorEdgeAlignment(page);
    expect(issues.some((i) => i.includes('right-edge-mismatch'))).toBe(true);
    expect(issues.some((i) => i.includes('format-bar-bottom-dist'))).toBe(true);
  });
});

test.describe('WP-16.F F0 Named Failing-First Defect Tests (UX-157..UX-169)', () => {
  test('20261106-UX-157: rendered-text & dark native select & STATES manifest coverage', async ({ page }) => {
    test.fail(true, 'F0 failing-first: setup has arrows, editor Settings has white native select in dark mode');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    // Setup rendered text has arrows
    await page.goto('/admin/setup');
    const setupTextIssues = await checkRenderedText(page);
    expect(setupTextIssues).toEqual([]);

    // Editor Settings dark mode native select
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await setTheme(page, 'dark');
    await page.click('#ref-switch-settings');
    const colourIssues = await checkColoursAndNativeControls(page, 'dark');
    expect(colourIssues).toEqual([]);
  });

  test('20261106-UX-158: painted-gap check catches oversized tabs/description gaps and touching sections', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Answer rules / Inbox tabs gap ~130px, History/Import/Settings description gaps');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const route of ['/admin/audit', '/admin/inbox', '/admin/import', '/admin/settings/answering']) {
      await page.goto(route);
      const { violations } = await checkPaintedGaps(page);
      expect(violations, `Route ${route}`).toEqual([]);
    }
  });

  test('20261106-UX-159: hairlines between Items and top bar bottom line and L1 surface separation', async ({ page }) => {
    test.fail(true, 'F0 failing-first: missing Item hairlines and top-bar bottom hairline');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/entries');
    const lineIssues = await checkLines(page, { hasTopBar: true });
    expect(lineIssues).toEqual([]);
  });

  test('20261106-UX-160: login narrow 400px & setup 720px padding without full-bleed stepper line', async ({ page }) => {
    test.fail(true, 'F0 failing-first: login full width, setup flush at 320/1280, Back has arrow');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/login');
    const mainWidth = await page.locator('main').evaluate((el) => el.getBoundingClientRect().width);
    expect(mainWidth).toBeLessThanOrEqual(400);
    await page.goto('/admin/setup');
    const issues = await checkRenderedText(page);
    expect(issues).toEqual([]);
  });

  test('20261106-UX-161: Publish dialog stacked ActionBar, no left empty slot, real slug', async ({ page }) => {
    test.fail(true, 'F0 failing-first: dialog buttons side by side and literal /writing/<slug>');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/entries/new');
    await page.click('#ref-switch-settings');
    await page.click('#ref-btn-publish');
    const dialogText = await page.locator('[role="dialog"]').innerText();
    expect(dialogText).not.toContain('<slug>');
  });

  test('20261106-UX-162: Editor header 1fr auto 1fr, right-edge alignment, centred switch, format bar at 16px', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Save 4px off right edge, switch left-aligned, format bar 116px above bottom');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    const issues = await checkEditorEdgeAlignment(page);
    expect(issues).toEqual([]);
  });

  test('20261106-UX-163: Editor Settings Structure (Level progress bar, themed Tag chips, Suggested roles passage & Accept/Ignore)', async ({ page }) => {
    test.fail(true, 'F0 failing-first: stateless level line, unthemed chips, missing role passage');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await expect(page.locator('.lp-level-bar[aria-readonly="true"]')).toBeVisible();
  });

  test('20261106-UX-164: Settings modules vertical fields & no Back link on top-level pages', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Back link appears on top-level Settings modules');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/answering');
    await expect(page.locator('.lp-back-link')).toHaveCount(0);
  });

  test('20261106-UX-165: Providers D-PROV journey (single Answering model Item + /admin/settings/providers/change)', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Providers lists all providers with key fields');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/providers');
    await expect(page.locator('main .lp-item')).toHaveCount(1);
    await expect(page.locator('main .lp-item-title')).toContainText('Answering model');
  });

  test('20261106-UX-166: Status single 4-Item list with no section headings & Local counts as configured', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Status has repeated headings and says 0 configured providers');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/status');
    await expect(page.locator('main h2')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('0 configured providers');
  });

  test('20261106-UX-167: Today description is "What needs your attention." and count rows have no status label', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Today promises unshown recent drafts and health');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin');
    await expect(page.locator('.lp-page-description')).toHaveText('What needs your attention.');
  });

  test('20261106-UX-168: Answer rules status on title row (desktop) / under title (mobile) & "From your reply" caption', async ({ page }) => {
    test.fail(true, 'F0 failing-first: Answer rules uses "Source quote" label and status sits next to button on mobile');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/audit');
    await expect(page.locator('main')).not.toContainText('Source quote');
  });

  test('20261106-UX-169: Copy terminology updated across admin UI', async ({ page }) => {
    test.fail(true, 'F0 failing-first: legacy terms Role profile / Temporal confidence / Facets / Topic still rendered');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/Role profile|Temporal confidence|Facets|Add facet tag/i);
  });
});

test.describe('WP-16.F F0 Full STATES Manifest Census (failing-first)', () => {
  test('STATES manifest covers all pages, views, and overlays across 2 themes x 320/1280/1920', async ({ page }) => {
    test.fail(true, 'F0 failing-first: full STATES manifest census fails until F1-F3 complete');
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);

    const allViolations: string[] = [];
    const totalPairs: Record<string, number> = {};

    // Sample core states in F0 to verify manifest & print relation counts
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1]]) {
      await page.setViewportSize(vp);
      for (const theme of THEMES) {
        for (const state of STATES) {
          if (state.pendingUntil) continue;
          const ok = await navigateToState(page, state, ids);
          if (!ok) continue;
          await setTheme(page, theme);
          const textIssues = await checkRenderedText(page);
          const colourIssues = await checkColoursAndNativeControls(page, theme);
          const gapRes = await checkPaintedGaps(page);
          for (const [k, v] of Object.entries(gapRes.pairsByRelation)) {
            totalPairs[k] = (totalPairs[k] || 0) + v;
          }
          for (const issue of [...textIssues, ...colourIssues, ...gapRes.violations]) {
            allViolations.push(`[${state.id} ${vp.width} ${theme}] ${issue}`);
          }
        }
      }
    }

    console.log('[D-FINAL F0 Census] Pairs measured per relation:', JSON.stringify(totalPairs));
    console.log('[D-FINAL F0 Census] Total violations:', allViolations.length);
    expect(allViolations).toEqual([]);
  });
});
