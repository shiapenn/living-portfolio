import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.0a: In-viewport editor feedback and live announcements (UX-43)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testTitle = `WP-14.0a Lifecycle Test ${uniqueSuffix}`;
  const testSlug = `wp-14-0a-lifecycle-test-${uniqueSuffix}`;

  test('Save draft, Publish, Unpublish, and Delete show results in viewport with polite announcements and list refresh', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Select editor action controls
    const saveDraftBtn = page.locator('#btn-save-draft');
    const publishBtn = page.locator('#btn-publish-entry');
    const unpublishBtn = page.locator('#btn-unpublish');
    const deleteBtn = page.locator('#btn-delete-entry');

    // Dedicated inline status line adjacent to editor action controls
    const editorStatusLine = page.locator('#editor-status-line');
    // Polite notification toast / live region
    const editorToast = page.locator('#editor-toast');

    // 1. Fill editor fields
    await page.fill('#entry-title', testTitle);
    await page.fill('#entry-slug', testSlug);
    await page.fill('#entry-date', '2026-11-10');
    // Provide sufficient body content so editor workspace is scrolled to action bar
    await page.fill(
      '#entry-body',
      '## WP-14.0a Verification\n\nTesting in-viewport editor results for Save draft, Publish, Unpublish, and Delete.\n'.repeat(
        15
      )
    );

    // Scroll action bar into view if needed
    await saveDraftBtn.scrollIntoViewIfNeeded();

    // -------------------------------------------------------------
    // ACTION 1: Save Draft
    // -------------------------------------------------------------
    await saveDraftBtn.click();

    // Feedback must be visible in viewport without scrolling
    await expect(editorStatusLine).toBeVisible({ timeout: 5000 });
    await expect(editorStatusLine).toBeInViewport();
    await expect(editorStatusLine).toContainText(new RegExp(`(Saved|Created) draft.*${testTitle}`, 'i'));

    // Feedback announced to assistive technology
    await expect(editorStatusLine).toHaveAttribute('aria-live', 'polite');

    // Verify toast notification is also visible in viewport if present
    if (await editorToast.count() > 0) {
      await expect(editorToast).toBeVisible();
      await expect(editorToast).toBeInViewport();
      await expect(editorToast).toHaveAttribute('aria-live', 'polite');
    }

    // List refresh: new entry must appear in entries list
    const entryListItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: testTitle });
    await expect(entryListItem).toBeVisible();
    await expect(entryListItem).toContainText('private');

    // -------------------------------------------------------------
    // ACTION 2: Publish
    // -------------------------------------------------------------
    // Pre-publish check and NDA confirmation
    await page.click('#btn-redaction-check');
    await expect(page.locator('#redaction-preview-box')).toBeVisible();
    await page.check('#entry-nda-confirmed');

    await publishBtn.scrollIntoViewIfNeeded();
    await publishBtn.click();

    // Feedback must be visible in viewport without scrolling
    await expect(editorStatusLine).toBeVisible({ timeout: 5000 });
    await expect(editorStatusLine).toBeInViewport();
    await expect(editorStatusLine).toContainText(new RegExp(`Published.*${testTitle}`, 'i'));
    await expect(editorStatusLine).toHaveAttribute('aria-live', 'polite');

    // List refresh: entry visibility badge updates to public
    await expect(entryListItem).toContainText('public');

    // -------------------------------------------------------------
    // ACTION 3: Unpublish
    // -------------------------------------------------------------
    await expect(unpublishBtn).toBeVisible();
    await unpublishBtn.scrollIntoViewIfNeeded();
    await unpublishBtn.click();

    // Feedback must be visible in viewport without scrolling
    await expect(editorStatusLine).toBeVisible({ timeout: 5000 });
    await expect(editorStatusLine).toBeInViewport();
    await expect(editorStatusLine).toContainText(new RegExp(`Unpublished.*${testTitle}`, 'i'));
    await expect(editorStatusLine).toHaveAttribute('aria-live', 'polite');

    // List refresh: entry visibility badge updates to private
    await expect(entryListItem).toContainText('private');

    // -------------------------------------------------------------
    // ACTION 4: Delete
    // -------------------------------------------------------------
    await expect(deleteBtn).toBeVisible();
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();

    // Feedback must be visible in viewport without scrolling
    await expect(editorStatusLine).toBeVisible({ timeout: 5000 });
    await expect(editorStatusLine).toBeInViewport();
    await expect(editorStatusLine).toContainText(new RegExp(`Deleted.*${testTitle}`, 'i'));
    await expect(editorStatusLine).toHaveAttribute('aria-live', 'polite');

    // List refresh: entry removed from list
    await expect(entryListItem).not.toBeVisible();
  });
});
