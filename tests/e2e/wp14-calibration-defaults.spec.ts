import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.5: Calibration defaults and mechanism gates (UX-08, Spec §11)', () => {
  test('1. Replaces Freeze checkbox with mechanism switches and shows gates when enabled', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings');

    // Single "Freeze Calibration" checkbox must be gone (UX-08)
    await expect(page.locator('#setting-calibration-frozen')).toHaveCount(0);

    // Four mechanism switches must exist
    const suggestionSwitch = page.locator('#setting-mech-suggestion-thresholds');
    const routingSwitch = page.locator('#setting-mech-routing-calibration');
    const topologySwitch = page.locator('#setting-mech-topology-audit');
    const scopedSwitch = page.locator('#setting-mech-scoped-constraints');

    await expect(suggestionSwitch).toBeVisible();
    await expect(routingSwitch).toBeVisible();
    await expect(topologySwitch).toBeVisible();
    await expect(scopedSwitch).toBeVisible();

    // Spec §11 defaults: suggestion and routing are OFF; topology and scoped constraints are ON (proposal-only)
    expect(await suggestionSwitch.isChecked()).toBe(false);
    expect(await routingSwitch.isChecked()).toBe(false);
    expect(await topologySwitch.isChecked()).toBe(true);
    expect(await scopedSwitch.isChecked()).toBe(true);

    // Each displays minimum-sample gate and step limit
    const suggestionGate = page.locator('#gate-info-suggestion-thresholds');
    await expect(suggestionGate).toBeVisible();
    await expect(suggestionGate).toContainText(/20/);
    await expect(suggestionGate).toContainText(/0\.05/);

    const routingGate = page.locator('#gate-info-routing-calibration');
    await expect(routingGate).toBeVisible();
    await expect(routingGate).toContainText(/20/);
    await expect(routingGate).toContainText(/0\.05/);

    const topologyGate = page.locator('#gate-info-topology-audit');
    await expect(topologyGate).toBeVisible();
    await expect(topologyGate).toContainText(/proposal/i);

    const scopedGate = page.locator('#gate-info-scoped-constraints');
    await expect(scopedGate).toBeVisible();
    await expect(scopedGate).toContainText(/proposal/i);

    // Enabling a parameter mechanism dynamically highlights/displays its gate and allows saving
    await suggestionSwitch.check();
    expect(await suggestionSwitch.isChecked()).toBe(true);
    await expect(suggestionGate).toBeVisible();

    await page.click('#btn-save-routing');
    await expect(page.locator('#settings-status-banner')).toContainText(/saved successfully/i);

    // Reload page to verify persistence
    await page.reload();
    const reloadedSuggestion = page.locator('#setting-mech-suggestion-thresholds');
    await expect(reloadedSuggestion).toBeVisible();
    expect(await reloadedSuggestion.isChecked()).toBe(true);
  });
});
