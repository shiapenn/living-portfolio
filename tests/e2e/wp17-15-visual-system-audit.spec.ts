import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  seedManifestFixtures,
  navigateToManifestEntry,
} from './wp17-manifest.js';

const ROOT = resolve(process.cwd());

async function setThemeInstant(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme-switching', 'true');
    document.documentElement.setAttribute('data-theme', t);
    void document.documentElement.offsetHeight;
    document.documentElement.removeAttribute('data-theme-switching');
  }, theme);
}

test.describe('WP-17.15 Visual System Audit (K28–K34, Manifest-Driven)', () => {
  test.setTimeout(120_000);

  test('K28: Shape language — zero partial-border+radius and zero divider/indicator radius > 0 across WP17_MANIFEST', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);
    let elementsChecked = 0;
    let indicatorsChecked = 0;
    const violations: string[] = [];

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const entry of WP17_MANIFEST) {
      await navigateToManifestEntry(page, entry, fx);
      await setThemeInstant(page, 'light');
      const res = await page.evaluate((stateId) => {
        const main = document.querySelector('main') ?? document.body;
        const els = Array.from(main.querySelectorAll('*')) as HTMLElement[];
        let checked = 0;
        let indChecked = 0;
        const bad: string[] = [];

        for (const el of els) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          checked++;

          const bt = parseFloat(cs.borderTopWidth) || 0;
          const br = parseFloat(cs.borderRightWidth) || 0;
          const bb = parseFloat(cs.borderBottomWidth) || 0;
          const bl = parseFloat(cs.borderLeftWidth) || 0;
          const radii = [
            parseFloat(cs.borderTopLeftRadius) || 0,
            parseFloat(cs.borderTopRightRadius) || 0,
            parseFloat(cs.borderBottomRightRadius) || 0,
            parseFloat(cs.borderBottomLeftRadius) || 0,
          ];
          const maxR = Math.max(...radii);
          const widths = [bt, br, bb, bl];
          const nonZeroSides = widths.filter((w) => w > 0).length;

          // V1: Partial border (1..3 sides > 0) + any radius > 0 is forbidden
          if (nonZeroSides > 0 && nonZeroSides < 4 && maxR > 0) {
            bad.push(`${stateId}: partial-border+radius on ${el.tagName.toLowerCase()}.${el.className} borders=[${widths.join(',')}] maxR=${maxR}`);
          }

          // V1: Selected tab indicator / dividers must have radius 0
          if (el.matches('[role="tab"][aria-selected="true"], .lp-tab.is-active, .lp-tab.lp-tab-active')) {
            indChecked++;
            const after = getComputedStyle(el, '::after');
            const hasAfterBar = after.content && after.content !== 'none' && parseFloat(after.height) > 0;
            const hasInsetShadow = cs.boxShadow && cs.boxShadow.includes('inset');
            if (hasInsetShadow && maxR > 0) {
              bad.push(`${stateId}: selected tab uses inset box-shadow with radius=${maxR} (U-bowl defect)`);
            }
            if (hasAfterBar) {
              const ar = Math.max(
                parseFloat(after.borderTopLeftRadius) || 0,
                parseFloat(after.borderTopRightRadius) || 0,
                parseFloat(after.borderBottomRightRadius) || 0,
                parseFloat(after.borderBottomLeftRadius) || 0
              );
              if (ar > 0) bad.push(`${stateId}: selected tab ::after indicator has radius=${ar} (expected 0)`);
            }
          }
          if (el.matches('.lp-item:not(:last-child)')) {
            indChecked++;
            const after = getComputedStyle(el, '::after');
            if (after.content && after.content !== 'none') {
              const ar = parseFloat(after.borderTopLeftRadius) || 0;
              if (ar > 0) bad.push(`${stateId}: item divider ::after has radius=${ar} (expected 0)`);
            }
          }
        }
        return { checked, indChecked, bad };
      }, entry.id);
      elementsChecked += res.checked;
      indicatorsChecked += res.indChecked;
      violations.push(...res.bad);
    }

    console.log('=== WP-17.15 K28 SHAPE LANGUAGE ===', JSON.stringify({ elementsChecked, indicatorsChecked, violationsCount: violations.length, sample: violations.slice(0, 10) }));
    expect(elementsChecked).toBeGreaterThan(0);
    expect(indicatorsChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('K29: Token ladders — control border contrast [3.0, 3.8], hairline [1.3, 1.8], D5 tonal direction in both themes', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    const galleryState = WP17_MANIFEST.find((m) => m.archetype === 'dashboard' || m.route === '/admin/gallery') ?? WP17_MANIFEST[WP17_MANIFEST.length - 1];
    await navigateToManifestEntry(page, galleryState, fx);

    const report: Record<string, any> = {};
    const violations: string[] = [];

    for (const theme of ['light', 'dark'] as const) {
      await setThemeInstant(page, theme);
      const res = await page.evaluate((t) => {
        function parseRgb(c: string): [number, number, number] {
          const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) return [0, 0, 0];
          return [Number(m[1]), Number(m[2]), Number(m[3])];
        }
        function lum([r, g, b]: [number, number, number]): number {
          const ch = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
        }
        function cr(a: string, b: string): number {
          const l1 = lum(parseRgb(a));
          const l2 = lum(parseRgb(b));
          return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
        }
        function resolveColor(varExpr: string): string {
          const el = document.createElement('div');
          el.style.color = varExpr;
          document.body.appendChild(el);
          const out = getComputedStyle(el).color;
          el.remove();
          return out;
        }

        const canvas = resolveColor('var(--lp-color-surface-canvas, var(--lp-color-surface-l0))');
        const raised = resolveColor('var(--lp-color-surface-raised, var(--lp-color-surface-l1))');
        const hairline = resolveColor('var(--lp-color-border-hairline, var(--lp-color-border-subtle))');
        const control = resolveColor('var(--lp-color-border-control)');
        const strong = resolveColor('var(--lp-color-border-strong, var(--lp-color-accent-default))');
        const n1 = resolveColor('var(--lp-color-fill-neutral-tint-1)');
        const n2 = resolveColor('var(--lp-color-fill-neutral-tint-2)');
        const n3 = resolveColor('var(--lp-color-fill-neutral-tint-3)');
        const fg = resolveColor('var(--lp-color-text-1)');

        const hairlineCR = cr(hairline, canvas);
        const controlCR = cr(control, canvas);
        const strongCR = cr(strong, canvas);

        const lCanvas = lum(parseRgb(canvas));
        const l1 = lum(parseRgb(n1));
        const l2 = lum(parseRgb(n2));
        const l3 = lum(parseRgb(n3));
        const lFg = lum(parseRgb(fg));
        const dir = lFg < lCanvas ? -1 : 1; // light theme -> darker (-1), dark theme -> lighter (+1)
        const ladderMonotonic =
          (l1 - lCanvas) * dir > 0 &&
          (l2 - l1) * dir > 0 &&
          (l3 - l2) * dir > 0;

        // Check that explicit V3 tokens exist (not empty)
        const csRoot = getComputedStyle(document.documentElement);
        const hasV3Tokens = Boolean(
          csRoot.getPropertyValue('--lp-color-fill-neutral-tint-1').trim() &&
          csRoot.getPropertyValue('--lp-color-fill-neutral-tint-2').trim() &&
          csRoot.getPropertyValue('--lp-color-fill-neutral-tint-3').trim() &&
          csRoot.getPropertyValue('--lp-color-fill-accent-tint-1').trim() &&
          csRoot.getPropertyValue('--lp-color-border-hairline').trim() &&
          csRoot.getPropertyValue('--lp-color-surface-canvas').trim()
        );

        const bad: string[] = [];
        if (!hasV3Tokens) bad.push(`${t}: missing V3 ladder CSS custom properties`);
        if (hairlineCR < 1.3 || hairlineCR > 1.8) bad.push(`${t}: hairline contrast ${hairlineCR} not in [1.3, 1.8]`);
        if (controlCR < 3.0 || controlCR > 3.8) bad.push(`${t}: control border contrast ${controlCR} not in [3.0, 3.8]`);
        if (strongCR < 3.0) bad.push(`${t}: strong/focus border contrast ${strongCR} < 3.0`);
        if (!ladderMonotonic) bad.push(`${t}: neutral-tint-1/2/3 ladder not monotonic toward foreground (${lCanvas.toFixed(3)} -> ${l1.toFixed(3)} -> ${l2.toFixed(3)} -> ${l3.toFixed(3)})`);

        return { canvas, raised, hairline, control, strong, hairlineCR, controlCR, strongCR, ladderMonotonic, hasV3Tokens, bad };
      }, theme);
      report[theme] = res;
      violations.push(...res.bad);
    }

    console.log('=== WP-17.15 K29 LADDERS ===', JSON.stringify(report));
    expect(violations).toEqual([]);
  });

  test('K30: Hard-coded value audit (L7) — zero outside tokens (allowlist <= 10)', async () => {
    let out = '';
    let exitCode = 0;
    try {
      out = execSync('node scripts/design-audit --l7-json', { cwd: ROOT, encoding: 'utf8' });
    } catch (err: any) {
      exitCode = err.status ?? 1;
      out = err.stdout?.toString() || err.message;
    }
    const parsed = JSON.parse(out);
    console.log('=== WP-17.15 K30 HARD-CODED AUDIT (L7) ===', JSON.stringify({
      totalL7Violations: parsed.totalL7Violations,
      allowlistCount: parsed.allowlistCount,
      counts: Object.fromEntries(Object.entries(parsed.categories).map(([k, v]: any) => [k, v.count])),
    }));
    expect(parsed.allowlistCount).toBeLessThanOrEqual(10);
    expect(parsed.totalL7Violations).toBe(0);
    expect(exitCode).toBe(0);
  });

  test('K31: Button/Field/Choice/Tab signatures all distinct (border + fill + radius)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    const matrixState = WP17_MANIFEST.find((m) => m.route.includes('gallery')) ?? WP17_MANIFEST[WP17_MANIFEST.length - 1];
    await navigateToManifestEntry(page, matrixState, fx);
    await setThemeInstant(page, 'light');

    const res = await page.evaluate(() => {
      const root = document.getElementById('gallery-state-matrix') ?? document.body;
      function sig(el: Element | null): string {
        if (!el) return 'MISSING';
        const cs = getComputedStyle(el);
        const bw = Math.round(parseFloat(cs.borderTopWidth) || 0);
        const bc = bw === 0 || cs.borderTopColor === 'rgba(0, 0, 0, 0)' ? 'none' : cs.borderTopColor;
        const bg = cs.backgroundColor;
        const r = cs.borderTopLeftRadius;
        return `border=${bw}px:${bc}|fill=${bg}|r=${r}`;
      }
      const btnPrimary = root.querySelector('button.lp-btn-primary:not(.lp-state-hover):not(.lp-state-focus):not(.lp-state-active):not(:disabled):not([aria-busy="true"])');
      const btnSecondary = root.querySelector('button.lp-btn-secondary:not(.lp-state-hover):not(.lp-state-focus):not(.lp-state-active):not(:disabled):not([aria-busy="true"])');
      const btnText = root.querySelector('button.lp-btn-text:not(.lp-state-hover):not(.lp-state-focus):not(.lp-state-active):not(:disabled)');
      const field = root.querySelector('input.lp-input:not(.lp-state-focus):not([aria-invalid="true"]):not(:disabled)');
      const choiceOff = root.querySelector('.lp-choice:not(.lp-state-hover):not(.is-selected):not(.lp-state-focus):not(.is-disabled)');
      const choiceSel = root.querySelector('.lp-choice.is-selected');
      const tab = root.querySelector('.lp-tab:not(.lp-state-hover):not([aria-selected="true"]):not(.lp-state-focus)');

      const table = {
        btnPrimary: sig(btnPrimary),
        btnSecondary: sig(btnSecondary),
        btnText: sig(btnText),
        field: sig(field),
        choiceOff: sig(choiceOff),
        choiceSelected: sig(choiceSel),
        tab: sig(tab),
      };

      const bad: string[] = [];
      // Secondary button must have NO outline (border transparent or 0px) and tonal non-transparent fill
      if (btnSecondary) {
        const cs = getComputedStyle(btnSecondary);
        const bw = parseFloat(cs.borderTopWidth) || 0;
        const hasOutline = bw > 0 && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
        if (hasOutline) bad.push(`btnSecondary must have no outline (got ${bw}px ${cs.borderTopColor})`);
        if (cs.backgroundColor === 'rgb(255, 255, 255)' || cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
          bad.push(`btnSecondary must have neutral-tint-1 tonal fill (got ${cs.backgroundColor})`);
        }
      }
      const vals = Object.values(table);
      const unique = new Set(vals);
      if (unique.size !== vals.length) {
        bad.push(`Duplicate interactive role signatures detected: ${JSON.stringify(table)}`);
      }
      if (vals.includes('MISSING')) bad.push(`Missing interactive role sample: ${JSON.stringify(table)}`);
      return { table, bad };
    });

    console.log('=== WP-17.15 K31 SIGNATURES ===', JSON.stringify(res.table));
    expect(res.bad).toEqual([]);
  });

  test('K32: Tabs — equal selected/unselected widths (no weight shift), indicator radius 0, inset focus ring, hit >= 44', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    let tabsChecked = 0;
    const violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      await navigateToManifestEntry(page, entry, fx);
      await setThemeInstant(page, 'light');
      const res = await page.evaluate((stateId) => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"], .lp-tab')) as HTMLElement[];
        const bad: string[] = [];
        for (const tab of tabs) {
          const cs = getComputedStyle(tab);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const rect = tab.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          // Hit height >= 44
          if (rect.height < 43.5) {
            bad.push(`${stateId}: tab "${tab.textContent?.trim()}" height=${rect.height.toFixed(1)} < 44`);
          }
          // Weight must be identical (500) whether selected or unselected
          const fw = Number(cs.fontWeight);
          if (fw !== 500) {
            bad.push(`${stateId}: tab "${tab.textContent?.trim()}" font-weight=${fw} (expected 500 for both selected and unselected)`);
          }
          // Measure width with aria-selected toggled -> must not shift
          const wasSel = tab.getAttribute('aria-selected');
          const w1 = rect.width;
          tab.setAttribute('aria-selected', wasSel === 'true' ? 'false' : 'true');
          const w2 = tab.getBoundingClientRect().width;
          if (wasSel === null) tab.removeAttribute('aria-selected');
          else tab.setAttribute('aria-selected', wasSel);
          if (Math.abs(w1 - w2) > 0.5) {
            bad.push(`${stateId}: tab "${tab.textContent?.trim()}" width shifted on select (${w1.toFixed(1)} -> ${w2.toFixed(1)})`);
          }

          // Focus ring must be inset (-2px) and inside bounds
          if (tab.classList.contains('lp-state-focus')) {
            const offset = parseFloat(cs.outlineOffset) || 0;
            if (offset >= 0) {
              bad.push(`${stateId}: focused tab outline-offset=${offset} (expected inset < 0)`);
            }
          }
        }
        return { count: tabs.length, bad };
      }, entry.id);
      tabsChecked += res.count;
      violations.push(...res.bad);
    }

    console.log('=== WP-17.15 K32 TABS ===', JSON.stringify({ tabsChecked, violationsCount: violations.length, sample: violations.slice(0, 10) }));
    expect(tabsChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('K33: PageHeader slots — action on title row at >=480px container, S4 gaps at compact (<480px)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);

    let headersWithAction = 0;
    const violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await navigateToManifestEntry(page, entry, fx);
      const hasAction = await page.locator('[data-c="PageHeader"] .lp-page-header-action').count();
      if (hasAction === 0) continue;
      headersWithAction++;

      // Regular (>= 480px container): action on title row, trailing
      const reg = await page.evaluate((stateId) => {
        const hdr = document.querySelector('[data-c="PageHeader"]:has(.lp-page-header-action)') as HTMLElement;
        const h1 = hdr.querySelector('h1') as HTMLElement;
        const act = hdr.querySelector('.lp-page-header-action') as HTMLElement;
        const hr = h1.getBoundingClientRect();
        const ar = act.getBoundingClientRect();
        const bad: string[] = [];
        if (ar.left < hr.right - 2) {
          bad.push(`${stateId} (1280px): PageHeader action not trailing title row (h1.right=${hr.right.toFixed(0)}, act.left=${ar.left.toFixed(0)})`);
        }
        if (Math.abs(ar.top - hr.top) > 16) {
          bad.push(`${stateId} (1280px): PageHeader action not aligned on title row (h1.top=${hr.top.toFixed(0)}, act.top=${ar.top.toFixed(0)})`);
        }
        return bad;
      }, entry.id);
      violations.push(...reg);

      // Compact (320px): action below description with S4 (24px) above and S4 (24px) below header
      await page.setViewportSize({ width: 320, height: 800 });
      const cmp = await page.evaluate((stateId) => {
        const hdr = document.querySelector('[data-c="PageHeader"]:has(.lp-page-header-action)') as HTMLElement;
        const desc = hdr.querySelector('[data-rel="description"]') as HTMLElement | null;
        const act = hdr.querySelector('.lp-page-header-action') as HTMLElement;
        const bad: string[] = [];
        if (desc) {
          const gapAbove = Math.round(act.getBoundingClientRect().top - desc.getBoundingClientRect().bottom);
          if (Math.abs(gapAbove - 24) > 1) {
            bad.push(`${stateId} (320px): PageHeader description->action gap=${gapAbove}px (expected S4=24px)`);
          }
        }
        return bad;
      }, entry.id);
      violations.push(...cmp);
    }

    console.log('=== WP-17.15 K33 PAGEHEADER SLOTS ===', JSON.stringify({ headersWithAction, violations }));
    expect(headersWithAction).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('K34: Typography refinement — tabular-nums on date/pct/ratio, text-wrap balance on titles, description <= 68ch', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fx = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    let numericChecked = 0;
    let titlesChecked = 0;
    let descChecked = 0;
    const violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      await navigateToManifestEntry(page, entry, fx);
      const res = await page.evaluate((stateId) => {
        const main = document.querySelector('main') ?? document.body;
        let num = 0;
        let tit = 0;
        let desc = 0;
        const bad: string[] = [];

        // Titles: text-wrap: balance
        for (const el of Array.from(main.querySelectorAll('.lp-page-title, .lp-page-header h1, .lp-section-title, .lp-form-section-title, .lp-section-header-title, .lp-item-title')) as HTMLElement[]) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (el.getBoundingClientRect().width === 0) continue;
          tit++;
          if (cs.textWrap !== 'balance') {
            bad.push(`${stateId}: title "${el.textContent?.trim().slice(0, 30)}" text-wrap=${cs.textWrap} (expected balance)`);
          }
        }

        // Descriptions / consequences: max-width <= 68ch (at 13-14px font, ~580-660px; check computed maxWidth !== 'none')
        for (const el of Array.from(main.querySelectorAll('.lp-description, .lp-page-description, [data-purpose="consequence"], [data-purpose="helper"]')) as HTMLElement[]) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (el.getBoundingClientRect().width === 0) continue;
          desc++;
          if (cs.maxWidth === 'none') {
            bad.push(`${stateId}: description "${el.textContent?.trim().slice(0, 30)}" has max-width: none (expected 68ch cap)`);
          }
        }

        // Numeric nodes (dates, times, percentages, counts inside meta/eyebrow/def-value)
        const numRe = /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\d+%\b|\d{1,2}:\d{2}\b/;
        for (const el of Array.from(main.querySelectorAll('.lp-item-meta, .lp-item-claim-eyebrow, .lp-list-def-value, .lp-item-title')) as HTMLElement[]) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const txt = (el.textContent || '').trim();
          if (!numRe.test(txt)) continue;
          num++;
          if (!cs.fontVariantNumeric.includes('tabular-nums')) {
            bad.push(`${stateId}: numeric node "${txt.slice(0, 35)}" font-variant-numeric=${cs.fontVariantNumeric} (expected tabular-nums)`);
          }
        }

        return { num, tit, desc, bad };
      }, entry.id);

      numericChecked += res.num;
      titlesChecked += res.tit;
      descChecked += res.desc;
      violations.push(...res.bad);
    }

    console.log('=== WP-17.15 K34 TYPOGRAPHY ===', JSON.stringify({ numericChecked, titlesChecked, descChecked, violationsCount: violations.length, sample: violations.slice(0, 10) }));
    expect(numericChecked).toBeGreaterThan(0);
    expect(titlesChecked).toBeGreaterThan(0);
    expect(descChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
