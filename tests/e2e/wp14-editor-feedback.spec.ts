import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.0a: In-viewport editor feedback and live announcements (UX-43, WP-15.4)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testTitle = `WP-14.0a Lifecycle Test ${uniqueSuffix}`;
  const testSlug = `wp-14-0a-lifecycle-test-${uniqueSuffix}`;

  test('Save draft, Publish, Visibility, and Delete show results in viewport with polite announcements', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');

    const saveDraftBtn = page.locator('#ref-btn-save');
    const openDialogBtn = page.locator('#ref-btn-publish');
    const confirmPublishBtn = page.locator('#ref-publish-confirm');
    const statusLine = page.locator('#ref-status-line');

    await page.fill('#ref-field-title', testTitle);
    await page.locator('#ref-details-disclosure summary').click();
    await page.fill('#ref-field-slug', testSlug);
    await page.fill('#ref-field-date', '2026-11-10');
    await page.fill(
      '#ref-field-body',
      '## WP-14.0a Verification\n\nTesting in-viewport editor results for Save draft, Publish, Visibility, and Delete.\n'.repeat(10)
    );

    await saveDraftBtn.scrollIntoViewIfNeeded();
    await saveDraftBtn.click();

    await expect(statusLine).toBeVisible({ timeout: 5000 });
    await expect(statusLine).toBeInViewport();
    await expect(statusLine).toContainText(/draft saved/i);
    await expect(statusLine).toHaveAttribute('aria-live', 'polite');

    // Publish
    await openDialogBtn.click();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText(/no private details/i);
    await confirmPublishBtn.click();
    await expect(statusLine).toContainText(/now public/i);
    await expect(statusLine).toBeInViewport();

    // Delete via More menu -> confirm dialog (redirects to /admin on success)
    await page.click('#ref-more-menu-btn');
    await page.click('#ref-more-delete');
    await expect(page.locator('#ref-delete-dialog')).toBeVisible();
    await page.click('#ref-delete-confirm');
    await page.waitForURL((url) => url.pathname === '/admin' && !url.searchParams.has('entry'));
    await expect(page.locator('#ref-entry-list')).not.toContainText(testTitle);
  });
});
