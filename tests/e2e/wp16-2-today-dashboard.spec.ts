import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.2 Today Dashboard (D-UI-1..D-UI-6)', () => {
  test('renders Today dashboard inside admin shell with needs-attention items and 0 overflow at 320px', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/today');
    await expect(page.locator('h1')).toContainText('Today');
    await expect(page.locator('#lp-admin-rail')).toBeVisible();
    await expect(page.locator('#today-attention-list')).toBeVisible();
    await expect(page.locator('#today-explanation')).toBeVisible();
    await expect(page.locator('nav.site-nav, footer.site-footer')).toHaveCount(0);

    // 320px responsiveness check
    await page.setViewportSize({ width: 320, height: 640 });
    await page.reload();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('checklist dismissal persists on the server across page reload', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/today');
    const checklist = page.locator('#today-checklist-card');
    await expect(checklist).toBeVisible();

    const [patchRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/settings/dashboard') && r.request().method() === 'PATCH'),
      page.locator('#btn-dismiss-today-checklist').click(),
    ]);
    expect(patchRes.status()).toBe(200);
    await expect(checklist).toBeHidden();

    // Reload and verify server-persisted dismissal
    await page.reload();
    await expect(page.locator('#today-checklist-card')).toHaveCount(0);

    // Restore checklist state so test is idempotent
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token') || '';
      await fetch('/api/settings/dashboard', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ checklistDismissed: false }),
      });
    });
  });
});
