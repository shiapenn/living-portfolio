import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.3: Backups, Export & Visibility (/admin/settings/backups, /admin/settings/visibility)', () => {
  test('Backups shows honest availability, named archive export, and Visibility updates /robots.txt', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. Backups page
    await page.goto('/admin/settings/backups');
    await expect(page.locator('h1')).toContainText('Backups');
    await expect(page.locator('#backups-explain-section')).toBeVisible();
    await expect(page.locator('#btn-export-archive')).toHaveAttribute('href', '/api/settings/export');

    // Verify export returns Content-Disposition with a named archive filename
    const exportRes = await page.request.get('/api/settings/export');
    expect(exportRes.status()).toBe(200);
    const cd = exportRes.headers()['content-disposition'] || '';
    expect(cd).toMatch(/attachment;\s*filename="living-portfolio-export-\d{4}-\d{2}-\d{2}\.json"/);

    // Clicking restore drill without destination shows honest plain-language message
    await page.click('#btn-run-backup-drill');
    await expect(page.locator('#backup-drill-result')).toContainText(/Not available|passed/i);

    // 2. Visibility page & dynamic /robots.txt
    await page.goto('/admin/settings/visibility');
    await expect(page.locator('h1')).toContainText('Visibility');
    await expect(page.locator('#visibility-explain-section')).toBeVisible();

    // Default robots.txt disallows /admin, /api, /ask/status
    const robotsDefault = await (await page.request.get('/robots.txt')).text();
    expect(robotsDefault).toContain('Disallow: /admin');
    expect(robotsDefault).toContain('Disallow: /api');
    expect(robotsDefault).toContain('Disallow: /ask/status');
    expect(robotsDefault).not.toContain('User-agent: GPTBot');

    // Enable AI crawler blocking and save
    await page.locator('label:has(#setting-vis-ai-crawlers)').click();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    const robotsAiBlocked = await (await page.request.get('/robots.txt')).text();
    expect(robotsAiBlocked).toContain('User-agent: GPTBot');
    expect(robotsAiBlocked).toContain('User-agent: ClaudeBot');

    // Restore default
    await page.locator('label:has(#setting-vis-ai-crawlers)').click();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');
  });
});
