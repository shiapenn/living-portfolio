import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.8: Appearance v2 (/admin/settings/appearance & /admin/theme)', () => {
  test('Selectable packs, live preview, AA contrast rejection, admin theme.<hash>.css, public scope persistence without restyle, and JSON import/export', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. Both /admin/theme and /admin/settings/appearance render Appearance v2
    await page.goto('/admin/theme');
    await expect(page.locator('h1')).toContainText('Appearance');
    await expect(page.locator('#appearance-live-preview')).toBeVisible();
    await expect(page.locator('#theme-conformance-box')).toContainText('WCAG AA passed');

    // 2. Reject low-contrast accent (WCAG AA gate)
    await page.fill('#setting-theme-light-accent', '#CCCCCC');
    await expect(page.locator('#theme-conformance-box')).toContainText('WCAG AA failed');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('4.5:1');

    // 3. Select built-in pack "Warm ink" for Admin scope -> saves & delivers cacheable theme.<hash>.css
    await page.selectOption('#setting-theme-pack', 'warm-ink');
    await expect(page.locator('#theme-conformance-box')).toContainText('WCAG AA passed');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved admin appearance');

    const themeLinkHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map((l) => l.getAttribute('href') || '').find((h) => /\/assets\/css\/theme\.[0-9a-f]{10}\.css$/.test(h)) || '';
    });
    expect(themeLinkHref).toMatch(/^\/assets\/css\/theme\.[0-9a-f]{10}\.css$/);

    const cssRes = await page.request.get(themeLinkHref);
    expect(cssRes.status()).toBe(200);
    expect(cssRes.headers()['cache-control']).toContain('immutable');
    const cssText = await cssRes.text();
    expect(cssText).toContain('@layer user-theme');
    expect(cssText).toContain('--lp-core-accent-600: #9A3412;');

    // 4. Export pack JSON & reject arbitrary CSS on import
    await page.click('#btn-export-theme-pack');
    const exportedJson = await page.locator('#setting-theme-import-json').inputValue();
    const parsedExport = JSON.parse(exportedJson);
    expect(parsedExport.version).toBe(2);
    expect(parsedExport.packId).toBe('warm-ink');

    await page.fill('#setting-theme-import-json', JSON.stringify({ ...parsedExport, customCss: 'body{display:none}' }));
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#settings-status-banner')).toContainText('customCss');

    // 5. Public scope saves & validates, without restyling public pages
    await page.selectOption('#setting-appearance-scope', 'public');
    await page.selectOption('#setting-theme-pack', 'high-contrast');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved public appearance');

    const publicRes = await page.request.get('/home');
    expect(publicRes.status()).toBe(200);
    const publicHtml = await publicRes.text();
    expect(publicHtml).not.toContain('theme.');

    // 6. Restore Admin scope to quiet-default (zero-cost default accent fallback)
    await page.selectOption('#setting-appearance-scope', 'admin');
    await page.selectOption('#setting-theme-pack', 'quiet-default');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved admin appearance');
  });
});
