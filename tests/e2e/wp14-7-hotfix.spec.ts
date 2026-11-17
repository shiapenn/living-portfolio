import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.7 Hotfix: Single Publish Path and Server Gate Refusal (WP-15.4)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const entryTitle = `WP-14.7 Hotfix Entry ${uniqueSuffix}`;
  const entrySlug = `wp-14-7-hotfix-${uniqueSuffix}`;
  const initialBody = '## Initial Clean Body\n\nThis is the original clean body text before any edits.';

  test('1. Single Publish button (#ref-btn-publish only) and server refusal without a passing scan (UX-57)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    // Duplicate plain "Publish" button must not exist
    await expect(page.locator('#btn-publish-entry')).toHaveCount(0);
    // Single "Publish…" button inside Settings view opens pre-flight dialog
    await page.click('#ref-switch-settings');
    const openDialogBtn = page.locator('#ref-btn-publish');
    await expect(openDialogBtn).toBeVisible();
    await expect(openDialogBtn).toHaveText('Publish…');

    await page.fill('#ref-field-slug', entrySlug);
    await page.fill('#ref-field-date', '2026-11-13');
    await page.click('#ref-switch-edit');
    await page.fill('#ref-field-title', entryTitle);
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', initialBody);

    // Save as draft first, then verify server refuses direct PUT visibility=public without redactionPreviewToken
    await page.click('#ref-btn-save');
    await expect(page.locator('#ref-status-line')).toContainText(/draft saved/i);
    await page.waitForURL((url) => url.pathname.startsWith('/admin/entries/') && url.pathname !== '/admin/entries/new');
    const entryId = new URL(page.url()).pathname.split('/').pop();
    expect(entryId).toBeTruthy();

    const directPutStatus = await page.evaluate(async (id) => {
      const csrf = sessionStorage.getItem('lp_csrf_token') || '';
      const res = await fetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ visibility: 'public' }),
      });
      return res.status;
    }, entryId);
    expect(directPutStatus).toBe(400);
  });

  test('2. Pre-flight dialog opens NDA step when sensitive content is detected and publishes after confirmation', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    await page.fill('#ref-field-title', `${entryTitle} NDA`);
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', 'Contact: secret-token-12345 and NDA confidential architecture.');
    await page.click('#ref-switch-settings');
    await page.click('#ref-btn-publish');

    const dialog = page.locator('#ref-publish-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#ref-publish-nda-step')).toBeVisible();

    // Confirm without NDA check is blocked
    await page.click('#ref-publish-confirm');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText(/confirm|nda/i);

    // Check NDA and confirm
    await page.check('#ref-publish-nda-check');
    await page.click('#ref-publish-confirm');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#ref-status-line')).toContainText(/now public/i);
  });
});
