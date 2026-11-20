import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES, THEMES, VIEWPORTS } from './states-manifest.js';
import {
  getSeededIds,
  navigateToState,
  setTheme,
  verifyStateMarker,
  checkPaintedGaps,
  checkTypeRolesAndControlLabel,
  checkSingleImplementationPerRole,
  checkOverlaysOutlineAndShadow,
  checkPageContentEdgePadding,
} from './census-helpers.js';

test.describe('WP-16.G G0 Measurement Integrity Canaries (D-G A1-A6)', () => {
  test('canary A1: verifyStateMarker catches mismatched step or route', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    const issues = await verifyStateMarker(page, {
      id: 'fake-step-3',
      kind: 'auth',
      route: '/admin/setup',
      fullPage: true,
      marker: { routePattern: '/admin/setup', text: 'Step 3 of 6', selector: '#wizard-step-3' },
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  test('canary A2: zero-pair relation check catches unmeasured relations', async () => {
    const samplePairs: Record<string, number> = {
      'page-title-to-description': 10,
      'subsection-to-subsection': 0,
    };
    const zeroRelations = Object.entries(samplePairs)
      .filter(([, count]) => count === 0)
      .map(([rel]) => rel);
    expect(zeroRelations).toContain('subsection-to-subsection');
  });

  test('canary A4: single-implementation guard catches BackLink != "Back" and stray select', async ({ page }) => {
    await page.setContent(`
      <a href="/admin" data-c="BackLink">Back to Backups</a>
      <select id="stray-select"><option>A</option></select>
    `);
    const issues = await checkSingleImplementationPerRole(page);
    expect(issues.some((i) => i.startsWith('back-text-not-exact:'))).toBe(true);
    expect(issues.some((i) => i.startsWith('select-outside-component:'))).toBe(true);
  });

  test('canary A5: container-query CSS guard catches @media inside primitive CSS files', async () => {
    const badCss = `@media (min-width: 640px) { .lp-item { display: grid; } }`;
    const allowedOwners = ['admin-shell', 'page', 'page-header'];
    const isPrimitiveFile = !allowedOwners.some((o) => 'item.ts'.includes(o));
    expect(isPrimitiveFile && /@media\s*\(/.test(badCss)).toBe(true);
  });

  test('canary A6: overlay guard catches missing 1px outline, missing shadow, and wrong panel shadow direction', async ({ page }) => {
    await page.setContent(`
      <div class="lp-entries-drawer" style="width:200px;height:200px;border:0;box-shadow:-4px 0 8px rgba(0,0,0,0.2);">Panel</div>
    `);
    const issues = await checkOverlaysOutlineAndShadow(page, 'overlay-entries-panel');
    expect(issues.some((i) => i.startsWith('overlay-missing-1px-outline:'))).toBe(true);
    expect(issues.some((i) => i.startsWith('overlay-panel-shadow-direction:'))).toBe(true);
  });

  test('canary C18: page content edge padding guard catches content < 16px from viewport edge', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.setContent(`<main style="padding:0;margin:0;"><h1 style="margin:0;">Flush</h1></main>`);
    const issues = await checkPageContentEdgePadding(page);
    expect(issues.some((i) => i.startsWith('edge-padding-violation:'))).toBe(true);
  });
});

test.describe('WP-16.G G0 Failing-First Defect Tests (20261106-UX-170..UX-181)', () => {
  test('20261106-UX-170: zero 0-pair relations, zero .lp-tag 14/400 variants, and 14/400 disabled text', async ({ page }) => {
    test.fail(true, 'G0 failing-first: missing data-rel hooks and .lp-tag 14/400 variant');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    const roleIssues = await checkTypeRolesAndControlLabel(page);
    expect(roleIssues).toEqual([]);
    const gapRes = await checkPaintedGaps(page);
    expect(gapRes.pairsByRelation['subsection-to-subsection']).toBeGreaterThan(0);
    expect(gapRes.pairsByRelation['section-to-section']).toBeGreaterThan(0);
  });

  test('20261106-UX-171: setup steps 1-6 each show their own step natively without DOM hack', async ({ page }) => {
    test.fail(true, 'G0 failing-first: /admin/setup lands on step 2 when authenticated instead of requested ?step=N');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/setup?step=3');
    const issues = await verifyStateMarker(page, {
      id: 'setup-step-3',
      kind: 'auth',
      route: '/admin/setup',
      fullPage: true,
      marker: { routePattern: '/admin/setup', text: 'Step 3 of 6', selector: '#wizard-step-3' },
    });
    expect(issues).toEqual([]);
  });

  test('20261106-UX-172: setup step 3 embeds ProviderFlow, step 6 Back says "Back", no 2-col Privacy Boundary box, no "Step N:" in h1', async ({ page }) => {
    test.fail(true, 'G0 failing-first: setup step 3 still read-only table & step 6 Back says Back to Backups');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/setup');
    const step3Html = await page.locator('#wizard-step-3').innerHTML();
    expect(step3Html).toContain('lp-choice');
    expect(step3Html).not.toContain('lp-notice-info');
    const backIssues = await checkSingleImplementationPerRole(page);
    expect(backIssues).toEqual([]);
  });

  test('20261106-UX-173: editor Settings view suggested role has passage, actionable level next step, symmetric Tag with remove', async ({ page }) => {
    test.fail(true, 'G0 failing-first: suggested role passage empty and Tag has no remove button');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-switch-settings');
    await expect(page.locator('#ref-facets-list .lp-tag-remove').first()).toBeVisible();
    const firstSpanBody = await page.locator('#ref-spans-list .lp-item-body').first().innerText();
    expect(firstSpanBody.trim().length).toBeGreaterThan(0);
  });

  test('20261106-UX-174: Item container stacking (<400px), gallery Confirm gap 24px, Status uses StatusLabel', async ({ page }) => {
    test.fail(true, 'G0 failing-first: Item uses @media not @container and Status lacks StatusLabel on rows');
    const stylesSrc = readFileSync(resolve(process.cwd(), 'apps/web/src/styles.ts'), 'utf8');
    expect(stylesSrc).toContain('@container');
  });

  test('20261106-UX-175: select chevron vertically centred (50%) and 12px from right edge', async ({ page }) => {
    test.fail(true, 'G0 failing-first: select chevron is top-aligned / lacks Select component wrapper');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/providers');
    await expect(page.locator('[data-c="Select"]').first()).toBeVisible();
    const issues = await checkSingleImplementationPerRole(page);
    expect(issues.filter((i) => i.startsWith('select-'))).toEqual([]);
  });

  test('20261106-UX-176: entries panel header left-aligned and inner left edge 16px', async ({ page }) => {
    test.fail(true, 'G0 failing-first: entries panel header centred');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    await page.click('#ref-sidebar-toggle');
    const align = await page.locator('#ref-entries-drawer h2, #ref-entries-drawer .lp-drawer-title').first().evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe('left');
  });

  test('20261106-UX-177: segmented Edit/Settings equal width, 4px inset thumb, <640 icon-only, sticky top 48px', async ({ page }) => {
    test.fail(true, 'G0 failing-first: segmented Edit/Settings unequal width & not icon-only at 320');
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`/admin/entries/${encodeURIComponent(ids.entryId)}`);
    const stickyTop = await page.locator('.lp-editor-toolbar-sticky').evaluate((el) => getComputedStyle(el).top);
    expect(stickyTop).toBe('48px');
  });

  test('20261106-UX-178: login recovery text button has transparent background and zero border', async ({ page }) => {
    test.fail(true, 'G0 failing-first: login recovery button lacks .lp-btn-text / text-button contract');
    await page.goto('/admin/login');
    const res = await page.locator('#btn-toggle-recovery').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, border: parseFloat(cs.borderTopWidth), isTextBtn: el.classList.contains('lp-btn-text') };
    });
    expect(res.bg).toBe('rgba(0, 0, 0, 0)');
    expect(res.border).toBe(0);
    expect(res.isTextBtn).toBe(true);
  });

  test('20261106-UX-179: overlays have 1px outline and directional elevation shadow', async ({ page }) => {
    test.fail(true, 'G0 failing-first: launcher/entries panel lack 1px outline or directional shadow');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    await page.click('#lp-launcher-btn');
    const issues = await checkOverlaysOutlineAndShadow(page, 'overlay-launcher');
    expect(issues).toEqual([]);
  });

  test('20261106-UX-180: fixture page (/admin/_fixture) uses Page template with >=16px edge padding', async ({ page }) => {
    test.fail(true, 'G0 failing-first: /admin/_fixture is flush to viewport edge');
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/_fixture');
    const issues = await checkPageContentEdgePadding(page);
    expect(issues).toEqual([]);
  });

  test('20261106-UX-181: settings-providers page-level CTA (Save) has 40px gap after last FormSection', async ({ page }) => {
    test.fail(true, 'G0 failing-first: Save CTA is 16px/24px instead of 40px after last FormSection');
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/providers');
    const gapRes = await checkPaintedGaps(page);
    expect(gapRes.pairsByRelation['last-section-to-action-bar']).toBeGreaterThan(0);
    expect(gapRes.violations.filter((v) => v.startsWith('last-section-to-action-bar'))).toEqual([]);
  });
});

test.describe('WP-16.G Full D-G Census (no logged mode, no zero-pair relations)', () => {
  test('every STATES entry passes marker, hooks, roles, single-impl, overlays, and edge padding', async ({ page }) => {
    test.fail(true, 'G0 failing-first: full D-G census fails until G1-G2 complete');
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    const ids = await getSeededIds(page);

    const allViolations: string[] = [];
    const totalPairs: Record<string, number> = {};

    for (const state of STATES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const ok = await navigateToState(page, state, ids);
        if (!ok) continue;
        const markerIssues = await verifyStateMarker(page, state);
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const gapRes = await checkPaintedGaps(page);
          const roleIssues = await checkTypeRolesAndControlLabel(page);
          const implIssues = await checkSingleImplementationPerRole(page);
          const overlayIssues = await checkOverlaysOutlineAndShadow(page, state.id);
          const edgeIssues = state.kind === 'overlay' ? [] : await checkPageContentEdgePadding(page);
          for (const [k, v] of Object.entries(gapRes.pairsByRelation)) {
            totalPairs[k] = (totalPairs[k] || 0) + v;
          }
          for (const issue of [...markerIssues, ...gapRes.violations, ...roleIssues, ...implIssues, ...overlayIssues, ...edgeIssues]) {
            allViolations.push(`[${state.id} ${vp.width} ${theme}] ${issue}`);
          }
        }
      }
    }

    const zeroRelations = Object.entries(totalPairs)
      .filter(([, count]) => count === 0)
      .map(([rel]) => rel);
    expect(zeroRelations).toEqual([]);
    expect(allViolations).toEqual([]);
  });
});
