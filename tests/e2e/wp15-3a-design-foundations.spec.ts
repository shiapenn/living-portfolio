import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.3a Design Foundations Conformance (D-FOUND-1..6)', () => {
  test('enforces computed radii, borderless badges, spacing scale, SVG icon sizes, no nested bordered boxes, column alignment, contrast ratios, and 320px 44px touch targets', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/dev/foundations?theme=light');

    await expect(page.getByRole('heading', { name: 'Design Foundations Gallery' })).toBeVisible();

    // 1. D-FOUND-2: Radius tokens (8px control, 12px container, 16px overlay, 999px pill) & borderless badges
    const shapeAudit = await page.evaluate(() => {
      const checkRadius = (sel: string, expectedPx: string) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
        return els.every((el) => getComputedStyle(el).borderTopLeftRadius === expectedPx);
      };
      const badges = Array.from(document.querySelectorAll<HTMLElement>('.lp-badge'));
      const badgesBorderless = badges.every((b) => parseFloat(getComputedStyle(b).borderTopWidth) === 0);
      const badgesNonPointer = badges.every((b) => getComputedStyle(b).cursor !== 'pointer');
      const chips = Array.from(document.querySelectorAll<HTMLElement>('button.lp-chip'));
      const chipsBordered = chips.every((c) => parseFloat(getComputedStyle(c).borderTopWidth) === 1);

      return {
        controls8: checkRadius('.lp-btn, .lp-icon-btn, .lp-input', '8px'),
        containers12: checkRadius('.lp-card, .lp-notice, .lp-empty-state', '12px'),
        overlays16: checkRadius('.lp-dialog-panel, .lp-drawer-panel', '16px'),
        pills999: checkRadius('.lp-badge, .lp-chip, .lp-status-dot', '999px'),
        badgesBorderless,
        badgesNonPointer,
        chipsBordered,
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
    });

    // 2. D-FOUND-3: Spacing scale (only 0, 2, 4, 8, 12, 16, 24, 32, 48, 64 px)
    const invalidSpacings = await page.evaluate(() => {
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
      return bad;
    });
    expect(invalidSpacings).toEqual([]);

    // 3. D-FOUND-1: SVG icon sizes in {16, 20, 24}, accessible names on all icon-only controls, no filled icon buttons
    const iconAudit = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll<SVGElement>('svg.lp-icon'));
      const validSizes = icons.every((svg) => {
        const w = Math.round(svg.getBoundingClientRect().width || parseFloat(svg.getAttribute('width') || '0'));
        const h = Math.round(svg.getBoundingClientRect().height || parseFloat(svg.getAttribute('height') || '0'));
        return [16, 20, 24].includes(w) && w === h;
      });
      const iconBtns = Array.from(document.querySelectorAll<HTMLElement>('.lp-icon-btn'));
      const allNamed = iconBtns.every(
        (btn) => Boolean(btn.getAttribute('aria-label')?.trim()) && Boolean(btn.getAttribute('title')?.trim())
      );
      const noneFilled = iconBtns.every((btn) => !btn.classList.contains('lp-btn-primary') && !btn.classList.contains('lp-btn-danger'));
      return { iconCount: icons.length, validSizes, allNamed, noneFilled };
    });
    expect(iconAudit.iconCount).toBeGreaterThan(5);
    expect(iconAudit.validSizes).toBe(true);
    expect(iconAudit.allNamed).toBe(true);
    expect(iconAudit.noneFilled).toBe(true);

    // 4. D-FOUND-2: No bordered container box inside a bordered container box
    const nestedBorderedBoxes = await page.evaluate(() => {
      const isControl = (el: HTMLElement) =>
        el.matches('button, input, select, textarea, .lp-chip, .lp-badge, .lp-switch-track, .lp-status-dot');
      const hasFourSidedBorder = (el: HTMLElement) => {
        if (isControl(el)) return false;
        const cs = getComputedStyle(el);
        return (
          parseFloat(cs.borderTopWidth) > 0 &&
          parseFloat(cs.borderRightWidth) > 0 &&
          parseFloat(cs.borderBottomWidth) > 0 &&
          parseFloat(cs.borderLeftWidth) > 0
        );
      };
      const roots = Array.from(document.querySelectorAll<HTMLElement>('#foundations-components .lp-card, #foundations-layout-preview .lp-editor-canvas'));
      const violations: string[] = [];
      for (const root of roots) {
        if (!hasFourSidedBorder(root)) continue;
        const descendants = Array.from(root.querySelectorAll<HTMLElement>('*'));
        for (const d of descendants) {
          if (hasFourSidedBorder(d)) {
            violations.push(`${root.className} > ${d.tagName}.${d.className}`);
          }
        }
      }
      return violations;
    });
    expect(nestedBorderedBoxes).toEqual([]);

    // 5. D-FOUND-3 & D-FOUND-6: Identical left edge and width across all 6 states + consistent error fixture (empty title)
    const alignmentAudit = await page.evaluate(() => {
      const cols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-main]'));
      const rects = cols.map((c) => {
        const r = c.getBoundingClientRect();
        return { state: c.getAttribute('data-state-main'), left: Math.round(r.left), width: Math.round(r.width) };
      });
      const listCols = Array.from(document.querySelectorAll<HTMLElement>('#foundations-layout-preview [data-state-list]'));
      const listWidths = listCols.map((c) => Math.round(c.getBoundingClientRect().width));
      const errorTitle = (document.querySelector('#preview-error-title') as HTMLInputElement | null)?.value ?? 'NON_EMPTY';
      return { rects, listWidths, errorTitle };
    });
    expect(alignmentAudit.rects.length).toBe(6);
    const firstRect = alignmentAudit.rects[0];
    for (const r of alignmentAudit.rects) {
      expect(r.left).toBe(firstRect.left);
      expect(r.width).toBe(firstRect.width);
      expect(r.width).toBeLessThanOrEqual(720);
    }
    for (const w of alignmentAudit.listWidths) {
      expect(w).toBe(260);
    }
    expect(alignmentAudit.errorTitle).toBe('');

    // 6. D-FOUND-4: Contrast ratios >= 4.5:1 for text roles and >= 3:1 for control borders & focus in light & dark themes
    for (const theme of ['light', 'dark'] as const) {
      await page.goto(`/admin/dev/foundations?theme=${theme}`);
      const contrastAudit = await page.evaluate(() => {
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

        const ctrlProbe = document.querySelector<HTMLElement>('#contrast-probe-control')!;
        const ctrlCs = getComputedStyle(ctrlProbe);
        const borderRatio = ratio(ctrlCs.borderTopColor, ctrlCs.backgroundColor);
        const focusRatio = ratio(ctrlCs.outlineColor, ctrlCs.backgroundColor);
        return { textFailures, borderRatio, focusRatio };
      });
      expect(contrastAudit.textFailures).toEqual([]);
      expect(contrastAudit.borderRatio).toBeGreaterThanOrEqual(3.0);
      expect(contrastAudit.focusRatio).toBeGreaterThanOrEqual(3.0);

      // Axe check in both themes
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    }

    // 7. D-FOUND-3: 320px viewport compact header (content starts <= 64px) and >= 44px touch targets
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/dev/foundations?theme=light');
    const mobileAudit = await page.evaluate(() => {
      const mainEl = document.getElementById('foundations-main')!;
      const mainTop = Math.round(mainEl.getBoundingClientRect().top);
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('.lp-admin-header button, #foundations-components button:not([hidden])')
      ).filter((el) => el.offsetParent !== null);
      const undersized = targets
        .map((el) => ({ id: el.id || el.className, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
        .filter((t) => t.h < 44 || t.w < 44);
      return { mainTop, undersized };
    });
    expect(mobileAudit.mainTop).toBeLessThanOrEqual(64);
    expect(mobileAudit.undersized).toEqual([]);
  });

  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    test('captures Checkpoint 1 gallery screenshots at 1280 and 320 px in light and dark', async ({ page }) => {
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
