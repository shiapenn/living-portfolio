import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-5.1: Admin Operations, Calibration, Scoped Constraints & Settings Screen (20261020-UX-09)', () => {
  test('2. Admin Settings index and modules render routing floors, dynamic warnings, providers, notifications, and backup drills', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings');

    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('#settings-row-answering')).toBeVisible();
    await expect(page.locator('#settings-row-providers')).toBeVisible();
    await expect(page.locator('#settings-row-appearance')).toBeVisible();
    await expect(page.locator('#settings-row-notifications')).toBeVisible();
    await expect(page.locator('#settings-row-backups')).toBeVisible();

    // Answering module: dynamic warning & save
    await page.goto('/admin/settings/answering');
    const tier1Input = page.locator('#setting-tier1-floor');
    const warning = page.locator('#tier1-warning');

    await tier1Input.fill('0.75');
    await tier1Input.dispatchEvent('input');
    await expect(warning).toBeVisible();

    await tier1Input.fill('0.85');
    await tier1Input.dispatchEvent('input');
    await expect(warning).toBeHidden();

    await tier1Input.fill('0.82');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    // Providers module
    await page.goto('/admin/settings/providers');
    await page.selectOption('#setting-degradation-mode', 'force_extractive');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');
    await page.selectOption('#setting-degradation-mode', 'normal');
    await page.click('#btn-save-settings-module');

    // Notifications module (honest 501)
    await page.goto('/admin/settings/notifications');
    await page.click('#btn-test-notification');
    await expect(page.locator('#notify-test-result')).toContainText('not enabled');

    // Backups module (honest 501)
    await page.goto('/admin/settings/backups');
    await page.click('#btn-run-backup-drill');
    await expect(page.locator('#backup-drill-result')).toContainText('not enabled');
  });
});
