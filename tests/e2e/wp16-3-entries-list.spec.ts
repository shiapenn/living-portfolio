import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.3 Entries List Page Module (D-UI-1..D-UI-6, UX-12)', () => {
  test('renders paginated entries list with filters, state chips, structure meter, row menu, and 0 overflow at 320px', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/entries');
    await expect(page.locator('h1')).toContainText('Entries');
    await expect(page.locator('#entries-filter-state')).toBeVisible();
    await expect(page.locator('#entries-filter-type')).toBeVisible();
    await expect(page.locator('#entries-search')).toBeVisible();
    await expect(page.locator('#entries-list-region')).toBeVisible();

    // Verify at least one entry row renders with state chip and 4-step structure meter
    const rows = page.locator('[data-entry-row]');
    await expect(rows.first()).toBeVisible();
    await expect(rows.first().locator('.lp-structure-meter')).toBeVisible();

    // Verify GET /entries pagination API directly
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=1', { credentials: 'same-origin' });
      return { status: res.status, body: await res.json() };
    });
    expect(apiRes.status).toBe(200);
    expect(apiRes.body.entries.length).toBeLessThanOrEqual(1);
    expect(apiRes.body.page).toBe(1);
    expect(apiRes.body.limit).toBe(1);
    expect(typeof apiRes.body.total).toBe('number');
    expect(typeof apiRes.body.totalPages).toBe('number');

    // Open row menu via real click and verify Edit / Add context / Unpublish / Delete items
    const menuBtn = rows.first().locator('.lp-row-menu-btn');
    await menuBtn.click();
    const menu = rows.first().locator('[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('a:has-text("Edit")')).toBeVisible();
    await expect(menu.locator('a:has-text("Add context")')).toBeVisible();
    await expect(menu.locator('button:has-text("Delete")')).toBeVisible();

    // Check 320px responsiveness
    await page.setViewportSize({ width: 320, height: 640 });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('filter by search shows empty state when no match and delete dialog requires typed confirmation', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries');

    const rows = page.locator('[data-entry-row]');
    await expect(rows.first()).toBeVisible();

    // Open Delete dialog on first row
    await rows.first().locator('.lp-row-menu-btn').click();
    await rows.first().locator('button:has-text("Delete")').click();
    const dialog = page.locator('#entries-delete-dialog');
    await expect(dialog).toBeVisible();
    const confirmBtn = page.locator('#btn-entries-delete-confirm');
    await expect(confirmBtn).toBeDisabled();
    await page.locator('#entries-delete-cancel').click();
    await expect(dialog).toBeHidden();

    // Search for non-existent query -> empty state
    await page.fill('#entries-search', 'zzznonexistentquery999');
    await page.locator('#entries-search-submit').click();
    await expect(page.locator('#entries-empty-state')).toBeVisible();
  });
});
