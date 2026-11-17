import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.1: Entry lifecycle and state machine on Reference Editor (WP-15.4)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testTitle = `WP-14.1 Lifecycle Test ${uniqueSuffix}`;
  const testSlug = `wp-14-1-lifecycle-${uniqueSuffix}`;

  test('Scripted journey: new -> save -> publish -> edit -> save changes stays public -> unlist -> private', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    const saveBtn = page.locator('#ref-btn-save');
    const openDialogBtn = page.locator('#ref-btn-publish');
    const confirmPublishBtn = page.locator('#ref-publish-confirm');
    const statusLine = page.locator('#ref-status-line');
    const visRadio = (vis: 'draft' | 'unlisted' | 'public') =>
      page.locator(`input[name="ref-visibility-choice"][value="${vis}"]`);

    // 1. New entry form fill & Save draft
    await page.fill('#ref-field-title', testTitle);
    await page.click('#ref-switch-settings');
    await page.fill('#ref-field-slug', testSlug);
    await page.fill('#ref-field-date', '2026-11-10');
    await page.click('#ref-switch-edit');
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', '## WP-14.1 Lifecycle Test\n\nTesting Reference Editor entry lifecycle.\n');

    await saveBtn.click();
    await expect(statusLine).toContainText(/draft saved/i);
    await expect(visRadio('draft')).toBeChecked();

    // 2. Publish -> Public
    await page.click('#ref-switch-settings');
    await openDialogBtn.click();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText(/no private details/i);
    await confirmPublishBtn.click();
    await expect(statusLine).toContainText(/now public/i);
    await expect(visRadio('public')).toBeChecked();

    // 3. Edit & Save changes stays Public
    await page.click('#ref-switch-edit');
    await page.fill('#ref-field-body', '## WP-14.1 Lifecycle Test\n\nUpdated body while remaining public.\n');
    await saveBtn.click();
    await expect(statusLine).toContainText(/changes saved/i);
    await expect(visRadio('public')).toBeChecked();

    // 4. Visibility -> Unlisted
    await page.click('#ref-switch-settings');
    await page.check('input[name="ref-visibility-choice"][value="unlisted"]');
    await expect(statusLine).toContainText(/unlisted/i);
    await expect(visRadio('unlisted')).toBeChecked();

    // 5. Visibility -> Private (Draft)
    await page.check('input[name="ref-visibility-choice"][value="draft"]');
    await expect(statusLine).toContainText(/private|draft/i);
    await expect(visRadio('draft')).toBeChecked();
  });
});
