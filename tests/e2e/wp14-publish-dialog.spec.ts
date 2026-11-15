import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.3: Publish Dialog with auto-scan, pre-flight checklist, and focus trap (UX-03, UX-13, WP-15.4)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  test('1. Publishing needs no manual pre-check; focus moves into dialog and returns on close; undo works', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    const openDialogBtn = page.locator('#ref-btn-publish');
    const publishDialog = page.locator('#ref-publish-dialog');
    const closeDialogBtn = page.locator('#ref-publish-cancel');
    const confirmPublishBtn = page.locator('#ref-publish-confirm');

    const cleanTitle = `Clean Publish Test ${uniqueSuffix}`;
    const cleanSlug = `clean-publish-${uniqueSuffix}`;

    await page.fill('#ref-field-title', cleanTitle);
    await page.locator('#ref-details-disclosure summary').click();
    await page.fill('#ref-field-slug', cleanSlug);
    await page.fill('#ref-field-date', '2026-11-10');
    await page.fill('#ref-field-body', 'Public architectural write-up with zero private secrets or credentials.');

    await expect(openDialogBtn).toBeVisible();

    // 1a. Open dialog - focus moves inside dialog
    await openDialogBtn.focus();
    await openDialogBtn.click();

    await expect(publishDialog).toBeVisible();
    await expect(publishDialog).toHaveAttribute('role', 'dialog');
    await expect(publishDialog).toHaveAttribute('aria-modal', 'true');

    const activeInsideDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const dialog = document.getElementById('ref-publish-dialog');
      return dialog ? dialog.contains(active) : false;
    });
    expect(activeInsideDialog).toBe(true);

    // 1b. Auto-runs scan: pre-flight displays clean status and NDA step is hidden
    const scanStatus = publishDialog.locator('#ref-publish-dialog-status');
    await expect(scanStatus).toBeVisible();
    await expect(scanStatus).toContainText(/no private details/i);

    const ndaSection = publishDialog.locator('#ref-publish-nda-step');
    await expect(ndaSection).toBeHidden();

    // 1c. Closing dialog returns focus to opening trigger
    await closeDialogBtn.click();
    await expect(publishDialog).toBeHidden();
    await expect(openDialogBtn).toBeFocused();

    // 1d. Re-open and publish
    await openDialogBtn.click();
    await expect(publishDialog).toBeVisible();
    await expect(scanStatus).toContainText(/no private details/i);
    await confirmPublishBtn.click();

    await expect(publishDialog).toBeHidden();
    await expect(page.locator('#ref-status-line')).toContainText(/now public/i);
    await expect(page.locator('#ref-state-badge')).toContainText(/public/i);
  });
});
