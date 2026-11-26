import { type Page } from '@playwright/test';
import {
  BREAKPOINTS,
  COMPONENT_TOKEN_VALUES,
  RELATIONS,
  RESPONSIVE_TOKEN_VALUES,
  TYPE_ROLES,
} from '../../packages/design-tokens/src/index.js';
import { type StateDefinition, type ThemeMode } from './states-manifest.js';

export const TOKEN_SPEC = {
  breakpoints: BREAKPOINTS,
  relations: RELATIONS,
  typeRoles: TYPE_ROLES,
  controlHeightMobile: parseFloat(COMPONENT_TOKEN_VALUES['--lp-size-control-height']),
  controlHeightDesktop: parseFloat(RESPONSIVE_TOKEN_VALUES.sm['--lp-size-control-height']),
  btnItemMinWidth: parseFloat(COMPONENT_TOKEN_VALUES['--lp-size-btn-item-min']),
  barTopHeight: parseFloat(COMPONENT_TOKEN_VALUES['--lp-size-bar-top-height']),
  barEditorHeight: parseFloat(COMPONENT_TOKEN_VALUES['--lp-size-bar-editor-height']),
  radii: [
    0,
    parseFloat(COMPONENT_TOKEN_VALUES['--lp-radius-r1']),
    parseFloat(COMPONENT_TOKEN_VALUES['--lp-radius-r2']),
  ],
};

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
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      const label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      const icon = t === 'dark' ? 'sun' : 'moon';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('title', label);
      themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      const useEl = themeBtn.querySelector('use');
      if (useEl) useEl.setAttribute('href', `#lp-icon-${icon}`);
      if (document.activeElement === themeBtn) (themeBtn as HTMLElement).blur();
    }
    void document.body.offsetHeight;
    await Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {}))
      ),
      new Promise((r) => setTimeout(r, 250)),
    ]);
  }, theme);
  await page.mouse.move(0, 0);
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
  } else if (state.action === 'providers-step-2') {
    route = '/admin/settings/providers/change?step=2&provider=openai';
  } else if (state.action === 'providers-step-3') {
    route = '/admin/settings/providers/change?step=3&provider=openai';
  }

  await page.goto(route);

  switch (state.action) {
    case 'setup-step-1':
    case 'setup-step-2':
    case 'setup-step-3':
    case 'setup-step-4':
    case 'setup-step-5':
    case 'setup-step-6': {
      const targetStep = Number(state.action.replace('setup-step-', ''));
      await page.waitForSelector(`#wizard-step-${targetStep}:not(.lp-is-hidden)`, { timeout: 5000 });
      break;
    }
    case 'editor-settings': {
      await page.click('#ref-switch-settings');
      break;
    }
    case 'editor-tag-add': {
      await page.click('#ref-switch-settings');
      const input = page.locator('#ref-facet-value, #ref-facet-input, #ref-tag-input').first();
      if (await input.isVisible()) {
        await input.fill('architecture');
        await input.press('Enter');
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      break;
    }
    case 'editor-role-suggested': {
      await page.click('#ref-switch-settings');
      break;
    }
    case 'editor-role-accepted': {
      await page.click('#ref-switch-settings');
      await page.waitForSelector('#ref-spans-list .lp-item', { timeout: 5000 }).catch(() => {});
      const undoCount = await page.locator('#ref-spans-list [data-span-action="undo"]').count();
      if (undoCount === 0) {
        const acceptBtn = page.locator('#ref-spans-list [data-span-action="accept"]').first();
        if (await acceptBtn.isVisible()) {
          await acceptBtn.click();
          await page.waitForSelector('#ref-spans-list [data-span-action="undo"]', { timeout: 3000 }).catch(() => {});
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      }
      break;
    }
    case 'editor-role-ignored': {
      await page.click('#ref-switch-settings');
      await page.waitForSelector('#ref-spans-list .lp-item', { timeout: 5000 }).catch(() => {});
      const restoreCount = await page.locator('#ref-spans-list [data-span-action="restore"]').count();
      if (restoreCount === 0) {
        const rejectBtn = page.locator('#ref-spans-list [data-span-action="reject"]').first();
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click();
          await page.waitForSelector('#ref-spans-list [data-span-action="restore"]', { timeout: 3000 }).catch(() => {});
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      }
      break;
    }
    case 'login-recovery': {
      const link = page.locator('a[href*="recovery"], button:has-text("recovery"), a:has-text("recovery")').first();
      if (await link.isVisible()) {
        await link.click();
        await page.mouse.move(0, 0);
      }
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
      const delBtn = page.locator('#ref-btn-delete');
      if (await delBtn.isVisible()) {
        await delBtn.click();
      } else {
        await page.click('#ref-btn-more');
      }
      break;
    }
    case 'open-publish-dialog': {
      await page.click('#ref-switch-settings');
      await page.click('#ref-btn-publish');
      break;
    }
    case 'open-slash-menu': {
      const pm = page.locator('#ref-tiptap-editor .ProseMirror');
      await pm.waitFor({ state: 'visible', timeout: 5000 });
      await pm.scrollIntoViewIfNeeded();
      await pm.click();
      await pm.evaluate((el) => (el as HTMLElement).focus());
      const existing = (await pm.textContent())?.trim() ?? '';
      if (existing.length > 0) {
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('Backspace');
      }
      await pm.pressSequentially('/');
      await page.locator('#ref-slash-menu').waitFor({ state: 'visible', timeout: 5000 });
      break;
    }
    default:
      break;
  }
  return true;
}

export async function verifyStateMarker(page: Page, state: StateDefinition): Promise<string[]> {
  const issues: string[] = [];
  const { marker } = state;
  if (marker.routePattern && !page.url().includes(marker.routePattern)) {
    issues.push(`marker-route-mismatch: url="${page.url()}" expected to include "${marker.routePattern}"`);
  }
  const evalIssues = await page.evaluate(
    ({ selector, text }) => {
      const errs: string[] = [];
      if (selector) {
        const el = document.querySelector(selector);
        if (!el) {
          errs.push(`marker-selector-missing: "${selector}"`);
        } else {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (cs.display === 'none' || cs.visibility === 'hidden' || (r.width === 0 && r.height === 0)) {
            errs.push(`marker-selector-hidden: "${selector}"`);
          }
        }
      }
      if (text) {
        const bodyText = document.body.innerText || '';
        if (!bodyText.includes(text)) {
          errs.push(`marker-text-missing: "${text}"`);
        }
      }
      return errs;
    },
    { selector: marker.selector, text: marker.text }
  );
  issues.push(...evalIssues);
  return issues;
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
      '--lp-color-surface-canvas', '--lp-color-surface-raised', '--lp-color-surface-sunken',
      '--lp-color-surface-overlay', '--lp-color-surface-disabled',
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

export async function checkPaintedGaps(
  page: Page,
  opts: { includeDG?: boolean } = {}
): Promise<{
  violations: string[];
  pairsByRelation: Record<string, number>;
}> {
  return page.evaluate(({ includeDG, rel }) => {
    const violations: string[] = [];
    const pairsByRelation: Record<string, number> = {
      'page-title-to-description': 0,
      'header-to-content': 0,
      'tabs-to-content': 0,
      'section-heading-to-intro': 0,
      'heading-or-intro-to-first': 0,
      'subsection-to-subsection': 0,
      'subsection-title-to-intro': 0,
      'subsection-intro-to-first': 0,
      'label-to-control': 0,
      'control-to-help': 0,
      'field-to-field': 0,
      'item-to-item': 0,
      'segment-label-to-text': 0,
      'segment-to-segment': 0,
      'item-body-to-action-bar': 0,
      'section-to-section': 0,
      'last-section-to-action-bar': 0,
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
    if (h1 && desc) checkPair('page-title-to-description', h1, desc, rel['page-title-to-description']);

    const header = document.querySelector('main .lp-page-header');
    if (header && header.nextElementSibling) {
      const next = header.nextElementSibling;
      if (isPainted(next) || next.querySelector('*')) {
        checkPair('header-to-content', header, next, rel['header-to-content']);
      }
    }

    const tabs = document.querySelector('main [role="tablist"], main .lp-tabs');
    if (tabs && tabs.nextElementSibling) {
      checkPair('tabs-to-content', tabs, tabs.nextElementSibling, rel['tabs-to-content']);
    }

    const items = Array.from(document.querySelectorAll('main .lp-item'));
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].parentElement === items[i + 1].parentElement) {
        checkPair('item-to-item', items[i], items[i + 1], rel['item-to-item']);
      }
    }

    const fields = Array.from(document.querySelectorAll('main [data-rel="field"], main .lp-field'));
    for (const f of fields) {
      const label = f.querySelector('[data-rel="label"], label, .lp-field-label');
      const control = f.querySelector('[data-rel="control"], input, select, textarea, .lp-select-wrap');
      const help = f.querySelector('[data-rel="help"], .lp-field-help');
      if (label && control) checkPair('label-to-control', label, control, rel['label-to-control']);
      if (control && help) checkPair('control-to-help', control, help, rel['label-to-control']);
    }
    for (let i = 0; i < fields.length - 1; i++) {
      if (includeDG && fields[i].parentElement === fields[i + 1].parentElement) {
        checkPair('field-to-field', fields[i], fields[i + 1], rel['field-to-field']);
      }
    }

    if (includeDG) {
      const sections = Array.from(document.querySelectorAll('main [data-rel="section"], main .lp-form-section'));
      for (const sec of sections) {
        const sHeader = sec.querySelector<HTMLElement>('[data-c="SectionHeader"]');
        const sTitle = sec.querySelector('[data-rel="section-title"], .lp-form-section-title, .lp-section-title');
        const sIntro = sec.querySelector('[data-rel="section-intro"], .lp-form-section-desc');
        if (sTitle && sIntro) checkPair('section-heading-to-intro', sTitle, sIntro, rel['section-heading-to-intro']);
        const headerLead = sIntro ?? sHeader ?? sTitle;
        const firstChild = sec.querySelector('.lp-level, [data-rel="field"], [data-rel="item"], [data-rel="subsection"], .lp-field, .lp-item, .lp-list, .lp-choice-group');
        if (headerLead && firstChild) checkPair('heading-or-intro-to-first', headerLead, firstChild, rel['heading-to-first']);
      }
      for (let i = 0; i < sections.length - 1; i++) {
        if (sections[i].parentElement === sections[i + 1].parentElement) {
          checkPair('section-to-section', sections[i], sections[i + 1], rel['section-to-section']);
        }
      }
      if (sections.length > 0) {
        const lastSec = sections[sections.length - 1];
        const pageActionBar = lastSec.nextElementSibling?.matches('[data-rel="page-actions"], .lp-action-bar')
          ? lastSec.nextElementSibling
          : null;
        if (pageActionBar) checkPair('last-section-to-action-bar', lastSec, pageActionBar, rel['action-bar-after-section']);
      }

      const subsections = Array.from(document.querySelectorAll('main [data-rel="subsection"], main .lp-subsection'));
      for (const sub of subsections) {
        const subTitle = sub.querySelector('[data-rel="subsection-title"], .lp-subsection-title');
        const subIntro = sub.querySelector('[data-rel="subsection-intro"], .lp-subsection-intro');
        if (subTitle && subIntro) checkPair('subsection-title-to-intro', subTitle, subIntro, 8);
        const subLead = subIntro ?? subTitle;
        const subFirst = sub.querySelector('#ref-facets-list:not(:empty), [data-rel="field"], [data-rel="item"], .lp-field, .lp-item, .lp-list');
        if (subLead && subFirst) checkPair('subsection-intro-to-first', subLead, subFirst, 16);
      }
      for (let i = 0; i < subsections.length - 1; i++) {
        if (subsections[i].parentElement === subsections[i + 1].parentElement) {
          checkPair('subsection-to-subsection', subsections[i], subsections[i + 1], 24);
        }
      }

      const segments = Array.from(document.querySelectorAll('main [data-rel="segment"], main .lp-item-segment'));
      for (const seg of segments) {
        const segLabel = seg.querySelector('[data-rel="segment-label"], .lp-item-segment-heading');
        const segBody = seg.querySelector('[data-rel="segment-text"], .lp-item-body');
        if (segLabel && segBody) checkPair('segment-label-to-text', segLabel, segBody, 4);
      }
      for (let i = 0; i < segments.length - 1; i++) {
        if (segments[i].parentElement === segments[i + 1].parentElement) {
          checkPair('segment-to-segment', segments[i], segments[i + 1], 16);
        }
      }

      for (const itemEl of items) {
        const iBody = itemEl.querySelector('.lp-item-content') ?? itemEl.querySelector('[data-rel="itembody"], .lp-item-segments, .lp-item-body');
        const iActions = itemEl.querySelector('[data-rel="actions"], .lp-item-actions');
        if (iBody && iActions) checkPair('item-body-to-action-bar', iBody, iActions, 16);
      }

      const actionBars = Array.from(document.querySelectorAll('[data-rel="actions"], .lp-action-bar'));
      for (const bar of actionBars) {
        const btns = Array.from(bar.querySelectorAll('button, a.lp-btn')).filter((b) => isPainted(b));
        for (let i = 0; i < btns.length - 1; i++) {
          const r1 = btns[i].getBoundingClientRect();
          const r2 = btns[i + 1].getBoundingClientRect();
          if (r2.top >= r1.bottom - 1) checkPair('button-to-button', btns[i], btns[i + 1], 8);
        }
        const barContainer = bar.parentElement?.classList.contains('lp-action-bar-group') ? bar.parentElement : bar;
        let prev: Element | null = barContainer.previousElementSibling;
        while (prev && (prev.classList.contains('lp-sr-only') || getComputedStyle(prev).display === 'none' || getComputedStyle(prev).position === 'absolute')) {
          prev = prev.previousElementSibling;
        }
        const hasVisibleControl = prev
          ? Array.from(prev.querySelectorAll('input, select, textarea, .lp-choice, [data-c="Item"]')).some(
              (c) => getComputedStyle(c).display !== 'none' && !c.closest('.lp-is-hidden, [hidden]')
            )
          : false;
        const isHeadingOnlyWrapper = Boolean(prev && prev.querySelector('[data-rel="subsection-title"]') && !hasVisibleControl);
        if (prev && !isHeadingOnlyWrapper && !prev.matches('[data-rel="section"], .lp-form-section, h1, h2, h3') && !bar.closest('[role="dialog"]') && !bar.classList.contains('lp-item-actions')) {
          checkPair('last-control-to-action-bar', prev, barContainer, 24);
        }
      }

      const openDialog = document.querySelector('[role="dialog"]:not([hidden]) .lp-dialog-panel');
      if (openDialog) {
        const dTitle = openDialog.querySelector('.lp-dialog-header');
        const dBody = openDialog.querySelector('.lp-dialog-body');
        const dActions = openDialog.querySelector('.lp-dialog-footer, .lp-action-bar');
        if (dTitle && dBody) checkPair('dialog-title-to-body', dTitle, dBody, 16);
        if (dBody && dActions) checkPair('dialog-body-to-action-bar', dBody, dActions, 24);
      }
    }

    const main = document.querySelector('main');
    if (main) {
      const blocks = Array.from(
        main.querySelectorAll(
          'h1, h2, h3, p, li, a, button, input, select, textarea, .lp-segmented-control, .lp-level-bar-fill, .lp-level-label, .lp-tag, .lp-choice, .lp-tab, .lp-stepper-label, .lp-stepper-bar, .lp-auth-progress-track, .lp-item-title, .lp-item-title > span, .lp-item-subtitle, .lp-item-body, .lp-item-status, .lp-field-label, .lp-field-help'
        )
      ).filter((el) => {
        if (!isPainted(el)) return false;
        if (el.closest('.lp-format-bar, .lp-dialog-backdrop, .lp-popover-menu, .lp-overlay-sheet, .lp-launcher-panel, [role="dialog"], [role="menu"]')) return false;
        return getComputedStyle(el).position !== 'fixed';
      });
      for (let i = 0; i < blocks.length - 1; i++) {
        const a = blocks[i];
        const b = blocks[i + 1];
        if (a.parentElement !== b.parentElement) continue;
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
  }, { includeDG: Boolean(opts.includeDG), rel: RELATIONS });
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
        const afterPrev = getComputedStyle(items[i - 1], '::after');
        const hasAfterHairline = afterPrev.content !== 'none' && (parseFloat(afterPrev.height) || 0) >= 0.5;
        if (bt < 0.5 && bbPrev < 0.5 && !hasAfterHairline) {
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


export async function checkTypeRolesAndControlLabel(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const tags = Array.from(document.querySelectorAll('.lp-tag'));
    for (const tag of tags) {
      const cs = getComputedStyle(tag);
      const fs = Math.round(parseFloat(cs.fontSize) || 0);
      if (fs !== 13) issues.push(`tag-font-size: expected 13px secondary, got ${fs}px`);
    }
    const disabledEls = Array.from(document.querySelectorAll(':disabled'));
    for (const el of disabledEls) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const isBtn = el.tagName === 'BUTTON' || el.classList.contains('lp-btn');
      const expectedWeight = isBtn ? '600' : '400';
      if (cs.fontWeight !== expectedWeight) {
        issues.push(`disabled-weight: ${el.tagName} weight=${cs.fontWeight} expected ${expectedWeight}`);
      }
    }
    return issues;
  });
}

export async function checkSingleImplementationPerRole(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const backCandidates = Array.from(document.querySelectorAll('a, button')).filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const txt = (el.textContent || '').trim();
      return /^back\b/i.test(txt);
    });
    for (const el of backCandidates) {
      if (el.getAttribute('data-c') !== 'BackLink') {
        issues.push(`back-outside-component: "${(el.textContent || '').trim()}" missing data-c="BackLink"`);
      } else if ((el.textContent || '').trim() !== 'Back') {
        issues.push(`back-text-not-exact: "${(el.textContent || '').trim()}" expected "Back"`);
      }
    }
    const stepperCandidates = Array.from(document.querySelectorAll('div, p, span')).filter((el) => {
      if (el.children.length > 0) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return /step \d+ of \d+/i.test((el.textContent || '').trim());
    });
    for (const el of stepperCandidates) {
      if (!el.closest('[data-c="Stepper"]')) {
        issues.push(`stepper-outside-component: "${(el.textContent || '').trim()}"`);
      }
    }
    const selects = Array.from(document.querySelectorAll('select')).filter((el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0);
    for (const sel of selects) {
      if (!sel.closest('[data-c="Select"]')) {
        issues.push(`select-outside-component: #${sel.id || '(no-id)'}`);
      } else {
        const wrap = sel.closest('[data-c="Select"]')!;
        const chev = wrap.querySelector('.lp-select-chevron');
        if (chev) {
          const wr = wrap.getBoundingClientRect();
          const cr = chev.getBoundingClientRect();
          const wMid = (wr.top + wr.bottom) / 2;
          const cMid = (cr.top + cr.bottom) / 2;
          if (Math.abs(wMid - cMid) > 2) {
            issues.push(`select-chevron-not-centered: #${sel.id} wMid=${wMid.toFixed(1)} cMid=${cMid.toFixed(1)}`);
          }
          const rightDist = Math.round(wr.right - cr.right);
          if (Math.abs(rightDist - 12) > 2) {
            issues.push(`select-chevron-right-dist: #${sel.id} got ${rightDist}px expected 12px`);
          }
        }
      }
    }
    return issues;
  });
}

export async function checkOverlaysOutlineAndShadow(page: Page, stateId: string): Promise<string[]> {
  return page.evaluate((sid) => {
    const issues: string[] = [];
    const overlays = Array.from(
      document.querySelectorAll('.lp-popover-menu:not([hidden]), .lp-launcher-panel:not([hidden]), .lp-dialog-panel, .lp-overlay-sheet:not([hidden]), .lp-entries-drawer:not([hidden]), .lp-format-bar')
    ).filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    });
    for (const el of overlays) {
      const cs = getComputedStyle(el);
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw < 0.9) issues.push(`overlay-missing-1px-outline: ${el.className} border=${bw}`);
      if (!cs.boxShadow || cs.boxShadow === 'none') {
        issues.push(`overlay-missing-shadow: ${el.className}`);
      } else if (sid === 'overlay-entries-panel' && (el.id === 'ref-entries-drawer' || el.classList.contains('lp-editor-drawer') || el.classList.contains('lp-entries-drawer'))) {
        // Left panel shadow should point right (positive x offset)
        const m = cs.boxShadow.match(/rgb[a]?\([^)]+\)\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
        if (m && parseFloat(m[1]) <= 0) issues.push(`overlay-panel-shadow-direction: x=${m[1]} expected > 0`);
      }
    }
    return issues;
  }, stateId);
}

export async function checkPageContentEdgePadding(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const main = document.querySelector('main');
    if (!main) return issues;
    const painted = Array.from(main.querySelectorAll('h1, h2, p, input, select, button, .lp-item, .lp-choice, .lp-list')).filter((el) => {
      if (el.closest('.lp-editor-header-row')) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (const el of painted) {
      const r = el.getBoundingClientRect();
      if (r.left < 15 || window.innerWidth - r.right < 15) {
        issues.push(`edge-padding-violation: ${el.tagName.toLowerCase()}.${el.className} left=${Math.round(r.left)} rightGap=${Math.round(window.innerWidth - r.right)}`);
        break;
      }
    }
    return issues;
  });
}

/**
 * G-census v2 C1 + C2:
 * - C1 Containment: every visible child of a [data-c] element lies within its parent's box (0.5px tolerance),
 *   except children explicitly marked [data-overlay].
 * - C2 Overlap: no two visible text-bearing leaf boxes intersect (tolerance 0).
 */
export async function checkContainmentAndOverlap(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const isVis = (el: Element): boolean => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
      if (el.closest('[hidden], .lp-is-hidden, .lp-sr-only')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    };

    const comps = Array.from(document.querySelectorAll('[data-c]')).filter(isVis);
    for (const parent of comps) {
      if (getComputedStyle(parent).overflow !== 'visible') continue;
      const pr = parent.getBoundingClientRect();
      for (const child of Array.from(parent.children)) {
        if (child.hasAttribute('data-overlay') || child.closest('[data-overlay]')) continue;
        if (!isVis(child)) continue;
        const cr = child.getBoundingClientRect();
        if (
          cr.left < pr.left - 0.5 ||
          cr.right > pr.right + 0.5 ||
          cr.top < pr.top - 0.5 ||
          cr.bottom > pr.bottom + 0.5
        ) {
          issues.push(
            `c1-containment: [data-c="${parent.getAttribute('data-c')}"] child ${child.tagName.toLowerCase()}.${child.className} overflows parent (${Math.round(cr.left)}..${Math.round(cr.right)} vs ${Math.round(pr.left)}..${Math.round(pr.right)}, ${Math.round(cr.top)}..${Math.round(cr.bottom)} vs ${Math.round(pr.top)}..${Math.round(pr.bottom)})`
          );
        }
      }
    }

    const leafBoxes: Array<{ el: Element; rect: DOMRect }> = [];
    const allEls = Array.from(document.querySelectorAll('main *'));
    for (const el of allEls) {
      if (el.closest('svg')) continue;
      if (!isVis(el)) continue;
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
      );
      const isDot = el.classList.contains('lp-status-dot') || el.classList.contains('lp-status-dot-circle');
      if (!hasDirectText && !isDot) continue;
      if (el.closest('[data-overlay]')) continue;
      leafBoxes.push({ el, rect: el.getBoundingClientRect() });
    }
    const fixedOverlayRoot = (el: Element): Element | null => {
      const sticky = el.closest('.lp-editor-toolbar-sticky');
      if (sticky && getComputedStyle(sticky).position === 'sticky') return sticky;
      const overlay = el.closest('.lp-editor-drawer, [data-overlay], [role="dialog"]');
      if (overlay && getComputedStyle(overlay).position === 'fixed') return overlay;
      return null;
    };
    for (let i = 0; i < leafBoxes.length; i++) {
      for (let j = i + 1; j < leafBoxes.length; j++) {
        const a = leafBoxes[i];
        const b = leafBoxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (fixedOverlayRoot(a.el) !== fixedOverlayRoot(b.el)) continue;
        const ix = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
        const iy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
        if (ix > 0.5 && iy > 0.5) {
          issues.push(
            `c2-overlap: ${a.el.tagName.toLowerCase()}.${a.el.className} intersects ${b.el.tagName.toLowerCase()}.${b.el.className}`
          );
        }
      }
    }
    return issues;
  });
}

/**
 * G-census v2 C3:
 * - Control-height token (H1): 44px (<640px), 40px (>=640px)
 * - Radius scale (H7): {0, 4, 8, full}
 * - Text-button fill (H8): .lp-btn-text rgba(0,0,0,0) and border 0; no .lp-recovery-link
 * - sr-only size (H10): <= 1px x 1px
 * - Legacy status guard (H2): no .lp-status-dot-circle or legacy .lp-status-dot without .lp-status-indicator
 */
export async function checkControlsRadiusTextButtonsSrOnly(page: Page): Promise<string[]> {
  return page.evaluate((spec) => {
    const issues: string[] = [];
    const expectedH = window.innerWidth < spec.breakpoints.viewport.sm ? spec.controlHeightMobile : spec.controlHeightDesktop;
    const isVis = (el: Element): boolean => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (el.closest('[hidden], .lp-is-hidden')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const controls = Array.from(
      document.querySelectorAll(
        'button.lp-btn:not(.lp-btn-text), a.lp-btn:not(.lp-btn-text), input.lp-input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), select.lp-select, .lp-segmented-control, .lp-choice-variant-segmented .lp-choice-list'
      )
    ).filter(isVis);
    for (const c of controls) {
      const h = Math.round(c.getBoundingClientRect().height);
      if (Math.abs(h - expectedH) > 1) {
        issues.push(`c3-control-height: ${c.tagName.toLowerCase()}.${c.className} got ${h}px expected ${expectedH}px`);
      }
    }

    const painted = Array.from(document.querySelectorAll('main *, header *')).filter(isVis);
    for (const el of painted) {
      const cs = getComputedStyle(el);
      const rad = parseFloat(cs.borderTopLeftRadius || '0');
      const allowed = rad === 0 || Math.abs(rad - 4) <= 0.5 || Math.abs(rad - 8) <= 0.5 || Math.abs(rad - 12) <= 0.5 || rad >= 100;
      if (!allowed) {
        issues.push(`c3-radius-scale: ${el.tagName.toLowerCase()}.${el.className} radius=${rad}px`);
      }
      if (
        el.matches('button.lp-btn:not(.lp-btn-text), a.lp-btn:not(.lp-btn-text), input.lp-input, select.lp-select, .lp-segmented-control') &&
        Math.abs(rad - 8) > 0.5
      ) {
        issues.push(`c3-radius-r2: ${el.tagName.toLowerCase()}.${el.className} got ${rad}px expected 8px`);
      }
      if (
        el.matches('.lp-dialog-panel, .lp-item.is-selected') &&
        Math.abs(rad - 12) > 0.5
      ) {
        issues.push(`c3-radius-container: ${el.tagName.toLowerCase()}.${el.className} got ${rad}px expected 12px`);
      }
      if (el.matches('.lp-tag') && Math.abs(rad - 4) > 0.5) {
        issues.push(`c3-radius-r1: ${el.tagName.toLowerCase()}.${el.className} got ${rad}px expected 4px`);
      }
    }

    if (document.querySelector('.lp-recovery-link')) {
      issues.push('c3-legacy-recovery-link: .lp-recovery-link present');
    }
    for (const tb of Array.from(document.querySelectorAll('.lp-btn-text')).filter(isVis)) {
      const cs = getComputedStyle(tb);
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
        issues.push(`c3-text-btn-bg: #${tb.id || tb.className} bg=${cs.backgroundColor}`);
      }
      if ((parseFloat(cs.borderTopWidth) || 0) > 0) {
        issues.push(`c3-text-btn-border: #${tb.id || tb.className} border=${cs.borderTopWidth}`);
      }
    }

    for (const sr of Array.from(document.querySelectorAll('.lp-sr-only'))) {
      const r = sr.getBoundingClientRect();
      if (r.width > 1.5 || r.height > 1.5) {
        issues.push(`c3-sr-only-visible: "${(sr.textContent || '').trim().slice(0, 30)}" size=${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }

    if (document.querySelector('.lp-status-dot-circle')) {
      issues.push('c3-legacy-status-dot-circle: .lp-status-dot-circle present');
    }
    for (const d of Array.from(document.querySelectorAll('.lp-status-dot'))) {
      if (!d.closest('.lp-status-indicator')) {
        issues.push('c3-legacy-status-dot-wrapper: .lp-status-dot without .lp-status-indicator');
      }
    }
    return issues;
  }, TOKEN_SPEC);
}

/**
 * G-census v2 C4:
 * - Edit/Settings toggle centre === bar centre (<= 0.5px), bar height 56, sticky top 60
 * - Top bar height 60, icon buttons 36 with 12px inset
 * - Format bar centre === editor column (#ref-editor-main) centre (<= 1px)
 */
export async function checkCenteringAndBars(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const topBar = document.querySelector<HTMLElement>('.lp-admin-header');
    if (topBar && getComputedStyle(topBar).display !== 'none') {
      const tr = topBar.getBoundingClientRect();
      if (Math.abs(tr.height - 60) > 1) {
        issues.push(`c4-topbar-height: got ${Math.round(tr.height)}px expected 60px`);
      }
      const leftIcon = topBar.querySelector<HTMLElement>('.lp-icon-btn');
      if (leftIcon) {
        const ir = leftIcon.getBoundingClientRect();
        const topInset = Math.round(ir.top - tr.top);
        const bottomInset = Math.round(tr.bottom - ir.bottom);
        if (Math.abs(ir.height - 36) > 1 || Math.abs(topInset - 12) > 1 || Math.abs(bottomInset - 12) > 1) {
          issues.push(`c4-topbar-icon-inset: height=${Math.round(ir.height)} top=${topInset} bottom=${bottomInset}`);
        }
      }
    }

    const sticky = document.querySelector<HTMLElement>('.lp-editor-toolbar-sticky');
    const toolbar = document.querySelector<HTMLElement>('#ref-editor-toolbar');
    const seg = document.querySelector<HTMLElement>('#ref-view-switch');
    if (sticky && toolbar && seg && getComputedStyle(toolbar).display !== 'none') {
      const sTop = parseFloat(getComputedStyle(sticky).top || '0');
      if (Math.abs(sTop - 60) > 1) {
        issues.push(`c4-editor-bar-sticky-top: got ${sTop}px expected 60px`);
      }
      const br = toolbar.getBoundingClientRect();
      if (Math.abs(br.height - 56) > 1) {
        issues.push(`c4-editor-bar-height: got ${Math.round(br.height)}px expected 56px`);
      }
      const sr = seg.getBoundingClientRect();
      const barMid = (br.left + br.right) / 2;
      const segMid = (sr.left + sr.right) / 2;
      if (Math.abs(barMid - segMid) > 0.5) {
        issues.push(`c4-toggle-centering: diff=${Math.abs(barMid - segMid).toFixed(2)}px (>0.5px)`);
      }
    }

    const fmtBar = document.querySelector<HTMLElement>('#ref-format-bar');
    const col = document.querySelector<HTMLElement>('#ref-editor-main');
    if (
      fmtBar &&
      col &&
      getComputedStyle(fmtBar).display !== 'none' &&
      getComputedStyle(fmtBar).visibility !== 'hidden' &&
      fmtBar.getBoundingClientRect().width > 0
    ) {
      const fr = fmtBar.getBoundingClientRect();
      const cr = col.getBoundingClientRect();
      const fMid = (fr.left + fr.right) / 2;
      const cMid = (cr.left + cr.right) / 2;
      if (Math.abs(fMid - cMid) > 1.5) {
        issues.push(`c4-format-bar-centering: diff=${Math.abs(fMid - cMid).toFixed(2)}px (>1px)`);
      }
    }
    return issues;
  });
}

export interface ActionBarReport {
  level: string;
  count: number;
  issues: string[];
}

export async function checkActionBarI1(page: Page, stateId = ''): Promise<ActionBarReport[]> {
  return page.evaluate((sid) => {
    const allowedPrimaryItemStates = new Set(['answer-rules', 'inbox', 'inbox-detail']);
    const bars = Array.from(document.querySelectorAll<HTMLElement>('.lp-action-bar, [data-c="ActionBar"]'));
    const results: { level: string; count: number; issues: string[] }[] = [];

    for (const bar of bars) {
      const style = getComputedStyle(bar);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const br = bar.getBoundingClientRect();
      if (br.width === 0 || br.height === 0) continue;

      const level = bar.getAttribute('data-level') || '';
      const issues: string[] = [];
      if (!level || !['page', 'dialog', 'item'].includes(level)) {
        issues.push(`i1-missing-level(${sid}): got="${level}"`);
      }

      const btns = Array.from(bar.querySelectorAll<HTMLElement>('button, a.lp-btn')).filter((b) => {
        const bs = getComputedStyle(b);
        return bs.display !== 'none' && bs.visibility !== 'hidden' && b.getBoundingClientRect().width > 0;
      });
      if (btns.length === 0) continue;

      const roleOf = (b: HTMLElement) => {
        if (b.classList.contains('lp-btn-text')) return 2;
        if (b.classList.contains('lp-btn-primary') || b.classList.contains('lp-btn-danger')) return 0;
        return 1;
      };

      for (let i = 1; i < btns.length; i++) {
        if (roleOf(btns[i]) < roleOf(btns[i - 1])) {
          issues.push(`i1-order(${sid},level=${level}): primary must precede secondary which must precede text`);
        }
      }

      if (level === 'page') {
        if (btns.length > 3) issues.push(`i1-page-max-3(${sid}): count=${btns.length}`);
        const parent = bar.parentElement;
        if (parent) {
          const ps = getComputedStyle(parent);
          const pr = parent.getBoundingClientRect();
          const avail = pr.width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
          if (Math.abs(br.width - avail) > 4) {
            issues.push(`i1-page-width(${sid}): bar=${Math.round(br.width)} avail=${Math.round(avail)}`);
          }
        }
      } else if (level === 'dialog') {
        const container = bar.closest<HTMLElement>('.lp-dialog-panel, .lp-overlay-sheet');
        if (container) {
          const cs = getComputedStyle(container);
          const cr = container.getBoundingClientRect();
          const avail = cr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          for (const b of btns) {
            const bRect = b.getBoundingClientRect();
            if (Math.abs(bRect.width - avail) > 4) {
              issues.push(`i1-dialog-btn-width(${sid}): btn=${Math.round(bRect.width)} avail=${Math.round(avail)}`);
            }
          }
        }
      } else if (level === 'item') {
        const nonText = btns.filter((b) => !b.classList.contains('lp-btn-text'));
        const textBtns = btns.filter((b) => b.classList.contains('lp-btn-text'));
        if (nonText.length > 2 || textBtns.length > 1) {
          issues.push(`i1-item-max-btns(${sid}): nonText=${nonText.length} text=${textBtns.length}`);
        }
        for (const b of nonText) {
          const words = (b.textContent || '').trim().split(/\s+/).filter(Boolean).length;
          if (words > 2) {
            issues.push(`i1-item-max-2-words(${sid}): "${(b.textContent || '').trim()}"`);
          }
          if (b.classList.contains('lp-btn-primary') && sid && !allowedPrimaryItemStates.has(sid)) {
            issues.push(`i1-item-primary-disallowed(${sid}): "${(b.textContent || '').trim()}"`);
          }
        }
      }

      results.push({ level: level || 'missing', count: 1, issues });
    }
    return results;
  }, stateId);
}

export const STATUS_VOCABULARY = [
  'Active',
  'Idle',
  'Pending',
  'Connected',
  'Error',
  'Not set up',
  'Accepted',
  'Ignored',
  'Suggested',
  'Latest',
  'Paused',
  'Draft',
  'Public',
  'Unlisted',
  'Key invalid',
  'Unreachable',
  'Confirmed',
  'Declined',
  'Cancelled',
  'Discarded',
  'Revoked',
  'Current',
] as const;

export async function checkStatusVocabularyI5(page: Page, stateId = ''): Promise<string[]> {
  return page.evaluate(
    ({ sid, vocab }) => {
      const allowed = new Set(vocab);
      const issues: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-c="StatusLabel"]'))) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const label = el.classList.contains('lp-status-label')
          ? el
          : el.querySelector<HTMLElement>('.lp-status-label');
        const txt = (label?.textContent || el.textContent || '').trim();
        if (txt && !allowed.has(txt)) {
          issues.push(`i5-status-vocab(${sid}): "${txt}" not in StatusLabel vocabulary`);
        }
      }
      return issues;
    },
    { sid: stateId, vocab: [...STATUS_VOCABULARY] },
  );
}

export async function checkDockedPanelAndAdjacentLinesI7(page: Page, stateId = ''): Promise<string[]> {
  return page.evaluate((sid) => {
    const issues: string[] = [];
    const drawer = document.querySelector<HTMLElement>('#ref-entries-drawer, .lp-editor-drawer');
    if (drawer && !drawer.hasAttribute('hidden') && getComputedStyle(drawer).display !== 'none') {
      const ds = getComputedStyle(drawer);
      if (parseFloat(ds.borderTopWidth) > 0) issues.push(`i7-panel-border-top(${sid}): ${ds.borderTopWidth}`);
      if (parseFloat(ds.borderLeftWidth) > 0) issues.push(`i7-panel-border-left(${sid}): ${ds.borderLeftWidth}`);
      if (parseFloat(ds.borderBottomWidth) > 0) issues.push(`i7-panel-border-bottom(${sid}): ${ds.borderBottomWidth}`);
      if (Math.abs(parseFloat(ds.borderRightWidth) - 1) > 0.5) {
        issues.push(`i7-panel-border-right(${sid}): ${ds.borderRightWidth}`);
      }
      if (ds.boxShadow !== 'none') issues.push(`i7-panel-shadow(${sid}): ${ds.boxShadow}`);
    }

    const lineYs: number[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('.lp-admin-header, .lp-editor-toolbar-sticky, .lp-editor-drawer'))) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (parseFloat(cs.borderTopWidth) > 0) lineYs.push(Math.round(r.top * 10) / 10);
      if (parseFloat(cs.borderBottomWidth) > 0) lineYs.push(Math.round(r.bottom * 10) / 10);
    }
    lineYs.sort((a, b) => a - b);
    for (let i = 1; i < lineYs.length; i++) {
      const diff = lineYs[i] - lineYs[i - 1];
      if (diff > 0 && diff < 3) {
        issues.push(`i7-adjacent-lines(${sid}): y=${lineYs[i - 1]} and y=${lineYs[i]} (${diff.toFixed(1)}px apart)`);
      }
    }
    return issues;
  }, stateId);
}

export async function checkItemGeometryI8(page: Page, stateId = ''): Promise<{ pairs: number; issues: string[] }> {
  return page.evaluate((sid) => {
    const issues: string[] = [];
    let pairs = 0;
    const items = Array.from(document.querySelectorAll<HTMLElement>('.lp-item'));
    for (const item of items) {
      const list = item.closest<HTMLElement>('.lp-list, .lp-item-list');
      if (!list) continue;
      const isHidden = getComputedStyle(item).display === 'none' || getComputedStyle(list).display === 'none';
      if (isHidden) continue;
      const ir = item.getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      if (ir.width === 0 || lr.width === 0) continue;
      pairs++;
      if (Math.abs(ir.left - lr.left) > 1 || Math.abs(ir.right - lr.right) > 1) {
        issues.push(`i8-item-bleed(${sid}): item=[${Math.round(ir.left)}..${Math.round(ir.right)}] list=[${Math.round(lr.left)}..${Math.round(lr.right)}]`);
      }
      const isPlain = list.getAttribute('data-variant') === 'plain' || list.classList.contains('lp-list-plain');
      const expectedInset = isPlain ? 0 : 8;
      const title = item.querySelector<HTMLElement>('.lp-item-title');
      if (title) {
        const tr = title.getBoundingClientRect();
        if (Math.abs(tr.left - (lr.left + expectedInset)) > 1.5) {
          issues.push(`i8-title-inset(${sid}): titleLeft=${Math.round(tr.left)} expected=${Math.round(lr.left + expectedInset)}`);
        }
      }
    }
    return { pairs, issues };
  }, stateId);
}

export interface ActionBarJ2Report {
  level: string;
  containerType: string;
  widthClass: string;
  precedingGap: number | null;
  issues: string[];
}

export async function checkActionBarJ2(page: Page, stateId = ''): Promise<ActionBarJ2Report[]> {
  return page.evaluate((sid) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const reports: ActionBarJ2Report[] = [];
    const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-c="ActionBar"]'));
    for (const bar of bars) {
      if (!isVisible(bar)) continue;
      if (bar.closest('[data-c="Gallery"], .lp-gallery-root, .lp-gallery-section')) {
        // Gallery samples are inspected separately; check container rules on live pages
      }
      const level = bar.getAttribute('data-level') || 'missing';
      const inDialog = bar.closest<HTMLElement>('[role="dialog"], .lp-overlay-dialog, .lp-overlay-sheet');
      const inItem = bar.closest<HTMLElement>('[data-c="Item"]');
      const inSubsection = bar.closest<HTMLElement>('[data-c="Subsection"]');
      const inSection = bar.closest<HTMLElement>('[data-c="FormSection"]');
      const containerType = inDialog
        ? 'dialog'
        : inItem
          ? 'item'
          : inSubsection
            ? 'subsection'
            : inSection
              ? 'section'
              : 'page';

      const containerEl =
        inDialog || inItem || inSubsection || inSection || bar.closest<HTMLElement>('.lp-page-column, main') || bar.parentElement!;
      const containerW = containerEl ? containerEl.getBoundingClientRect().width : bar.getBoundingClientRect().width;
      const btns = Array.from(bar.querySelectorAll<HTMLElement>('.lp-btn')).filter(isVisible);
      const barR = bar.getBoundingClientRect();
      const allFullWidth = btns.length > 0 && btns.every((b) => Math.abs(b.getBoundingClientRect().width - containerW) <= 4);
      const widthClass = allFullWidth ? 'full' : 'compact';

      const issues: string[] = [];

      // Preceding element gap check (WP-17.13 D1: measure above .lp-action-bar-group when consequence precedes ActionBar)
      const gapTarget = bar.parentElement?.classList.contains('lp-action-bar-group') ? bar.parentElement : bar;
      let prevEl: HTMLElement | null = gapTarget.previousElementSibling as HTMLElement | null;
      while (prevEl && !isVisible(prevEl)) {
        prevEl = prevEl.previousElementSibling as HTMLElement | null;
      }
      if (!prevEl && gapTarget.parentElement?.classList.contains('lp-item-actions')) {
        prevEl = gapTarget.parentElement.previousElementSibling as HTMLElement | null;
      }
      if (!prevEl && gapTarget.parentElement?.classList.contains('lp-stack')) {
        prevEl = gapTarget.parentElement.previousElementSibling as HTMLElement | null;
      }
      let precedingGap: number | null = null;
      if (prevEl && isVisible(prevEl)) {
        precedingGap = Math.round((gapTarget.getBoundingClientRect().top - prevEl.getBoundingClientRect().bottom) * 10) / 10;
      }

      if (level === 'item') {
        if (containerW >= 400) {
          for (const b of btns) {
            if (b.classList.contains('lp-btn-full')) {
              issues.push(`j2-item-full-width(${sid}, ${containerType}): button "${(b.textContent || '').trim()}" is full width inside >=400px container`);
            }
            const bw = b.getBoundingClientRect().width;
            if (!b.classList.contains('lp-btn-text') && bw < 95.5) {
              issues.push(`j2-item-min96(${sid}, ${containerType}): button width ${bw.toFixed(1)} < 96`);
            }
          }
        }
        if (precedingGap !== null && !bar.closest('.lp-gallery-section')) {
          const isEmptySubsection = Boolean(bar.closest('.lp-subsection.lp-gap-related'));
          const isItemBar = containerType === 'item' || Boolean(bar.closest('.lp-item-actions'));
          const isConsequenceAbove = Boolean(prevEl?.matches('[data-purpose="consequence"]')) && Boolean(bar.closest('.lp-action-bar-group'));
          const isHeadingAbove = Boolean(prevEl?.matches('h2, h3, [data-c="SectionHeader"], [data-rel="heading"]'));
          const minGap = isConsequenceAbove ? 7 : (isEmptySubsection || isItemBar || isHeadingAbove ? 14 : 20);
          if (precedingGap < minGap || precedingGap > 28) {
            issues.push(`j2-item-gap24(${sid}, ${containerType}): precedingGap=${precedingGap}px (expected ${isConsequenceAbove ? '8px' : isItemBar || isHeadingAbove ? '16px' : '24px'})`);
          }
        }
      }

      reports.push({ level, containerType, widthClass, precedingGap, issues });
    }
    return reports;
  }, stateId);
}

export async function checkOrphanTextAndMarginsJ3(
  page: Page,
  stateId = '',
  registeredComponents?: string[],
): Promise<{ orphanText: string[]; unownedMargins: string[] }> {
  return page.evaluate(
    ({ sid, allowedComps }) => {
      const orphanText: string[] = [];
      const unownedMargins: string[] = [];
      const registered = new Set(allowedComps);
      const containerOnly = new Set(['Page', 'Shell', 'Section']);
      const sectionContainers = new Set(['FormSection', 'Subsection']);

      const root = document.querySelector<HTMLElement>('.lp-page-column, main');
      if (!root) return { orphanText, unownedMargins };

      const isVisible = (el: HTMLElement): boolean => {
        if (el.closest('.lp-sr-only, [hidden], .lp-is-hidden')) return false;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      const checkedLeaves = new Set<HTMLElement>();
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const leaf = node.parentElement;
        if (!leaf || checkedLeaves.has(leaf)) continue;
        checkedLeaves.add(leaf);
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE'].includes(leaf.tagName)) continue;
        if (!isVisible(leaf)) continue;

        const nearestComp = leaf.closest<HTMLElement>('[data-c]');
        const compName = nearestComp?.getAttribute('data-c') || '';
        const isSectionTitleOrIntro = Boolean(
          leaf.closest('[data-rel="section-title"], [data-rel="section-intro"], [data-rel="subsection-title"], [data-rel="subsection-intro"]'),
        );
        if (!compName || containerOnly.has(compName) || (sectionContainers.has(compName) && !isSectionTitleOrIntro)) {
          orphanText.push(
            `j3-orphan-text(${sid}): "${leaf.textContent.trim().slice(0, 48)}" under data-c="${compName || 'none'}" (<${leaf.tagName.toLowerCase()}${leaf.id ? '#' + leaf.id : ''}>)`,
          );
        }
      }

      for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
        if (!isVisible(el)) continue;
        const cs = getComputedStyle(el);
        const mt = parseFloat(cs.marginTop);
        const mb = parseFloat(cs.marginBottom);
        const ml = parseFloat(cs.marginLeft);
        const mr = parseFloat(cs.marginRight);
        if (mt === 0 && mb === 0 && ml === 0 && mr === 0) continue;
        if (mt === 0 && mb === 0 && Math.abs(ml - mr) <= 1 && ml > 0) continue;
        if (el.classList.contains('lp-page-column') || el.classList.contains('lp-page-column-narrow')) continue;
        const nearestComp = el.closest<HTMLElement>('[data-c]');
        const compName = nearestComp?.getAttribute('data-c') || '';
        const hasRegisteredClass = Array.from(el.classList).some((c) => c.startsWith('lp-'));
        if (!compName || (registered.size > 0 && !registered.has(compName)) || (!el.hasAttribute('data-c') && !hasRegisteredClass)) {
          unownedMargins.push(
            `j3-unowned-margin(${sid}): <${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}> margin=[${mt},${mr},${mb},${ml}] data-c="${compName || 'none'}"`,
          );
        }
      }

      return { orphanText, unownedMargins };
    },
    { sid: stateId, allowedComps: registeredComponents ?? [] },
  );
}

export async function checkRestingIconButtonFillsJ5(page: Page, stateId = ''): Promise<string[]> {
  return page.evaluate((sid) => {
    const issues: string[] = [];
    const header = document.querySelector<HTMLElement>('.lp-admin-header');
    if (!header) return issues;
    const iconBtns = Array.from(header.querySelectorAll<HTMLElement>('#lp-launcher-btn, #theme-toggle, #lp-account-menu-btn')).filter((el) => {
      if (el.getAttribute('aria-expanded') === 'true') return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    });
    const fills = new Map<string, string>();
    for (const btn of iconBtns) {
      fills.set(btn.id || btn.className, getComputedStyle(btn).backgroundColor);
    }
    const uniqueFills = new Set(fills.values());
    if (uniqueFills.size > 1) {
      const detail = Array.from(fills.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      issues.push(`j5-icon-fill-mismatch(${sid}): ${detail}`);
    }
    return issues;
  }, stateId);
}

export interface ActionBarK1Report {
  level: string;
  containerType: string;
  widthClass: 'compact' | 'full';
  issues: string[];
}

export async function checkActionBarK1(page: Page, stateId = ''): Promise<ActionBarK1Report[]> {
  return page.evaluate(({ sid, spec }) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const reports: ActionBarK1Report[] = [];
    const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-c="ActionBar"]'));
    for (const bar of bars) {
      if (!isVisible(bar)) continue;
      const level = bar.getAttribute('data-level') || 'missing';
      const inDialog = bar.closest<HTMLElement>('[role="dialog"], .lp-overlay-dialog, .lp-overlay-sheet');
      const inItem = bar.closest<HTMLElement>('[data-c="Item"]');
      const inSubsection = bar.closest<HTMLElement>('[data-c="Subsection"]');
      const inSection = bar.closest<HTMLElement>('[data-c="FormSection"]');
      const containerType = inDialog
        ? 'dialog'
        : inItem
          ? 'item'
          : inSubsection
            ? 'subsection'
            : inSection
              ? 'section'
              : 'page';

      const containerEl =
        inDialog || inItem || inSubsection || inSection || bar.closest<HTMLElement>('.lp-page-column, main') || bar.parentElement!;
      const containerW = containerEl ? containerEl.getBoundingClientRect().width : bar.getBoundingClientRect().width;
      const btns = Array.from(bar.querySelectorAll<HTMLElement>('.lp-btn')).filter(isVisible);
      const nonTextBtns = btns.filter((b) => !b.classList.contains('lp-btn-text'));
      const allFullWidth =
        nonTextBtns.length > 0 && nonTextBtns.every((b) => Math.abs(b.getBoundingClientRect().width - containerW) <= 4);
      const widthClass: 'compact' | 'full' = allFullWidth ? 'full' : 'compact';

      const issues: string[] = [];
      if (level === 'item') {
        if (widthClass === 'full') {
          issues.push(`k1-item-full-width(${sid}, ${containerType}): item ActionBar is full-width (containerW=${Math.round(containerW)})`);
        }
        const csBar = getComputedStyle(bar);
        if (csBar.flexDirection !== 'row' || csBar.flexWrap !== 'wrap') {
          issues.push(`k1-item-not-flex-wrap-row(${sid}, ${containerType}): flexDirection=${csBar.flexDirection}, flexWrap=${csBar.flexWrap}`);
        }
        for (const b of nonTextBtns) {
          if (b.classList.contains('lp-btn-full')) {
            issues.push(`k1-item-btn-full-class(${sid}, ${containerType}): button "${(b.textContent || '').trim()}" has .lp-btn-full`);
          }
          const br = b.getBoundingClientRect();
          if (br.width < spec.btnItemMinWidth - 0.5) {
            issues.push(`k1-item-min96(${sid}, ${containerType}): button width ${br.width.toFixed(1)} < ${spec.btnItemMinWidth}`);
          }
          if (window.innerWidth < spec.breakpoints.viewport.sm && br.height < spec.controlHeightMobile - 0.5) {
            issues.push(`k1-item-touch44(${sid}, ${containerType}): button height ${br.height.toFixed(1)} < ${spec.controlHeightMobile} below ${spec.breakpoints.viewport.sm}px`);
          }
        }
      }

      reports.push({ level, containerType, widthClass, issues });
    }
    return reports;
  }, { sid: stateId, spec: TOKEN_SPEC });
}

export interface ListPaintedGapReport {
  sectionId: string;
  headingToFirst: number | null;
  lastToNext: number | null;
  itemToActionBarGaps: number[];
  issues: string[];
}

export async function checkListPaddingAbsorptionK2(page: Page, stateId = ''): Promise<ListPaintedGapReport[]> {
  return page.evaluate(({ sid, spec }) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // Measure painted ink bounds (text Ranges + buttons/controls/inputs) inside an element
    const getPaintedBounds = (el: HTMLElement): { top: number; bottom: number } | null => {
      let top = Infinity;
      let bottom = -Infinity;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const parent = node.parentElement;
        if (!parent || !isVisible(parent) || parent.closest('.lp-sr-only')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.top < top) top = rect.top;
          if (rect.bottom > bottom) bottom = rect.bottom;
        }
      }
      for (const ctrl of Array.from(el.querySelectorAll<HTMLElement>('button, a.lp-btn, input, select, textarea, [data-c="StatusLabel"]'))) {
        if (!isVisible(ctrl)) continue;
        const r = ctrl.getBoundingClientRect();
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
      }
      return top < Infinity ? { top, bottom } : null;
    };

    const reports: ListPaintedGapReport[] = [];
    const lists = Array.from(document.querySelectorAll<HTMLElement>('.lp-list, .lp-item-list'));
    for (const list of lists) {
      if (!isVisible(list)) continue;
      if (list.closest('.lp-gallery-section')) continue;
      const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-c="Item"]')).filter(isVisible);
      if (items.length === 0) continue;

      const section = list.closest<HTMLElement>('[data-c="FormSection"], [data-c="Subsection"]');
      const sectionId = section?.id || list.id || 'unnamed-list';
      const issues: string[] = [];

      // Heading or intro before list (may be direct previous sibling or parent's previous sibling inside FormSection)
      let prev: HTMLElement | null = list.previousElementSibling as HTMLElement | null;
      while (prev && !isVisible(prev)) prev = prev.previousElementSibling as HTMLElement | null;
      if (!prev && list.parentElement && list.parentElement !== section) {
        let pPrev = list.parentElement.previousElementSibling as HTMLElement | null;
        while (pPrev && !isVisible(pPrev)) pPrev = pPrev.previousElementSibling as HTMLElement | null;
        prev = pPrev;
      }
      let headingToFirst: number | null = null;
      if (prev) {
        const prevBounds = getPaintedBounds(prev);
        const firstBounds = getPaintedBounds(items[0]);
        if (prevBounds && firstBounds) {
          headingToFirst = Math.round((firstBounds.top - prevBounds.bottom) * 10) / 10;
          const expectedH2F = spec.relations['heading-to-first'];
          if (headingToFirst < expectedH2F - 2 || headingToFirst > expectedH2F + 6) {
            issues.push(`k2-heading-to-first(${sid}, ${sectionId}): paintedGap=${headingToFirst}px (expected ~${expectedH2F}px)`);
          }
        }
      }

      // Last item painted content to next section
      let lastToNext: number | null = null;
      if (section) {
        let nextSec: HTMLElement | null = section.nextElementSibling as HTMLElement | null;
        while (nextSec && !isVisible(nextSec)) nextSec = nextSec.nextElementSibling as HTMLElement | null;
        // Only check if list is the last visible child of section
        let afterList: HTMLElement | null = list.nextElementSibling as HTMLElement | null;
        while (afterList && !isVisible(afterList)) afterList = afterList.nextElementSibling as HTMLElement | null;
        if (!afterList && nextSec) {
          const lastBounds = getPaintedBounds(items[items.length - 1]);
          const nextBounds = getPaintedBounds(nextSec);
          if (lastBounds && nextBounds) {
            lastToNext = Math.round((nextBounds.top - lastBounds.bottom) * 10) / 10;
            const expectedL2N = spec.relations['section-to-section'];
            if (Math.abs(lastToNext - expectedL2N) > 3) {
              issues.push(`k2-last-to-next(${sid}, ${sectionId}): paintedGap=${lastToNext}px (expected ${expectedL2N}px)`);
            }
          }
        }
      }

      // Item content to ActionBar
      const itemToActionBarGaps: number[] = [];
      for (const item of items) {
        const actions = item.querySelector<HTMLElement>('[data-rel="actions"], [data-c="ActionBar"]');
        if (!actions || !isVisible(actions)) continue;
        const content = item.querySelector<HTMLElement>('.lp-item-content');
        if (!content) continue;
        const contentBounds = getPaintedBounds(content);
        const actionBounds = getPaintedBounds(actions);
        if (contentBounds && actionBounds) {
          const gap = Math.round((actionBounds.top - contentBounds.bottom) * 10) / 10;
          itemToActionBarGaps.push(gap);
          const expectedI2A = spec.relations['item-body-to-actionbar'];
          if (Math.abs(gap - expectedI2A) > 3) {
            issues.push(`k2-item-to-actionbar(${sid}, ${sectionId}): paintedGap=${gap}px (expected ${expectedI2A}px)`);
          }
        }
      }

      reports.push({ sectionId, headingToFirst, lastToNext, itemToActionBarGaps, issues });
    }

    // Also measure non-list FormSections with id="provider-role-fallback" for Providers parity check
    const fallbackSec = document.querySelector<HTMLElement>('#provider-role-fallback');
    if (fallbackSec && isVisible(fallbackSec)) {
      const heading = fallbackSec.querySelector<HTMLElement>('[data-rel="section-title"], h2, h3');
      const field = fallbackSec.querySelector<HTMLElement>('[data-c="Field"]');
      let headingToFirst: number | null = null;
      let lastToNext: number | null = null;
      if (heading && field) {
        const hBounds = getPaintedBounds(heading);
        const fBounds = getPaintedBounds(field);
        if (hBounds && fBounds) {
          headingToFirst = Math.round((fBounds.top - hBounds.bottom) * 10) / 10;
        }
        let nextSec: HTMLElement | null = fallbackSec.nextElementSibling as HTMLElement | null;
        while (nextSec && !isVisible(nextSec)) nextSec = nextSec.nextElementSibling as HTMLElement | null;
        if (fBounds && nextSec) {
          const nBounds = getPaintedBounds(nextSec);
          if (nBounds) {
            lastToNext = Math.round((nBounds.top - fBounds.bottom) * 10) / 10;
          }
        }
      }
      reports.push({ sectionId: 'provider-role-fallback', headingToFirst, lastToNext, itemToActionBarGaps: [], issues: [] });
    }

    return reports;
  }, { sid: stateId, spec: TOKEN_SPEC });
}

export interface ItemButtonGrammarL1Report {
  barCount: number;
  issues: string[];
}

export async function checkItemButtonGrammarL1(page: Page, stateId = ''): Promise<ItemButtonGrammarL1Report> {
  return page.evaluate((sid) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const issues: string[] = [];
    let barCount = 0;
    const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-c="ActionBar"][data-level="item"], .lp-action-bar-item'));
    for (const bar of bars) {
      if (!isVisible(bar)) continue;
      barCount++;
      const btns = Array.from(bar.querySelectorAll<HTMLElement>('button, a.lp-btn')).filter(isVisible);
      if (btns.length === 0) continue;

      if (btns.length > 2) {
        issues.push(`l1-item-max-2(${sid}): count=${btns.length}`);
      }
      for (const b of btns) {
        const label = (b.textContent || '').trim();
        const words = label.split(/\s+/).filter(Boolean).length;
        if (words > 2) {
          issues.push(`l1-item-max-2-words(${sid}): "${label}" (${words} words)`);
        }
        if (b.classList.contains('lp-btn-primary') || b.classList.contains('lp-btn-danger')) {
          issues.push(`l1-item-primary-disallowed(${sid}): "${label}" has primary/danger class`);
        }
      }
      if (btns.length === 1) {
        const b0 = btns[0];
        if (!b0.classList.contains('lp-btn-secondary')) {
          issues.push(`l1-item-single-must-be-secondary(${sid}): "${(b0.textContent || '').trim()}" classes="${b0.className}"`);
        }
      } else if (btns.length === 2) {
        const [b0, b1] = btns;
        if (!b0.classList.contains('lp-btn-secondary')) {
          issues.push(`l1-item-first-must-be-secondary(${sid}): "${(b0.textContent || '').trim()}" classes="${b0.className}"`);
        }
        if (!b1.classList.contains('lp-btn-text')) {
          issues.push(`l1-item-second-must-be-text(${sid}): "${(b1.textContent || '').trim()}" classes="${b1.className}"`);
        }
      }
    }

    // Destructive text buttons must use danger text colour token
    const dangerProbe = document.createElement('span');
    dangerProbe.style.color = 'var(--lp-color-role-danger-fg, var(--role-danger-fg))';
    dangerProbe.style.display = 'none';
    document.body.appendChild(dangerProbe);
    const expectedDangerColor = getComputedStyle(dangerProbe).color;
    dangerProbe.remove();

    const destructiveTextBtns = Array.from(
      document.querySelectorAll<HTMLElement>('.lp-btn-text.lp-btn-text-danger, .lp-btn-text[data-destructive="true"]')
    ).filter(isVisible);
    for (const btn of destructiveTextBtns) {
      const actualColor = getComputedStyle(btn).color;
      if (expectedDangerColor && actualColor !== expectedDangerColor) {
        issues.push(`l1-destructive-text-color(${sid}): got ${actualColor}, expected ${expectedDangerColor}`);
      }
    }

    return { barCount, issues };
  }, stateId);
}

export interface ListTextEdgeL2Report {
  listId: string;
  variant: string;
  itemTextEdges: number[];
  issues: string[];
}

export interface PageTextEdgesL2Summary {
  stateId: string;
  pageColumnEdges: number[];
  plainPageSharedEdges: number[];
  lists: ListTextEdgeL2Report[];
  issues: string[];
}

export async function checkListVariantsAndTextEdgesL2(page: Page, stateId = ''): Promise<PageTextEdgesL2Summary> {
  return page.evaluate((sid) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const clusterEdges = (xs: number[], tol = 1.5): number[] => {
      const sorted = [...xs].sort((a, b) => a - b);
      const clusters: number[] = [];
      for (const x of sorted) {
        if (clusters.length === 0 || Math.abs(x - clusters[clusters.length - 1]) > tol) {
          clusters.push(Math.round(x));
        }
      }
      return clusters;
    };

    const issues: string[] = [];
    const listsReport: ListTextEdgeL2Report[] = [];
    const lists = Array.from(document.querySelectorAll<HTMLElement>('.lp-list, .lp-item-list')).filter(isVisible);

    for (const list of lists) {
      const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-c="Item"], :scope > .lp-item')).filter(isVisible);
      if (items.length === 0) continue;

      const listId = list.id || list.closest('[id]')?.id || 'unnamed-list';
      const dataVar = list.getAttribute('data-variant') || '';
      const hasPlainCls = list.classList.contains('lp-list-plain');
      const hasInteractiveCls = list.classList.contains('lp-list-interactive');
      const variant = dataVar || (hasPlainCls ? 'plain' : hasInteractiveCls ? 'interactive' : 'missing');

      const listIssues: string[] = [];
      if (variant !== 'plain' && variant !== 'interactive') {
        listIssues.push(`l2-missing-list-variant(${sid}, ${listId}): list must declare plain or interactive variant`);
      }

      const lr = list.getBoundingClientRect();
      const rawItemEdges: number[] = [];

      for (const item of items) {
        const ir = item.getBoundingClientRect();
        if (Math.abs(ir.left - lr.left) > 1.5 || Math.abs(ir.right - lr.right) > 1.5) {
          listIssues.push(`l2-item-rect(${sid}, ${listId}): item=[${Math.round(ir.left)}..${Math.round(ir.right)}] list=[${Math.round(lr.left)}..${Math.round(lr.right)}]`);
        }

        const titleEl = item.querySelector<HTMLElement>('.lp-item-title');
        if (titleEl && isVisible(titleEl)) {
          const tr = titleEl.getBoundingClientRect();
          rawItemEdges.push(tr.left);

          if (variant === 'plain') {
            if (Math.abs(tr.left - lr.left) > 1.5) {
              listIssues.push(`l2-plain-not-flush(${sid}, ${listId}): titleLeft=${Math.round(tr.left)} expected=${Math.round(lr.left)}`);
            }
          } else if (variant === 'interactive') {
            if (Math.abs(tr.left - (lr.left + 8)) > 1.5) {
              listIssues.push(`l2-interactive-title-inset(${sid}, ${listId}): titleLeft=${Math.round(tr.left)} expected=${Math.round(lr.left + 8)}`);
            }
          }
        }

        if (variant === 'plain') {
          const chev = item.querySelector<HTMLElement>('.lp-item-chevron');
          if (chev && isVisible(chev)) {
            listIssues.push(`l2-plain-has-chevron(${sid}, ${listId}): plain list item must not render a chevron`);
          }
          const beforeBg = getComputedStyle(item, '::before').backgroundColor;
          const beforeDisp = getComputedStyle(item, '::before').display;
          if (beforeDisp !== 'none' && beforeBg !== 'rgba(0, 0, 0, 0)' && beforeBg !== 'transparent') {
            listIssues.push(`l2-plain-has-tint(${sid}, ${listId}): plain list item must not render hover/selected tint`);
          }
          const firstBtn = item.querySelector<HTMLElement>('[data-c="ActionBar"] .lp-btn');
          if (firstBtn && isVisible(firstBtn)) {
            const br = firstBtn.getBoundingClientRect();
            if (Math.abs(br.left - lr.left) > 1.5) {
              listIssues.push(`l2-plain-button-edge(${sid}, ${listId}): btnLeft=${Math.round(br.left)} expected=${Math.round(lr.left)}`);
            }
          }
        }
      }

      const itemTextEdges = clusterEdges(rawItemEdges);
      if (itemTextEdges.length > 1) {
        listIssues.push(`l2-list-multiple-text-edges(${sid}, ${listId}): edges=${JSON.stringify(itemTextEdges)}`);
      }

      issues.push(...listIssues);
      listsReport.push({ listId, variant, itemTextEdges, issues: listIssues });
    }

    // Measure page-level text left edges inside primary column
    const col = document.querySelector<HTMLElement>('#ref-settings-view:not([hidden]) .lp-editor-writing-col, .lp-page-column');
    const rawPageEdges: number[] = [];
    const rawPlainSharedEdges: number[] = [];
    if (col && isVisible(col)) {
      const headingAndLabelEls = Array.from(
        col.querySelectorAll<HTMLElement>(
          '.lp-page-header-title, .lp-form-section-title, .lp-section-header-title, .lp-subsection-title, .lp-field-label'
        )
      ).filter((el) => isVisible(el) && !el.closest('.lp-dialog-panel, .lp-overlay-surface, .lp-gallery-overlay-sample, .lp-gallery-panel-sample, .lp-entries-toolbar'));
      for (const el of headingAndLabelEls) {
        const x = el.getBoundingClientRect().left;
        rawPageEdges.push(x);
        rawPlainSharedEdges.push(x);
      }
      for (const list of lists) {
        if (!col.contains(list) || list.closest('.lp-dialog-panel, .lp-overlay-surface, .lp-gallery-overlay-sample, .lp-gallery-panel-sample')) continue;
        const isPlain = list.getAttribute('data-variant') === 'plain' || list.classList.contains('lp-list-plain');
        const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-c="Item"], :scope > .lp-item')).filter(isVisible);
        for (const it of items) {
          const t = it.querySelector<HTMLElement>('.lp-item-title');
          if (t && isVisible(t)) {
            const tx = t.getBoundingClientRect().left;
            rawPageEdges.push(tx);
            if (isPlain) rawPlainSharedEdges.push(tx);
          }
          if (isPlain) {
            const b = it.querySelector<HTMLElement>('[data-c="ActionBar"] .lp-btn');
            if (b && isVisible(b)) {
              rawPlainSharedEdges.push(b.getBoundingClientRect().left);
            }
          }
        }
      }
      const inSecBars = Array.from(col.querySelectorAll<HTMLElement>('[data-c="ActionBar"][data-level="item"]')).filter(
        (b) => isVisible(b) && !b.closest('.lp-dialog-panel, .lp-overlay-surface, .lp-gallery-overlay-sample, .lp-gallery-panel-sample, .lp-list-interactive')
      );
      for (const bar of inSecBars) {
        const b = bar.querySelector<HTMLElement>('.lp-btn');
        if (b && isVisible(b)) {
          rawPlainSharedEdges.push(b.getBoundingClientRect().left);
        }
      }
    }

    const pageColumnEdges = clusterEdges(rawPageEdges);
    const plainPageSharedEdges = clusterEdges(rawPlainSharedEdges);
    if (plainPageSharedEdges.length > 1 && sid !== 'gallery') {
      issues.push(`l2-plain-page-multiple-edges(${sid}): edges=${JSON.stringify(plainPageSharedEdges)}`);
    }

    return {
      stateId: sid,
      pageColumnEdges,
      plainPageSharedEdges,
      lists: listsReport,
      issues,
    };
  }, stateId);
}

export interface ListSpacingL3Report {
  listId: string;
  variant: string;
  gapToInk: number | null;
  gapToTint: number | null;
  issues: string[];
}

export async function checkListSpacingAndHeadersL3(page: Page, stateId = ''): Promise<ListSpacingL3Report[]> {
  return page.evaluate((sid) => {
    const isVisible = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // Measure painted ink bounds including text nodes AND buttons/controls/icons (e.g. Today's 36px dismiss icon button)
    const getInkAndControlBounds = (el: HTMLElement): { top: number; bottom: number } | null => {
      let top = Infinity;
      let bottom = -Infinity;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const parent = node.parentElement;
        if (!parent || !isVisible(parent) || parent.closest('.lp-sr-only')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.top < top) top = rect.top;
          if (rect.bottom > bottom) bottom = rect.bottom;
        }
      }
      for (const ctrl of Array.from(
        el.querySelectorAll<HTMLElement>('button, a.lp-btn, .lp-icon-btn, input, select, textarea, [data-c="StatusLabel"], [role="tab"], .lp-tab')
      )) {
        if (!isVisible(ctrl)) continue;
        const r = ctrl.getBoundingClientRect();
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
      }
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName)) {
        const r = el.getBoundingClientRect();
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
      }
      return top < Infinity ? { top, bottom } : null;
    };

    const getFirstItemTintTop = (item: HTMLElement): number => {
      const ir = item.getBoundingClientRect();
      const beforeCs = getComputedStyle(item, '::before');
      if (beforeCs.display === 'none') return ir.top;
      const beforeTopOffset = parseFloat(beforeCs.top);
      return Number.isFinite(beforeTopOffset) ? ir.top + beforeTopOffset : ir.top;
    };

    const reports: ListSpacingL3Report[] = [];
    const lists = Array.from(document.querySelectorAll<HTMLElement>('.lp-list, .lp-item-list')).filter(isVisible);

    for (const list of lists) {
      if (list.closest('.lp-gallery-section')) continue;
      const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-c="Item"], :scope > .lp-item')).filter(isVisible);
      if (items.length === 0) continue;

      const listId = list.id || list.closest('[id]')?.id || 'unnamed-list';
      const dataVar = list.getAttribute('data-variant') || '';
      const isPlain = dataVar === 'plain' || list.classList.contains('lp-list-plain');
      const isInteractive =
        dataVar === 'interactive' ||
        list.classList.contains('lp-list-interactive') ||
        Boolean(items[0].querySelector('.lp-item-chevron') || items[0].tagName === 'A' || items[0].classList.contains('is-selected'));
      const variant = isPlain ? 'plain' : isInteractive ? 'interactive' : 'plain';

      // Find preceding visible element (heading, section header, search input, filter toolbar, or tabs)
      let prev: HTMLElement | null = list.previousElementSibling as HTMLElement | null;
      while (prev && !isVisible(prev)) prev = prev.previousElementSibling as HTMLElement | null;
      let ancestor: HTMLElement | null = list.parentElement;
      while (!prev && ancestor && ancestor.tagName !== 'MAIN' && ancestor.tagName !== 'ASIDE') {
        let pPrev = ancestor.previousElementSibling as HTMLElement | null;
        while (pPrev && !isVisible(pPrev)) pPrev = pPrev.previousElementSibling as HTMLElement | null;
        if (pPrev) {
          prev = pPrev;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      // If prev is a header stack container (e.g. .lp-editor-drawer-header-stack), measure from its last visible child or its full bounds
      const issues: string[] = [];
      let gapToInk: number | null = null;
      let gapToTint: number | null = null;

      if (prev) {
        const prevBounds = getInkAndControlBounds(prev);
        const firstInk = getInkAndControlBounds(items[0]);
        const firstTintTop = getFirstItemTintTop(items[0]);
        const prevBoxBottom = prev.getBoundingClientRect().bottom;
        const prevLowestEdge = prevBounds ? Math.max(prevBoxBottom, prevBounds.bottom) : prevBoxBottom;

        if (prevBounds && firstInk) {
          gapToInk = Math.round((firstInk.top - prevBounds.bottom) * 10) / 10;
        }
        gapToTint = Math.round((firstTintTop - prevLowestEdge) * 10) / 10;

        // Check header action button overlap explicitly
        const headerBtn = prev.querySelector<HTMLElement>('.lp-section-header-action button, .lp-section-header-action .lp-icon-btn');
        if (headerBtn && isVisible(headerBtn)) {
          const btnRect = headerBtn.getBoundingClientRect();
          if (firstTintTop < btnRect.bottom - 0.5) {
            issues.push(`l3-header-button-overlap(${sid}, ${listId}): tintTop=${Math.round(firstTintTop)} < headerBtnBottom=${Math.round(btnRect.bottom)}`);
          }
        }

        const isAfterPageHeader = prev.matches('[data-c="PageHeader"], .lp-page-header');
        const expectedGap = isAfterPageHeader ? 24 : 16;

        if (variant === 'plain') {
          if (gapToInk !== null && (gapToInk < expectedGap - 2 || gapToInk > expectedGap + 6)) {
            issues.push(`l3-plain-heading-to-ink(${sid}, ${listId}): gapToInk=${gapToInk}px (expected ${expectedGap}px)`);
          }
        } else if (variant === 'interactive') {
          if (gapToTint !== null && gapToTint < 7.5) {
            issues.push(`l3-interactive-tint-clearance(${sid}, ${listId}): gapToTint=${gapToTint}px (< 8px clearance)`);
          }
          if (gapToTint !== null && Math.abs(gapToTint - expectedGap) > 2.5) {
            issues.push(`l3-interactive-gap-to-tint(${sid}, ${listId}): gapToTint=${gapToTint}px (expected ${expectedGap}px)`);
          }
        }
      }

      reports.push({ listId, variant, gapToInk, gapToTint, issues });
    }

    return reports;
  }, stateId);
}
