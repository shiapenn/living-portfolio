import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES } from './states-manifest.js';
import {
  getSeededIds,
  navigateToState,
  checkItemButtonGrammarL1,
  checkListVariantsAndTextEdgesL2,
  checkListSpacingAndHeadersL3,
} from './census-helpers.js';

test.describe('WP-16.L Census Canaries (synthetic broken DOM, verifying L1, L2, L3 detectors)', () => {
  test('canary L1: catches item-level primary button, >2 buttons, and wrong 2-button grammar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column">
        <div data-c="ActionBar" data-level="item" class="lp-action-bar lp-action-bar-item">
          <button data-c="Button" class="lp-btn lp-btn-primary">Confirm rule</button>
          <button data-c="Button" class="lp-btn lp-btn-secondary">Discard</button>
        </div>
      </main>
    `);
    const report = await checkItemButtonGrammarL1(page, 'canary-l1');
    expect(report.issues.some((i) => i.includes('l1-item-primary-disallowed'))).toBe(true);
    expect(report.issues.some((i) => i.includes('l1-item-first-must-be-secondary'))).toBe(true);
    expect(report.issues.some((i) => i.includes('l1-item-second-must-be-text'))).toBe(true);
  });

  test('canary L2: catches missing list variant, two text edges in one list, and 8px-inset plain Item button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column" style="width:720px;padding:40px 24px">
        <h2 class="lp-form-section-title" style="margin:0">Answering model</h2>
        <div id="broken-plain-list" class="lp-list" data-variant="plain" style="width:672px">
          <div data-c="Item" class="lp-item" style="padding:12px 8px">
            <div class="lp-item-title">Local only</div>
            <div data-c="ActionBar" data-level="item">
              <button data-c="Button" class="lp-btn lp-btn-secondary">Change</button>
            </div>
          </div>
          <div data-c="Item" class="lp-item" style="padding:12px 0">
            <div class="lp-item-title">Second row</div>
          </div>
        </div>
      </main>
    `);
    const report = await checkListVariantsAndTextEdgesL2(page, 'canary-l2');
    expect(report.issues.some((i) => i.includes('l2-plain-not-flush'))).toBe(true);
    expect(report.issues.some((i) => i.includes('l2-plain-button-edge'))).toBe(true);
    expect(report.issues.some((i) => i.includes('l2-list-multiple-text-edges'))).toBe(true);
  });

  test('canary L3a: catches Today heading-to-first and dismiss button tint overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <style>
        .lp-item { position: relative; padding: 0 8px 12px 8px; }
        .lp-item::before { content: ''; position: absolute; left: 0; right: 0; top: -12px; bottom: 0; }
      </style>
      <main class="lp-page-column">
        <section id="today-checklist-card">
          <div data-c="SectionHeader" class="lp-section-header" style="display:flex;align-items:center;justify-content:space-between">
            <h2 class="lp-section-header-title" style="margin:0">Getting started</h2>
            <div class="lp-section-header-action">
              <button class="lp-icon-btn" style="width:36px;height:36px">×</button>
            </div>
          </div>
          <div id="today-checklist-list" class="lp-list">
            <a href="/admin/setup" data-c="Item" class="lp-item">
              <div class="lp-item-title">Complete setup</div>
            </a>
          </div>
        </section>
      </main>
    `);
    const reports = await checkListSpacingAndHeadersL3(page, 'canary-l3-today');
    const issues = reports.flatMap((r) => r.issues);
    expect(issues.some((i) => i.includes('l3-header-button-overlap'))).toBe(true);
    expect(issues.some((i) => i.includes('l3-interactive-tint-clearance'))).toBe(true);
  });

  test('canary L3b: catches panel search-to-tint < 8px clearance when interactive list absorbs top padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <style>
        .lp-item { position: relative; padding: 0 8px 12px 8px; }
        .lp-item::before { content: ''; position: absolute; left: 0; right: 0; top: -12px; bottom: 0; }
      </style>
      <aside id="ref-entries-drawer" style="display:flex;flex-direction:column;gap:16px;width:260px">
        <div class="lp-editor-drawer-header">
          <input type="search" id="ref-entries-search" style="height:40px" value="" />
        </div>
        <div id="ref-entry-list" class="lp-list">
          <a href="/admin/entries/1" data-c="Item" class="lp-item is-selected">
            <div class="lp-item-title">Entry 1</div>
          </a>
        </div>
      </aside>
    `);
    const reports = await checkListSpacingAndHeadersL3(page, 'canary-l3-panel');
    const issues = reports.flatMap((r) => r.issues);
    expect(issues.some((i) => i.includes('l3-interactive-tint-clearance'))).toBe(true);
    expect(issues.some((i) => i.includes('l3-interactive-gap-to-tint'))).toBe(true);
  });

  test('L1 gallery verification: /admin/_gallery renders List plain and interactive variants, destructive text button, and D-L1 item ActionBar', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'gallery')!, ids);

    await expect(page.locator('#gallery-list-interactive[data-c="List"][data-variant="interactive"]')).toBeVisible();
    await expect(page.locator('#gallery-list-plain[data-c="List"][data-variant="plain"]')).toBeVisible();
    await expect(page.locator('#gallery-btn-text-danger')).toBeVisible();

    const l1Report = await checkItemButtonGrammarL1(page, 'gallery');
    expect(l1Report.barCount).toBeGreaterThan(0);
    expect(l1Report.issues).toEqual([]);

    const l2Report = await checkListVariantsAndTextEdgesL2(page, 'gallery');
    expect(l2Report.issues).toEqual([]);
  });
});

test.describe('WP-16.L Live Verification & 42-State Census (UX-213..UX-215)', () => {
  test('20261106-UX-213 (L1): item-level bars never contain a primary; 1 action = secondary; 2 actions = secondary + text button', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'answer-rules')!, ids);
    const rulesReport = await checkItemButtonGrammarL1(page, 'answer-rules');
    expect(rulesReport.issues).toEqual([]);

    await navigateToState(page, STATES.find((s) => s.id === 'editor-role-accepted')!, ids);
    const acceptedReport = await checkItemButtonGrammarL1(page, 'editor-role-accepted');
    expect(acceptedReport.issues).toEqual([]);
  });

  test('20261106-UX-214 (L2): List variants plain and interactive; plain Item content and buttons sit on column edge (1 text edge)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'settings-providers')!, ids);
    const provEdges = await checkListVariantsAndTextEdgesL2(page, 'settings-providers');
    expect(provEdges.issues).toEqual([]);
    expect(provEdges.plainPageSharedEdges.length).toBe(1);

    await navigateToState(page, STATES.find((s) => s.id === 'editor-role-suggested')!, ids);
    const edEdges = await checkListVariantsAndTextEdgesL2(page, 'editor-role-suggested');
    expect(edEdges.issues).toEqual([]);
    expect(edEdges.plainPageSharedEdges.length).toBe(1);
  });

  test('20261106-UX-215a (L3): Today heading-to-first (Needs attention & Getting started) has 16px to tint edge and no dismiss button overlap', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'today')!, ids);
    const reports = await checkListSpacingAndHeadersL3(page, 'today');
    expect(reports.length).toBeGreaterThanOrEqual(2);
    expect(reports.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-215b (L3): Entries panel search-to-tint equals 16px (stack.control-to-list) with >= 8px tint clearance', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'overlay-entries-panel')!, ids);
    const reports = await checkListSpacingAndHeadersL3(page, 'overlay-entries-panel');
    const panelList = reports.find((r) => r.listId === 'ref-entry-list');
    expect(panelList).toBeTruthy();
    expect(panelList!.issues).toEqual([]);
  });

  test('Full 42-state census: L1 button grammar, L2 list variants & text-left-edge sets, and L3 list spacing across all states', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    const allIssues: string[] = [];
    const edgesByState: Record<string, { pageColumnEdges: number[]; plainShared: number[]; listEdges: Record<string, number[]> }> = {};
    for (const st of STATES) {
      await navigateToState(page, st, ids);
      const l1 = await checkItemButtonGrammarL1(page, st.id);
      const l2 = await checkListVariantsAndTextEdgesL2(page, st.id);
      const l3 = await checkListSpacingAndHeadersL3(page, st.id);
      if (l2.lists.length > 0 || l2.plainPageSharedEdges.length > 0) {
        edgesByState[st.id] = {
          pageColumnEdges: l2.pageColumnEdges,
          plainShared: l2.plainPageSharedEdges,
          listEdges: Object.fromEntries(l2.lists.map((l) => [`${l.listId}(${l.variant})`, l.itemTextEdges])),
        };
      }
      allIssues.push(...l1.issues, ...l2.issues, ...l3.flatMap((r) => r.issues));
    }
    console.log('L2_EDGES_PER_PAGE:', JSON.stringify(edgesByState));
    expect(allIssues).toEqual([]);
  });

  test('20261106-UX-216 & 20261106-UX-217 (L4 & L5): unified scrim on dialogs, zero --lp-prim-* on :root, and gallery style-recalc benchmark', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'gallery')!, ids);
    const recalcMetrics = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const scrim = rootStyle.getPropertyValue('--lp-color-surface-scrim').trim();
      const primCheck = rootStyle.getPropertyValue('--lp-prim-space-8').trim();
      const zBase = rootStyle.getPropertyValue('--lp-z-base').trim();

      // Run 20 theme toggles (light <-> dark) forcing full style recalculation across gallery DOM
      const iterations = 20;
      const t0 = performance.now();
      for (let i = 0; i < iterations; i++) {
        document.documentElement.setAttribute('data-theme', i % 2 === 0 ? 'dark' : 'light');
        void document.body.offsetHeight;
        void getComputedStyle(document.body).backgroundColor;
      }
      const elapsedMs = performance.now() - t0;
      return {
        scrim,
        primCheck,
        zBase,
        avgStyleRecalcMs: Number((elapsedMs / iterations).toFixed(3)),
      };
    });

    console.log('L5_GALLERY_STYLE_RECALC:', JSON.stringify(recalcMetrics));
    expect(recalcMetrics.scrim).toBe('rgba(15, 26, 34, 0.45)');
    expect(recalcMetrics.primCheck).toBe('');
    expect(recalcMetrics.zBase).toBe('0');
    expect(recalcMetrics.avgStyleRecalcMs).toBeLessThan(50);
  });
});
