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

test.describe('WP-16.I Census v3 Canaries (run against WP-16.H commit f8f2eef)', () => {
  test('canary I1+I7+I8: catches missing ActionBar data-level, docked panel 4-sided border, and Item bleed on f8f2eef', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'overlay-entries-panel')!, ids);
    const abIssues = (await checkActionBarI1(page, 'overlay-entries-panel')).flatMap((r) => r.issues);
    const panelIssues = await checkDockedPanelAndAdjacentLinesI7(page, 'overlay-entries-panel');
    const itemRes = await checkItemGeometryI8(page, 'overlay-entries-panel');

    console.log('Canary f8f2eef findings:', { abIssues, panelIssues, itemIssues: itemRes.issues });
    expect(panelIssues.some((i) => i.startsWith('i7-panel-border-'))).toBe(true);
    expect(abIssues.length + panelIssues.length + itemRes.issues.length).toBeGreaterThan(0);
  });

  test('canary I5: catches non-vocabulary StatusLabel on f8f2eef (claims accepted / Local only)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToState(page, STATES.find((s) => s.id === 'editor-settings')!, ids);
    await page.waitForSelector('#ref-claims-list .lp-status-label', { timeout: 5000 });
    const editorVocab = await checkStatusVocabularyI5(page, 'editor-settings');
    await navigateToState(page, STATES.find((s) => s.id === 'settings-providers')!, ids);
    const provVocab = await checkStatusVocabularyI5(page, 'settings-providers');

    console.log('Canary I5 f8f2eef findings:', { editorVocab, provVocab });
    expect(editorVocab.length + provVocab.length).toBeGreaterThan(0);
  });
});

test.describe('WP-16.I Failing-First Defect Suite (UX-194..UX-203)', () => {
  test('20261106-UX-194 (I1): ActionBar level=page|dialog|item contract across pages and dialogs', async ({ page }) => {
    test.fail(true, 'WP-16.I I1 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'overlay-delete-dialog')!, ids);
    const reports = await checkActionBarI1(page, 'overlay-delete-dialog');
    expect(reports.some((r) => r.level === 'dialog')).toBe(true);
    expect(reports.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-195 (I2): Suggested roles uses Accept/Ignore action buttons, not segmented control', async ({ page }) => {
    test.fail(true, 'WP-16.I I2 not yet implemented');
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
    test.fail(true, 'WP-16.I I3 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'answer-rules')!, ids);
    const discardCount = await page.locator('button:has-text("Discard")').count();
    expect(discardCount).toBeGreaterThan(0);
  });

  test('20261106-UX-197 (I4): History omits Restore on latest version and uses label Restore with date aria-label', async ({ page }) => {
    test.fail(true, 'WP-16.I I4 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'history')!, ids);
    const latestRestore = await page.locator('.lp-item:first-child button:has-text("Restore")').count();
    expect(latestRestore).toBe(0);
  });

  test('20261106-UX-198 (I5): Settings > Providers & Status configuration value without dot + StatusLabel vocabulary', async ({ page }) => {
    test.fail(true, 'WP-16.I I5 not yet implemented');
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
    test.fail(true, 'WP-16.I I6 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await navigateToState(page, STATES.find((s) => s.id === 'setup-step-1')!, ids);
    const createBtn = await page.locator('button:has-text("Create account")').count();
    expect(createBtn).toBe(1);
  });

  test('20261106-UX-200 (I7): Edge-docked panel border-right only and adjacent-lines check', async ({ page }) => {
    test.fail(true, 'WP-16.I I7 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'overlay-entries-panel')!, ids);
    const issues = await checkDockedPanelAndAdjacentLinesI7(page, 'overlay-entries-panel');
    expect(issues).toEqual([]);
  });

  test('20261106-UX-201 (I8): Item rectangle equals list column with 8px content inset', async ({ page }) => {
    test.fail(true, 'WP-16.I I8 not yet implemented');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'status')!, ids);
    const res = await checkItemGeometryI8(page, 'status');
    expect(res.pairs).toBeGreaterThan(0);
    expect(res.issues).toEqual([]);
  });

  test('20261106-UX-202 (I9): Editor Settings passage excludes heading, left-aligned level next-step, capitalised Claims', async ({ page }) => {
    test.fail(true, 'WP-16.I I9 not yet implemented');
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
    test.fail(true, 'WP-16.I I10 not yet implemented');
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
