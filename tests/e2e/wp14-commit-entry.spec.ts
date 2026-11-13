import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.1: commitEntry state machine lifecycle and error handling', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testTitle = `WP-14.1 Lifecycle Test ${uniqueSuffix}`;
  const testSlug = `wp-14-1-lifecycle-${uniqueSuffix}`;

  test('Scripted journey: new -> save -> publish -> edit -> save stays public -> unpublish -> undo restores public -> unlist', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const saveDraftBtn = page.locator('#btn-save-draft');
    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    const confirmPublishBtn = page.locator('#btn-confirm-publish');
    const unpublishBtn = page.locator('#btn-unpublish');
    const unlistBtn = page.locator('#btn-unlist');
    const statusLine = page.locator('#editor-status-line');
    const stateBadge = page.locator('#chip-current-state');

    // 1. New entry form fill
    await page.fill('#entry-title', testTitle);
    await page.fill('#entry-slug', testSlug);
    await page.fill('#entry-date', '2026-11-10');
    await page.fill(
      '#entry-body',
      '## WP-14.1 Lifecycle Test\n\nTesting formal commitEntry state machine journey.\n'
    );

    // 2. Save (new -> draft)
    await saveDraftBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`(Saved|Created) draft.*${testTitle}`, 'i'));
    await expect(stateBadge).toContainText(/private|draft/i);

    // 3. Publish (saved draft -> public)
    await openDialogBtn.click();
    await expect(page.locator('#publish-scan-status')).toContainText(/nothing found|0 confidential/i);
    await confirmPublishBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`Published.*${testTitle}`, 'i'));
    await expect(stateBadge).toContainText(/public/i);

    // Verify list item shows public
    const entryListItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: testTitle });
    await expect(entryListItem).toBeVisible();
    await expect(entryListItem).toContainText('public');

    // 4. Edit body
    await page.locator('#entry-body').fill(
      '## WP-14.1 Lifecycle Test\n\nTesting formal commitEntry state machine journey with edited content.\n'
    );

    // 5. Save changes (public -> public; UX-02: must NOT silently unpublish!)
    await saveDraftBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`Saved.*${testTitle}`, 'i'));
    // State MUST stay PUBLIC!
    await expect(stateBadge).toContainText(/public/i);
    await expect(entryListItem).toContainText('public');

    // 6. Unpublish (public -> private)
    await expect(unpublishBtn).toBeVisible();
    await unpublishBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`Unpublished.*${testTitle}`, 'i'));
    await expect(stateBadge).toContainText(/private/i);
    await expect(entryListItem).toContainText('private');

    // 7. Undo restores public with token (UX-04)
    const undoBtn = page.locator('#editor-status-line #btn-undo-status-line');
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`(Published|Restored).*${testTitle}`, 'i'));
    await expect(stateBadge).toContainText(/public/i);
    await expect(entryListItem).toContainText('public');

    // 8. Unlist (public -> unlisted; UX-03)
    await expect(unlistBtn).toBeVisible();
    await unlistBtn.click();
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toContainText(new RegExp(`Unlisted.*${testTitle}`, 'i'));
    await expect(stateBadge).toContainText(/unlisted/i);
    await expect(entryListItem).toContainText('unlisted');
  });

  test('409 duplicate slug case (CP-12): maps conflict error to specific message', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Fill with the slug created in the first test
    await page.fill('#entry-title', `Duplicate Slug ${uniqueSuffix}`);
    await page.fill('#entry-slug', testSlug);
    await page.fill('#entry-date', '2026-11-10');
    await page.fill('#entry-body', 'Testing duplicate slug 409 mapping.');

    await page.click('#btn-save-draft');

    const statusLine = page.locator('#editor-status-line');
    await expect(statusLine).toBeVisible({ timeout: 5000 });
    // Must map 409 to specific copy containing slug or conflict explanation
    await expect(statusLine).toContainText(new RegExp(`already exists|slug.*exists`, 'i'));
  });

  test('Stale token case: editing body invalidates token and guards publishing', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const freshTitle = `Stale Token Test ${uniqueSuffix}`;
    const freshSlug = `stale-token-${uniqueSuffix}`;

    await page.fill('#entry-title', freshTitle);
    await page.fill('#entry-slug', freshSlug);
    await page.fill('#entry-date', '2026-11-10');
    await page.fill('#entry-body', 'Initial text before redaction check.');

    // Save draft first
    await page.click('#btn-save-draft');
    await expect(page.locator('#editor-status-line')).toContainText(new RegExp(`(Saved|Created) draft.*${freshTitle}`, 'i'));

    // Check for private details to generate preview token
    await page.click('#btn-redaction-check');
    await expect(page.locator('#redaction-preview-box')).toBeVisible();

    // Now edit the body, which voids the token
    await page.locator('#entry-body').fill('Edited text after redaction check, which invalidates the preview token.');

    // Publishing now must require re-check or report invalidation
    await page.evaluate(async () => {
      await (window as any).commitEntry('publish');
    });
    const statusLine = page.locator('#editor-status-line');
    await expect(statusLine).toBeVisible();
    await expect(statusLine).toContainText(new RegExp(`(preview token|invalidated|Check for private details|check this entry)`, 'i'));
  });
});
