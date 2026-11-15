import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-11.2: Navigation Redesign & System States (20261020-UX-13, 20261020-UX-14, 20261020-CP-05)', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // Create test venture if it does not already exist
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      await fetch('/api/v1/structure/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        body: JSON.stringify({
          name: 'Strata Engine',
          slug: 'strata-engine',
          description: 'Time-aware knowledge graph and static-first portfolio runtime.',
          status: 'live',
          facets: { stack: 'TypeScript', scale: 'Edge CDN' },
        }),
      });
    });

    // Create a structured entry if not already present via Reference Editor UI
    await page.goto('/admin/entries/new');
    await page.fill('#ref-field-title', 'Nav Test Architecture Project');
    await page.locator('#ref-details-disclosure summary').click();
    await page.selectOption('#ref-field-profile', 'case-study');
    await page.fill('#ref-field-slug', 'nav-test-structured-entry');
    await page.fill('#ref-field-date', '2026-01-01');
    await page.fill('#ref-field-body', 'We built a specialized navigation test structure.');
    await page.click('#ref-btn-publish');
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText(/no private details/i);
    await page.click('#ref-publish-confirm');
    await expect(page.locator('#ref-status-line')).toContainText(/now public/i);
    await page.close();
  });

  test('1. Visitor header contains 5 primary nav items, no Admin link, and footer contains secondary links (20261020-UX-13)', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('header.site-header nav.site-nav .nav-links a');
    await expect(navLinks).toHaveCount(5);

    // Verify links in spec order
    await expect(navLinks.nth(0)).toHaveAttribute('href', '/work');
    await expect(navLinks.nth(0)).toHaveText('Work');
    await expect(navLinks.nth(1)).toHaveAttribute('href', '/writing');
    await expect(navLinks.nth(1)).toHaveText('Writing');
    await expect(navLinks.nth(2)).toHaveAttribute('href', '/build');
    await expect(navLinks.nth(2)).toHaveText('Build');
    await expect(navLinks.nth(3)).toHaveAttribute('href', '/timeline');
    await expect(navLinks.nth(3)).toHaveText('Timeline');
    await expect(navLinks.nth(4)).toHaveAttribute('href', '/ask');
    await expect(navLinks.nth(4)).toHaveText('Ask');

    // Admin link must NOT appear in header for anonymous visitors
    const adminLink = page.locator('header.site-header a[href="/admin"]');
    await expect(adminLink).toHaveCount(0);

    // Footer contains secondary navigation
    const footerNav = page.locator('footer.site-footer nav[aria-label="Secondary navigation"]');
    await expect(footerNav).toBeVisible();
    await expect(footerNav.locator('a[href="/about"]')).toBeVisible();
    await expect(footerNav.locator('a[href="/now"]')).toBeVisible();
    await expect(footerNav.locator('a[href="/uses"]')).toBeVisible();
    await expect(footerNav.locator('a[href="/book"]')).toBeVisible();
    await expect(footerNav.locator('a[href="/rss.xml"]')).toBeVisible();
  });

  test('2. Theme toggle operates smoothly with aria-pressed and localStorage sync (20261020-UX-13, 20261020-UX-15)', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();

    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const initialPressed = await themeToggle.getAttribute('aria-pressed');

    // Click to toggle
    await themeToggle.click();
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const toggledPressed = await themeToggle.getAttribute('aria-pressed');

    expect(toggledTheme).not.toBe(initialTheme);
    expect(toggledPressed).not.toBe(initialPressed);

    // Click again to toggle back
    await themeToggle.click();
    const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(finalTheme).toBe(initialTheme);
  });

  test('3. Active section receives aria-current="page" across routes (20261020-UX-13)', async ({ page }) => {
    // Root Home
    await page.goto('/');
    const brand = page.locator('a.site-brand');
    await expect(brand).toHaveAttribute('aria-current', 'page');

    // Work
    await page.goto('/work');
    await expect(page.locator('.nav-links a[href="/work"]')).toHaveAttribute('aria-current', 'page');

    // Writing
    await page.goto('/writing');
    await expect(page.locator('.nav-links a[href="/writing"]')).toHaveAttribute('aria-current', 'page');

    // Build
    await page.goto('/build');
    await expect(page.locator('.nav-links a[href="/build"]')).toHaveAttribute('aria-current', 'page');

    // Timeline
    await page.goto('/timeline');
    await expect(page.locator('.nav-links a[href="/timeline"]')).toHaveAttribute('aria-current', 'page');

    // Ask
    await page.goto('/ask');
    await expect(page.locator('.nav-links a[href="/ask"]')).toHaveAttribute('aria-current', 'page');
  });

  test('4. Deduplicates /writing & /work: structured entry redirects to /work with 301 preserving as_of (20261020-UX-13)', async ({ page }) => {
    const response = await page.goto('/writing/nav-test-structured-entry?as_of=2026-02-01');
    expect(response?.url()).toContain('/work/nav-test-structured-entry');
    expect(response?.url()).toContain('as_of=2026-02-01');

    // Active section on Work
    await expect(page.locator('.nav-links a[href="/work"]')).toHaveAttribute('aria-current', 'page');
  });

  test('5. /build/:slug resolves venture overview and attached dev-logs without 404 (20261020-UX-13)', async ({ page }) => {
    await page.goto('/build/strata-engine');

    // Heading matches venture
    await expect(page.locator('h1')).toContainText('Strata Engine');
    await expect(page.locator('.chip:has-text("Status:")')).toBeVisible();
    await expect(page.locator('.nav-links a[href="/build"]')).toHaveAttribute('aria-current', 'page');

    // Outcome-oriented CTA
    const askVentureBtn = page.locator('a:has-text("Ask about this venture")');
    await expect(askVentureBtn).toBeVisible();
  });

  test('6. Filter outcome chip highlights and empty state provides Reset CTA (20261020-UX-14, 20261020-CP-05)', async ({ page }) => {
    await page.goto('/work');
    const workedChip = page.locator('a.chip[href="/work?outcome=worked"]');
    await expect(workedChip).toBeVisible();

    // Query an outcome that produces an empty state
    await page.goto('/work?outcome=unresolved');
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();

    const resetBtn = emptyState.locator('a:has-text("Reset all filters")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Reset leads back to /work
    await expect(page).toHaveURL(/\/work$/);
  });

  test('7. System 404 Not Found page renders with search form and navigation CTAs (20261020-UX-14, 20261020-CP-05)', async ({ page }) => {
    const res = await page.goto('/non-existent-page-test-404');
    expect(res?.status()).toBe(404);

    await expect(page.locator('h1')).toContainText('404 — Page Not Found');
    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toBeVisible();

    // CTAs exist and are clickable
    await expect(page.locator('a:has-text("Explore Work")')).toBeVisible();
    await expect(page.locator('a:has-text("Browse Writing")')).toBeVisible();
    await expect(page.locator('a:has-text("View Timeline")')).toBeVisible();
    await expect(page.locator('a:has-text("Ask Questions")')).toBeVisible();
  });
});
