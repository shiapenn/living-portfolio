import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.7: Pages & Home settings (/admin/pages, /admin/settings/home)', () => {
  test('editing About creates an immutable revision; Home settings persist Featured/Recent counts and statement', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. /admin/pages: edit About and verify revision creation
    await page.goto('/admin/pages?section=about');
    await expect(page.locator('h1')).toContainText('Pages');
    await page.fill('#pages-body-md', 'Updated About section describing systems work.');
    await page.click('#btn-save-page-section');
    await expect(page.locator('#pages-revisions-list')).toContainText('Revision');
    await expect(page.locator('#pages-body-md')).toHaveValue('Updated About section describing systems work.');

    // 2. /admin/settings/home: update statement, Featured count, Recent count, and featured slugs
    await page.goto('/admin/settings/home');
    await expect(page.locator('h1')).toContainText('Home');
    await page.fill('#setting-home-statement', 'Curated systems architecture notes and experiments.');
    await page.fill('#setting-home-featured-count', '5');
    await page.fill('#setting-home-recent-count', '12');
    await page.fill('#setting-home-featured-slugs', 'cache-rewrite, edge-gateway');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    await page.reload();
    await expect(page.locator('#setting-home-statement')).toHaveValue('Curated systems architecture notes and experiments.');
    await expect(page.locator('#setting-home-featured-count')).toHaveValue('5');
    await expect(page.locator('#setting-home-recent-count')).toHaveValue('12');
    await expect(page.locator('#setting-home-featured-slugs')).toHaveValue('cache-rewrite, edge-gateway');
  });
});
