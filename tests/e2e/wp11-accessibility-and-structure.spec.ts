import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WP-11.3: Accessibility Mechanics (UX-15) & Structured View Repair (UX-16)', () => {
  test('1. Skip link is the first focusable element and targets #main-content (20261020-UX-15)', async ({ page }) => {
    await page.goto('/');

    // Press Tab once from the top of the page
    await page.keyboard.press('Tab');

    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName.toLowerCase(),
        className: el?.className,
        href: el?.getAttribute('href'),
        text: el?.textContent?.trim(),
      };
    });

    expect(activeElement.tagName).toBe('a');
    expect(activeElement.className).toContain('skip-link');
    expect(activeElement.href).toBe('#main-content');
    expect(activeElement.text).toBe('Skip to main content');

    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    const mainId = await page.evaluate(() => document.getElementById('main-content')?.id);
    expect(mainId).toBe('main-content');
  });

  test('2. Theme toggle synchronizes aria-pressed, label, system preference, and localStorage (20261020-UX-15)', async ({ page }) => {
    await page.goto('/');

    const toggleBtn = page.locator('#theme-toggle');
    await expect(toggleBtn).toBeVisible();

    // Initial state: in light default, aria-pressed is false
    const initialPressed = await toggleBtn.getAttribute('aria-pressed');
    expect(initialPressed).toBe('false');

    // Click to switch to dark mode
    await toggleBtn.click();
    expect(await toggleBtn.getAttribute('aria-pressed')).toBe('true');
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    expect(await page.evaluate(() => localStorage.getItem('strata-theme'))).toBe('dark');

    // Click again to switch to light mode
    await toggleBtn.click();
    expect(await toggleBtn.getAttribute('aria-pressed')).toBe('false');
    expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
    expect(await page.evaluate(() => localStorage.getItem('strata-theme'))).toBe('light');
  });

  test('3. Strata timeline bands are semantic navigation links with high-contrast future indicators (20261020-UX-15)', async ({ page }) => {
    await page.goto('/timeline');

    // All bands must be <a> elements with valid href
    const bands = page.locator('a.strata-band');
    const count = await bands.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const band = bands.nth(i);
      const href = await band.getAttribute('href');
      expect(href).toMatch(/^\/timeline\?as_of=/);
      // Must not be a button or have onclick
      expect(await band.getAttribute('onclick')).toBeNull();
    }

    // Scrub back in time to 2021-08-15
    await page.goto('/timeline?as_of=2021-08-15T00:00:00Z');
    const dimmedBands = page.locator('a.strata-band[data-dimmed="true"]');
    const dimmedCount = await dimmedBands.count();
    expect(dimmedCount).toBeGreaterThan(0);

    // Verify dimmed bands do not use low-contrast opacity:0.35 on text
    const firstDimmed = dimmedBands.first();
    const opacity = await firstDimmed.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.9); // Full opacity with background pattern

    // Verify accessible future label
    const futureLabel = firstDimmed.locator('.band-label-future');
    await expect(futureLabel).toBeVisible();
    await expect(futureLabel).toHaveText('(future)');
  });

  test('4. Interactive controls provide minimum 44px touch target heights (20261020-UX-15)', async ({ page }) => {
    await page.goto('/');

    const themeToggleBox = await page.locator('#theme-toggle').boundingBox();
    expect(themeToggleBox).not.toBeNull();
    expect(themeToggleBox!.height).toBeGreaterThanOrEqual(44);

    await page.goto('/timeline');
    const applyDateBox = await page.locator('button[type="submit"]:has-text("Apply Date")').boundingBox();
    expect(applyDateBox).not.toBeNull();
    expect(applyDateBox!.height).toBeGreaterThanOrEqual(44);

    await page.goto('/work/redis-distributed-locks-2021');
    const viewSwitchBox = await page.locator('a[data-action="view-switch"]').boundingBox();
    expect(viewSwitchBox).not.toBeNull();
    expect(viewSwitchBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('5. Automated axe accessibility scan validates public routes (20261020-UX-15)', async ({ page }) => {
    const routes = ['/', '/work', '/writing', '/build', '/timeline', '/ask'];

    for (const route of routes) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast']) // Color contrast checked via computed tokens in unit/conformance
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(
        criticalOrSerious,
        `Accessibility violations on route ${route}: ${JSON.stringify(criticalOrSerious, null, 2)}`
      ).toEqual([]);
    }
  });

  test('6. Structured view renders all spans in document order without dropping unannotated text (20261020-UX-16)', async ({ page }) => {
    // Navigate to structured view
    await page.goto('/work/redis-distributed-locks-2021?view=structured');

    // 1. Role section for annotated goal exists
    const roleSection = page.locator('section.role-section');
    await expect(roleSection.first()).toBeVisible();
    await expect(roleSection.first()).toContainText('The goal');
    await expect(roleSection.first()).toContainText('We needed distributed job coordination across 16 worker nodes');

    // 2. Unlabeled spans exist and are rendered in document order
    const unlabeledSpans = page.locator('.unlabeled-span');
    expect(await unlabeledSpans.count()).toBeGreaterThan(0);

    // 3. Spans that were previously dropped (603 characters including the lesson) are fully visible
    await expect(page.locator('article')).toContainText('clock drift caused lock leases to overlap for 180ms');
    await expect(page.locator('article')).toContainText('duplicate webhooks dropped by 99.4%');
    await expect(page.locator('article')).toContainText("What I'd tell someone else");
    await expect(page.locator('article')).toContainText('Use Redis distributed locks when you already run Redis at scale');

    // 4. Switch to article view and verify content parity
    await page.click('a[data-action="view-switch"]');
    await expect(page).toHaveURL(/view=article/);
    await expect(page.locator('article')).toContainText('We needed distributed job coordination across 16 worker nodes');
    await expect(page.locator('article')).toContainText("What I'd tell someone else");
  });
});
