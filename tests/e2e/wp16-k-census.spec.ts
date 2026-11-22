import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES, THEMES, VIEWPORTS } from './states-manifest.js';
import {
  getSeededIds,
  navigateToState,
  setTheme,
  checkActionBarK1,
  checkListPaddingAbsorptionK2,
  checkOrphanTextAndMarginsJ3,
} from './census-helpers.js';

const COMPONENTS_PATH = resolve(process.cwd(), 'docs/design/components.json');
const COMPONENTS_REGISTRY = JSON.parse(readFileSync(COMPONENTS_PATH, 'utf8'));
const REGISTERED_COMPONENTS: string[] = (COMPONENTS_REGISTRY.components ?? []).map((c: any) => c.name);

test.describe('WP-16.K Census Canaries (synthetic broken DOM, failing on cfdca95)', () => {
  test('canary K1: catches full-width item ActionBar at 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.setContent(`
      <main class="lp-page-column">
        <div data-c="Subsection" style="width:288px">
          <div data-c="ActionBar" data-level="item" style="display:flex;flex-direction:column;align-items:stretch;width:288px">
            <button data-c="Button" class="lp-btn lp-btn-secondary" style="width:288px;height:44px">Add tag</button>
          </div>
        </div>
      </main>
    `);
    const reports = await checkActionBarK1(page, 'canary-k1');
    const issues = reports.flatMap((r) => r.issues);
    expect(issues.some((i) => i.includes('k1-item-full-width'))).toBe(true);
    expect(issues.some((i) => i.includes('k1-item-not-flex-wrap-row'))).toBe(true);
  });

  test('canary K2: catches List with unabsorbed first-Item top padding (painted gap 28px instead of 16px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column" style="font:14px/20px sans-serif">
        <section data-c="FormSection" id="sec-a" style="display:flex;flex-direction:column;gap:16px">
          <h2 data-rel="section-title" style="margin:0;font-size:16px;line-height:24px">Section A</h2>
          <div class="lp-list" style="padding:0">
            <div data-c="Item" style="padding:12px 8px">
              <div class="lp-item-title">Item 1</div>
            </div>
          </div>
        </section>
      </main>
    `);
    const reports = await checkListPaddingAbsorptionK2(page, 'canary-k2');
    const issues = reports.flatMap((r) => r.issues);
    expect(issues.some((i) => i.includes('k2-heading-to-first'))).toBe(true);
  });

  test('canary K3: catches orphan text and unowned margins', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(`
      <main class="lp-page-column">
        <h2 style="margin-bottom:14px">Loose Heading</h2>
      </main>
    `);
    const res = await checkOrphanTextAndMarginsJ3(page, 'canary-k3', REGISTERED_COMPONENTS);
    expect(res.orphanText.length).toBeGreaterThan(0);
    expect(res.unownedMargins.length).toBeGreaterThan(0);
  });
});

test.describe('WP-16.K Defect Verification (UX-209..UX-211)', () => {
  test('20261106-UX-209 (K1): item-level ActionBar is always compact at 320px (Add tag, Add claim, Attach evidence)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'editor-settings')!, ids);

    const reports = await checkActionBarK1(page, 'editor-settings');
    const itemBars = reports.filter((r) => r.level === 'item');
    expect(itemBars.length).toBeGreaterThan(0);
    expect(itemBars.every((r) => r.widthClass === 'compact')).toBe(true);
    expect(itemBars.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-210 (K2): Providers Answering model and Fallback behaviour show identical painted gaps (16px / 40px)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToState(page, STATES.find((s) => s.id === 'settings-providers')!, ids);

    const reports = await checkListPaddingAbsorptionK2(page, 'settings-providers');
    const answering = reports.find((r) => r.sectionId === 'provider-role-answering');
    const fallback = reports.find((r) => r.sectionId === 'provider-role-fallback');
    expect(answering).toBeTruthy();
    expect(fallback).toBeTruthy();
    expect(Math.abs((answering!.headingToFirst ?? 0) - (fallback!.headingToFirst ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((answering!.lastToNext ?? 0) - (fallback!.lastToNext ?? 0))).toBeLessThanOrEqual(2);
    expect(reports.flatMap((r) => r.issues)).toEqual([]);
  });

  test('20261106-UX-211 (K3): zero orphanTextCountAllStates and zero unownedMarginCountAllStates across all 42 states', async ({ page }) => {
    test.setTimeout(300_000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);

    let orphanTextCountAllStates = 0;
    let unownedMarginCountAllStates = 0;

    for (const state of STATES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const ok = await navigateToState(page, state, ids);
        if (!ok) continue;
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const j3 = await checkOrphanTextAndMarginsJ3(page, state.id, REGISTERED_COMPONENTS);
          orphanTextCountAllStates += j3.orphanText.length;
          unownedMarginCountAllStates += j3.unownedMargins.length;
        }
      }
    }

    expect(orphanTextCountAllStates).toBe(0);
    expect(unownedMarginCountAllStates).toBe(0);
  });

  test('K1 Full 42-state ActionBar census: zero full-width item bars at every viewport and container', async ({ page }) => {
    test.setTimeout(300_000);
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);

    const byLevelAndContainer: Record<string, number> = {};
    const k1Issues: string[] = [];

    for (const state of STATES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const ok = await navigateToState(page, state, ids);
        if (!ok) continue;
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const reports = await checkActionBarK1(page, state.id);
          for (const r of reports) {
            const key = `${r.level}:${r.containerType}:${r.widthClass}`;
            byLevelAndContainer[key] = (byLevelAndContainer[key] ?? 0) + 1;
            for (const iss of r.issues) k1Issues.push(`[${state.id} ${vp.width} ${theme}] ${iss}`);
          }
        }
      }
    }

    console.log('K1_BY_LEVEL_AND_CONTAINER:', JSON.stringify(byLevelAndContainer));
    const itemFullKeys = Object.entries(byLevelAndContainer).filter(([k]) => k.startsWith('item:') && k.endsWith(':full'));
    expect(itemFullKeys).toEqual([]);
    expect(k1Issues).toEqual([]);
  });
});
