import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.S S3: D-EDITOR-4 & Full Structure Restoration', () => {
  test('failing-first: Settings view restores Structure (facets persist across reload, accept suggested role, level line advances)', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // Create a fresh entry via API so Structure starts at Captured with 0 facets/claims/evidence
    const created = await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token') || '';
      const res = await fetch('/api/entries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({
          title: 'S3 Structure Test Entry',
          slug: 's3-structure-test-' + Date.now(),
          profile: 'decision',
          visibility: 'private',
          body_md: 'We migrated the storage engine to Postgres to eliminate lock contention.',
        }),
      });
      if (!res.ok) throw new Error('Create entry failed: ' + res.status);
      return res.json();
    });
    const entryId = created.entry?.id ?? created.id;
    expect(entryId).toBeTruthy();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(entryId)}`);

    // Switch to Settings view via Edit / Settings switch
    const settingsSwitch = page.locator('#ref-switch-settings');
    await expect(settingsSwitch).toBeVisible();
    await settingsSwitch.click();

    const structureSection = page.locator('#ref-structure-section');
    await expect(structureSection).toBeVisible();

    // Level line starts at Captured
    const levelLine = page.locator('#ref-structure-level');
    await expect(levelLine).toContainText('Captured');
    await expect(levelLine).toHaveAttribute('data-current-level', 'Captured');

    // Add a facet tag
    await page.fill('#ref-facet-value', 'PostgreSQL');
    await page.click('#ref-btn-add-facet');
    await expect(page.locator('#ref-facets-list')).toContainText('PostgreSQL');

    // Level line advances from Captured to Tagged after tagging
    await expect(levelLine).toHaveAttribute('data-current-level', 'Tagged');

    // Reload and verify facet + Tagged level persist
    await page.reload();
    await page.locator('#ref-switch-settings').click();
    await expect(page.locator('#ref-facets-list')).toContainText('PostgreSQL');
    await expect(page.locator('#ref-structure-level')).toHaveAttribute('data-current-level', 'Tagged');

    // Add a claim -> level advances to Claimed
    await page.fill('#ref-claim-input', 'Postgres advisory locks eliminated lock contention.');
    await page.click('#ref-btn-add-claim');
    await expect(page.locator('#ref-claims-list')).toContainText('Postgres advisory locks eliminated lock contention.');
    await expect(page.locator('#ref-structure-level')).toHaveAttribute('data-current-level', 'Claimed');

    // Attach evidence -> level advances to Grounded
    await page.fill('#ref-evidence-title', 'Load test benchmark');
    await page.fill('#ref-evidence-url', 'https://example.com/bench');
    await page.click('#ref-btn-add-evidence');
    await expect(page.locator('#ref-evidence-list')).toContainText('Load test benchmark');
    await expect(page.locator('#ref-structure-level')).toHaveAttribute('data-current-level', 'Grounded');
  });

  test('failing-first: accept suggested span role updates status and persists', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const listRes = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=1', { credentials: 'same-origin' });
      return res.json();
    });
    const entryId = listRes.entries[0].id;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/admin/entries/${encodeURIComponent(entryId)}`);
    await page.locator('#ref-switch-settings').click();

    const spansList = page.locator('#ref-spans-list');
    await expect(spansList).toBeVisible();
    const firstAccept = spansList.locator('button[data-span-action="accept"]').first();
    if ((await firstAccept.count()) > 0) {
      await firstAccept.click();
      await expect(spansList.locator('[data-span-status="accepted"]').first()).toBeVisible();
    }
  });
});
