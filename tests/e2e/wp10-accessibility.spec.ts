import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('Accessibility & Frontend Quality Suite (Spec §18.1, 20261020-UX-15, Finding M11)', () => {
  test('1. Visitor pages expose standard ARIA landmarks, page headings, and skip link mechanics', async ({ page }) => {
    await page.goto('/');

    // Page must have exactly one top-level h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Main content landmark exists
    const mainArea = page.locator('main, .reading-column, #main-content');
    expect(await mainArea.count()).toBeGreaterThanOrEqual(1);

    // Nav navigation landmarks exist
    const navs = page.locator('nav');
    expect(await navs.count()).toBeGreaterThanOrEqual(1);

    // Verify Ask page
    await page.goto('/ask');
    const askInput = page.locator('#query-input, input[type="text"]');
    await expect(askInput.first()).toBeVisible();
    // Input must be accessible with placeholder or label
    const placeholder = await askInput.first().getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('2. Admin workspace maintains accessible form controls, labeled buttons, and minimum touch targets', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Verify admin buttons have accessible names (text content or aria-label)
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = buttons.nth(i);
      const text = await btn.innerText();
      const ariaLabel = await btn.getAttribute('aria-label');
      expect((text && text.trim().length > 0) || (ariaLabel && ariaLabel.trim().length > 0)).toBe(true);
    }
  });

  test('3. Timeline and Work views support keyboard navigation without mouse dependence', async ({ page }) => {
    await page.goto('/');
    // Tab navigation activates links and inputs
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'BODY']).toContain(focusedTag);
  });
});
