import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.7 Reference Editor Page', () => {
  test('enforces interaction contract across all 6 states and 4-places-only live regions', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. First-run state (0 entries, walkthrough shown once)
    await page.goto('/admin/entries/editor?fixture=first-run');
    await expect(page.locator('#ref-walkthrough')).toBeVisible();
    await expect(page.locator('#ref-empty-state')).toBeVisible();
    await page.locator('#ref-walkthrough-dismiss').click();
    await expect(page.locator('#ref-walkthrough')).toBeHidden();

    // 2. Empty state (0 entries, walkthrough dismissed)
    await page.goto('/admin/entries/editor?fixture=empty');
    await expect(page.locator('#ref-empty-state')).toBeVisible();
    await expect(page.locator('#ref-walkthrough')).toBeHidden();

    // 3. Draft state: Save draft + Publish...
    await page.goto('/admin/entries/editor?fixture=draft');
    await expect(page.locator('#ref-btn-save')).toHaveText('Save draft');
    await expect(page.locator('#ref-btn-publish')).toHaveText('Publish…');
    await expect(page.locator('#ref-btn-publish')).toBeVisible();
    await expect(page.locator('#ref-visibility-select')).toBeHidden();
    await expect(page.locator('#ref-details-disclosure')).not.toHaveAttribute('open', '');
    await expect(page.locator('#ref-structure-drawer')).toBeHidden();

    // Verify 4-places-only role="status" / role="alert"
    const allowedIds = ['ref-page-notice', 'ref-status-line', 'ref-title-error', 'ref-body-error', 'ref-publish-dialog-status'];
    const liveIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="status"], [role="alert"]')).map((el) => el.id)
    );
    for (const id of liveIds) {
      expect(allowedIds).toContain(id);
    }

    // 4. Unlisted state: Save changes + Make public...
    await page.goto('/admin/entries/editor?fixture=unlisted');
    await expect(page.locator('#ref-btn-save')).toHaveText('Save changes');
    await expect(page.locator('#ref-btn-publish')).toHaveText('Make public…');
    await expect(page.locator('#ref-details-summary-meta')).toContainText('Unlisted');

    // 5. Public state: Save changes + Visibility menu + More menu (Delete last)
    await page.goto('/admin/entries/editor?fixture=public');
    await expect(page.locator('#ref-btn-save')).toHaveText('Save changes');
    await expect(page.locator('#ref-btn-publish')).toBeHidden();
    await expect(page.locator('#ref-visibility-menu-btn')).toBeVisible();
    await page.locator('#ref-more-menu-btn').click();
    const moreItems = page.locator('#ref-more-menu [role="menuitem"]');
    await expect(moreItems.last()).toContainText('Delete');

    // 6. Error state: persistent inline error with fix guidance
    await page.goto('/admin/entries/editor?fixture=error');
    await expect(page.locator('#ref-page-notice')).toBeVisible();
    await expect(page.locator('#ref-page-notice')).toContainText('Could not save');

    // 7. Axe accessibility check
    await page.goto('/admin/entries/editor?fixture=draft');
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
});
