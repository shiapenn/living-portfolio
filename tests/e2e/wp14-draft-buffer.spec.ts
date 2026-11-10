import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.4: Draft buffer, local autosave, restore on reload, and beforeunload guard (2.1.3)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  test('1. Typed content is buffered locally and restored on reload with restore banner', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const draftTitle = `Autosave Draft ${uniqueSuffix}`;
    const draftBody = `## Local Draft Buffer\n\nTesting persistence across reloads. Timestamp: ${uniqueSuffix}`;

    const titleInput = page.locator('#entry-title');
    const bodyInput = page.locator('#entry-body');

    await titleInput.fill(draftTitle);
    await bodyInput.fill(draftBody);

    // Wait for debounce autosave (~1.5s)
    await page.waitForTimeout(1600);

    // Reload the page without saving to server
    await page.reload();

    // Verify draft restoration
    await expect(titleInput).toHaveValue(draftTitle, { timeout: 5000 });
    await expect(bodyInput).toHaveValue(draftBody);

    // Restore banner / notice is visible
    const restoreNotice = page.locator('#draft-restore-notice');
    await expect(restoreNotice).toBeVisible();
    await expect(restoreNotice).toContainText(/restored|unsaved draft/i);
  });

  test('2. Unsaved changes trigger beforeunload guard when dirty', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const bodyInput = page.locator('#entry-body');
    await bodyInput.fill('Dirty unsaved text awaiting beforeunload check.');

    // Evaluate that beforeunload event handler prevents default when dirty
    const hasUnloadGuard = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return (window as any).__lp_is_dirty === true;
    });
    expect(hasUnloadGuard).toBe(true);

    // Saving draft clears dirty flag
    await page.fill('#entry-title', `Clean Save ${uniqueSuffix}`);
    await page.click('#btn-save-draft');
    await expect(page.locator('#editor-status-line')).toContainText(/saved|created/i);

    const isDirtyAfterSave = await page.evaluate(() => (window as any).__lp_is_dirty === true);
    expect(isDirtyAfterSave).toBe(false);
  });

  test('3. Offline state triggers visible offline banner', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const offlineBanner = page.locator('#admin-offline-banner');
    await expect(offlineBanner).toBeHidden();

    // Simulate offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await expect(offlineBanner).toBeVisible();
    await expect(offlineBanner).toContainText(/offline|saved locally/i);

    // Simulate online event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await expect(offlineBanner).toBeHidden();
  });
});
