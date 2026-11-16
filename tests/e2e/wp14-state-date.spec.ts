import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.2: State badge and date correctness (UX-10, UX-11, UX-22, WP-15.4)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  test('1. State badge displays Draft, Public, and Unlisted across lifecycle actions (UX-10)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    const stateBadge = page.locator('#ref-visibility-menu-btn');
    await expect(stateBadge).toBeVisible();
    await expect(stateBadge).toContainText(/draft/i);

    const title = `WP-14.2 Chip Lifecycle ${uniqueSuffix}`;
    const slug = `wp-14-2-chip-${uniqueSuffix}`;

    await page.fill('#ref-field-title', title);
    await page.click('#ref-details-trigger');
    await page.fill('#ref-field-slug', slug);
    await page.keyboard.press('Escape');
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', 'Testing state badge visibility across lifecycle states.');

    // Save as draft
    await page.click('#ref-btn-save');
    await expect(page.locator('#ref-status-line')).toContainText(/draft saved/i);
    await expect(stateBadge).toContainText(/draft/i);

    // Publish to public
    await stateBadge.click();
    await page.click('#ref-btn-publish');
    await expect(page.locator('#ref-publish-dialog-status')).toContainText(/no private details/i);
    await page.click('#ref-publish-confirm');
    await expect(page.locator('#ref-status-line')).toContainText(/now public/i);
    await expect(stateBadge).toContainText(/public/i);

    // Unlist via Visibility menu (D-EDITOR-2)
    await page.click('#ref-visibility-menu-btn');
    await page.click('#ref-visibility-menu [data-vis="unlisted"]');
    await expect(page.locator('#ref-status-line')).toContainText(/unlisted/i);
    await expect(stateBadge).toContainText(/unlisted/i);
  });

  test('2. Date defaults to today and clearing the date does not throw (UX-11)', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/admin/entries/new');
    await page.click('#ref-details-trigger');

    const dateInput = page.locator('#ref-field-date');
    await expect(dateInput).toBeVisible();

    const todayYmd = new Date().toISOString().slice(0, 10);
    await expect(dateInput).toHaveValue(todayYmd);

    await dateInput.fill('');
    await dateInput.blur();
    expect(pageErrors).toHaveLength(0);
  });
});
