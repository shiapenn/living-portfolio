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
      await page.click('#ref-tiptap-editor .ProseMirror');
      await page.keyboard.type('/');
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
  return page.evaluate(({ includeDG }) => {
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

    const fields = Array.from(document.querySelectorAll('main [data-rel="field"], main .lp-field'));
    for (const f of fields) {
      const label = f.querySelector('[data-rel="label"], label, .lp-field-label');
      const control = f.querySelector('[data-rel="control"], input, select, textarea, .lp-select-wrap');
      const help = f.querySelector('[data-rel="help"], .lp-field-help');
      if (label && control) checkPair('label-to-control', label, control, 8);
      if (control && help) checkPair('control-to-help', control, help, 8);
    }
    for (let i = 0; i < fields.length - 1; i++) {
      if (includeDG && fields[i].parentElement === fields[i + 1].parentElement) {
        checkPair('field-to-field', fields[i], fields[i + 1], 16);
      }
    }

    if (includeDG) {
      const sections = Array.from(document.querySelectorAll('main [data-rel="section"], main .lp-form-section'));
      for (const sec of sections) {
        const sTitle = sec.querySelector('[data-rel="section-title"], .lp-form-section-title, .lp-section-title');
        const sIntro = sec.querySelector('[data-rel="section-intro"], .lp-form-section-desc');
        if (sTitle && sIntro) checkPair('section-heading-to-intro', sTitle, sIntro, 8);
        const headerLead = sIntro ?? sTitle;
        const firstChild = sec.querySelector('.lp-level, [data-rel="field"], [data-rel="item"], [data-rel="subsection"], .lp-field, .lp-item, .lp-list, .lp-choice-group');
        if (headerLead && firstChild) checkPair('heading-or-intro-to-first', headerLead, firstChild, 16);
      }
      for (let i = 0; i < sections.length - 1; i++) {
        if (sections[i].parentElement === sections[i + 1].parentElement) {
          checkPair('section-to-section', sections[i], sections[i + 1], 40);
        }
      }
      if (sections.length > 0) {
        const lastSec = sections[sections.length - 1];
        const pageActionBar = lastSec.nextElementSibling?.matches('[data-rel="page-actions"], .lp-action-bar')
          ? lastSec.nextElementSibling
          : null;
        if (pageActionBar) checkPair('last-section-to-action-bar', lastSec, pageActionBar, 40);
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
        if (iBody && iActions) checkPair('item-body-to-action-bar', iBody, iActions, 24);
      }

      const actionBars = Array.from(document.querySelectorAll('[data-rel="actions"], .lp-action-bar'));
      for (const bar of actionBars) {
        const btns = Array.from(bar.querySelectorAll('button, a.lp-btn')).filter((b) => isPainted(b));
        for (let i = 0; i < btns.length - 1; i++) {
          const r1 = btns[i].getBoundingClientRect();
          const r2 = btns[i + 1].getBoundingClientRect();
          if (r2.top >= r1.bottom - 1) checkPair('button-to-button', btns[i], btns[i + 1], 8);
        }
        let prev: Element | null = bar.previousElementSibling;
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
          checkPair('last-control-to-action-bar', prev, bar, 24);
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
  }, { includeDG: Boolean(opts.includeDG) });
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


export async function checkTypeRolesAndControlLabel(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const tags = Array.from(document.querySelectorAll('.lp-tag'));
    for (const tag of tags) {
      const cs = getComputedStyle(tag);
      const fs = Math.round(parseFloat(cs.fontSize) || 0);
      if (fs !== 12) issues.push(`tag-font-size: expected 12px caption, got ${fs}px`);
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
  return page.evaluate(() => {
    const issues: string[] = [];
    const expectedH = window.innerWidth < 640 ? 44 : 40;
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
      const allowed = rad === 0 || Math.abs(rad - 4) <= 0.5 || Math.abs(rad - 8) <= 0.5 || rad >= 100;
      if (!allowed) {
        issues.push(`c3-radius-scale: ${el.tagName.toLowerCase()}.${el.className} radius=${rad}px`);
      }
      if (
        el.matches('button.lp-btn:not(.lp-btn-text), a.lp-btn:not(.lp-btn-text), input.lp-input, select.lp-select, .lp-segmented-control, .lp-dialog-panel, .lp-item.is-selected') &&
        Math.abs(rad - 8) > 0.5
      ) {
        issues.push(`c3-radius-r2: ${el.tagName.toLowerCase()}.${el.className} got ${rad}px expected 8px`);
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
  });
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
