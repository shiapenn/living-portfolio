import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { SEMANTIC_LIGHT_VALUES, SEMANTIC_DARK_VALUES, PRIMITIVE_VALUES } from '../../packages/design-tokens/dist/index.js';
import { WP17_MANIFEST, seedManifestFixtures, navigateToManifestEntry } from './wp17-manifest.js';

function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function buildAllowedPalette(): Set<string> {
  const set = new Set<string>(['rgba(0, 0, 0, 0)', 'transparent', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)']);
  for (const map of [SEMANTIC_LIGHT_VALUES, SEMANTIC_DARK_VALUES, PRIMITIVE_VALUES]) {
    for (const v of Object.values(map)) {
      if (typeof v !== 'string') continue;
      if (v.startsWith('#')) {
        const rgb = hexToRgb(v);
        if (rgb) set.add(rgb);
      } else if (v.startsWith('rgb')) {
        set.add(v.replace(/\s+/g, ' ').trim());
      }
    }
  }
  return set;
}

/**
 * Generic WP-17.13 checks retained after WP-17.14 (route-named K14–K19 superseded by manifest-driven K22–K27).
 */
test.describe('WP-17.13 Generic Token Integrity Checks (K20–K21)', () => {
  test('K20: D7(a) Dark first paint — delayed/blocked theme CSS and JS-disabled dark mode show zero light surfaces', async ({ browser }) => {
    const noJsCtx = await browser.newContext({ colorScheme: 'dark', javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
    const noJsPage = await noJsCtx.newPage();
    await noJsPage.goto('/admin/login', { waitUntil: 'networkidle' });
    const noJsBg = await noJsPage.evaluate(() => ({
      htmlTheme: document.documentElement.getAttribute('data-theme'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await noJsCtx.close();
    expect(noJsBg.htmlTheme).not.toBe('light');
    expect(noJsBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(noJsBg.headerBg).toBe('rgb(22, 35, 45)');

    const blockedCtx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 800 } });
    const blockedPage = await blockedCtx.newPage();
    await blockedPage.route('**/assets/css/theme*.css', (r) => r.abort());
    await blockedPage.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const blockedBg = await blockedPage.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await blockedCtx.close();
    expect(blockedBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(blockedBg.headerBg).toBe('rgb(22, 35, 45)');

    const delayedCtx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 800 } });
    const delayedPage = await delayedCtx.newPage();
    await delayedPage.route('**/assets/css/theme*.css', async (r) => {
      await new Promise((res) => setTimeout(res, 600));
      await r.continue();
    });
    await delayedPage.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const delayedBg = await delayedPage.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headerBg: getComputedStyle(document.querySelector('header')!).backgroundColor,
    }));
    await delayedCtx.close();
    expect(delayedBg.bodyBg).toBe('rgb(15, 26, 34)');
    expect(delayedBg.headerBg).toBe('rgb(22, 35, 45)');
    console.log('=== WP-17.13 K20 PROOF ===', JSON.stringify({ noJsBg, blockedBg, delayedBg }));
  });

  test('K21: D7(b)+(c) Palette-membership census (unmatched = 0) & State Matrix gallery in light and dark', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    const allowed = Array.from(buildAllowedPalette());
    const matrixEntry = WP17_MANIFEST.find((e) => e.checkIds.includes('K25'));
    expect(matrixEntry).toBeDefined();

    let totalMeasured = 0;
    const unmatched: string[] = [];

    for (const theme of ['light', 'dark'] as const) {
      await navigateToManifestEntry(page, matrixEntry!, fixtures);
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme-switching', 'true');
        document.documentElement.setAttribute('data-theme', t);
        void document.documentElement.offsetHeight;
        document.documentElement.removeAttribute('data-theme-switching');
      }, theme);
      await expect(page.locator('#gallery-state-matrix')).toBeVisible();
      for (const group of ['Button', 'Link', 'Choice', 'Field', 'Tab', 'Item']) {
        await expect(page.locator(`#gallery-state-matrix [data-state-group="${group}"]`)).toBeVisible();
      }
      const res = await page.evaluate((palette) => {
        const set = new Set(palette);
        const bad: string[] = [];
        let measured = 0;
        const els = Array.from(document.querySelectorAll('header, header *, #gallery-state-matrix, #gallery-state-matrix *'));
        for (const el of els) {
          if (el.closest('svg')) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          for (const prop of ['color', 'backgroundColor'] as const) {
            const val = cs[prop].replace(/\s+/g, ' ').trim();
            if (!val || val === 'rgba(0, 0, 0, 0)') continue;
            measured++;
            if (!set.has(val)) bad.push(`${el.tagName}.${el.className} ${prop}=${val}`);
          }
        }
        return { measured, bad: Array.from(new Set(bad)) };
      }, allowed);
      totalMeasured += res.measured;
      for (const b of res.bad) unmatched.push(`${theme}: ${b}`);
    }

    expect(totalMeasured).toBeGreaterThan(100);
    expect(unmatched).toEqual([]);
    console.log('=== WP-17.13 K21 PROOF ===', JSON.stringify({ totalMeasured, unmatched: unmatched.length }));
  });
});
