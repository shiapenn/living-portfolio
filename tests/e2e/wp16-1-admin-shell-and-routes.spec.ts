import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/entries',
  '/admin/entries/new',
  '/admin/entries/demo-1',
  '/admin/entries/demo-1/history',
  '/admin/import',
  '/admin/quick-log',
  '/quick-log',
  '/admin/pages',
  '/admin/inbox',
  '/admin/inbox/esc-1',
  '/admin/bookings',
  '/admin/audit',
  '/admin/calibration',
  '/admin/structure',
  '/admin/routing',
  '/admin/theme',
  '/admin/settings',
  '/admin/settings/providers',
  '/admin/settings/connectors',
  '/admin/settings/notifications',
  '/admin/settings/backups',
  '/admin/settings/payments',
  '/admin/settings/home',
  '/admin/settings/visibility',
  '/admin/settings/account',
];

test.describe('WP-16.1 Admin Shell & Route Registry', () => {
  test('all §6.4 admin routes redirect to login/setup when signed out', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const route of ADMIN_ROUTES) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/(login|setup)/);
    }
    await context.close();
  });

  test('auth shell on /admin/login has brand + SVG theme toggle only (no public nav/footer, no admin rail)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin/login');
    await expect(page.locator('.site-nav')).toHaveCount(0);
    await expect(page.locator('.site-footer')).toHaveCount(0);
    await expect(page.locator('.lp-admin-rail')).toHaveCount(0);
    await expect(page.locator('.lp-admin-header-brand')).toBeVisible();
    await expect(page.locator('#theme-toggle svg.lp-icon')).toBeVisible();
    await context.close();
  });

  test('admin shell on /admin/settings and /admin/import: no public nav/footer, no Back to Workspace, 0 overflow at 320px (UX-101), status popover & account menu', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    for (const route of ['/admin/settings', '/admin/import']) {
      await page.goto(route);
      await expect(page.locator('.site-nav')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toHaveCount(0);
      await expect(page.locator('.lp-admin-rail')).toBeVisible();
      await expect(page.locator('a:has-text("Back to Workspace")')).toHaveCount(0);
      await expect(page.locator('#theme-toggle svg.lp-icon')).toBeVisible();
    }

    // Status popover with legend
    await page.locator('#lp-status-popover-btn').click();
    const popover = page.locator('#lp-status-popover');
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Site build');
    await expect(popover).toContainText('Automatic answers');
    await expect(popover).toContainText('System');
    await expect(popover.locator('a[href="/admin/routing"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();

    // Account menu with Sign out
    await page.locator('#lp-account-menu-btn').click();
    const acctMenu = page.locator('#lp-account-menu');
    await expect(acctMenu).toBeVisible();
    await expect(acctMenu.locator('#btn-admin-logout')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(acctMenu).toBeHidden();

    // UX-101: /admin/settings has 0 horizontal overflow at 320px
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/settings');
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('every §6.4 admin route renders 200 with title, h1, skip link, and zero public nav/footer when signed in', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const shellRoutes = ADMIN_ROUTES.filter((r) => !r.startsWith('/admin/entries/'));
    for (const route of shellRoutes) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('a.skip-link')).toHaveCount(1);
      await expect(page.locator('.site-nav')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toHaveCount(0);
    }
  });
});
