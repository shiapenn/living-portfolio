import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.6 Inbox & Answer Rules', () => {
  test('/admin/inbox lists escalations, filters by status, replies on /admin/inbox/:id, and creates a rule via "Make this a rule?"', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/inbox');
    await expect(page.locator('h1')).toContainText('Inbox');
    await expect(page.locator('#inbox-filter-pending')).toBeVisible();
    await expect(page.locator('#inbox-filter-approved')).toBeVisible();
    await expect(page.locator('#inbox-filter-rejected')).toBeVisible();

    if ((await page.locator('[data-inbox-row] a').count()) === 0) {
      await page.click('#inbox-filter-approved');
    }

    const firstItem = page.locator('[data-inbox-row] a').first();
    await expect(firstItem).toBeVisible();
    await firstItem.click();

    await expect(page.locator('#inbox-reply-text')).toBeVisible();
    await page.fill('#inbox-reply-text', 'I cannot share confidential client revenue figures.');
    await page.click('#inbox-btn-reply');

    // Inline "Make this a rule?" prompt appears after reply
    const ruleCard = page.locator('#inbox-make-rule-card');
    await expect(ruleCard).toBeVisible();
    await page.click('#inbox-btn-make-rule');
    await expect(page.locator('#inbox-status-line')).toContainText(/rule/i);
  });

  test('/admin/audit lists pending, active, and discarded rules with source quote & scope and can revoke a rule', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/audit');
    await expect(page.locator('h1')).toContainText('Answer rules');
    await expect(page.locator('#audit-tab-proposed')).toBeVisible();
    await expect(page.locator('#audit-tab-confirmed')).toBeVisible();
    await expect(page.locator('#audit-tab-revoked')).toBeVisible();

    const firstRule = page.locator('[data-rule-row]').first();
    await expect(firstRule).toBeVisible();
    await expect(firstRule).toContainText(/Source quote/i);

    const revokeBtn = firstRule.locator('button[data-rule-action="revoked"]');
    await revokeBtn.click();
    await page.click('#audit-tab-revoked');
    await expect(page.locator('[data-rule-row]').first()).toBeVisible();
  });
});
