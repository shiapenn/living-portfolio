import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.L L1: Shell Launcher, Settings Split & Section Display', () => {
  test('launcher opens, supports arrow keys and Esc focus return, and settings modules open individually', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const trigger = page.locator('#lp-launcher-btn');
    const panel = page.locator('#lp-launcher-panel');
    await expect(trigger).toBeVisible();
    await expect(panel).toBeHidden();

    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('a[aria-current="page"]')).toContainText('Today');

    await page.keyboard.press('ArrowDown');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focusedText).toBe('Entries');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    const isTriggerFocused = await page.evaluate(() => document.activeElement?.id === 'lp-launcher-btn');
    expect(isTriggerFocused).toBe(true);

    // Settings index & module route
    await page.goto('/admin/settings');
    await expect(page.locator('#settings-row-answering')).toBeVisible();
    await expect(page.locator('#settings-row-providers')).toBeVisible();
    await expect(page.locator('#settings-row-appearance')).toBeVisible();
    await expect(page.locator('#settings-row-notifications')).toBeVisible();
    await expect(page.locator('#settings-row-backups')).toBeVisible();

    await page.click('#settings-row-answering');
    await expect(page).toHaveURL(/\/admin\/settings\/answering$/);
    await expect(page.locator('h1')).toContainText('Answering');
    await expect(page.locator('#btn-save-settings-module')).toBeVisible();
  });

  test('editor type picker is grouped by section and Publish dialog shows target section URL', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    const workGroup = page.locator('#ref-field-profile optgroup[label="Work"]');
    const writingGroup = page.locator('#ref-field-profile optgroup[label="Writing"]');
    await expect(workGroup).toHaveCount(1);
    await expect(writingGroup).toHaveCount(1);

    await page.click('#ref-visibility-menu-btn');
    await page.click('#ref-btn-publish');
    await expect(page.locator('#ref-publish-section-target')).toContainText(/Will appear in (Work|Writing) at \/(work|writing)\//);
  });
});
