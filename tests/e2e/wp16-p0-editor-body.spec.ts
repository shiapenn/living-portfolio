import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('P0: Dedicated editor loads and preserves existing entry body', () => {
  test('opening an existing entry on /admin/entries/:id loads its body and saving without edits preserves it', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const target = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=20', { credentials: 'same-origin' });
      const data = await res.json();
      const entries = data.entries || [];
      return (
        entries.find((e: any) => e.title === 'Distributed Webhook Coordination with Redis Locks') ||
        entries.find((e: any) => typeof e.revision?.body_md === 'string' && e.revision.body_md.trim().length > 0)
      );
    });

    expect(target).toBeTruthy();
    const expectedBody = target.revision?.body_md ?? '';
    expect(expectedBody.trim().length).toBeGreaterThan(0);

    await page.goto(`/admin/entries/${encodeURIComponent(target.id)}`);
    await expect(page.locator('#ref-field-title')).toHaveValue(target.title);
    await expect(page.locator('#ref-field-body')).toHaveValue(expectedBody);

    // Save without changes and verify stored body is unchanged
    await page.click('#ref-btn-save');
    await expect(page.locator('#ref-status-line')).toContainText(/saved|no changes to save/i);

    const afterSave = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      return res.json();
    }, target.id);

    expect(afterSave.currentRevision?.body_md).toBe(expectedBody);
  });
});
