import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.4: Account settings (/admin/settings/account, /admin/account)', () => {
  test('renders Account settings, regenerates recovery codes, creates & revokes API token, re-enrols authenticator, and ends other sessions', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/account');
    await expect(page.locator('h1')).toContainText('Account');

    // 1. Regenerate recovery codes (UX-47, C1 Credential list)
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output[data-c="Credential"] .lp-credential-cell')).toHaveCount(8);
    const codesText = await page.locator('#account-recovery-output').innerText();
    expect(codesText.match(/[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}/g)?.length).toBe(8);

    // 2. Create and revoke API token (D-12, C1 Credential single)
    await page.fill('#account-token-label', 'wp17-ci-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created[data-c="Credential"]')).toContainText('lp_pat_');
    const revokeBtn = page.locator('[data-c="Item"]:has-text("wp17-ci-token") button[data-revoke-token]').first();
    await expect(revokeBtn).toBeVisible();
    await revokeBtn.click();
    await expect(page.locator('#account-tokens-list-notice')).toContainText('Token revoked.');

    // 3. Re-enrol authenticator shows QR + manual key in Credential
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-reenrol-box')).toBeVisible();
    await expect(page.locator('#account-totp-manual-cred[data-c="Credential"]')).toBeVisible();

    // 4. Sign out other sessions
    await page.click('#btn-revoke-other-sessions');
    await expect(page.locator('#account-sessions-notice')).toContainText('Other sessions signed out.');

    // 5. Unconfirmed setup reset endpoint returns 409 once confirmed (UX-49)
    const resetRes = await page.request.post('/api/auth/setup/reset');
    expect(resetRes.status()).toBe(409);
  });
});
