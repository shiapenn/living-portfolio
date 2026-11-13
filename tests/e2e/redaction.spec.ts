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
    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    const confirmPublishBtn = page.locator('#btn-confirm-publish');
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
    await openDialogBtn.click();
    await expect(page.locator('#publish-dialog')).toBeVisible();
    await expect(page.locator('#publish-nda-section')).toBeVisible();
    await confirmPublishBtn.click();

    // Submission blocked by dialog gate
    await expect(page.locator('#publish-dialog-alert')).toBeVisible();
    await expect(page.locator('#publish-dialog-alert')).toContainText('Confidentiality & NDA confirmation is required');

    // 6. Check NDA confirmation checkbox and publish
    await page.check('#publish-dialog-nda');
    await confirmPublishBtn.click();

    // Submission succeeds
    await expect(banner.locator('.as-of-banner')).toBeVisible();
    await expect(banner).toContainText('Published "Excluded Project Notes" at L0');
  });

  test('2. Signed preview token flows end to end, surfaces in UI, invalidates on body edit, and gates publication (UX-03, UX-04, WP-1 Task 4)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await expect(page).toHaveURL(/\/admin$/);

    const redactBtn = page.locator('#btn-redaction-check');
    const redactBox = page.locator('#redaction-preview-box');
    const bodyInput = page.locator('#entry-body');
    const tokenInput = page.locator('#entry-preview-token');
    const banner = page.locator('#admin-status-banner');

    // 1. Initial form fill without clicking "Preview Redaction"
    await page.fill('#entry-title', 'Preview Token Lifecycle Entry');
    await page.fill('#entry-slug', 'preview-token-lifecycle');
    await page.fill('#entry-date', '2026-02-01');
    await bodyInput.fill('Initial unverified technical draft discussing kernel scheduling.');

    // Assert preview token hidden input is initially empty
    await expect(tokenInput).toHaveValue('');

    // 2. Publish Gate: publish is blocked without a token
    await page.evaluate(async () => {
      await (window as any).commitEntry('publish');
    });
    await expect(banner.locator('[data-gate="preview-token"]')).toBeVisible();
    await expect(banner).toContainText('Redaction preview check is required before publishing');
    await expect(banner).not.toContainText('Published');

    // 3. User clicks "Preview Redaction (§4.3)" -> signed preview token is acquired and surfaced in UI
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="clean"]')).toBeVisible();
    const tokenBadge = redactBox.locator('#preview-token-badge');
    await expect(tokenBadge).toBeVisible();
    await expect(tokenBadge).toContainText('Signed preview token:');

    // Token value is populated in form hidden input
    const issuedToken = await tokenInput.inputValue();
    expect(issuedToken).toBeTruthy();
    expect(issuedToken.length).toBeGreaterThan(20);

    // 4. Token invalidated after a body edit
    await bodyInput.type(' An additional paragraph was appended here.');
    // Badge is removed, status announces invalidation, hidden token is cleared
    await expect(tokenBadge).toHaveCount(0);
    await expect(tokenInput).toHaveValue('');
    await expect(redactBox.locator('[data-state="invalidated"]')).toBeVisible();
    await expect(redactBox).toContainText('Body edited since last check — preview token invalidated');

    // 5. Attempting to publish with invalidated token is blocked
    await page.evaluate(async () => {
      await (window as any).commitEntry('publish');
    });
    await expect(banner.locator('[data-gate="preview-token"]')).toBeVisible();
    await expect(banner).toContainText('Redaction preview check is required before publishing');

    // 6. Re-run preview check -> acquires new signed preview token
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="clean"]')).toBeVisible();
    const newTokenBadge = redactBox.locator('#preview-token-badge');
    await expect(newTokenBadge).toBeVisible();
    const reissuedToken = await tokenInput.inputValue();
    expect(reissuedToken).toBeTruthy();
    expect(reissuedToken.length).toBeGreaterThan(20);

    // 7. Publish succeeds with valid token via single publish dialog path
    await page.click('#btn-open-publish-dialog');
    await expect(page.locator('#publish-dialog')).toBeVisible();
    await page.click('#btn-confirm-publish');
    await expect(banner.locator('.as-of-banner')).toBeVisible();
    await expect(banner).toContainText('Published "Preview Token Lifecycle Entry" at L0');

    // Token is consumed/cleared after publication
    await expect(tokenInput).toHaveValue('');
  });

  test('3. UI redaction preview drawer displays multi-pass entities and applies interactive redactions (20261020-UX-03)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await expect(page).toHaveURL(/\/admin$/);

    const redactBtn = page.locator('#btn-redaction-check');
    const redactBox = page.locator('#redaction-preview-box');
    const bodyInput = page.locator('#entry-body');
    const drawer = page.locator('#redaction-preview-drawer');

    // Fill body with credentials, NDA note, and client entity
    const testSecretKey = ['sk', 'test', 'reviewdrawertoken12345'].join('-');
    await bodyInput.fill(`Reviewing Client Phoenix contract under strict NDA with token ${testSecretKey}.`);

    // Run preview check -> enters needs-review state
    await redactBtn.click();
    await expect(redactBox.locator('[data-state="needs-review"]')).toBeVisible();

    // Review drawer button appears in banner
    const openDrawerBtn = redactBox.locator('#btn-open-redaction-drawer');
    await expect(openDrawerBtn).toBeVisible();

    // Open review drawer
    await openDrawerBtn.click();
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('#redaction-drawer-title')).toContainText('Redaction Review Drawer');

    // Check pass cards
    await expect(drawer.locator('#drawer-count-pass1')).not.toContainText('0 found');
    await expect(drawer.locator('#drawer-count-pass2')).not.toContainText('0 found');
    await expect(drawer.locator('#drawer-count-pass3')).not.toContainText('0 found');

    // Matched entity highlight preview is visible
    await expect(drawer.locator('#drawer-highlight-preview mark')).toHaveCount(3);

    // Click "Redact All Findings"
    const redactAllBtn = drawer.locator('#btn-drawer-redact-all');
    await redactAllBtn.click();

    // Drawer closes and re-runs check
    await expect(drawer).toBeHidden();
    // Body is masked
    const maskedBody = await bodyInput.inputValue();
    expect(maskedBody).toContain('[REDACTED:');
    expect(maskedBody).not.toContain(testSecretKey);

    // Clean state reached
    await expect(redactBox.locator('[data-state="clean"]')).toBeVisible();
    await expect(redactBox).toContainText('No confidential secrets or NDA markers detected');
  });
});
