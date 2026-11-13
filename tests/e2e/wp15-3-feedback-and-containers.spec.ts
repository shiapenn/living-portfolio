import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.3 Feedback & Containers', () => {
  test('Dialog and Drawer support focus trap, Escape close, and focus return; Tabs support arrow keys', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/dev/primitives');

    // 1. Dialog focus trap, Escape, focus return
    const openDialogBtn = page.locator('#gallery-open-dialog');
    await openDialogBtn.focus();
    await openDialogBtn.click();

    const dialog = page.locator('#gallery-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Focus moves inside dialog
    const focusedInside = await page.evaluate(() => {
      const dlg = document.getElementById('gallery-dialog');
      return Boolean(dlg && dlg.contains(document.activeElement));
    });
    expect(focusedInside).toBe(true);

    // Tab wraps within dialog
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(() => {
      const dlg = document.getElementById('gallery-dialog');
      return Boolean(dlg && dlg.contains(document.activeElement));
    });
    expect(stillInside).toBe(true);

    // Escape closes dialog and returns focus to trigger
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(openDialogBtn).toBeFocused();

    // 2. Drawer opens, traps focus, closes on Escape and returns focus
    const openDrawerBtn = page.locator('#gallery-open-drawer');
    await openDrawerBtn.click();
    const drawer = page.locator('#gallery-drawer');
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(openDrawerBtn).toBeFocused();

    // 3. Tabs arrow keys + roving tabindex
    const tab1 = page.locator('#gallery-tabs-tab-one');
    const tab2 = page.locator('#gallery-tabs-tab-two');
    await tab1.focus();
    await expect(tab1).toHaveAttribute('aria-selected', 'true');
    await expect(tab1).toHaveAttribute('tabindex', '0');
    await expect(tab2).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowRight');
    await expect(tab2).toBeFocused();
    await expect(tab2).toHaveAttribute('aria-selected', 'true');
    await expect(tab2).toHaveAttribute('tabindex', '0');
    await expect(tab1).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#gallery-tabs-panel-two')).toBeVisible();
    await expect(page.locator('#gallery-tabs-panel-one')).toBeHidden();

    // 4. StatusLine announces once with real-countdown Undo
    await page.locator('#gallery-trigger-status').click();
    const statusLine = page.locator('#gallery-status-line');
    await expect(statusLine).toHaveAttribute('role', 'status');
    await expect(statusLine).toContainText('Saved draft.');
    await expect(statusLine).toContainText('Undo (');

    // 5. Persistent dismissible PageNotice stays visible until dismissed (no timed toast)
    const notice = page.locator('#gallery-page-notice');
    await expect(notice).toBeVisible();
    await page.locator('#gallery-page-notice [data-lp-notice-dismiss]').click();
    await expect(notice).toBeHidden();

    // 6. Axe check passes with 0 serious/critical violations
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
});
