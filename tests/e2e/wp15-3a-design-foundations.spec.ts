import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.3a Design Foundations Conformance (D-FOUND-1..6)', () => {
  test('enforces all Checkpoint 1 foundations rules: contrast ratios, specimens, Details grid, loading/disabled states, link-style notices, icon alignment, 6-state grid, auto-grow textarea, responsive header, and auth guard', async ({
    page,
    browser,
  }) => {
    // Item 10: Unauthenticated session is redirected to login/setup
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto('/admin/dev/foundations');
    await expect(unauthPage).toHaveURL(/\/admin\/(login|setup)/);
    await unauthContext.close();

    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    await expect(page.getByRole('heading', { name: 'Design Foundations Gallery' })).toBeVisible();

    // 1. D-FOUND-2: Radius tokens (8px control, 12px container, 16px overlay, 999px pill), elevation & borderless badges
    const shapeAudit = await page.evaluate(() => {
      const checkRadius = (sel: string, expectedPx: string) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
        return els.length > 0 && els.every((el) => getComputedStyle(el).borderTopLeftRadius === expectedPx);
      };
      const badges = Array.from(document.querySelectorAll<HTMLElement>('.lp-badge'));
      const badgesBorderless = badges.every((b) => parseFloat(getComputedStyle(b).borderTopWidth) === 0);
      const badgesNonPointer = badges.every((b) => getComputedStyle(b).cursor !== 'pointer');
      const chips = Array.from(document.querySelectorAll<HTMLElement>('button.lp-chip'));
      const chipsBordered = chips.every((c) => parseFloat(getComputedStyle(c).borderTopWidth) === 1);
      const containerFlat = getComputedStyle(document.getElementById('specimen-radius-container')!).boxShadow === 'none';
      const overlayRaised = getComputedStyle(document.getElementById('specimen-radius-overlay')!).boxShadow !== 'none';

      return {
        controls8: checkRadius('.lp-btn, .lp-icon-btn, .lp-input', '8px'),
        containers12: checkRadius('.lp-card, .lp-notice, .lp-empty-state, #specimen-radius-container', '12px'),
        overlays16: checkRadius('.lp-dialog-panel, .lp-drawer-panel, #specimen-radius-overlay', '16px'),
        pills999: checkRadius('.lp-badge, .lp-chip, .lp-status-dot', '999px'),
        badgesBorderless,
        badgesNonPointer,
        chipsBordered,
        containerFlat,
        overlayRaised,
      };
    });
    expect(shapeAudit).toEqual({
      controls8: true,
      containers12: true,
      overlays16: true,
      pills999: true,
      badgesBorderless: true,
      badgesNonPointer: true,
      chipsBordered: true,
      containerFlat: true,
      overlayRaised: true,
    });

    // 2. D-FOUND-3: Spacing scale (only 0, 2, 4, 8, 12, 16, 24, 32, 48, 64 px) + visible spacing bars
    const spacingAudit = await page.evaluate(() => {
      const allowed = new Set([0, 2, 4, 8, 12, 16, 24, 32, 48, 64]);
      const bad: string[] = [];
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-foundations-scope] *'));
      for (const el of els) {
        const cs = getComputedStyle(el);
        for (const prop of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap'] as const) {
          const val = cs[prop];
          if (!val || val === 'normal') continue;
          const num = Math.round(parseFloat(val));
          if (!Number.isNaN(num) && !allowed.has(num)) {
            bad.push(`${el.tagName}.${el.className} ${prop}=${val}`);
          }
        }
      }
      const barSteps = [4, 8, 12, 16, 24, 32, 48, 64];
      const barsMatch = barSteps.every((px) => {
        const bar = document.querySelector<HTMLElement>(`.lp-spacing-bar-${px}`);
        return bar && Math.round(bar.getBoundingClientRect().width) === px;
      });
      return { bad, barsMatch };
    });
    expect(spacingAudit.bad).toEqual([]);
    expect(spacingAudit.barsMatch).toBe(true);

    // 3. D-FOUND-1: SVG icon sizes in {16, 20, 24}, full sprite inventory with names, captioned icon-button states
    const iconAudit = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll<SVGElement>('svg.lp-icon'));
      const validSizes = icons.every((svg) => {
        const attrW = Math.round(parseFloat(svg.getAttribute('width') || '0'));
        const attrH = Math.round(parseFloat(svg.getAttribute('height') || '0'));
        const cs = getComputedStyle(svg);
        const cssW = Math.round(parseFloat(cs.width || String(attrW)));
        const cssH = Math.round(parseFloat(cs.height || String(attrH)));
        return [16, 20, 24].includes(attrW) && attrW === attrH && cssW === attrW && cssH === attrH;
      });
      const iconBtns = Array.from(document.querySelectorAll<HTMLElement>('.lp-icon-btn'));
      const allNamed = iconBtns.every(
        (btn) => Boolean(btn.getAttribute('aria-label')?.trim()) && Boolean(btn.getAttribute('title')?.trim())
      );
      const noneFilled = iconBtns.every((btn) => !btn.classList.contains('lp-btn-primary') && !btn.classList.contains('lp-btn-danger'));
      const inventoryCount = document.querySelectorAll('#foundations-icon-inventory [data-icon-specimen]').length;
      const captionedStates = document.querySelectorAll('[data-icon-btn-caption]').length;
      return { iconCount: icons.length, validSizes, allNamed, noneFilled, inventoryCount, captionedStates };
    });
    expect(iconAudit.iconCount).toBeGreaterThan(15);
    expect(iconAudit.validSizes).toBe(true);
    expect(iconAudit.allNamed).toBe(true);
    expect(iconAudit.noneFilled).toBe(true);
    expect(iconAudit.inventoryCount).toBe(16);
    expect(iconAudit.captionedStates).toBe(7);

    // 4. D-FOUND-2 & Item 5: No bordered element inside a bordered container (including .lp-notice) + link-style notice/status actions
    const nestedBorderedBoxes = await page.evaluate(() => {
      const isControlInCard = (el: HTMLElement, root: HTMLElement) => {
        if (root.classList.contains('lp-notice')) {
          return false; // Inside .lp-notice, even bordered buttons are prohibited (actions must be link-style)
        }
        return el.matches('button, input, select, textarea, .lp-chip, .lp-badge, .lp-switch-track, .lp-status-dot');
      };
      const hasFourSidedBorder = (el: HTMLElement, root: HTMLElement) => {
        if (isControlInCard(el, root)) return false;
        const cs = getComputedStyle(el);
        return (
          parseFloat(cs.borderTopWidth) > 0 &&
          parseFloat(cs.borderRightWidth) > 0 &&
          parseFloat(cs.borderBottomWidth) > 0 &&
          parseFloat(cs.borderLeftWidth) > 0
        );
      };
      const roots = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#foundations-components .lp-card, #foundations-components .lp-notice, #foundations-layout-preview .lp-editor-canvas'
        )
      );
      const violations: string[] = [];
      for (const root of roots) {
        if (!hasFourSidedBorder(root, root)) continue;
        const descendants = Array.from(root.querySelectorAll<HTMLElement>('*'));
        for (const d of descendants) {
          if (hasFourSidedBorder(d, root)) {
            violations.push(`${root.className} > ${d.tagName}.${d.className}`);
          }
        }
      }
      return violations;
    });
    expect(nestedBorderedBoxes).toEqual([]);

    // 5. Item 5 & Item 6: Tone icon vertical alignment against first text line, no "above"/"below" copy, Undo directly after message
    const messageAudit = await page.evaluate(() => {
      const checkIconAlign = (containerSel: string, iconSel: string, textSel: string) => {
        const container = document.querySelector<HTMLElement>(containerSel)!;
        const icon = container.querySelector<HTMLElement>(iconSel)!;
        const text = container.querySelector<HTMLElement>(textSel)!;
        const iconRect = icon.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(text).lineHeight) || 20;
        const iconCenterY = iconRect.top + iconRect.height / 2;
        const firstLineCenterY = textRect.top + lineHeight / 2;
        return Math.abs(iconCenterY - firstLineCenterY);
      };
      const noticeOffset = checkIconAlign('#gal-notice-info', '.lp-notice-icon', '.lp-notice-text');
      const statusOffset = checkIconAlign('#gal-status-ok', '.lp-status-icon', '.lp-status-line-text');
      const bodyText = document.getElementById('foundations-main')!.innerText;
      const hasDirectionalCopy = /\b(above|below)\b/i.test(bodyText);
      const undoBtn = document.querySelector<HTMLElement>('#gal-status-ok .lp-status-undo-link')!;
      const msgText = document.querySelector<HTMLElement>('#gal-status-ok .lp-status-line-text')!;
      const undoGap = undoBtn.getBoundingClientRect().left - msgText.getBoundingClientRect().right;
      return { noticeOffset, statusOffset, hasDirectionalCopy, undoGap };
    });
    expect(messageAudit.noticeOffset).toBeLessThanOrEqual(2.5);
    expect(messageAudit.statusOffset).toBeLessThanOrEqual(2.5);
    expect(messageAudit.hasDirectionalCopy).toBe(false);
    expect(messageAudit.undoGap).toBeLessThanOrEqual(24);

    // 6. Item 3 & Item 4: Details 2-col layout >= 768px, non-truncated select, non-clipped date, no state repetition, loading contrast + spinner, disabled tooltip
    const detailsAndStatesAudit = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('#gal-disclosure .lp-details-grid')!;
      const colTracks = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const summaryText = document.querySelector<HTMLElement>('#gal-disclosure .lp-disclosure-summary')!.innerText;
      const repeatsState = /\b(Draft|Unlisted|Public)\b/i.test(summaryText);
      const dateInput = document.getElementById('gal-details-date') as HTMLInputElement;
      const dateWidth = dateInput.getBoundingClientRect().width;
      const dateUnclipped = dateInput.scrollWidth <= dateInput.clientWidth + 2 && dateWidth >= 148;
      const selectEl = document.getElementById('gal-details-profile') as HTMLSelectElement;
      const selectUnclipped = selectEl.scrollWidth <= selectEl.clientWidth + 2;

      const loadingBtn = document.getElementById('gal-btn-loading')!;
      const loadingOpacity = getComputedStyle(loadingBtn).opacity;
      const hasSpinner = Boolean(loadingBtn.querySelector('.lp-icon-spin'));

      return { colTracks, repeatsState, dateUnclipped, selectUnclipped, loadingOpacity, hasSpinner };
    });
    expect(detailsAndStatesAudit).toEqual({
      colTracks: 2,
      repeatsState: false,
      dateUnclipped: true,
      selectUnclipped: true,
      loadingOpacity: '1',
      hasSpinner: true,
    });

    // Tooltip hover & focus verification (Item 2 & Item 4)
    const iconTooltip = page.locator('#gal-icon-tooltip');
    await expect(iconTooltip).toBeHidden();
    await page.locator('#gal-ibtn-ghost-focus').hover();
    await expect(iconTooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await page.locator('#gal-ibtn-ghost-focus').focus();
    await expect(iconTooltip).toBeVisible();

    // Open Menu keyboard navigation & Open Dialog focus trap + Esc close (Item 2)
    const firstMenuItem = page.locator('#gal-menu-copy');
    const secondMenuItem = page.locator('#gal-menu-unlist');
    await firstMenuItem.focus();
    await page.keyboard.press('ArrowDown');
    await expect(secondMenuItem).toBeFocused();

    const dialog = page.locator('#gal-dialog-specimen');
    await expect(dialog).toBeVisible();
    const dialogConfirm = page.locator('#gal-dialog-confirm');
    await dialogConfirm.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.locator('[data-lp-dialog-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // 7. Item 7: 6-state grid alignment with real EntryRow counts (0, 0, 1, 1, 2, 2), body, Details, and action bar
    const alignmentAudit = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-main]'));
      const rects = cols.map((c) => {
        const r = c.getBoundingClientRect();
        return { state: c.getAttribute('data-state-main'), left: Math.round(r.left), width: Math.round(r.width) };
      });
      const listCols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-list]'));
      const listWidths = listCols.map((c) => Math.round(c.getBoundingClientRect().width));
      const rowCounts = listCols.map((c) => c.querySelectorAll('.lp-entry-row').length);
      const editorStates = ['draft', 'error', 'unlisted', 'public'];
      const editorsComplete = editorStates.every((st) => {
        const main = document.querySelector(`[data-state-main="${st}"]`)!;
        return (
          Boolean(main.querySelector('.lp-editor-action-bar')) &&
          Boolean(main.querySelector('textarea.lp-textarea')) &&
          Boolean(main.querySelector('details.lp-disclosure'))
        );
      });
      const errorTitle = (document.querySelector('#preview-error-title') as HTMLInputElement | null)?.value ?? 'NON_EMPTY';
      return { rects, listWidths, rowCounts, editorsComplete, errorTitle };
    });
    expect(alignmentAudit.rects.length).toBe(6);
    const firstRect = alignmentAudit.rects[0];
    for (const r of alignmentAudit.rects) {
      expect(r.left).toBe(firstRect.left);
      expect(r.width).toBe(firstRect.width);
      expect(r.width).toBeLessThanOrEqual(720);
    }
    expect(alignmentAudit.listWidths).toEqual([260, 260, 260, 260, 260, 260]);
    expect(alignmentAudit.rowCounts).toEqual([0, 0, 1, 1, 2, 2]);
    expect(alignmentAudit.editorsComplete).toBe(true);
    expect(alignmentAudit.errorTitle).toBe('');

    // 8. Item 1 & Item 9: Contrast ratios displayed as numeric X.X:1 (never "AA Pass"), >= 4.5:1 text & >= 3.0:1 UI/focus, plus theme toggle rule in light & dark
    for (const theme of ['light', 'dark'] as const) {
      await page.goto(`/admin/dev/foundations?theme=${theme}`);
      const themeAudit = await page.evaluate(() => {
        const parseRgb = (str: string): [number, number, number] => {
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
        };
        const lum = ([r, g, b]: [number, number, number]) => {
          const f = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (c1: string, c2: string) => {
          const l1 = lum(parseRgb(c1));
          const l2 = lum(parseRgb(c2));
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        const swatches = Array.from(document.querySelectorAll<HTMLElement>('[data-contrast-role]'));
        const textFailures: string[] = [];
        for (const sw of swatches) {
          const cs = getComputedStyle(sw);
          const r = ratio(cs.color, cs.backgroundColor);
          if (r < 4.5) textFailures.push(`${sw.getAttribute('data-contrast-role')}: ${r.toFixed(2)}`);
        }

        const ratioBadges = Array.from(document.querySelectorAll<HTMLElement>('[data-contrast-value]')).map(
          (el) => el.textContent?.trim() || ''
        );
        const allFormattedRatios = ratioBadges.length === 6 && ratioBadges.every((t) => /^\d+\.\d:1$/.test(t));
        const hasAaPass = document.body.innerText.includes('AA Pass');

        const ctrlProbe = document.querySelector<HTMLElement>('#contrast-probe-control')!;
        const ctrlCs = getComputedStyle(ctrlProbe);
        const borderRatio = ratio(ctrlCs.borderTopColor, ctrlCs.backgroundColor);
        const focusRatio = ratio(ctrlCs.outlineColor, ctrlCs.backgroundColor);

        const toggleBtn = document.getElementById('foundations-theme-toggle')!;
        const toggleLabel = toggleBtn.getAttribute('aria-label');
        const toggleHref = toggleBtn.querySelector('use')?.getAttribute('href');
        const navVisible = getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display !== 'none';
        const mobileMenuHidden = getComputedStyle(document.getElementById('foundations-menu-btn')!).display === 'none';

        return {
          textFailures,
          allFormattedRatios,
          hasAaPass,
          borderRatio,
          focusRatio,
          toggleLabel,
          toggleHref,
          navVisible,
          mobileMenuHidden,
        };
      });
      expect(themeAudit.textFailures).toEqual([]);
      expect(themeAudit.allFormattedRatios).toBe(true);
      expect(themeAudit.hasAaPass).toBe(false);
      expect(themeAudit.borderRatio).toBeGreaterThanOrEqual(3.0);
      expect(themeAudit.focusRatio).toBeGreaterThanOrEqual(3.0);
      expect(themeAudit.navVisible).toBe(true);
      expect(themeAudit.mobileMenuHidden).toBe(true);
      if (theme === 'light') {
        expect(themeAudit.toggleLabel).toBe('Switch to dark theme');
        expect(themeAudit.toggleHref).toBe('#lp-icon-moon');
      } else {
        expect(themeAudit.toggleLabel).toBe('Switch to light theme');
        expect(themeAudit.toggleHref).toBe('#lp-icon-sun');
      }

      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    }

    // 9. Item 3, Item 8 & Item 9 at 320px: compact header, >= 44px targets, 1-col Details grid, and auto-growing textarea without clipping
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/dev/foundations?theme=light');

    const textarea = page.locator('#gal-field-reading');
    await textarea.fill(Array.from({ length: 12 }, (_, i) => `Line ${i + 1}: Writing surface grows cleanly at 320px.`).join('\n'));

    const mobileAudit = await page.evaluate(() => {
      const mainEl = document.getElementById('foundations-main')!;
      const mainTop = Math.round(mainEl.getBoundingClientRect().top);
      const navHidden = getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display === 'none';
      const mobileMenuVisible = getComputedStyle(document.getElementById('foundations-menu-btn')!).display !== 'none';
      const grid = document.querySelector<HTMLElement>('#gal-disclosure .lp-details-grid')!;
      const colTracks = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const ta = document.getElementById('gal-field-reading') as HTMLTextAreaElement;
      const rows = Number(ta.getAttribute('rows') || '0');
      const unclipped = ta.scrollHeight <= ta.clientHeight + 2;

      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('.lp-admin-header button, #foundations-components button:not([hidden])')
      ).filter((el) => el.offsetParent !== null);
      const undersized = targets
        .map((el) => ({ id: el.id || el.className, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
        .filter((t) => t.h < 44 || t.w < 44);
      return { mainTop, navHidden, mobileMenuVisible, colTracks, rows, unclipped, undersized };
    });
    expect(mobileAudit.mainTop).toBeLessThanOrEqual(64);
    expect(mobileAudit.navHidden).toBe(true);
    expect(mobileAudit.mobileMenuVisible).toBe(true);
    expect(mobileAudit.colTracks).toBe(1);
    expect(mobileAudit.rows).toBeGreaterThanOrEqual(6);
    expect(mobileAudit.unclipped).toBe(true);
    expect(mobileAudit.undersized).toEqual([]);
  });

  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    test('captures amended Checkpoint 1 gallery screenshots at 1280 and 320 px in light and dark', async ({ page }) => {
      await ensureAdminLoggedIn(page);
      const outDir = process.env.SCREENSHOT_DIR || 'test-results/wp15-3a';
      for (const width of [1280, 320] as const) {
        await page.setViewportSize({ width, height: 900 });
        for (const theme of ['light', 'dark'] as const) {
          await page.goto(`/admin/dev/foundations?theme=${theme}`);
          await page.screenshot({
            path: `${outDir}/foundations-${width}px-${theme}.png`,
            fullPage: true,
          });
        }
      }
    });
  }
});
