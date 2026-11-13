import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.7 Hotfix: Single Publish Path, Dialog Step Numbering, Working Undo, and Unlisted Verification', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const entryTitle = `WP-14.7 Hotfix Entry ${uniqueSuffix}`;
  const entrySlug = `wp-14-7-hotfix-${uniqueSuffix}`;
  const initialBody = '## Initial Clean Body\n\nThis is the original clean body text before any edits.';

  test('1. Single Publish button (#btn-open-publish-dialog only; #btn-publish-entry removed) and server/UI refusal without a passing scan (UX-57)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Duplicate plain "Publish" button must not exist
    await expect(page.locator('#btn-publish-entry')).toHaveCount(0);
    // Single primary "Publish…" button opens pre-flight dialog
    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    await expect(openDialogBtn).toBeVisible();
    await expect(openDialogBtn).toHaveText('Publish…');

    await page.fill('#entry-title', entryTitle);
    await page.fill('#entry-slug', entrySlug);
    await page.fill('#entry-date', '2026-11-13');
    await page.fill('#entry-body', initialBody);

    // Calling commitEntry('publish') directly without a scan token must be refused and never auto-scan silently
    const bypassed = await page.evaluate(async () => {
      return await (window as any).commitEntry('publish');
    });
    expect(bypassed).toBe(false);
    await expect(page.locator('#editor-status-line')).toContainText(/Redaction preview check is required|Check for private details/i);
    await expect(page.locator('#chip-current-state')).toContainText(/private|draft/i);

    // Save as draft first, and verify server did not mint a preview token and refuses direct PUT visibility=public without token
    await page.click('#btn-save-draft');
    await expect(page.locator('#editor-status-line')).toContainText(new RegExp(`(Created|Saved) draft.*${entryTitle}`, 'i'));
    const entryId = await page.locator('#entry-id').inputValue();
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

  test('2. Pre-flight dialog headings number 1, 2, 3 when NDA section is hidden and 1, 2, 3, 4 when NDA section is shown (UX-58)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Select the saved draft entry from the list
    const listItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: entryTitle });
    await listItem.click();
    await expect(page.locator('#entry-title')).toHaveValue(entryTitle);
    await expect(page.locator('#entry-body')).toHaveValue(initialBody);

    const openDialogBtn = page.locator('#btn-open-publish-dialog');
    const publishDialog = page.locator('#publish-dialog');

    // Open dialog with clean text -> NDA section is hidden -> visible step headings must be 1, 2, 3
    await openDialogBtn.click();
    await expect(publishDialog).toBeVisible();
    await expect(publishDialog.locator('#publish-scan-status')).toContainText(/nothing found|0 confidential/i);
    await expect(publishDialog.locator('#publish-nda-section')).toBeHidden();

    const cleanHeadings = await publishDialog.locator('[data-dialog-step-heading]').evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => (el.textContent || '').trim())
    );
    expect(cleanHeadings).toEqual([
      '1. Private-Detail Check',
      '2. Who Can See It',
      '3. What Happens Next',
    ]);

    await page.click('#btn-close-publish-dialog');
    await expect(publishDialog).toBeHidden();

    // Now test with a sensitive match -> NDA section is visible -> visible step headings must be 1, 2, 3, 4
    const mockAwsKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
    await page.fill('#entry-body', `Draft with temporary key ${mockAwsKey} for numbering check.`);
    await openDialogBtn.click();
    await expect(publishDialog).toBeVisible();
    await expect(publishDialog.locator('#publish-nda-section')).toBeVisible();

    const flaggedHeadings = await publishDialog.locator('[data-dialog-step-heading]').evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => (el.textContent || '').trim())
    );
    expect(flaggedHeadings).toEqual([
      '1. Private-Detail Check',
      '2. Confidentiality & NDA Confirmation',
      '3. Who Can See It',
      '4. What Happens Next',
    ]);

    await page.click('#btn-close-publish-dialog');
    await expect(publishDialog).toBeHidden();

    // Restore clean body and publish via dialog
    await page.fill('#entry-body', initialBody);
    await openDialogBtn.click();
    await expect(publishDialog.locator('#publish-scan-status')).toContainText(/nothing found|0 confidential/i);
    await page.click('#btn-confirm-publish');
    await expect(publishDialog).toBeHidden();
    await expect(page.locator('#chip-current-state')).toContainText(/State: PUBLIC/i);
  });

  test('3. Undo works from BOTH #editor-status-line and #editor-toast: after Unpublish (restores Public) and after Save draft with changed text (restores earlier text) (UX-04)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const listItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: entryTitle });
    await listItem.click();
    await expect(page.locator('#chip-current-state')).toContainText(/State: PUBLIC/i);
    const entryId = await page.locator('#entry-id').inputValue();

    // --- Part A: Unpublish -> click Undo in #editor-status-line -> restores Public ---
    await page.click('#btn-unpublish');
    await expect(page.locator('#chip-current-state')).toContainText(/PRIVATE/i);

    const statusLineUndoBtn = page.locator('#editor-status-line #btn-undo-status-line');
    await expect(statusLineUndoBtn).toBeVisible();
    await expect(statusLineUndoBtn).toContainText(/Undo \(\d+s\)/);

    await statusLineUndoBtn.click();
    await expect(page.locator('#chip-current-state')).toContainText(/State: PUBLIC/i);

    // Verify server visibility is 'public'
    const visAfterStatusUndo = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${id}`);
      const data = await res.json();
      return data.entry.visibility;
    }, entryId);
    expect(visAfterStatusUndo).toBe('public');

    // --- Part B: Unpublish -> click Undo in #editor-toast -> restores Public ---
    await page.click('#btn-unpublish');
    await expect(page.locator('#chip-current-state')).toContainText(/PRIVATE/i);

    const toastUndoBtn = page.locator('#editor-toast #btn-undo-toast');
    await expect(toastUndoBtn).toBeVisible();
    await expect(toastUndoBtn).toContainText(/Undo \(\d+s\)/);

    await toastUndoBtn.click();
    await expect(page.locator('#chip-current-state')).toContainText(/State: PUBLIC/i);

    const visAfterToastUndo = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${id}`);
      const data = await res.json();
      return data.entry.visibility;
    }, entryId);
    expect(visAfterToastUndo).toBe('public');

    // --- Part C: Save draft with changed text -> click Undo in #editor-status-line -> restores earlier text ---
    const editedBody1 = '## Edited Body Version 1\n\nThis text replaced the original body during Save draft.';
    await page.fill('#entry-body', editedBody1);
    await page.click('#btn-save-draft');

    await expect(page.locator('#editor-status-line')).toContainText(new RegExp(`Saved changes.*${entryTitle}`, 'i'));
    await expect(statusLineUndoBtn).toBeVisible();

    // Click Undo inside #editor-status-line
    await statusLineUndoBtn.click();
    await expect(page.locator('#entry-body')).toHaveValue(initialBody);

    const bodyOnServerAfterStatusUndo = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${id}`);
      const data = await res.json();
      return (data.revision || data.currentRevision).body_md;
    }, entryId);
    expect(bodyOnServerAfterStatusUndo).toBe(initialBody);

    // --- Part D: Save draft with changed text -> click Undo in #editor-toast -> restores earlier text ---
    const editedBody2 = '## Edited Body Version 2\n\nSecond edit to verify Undo from toast.';
    await page.fill('#entry-body', editedBody2);
    await page.click('#btn-save-draft');

    await expect(toastUndoBtn).toBeVisible();
    await toastUndoBtn.click();
    await expect(page.locator('#entry-body')).toHaveValue(initialBody);

    const bodyOnServerAfterToastUndo = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${id}`);
      const data = await res.json();
      return (data.revision || data.currentRevision).body_md;
    }, entryId);
    expect(bodyOnServerAfterToastUndo).toBe(initialBody);
  });

  test('4. Unlisted entry is excluded from public lists (/, /work) and opens by direct link (/work/:slug) (UX-59)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const listItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: entryTitle });
    await listItem.click();

    await page.click('#btn-unlist');
    await expect(page.locator('#chip-current-state')).toContainText(/State: UNLISTED/i);
    await expect(listItem).toContainText('unlisted');

    // Check public /work list: must NOT contain unlisted entry
    await page.goto('/work');
    await expect(page.locator('body')).not.toContainText(entryTitle);

    // Check public home page /: must NOT contain unlisted entry
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText(entryTitle);

    // Check direct link /work/:slug: MUST open and display title and body
    const directRes = await page.goto(`/work/${entrySlug}`);
    expect(directRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(entryTitle);
    await expect(page.locator('article')).toContainText('This is the original clean body text before any edits.');
  });
});
