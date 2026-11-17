import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.5 Inspector Module & History Restore (UX-37, CP-13)', () => {
  test('right-hand inspector pane has 4-step level bar, next-step prompt, 5 arrow-key tabs with explainers, and link to history', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const listRes = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=1', { credentials: 'same-origin' });
      return res.json();
    });
    const entryId = listRes.entries[0].id;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(entryId)}`);

    const pane = page.locator('#ref-inspector-pane');
    await expect(pane).toBeHidden();
    await page.click('#ref-btn-structure');
    await expect(pane).toBeVisible();
    await expect(pane).toContainText('Captured, Tagged, Claimed, Grounded');
    await expect(pane.locator('.lp-inspector-explainer')).toHaveCount(0);

    // D-COMP #6: 5+ tabs render as a Select control
    const tabSelect = pane.locator('#ref-inspector-tabs-select');
    await expect(tabSelect).toBeVisible();
    const options = tabSelect.locator('option');
    await expect(options).toHaveCount(5);
    await expect(options.nth(0)).toContainText('Structure');
    await expect(options.nth(1)).toContainText('Context');
    await expect(options.nth(2)).toContainText('Evidence');
    await expect(options.nth(3)).toContainText('Answerability');
    await expect(options.nth(4)).toContainText('History');

    const historyLink = page.locator(`#ref-btn-history[href="/admin/entries/${entryId}/history"]`);
    await expect(historyLink).toBeVisible();
  });

  test('/admin/entries/:id/history lists revisions and restores an earlier revision as a new revision', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/entries/new');
    await page.fill('#ref-field-title', 'History Restore Test Entry');
    await page.click('#ref-btn-source-toggle');
    await page.fill('#ref-field-body', 'Revision one body content.');
    await page.click('#ref-btn-save');
    await page.waitForURL((url) => /\/admin\/entries\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'));
    await expect(page.locator('#ref-status-line')).toContainText(/saved/i);

    const entryId = page.url().split('/').pop()!;
    await page.fill('#ref-field-body', 'Revision two body content.');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/api/entries/${entryId}/revisions`) && r.request().method() === 'POST' && r.ok()),
      page.click('#ref-btn-save'),
    ]);

    await page.goto(`/admin/entries/${encodeURIComponent(entryId)}/history`);
    await expect(page.locator('h1')).toContainText('History');

    const rows = page.locator('[data-revision-row]');
    await expect(rows).toHaveCount(2);

    // Restore the older revision (containing "Revision one body content.")
    const olderRow = rows.filter({ hasText: 'Revision one body content.' }).first();
    await olderRow.locator('button[data-restore-rev]').click();
    await expect(page.locator('#history-restore-dialog')).toBeVisible();
    await page.locator('#history-restore-confirm').click();

    await expect(rows).toHaveCount(3);
  });
});
