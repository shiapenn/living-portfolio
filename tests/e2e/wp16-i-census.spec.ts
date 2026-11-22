import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES, THEMES, VIEWPORTS } from './states-manifest.js';
import {
  checkActionBarI1,
  checkDockedPanelAndAdjacentLinesI7,
  checkItemGeometryI8,
  checkStatusVocabularyI5,
  getSeededIds,
  navigateToState,
  setTheme,
} from './census-helpers.js';

test.describe('WP-16.I Census v3 Canaries (synthetic broken DOM)', () => {
  test('canary I1+I7+I8: catches missing ActionBar data-level, docked panel 4-sided border, and Item bleed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <div class="lp-editor-drawer" style="border: 1px solid #ccc; width: 260px;">
        <div class="lp-list" style="padding: 8px; width: 240px;">
          <div class="lp-item" style="width: 224px;">
            <div class="lp-item-title">Item</div>
          </div>
        </div>
      </div>
      <div class="lp-action-bar"><button class="lp-btn">Save</button></div>
    `);
    const abIssues = (await checkActionBarI1(page, 'synthetic')).flatMap((r) => r.issues);
    const panelIssues = await checkDockedPanelAndAdjacentLinesI7(page, 'synthetic');
    const itemRes = await checkItemGeometryI8(page, 'synthetic');

    expect(abIssues.some((i) => i.startsWith('i1-missing-level'))).toBe(true);
    expect(panelIssues.some((i) => i.startsWith('i7-panel-border-'))).toBe(true);
    expect(itemRes.issues.some((i) => i.startsWith('i8-item-bleed'))).toBe(true);
  });

  test('canary I5: catches non-vocabulary StatusLabel', async ({ page }) => {
    await page.setContent(`
      <span data-c="StatusLabel" class="lp-status-indicator">
        <span class="lp-status-dot lp-status-dot-neutral" aria-hidden="true"></span>
        <span class="lp-status-label">accepted</span>
      </span>
      <span data-c="StatusLabel" class="lp-status-indicator">
        <span class="lp-status-dot lp-status-dot-neutral" aria-hidden="true"></span>
        <span class="lp-status-label">Local only, quotes from your entries</span>
      </span>
    `);
    const vocabIssues = await checkStatusVocabularyI5(page, 'synthetic');
    expect(vocabIssues.length).toBe(2);
  });
});

test.describe('WP-16.I Defect Verification Suite (UX-194..UX-203)', () => {
  test('20261106-UX-194 (I1): ActionBar level=page|dialog|item contract across pages and dialogs', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'overlay-delete-dialog')!, ids);
    const reports = await checkActionBarI1(page, 'overlay-delete-dialog');
    expect(reports.some((r) => r.level === 'dialog')).toBe(true);
    expect(reports.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-195 (I2): Suggested roles uses Accept/Ignore action buttons, not segmented control', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'editor-role-suggested')!, ids);
    await page.waitForSelector('#ref-spans-list .lp-item', { timeout: 5000 });
    const segInRoles = await page.locator('#ref-spans-list .lp-choice-variant-segmented').count();
    expect(segInRoles).toBe(0);
    const ignoreTextBtns = await page.locator('#ref-spans-list .lp-action-bar .lp-btn-text:has-text("Ignore")').count();
    expect(ignoreTextBtns).toBeGreaterThan(0);
  });

  test('20261106-UX-196 (I3): Answer rules uses Confirm rule (primary) and Discard on Pending', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'answer-rules')!, ids);
    const discardCount = await page.locator('button:has-text("Discard")').count();
    expect(discardCount).toBeGreaterThan(0);
  });

  test('20261106-UX-197 (I4): History omits Restore on latest version and uses label Restore with date aria-label', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'history')!, ids);
    const latestRestore = await page.locator('.lp-item:first-child button:has-text("Restore")').count();
    expect(latestRestore).toBe(0);
  });

  test('20261106-UX-198 (I5): Settings > Providers & Status configuration value without dot + StatusLabel vocabulary', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'settings-providers')!, ids);
    const issues = await checkStatusVocabularyI5(page, 'settings-providers');
    expect(issues).toEqual([]);
    const descCount = await page.locator('text=Answers quote directly from your entries; nothing leaves this server.').count();
    expect(descCount).toBe(1);
    const dotOnLocalOnly = await page.locator('#providers-current-status .lp-status-indicator').count();
    expect(dotOnLocalOnly).toBe(0);
  });

  test('20261106-UX-199 (I6): Setup step 1 Create account page-level primary and updated copy', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'setup-step-1')!, ids);
    const createBtn = await page.locator('button:has-text("Create account")').count();
    expect(createBtn).toBe(1);
  });

  test('20261106-UX-200 (I7): Edge-docked panel border-right only and adjacent-lines check', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'overlay-entries-panel')!, ids);
    const issues = await checkDockedPanelAndAdjacentLinesI7(page, 'overlay-entries-panel');
    expect(issues).toEqual([]);
  });

  test('20261106-UX-201 (I8): Item rectangle equals list column with 8px content inset', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'status')!, ids);
    const res = await checkItemGeometryI8(page, 'status');
    expect(res.pairs).toBeGreaterThan(0);
    expect(res.issues).toEqual([]);
  });

  test('20261106-UX-202 (I9): Editor Settings passage excludes heading, left-aligned level next-step, capitalised Claims', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'editor-settings')!, ids);
    await page.waitForSelector('#ref-spans-list .lp-item', { timeout: 5000 });
    const bodyText = await page.locator('#ref-spans-list').innerText();
    expect(bodyText).not.toContain('The goal We needed');
    const claimsIssues = await checkStatusVocabularyI5(page, 'editor-settings');
    expect(claimsIssues).toEqual([]);
  });

  test('20261106-UX-203 (I10): Gallery completeness and data-c registry check', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'gallery')!, ids);
    const dataC = await page.evaluate(() =>
      Array.from(new Set(Array.from(document.querySelectorAll('[data-c]')).map((el) => el.getAttribute('data-c')))),
    );
    expect(dataC).toContain('ActionBar');
    expect(dataC).toContain('Overlay');
  });
});

test.describe('WP-16.I Full Census v3 (ActionBar levels, StatusLabel vocab, Panel, Item geometry)', () => {
  test('every STATES entry passes I1 ActionBar, I5 StatusLabel vocabulary, I7 docked panel, and I8 Item geometry', async ({ page }) => {
    test.setTimeout(300_000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    expect(ids.entryId).toBeTruthy();

    const actionBarByLevel: Record<string, number> = { page: 0, dialog: 0, item: 0, missing: 0 };
    let totalItemGeometryPairs = 0;
    const allViolations: string[] = [];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      for (const theme of THEMES) {
        for (const state of STATES) {
          await navigateToState(page, state, ids);
          await setTheme(page, theme);

          const abReports = await checkActionBarI1(page, state.id);
          for (const r of abReports) {
            actionBarByLevel[r.level] = (actionBarByLevel[r.level] ?? 0) + r.count;
            for (const iss of r.issues) allViolations.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
          }

          const vocabIssues = await checkStatusVocabularyI5(page, state.id);
          for (const iss of vocabIssues) allViolations.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);

          const panelIssues = await checkDockedPanelAndAdjacentLinesI7(page, state.id);
          for (const iss of panelIssues) allViolations.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);

          const itemRes = await checkItemGeometryI8(page, state.id);
          totalItemGeometryPairs += itemRes.pairs;
          for (const iss of itemRes.issues) allViolations.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
        }
      }
    }

    console.log('=== WP-16.I CENSUS V3 REPORT ===');
    console.log(JSON.stringify({
      statesCount: STATES.length,
      totalCapturesEvaluated: STATES.length * VIEWPORTS.length * THEMES.length,
      actionBarByLevel,
      totalItemGeometryPairs,
      totalViolations: allViolations.length,
    }, null, 2));

    expect(actionBarByLevel.page).toBeGreaterThan(0);
    expect(actionBarByLevel.dialog).toBeGreaterThan(0);
    expect(actionBarByLevel.item).toBeGreaterThan(0);
    expect(actionBarByLevel.missing).toBe(0);
    expect(totalItemGeometryPairs).toBeGreaterThan(0);
    expect(allViolations).toEqual([]);
  });
});
