import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.3: Publish Dialog with auto-scan, pre-flight checklist, and focus trap (UX-03, UX-13)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  test('1. Publishing needs no manual pre-check; focus is trapped and returned on close; toast has working Unpublish', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    const publishDialog = page.locator('#publish-dialog');
    const closeDialogBtn = page.locator('#btn-close-publish-dialog');
    const confirmPublishBtn = page.locator('#btn-confirm-publish');

    const cleanTitle = `Clean Publish Test ${uniqueSuffix}`;
    const cleanSlug = `clean-publish-${uniqueSuffix}`;

    await page.fill('#entry-title', cleanTitle);
    await page.fill('#entry-slug', cleanSlug);
    await page.fill('#entry-date', '2026-11-10');
    await page.fill('#entry-body', 'Public architectural write-up with zero private secrets or credentials.');

    await expect(openDialogBtn).toBeVisible();

    // 1a. Open dialog - focus must be trapped and returned
    await openDialogBtn.focus();
    await openDialogBtn.click();

    await expect(publishDialog).toBeVisible();
    await expect(publishDialog).toHaveAttribute('role', 'dialog');
    await expect(publishDialog).toHaveAttribute('aria-modal', 'true');

    // Focus is moved inside dialog
    const activeInsideDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const dialog = document.getElementById('publish-dialog');
      return dialog ? dialog.contains(active) : false;
    });
    expect(activeInsideDialog).toBe(true);

    // 1b. Auto-runs scan: pre-flight displays "Nothing found" and NDA step is omitted for clean content
    const scanStatus = publishDialog.locator('#publish-scan-status');
    await expect(scanStatus).toBeVisible();
    await expect(scanStatus).toContainText(/nothing found|no confidential/i);

    const ndaSection = publishDialog.locator('#publish-nda-section');
    await expect(ndaSection).toBeHidden();

    // Pre-flight "What happens next" checklist is visible
    const nextSteps = publishDialog.locator('#publish-what-happens-next');
    await expect(nextSteps).toBeVisible();
    await expect(nextSteps).toContainText(/static rebuild|enrichment|rss|sitemap/i);
    await expect(nextSteps).toContainText(cleanSlug);

    // 1c. Test closing dialog returns focus to opening trigger
    await closeDialogBtn.click();
    await expect(publishDialog).toBeHidden();
    await expect(openDialogBtn).toBeFocused();

    // 1d. Re-open and publish
    await openDialogBtn.click();
    await expect(publishDialog).toBeVisible();
    await confirmPublishBtn.click();

    // Dialog closes on success
    await expect(publishDialog).toBeHidden();

    // Status / Toast appears with "View page" and working "Unpublish" button
    const toast = page.locator('#editor-toast');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/View page|View entry/i);

    const toastUnpublishBtn = toast.locator('#btn-toast-unpublish');
    await expect(toastUnpublishBtn).toBeVisible();

    // Clicking toast unpublish button returns entry to private state
    await toastUnpublishBtn.click();
    const statusLine = page.locator('#editor-status-line');
    await expect(statusLine).toBeVisible();
    await expect(statusLine).toContainText(/unpublished/i);

    const stateChip = page.locator('#chip-current-state');
    await expect(stateChip).toContainText(/private|draft/i);
  });

  test('2. A sensitive match blocks publishing until confirmed or masked', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    const publishDialog = page.locator('#publish-dialog');
    const confirmPublishBtn = page.locator('#btn-confirm-publish');
    const ndaSection = publishDialog.locator('#publish-nda-section');
    const ndaCheckbox = publishDialog.locator('#publish-dialog-nda');
    const findingsNotice = publishDialog.locator('#publish-scan-status');

    const sensitiveTitle = `Sensitive Match Test ${uniqueSuffix}`;
    const sensitiveSlug = `sensitive-match-${uniqueSuffix}`;

    await page.fill('#entry-title', sensitiveTitle);
    await page.fill('#entry-slug', sensitiveSlug);
    await page.fill('#entry-date', '2026-11-10');
    // Body containing AWS secret token matching pattern
    const mockAccessKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
    await page.fill(
      '#entry-body',
      `Configuring production bucket with AWS_ACCESS_KEY_ID: ${mockAccessKey} for data replication.`
    );

    // Open dialog
    await openDialogBtn.click();
    await expect(publishDialog).toBeVisible();

    // Auto-run scanner flags sensitive match
    await expect(findingsNotice).toBeVisible();
    await expect(findingsNotice).toContainText(/findings|finding|matches|needs review/i);

    // NDA confirmation section is required when matches exist
    await expect(ndaSection).toBeVisible();
    await expect(ndaCheckbox).not.toBeChecked();

    // Attempting to publish without checking NDA blocks publication
    await confirmPublishBtn.click();
    // Dialog stays open and shows blocking alert
    await expect(publishDialog).toBeVisible();
    const ndaAlert = publishDialog.locator('#publish-dialog-alert');
    await expect(ndaAlert).toBeVisible();
    await expect(ndaAlert).toContainText(/confidentiality|nda.*required/i);

    // Confirming NDA unblocks publication
    await ndaCheckbox.check();
    await confirmPublishBtn.click();

    // Succeeded and closed
    await expect(publishDialog).toBeHidden();
    const statusLine = page.locator('#editor-status-line');
    await expect(statusLine).toBeVisible();
    await expect(statusLine).toContainText(new RegExp(`Published.*${sensitiveTitle}`, 'i'));
  });
});
