import { type Page } from '@playwright/test';
import { type StateDefinition, type ThemeMode } from './states-manifest.js';

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

export async function checkColoursAndNativeControls(page: Page, theme: ThemeMode): Promise<string[]> {
  return page.evaluate((activeTheme) => {
    const issues: string[] = [];
    const rootStyle = getComputedStyle(document.documentElement);
    const scheme = rootStyle.colorScheme;
    if (!scheme.includes(activeTheme)) {
      issues.push(`color-scheme=${scheme} expected ${activeTheme}`);
    }

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

    const h1 = document.querySelector('main h1');
    const desc = document.querySelector('main .lp-page-description');
    if (h1 && desc) checkPair('page-title-to-description', h1, desc, 8);

    const header = document.querySelector('main .lp-page-header');
    if (header && header.nextElementSibling) {
      const next = header.nextElementSibling;
      if (isPainted(next) || next.querySelector('*')) {
        checkPair('header-to-content', header, next, 24);
      }
    }

    const tabs = document.querySelector('main [role="tablist"], main .lp-tabs');
    if (tabs && tabs.nextElementSibling) {
      checkPair('tabs-to-content', tabs, tabs.nextElementSibling, 16);
    }

    const items = Array.from(document.querySelectorAll('main .lp-item'));
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].parentElement === items[i + 1].parentElement) {
        checkPair('item-to-item', items[i], items[i + 1], 0);
      }
    }

    const fields = Array.from(document.querySelectorAll('main .lp-field'));
    for (const f of fields) {
      const label = f.querySelector('label, .lp-field-label');
      const control = f.querySelector('input, select, textarea, .lp-select-wrap');
      const help = f.querySelector('.lp-field-help');
      if (label && control) checkPair('label-to-control', label, control, 8);
      if (control && help) checkPair('control-to-help', control, help, 8);
    }

    const main = document.querySelector('main');
    if (main) {
      const blocks = Array.from(
        main.querySelectorAll(
          'h1, h2, p, a, button, input, select, textarea, .lp-segmented-control, .lp-level-bar-fill, .lp-level-label, .lp-tag, .lp-choice, .lp-choice-card-title, .lp-choice-card-desc, .lp-tab, .lp-stepper-label, .lp-item-title, .lp-item-title > span, .lp-item-subtitle, .lp-item-body, .lp-item-status, .lp-field-label, .lp-field-help'
        )
      ).filter((el) => isPainted(el));
      for (let i = 0; i < blocks.length - 1; i++) {
        const a = blocks[i];
        const b = blocks[i + 1];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        if (rb.top < ra.bottom - 1) continue;
        const gap = Math.round(rb.top - ra.bottom);
        if (gap > 42) {
          violations.push(`oversized-painted-gap: ${a.tagName.toLowerCase()}.${a.className} -> ${b.tagName.toLowerCase()}.${b.className} = ${gap}px (>40px)`);
        }
      }
    }

    return { violations, pairsByRelation };
  });
}

export async function checkLines(page: Page, opts: { hasTopBar: boolean; hasPushPanelOpen?: boolean }): Promise<string[]> {
  return page.evaluate(({ hasTopBar, hasPushPanelOpen }) => {
    const issues: string[] = [];

    if (hasTopBar) {
      const topBar = document.querySelector('header.lp-admin-header, header.lp-top-bar, header[data-lp-shell-topbar]');
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

    const hrs = Array.from(document.querySelectorAll('hr')).filter((hr) => getComputedStyle(hr).display !== 'none');
    if (hrs.length > 0) issues.push(`forbidden-hr-count=${hrs.length}`);

    return issues;
  }, opts);
}

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
