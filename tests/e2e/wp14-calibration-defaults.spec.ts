import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.5: Calibration defaults and mechanism gates (UX-08, Spec §11)', () => {
  test('1. Replaces Freeze checkbox with mechanism switches and shows gates when enabled', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/answering');

    await expect(page.locator('#setting-calibration-frozen')).toHaveCount(0);

    const suggestionSwitch = page.locator('#setting-mech-suggestion-thresholds');
    const routingSwitch = page.locator('#setting-mech-routing-calibration');
    const topologySwitch = page.locator('#setting-mech-topology-audit');
    const scopedSwitch = page.locator('#setting-mech-scoped-constraints');

    await expect(suggestionSwitch).toBeVisible();
    await expect(routingSwitch).toBeVisible();
    await expect(topologySwitch).toBeVisible();
    await expect(scopedSwitch).toBeVisible();

    expect(await suggestionSwitch.isChecked()).toBe(false);
    expect(await routingSwitch.isChecked()).toBe(false);
    expect(await topologySwitch.isChecked()).toBe(true);
    expect(await scopedSwitch.isChecked()).toBe(true);

    await suggestionSwitch.check();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText(/saved/i);

    await page.reload();
    expect(await page.locator('#setting-mech-suggestion-thresholds').isChecked()).toBe(true);

    await page.locator('#setting-mech-suggestion-thresholds').uncheck();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText(/saved/i);
  });
});
