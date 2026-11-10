import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.2: State chip and date correctness (UX-10, UX-11, UX-22)', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  test('1. State chip displays Draft, Public, and Unlisted across lifecycle actions (UX-10)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const stateChip = page.locator('#chip-current-state');
    // Fresh new entry defaults to Draft
    await expect(stateChip).toBeVisible();
    await expect(stateChip).toContainText(/draft/i);

    const title = `WP-14.2 Chip Lifecycle ${uniqueSuffix}`;
    const slug = `wp-14-2-chip-${uniqueSuffix}`;

    await page.fill('#entry-title', title);
    await page.fill('#entry-slug', slug);
    await page.fill('#entry-body', 'Testing state chip visibility across lifecycle states.');

    // Save as draft
    await page.click('#btn-save-draft');
    await expect(stateChip).toContainText(/draft/i);

    // Publish to public
    await page.click('#btn-redaction-check');
    await expect(page.locator('#redaction-preview-box')).toBeVisible();
    await page.click('#btn-publish-entry');
    await expect(stateChip).toContainText(/public/i);

    // Unlist
    await page.click('#btn-unlist');
    await expect(stateChip).toContainText(/unlisted/i);
  });

  test('2. Date defaults to today and clearing the date shows inline error without throwing (UX-11)', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // Listen for uncaught page errors to assert RangeError is never thrown
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/admin');

    const dateInput = page.locator('#entry-date');
    await expect(dateInput).toBeVisible();

    // Verify date defaults to today on the client
    const todayYmd = new Date().toISOString().slice(0, 10);
    const initialDateVal = await dateInput.inputValue();
    expect(initialDateVal).toBe(todayYmd);

    // Clear the date field
    await dateInput.fill('');
    await dateInput.blur();

    // Verify inline error appears
    const dateError = page.locator('#entry-date-error');
    await expect(dateError).toBeVisible({ timeout: 3000 });
    await expect(dateError).toContainText(/valid date.*required|date.*cannot be empty/i);

    // Attempting to save with empty date must be guarded gracefully without throwing
    await page.fill('#entry-title', `Empty Date Test ${uniqueSuffix}`);
    await page.fill('#entry-body', 'Content with empty date.');
    await page.click('#btn-save-draft');

    const statusLine = page.locator('#editor-status-line');
    await expect(statusLine).toBeVisible();
    await expect(statusLine).toContainText(/date/i);

    // Zero unhandled JavaScript exceptions thrown
    expect(pageErrors.filter((e) => e.message.includes('RangeError') || e.message.includes('Invalid time value'))).toHaveLength(0);
  });

  test('3. Temporal confidence control allows Estimated and Range (with range end) and stores them (UX-22)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const temporalSelect = page.locator('#entry-temporal-level');
    const rangeEndContainer = page.locator('#range-end-container');
    const rangeEndInput = page.locator('#entry-date-range-end');

    await expect(temporalSelect).toBeVisible();
    // Default or exact option
    await expect(temporalSelect.locator('option')).toHaveCount(3);

    // 3a. Test Estimated
    const estimatedTitle = `Estimated Date Test ${uniqueSuffix}`;
    const estimatedSlug = `estimated-${uniqueSuffix}`;

    await page.fill('#entry-title', estimatedTitle);
    await page.fill('#entry-slug', estimatedSlug);
    await page.fill('#entry-body', 'Testing temporal confidence level: estimated.');
    await temporalSelect.selectOption('estimated');

    // Range end input should be hidden when not 'range'
    await expect(rangeEndContainer).toBeHidden();

    await page.click('#btn-save-draft');
    await expect(page.locator('#editor-status-line')).toContainText(new RegExp(`Saved.*${estimatedTitle}|Created.*${estimatedTitle}`, 'i'));

    // Reload or re-select to verify persistence
    const entryItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: estimatedTitle });
    await entryItem.click();
    await expect(temporalSelect).toHaveValue('estimated');

    // 3b. Test Range with range end
    const rangeTitle = `Range Date Test ${uniqueSuffix}`;
    const rangeSlug = `range-${uniqueSuffix}`;

    await page.click('#btn-new-entry');
    await page.fill('#entry-title', rangeTitle);
    await page.fill('#entry-slug', rangeSlug);
    await page.fill('#entry-date', '2026-11-01');
    await page.fill('#entry-body', 'Testing temporal confidence level: range.');

    await temporalSelect.selectOption('range');
    await expect(rangeEndContainer).toBeVisible();

    await rangeEndInput.fill('2026-11-20');
    await page.click('#btn-save-draft');
    await expect(page.locator('#editor-status-line')).toContainText(new RegExp(`Saved.*${rangeTitle}|Created.*${rangeTitle}`, 'i'));

    // Re-select entry to verify Range persistence
    const rangeEntryItem = page.locator('#admin-entries-list li[data-entry-id]').filter({ hasText: rangeTitle });
    await rangeEntryItem.click();
    await expect(temporalSelect).toHaveValue('range');
    await expect(rangeEndInput).toHaveValue('2026-11-20');
  });
});
