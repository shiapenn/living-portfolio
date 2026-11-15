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
    await expect(pane).toBeVisible();
    await expect(pane.locator('.lp-inspector-levels')).toBeVisible();
    await expect(pane.locator('.lp-inspector-next-step')).toBeVisible();

    const tabs = pane.locator('[role="tab"]');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('Structure');
    await expect(tabs.nth(1)).toContainText('Context');
    await expect(tabs.nth(2)).toContainText('Evidence');
    await expect(tabs.nth(3)).toContainText('Answerability');
    await expect(tabs.nth(4)).toContainText('History');

    // Keyboard ArrowRight switches tabs
    await tabs.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(pane.locator('#ref-inspector-tabs-panel-context .lp-inspector-explainer')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(4)).toHaveAttribute('aria-selected', 'true');

    const historyLink = pane.locator(`a[href="/admin/entries/${entryId}/history"]`);
    await expect(historyLink).toBeVisible();
  });

  test('/admin/entries/:id/history lists revisions and restores an earlier revision as a new revision', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    await page.goto('/admin/entries/new');
    await page.fill('#ref-field-title', 'History Restore Test Entry');
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

    await expect(rows).toHaveCount(3);
  });
});
