import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-1 Task 3 & 4: Redaction Scanner, Publish Gate & Preview Token E2E Suite', () => {
  test('1. Four-state redaction preview, exclusion matching, retry button, and NDA confirmation gate (UX-03, WP-1 Task 3)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await expect(page).toHaveURL(/\/admin$/);

    // Configure test exclusions dynamically via admin settings endpoint
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      await fetch('/api/settings/redaction', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        body: JSON.stringify({ exclusions: ['internal.corp.example.com', 'secret-project-alpha'] }),
      });
    });

    const redactBtn = page.locator('#btn-redaction-check');
    const redactBox = page.locator('#redaction-preview-box');
    const bodyInput = page.locator('#entry-body');
    const ndaCheckbox = page.locator('#entry-nda-confirmed');
    const publishBtn = page.locator('#btn-publish-entry');
    const banner = page.locator('#admin-status-banner');

    // 1. Clean state: only state permitted to render green (border-color:var(--role-outcome))
    await bodyInput.fill('Writing about software performance and clean distributed data structures.');
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="clean"]')).toBeVisible();
    await expect(redactBox).toContainText('No confidential secrets or NDA markers detected');
    // Verify green chip styling is present only on clean state
    const cleanChip = redactBox.locator('.chip[data-state="clean"]');
    await expect(cleanChip).toBeVisible();

    // 2. Needs review state: owner exclusion list matched from configured exclusions (never green)
    await bodyInput.fill('Client deployment for internal.corp.example.com under secret-project-alpha.');
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="needs-review"]')).toBeVisible();
    await expect(redactBox).toContainText('Needs Review');
    await expect(redactBox).toContainText('internal.corp.example.com');
    await expect(redactBox).toContainText('secret-project-alpha');
    // Verify no green chip is displayed
    await expect(redactBox.locator('.chip')).toHaveCount(0);

    // 3. Could not check state (500 error) & Retry button
    await page.route('**/api/entries/redaction-preview', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="could-not-check"][data-error="500"]')).toBeVisible();
    await expect(redactBox).toContainText("Couldn't check for private details: Server error (HTTP 500)");
    const retryBtn = redactBox.locator('#btn-redaction-retry');
    await expect(retryBtn).toBeVisible();

    // 4. Click Retry button to recover
    await page.unroute('**/api/entries/redaction-preview');
    await retryBtn.click();
    await expect(redactBox.locator('[data-state="needs-review"]')).toBeVisible();
    await expect(redactBox).toContainText('Needs Review');

    // 5. Publish Gate: attempt to publish public entry with flagged warnings without NDA confirmation
    await page.fill('#entry-title', 'Excluded Project Notes');
    await page.fill('#entry-slug', 'excluded-project-notes');
    await page.fill('#entry-date', '2026-01-01');
    await ndaCheckbox.uncheck();
    await publishBtn.click();

    // Submission blocked by client-side gate
    await expect(banner.locator('.later-thinking-banner')).toBeVisible();
    await expect(banner).toContainText('Confidentiality & NDA confirmation is required');

    // 6. Check NDA confirmation checkbox and publish
    await ndaCheckbox.check();
    await publishBtn.click();

    // Submission succeeds
    await expect(banner.locator('.as-of-banner')).toBeVisible();
    await expect(banner).toContainText('Published "Excluded Project Notes" at L0');
  });
});
