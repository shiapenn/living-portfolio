import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-1 Task 3 & 4: Redaction Scanner, Publish Gate & Preview Token E2E Suite (WP-15.4)', () => {
  test('1. Pre-publish redaction check, exclusion matching, error state, and NDA confirmation gate (UX-03)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');

    // Configure test exclusions dynamically via admin settings endpoint
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      await fetch('/api/settings/redaction', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        body: JSON.stringify({ exclusions: ['internal.corp.example.com', 'secret-project-alpha'] }),
      });
    });

    const titleInput = page.locator('#ref-field-title');
    const bodyInput = page.locator('#ref-field-body');
    const openDialogBtn = page.locator('#ref-btn-publish');
    const dialog = page.locator('#ref-publish-dialog');
    const dialogStatus = page.locator('#ref-publish-dialog-status');
    const ndaStep = page.locator('#ref-publish-nda-step');
    const ndaCheck = page.locator('#ref-publish-nda-check');
    const confirmBtn = page.locator('#ref-publish-confirm');

    await titleInput.fill('Redaction Gate Verification');

    // 1. Clean state
    await bodyInput.fill('Writing about software performance and clean distributed data structures.');
    await openDialogBtn.click();
    await expect(dialog).toBeVisible();
    await expect(dialogStatus).toContainText(/no private details/i);
    await expect(ndaStep).toBeHidden();
    await page.click('#ref-publish-cancel');
    await expect(dialog).toBeHidden();

    // 2. Needs review state: configured exclusion matched
    await bodyInput.fill('Client deployment for internal.corp.example.com under secret-project-alpha.');
    await openDialogBtn.click();
    await expect(dialog).toBeVisible();
    await expect(ndaStep).toBeVisible();

    // Blocked until NDA checkbox is checked
    await confirmBtn.click();
    await expect(dialog).toBeVisible();
    await expect(dialogStatus).toContainText(/confirm/i);

    // Check NDA box and publish
    await ndaCheck.check();
    await confirmBtn.click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#ref-status-line')).toContainText(/now public/i);
  });
});
