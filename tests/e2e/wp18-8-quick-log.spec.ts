import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-18.8 Quick Log capture route E2E', () => {
  test('redirects unauthenticated visitors and completes 390px mobile capture in under 30s with zero overflow', async ({
    page,
    context,
  }) => {
    // 1. Unauthenticated access to /admin/quick-log and /quick-log redirects to /admin/login
    await context.clearCookies();
    await page.goto('/admin/quick-log');
    expect(page.url()).toContain('/admin/login');
    await page.goto('/quick-log');
    expect(page.url()).toContain('/admin/login');

    // 2. Web app manifest exposes Quick Log shortcut
    const manifestRes = await page.request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();
    expect(manifest.shortcuts.some((s: any) => s.url === '/admin/quick-log')).toBe(true);

    // 3. Authenticated mobile-first 390px capture in < 30s
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const startMs = Date.now();
    await page.goto('/quick-log', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/admin/quick-log');

    // Zero horizontal overflow at 390px
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.fill('#ql-happened', 'Migrated cache layer to regional read replicas');
    await page.fill('#ql-decided', 'Kept write path single-region for strong consistency');
    await page.fill('#ql-learned', 'P95 read latency dropped by 40 percent');
    await page.click('#btn-ql-save');

    await expect(page.locator('#ql-status')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#ql-status')).toContainText('Saved private draft');
    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeLessThan(30_000);
  });
});
