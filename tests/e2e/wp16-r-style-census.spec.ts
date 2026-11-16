import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

interface BudgetFile {
  version: number;
  note: string;
  budgets: {
    invalidRadii: number;
    invalidControlHeights: number;
    invalidFontSizes: number;
    invalidSpacing: number;
    inlineStyles: number;
    multiSignatureRoles: number;
    h1PositionMismatch: number;
    columnWidthMismatch: number;
    tabGapViolations: number;
    siblingGapViolations: number;
    nonTokenColors: number;
    excessBackgroundColors: number;
    parentBoxOverflows: number;
    clippedText: number;
    forbiddenTextMatches: number;
    selectChevronMismatch: number;
  };
}

const BUDGET_PATH = resolve(process.cwd(), 'docs/audits/style-census-budget.json');

test.describe('WP-16.L D-LAYOUT & D-MIN Style/Layout Census (every admin page & overlay x 2 themes x 1280/320px + editor 1920px)', () => {
  test('census meets shrinking budgets and prints layout, colour, overflow, text, select & value metrics', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const budgetFile: BudgetFile = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));

    await ensureAdminLoggedIn(page);
    const seededId = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
      const data = await res.json();
      return data.entries?.[0]?.id ?? null;
    });
    expect(seededId).toBeTruthy();

    const templateRoutes = [
      '/admin',
      '/admin/entries',
      `/admin/entries/${encodeURIComponent(seededId)}/history`,
      '/admin/inbox',
      '/admin/audit',
      '/admin/import',
      '/admin/settings',
    ];
    const editorRoutes = [
      '/admin/entries/new',
      `/admin/entries/${encodeURIComponent(seededId)}`,
    ];
    const adminRoutes = [...templateRoutes, ...editorRoutes];
    const authRoutes = ['/admin/login'];
    const themes: Array<'light' | 'dark'> = ['light', 'dark'];
    const viewports = [
      { width: 1280, height: 800 },
      { width: 320, height: 640 },
    ];

    let totalElements = 0;
    let totalControls = 0;
    let invalidRadii = 0;
    let invalidControlHeights = 0;
    let invalidFontSizes = 0;
    let invalidSpacing = 0;
    let inlineStyles = 0;
    let h1PositionMismatch = 0;
    let columnWidthMismatch = 0;
    let tabGapViolations = 0;
    let siblingGapViolations = 0;
    let nonTokenColors = 0;
    let excessBackgroundColors = 0;
    let parentBoxOverflows = 0;
    let clippedText = 0;
    let forbiddenTextMatches = 0;
    let selectChevronMismatch = 0;

    const distinctRadii = new Set<string>();
    const distinctControlHeights = new Set<number>();
    const distinctFontSizes = new Set<number>();
    const distinctFontFamilies = new Set<string>();
    const h1PositionsByWidth: Record<number, Array<{ route: string; left: number; top: number }>> = {};

    const roleSignatures: Record<string, Set<string>> = {
      stateLabel: new Set(),
      tab: new Set(),
      button: new Set(),
      iconButton: new Set(),
      input: new Set(),
      select: new Set(),
    };
    const roleBorderColors: Record<string, Set<string>> = {
      stateLabel: new Set(),
      tab: new Set(),
      button: new Set(),
      iconButton: new Set(),
      input: new Set(),
      select: new Set(),
    };

    const scanCurrentPage = async (route: string, theme: 'light' | 'dark', width: number, isTemplatePage: boolean) => {
      await page.evaluate(async (t) => {
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem('strata-theme', t); } catch {}
        void document.body.offsetHeight;
        await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
      }, theme);

      const res = await page.evaluate(({ isTemplate, vpWidth }) => {
        const allowedRadii = new Set([0, 4, 8]);
        const allowedFonts = new Set([12, 14, 16, 24]);
        const allowedSpace = new Set([0, 4, 8, 16, 24, 40, 64]);
        const allowedSiblingGaps = new Set([8, 16, 24, 40]);

        // Extract active theme token colours from CSS custom properties on :root
        const tokenColors = new Set<string>(['rgba(0, 0, 0, 0)', 'transparent']);
        const rootStyle = getComputedStyle(document.documentElement);
        const probe = document.createElement('span');
        probe.style.display = 'none';
        document.body.appendChild(probe);
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) {
              if (rule instanceof CSSStyleRule) {
                for (let i = 0; i < rule.style.length; i++) {
                  const prop = rule.style[i];
                  if (prop.startsWith('--')) {
                    const val = rootStyle.getPropertyValue(prop).trim();
                    if (val && (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl'))) {
                      probe.style.color = val;
                      tokenColors.add(getComputedStyle(probe).color);
                    }
                  }
                }
              }
            }
          } catch {}
        }
        probe.remove();

        let els = 0;
        let ctrls = 0;
        let badRadii = 0;
        let badHeights = 0;
        let badFonts = 0;
        let badSpace = 0;
        let inlines = 0;
        let badColWidth = 0;
        let badTabGap = 0;
        let badSiblingGap = 0;
        let badTokenColors = 0;
        let badOverflow = 0;
        let badClipped = 0;
        let badText = 0;
        let badSelect = 0;

        const radiiSeen: string[] = [];
        const heightsSeen: number[] = [];
        const fontsSeen: number[] = [];
        const familiesSeen: string[] = [];
        const bgColorsSeen = new Set<string>();

        const sigs: Record<string, string[]> = {
          stateLabel: [],
          tab: [],
          button: [],
          iconButton: [],
          input: [],
          select: [],
        };
        const borderColors: Record<string, string[]> = {
          stateLabel: [],
          tab: [],
          button: [],
          iconButton: [],
          input: [],
          select: [],
        };

        // (a) Layout: page header position and template column width
        const headerEl = document.querySelector<HTMLElement>('.lp-page-header, main h1, h1');
        let h1Pos: { left: number; top: number } | null = null;
        if (headerEl) {
          const r = headerEl.getBoundingClientRect();
          h1Pos = { left: Math.round(r.left), top: Math.round(r.top) };
        }
        if (isTemplate) {
          const mainCol = document.querySelector<HTMLElement>('.lp-page-column') ?? document.querySelector<HTMLElement>('main > div, main');
          if (mainCol) {
            const expectedW = Math.min(720, vpWidth);
            const actualW = Math.round(mainCol.getBoundingClientRect().width);
            if (Math.abs(actualW - expectedW) > 4) {
              badColWidth++;
            }
          }
        }

        // (a) Tab list gap >= 24px
        const tabLists = Array.from(document.querySelectorAll<HTMLElement>('[role="tablist"], .lp-tabs'));
        for (const tl of tabLists) {
          const tlRect = tl.getBoundingClientRect();
          if (tlRect.height === 0) continue;
          let next = tl.nextElementSibling as HTMLElement | null;
          while (next && next.getBoundingClientRect().height === 0) {
            next = next.nextElementSibling as HTMLElement | null;
          }
          if (next) {
            const gap = Math.round(next.getBoundingClientRect().top - tlRect.bottom);
            if (gap < 24) {
              badTabGap++;
            }
          }
        }

        // (a) Vertical gaps between block siblings in main
        const containers = Array.from(document.querySelectorAll<HTMLElement>('main, .lp-page-column, main section'));
        for (const c of containers) {
          const isList = c.classList.contains('lp-list') || c.getAttribute('role') === 'list';
          const kids = Array.from(c.children).filter((k): k is HTMLElement => {
            const r = k.getBoundingClientRect();
            const s = getComputedStyle(k);
            return r.height > 0 && s.display !== 'none' && s.position !== 'fixed' && s.position !== 'absolute';
          });
          for (let i = 1; i < kids.length; i++) {
            const prevR = kids[i - 1].getBoundingClientRect();
            const currR = kids[i].getBoundingClientRect();
            const gap = Math.round(currR.top - prevR.bottom);
            if (gap < 0) continue;
            if (isList) {
              if (gap > 1) badSiblingGap++;
            } else if (gap > 1 && !allowedSiblingGaps.has(gap) && !allowedSiblingGaps.has(gap - 1) && !allowedSiblingGaps.has(gap + 1)) {
              badSiblingGap++;
            }
          }
        }

        const forbiddenRe = /UX-\d+|§|[a-z]+_[a-z]+|\bTier \d/;
        const rawJsonRe = /^\s*[\[{].*["':].*[\]}]\s*$/;

        const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
        for (const el of all) {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && styleAttr.trim().length > 0) {
            inlines++;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          els++;

          // (b) Colour tokens & distinct backgrounds (excluding status dots and primary buttons)
          const isDotOrPrimaryBtn =
            el.classList.contains('lp-status-dot') ||
            el.classList.contains('lp-btn-primary') ||
            el.classList.contains('lp-auth-progress-fill') ||
            el.classList.contains('lp-stepper-fill') ||
            el.classList.contains('lp-choice');
          if (!isDotOrPrimaryBtn && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
            bgColorsSeen.add(cs.backgroundColor);
            if (!tokenColors.has(cs.backgroundColor)) badTokenColors++;
          }
          if (cs.color && !tokenColors.has(cs.color)) {
            badTokenColors++;
          }
          if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopColor && !tokenColors.has(cs.borderTopColor)) {
            badTokenColors++;
          }

          // (c) Overflow & clipping against parent content box
          const parent = el.parentElement;
          if (parent && parent !== document.body && parent !== document.documentElement) {
            const pCs = getComputedStyle(parent);
            if (pCs.overflowX !== 'auto' && pCs.overflowX !== 'scroll' && cs.position !== 'fixed') {
              const pRect = parent.getBoundingClientRect();
              const pRight = pRect.right - (parseFloat(pCs.borderRightWidth) || 0) - (parseFloat(pCs.paddingRight) || 0);
              const pLeft = pRect.left + (parseFloat(pCs.borderLeftWidth) || 0) + (parseFloat(pCs.paddingLeft) || 0);
              if (rect.right > pRight + 2 || rect.left < pLeft - 2) {
                badOverflow++;
              }
            }
          }
          if (vpWidth <= 320) {
            if ((cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
              badClipped++;
            }
          }

          // (d) Forbidden text / raw JSON on leaf text-bearing elements
          if (el.children.length === 0) {
            const txt = (el.textContent || '').trim();
            if (txt && (forbiddenRe.test(txt) || rawJsonRe.test(txt))) {
              badText++;
            }
          }

          const isDot =
            el.classList.contains('lp-state-dot') ||
            el.hasAttribute('data-state-dot') ||
            (Math.round(rect.width) <= 8 && Math.round(rect.height) <= 8);

          const rad = cs.borderTopLeftRadius;
          const radPx = Math.round(parseFloat(rad) || 0);
          if (!isDot) {
            radiiSeen.push(`${radPx}px`);
            if (!allowedRadii.has(radPx)) badRadii++;
          }

          const fs = Math.round(parseFloat(cs.fontSize) || 0);
          if (fs > 0) {
            fontsSeen.push(fs);
            familiesSeen.push(cs.fontFamily);
            if (!allowedFonts.has(fs)) badFonts++;
          }

          const tag = el.tagName.toLowerCase();
          const spaces = [cs.paddingTop, cs.paddingBottom, cs.paddingLeft, cs.rowGap, cs.columnGap];
          if (tag !== 'select') spaces.push(cs.paddingRight);
          for (const sp of spaces) {
            if (!sp || sp === 'normal' || sp === 'auto') continue;
            const px = Math.round(parseFloat(sp) || 0);
            if (px > 0 && !allowedSpace.has(px)) badSpace++;
          }
          const isControl =
            tag === 'button' ||
            tag === 'select' ||
            (tag === 'input' && !['checkbox', 'radio', 'hidden'].includes((el as HTMLInputElement).type)) ||
            el.classList.contains('lp-btn') ||
            el.classList.contains('lp-icon-btn');

          if (isControl) {
            ctrls++;
            const h = Math.round(rect.height);
            heightsSeen.push(h);
            if (h !== 36) badHeights++;
          }

          // (e) Select chevron & right padding check
          if (tag === 'select') {
            const padR = Math.round(parseFloat(cs.paddingRight) || 0);
            if (cs.appearance !== 'none' || padR !== 36) {
              badSelect++;
            }
          }

          if (el.classList.contains('lp-state-label') || el.classList.contains('lp-badge')) {
            sigs.stateLabel.push(`${Math.round(rect.height)}|${radPx}|${cs.borderTopWidth}|${fs}|${cs.fontFamily}`);
            borderColors.stateLabel.push(cs.borderTopColor);
          } else if (el.getAttribute('role') === 'tab' || el.classList.contains('lp-tab')) {
            sigs.tab.push(`${Math.round(rect.height)}|${radPx}|${cs.borderBottomWidth}|${fs}|${cs.fontFamily}`);
            borderColors.tab.push(cs.borderBottomColor);
          } else if (el.classList.contains('lp-icon-btn') || (tag === 'button' && el.hasAttribute('aria-label') && !(el.textContent || '').trim())) {
            sigs.iconButton.push(`${Math.round(rect.width)}x${Math.round(rect.height)}|${radPx}|${cs.borderTopWidth}`);
            borderColors.iconButton.push(cs.borderTopColor);
          } else if (tag === 'button' || el.classList.contains('lp-btn')) {
            sigs.button.push(`${Math.round(rect.height)}|${radPx}|${cs.borderTopWidth}|${fs}|${cs.fontFamily}`);
            borderColors.button.push(cs.borderTopColor);
          } else if (tag === 'input' && !['checkbox', 'radio', 'hidden'].includes((el as HTMLInputElement).type) && !el.classList.contains('lp-editor-title-input')) {
            sigs.input.push(`${Math.round(rect.height)}|${radPx}|${cs.borderTopWidth}|${fs}|${cs.fontFamily}`);
            borderColors.input.push(cs.borderTopColor);
          } else if (tag === 'select') {
            sigs.select.push(`${Math.round(rect.height)}|${radPx}|${cs.borderTopWidth}|${fs}|${cs.fontFamily}|${cs.paddingRight}`);
            borderColors.select.push(cs.borderTopColor);
          }
        }

        return {
          els,
          ctrls,
          badRadii,
          badHeights,
          badFonts,
          badSpace,
          inlines,
          h1Pos,
          badColWidth,
          badTabGap,
          badSiblingGap,
          badTokenColors,
          distinctBgCount: bgColorsSeen.size,
          badOverflow,
          badClipped,
          badText,
          badSelect,
          radiiSeen,
          heightsSeen,
          fontsSeen,
          familiesSeen,
          sigs,
          borderColors,
        };
      }, { isTemplate: isTemplatePage, vpWidth: width });

      totalElements += res.els;
      totalControls += res.ctrls;
      invalidRadii += res.badRadii;
      invalidControlHeights += res.badHeights;
      invalidFontSizes += res.badFonts;
      invalidSpacing += res.badSpace;
      inlineStyles += res.inlines;
      columnWidthMismatch += res.badColWidth;
      tabGapViolations += res.badTabGap;
      siblingGapViolations += res.badSiblingGap;
      nonTokenColors += res.badTokenColors;
      if (res.distinctBgCount > 3) excessBackgroundColors++;
      parentBoxOverflows += res.badOverflow;
      clippedText += res.badClipped;
      forbiddenTextMatches += res.badText;
      selectChevronMismatch += res.badSelect;

      if (isTemplatePage && res.h1Pos) {
        h1PositionsByWidth[width] = h1PositionsByWidth[width] || [];
        h1PositionsByWidth[width].push({ route, left: res.h1Pos.left, top: res.h1Pos.top });
      }

      res.radiiSeen.forEach((r) => distinctRadii.add(r));
      res.heightsSeen.forEach((h) => distinctControlHeights.add(h));
      res.fontsSeen.forEach((f) => distinctFontSizes.add(f));
      res.familiesSeen.forEach((f) => distinctFontFamilies.add(f));
      for (const role of Object.keys(roleSignatures)) {
        res.sigs[role]?.forEach((s) => roleSignatures[role].add(s));
        res.borderColors[role]?.forEach((c) => roleBorderColors[role].add(c));
      }
    };

    for (const route of adminRoutes) {
      const isTemplate = templateRoutes.includes(route);
      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await page.goto(route);
        for (const theme of themes) {
          await scanCurrentPage(route, theme, vp.width, isTemplate);
        }
      }
    }

    // Editor routes at 1920x1080
    for (const route of editorRoutes) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route);
      for (const theme of themes) {
        await scanCurrentPage(route, theme, 1920, false);
      }
    }

    // Compare h1 positions across template pages at each viewport width
    for (const positions of Object.values(h1PositionsByWidth)) {
      if (positions.length > 1) {
        const ref = positions[0];
        for (let i = 1; i < positions.length; i++) {
          if (Math.abs(positions[i].left - ref.left) > 2 || Math.abs(positions[i].top - ref.top) > 2) {
            h1PositionMismatch++;
          }
        }
      }
    }

    // Auth routes (/admin/login) in a fresh context
    const authCtx = await page.context().browser()!.newContext();
    const authPage = await authCtx.newPage();
    for (const route of authRoutes) {
      for (const vp of viewports) {
        await authPage.setViewportSize(vp);
        await authPage.goto(`http://127.0.0.1:3100${route}`);
        for (const theme of themes) {
          await authPage.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
          inlineStyles += await authPage.locator('[style]').count();
        }
      }
    }
    await authCtx.close();

    const multiSignatureRoles = Object.values(roleSignatures).filter((s) => s.size > 1).length;

    const report = {
      totalElements,
      totalControls,
      violations: {
        invalidRadii,
        invalidControlHeights,
        invalidFontSizes,
        invalidSpacing,
        inlineStyles,
        multiSignatureRoles,
        h1PositionMismatch,
        columnWidthMismatch,
        tabGapViolations,
        siblingGapViolations,
        nonTokenColors,
        excessBackgroundColors,
        parentBoxOverflows,
        clippedText,
        forbiddenTextMatches,
        selectChevronMismatch,
      },
      ratios: {
        radiiCompliance: totalElements ? `${(((totalElements - invalidRadii) / totalElements) * 100).toFixed(1)}%` : '100%',
        controlHeightCompliance: totalControls ? `${(((totalControls - invalidControlHeights) / totalControls) * 100).toFixed(1)}%` : '100%',
        fontSizeCompliance: totalElements ? `${(((totalElements - invalidFontSizes) / totalElements) * 100).toFixed(1)}%` : '100%',
        inlineStyleFree: totalElements ? `${(((totalElements - inlineStyles) / totalElements) * 100).toFixed(1)}%` : '100%',
      },
      distinctRadii: [...distinctRadii],
      distinctControlHeights: [...distinctControlHeights].sort((a, b) => a - b),
      distinctFontSizes: [...distinctFontSizes].sort((a, b) => a - b),
      distinctFontFamiliesCount: distinctFontFamilies.size,
      distinctFontFamilies: [...distinctFontFamilies],
      borderColoursPerRole: Object.fromEntries(
        Object.entries(roleBorderColors).map(([k, v]) => [k, [...v]])
      ),
      perRoleSignatureCounts: Object.fromEntries(
        Object.entries(roleSignatures).map(([k, v]) => [k, v.size])
      ),
    };

    console.log('=== WP-16.L EXTENDED STYLE & LAYOUT CENSUS REPORT ===');
    console.log(JSON.stringify(report, null, 2));

    expect(invalidRadii, `invalidRadii ${invalidRadii} > budget ${budgetFile.budgets.invalidRadii}`).toBeLessThanOrEqual(budgetFile.budgets.invalidRadii);
    expect(invalidControlHeights, `invalidControlHeights ${invalidControlHeights} > budget ${budgetFile.budgets.invalidControlHeights}`).toBeLessThanOrEqual(budgetFile.budgets.invalidControlHeights);
    expect(invalidFontSizes, `invalidFontSizes ${invalidFontSizes} > budget ${budgetFile.budgets.invalidFontSizes}`).toBeLessThanOrEqual(budgetFile.budgets.invalidFontSizes);
    expect(invalidSpacing, `invalidSpacing ${invalidSpacing} > budget ${budgetFile.budgets.invalidSpacing}`).toBeLessThanOrEqual(budgetFile.budgets.invalidSpacing);
    expect(inlineStyles, `inlineStyles ${inlineStyles} > budget ${budgetFile.budgets.inlineStyles}`).toBeLessThanOrEqual(budgetFile.budgets.inlineStyles);
    expect(multiSignatureRoles, `multiSignatureRoles ${multiSignatureRoles} > budget ${budgetFile.budgets.multiSignatureRoles}`).toBeLessThanOrEqual(budgetFile.budgets.multiSignatureRoles);
    expect(h1PositionMismatch, `h1PositionMismatch ${h1PositionMismatch} > budget ${budgetFile.budgets.h1PositionMismatch}`).toBeLessThanOrEqual(budgetFile.budgets.h1PositionMismatch);
    expect(columnWidthMismatch, `columnWidthMismatch ${columnWidthMismatch} > budget ${budgetFile.budgets.columnWidthMismatch}`).toBeLessThanOrEqual(budgetFile.budgets.columnWidthMismatch);
    expect(tabGapViolations, `tabGapViolations ${tabGapViolations} > budget ${budgetFile.budgets.tabGapViolations}`).toBeLessThanOrEqual(budgetFile.budgets.tabGapViolations);
    expect(siblingGapViolations, `siblingGapViolations ${siblingGapViolations} > budget ${budgetFile.budgets.siblingGapViolations}`).toBeLessThanOrEqual(budgetFile.budgets.siblingGapViolations);
    expect(nonTokenColors, `nonTokenColors ${nonTokenColors} > budget ${budgetFile.budgets.nonTokenColors}`).toBeLessThanOrEqual(budgetFile.budgets.nonTokenColors);
    expect(excessBackgroundColors, `excessBackgroundColors ${excessBackgroundColors} > budget ${budgetFile.budgets.excessBackgroundColors}`).toBeLessThanOrEqual(budgetFile.budgets.excessBackgroundColors);
    expect(parentBoxOverflows, `parentBoxOverflows ${parentBoxOverflows} > budget ${budgetFile.budgets.parentBoxOverflows}`).toBeLessThanOrEqual(budgetFile.budgets.parentBoxOverflows);
    expect(clippedText, `clippedText ${clippedText} > budget ${budgetFile.budgets.clippedText}`).toBeLessThanOrEqual(budgetFile.budgets.clippedText);
    expect(forbiddenTextMatches, `forbiddenTextMatches ${forbiddenTextMatches} > budget ${budgetFile.budgets.forbiddenTextMatches}`).toBeLessThanOrEqual(budgetFile.budgets.forbiddenTextMatches);
    expect(selectChevronMismatch, `selectChevronMismatch ${selectChevronMismatch} > budget ${budgetFile.budgets.selectChevronMismatch}`).toBeLessThanOrEqual(budgetFile.budgets.selectChevronMismatch);
  });
});
