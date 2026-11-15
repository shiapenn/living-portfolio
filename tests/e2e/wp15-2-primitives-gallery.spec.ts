import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-15.2 Shared Primitives & Gallery', () => {
  test('dev gallery renders all primitives cleanly with axe, target sizes, roles, and cursor semantics', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/dev/primitives');

    await expect(page.getByRole('heading', { name: 'Primitives Gallery' })).toBeVisible();

    // Axe accessibility check in light theme
    const lightAxe = await new AxeBuilder({ page }).analyze();
    const seriousLight = lightAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(seriousLight).toEqual([]);

    // Target size check: every visible button/switch/interactive chip >= 36px height (D-MIN 3)
    const interactiveSelectors = [
      '#gallery-btn-primary',
      '#gallery-btn-secondary',
      '#gallery-btn-danger',
      '#gallery-btn-quiet',
      '#gallery-icon-btn',
      '#gallery-switch-on',
      '#gallery-chip-suggested',
    ];
    for (const sel of interactiveSelectors) {
      const el = page.locator(sel);
      await expect(el).toBeVisible();
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(36);
      const cursor = await el.evaluate((node) => getComputedStyle(node).cursor);
      expect(cursor).toBe('pointer');
    }

    // Non-interactive primitives must NOT have cursor: pointer
    const nonInteractiveSelectors = [
      '#gallery-badge-ok',
      '#gallery-status-dot',
      '#gallery-chip-confirmed',
    ];
    for (const sel of nonInteractiveSelectors) {
      const el = page.locator(sel);
      await expect(el).toBeVisible();
      const cursor = await el.evaluate((node) => getComputedStyle(node).cursor);
      expect(cursor).not.toBe('pointer');
    }

    // Switch role & aria-checked
    await expect(page.locator('#gallery-switch-on')).toHaveAttribute('role', 'switch');
    await expect(page.locator('#gallery-switch-on')).toHaveAttribute('aria-checked', 'true');

    // Field error linkage
    const errInput = page.locator('#gallery-field-error');
    await expect(errInput).toHaveAttribute('aria-invalid', 'true');
  });
});
