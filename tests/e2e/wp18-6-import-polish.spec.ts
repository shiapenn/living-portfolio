import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-18.6 Import stepper polish E2E', () => {
  test('walks Add -> Plan (local-only without external provider) -> Review (per-item Include/Leave out/Change type/Set date + N of M reviewed) -> Done screen with 3 next steps & 1 return link', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/import', { waitUntil: 'networkidle' });

    // Step 1: Add material
    await page.click('#btn-load-sample');
    await page.click('#btn-generate-plan');

    // Step 2: Plan (no external provider in test env -> local summary only, no paid radio card)
    await expect(page.locator('#import-step-plan')).toBeVisible();
    await expect(page.locator('#plan-local-summary')).toBeVisible();
    await expect(page.locator('#plan-tier-paid')).toHaveCount(0);

    // Step 3: Review
    await page.click('#btn-proceed-triage');
    await expect(page.locator('#import-step-triage')).toBeVisible();
    await expect(page.locator('#import-review-counter')).toHaveText('0 of 3 reviewed');

    // Per-item Include, Leave out, Change type, Set date
    await page.locator('[data-item-action="include"][data-index="0"]').click();
    await expect(page.locator('#import-review-counter')).toHaveText('1 of 3 reviewed');

    await page.locator('[data-item-action="leave-out"][data-index="1"]').click();
    await expect(page.locator('#import-review-counter')).toHaveText('2 of 3 reviewed');

    await page.selectOption('#triage-profile-0', 'decision-record');
    await page.fill('#triage-date-0', '2026-10-15');
    expect(await page.locator('#triage-profile-0').inputValue()).toBe('decision-record');
    expect(await page.locator('#triage-date-0').inputValue()).toBe('2026-10-15');

    // Commit -> dedicated Done screen replaces in-place banner
    await page.click('#btn-commit-batch');
    await expect(page.locator('#import-step-done')).toBeVisible();
    await expect(page.locator('#import-step-triage')).toBeHidden();
    await expect(page.locator('#import-done-summary')).toContainText('Imported 1 entry as a private draft.');

    // 3 next steps + 1 return link
    const nextItems = page.locator('#import-done-next-steps [data-c="Item"]');
    await expect(nextItems).toHaveCount(3);
    await expect(page.locator('#btn-import-return-today')).toHaveAttribute('href', '/admin');

    // Clicking "Import more material" resets cleanly to Step 1
    await page.click('#btn-import-another');
    await expect(page.locator('#import-step-add')).toBeVisible();
    await expect(page.locator('#import-step-done')).toBeHidden();
  });
});
