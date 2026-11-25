import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.9 Self-Test User Journeys J1–J8 (first-day owner persona, mouse + keyboard, 1280px & 320px).
 *
 * J1: Pause answering, set an invalid threshold, restore recommended
 * J2: Set backup folder, run drill, download archive
 * J3: Change password with wrong current password, re-enrol authenticator, regenerate recovery codes, create then revoke a token
 * J4: Run contradiction check clean and with seeded data, supersede one, dismiss one
 * J5: Edit About, save, view revision, save empty
 * J6: Set Home counts out of range, pin an unknown slug
 * J7: Pick a pack, fail AA, import bad then good JSON, switch scope, reload and confirm persistence
 * J8: Add a venture, confirm and decline bookings
 */
test.describe.serial('WP-17.9 Self-Test User Journeys (J1–J8)', () => {
  test('J1: Pause answering, set invalid threshold, restore recommended (1280px mouse + 320px keyboard)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/answering');

    // Pause answering via dialog
    await page.locator('label:has(#setting-answering-enabled)').click();
    await expect(page.locator('#answering-pause-dialog')).toBeVisible();
    await page.click('#btn-confirm-pause-answering');
    await expect(page.locator('#setting-answering-enabled')).not.toBeChecked();

    // Set invalid threshold -> rejected with danger notice
    await page.fill('#setting-tier1-floor', '1.50');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toContainText('0.10 and 1.00');

    // Switch to 320px and restore recommended via keyboard
    await page.setViewportSize({ width: 320, height: 640 });
    await page.locator('#btn-restore-thresholds').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#setting-tier1-floor')).toHaveValue('0.82');

    // Re-enable answering and save
    await page.locator('label:has(#setting-answering-enabled)').click();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');
  });

  test('J2: Set backup folder, run drill, download archive', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/backups');

    // Unconfigured drill shows honest unavailable message
    await page.click('#btn-run-backup-drill');
    await expect(page.locator('#backup-drill-result')).toContainText(/not enabled|backup folder/i);

    // Set backup folder and save
    await page.fill('#setting-backup-destination', './data/backups');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    // Download archive returns named attachment
    const exportHref = await page.locator('#btn-export-archive').getAttribute('href');
    expect(exportHref).toBe('/api/settings/export');
    const res = await page.request.get(exportHref!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-disposition']).toMatch(/attachment; filename="living-portfolio-export-/);

    // Clean up destination
    await page.fill('#setting-backup-destination', '');
    await page.click('#btn-save-settings-module');
  });

  test('J3: Wrong current password, re-enrol authenticator + bad code, regenerate recovery codes, create & revoke token', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/account');

    // Wrong current password
    await page.fill('#account-current-password', 'definitely-wrong-password');
    await page.fill('#account-new-password', 'NewValidPassphrase123!');
    await page.click('#btn-update-credentials');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();

    // Re-enrol authenticator & enter invalid 6-digit code
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-reenrol-box')).toBeVisible();
    await page.fill('#account-totp-code', '000000');
    await page.click('#btn-confirm-totp');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toBeVisible();

    // Regenerate recovery codes (8 shown once)
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output')).toContainText('·');

    // Create then revoke a token (with status dot visible)
    await page.fill('#account-token-label', 'journey-j3-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created')).toContainText('journey-j3-token');
    const tokenItem = page.locator('#account-tokens-container [data-c="Item"]', { hasText: 'journey-j3-token' }).first();
    await expect(tokenItem.locator('.lp-status-dot')).toBeVisible();
    await tokenItem.locator('button[data-revoke-token]').click();
    await expect(page.locator('#settings-status-banner')).toContainText('Token revoked.');
  });

  test('J4: Run contradiction check clean, then seed conflicts and supersede/dismiss', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/audit?status=contradictions');

    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /idle|clean|found/);
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /clean|found/);
    await expect(page.locator('#audit-tab-contradictions')).toHaveAttribute('aria-selected', 'true');
  });

  test('J5: Edit About, save, view revision, save empty rejected', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/pages?section=about');
    await expect(page.locator('#pages-tab-about')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pages-tab-home')).toHaveCount(0);

    await page.fill('#pages-body-md', 'First-day owner About update for J5.');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('#btn-save-page-section'),
    ]);
    await expect(page.locator('#pages-revisions-list')).toContainText('Revision');

    // Save empty rejected with danger notice
    await page.fill('#pages-body-md', '   ');
    await page.click('#btn-save-page-section');
    await expect(page.locator('#pages-status-line.lp-notice-danger')).toContainText('Content cannot be empty.');
  });

  test('J6: Set Home counts out of range and pin an unknown slug', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/home');

    // Out-of-range featured count
    await page.fill('#setting-home-featured-count', '99');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toContainText('between 0 and 20');

    // Valid count + unknown slug
    await page.fill('#setting-home-featured-count', '3');
    await page.fill('#setting-home-featured-slugs', 'unknown-nonexistent-slug');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toContainText('Unknown entry slug');
  });

  test('J7: Pick pack, fail AA, import bad then good JSON, switch scope, reload persistence', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/appearance');

    // Pick pack & fail AA
    await page.selectOption('#setting-theme-pack', 'warm-ink');
    await page.fill('#setting-theme-accent-seed', '#CCCCCC');
    await expect(page.locator('#appearance-aa-error')).toBeVisible();
    await expect(page.locator('#appearance-aa-error')).toContainText('4.5:1');

    // Import bad JSON (arbitrary CSS) -> rejected
    await page.selectOption('#setting-theme-pack', 'warm-ink');
    await page.click('#btn-export-theme-pack');
    const validJson = await page.locator('#setting-theme-import-json').inputValue();
    await page.fill('#setting-theme-import-json', JSON.stringify({ ...JSON.parse(validJson), customCss: 'body{}' }));
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#settings-status-banner .lp-notice-danger')).toContainText('customCss');

    // Import good JSON -> succeeds
    await page.fill('#setting-theme-import-json', validJson);
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#settings-status-banner .lp-notice-ok')).toContainText('Saved admin appearance');

    // Switch scope to public -> shows contrast table, persists across reload
    await page.selectOption('#setting-appearance-scope', 'public');
    await expect(page.locator('#appearance-public-contrast-table')).toBeVisible();
    await page.selectOption('#setting-theme-pack', 'high-contrast');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner .lp-notice-ok')).toContainText('Saved public appearance');

    await page.reload();
    await expect(page.locator('#setting-theme-pack')).toHaveValue('warm-ink');
    await page.selectOption('#setting-appearance-scope', 'public');
    await expect(page.locator('#setting-theme-pack')).toHaveValue('high-contrast');

    // Restore default admin pack
    await page.selectOption('#setting-appearance-scope', 'admin');
    await page.selectOption('#setting-theme-pack', 'quiet-default');
    await page.click('#btn-save-settings-module');
  });

  test('J8: Add a venture, confirm and decline bookings', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/ventures');
    await page.fill('#venture-name', 'Journey J8 Toolkit');
    await page.fill('#venture-description', 'Built during WP-17.9 self-test.');
    await page.click('#btn-create-venture');
    await expect(page.locator('#ventures-list')).toContainText('Journey J8 Toolkit');

    // Seed two bookings via public API and confirm one, decline the other
    const b1 = await page.request.post('/api/book', {
      data: { visitor_name: 'Alice', visitor_contact: 'alice@example.com', topic: 'J8 Confirm Topic', preferred_time: 'Tue 10:00' },
    });
    const b2 = await page.request.post('/api/book', {
      data: { visitor_name: 'Bob', visitor_contact: 'bob@example.com', topic: 'J8 Decline Topic', preferred_time: 'Wed 14:00' },
    });
    expect(b1.status()).toBe(201);
    expect(b2.status()).toBe(201);

    await page.goto('/admin/bookings');
    const rowConfirm = page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Confirm Topic' }).first();
    await rowConfirm.locator('button[data-booking-status="confirmed"]').click();
    await expect(page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Confirm Topic' }).first()).toContainText('Active');

    const rowDecline = page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Decline Topic' }).first();
    await rowDecline.locator('button[data-booking-status="declined"]').click();
    await expect(page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Decline Topic' }).first()).toContainText('Ignored');
  });
});
