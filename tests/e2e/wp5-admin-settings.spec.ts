import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-5.1: Admin Operations, Calibration, Scoped Constraints & Settings Screen (20261020-UX-09)', () => {
  test('2. Admin Settings page renders routing floors, dynamic warnings, providers, theme, notifications, and backup drills', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings');

    // 1. Verify page title and header
    await expect(page.locator('h1')).toContainText('Admin Operations & System Calibration');
    await expect(page.locator('a.btn[href="/admin"]')).toBeVisible();

    // 2. Dynamic warning on Tier 1 Floor < 0.82
    const tier1Input = page.locator('#setting-tier1-floor');
    const warning = page.locator('#tier1-warning');

    // Set to 0.75 (below default 0.82)
    await tier1Input.fill('0.75');
    await tier1Input.dispatchEvent('input');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Warning: Tier 1 floor is set below the shipped default (0.82)');

    // Set to 0.85 (above default 0.82)
    await tier1Input.fill('0.85');
    await tier1Input.dispatchEvent('input');
    await expect(warning).toBeHidden();

    // Reset to 0.80 to test save with warning
    await tier1Input.fill('0.80');
    await tier1Input.dispatchEvent('input');
    await page.click('#btn-save-routing');
    await expect(page.locator('#settings-status-banner')).toContainText('Routing & Calibration saved successfully');

    // 3. Provider Registry & Degradation Mode
    await expect(page.locator('#providers-heading')).toBeVisible();
    await page.selectOption('#setting-degradation-mode', 'extractive');
    await page.click('#btn-save-degradation');
    await expect(page.locator('#settings-status-banner')).toContainText('Degradation mode updated to extractive');

    // Restore to normal
    await page.selectOption('#setting-degradation-mode', 'normal');
    await page.click('#btn-save-degradation');
    await expect(page.locator('#settings-status-banner')).toContainText('Degradation mode updated to normal');

    // 4. Notification Channel Test (Honest 501 Not Implemented)
    await expect(page.locator('#chip-notify-status')).toContainText('not_configured');
    await page.click('#btn-test-notification');
    await expect(page.locator('#notify-test-result')).toContainText('501 Not Implemented');
    await expect(page.locator('#notify-test-result')).toContainText('Notification channel delivery adapter is not yet implemented');

    // 5. Encrypted Backup Drill (Honest 501 Not Implemented)
    await expect(page.locator('#chip-backup-status')).toContainText('not_configured');
    await page.click('#btn-run-backup-drill');
    await expect(page.locator('#backup-drill-result')).toContainText('501 Not Implemented');
    await expect(page.locator('#backup-drill-result')).toContainText('restore verification are not yet implemented');
  });
});
