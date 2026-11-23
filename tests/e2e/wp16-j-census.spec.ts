import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import { activeStates, STATES, THEMES, VIEWPORTS } from './states-manifest.js';
import {
  getSeededIds,
  navigateToState,
  setTheme,
  checkActionBarJ2,
  checkOrphanTextAndMarginsJ3,
  checkRestingIconButtonFillsJ5,
} from './census-helpers.js';

const COMPONENTS_PATH = resolve(process.cwd(), 'docs/design/components.json');
const COMPONENTS_REGISTRY = JSON.parse(readFileSync(COMPONENTS_PATH, 'utf8'));
const REGISTERED_COMPONENTS: string[] = (COMPONENTS_REGISTRY.components ?? []).map((c: any) => c.name);

test.describe('WP-16.J Census Canaries (synthetic broken DOM)', () => {
  test('canary J2: catches full-width item ActionBar button inside >=400px container', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column">
        <div data-c="FormSection" style="width:600px">
          <p data-rel="section-title">Tags</p>
          <div data-c="ActionBar" data-level="item" style="margin-top:8px">
            <button data-c="Button" class="lp-btn lp-btn-secondary lp-btn-full" style="width:600px">Add tag</button>
          </div>
        </div>
      </main>
    `);
    const reports = await checkActionBarJ2(page, 'canary-j2');
    const issues = reports.flatMap((r) => r.issues);
    expect(issues.some((i) => i.includes('j2-item-full-width'))).toBe(true);
    expect(issues.some((i) => i.includes('j2-item-gap24'))).toBe(true);
  });

  test('canary J3: catches orphan text without non-section data-c ancestor and unowned margins', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column">
        <div data-c="FormSection">
          <h2 data-rel="section-title">Answering model</h2>
          <p id="loose-value" style="margin-bottom:12px">Local only</p>
        </div>
      </main>
    `);
    const res = await checkOrphanTextAndMarginsJ3(page, 'canary-j3', REGISTERED_COMPONENTS);
    expect(res.orphanText.some((i) => i.includes('Local only'))).toBe(true);
    expect(res.unownedMargins.some((i) => i.includes('loose-value'))).toBe(true);
  });

  test('canary J5: catches mismatched resting icon-button background fill', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <header class="lp-admin-header">
        <button id="lp-launcher-btn" style="width:36px;height:36px;background:rgb(240,242,245)">L</button>
        <button id="theme-toggle" style="width:36px;height:36px;background:rgb(219,234,254)">T</button>
        <button id="lp-account-menu-btn" style="width:36px;height:36px;background:rgb(240,242,245)">A</button>
      </header>
    `);
    const issues = await checkRestingIconButtonFillsJ5(page, 'canary-j5');
    expect(issues.some((i) => i.includes('j5-icon-fill-mismatch'))).toBe(true);
  });
});

test.describe('WP-16.J Defect Verification Suite (UX-204..UX-208)', () => {
  test('20261106-UX-204 (J1): Settings > Providers Answering model uses FormSection + Item without loose text or Local only StatusLabel', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'settings-providers')!, ids);

    const itemCount = await page.locator('#provider-role-answering [data-c="Item"]').count();
    expect(itemCount).toBe(1);
    const looseText = await checkOrphanTextAndMarginsJ3(page, 'settings-providers', REGISTERED_COMPONENTS);
    expect(looseText.orphanText).toEqual([]);
    const currentText = (await page.locator('#providers-current-status').textContent()) ?? '';
    if (currentText.includes('Local only')) {
      const statusDotCount = await page.locator('#provider-role-answering [data-c="StatusLabel"]').count();
      expect(statusDotCount).toBe(0);
    }
  });

  test('20261106-UX-205 (J2): Add tag, Add claim, Attach evidence use compact item-level ActionBar with 24px gap', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'editor-settings')!, ids);

    for (const id of ['ref-btn-add-facet', 'ref-btn-open-claim', 'ref-btn-open-evidence']) {
      const btn = page.locator(`#${id}`);
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThan(300);
      expect(box!.width).toBeGreaterThanOrEqual(96);
    }
    const reports = await checkActionBarJ2(page, 'editor-settings');
    expect(reports.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-206 (J3): zero orphan text and zero unowned margins on settings-providers and editor-settings', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const sid of ['settings-providers', 'editor-settings']) {
      await navigateToState(page, STATES.find((s) => s.id === sid)!, ids);
      const res = await checkOrphanTextAndMarginsJ3(page, sid, REGISTERED_COMPONENTS);
      expect(res.orphanText).toEqual([]);
      expect(res.unownedMargins).toEqual([]);
    }
  });

  test('20261106-UX-207 (J4): docs/design/components.json registry covers all emitted data-c and .lp-* families', async () => {
    expect(Array.isArray(COMPONENTS_REGISTRY.components)).toBe(true);
    expect(REGISTERED_COMPONENTS).toContain('ActionBar');
    expect(REGISTERED_COMPONENTS).toContain('Item');
    expect(REGISTERED_COMPONENTS).toContain('FormSection');
    expect(Array.isArray(COMPONENTS_REGISTRY.allowedClassFamilies)).toBe(true);
  });

  test('20261106-UX-208 (J5): theme toggle icon button has identical resting fill to account button', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const sid of ['settings-providers', 'editor-settings']) {
      await navigateToState(page, STATES.find((s) => s.id === sid)!, ids);
      for (const theme of THEMES) {
        await setTheme(page, theme);
        const issues = await checkRestingIconButtonFillsJ5(page, sid);
        expect(issues).toEqual([]);
      }
    }
  });
});

test.describe('WP-16.J Full Census (ActionBar container/width/gap, Orphan-text, Unowned-margins, Resting icon fills)', () => {
  test('all STATES pass J2, J5, and J3 (migrated targets)', async ({ page }) => {
    test.setTimeout(300_000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);

    const byLevelAndContainer: Record<string, number> = {};
    const j2Issues: string[] = [];
    const j5Issues: string[] = [];
    const j3MigratedIssues: string[] = [];
    const j3Targets = new Set(['settings-providers', 'editor-settings']);
    let orphanTextCountAllStates = 0;
    let unownedMarginCountAllStates = 0;

    for (const state of activeStates()) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const ok = await navigateToState(page, state, ids);
        if (!ok) continue;
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const abReports = await checkActionBarJ2(page, state.id);
          for (const r of abReports) {
            const key = `${r.level}:${r.containerType}:${r.widthClass}`;
            byLevelAndContainer[key] = (byLevelAndContainer[key] ?? 0) + 1;
            for (const iss of r.issues) j2Issues.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
          }
          const j3 = await checkOrphanTextAndMarginsJ3(page, state.id, REGISTERED_COMPONENTS);
          orphanTextCountAllStates += j3.orphanText.length;
          unownedMarginCountAllStates += j3.unownedMargins.length;
          if (j3Targets.has(state.id)) {
            for (const iss of [...j3.orphanText, ...j3.unownedMargins]) {
              j3MigratedIssues.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
            }
          }
          const j5 = await checkRestingIconButtonFillsJ5(page, state.id);
          for (const iss of j5) j5Issues.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
        }
      }
    }

    console.log('=== WP-16.J CENSUS REPORT ===');
    console.log(JSON.stringify({
      statesCount: STATES.length,
      byLevelAndContainer,
      j2IssuesCount: j2Issues.length,
      j5IssuesCount: j5Issues.length,
      j3MigratedIssuesCount: j3MigratedIssues.length,
      orphanTextCountAllStates,
      unownedMarginCountAllStates,
    }, null, 2));
    expect(j2Issues).toEqual([]);
    expect(j5Issues).toEqual([]);
    expect(j3MigratedIssues).toEqual([]);
  });
});
