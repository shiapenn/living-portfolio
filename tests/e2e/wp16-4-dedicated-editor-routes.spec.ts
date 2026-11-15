import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.4 Dedicated Editor Routes & Mobile Layout (UX-92, UX-93)', () => {
  test('/admin/entries/new labels placeholder "New, unsaved", excludes it from #ref-entries-count, and 320px editor title is within 400px of top', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/entries/new');
    await expect(page.locator('#ref-field-title')).toBeVisible();
    await expect(page.locator('#ref-field-title')).toHaveValue('');

    // Placeholder must say "New, unsaved" and NOT "Untitled entry"
    const placeholderRow = page.locator('[data-entry-row="new"]');
    await expect(placeholderRow).toContainText('New, unsaved');
    await expect(placeholderRow).not.toContainText('Untitled entry');

    // Saved count excludes the unsaved "new" placeholder
    const savedRowCount = await page.locator('[data-entry-row]:not([data-entry-row="new"])').count();
    await expect(page.locator('#ref-entries-count')).toHaveText(String(savedRowCount));

    // At 320px, editor comes first and #ref-field-title is within 400px of the top
    await page.setViewportSize({ width: 320, height: 640 });
    const titleBox = await page.locator('#ref-field-title').boundingBox();
    expect(titleBox).toBeTruthy();
    expect(titleBox!.y).toBeLessThan(400);
  });

  test('/admin/entries/:id loads that exact entry and returns 404 for unknown id', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // Fetch list of real entry IDs
    const entries = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
      const data = await res.json();
      return data.entries || [];
    });
    expect(entries.length).toBeGreaterThan(0);

    const target = entries[entries.length - 1];
    await page.goto(`/admin/entries/${encodeURIComponent(target.id)}`);
    await expect(page.locator('#ref-field-title')).toHaveValue(target.title);

    // Unknown ID must return 404 (not default to first entry)
    const missingRes = await page.goto('/admin/entries/nonexistent-entry-id-99999');
    expect(missingRes?.status()).toBe(404);
  });

  test('320px Entries (n) toggle expands entry list and unsaved-change guard protects link navigation', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/entries/new');

    const toggleBtn = page.locator('#ref-sidebar-toggle');
    const entryList = page.locator('#ref-entry-list');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(entryList).toBeHidden();

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(entryList).toBeVisible();

    // Dirty the draft and verify link click triggers confirm guard and stays on page when dismissed
    await page.fill('#ref-field-title', 'Unsaved dedicated route draft');
    page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await page.locator('[data-entry-row]:not([data-entry-row="new"])').first().click();
    await expect(page).toHaveURL(/\/admin\/entries\/new$/);
  });
});
