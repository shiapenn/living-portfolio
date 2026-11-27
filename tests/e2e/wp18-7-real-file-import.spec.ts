import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-18.7 Real file import UI E2E', () => {
  test('uploads .md and corrupt .pdf in /admin/import, surfaces per-file error, and feeds parsed entry into Plan -> Review -> Done', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/import', { waitUntil: 'networkidle' });

    await page.setInputFiles('#import-files-input', [
      {
        name: 'synthetic-notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Uploaded Architecture Note\n\nParsed from real file upload.', 'utf8'),
      },
      {
        name: 'corrupt.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('NOT_A_VALID_PDF', 'utf8'),
      },
    ]);

    await expect(page.locator('#import-files-status')).toContainText('1 document(s) parsed, 1 error(s)');
    await expect(page.locator('#import-status-banner')).toContainText('corrupt.pdf');
    expect(await page.locator('#import-paste-area').inputValue()).toContain('Uploaded Architecture Note');

    await page.click('#btn-generate-plan');
    await expect(page.locator('#import-step-plan')).toBeVisible();
    await page.click('#btn-proceed-triage');
    await expect(page.locator('#import-step-triage')).toBeVisible();
    await page.locator('[data-item-action="include"][data-index="0"]').click();
    await page.click('#btn-commit-batch');
    await expect(page.locator('#import-step-done')).toBeVisible();
  });
});
