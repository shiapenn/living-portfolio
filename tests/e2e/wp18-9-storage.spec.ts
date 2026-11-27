import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { getCsrfHeaders } from './wp17-manifest.js';

const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

test.describe('WP-18.9 Settings > Storage module E2E', () => {
  test('shows usage, backend, editable limits, blocks deleting published-referenced asset, and deletes unreferenced asset via confirmation dialog', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    const headers = await getCsrfHeaders(page);
    const csrfOnly = { 'X-CSRF-Token': headers['X-CSRF-Token'] };

    // 1. Upload one referenced image (attached to a published public entry) and one unreferenced image
    const refUp = await (
      await page.request.post('/api/media', {
        headers: csrfOnly,
        multipart: { file: { name: 'published-hero.png', mimeType: 'image/png', buffer: TINY_PNG } },
      })
    ).json();
    const unrefUp = await (
      await page.request.post('/api/media', {
        headers: csrfOnly,
        multipart: { file: { name: 'unused-scratch.png', mimeType: 'image/png', buffer: TINY_PNG } },
      })
    ).json();

    const slug = `wp18-9-storage-${Date.now()}`;
    const bodyMd = `![Published Hero](/api/media/${refUp.id})`;
    const preview = await (
      await page.request.post('/api/entries/redaction-preview', {
        headers,
        data: { entryId: 'draft', text: bodyMd },
      })
    ).json();
    await page.request.post('/api/entries', {
      headers,
      data: {
        title: 'Storage Ref Entry',
        slug,
        profile: 'case-study',
        visibility: 'public',
        body_md: bodyMd,
        redactionPreviewToken: preview.redactionPreviewToken,
      },
    });

    // 2. Settings index lists Storage
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await expect(page.locator('#settings-row-storage')).toBeVisible();
    await page.click('#settings-row-storage');
    await expect(page).toHaveURL(/\/admin\/settings\/storage/);

    // 3. Usage, backend, and editable upload limits
    await expect(page.locator('#storage-backend-value')).toContainText('Local volume');
    await expect(page.locator('#storage-usage-summary')).toContainText('of');
    await page.fill('#setting-storage-max-image-mb', '15');
    await page.click('#btn-save-storage-settings');
    await expect(page.locator('#storage-save-status')).toContainText('Storage limits saved.');

    // 4. Published-referenced asset shows inline block explanation and has no Delete button
    const refRow = page.locator(`[data-media-id="${refUp.id}"]`);
    await expect(refRow).toBeVisible();
    await expect(refRow.locator('[data-media-blocked="true"]')).toContainText('published entry');

    // 5. Unreferenced asset deletes via confirmation Overlay dialog
    const unrefRow = page.locator(`[data-media-id="${unrefUp.id}"]`);
    await expect(unrefRow).toBeVisible();
    await unrefRow.locator(`[data-storage-delete="${unrefUp.id}"]`).click();
    await expect(page.locator('#storage-delete-dialog')).toBeVisible();
    await page.click('#btn-storage-delete-confirm');
    await expect(page.locator('#storage-delete-dialog')).toBeHidden();
    await expect(page.locator(`[data-media-id="${unrefUp.id}"]`)).toHaveCount(0);

    // 6. Remove unused opens confirmation dialog
    await page.click('#btn-storage-remove-unused');
    await expect(page.locator('#storage-prune-dialog')).toBeVisible();
    await page.click('#btn-storage-prune-cancel');
    await expect(page.locator('#storage-prune-dialog')).toBeHidden();
  });
});
