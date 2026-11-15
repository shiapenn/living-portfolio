import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.7: Retire monolith — /admin renders Today only', () => {
  test('/admin renders Today dashboard instead of the old combined editor monolith', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    await expect(page.locator('h1')).toHaveText('Today');
    await expect(page.locator('#ref-field-title')).toHaveCount(0);
    await expect(page.locator('#ref-entry-list')).toHaveCount(0);

    await page.goto('/admin/entries');
    await expect(page.locator('h1')).toHaveText('Entries');

    await page.goto('/admin/entries/new');
    await expect(page.locator('#ref-field-title')).toBeVisible();

    await page.goto('/admin/import');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/admin/settings');
    await expect(page.locator('h1')).toBeVisible();
  });
});
