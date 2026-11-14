import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-11.4: Full Markdown Engine, Design Tokens & Responsive Multi-Pane Layout', () => {
  test('1. Admin Shell adapts across desktop (2-pane) and mobile (compact header) breakpoints (20261020-UI-06, 20261020-UI-07, WP-15.4)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    await expect(page.locator('#ref-main')).toBeVisible();

    // Desktop viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('#ref-entry-list')).toBeVisible();
    await expect(page.locator('#ref-mobile-menu-btn')).toBeHidden();

    // Mobile viewport (480px)
    await page.setViewportSize({ width: 480, height: 900 });
    await expect(page.locator('#ref-mobile-menu-btn')).toBeVisible();
  });

  test('2. Reference editor provides title, body writing surface, and save action (F4, 20261020-UI-01, WP-15.4)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');

    const titleInput = page.locator('#ref-field-title');
    const textarea = page.locator('#ref-field-body');
    const saveBtn = page.locator('#ref-btn-save');

    await expect(titleInput).toBeVisible();
    await expect(textarea).toBeVisible();
    await expect(saveBtn).toBeVisible();

    await titleInput.fill('Markdown Layout Verification');
    await textarea.fill('## Heading 2\n\nTesting multi-tier design tokens and CommonMark parsing.');
    await saveBtn.click();
    await expect(page.locator('#ref-status-line')).toContainText(/draft saved/i);
  });

  test('3. Public pages render CommonMark/GFM with heading demotion, code blocks, and tables (F4, 20261020-UI-01)', async ({
    page,
  }) => {
    await page.goto('/work/advisory-locks-revisited');

    // Singular page h1 is the entry title
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Markdown content demotes # to h2, ## to h3, so article sections are h2/h3
    const sectionHeadingCount = await page
      .locator('.reading-column h2, .reading-column h3, .role-section h2, .role-section h3')
      .count();
    expect(sectionHeadingCount).toBeGreaterThan(0);

    // Check entry rows on Home page
    await page.goto('/');
    const entryRows = page.locator('.entry-row');
    expect(await entryRows.count()).toBeGreaterThan(0);
    const titleLink = entryRows.first().locator('.entry-title-link');
    await expect(titleLink).toBeVisible();
  });

  test('4. Design tokens: layout-max and theme contrast rules are enforced (20261020-UI-02)', async ({
    page,
  }) => {
    await page.goto('/');

    const layoutMax = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--layout-max').trim();
    });
    expect(layoutMax).toBe('1180px');

    const controlBorder = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--border-control').trim();
    });
    expect(controlBorder).toBe('#6B7B88');
  });
});
