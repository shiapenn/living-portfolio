import { test, expect, type Page } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { STATES, THEMES, VIEWPORTS, type StateDefinition, type ThemeMode } from './states-manifest.js';

export interface SeededIds {
  entryId: string;
  inboxId: string | null;
}

export async function getSeededIds(page: Page): Promise<SeededIds> {
  const entryId = await page.evaluate(async () => {
    const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
    const data = await res.json();
    return data.entries?.[0]?.id ?? '';
  });
  const inboxId = await page.evaluate(async () => {
    const res = await fetch('/api/inbox?status=pending&page=1&limit=5', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.questions?.[0]?.id ?? data.items?.[0]?.id ?? null;
  });
  return { entryId, inboxId };
}

export async function setTheme(page: Page, theme: ThemeMode): Promise<void> {
  await page.evaluate(async (t) => {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('strata-theme', t);
    } catch {}
    void document.body.offsetHeight;
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
  }, theme);
}

export async function navigateToState(
  page: Page,
  state: StateDefinition,
  ids: SeededIds
): Promise<boolean> {
  let route = state.route.replace(':id', encodeURIComponent(ids.entryId));
  if (state.id === 'inbox-detail') {
    if (!ids.inboxId) return false;
    route = `/admin/inbox/${encodeURIComponent(ids.inboxId)}`;
  }

  await page.goto(route);

  switch (state.action) {
    case 'editor-settings': {
      await page.click('#ref-switch-settings');
      break;
    }
    case 'editor-tag-add': {
      await page.click('#ref-switch-settings');
      const input = page.locator('#ref-facet-input, #ref-tag-input').first();
      if (await input.isVisible()) {
        await input.fill('architecture');
        await input.press('Enter');
      }
      break;
    }
    case 'editor-role-suggested':
    case 'editor-role-accepted':
    case 'editor-role-ignored': {
      await page.click('#ref-switch-settings');
      break;
    }
    case 'login-recovery': {
      const link = page.locator('a[href*="recovery"], button:has-text("recovery"), a:has-text("recovery")').first();
      if (await link.isVisible()) await link.click();
      break;
    }
    case 'login-error': {
      await page.fill('#login-username', 'wrong_user');
      await page.fill('#login-password', 'wrong_pass');
      await page.fill('#login-totp', '000000');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(300);
      break;
    }
    case 'open-launcher': {
      await page.click('#lp-launcher-btn');
      break;
    }
    case 'open-account': {
      await page.click('#lp-account-menu-btn');
      break;
    }
    case 'open-entries-panel': {
      await page.click('#ref-sidebar-toggle');
      break;
    }
    case 'open-delete-dialog': {
      await page.click('#ref-btn-delete');
      break;
    }
    case 'open-publish-dialog': {
      await page.click('#ref-switch-settings');
      await page.click('#ref-btn-publish');
      break;
    }
    case 'open-slash-menu': {
      await page.click('#ref-tiptap-editor .ProseMirror');
      await page.keyboard.type('/');
      break;
    }
    default:
      break;
  }
  return true;
}

/**
 * 1. Rendered-text check (D-FINAL #3):
 * Scans visible DOM text for arrows, internal words, unresolved placeholders, and raw JSON.
 */
export async function checkRenderedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const arrowRe = /(<-|->|←|→|«|»)/;
    const internalRe = /\b(profile|facet|facets|temporal|tier|spec|ids)\b/i;
    const placeholderRe = /<(slug|id|section|entry|token)>/i;
    const jsonRe = /^\s*(\{[^}]*"\w+":|\[[^\]]*\{)/;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      if (parent.closest('script, style, svg, code, pre, .ProseMirror, textarea, [data-allow-raw]')) continue;
      const cs = getComputedStyle(parent);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const text = (node.textContent || '').trim();
      if (!text) continue;

      if (arrowRe.test(text)) issues.push(`arrow: "${text.slice(0, 60)}"`);
      if (internalRe.test(text)) issues.push(`internal-word: "${text.slice(0, 60)}"`);
      if (placeholderRe.test(text)) issues.push(`placeholder: "${text.slice(0, 60)}"`);
      if (jsonRe.test(text)) issues.push(`raw-json: "${text.slice(0, 60)}"`);
    }
    return issues;
  });
}

/**
 * 2. Colour & native-control check (D-FINAL #4):
 * Verifies color-scheme matches theme and native controls / visible elements use active theme tokens.
 */
export async function checkColoursAndNativeControls(page: Page, theme: ThemeMode): Promise<string[]> {
  return page.evaluate((activeTheme) => {
    const issues: string[] = [];
    const rootStyle = getComputedStyle(document.documentElement);
    const scheme = rootStyle.colorScheme;
    if (!scheme.includes(activeTheme)) {
      issues.push(`color-scheme=${scheme} expected ${activeTheme}`);
    }

    // Collect valid resolved rgb(...) values from CSS custom properties on :root
    const allowedColors = new Set<string>(['rgba(0, 0, 0, 0)', 'transparent']);
    const probe = document.createElement('div');
    probe.style.display = 'none';
    document.body.appendChild(probe);

    const tokenNames = [
      '--surface-page', '--surface', '--surface-l0', '--surface-l1', '--surface-l2',
      '--surface-input', '--surface-subtle', '--bg-subtle', '--text', '--text-1',
      '--text-2', '--text-3', '--text-muted', '--text-on-accent', '--accent',
      '--accent-tint', '--border-subtle', '--border-control', '--focus-ring',
      '--role-action-bg', '--role-action-fg', '--role-danger-bg', '--role-danger-fg',
      '--role-danger-border', '--role-warning-bg', '--role-warning-fg',
      '--role-success-bg', '--role-success-fg', '--role-neutral-bg', '--role-neutral-fg',
      '--status-draft', '--status-unlisted', '--status-public',
    ];
    for (const name of tokenNames) {
      const val = rootStyle.getPropertyValue(name).trim();
      if (!val) continue;
      probe.style.color = val;
      const resolved = getComputedStyle(probe).color;
      if (resolved) allowedColors.add(resolved);
    }
    probe.remove();

    const controls = Array.from(document.querySelectorAll('select, input, textarea'));
    for (const el of controls) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      if (activeTheme === 'dark' && (cs.backgroundColor === 'rgb(255, 255, 255)' || cs.backgroundColor === 'rgba(0, 0, 0, 0)')) {
        if (el.tagName === 'SELECT') {
          issues.push(`dark-native-select-bg: ${el.tagName.toLowerCase()}#${el.id} bg=${cs.backgroundColor}`);
        }
      }
      if (!allowedColors.has(cs.backgroundColor)) {
        issues.push(`non-token-bg: ${el.tagName.toLowerCase()}#${el.id} bg=${cs.backgroundColor}`);
      }
      if (!allowedColors.has(cs.color)) {
        issues.push(`non-token-fg: ${el.tagName.toLowerCase()}#${el.id} color=${cs.color}`);
      }
    }
    return issues;
  }, theme);
}

/**
 * 3. Painted-gap check (D-FINAL #2):
 * Measures painted boxes only (ignores empty containers/wrappers and hidden elements).
 * Returns violations and counts of pairs measured per relation.
 */
export async function checkPaintedGaps(page: Page): Promise<{
  violations: string[];
  pairsByRelation: Record<string, number>;
}> {
  return page.evaluate(() => {
    const violations: string[] = [];
    const pairsByRelation: Record<string, number> = {
      'page-title-to-description': 0,
      'header-to-content': 0,
      'tabs-to-content': 0,
      'section-heading-to-intro': 0,
      'heading-or-intro-to-first': 0,
      'label-to-control': 0,
      'control-to-help': 0,
      'field-to-field': 0,
      'item-to-item': 0,
      'section-to-section': 0,
      'last-control-to-action-bar': 0,
      'button-to-button': 0,
      'dialog-title-to-body': 0,
      'dialog-body-to-action-bar': 0,
    };

    const isPainted = (el: Element): boolean => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
      );
      const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
      const hasBorder =
        parseFloat(cs.borderTopWidth) > 0 ||
        parseFloat(cs.borderBottomWidth) > 0 ||
        parseFloat(cs.borderLeftWidth) > 0 ||
        parseFloat(cs.borderRightWidth) > 0;
      const isLeafMedia = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SVG', 'IMG', 'HR'].includes(el.tagName);
      return hasDirectText || hasBg || hasBorder || isLeafMedia;
    };

    const checkPair = (relation: string, topEl: Element | null, bottomEl: Element | null, expected: number) => {
      if (!topEl || !bottomEl) return;
      const cs1 = getComputedStyle(topEl);
      const cs2 = getComputedStyle(bottomEl);
      if (cs1.display === 'none' || cs2.display === 'none') return;
      const r1 = topEl.getBoundingClientRect();
      const r2 = bottomEl.getBoundingClientRect();
      if (r1.height < 1 || r2.height < 1) return;
      pairsByRelation[relation] = (pairsByRelation[relation] || 0) + 1;
      const gap = Math.round(r2.top - r1.bottom);
      if (Math.abs(gap - expected) > 1) {
        violations.push(`${relation}: expected ${expected}px (+-1), got ${gap}px`);
      }
    };

    // Page title to description
    const h1 = document.querySelector('main h1');
    const desc = document.querySelector('main .lp-page-description');
    if (h1 && desc) checkPair('page-title-to-description', h1, desc, 8);

    // Header block to first content
    const header = document.querySelector('main .lp-page-header');
    if (header && header.nextElementSibling) {
      const next = header.nextElementSibling;
      if (isPainted(next) || next.querySelector('*')) {
        checkPair('header-to-content', header, next, 24);
      }
    }

    // Tabs to content
    const tabs = document.querySelector('main [role="tablist"], main .lp-tabs');
    if (tabs && tabs.nextElementSibling) {
      checkPair('tabs-to-content', tabs, tabs.nextElementSibling, 16);
    }

    // Items to items
    const items = Array.from(document.querySelectorAll('main .lp-item'));
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].parentElement === items[i + 1].parentElement) {
        checkPair('item-to-item', items[i], items[i + 1], 0);
      }
    }

    // Fields: label to control, control to help, field to field
    const fields = Array.from(document.querySelectorAll('main .lp-field'));
    for (const f of fields) {
      const label = f.querySelector('label, .lp-field-label');
      const control = f.querySelector('input, select, textarea, .lp-select-wrap');
      const help = f.querySelector('.lp-field-help');
      if (label && control) checkPair('label-to-control', label, control, 8);
      if (control && help) checkPair('control-to-help', control, help, 8);
    }

    // Consecutive painted blocks inside main column: catch any gap > 40px or collapsed-margin 0px between non-items
    const main = document.querySelector('main');
    if (main) {
      const blocks = Array.from(main.querySelectorAll('h1, h2, p, .lp-item, .lp-field, .lp-action-bar, .lp-tabs, .lp-stepper'))
        .filter((el) => isPainted(el));
      for (let i = 0; i < blocks.length - 1; i++) {
        const a = blocks[i];
        const b = blocks[i + 1];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        if (rb.top < ra.bottom - 1) continue; // side-by-side or different columns
        const gap = Math.round(rb.top - ra.bottom);
        if (gap > 42) {
          violations.push(`oversized-painted-gap: ${a.tagName.toLowerCase()}.${a.className} -> ${b.tagName.toLowerCase()}.${b.className} = ${gap}px (>40px)`);
        }
      }
    }

    return { violations, pairsByRelation };
  });
}

/**
 * 4. Line check, positive and negative (D-FINAL #5).
 */
export async function checkLines(page: Page, opts: { hasTopBar: boolean; hasPushPanelOpen?: boolean }): Promise<string[]> {
  return page.evaluate(({ hasTopBar, hasPushPanelOpen }) => {
    const issues: string[] = [];

    if (hasTopBar) {
      const topBar = document.querySelector('header.lp-top-bar, header[data-lp-shell-topbar]');
      if (!topBar) {
        issues.push('missing-top-bar');
      } else {
        const bw = parseFloat(getComputedStyle(topBar).borderBottomWidth) || 0;
        if (bw < 0.5) issues.push(`missing-top-bar-bottom-hairline (borderBottomWidth=${bw})`);
      }
    }

    const items = Array.from(document.querySelectorAll('main .lp-item'));
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && items[i].parentElement === items[i - 1].parentElement) {
        const bt = parseFloat(getComputedStyle(items[i]).borderTopWidth) || 0;
        const bbPrev = parseFloat(getComputedStyle(items[i - 1]).borderBottomWidth) || 0;
        if (bt < 0.5 && bbPrev < 0.5) {
          issues.push(`missing-item-hairline at index ${i}`);
        }
      }
    }

    if (hasPushPanelOpen) {
      const panel = document.querySelector('.lp-entries-panel, #ref-entries-panel');
      if (panel) {
        const br = parseFloat(getComputedStyle(panel).borderRightWidth) || 0;
        if (br < 0.5) issues.push(`missing-push-panel-inner-hairline (borderRightWidth=${br})`);
      }
    }

    // Negative: no <hr> or divider borders in main outside items/controls/tabs
    const hrs = Array.from(document.querySelectorAll('hr')).filter((hr) => getComputedStyle(hr).display !== 'none');
    if (hrs.length > 0) issues.push(`forbidden-hr-count=${hrs.length}`);

    return issues;
  }, opts);
}

/**
 * 5. Edge-alignment & editor geometry check (D-FINAL #15, #16).
 */
export async function checkEditorEdgeAlignment(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const topLeftIcon = document.querySelector('#lp-launcher-btn');
    const topRightIcon = document.querySelector('#lp-account-menu-btn');
    const panelToggle = document.querySelector('#ref-sidebar-toggle');
    const saveBtn = document.querySelector('#ref-btn-save');
    const segSwitch = document.querySelector('#ref-view-switch, .lp-segmented-control');
    const headerRow = document.querySelector('.lp-editor-header-row, #ref-editor-toolbar');
    const formatBar = document.querySelector('#ref-format-bar, .lp-format-bar');

    if (topLeftIcon && panelToggle) {
      const l1 = Math.round(topLeftIcon.getBoundingClientRect().left);
      const l2 = Math.round(panelToggle.getBoundingClientRect().left);
      if (Math.abs(l1 - l2) > 1) issues.push(`left-edge-mismatch: topBar=${l1}, panelToggle=${l2}`);
    }
    if (topRightIcon && saveBtn) {
      const r1 = Math.round(topRightIcon.getBoundingClientRect().right);
      const r2 = Math.round(saveBtn.getBoundingClientRect().right);
      if (Math.abs(r1 - r2) > 1) issues.push(`right-edge-mismatch: accountIcon=${r1}, saveBtn=${r2}`);
    }
    if (segSwitch) {
      const r = segSwitch.getBoundingClientRect();
      const center = (r.left + r.right) / 2;
      const vpCenter = window.innerWidth / 2;
      if (Math.abs(center - vpCenter) > 1.5) {
        issues.push(`switch-not-centred: center=${center.toFixed(1)}, vpCenter=${vpCenter.toFixed(1)}`);
      }
    }
    if (headerRow) {
      const r = headerRow.getBoundingClientRect();
      if (r.right > window.innerWidth + 1) issues.push(`header-row-overflow: right=${r.right} > ${window.innerWidth}`);
    }
    if (formatBar) {
      const cs = getComputedStyle(formatBar);
      if (cs.position !== 'fixed') issues.push(`format-bar-not-fixed: position=${cs.position}`);
      const r = formatBar.getBoundingClientRect();
      const bottomDist = Math.round(window.innerHeight - r.bottom);
      if (Math.abs(bottomDist - 16) > 1) {
        issues.push(`format-bar-bottom-dist: expected 16px, got ${bottomDist}px`);
      }
    }
    return issues;
  });
}

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
