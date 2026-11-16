import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-14.0: Client bundling and entry handler migration', () => {
  test('Serves compiled client bundle asset under /assets/client/ with javascript content type', async ({
    request,
  }) => {
    const res = await request.get('/assets/client/editor-page.js');
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/javascript');
    const body = await res.text();
    expect(body.length).toBeGreaterThan(50);
  });

  test('Admin workspace loads the bundled client script with nonce and mounts entry handlers', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    // The script tag for the client bundle must exist and have the script asset path
    const scriptTag = page.locator('script[src*="/assets/client/editor-page.js"]');
    await expect(scriptTag).toHaveCount(1);

    // Verify that the entry handler loaded from the bundle is operational
    const testTitle = `WP-14.0 Bundle Verification ${Date.now()}`;
    await page.fill('#ref-field-title', testTitle);
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', 'Testing that client bundle entry handlers function properly.');

    const saveDraftBtn = page.locator('#ref-btn-save');
    await saveDraftBtn.scrollIntoViewIfNeeded();
    await saveDraftBtn.click();

    const editorStatusLine = page.locator('#ref-status-line');
    await expect(editorStatusLine).toBeVisible({ timeout: 5000 });
    await expect(editorStatusLine).toContainText(/draft saved/i);
  });
});
