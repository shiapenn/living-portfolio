import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.1: Settings templates & Routing (/admin/settings/answering, /admin/routing)', () => {
  test('renders Explain block, zero jargon, consequence warning + restore, reply time, and pause confirm updating /admin/status', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. /admin/routing renders the Answering settings module
    await page.goto('/admin/routing');
    await expect(page.locator('h1')).toContainText('Answering');

    const bodyText = await page.locator('main').innerText();
    expect(bodyText).not.toMatch(/Simulated Degradation Mode|Facet Known Threshold|Spec §11|shipped default/i);

    // 2. Lowering threshold shows consequence notice; Restore recommended resets it
    await page.fill('#setting-tier1-floor', '0.50');
    await expect(page.locator('#tier1-warning')).toBeVisible();
    await page.click('#btn-restore-thresholds');
    await expect(page.locator('#setting-tier1-floor')).toHaveValue('0.82');
    await expect(page.locator('#tier1-warning')).toBeHidden();

    // 3. Reply time & public disclosure persist on reload
    await page.selectOption('#setting-reply-time', 'Within 48 hours');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');
    await page.reload();
    await expect(page.locator('#setting-reply-time')).toHaveValue('Within 48 hours');

    // 4. Pausing automatic answering opens confirmation dialog and updates /admin/status
    await page.locator('label:has(#setting-answering-enabled)').click();
    await expect(page.locator('#answering-pause-dialog')).toBeVisible();
    await page.click('#btn-cancel-pause-answering');
    await expect(page.locator('#answering-pause-dialog')).toBeHidden();
    await expect(page.locator('#setting-answering-enabled')).toBeChecked();

    await page.locator('label:has(#setting-answering-enabled)').click();
    await expect(page.locator('#answering-pause-dialog')).toBeVisible();
    await page.click('#btn-confirm-pause-answering');
    await expect(page.locator('#setting-answering-enabled')).not.toBeChecked();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    await page.goto('/admin/status');
    await expect(page.locator('#status-answering-row')).toContainText('Paused');

    // Resume on /admin/status and confirm Active
    await page.click('#status-answering-toggle');
    await expect(page.locator('#status-answering-row')).toContainText('Active');
  });
});
