import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.5: Audit Contradictions, Calibration & Structure (/admin/audit, /admin/calibration, /admin/structure)', () => {
  test('Contradictions tab runs check, Calibration applies and rolls back a change, and Structure saves exclusions', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. Audit > Contradictions
    await page.goto('/admin/audit?status=contradictions');
    await expect(page.locator('#audit-conflicts-section')).toBeVisible();
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /clean|found/);

    // 2. Calibration: apply a parameter change via API and roll it back via UI
    const csrf = await page.evaluate(() => sessionStorage.getItem('lp_csrf_token') || '');
    const applyRes = await page.request.post('/api/calibration/apply', {
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      data: { parameter: 'tier1_floor', new_value: 0.84, evidence_count: 25, force: true },
    });
    expect(applyRes.status()).toBe(200);

    await page.goto('/admin/calibration');
    await expect(page.locator('h1')).toContainText('Calibration');
    await expect(page.locator('#calibration-history-list')).toContainText('tier1_floor');
    const rollbackBtn = page.locator('#calibration-history-list button[data-rollback-id]').first();
    await expect(rollbackBtn).toBeVisible();
    await rollbackBtn.click();
    await expect(page.locator('h1')).toContainText('Calibration');

    // 3. Structure: profiles list & redaction exclusions persist
    await page.goto('/admin/structure');
    await expect(page.locator('h1')).toContainText('Structure');
    await expect(page.locator('#structure-profiles-list')).toBeVisible();
    await page.fill('#structure-redaction-exclusions', 'Project Falcon\nCodename Aurora');
    await page.click('#btn-save-structure-exclusions');
    await expect(page.locator('#structure-status-line')).toContainText('Saved.');
    await page.reload();
    await expect(page.locator('#structure-redaction-exclusions')).toHaveValue('Project Falcon\nCodename Aurora');
  });
});
