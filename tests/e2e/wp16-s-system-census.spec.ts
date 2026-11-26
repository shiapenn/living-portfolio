import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

interface DSysBudgetFile {
  version: number;
  note: string;
  budgets: {
    textAlignViolations: number;
    emptyInFlowViolations: number;
    upperGapViolations: number;
    lineBudgetViolations: number;
    actionBarFullWidthViolations: number;
    itemHoverAndPaddingViolations: number;
    topBarSignatureViolations: number;
    topBarLabelViolations: number;
    arrowsInStringsViolations: number;
    iconButtonFilledViolations: number;
    editorHeaderFit320Violations: number;
    formattingBarGeometryViolations: number;
  };
}

interface DSysMetrics {
  measured: {
    textAlign: number;
    emptyInFlow: number;
    upperGapBound: number;
    lineBudget: number;
    actionBarFullWidth: number;
    itemHoverAndPadding: number;
    topBarSignature: number;
    topBarLabel: number;
    arrowsInStrings: number;
    iconButtonFilled: number;
    editorHeaderFit320: number;
    formattingBarGeometry: number;
  };
  violations: {
    textAlign: number;
    emptyInFlow: number;
    upperGapBound: number;
    lineBudget: number;
    actionBarFullWidth: number;
    itemHoverAndPadding: number;
    topBarSignature: number;
    topBarLabel: number;
    arrowsInStrings: number;
    iconButtonFilled: number;
    editorHeaderFit320: number;
    formattingBarGeometry: number;
  };
  topBarSig: { roles: string[]; height: number } | null;
  linesByOwner: Record<string, number>;
  details: Record<string, string[]>;
}

const BUDGET_PATH = resolve(process.cwd(), 'docs/audits/dsys-census-budget.json');

async function scanDSysOnPage(
  page: Page,
  vpWidth: number,
  vpHeight: number,
  opts: { isEditor: boolean; isCanary?: boolean; isAuth?: boolean }
): Promise<DSysMetrics> {
  return page.evaluate(
    ({ width, height, isEditor, isCanary, isAuth }) => {
      const measured = {
        textAlign: 0,
        emptyInFlow: 0,
        upperGapBound: 0,
        lineBudget: 0,
        actionBarFullWidth: 0,
        itemHoverAndPadding: 0,
        topBarSignature: 0,
        topBarLabel: 0,
        arrowsInStrings: 0,
        iconButtonFilled: 0,
        editorHeaderFit320: 0,
        formattingBarGeometry: 0,
      };
      const violations = {
        textAlign: 0,
        emptyInFlow: 0,
        upperGapBound: 0,
        lineBudget: 0,
        actionBarFullWidth: 0,
        itemHoverAndPadding: 0,
        topBarSignature: 0,
        topBarLabel: 0,
        arrowsInStrings: 0,
        iconButtonFilled: 0,
        editorHeaderFit320: 0,
        formattingBarGeometry: 0,
      };
      const details: Record<string, string[]> = {
        textAlign: [],
        emptyInFlow: [],
        upperGapBound: [],
        lineBudget: [],
        actionBarFullWidth: [],
        itemHoverAndPadding: [],
        topBarSignature: [],
        topBarLabel: [],
        arrowsInStrings: [],
        iconButtonFilled: [],
        editorHeaderFit320: [],
        formattingBarGeometry: [],
      };
      const linesByOwner: Record<string, number> = {};

      const isVisible = (el: Element): boolean => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 || r.height > 0;
      };

      // 1. textAlign: left-aligned everywhere except buttons and equal-width tab labels
      const textEls = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, p, label, .lp-page-description, .lp-item-title, .lp-item-subtitle, .lp-item-body, .lp-empty-state, .lp-form-section-title, .lp-form-section-desc, .lp-section-header-title')
      );
      for (const el of textEls) {
        if (!isVisible(el)) continue;
        if (el.closest('button, .lp-btn, [role="tab"]')) continue;
        measured.textAlign++;
        const align = getComputedStyle(el).textAlign;
        if (align !== 'start' && align !== 'left') {
          violations.textAlign++;
          details.textAlign.push(`${el.tagName.toLowerCase()}.${el.className} text-align=${align}`);
        }
      }

      // 2. emptyInFlow: no empty in-flow element has height > 0 or non-zero margin
      const flowEls = Array.from(
        document.querySelectorAll('main div, main p, main section, main span, [role="status"], [role="alert"], .lp-status-line-slot, .lp-page-notice-slot')
      );
      for (const el of flowEls) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute') continue;
        if (el.classList.contains('lp-status-dot')) continue;
        const hasText = (el.textContent || '').trim().length > 0;
        const hasMediaOrInput = el.querySelector('svg, img, input, textarea, select, hr, canvas, button, a') !== null;
        if (!hasText && !hasMediaOrInput && el.children.length === 0) {
          measured.emptyInFlow++;
          const r = el.getBoundingClientRect();
          const mt = parseFloat(cs.marginTop) || 0;
          const mb = parseFloat(cs.marginBottom) || 0;
          if (r.height > 0.5 || mt > 0.5 || mb > 0.5) {
            violations.emptyInFlow++;
            details.emptyInFlow.push(`${el.tagName.toLowerCase()}#${el.id}.${el.className} h=${r.height.toFixed(1)} mt=${mt} mb=${mb}`);
          }
        }
      }

      // 3. upperGapBound: gap between adjacent in-flow blocks never exceeds 40px
      const gapContainers = Array.from(document.querySelectorAll('main, .lp-page-column, .lp-page-sections, .lp-form-section, .lp-stack, [data-canary="upperGapBound"]'));
      for (const container of gapContainers) {
        if (!isVisible(container)) continue;
        const children = Array.from(container.children).filter((c) => {
          const cs = getComputedStyle(c);
          if (cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute') return false;
          const r = c.getBoundingClientRect();
          return r.height > 0 && r.width > 0;
        });
        for (let i = 1; i < children.length; i++) {
          const prev = children[i - 1].getBoundingClientRect();
          const curr = children[i].getBoundingClientRect();
          const gap = curr.top - prev.bottom;
          if (gap >= -1) {
            measured.upperGapBound++;
            if (gap > 40.5) {
              violations.upperGapBound++;
              details.upperGapBound.push(`gap=${gap.toFixed(1)}px between ${children[i - 1].tagName}.${children[i - 1].className} and ${children[i].tagName}.${children[i].className}`);
            }
          }
        }
      }

      // 4. lineBudget: hairlines allowed only at bottom of top bar and between Items in a list (not first/last)
      const allLineEls = Array.from(document.querySelectorAll('body *'));
      for (const el of allLineEls) {
        if (!isVisible(el)) continue;
        const cs = getComputedStyle(el);
        const bt = parseFloat(cs.borderTopWidth) || 0;
        const bb = parseFloat(cs.borderBottomWidth) || 0;
        const isHr = el.tagName === 'HR';
        if (!isHr && bt === 0 && bb === 0) continue;

        const isControl = el.matches('input, textarea, select, button, .lp-btn, .lp-choice-card, .lp-choice-btn, .lp-popover, .lp-popover-menu, .lp-launcher-panel, .lp-dialog, .lp-dialog-panel, .lp-sheet, .lp-overlay-sheet, .lp-panel, .lp-entries-drawer, .lp-format-bar, [role="dialog"], [role="menu"]');
        if (isControl) continue;

        const isActiveTabUnderline = el.matches('[role="tab"][aria-selected="true"]') && bb <= 2.5 && bt === 0;
        const isStepperProgress = el.matches('.lp-stepper-progress, .lp-stepper-bar, .lp-stepper-fill') && (bb <= 2.5 || bt <= 2.5);
        if (isActiveTabUnderline || isStepperProgress) continue;

        const isTopBarBottom = el.matches('.lp-topbar, header[data-shell-topbar]') && bb > 0 && bt === 0;
        const isItemSeparator = el.matches('.lp-item') && !el.matches(':last-child') && bb > 0 && bt === 0;

        measured.lineBudget++;
        const owner = el.className ? `.${String(el.className).trim().split(/\s+/)[0]}` : el.tagName.toLowerCase();
        linesByOwner[owner] = (linesByOwner[owner] ?? 0) + 1;

        const isGallerySampleBorder =
          Boolean(el.closest('#dcomp-gallery')) &&
          el.matches('.lp-dialog-panel, .lp-overlay-surface, .lp-notice, .lp-credential-surface, .lp-credential-cell');
        const isChoiceControlBorder = el.matches('.lp-choice');
        if (!isTopBarBottom && !isItemSeparator && !isGallerySampleBorder && !isChoiceControlBorder) {
          violations.lineBudget++;
          details.lineBudget.push(`${el.tagName.toLowerCase()}.${el.className} bt=${bt} bb=${bb}`);
        }
      }

      // 5. actionBarFullWidth: ActionBar page/dialog buttons span full width of container (D-I1 I1: item-level and text buttons are compact)
      const actionBars = Array.from(document.querySelectorAll('.lp-action-bar'));
      for (const bar of actionBars) {
        if (!isVisible(bar) || bar.classList.contains('lp-action-bar-item')) continue;
        const barRect = bar.getBoundingClientRect();
        const btns = Array.from(bar.querySelectorAll<HTMLElement>('button, a.lp-btn'));
        for (const btn of btns) {
          if (!isVisible(btn) || btn.classList.contains('lp-btn-text')) continue;
          measured.actionBarFullWidth++;
          const btnRect = btn.getBoundingClientRect();
          if (barRect.width > 0 && btnRect.width < barRect.width - 2) {
            violations.actionBarFullWidth++;
            details.actionBarFullWidth.push(`btn "${btn.textContent?.trim()}" width=${btnRect.width.toFixed(1)} < bar=${barRect.width.toFixed(1)}`);
          }
        }
      }

      // 6. itemHoverAndPadding: no text within 8px of container edge; container has >= 8px padding if overflow hidden
      const items = Array.from(document.querySelectorAll('.lp-item'));
      for (const item of items) {
        if (!isVisible(item)) continue;
        const container = item.parentElement;
        if (!container) continue;
        measured.itemHoverAndPadding++;
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const cStyle = getComputedStyle(container);
        const padLeft = parseFloat(cStyle.paddingLeft) || 0;
        const padRight = parseFloat(cStyle.paddingRight) || 0;
        if ((cStyle.overflow === 'hidden' || cStyle.overflowX === 'hidden') && (padLeft < 7.5 || padRight < 7.5)) {
          violations.itemHoverAndPadding++;
          details.itemHoverAndPadding.push(`Item container ${container.className} clips bleed (padL=${padLeft}, padR=${padRight})`);
        }
        const isPlainList = container.getAttribute('data-variant') === 'plain' || container.classList.contains('lp-list-plain');
        const title = item.querySelector('.lp-item-title') ?? item;
        const tRect = title.getBoundingClientRect();
        if (!isPlainList && tRect.left - cRect.left < 7.5) {
          violations.itemHoverAndPadding++;
          details.itemHoverAndPadding.push(`Item text "${title.textContent?.trim()}" within 8px of container edge (${(tRect.left - cRect.left).toFixed(1)}px)`);
        }
      }

      // 7 & 8. topBarSignature & topBarLabel
      const topbar = document.querySelector('.lp-topbar, .lp-admin-header, header[role="banner"], header[data-shell-topbar], .lp-editor-topbar');
      let topBarSig: { roles: string[]; height: number } | null = null;
      if (topbar && isVisible(topbar)) {
        measured.topBarSignature++;
        const r = topbar.getBoundingClientRect();
        const roles = Array.from(topbar.querySelectorAll('button, a, span, [role]'))
          .filter((el) => isVisible(el))
          .map((el) => el.getAttribute('aria-label') || el.tagName.toLowerCase());
        topBarSig = { roles, height: Math.round(r.height) };
        if (topbar.matches('.lp-editor-topbar')) {
          violations.topBarSignature++;
          details.topBarSignature.push('Separate .lp-editor-topbar shell rendered');
        }
      }
      const brandEls = Array.from(document.querySelectorAll('.lp-topbar-brand, .lp-admin-header-brand, .lp-brand-title'));
      for (const brand of brandEls) {
        if (!isVisible(brand)) continue;
        measured.topBarLabel++;
        const text = (brand.textContent || '').trim();
        if (text !== 'Admin') {
          violations.topBarLabel++;
          details.topBarLabel.push(`Topbar brand label="${text}" !== "Admin"`);
        }
      }

      // 9. arrowsInStrings: no arrow characters in visible strings
      const arrowRe = /[←→↑↓↔⇐⇒▾▸]/;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const txt = (node.textContent || '').trim();
        if (!txt) continue;
        const parent = node.parentElement;
        if (!parent || !isVisible(parent)) continue;
        if (parent.closest('script, style')) continue;
        measured.arrowsInStrings++;
        if (arrowRe.test(txt)) {
          violations.arrowsInStrings++;
          details.arrowsInStrings.push(`Arrow char in "${txt.slice(0, 40)}"`);
        }
      }

      // 10. iconButtonFilled: filled background, no border, sprite resolves
      const spriteIds = new Set(
        Array.from(document.querySelectorAll('#lp-icon-sprite symbol')).map((s) => `#${s.id}`)
      );
      const iconBtns = Array.from(document.querySelectorAll('.lp-icon-btn'));
      for (const btn of iconBtns) {
        if (!isVisible(btn)) continue;
        measured.iconButtonFilled++;
        const cs = getComputedStyle(btn);
        const bw = parseFloat(cs.borderTopWidth) || 0;
        const bg = cs.backgroundColor;
        if (bw > 0) {
          violations.iconButtonFilled++;
          details.iconButtonFilled.push(`Icon button "${btn.getAttribute('aria-label')}" has border ${bw}px`);
        }
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
          violations.iconButtonFilled++;
          details.iconButtonFilled.push(`Icon button "${btn.getAttribute('aria-label')}" has transparent bg`);
        }
        const use = btn.querySelector('svg use');
        const href = use?.getAttribute('href') || '';
        if (!href || !spriteIds.has(href)) {
          violations.iconButtonFilled++;
          details.iconButtonFilled.push(`Icon button "${btn.getAttribute('aria-label')}" unresolved sprite "${href}"`);
        }
      }

      // 11. editorHeaderFit320
      if ((isEditor || isCanary) && width <= 320) {
        const edHeader = document.querySelector('.lp-editor-header, .lp-editor-toolbar');
        if (edHeader && isVisible(edHeader)) {
          measured.editorHeaderFit320++;
          const r = edHeader.getBoundingClientRect();
          if (edHeader.scrollWidth > edHeader.clientWidth + 1 || r.right > width + 1) {
            violations.editorHeaderFit320++;
            details.editorHeaderFit320.push(`Editor header overflow scrollW=${edHeader.scrollWidth} clientW=${edHeader.clientWidth} right=${r.right}`);
          }
        }
      }

      // 12. formattingBarGeometry: centred on writing column and inside viewport
      if (isEditor || isCanary) {
        const bar = document.querySelector('.lp-formatting-bar, .lp-editor-toolbar-center');
        const col = document.querySelector('.lp-editor-writing-col, .lp-editor-canvas');
        if (bar && col && isVisible(bar) && isVisible(col)) {
          measured.formattingBarGeometry++;
          const bRect = bar.getBoundingClientRect();
          const cRect = col.getBoundingClientRect();
          const bCenter = (bRect.left + bRect.right) / 2;
          const cCenter = (cRect.left + cRect.right) / 2;
          if (bRect.left < -1 || bRect.right > width + 1 || bRect.bottom > height + 1) {
            violations.formattingBarGeometry++;
            details.formattingBarGeometry.push(`Formatting bar outside viewport [${bRect.left.toFixed(1)}, ${bRect.right.toFixed(1)}] vs ${width}`);
          } else if (Math.abs(bCenter - cCenter) > 8) {
            violations.formattingBarGeometry++;
            details.formattingBarGeometry.push(`Formatting bar center ${bCenter.toFixed(1)} != writing col center ${cCenter.toFixed(1)}`);
          }
        }
      }

      return { measured, violations, topBarSig, linesByOwner, details };
    },
    { width: vpWidth, height: vpHeight, isEditor: opts.isEditor, isCanary: opts.isCanary, isAuth: opts.isAuth }
  );
}

test.describe('WP-16.S D-SYS System Simplification Census & Canaries', () => {
  test('canaries: every D-SYS census check catches its intentional violation and measures > 0', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/_canary?suite=dsys');

    const res = await scanDSysOnPage(page, 320, 640, { isEditor: false, isCanary: true });
    for (const [key, count] of Object.entries(res.measured)) {
      if (key === 'topBarSignature') continue;
      expect(count, `Canary measured 0 for ${key}`).toBeGreaterThan(0);
    }
    expect(res.violations.textAlign).toBeGreaterThan(0);
    expect(res.violations.emptyInFlow).toBeGreaterThan(0);
    expect(res.violations.upperGapBound).toBeGreaterThan(0);
    expect(res.violations.lineBudget).toBeGreaterThan(0);
    expect(res.violations.actionBarFullWidth).toBeGreaterThan(0);
    expect(res.violations.itemHoverAndPadding).toBeGreaterThan(0);
    expect(res.violations.topBarLabel).toBeGreaterThan(0);
    expect(res.violations.arrowsInStrings).toBeGreaterThan(0);
    expect(res.violations.iconButtonFilled).toBeGreaterThan(0);
    expect(res.violations.editorHeaderFit320).toBeGreaterThan(0);
    expect(res.violations.formattingBarGeometry).toBeGreaterThan(0);
  });

  test('D-SYS census meets shrinking-only budget across all pages, themes, and viewports', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const budgetFile: DSysBudgetFile = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));

    await ensureAdminLoggedIn(page);
    const seededId = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
      const data = await res.json();
      return data.entries?.[0]?.id ?? null;
    });
    expect(seededId).toBeTruthy();

    const routes = [
      '/admin',
      '/admin/entries',
      `/admin/entries/${encodeURIComponent(seededId)}/history`,
      '/admin/inbox',
      '/admin/audit',
      '/admin/import',
      '/admin/settings/answering',
      '/admin/settings/providers',
      '/admin/entries/new',
      `/admin/entries/${encodeURIComponent(seededId)}`,
      '/admin/_gallery',
    ];
    const editorRoutes = new Set(['/admin/entries/new', `/admin/entries/${encodeURIComponent(seededId)}`]);
    const themes: Array<'light' | 'dark'> = ['light', 'dark'];
    const viewports = [
      { width: 1280, height: 800 },
      { width: 320, height: 640 },
    ];

    const totals: DSysMetrics = {
      measured: {
        textAlign: 0,
        emptyInFlow: 0,
        upperGapBound: 0,
        lineBudget: 0,
        actionBarFullWidth: 0,
        itemHoverAndPadding: 0,
        topBarSignature: 0,
        topBarLabel: 0,
        arrowsInStrings: 0,
        iconButtonFilled: 0,
        editorHeaderFit320: 0,
        formattingBarGeometry: 0,
      },
      violations: {
        textAlign: 0,
        emptyInFlow: 0,
        upperGapBound: 0,
        lineBudget: 0,
        actionBarFullWidth: 0,
        itemHoverAndPadding: 0,
        topBarSignature: 0,
        topBarLabel: 0,
        arrowsInStrings: 0,
        iconButtonFilled: 0,
        editorHeaderFit320: 0,
        formattingBarGeometry: 0,
      },
      topBarSig: null,
      linesByOwner: {},
      details: {
        textAlign: [],
        emptyInFlow: [],
        upperGapBound: [],
        lineBudget: [],
        actionBarFullWidth: [],
        itemHoverAndPadding: [],
        topBarSignature: [],
        topBarLabel: [],
        arrowsInStrings: [],
        iconButtonFilled: [],
        editorHeaderFit320: [],
        formattingBarGeometry: [],
      },
    };

    const sigByVp: Record<number, string> = {};

    const accumulate = (m: DSysMetrics, vpWidth: number, route: string) => {
      for (const k of Object.keys(totals.measured) as Array<keyof typeof totals.measured>) {
        totals.measured[k] += m.measured[k];
      }
      for (const k of Object.keys(totals.violations) as Array<keyof typeof totals.violations>) {
        totals.violations[k] += m.violations[k];
        if (m.details[k]?.length && totals.details[k].length < 15) {
          totals.details[k].push(...m.details[k].slice(0, 15 - totals.details[k].length));
        }
      }
      for (const [owner, cnt] of Object.entries(m.linesByOwner)) {
        totals.linesByOwner[owner] = (totals.linesByOwner[owner] ?? 0) + cnt;
      }
      if (m.topBarSig) {
        const sigStr = JSON.stringify(m.topBarSig);
        if (!sigByVp[vpWidth]) {
          sigByVp[vpWidth] = sigStr;
        } else if (sigByVp[vpWidth] !== sigStr) {
          totals.violations.topBarSignature++;
          if (totals.details.topBarSignature.length < 15) {
            totals.details.topBarSignature.push(`${route}@${vpWidth}: ${sigStr} != ${sigByVp[vpWidth]}`);
          }
        }
      }
    };

    for (const route of routes) {
      const isEd = editorRoutes.has(route);
      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await page.goto(route);
        for (const theme of themes) {
          await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
          accumulate(await scanDSysOnPage(page, vp.width, vp.height, { isEditor: isEd }), vp.width, route);
        }
      }
    }

    for (const route of editorRoutes) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route);
      for (const theme of themes) {
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        accumulate(await scanDSysOnPage(page, 1920, 1080, { isEditor: true }), 1920, route);
      }
    }

    console.log('=== WP-16.S D-SYS CENSUS REPORT ===');
    console.log(
      JSON.stringify(
        {
          measured: totals.measured,
          violations: totals.violations,
          linesByOwner: totals.linesByOwner,
          sampleDetails: totals.details,
        },
        null,
        2
      )
    );

    for (const [k, cnt] of Object.entries(totals.measured)) {
      expect(cnt, `Census measured 0 items for ${k}`).toBeGreaterThan(0);
    }

    expect(totals.violations.textAlign).toBeLessThanOrEqual(budgetFile.budgets.textAlignViolations);
    expect(totals.violations.emptyInFlow).toBeLessThanOrEqual(budgetFile.budgets.emptyInFlowViolations);
    expect(totals.violations.upperGapBound).toBeLessThanOrEqual(budgetFile.budgets.upperGapViolations);
    expect(totals.violations.lineBudget).toBeLessThanOrEqual(budgetFile.budgets.lineBudgetViolations);
    expect(totals.violations.actionBarFullWidth).toBeLessThanOrEqual(budgetFile.budgets.actionBarFullWidthViolations);
    expect(totals.violations.itemHoverAndPadding).toBeLessThanOrEqual(budgetFile.budgets.itemHoverAndPaddingViolations);
    expect(totals.violations.topBarSignature).toBeLessThanOrEqual(budgetFile.budgets.topBarSignatureViolations);
    expect(totals.violations.topBarLabel).toBeLessThanOrEqual(budgetFile.budgets.topBarLabelViolations);
    expect(totals.violations.arrowsInStrings).toBeLessThanOrEqual(budgetFile.budgets.arrowsInStringsViolations);
    expect(totals.violations.iconButtonFilled).toBeLessThanOrEqual(budgetFile.budgets.iconButtonFilledViolations);
    expect(totals.violations.editorHeaderFit320).toBeLessThanOrEqual(budgetFile.budgets.editorHeaderFit320Violations);
    expect(totals.violations.formattingBarGeometry).toBeLessThanOrEqual(budgetFile.budgets.formattingBarGeometryViolations);
  });
});
