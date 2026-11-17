import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.3a Design Foundations Conformance (D-FOUND-1..6)', () => {
  test('UX-90: /admin/dev/foundations requires admin session', async ({ browser }) => {
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto('/admin/dev/foundations');
    await expect(unauthPage).toHaveURL(/\/admin\/(login|setup)/);
    await unauthContext.close();
  });

  test('UX-70 / UX-79 / D-FOUND-2: borderless pill badges, bordered chips, radii (8/12/16/999 px), and elevation', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');
    await expect(page.getByRole('heading', { name: 'Design Foundations Gallery' })).toBeVisible();

    const shapeAudit = await page.evaluate(() => {
      const checkRadius = (sel: string, expectedPx: string) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
        return els.length > 0 && els.every((el) => getComputedStyle(el).borderTopLeftRadius === expectedPx);
      };
      const badges = Array.from(document.querySelectorAll<HTMLElement>('.lp-badge'));
      const chips = Array.from(document.querySelectorAll<HTMLElement>('button.lp-chip'));
      return {
        controls4: checkRadius('.lp-btn, .lp-icon-btn, .lp-input', '4px'),
        containers4: checkRadius('.lp-card, .lp-notice, .lp-empty-state, #specimen-radius-container', '4px'),
        overlays8: checkRadius('.lp-dialog-panel, .lp-drawer-panel, #specimen-radius-overlay', '8px'),
        chips4: checkRadius('.lp-chip', '4px'),
        dots999: checkRadius('.lp-status-dot', '999px'),
        badgesBorderless: badges.every((b) => parseFloat(getComputedStyle(b).borderTopWidth) === 0),
        badgesNonPointer: badges.every((b) => getComputedStyle(b).cursor !== 'pointer'),
        chipsBorderless: chips.every((c) => parseFloat(getComputedStyle(c).borderTopWidth) === 0),
        containerFlat: getComputedStyle(document.getElementById('specimen-radius-container')!).boxShadow === 'none',
        overlayRaised: getComputedStyle(document.getElementById('specimen-radius-overlay')!).boxShadow !== 'none',
      };
    });
    expect(shapeAudit).toEqual({
      controls4: true,
      containers4: true,
      overlays8: true,
      chips4: true,
      dots999: true,
      badgesBorderless: true,
      badgesNonPointer: true,
      chipsBorderless: true,
      containerFlat: true,
      overlayRaised: true,
    });
  });

  test('D-FOUND-3: spacing scale (0, 2, 4, 8, 12, 16, 24, 32, 48, 64 px) and visible spacing bars', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const spacingAudit = await page.evaluate(() => {
      const allowed = new Set([0, 2, 4, 8, 12, 16, 24, 32, 48, 64]);
      const bad: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-foundations-scope] *'))) {
        const cs = getComputedStyle(el);
        for (const prop of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap'] as const) {
          if (el.tagName === 'SELECT' && prop === 'paddingRight') continue;
          const val = cs[prop];
          if (!val || val === 'normal') continue;
          const num = Math.round(parseFloat(val));
          if (!Number.isNaN(num) && !allowed.has(num)) bad.push(`${el.tagName}.${el.className} ${prop}=${val}`);
        }
      }
      const barsMatch = [4, 8, 12, 16, 24, 32, 48, 64].every((px) => {
        const bar = document.querySelector<HTMLElement>(`.lp-spacing-bar-${px}`);
        return bar && Math.round(bar.getBoundingClientRect().width) === px;
      });
      return { bad, barsMatch };
    });
    expect(spacingAudit.bad).toEqual([]);
    expect(spacingAudit.barsMatch).toBe(true);
  });

  test('UX-71 / D-FOUND-1: SVG sprite icons in {16, 20, 24} px, full inventory, and captioned icon-button states', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

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
      return {
        iconCount: icons.length,
        validSizes,
        allNamed: iconBtns.every((btn) => Boolean(btn.getAttribute('aria-label')?.trim()) && Boolean(btn.getAttribute('title')?.trim())),
        noneFilled: iconBtns.every((btn) => !btn.classList.contains('lp-btn-primary') && !btn.classList.contains('lp-btn-danger')),
        inventoryCount: document.querySelectorAll('#foundations-icon-inventory [data-icon-specimen]').length,
        captionedStates: document.querySelectorAll('[data-icon-btn-caption]').length,
      };
    });
    expect(iconAudit.iconCount).toBeGreaterThan(15);
    expect(iconAudit.validSizes).toBe(true);
    expect(iconAudit.allNamed).toBe(true);
    expect(iconAudit.noneFilled).toBe(true);
    expect(iconAudit.inventoryCount).toBe(16);
    expect(iconAudit.captionedStates).toBe(7);
  });

  test('UX-85: link-style notice/status actions, no nested bordered boxes, and tone icon alignment', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const result = await page.evaluate(() => {
      const isControlInCard = (el: HTMLElement) =>
        el.matches('button, input, select, textarea, .lp-chip, .lp-badge, .lp-switch-track, .lp-status-dot');
      const hasFourSidedBorder = (el: HTMLElement) => {
        if (isControlInCard(el)) return false;
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
        if (!hasFourSidedBorder(root)) continue;
        for (const d of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
          if (hasFourSidedBorder(d)) violations.push(`${root.className} > ${d.tagName}.${d.className}`);
        }
      }
      const checkIconAlign = (containerSel: string, iconSel: string, textSel: string) => {
        const c = document.querySelector<HTMLElement>(containerSel)!;
        const iconRect = c.querySelector<HTMLElement>(iconSel)!.getBoundingClientRect();
        const text = c.querySelector<HTMLElement>(textSel)!;
        const textRect = text.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(text).lineHeight) || 20;
        return Math.abs(iconRect.top + iconRect.height / 2 - (textRect.top + lh / 2));
      };
      return {
        violations,
        noticeOffset: checkIconAlign('#gal-notice-info', '.lp-notice-icon', '.lp-notice-text'),
        statusOffset: checkIconAlign('#gal-status-ok', '.lp-status-icon', '.lp-status-line-text'),
      };
    });
    expect(result.violations).toEqual([]);
    expect(result.noticeOffset).toBeLessThanOrEqual(2.5);
    expect(result.statusOffset).toBeLessThanOrEqual(2.5);
  });

  test('UX-86: no directional copy ("above"/"below") and inline Undo directly after message', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const msgAudit = await page.evaluate(() => {
      const bodyText = document.getElementById('foundations-main')!.innerText;
      const undoBtn = document.querySelector<HTMLElement>('#gal-status-ok .lp-status-undo-link')!;
      const msgText = document.querySelector<HTMLElement>('#gal-status-ok .lp-status-line-text')!;
      return {
        hasDirectionalCopy: /\b(above|below)\b/i.test(bodyText),
        undoGap: undoBtn.getBoundingClientRect().left - msgText.getBoundingClientRect().right,
      };
    });
    expect(msgAudit.hasDirectionalCopy).toBe(false);
    expect(msgAudit.undoGap).toBeLessThanOrEqual(24);
  });

  test('UX-83: Details disclosure real fields, 2-col layout >= 768 px, non-clipped date, non-truncated select, no state repetition', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const detailsAudit = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('#gal-disclosure .lp-details-grid')!;
      const summaryText = document.querySelector<HTMLElement>('#gal-disclosure .lp-disclosure-summary')!.innerText;
      const dateInput = document.getElementById('gal-details-date') as HTMLInputElement;
      const selectEl = document.getElementById('gal-details-profile') as HTMLSelectElement;
      return {
        colTracks: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        repeatsState: /\b(Draft|Unlisted|Public)\b/i.test(summaryText),
        dateUnclipped: dateInput.scrollWidth <= dateInput.clientWidth + 2 && dateInput.getBoundingClientRect().width >= 148,
        selectUnclipped: selectEl.scrollWidth <= selectEl.clientWidth + 2,
      };
    });
    expect(detailsAudit).toEqual({ colTracks: 2, repeatsState: false, dateUnclipped: true, selectUnclipped: true });
  });

  test('UX-84: loading button full contrast + spinner and tooltip visible on hover and focus', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const loadingAudit = await page.evaluate(() => {
      const loadingBtn = document.getElementById('gal-btn-loading')!;
      return {
        loadingOpacity: getComputedStyle(loadingBtn).opacity,
        hasSpinner: Boolean(loadingBtn.querySelector('.lp-icon-spin')),
      };
    });
    expect(loadingAudit).toEqual({ loadingOpacity: '1', hasSpinner: true });

    const iconTooltip = page.locator('#gal-icon-tooltip');
    await expect(iconTooltip).toBeHidden();
    await page.locator('#gal-ibtn-ghost-focus').hover();
    await expect(iconTooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await page.locator('#gal-ibtn-ghost-focus').focus();
    await expect(iconTooltip).toBeVisible();
  });

  test('UX-82: open Menu keyboard navigation and open Dialog focus trap + Esc close', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    await page.locator('#gal-menu-copy').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#gal-menu-unlist')).toBeFocused();

    const dialog = page.locator('#gal-dialog-specimen');
    await expect(dialog).toBeVisible();
    await page.locator('#gal-dialog-confirm').focus();
    await page.keyboard.press('Tab');
    await expect(dialog.locator('[data-lp-dialog-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('UX-87: 6-state grid alignment with real EntryRow counts (0, 0, 1, 1, 2, 2), body, Details, and action bar', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    const alignmentAudit = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-main]'));
      const rects = cols.map((c) => {
        const r = c.getBoundingClientRect();
        return { state: c.getAttribute('data-state-main'), left: Math.round(r.left), width: Math.round(r.width) };
      });
      const listCols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-list]'));
      const editorsComplete = ['draft', 'error', 'unlisted', 'public'].every((st) => {
        const main = document.querySelector(`[data-state-main="${st}"]`)!;
        return (
          Boolean(main.querySelector('.lp-editor-action-bar')) &&
          Boolean(main.querySelector('textarea.lp-textarea')) &&
          Boolean(main.querySelector('details.lp-disclosure'))
        );
      });
      return {
        rects,
        listWidths: listCols.map((c) => Math.round(c.getBoundingClientRect().width)),
        rowCounts: listCols.map((c) => c.querySelectorAll('.lp-entry-row').length),
        editorsComplete,
        errorTitle: (document.querySelector('#preview-error-title') as HTMLInputElement | null)?.value ?? 'NON_EMPTY',
      };
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
  });

  test('UX-81 / UX-89: numeric contrast ratios (>= 4.5:1 text, >= 3.0:1 UI/focus, no "AA Pass"), theme toggle icon/label, and Axe', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });

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
        const textFailures: string[] = [];
        for (const sw of Array.from(document.querySelectorAll<HTMLElement>('[data-contrast-role]'))) {
          const cs = getComputedStyle(sw);
          const r = ratio(cs.color, cs.backgroundColor);
          if (r < 4.5) textFailures.push(`${sw.getAttribute('data-contrast-role')}: ${r.toFixed(2)}`);
        }
        const ratioBadges = Array.from(document.querySelectorAll<HTMLElement>('[data-contrast-value]')).map(
          (el) => el.textContent?.trim() || ''
        );
        const ctrlCs = getComputedStyle(document.querySelector<HTMLElement>('#contrast-probe-control')!);
        const toggleBtn = document.getElementById('foundations-theme-toggle')!;
        return {
          textFailures,
          allFormattedRatios: ratioBadges.length === 6 && ratioBadges.every((t) => /^\d+\.\d:1$/.test(t)),
          hasAaPass: document.body.innerText.includes('AA Pass'),
          borderRatio: ratio(ctrlCs.borderTopColor, ctrlCs.backgroundColor),
          focusRatio: ratio(ctrlCs.outlineColor, ctrlCs.backgroundColor),
          toggleLabel: toggleBtn.getAttribute('aria-label'),
          toggleHref: toggleBtn.querySelector('use')?.getAttribute('href'),
          navVisible: getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display !== 'none',
          mobileMenuHidden: getComputedStyle(document.getElementById('foundations-menu-btn')!).display === 'none',
        };
      });
      expect(themeAudit.textFailures).toEqual([]);
      expect(themeAudit.allFormattedRatios).toBe(true);
      expect(themeAudit.hasAaPass).toBe(false);
      expect(themeAudit.borderRatio).toBeGreaterThanOrEqual(3.0);
      expect(themeAudit.focusRatio).toBeGreaterThanOrEqual(3.0);
      expect(themeAudit.navVisible).toBe(true);
      expect(themeAudit.mobileMenuHidden).toBe(true);
      expect(themeAudit.toggleLabel).toBe(theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      expect(themeAudit.toggleHref).toBe(theme === 'light' ? '#lp-icon-moon' : '#lp-icon-sun');

      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    }
  });

  test('UX-88 / UX-89 (320 px): compact header <= 64 px, >= 44 px targets, 1-col Details, and auto-grow textarea', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/dev/foundations?theme=light');

    await page
      .locator('#gal-field-reading')
      .fill(Array.from({ length: 12 }, (_, i) => `Line ${i + 1}: Writing surface grows cleanly at 320px.`).join('\n'));

    const mobileAudit = await page.evaluate(() => {
      const mainTop = Math.round(document.getElementById('foundations-main')!.getBoundingClientRect().top);
      const navHidden = getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display === 'none';
      const mobileMenuVisible = getComputedStyle(document.getElementById('foundations-menu-btn')!).display !== 'none';
      const colTracks = getComputedStyle(document.querySelector<HTMLElement>('#gal-disclosure .lp-details-grid')!).gridTemplateColumns.split(' ').length;
      const ta = document.getElementById('gal-field-reading') as HTMLTextAreaElement;
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('.lp-admin-header button, #foundations-components button:not([hidden])')
      ).filter((el) => el.offsetParent !== null);
      const undersized = targets
        .map((el) => ({ id: el.id || el.className, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
        .filter((t) => t.h < 36 || t.w < 36);
      return {
        mainTop,
        navHidden,
        mobileMenuVisible,
        colTracks,
        rows: Number(ta.getAttribute('rows') || '0'),
        unclipped: ta.scrollHeight <= ta.clientHeight + 2,
        undersized,
      };
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
          await page.screenshot({ path: `${outDir}/foundations-${width}px-${theme}.png`, fullPage: true });
        }
      }
    });
  }
});
