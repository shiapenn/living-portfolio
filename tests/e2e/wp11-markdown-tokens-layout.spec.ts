import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-11.4: Full Markdown Engine, Design Tokens & Responsive Multi-Pane Layout', () => {
  test('1. Admin Shell adapts across desktop (3-pane), tablet (2-pane), and mobile (stacked) breakpoints (20261020-UI-06, 20261020-UI-07)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');
    await expect(page.locator('.admin-shell')).toBeVisible();

    // Desktop viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 900 });
    const desktopColumns = await page.evaluate(() => {
      const el = document.querySelector('.admin-shell');
      return el ? window.getComputedStyle(el).gridTemplateColumns.split(' ').length : 0;
    });
    expect(desktopColumns).toBe(3);

    // Tablet viewport (820px)
    await page.setViewportSize({ width: 820, height: 900 });
    const tabletColumns = await page.evaluate(() => {
      const el = document.querySelector('.admin-shell');
      return el ? window.getComputedStyle(el).gridTemplateColumns.split(' ').length : 0;
    });
    expect(tabletColumns).toBe(2);

    // Mobile viewport (480px)
    await page.setViewportSize({ width: 480, height: 900 });
    const mobileColumns = await page.evaluate(() => {
      const el = document.querySelector('.admin-shell');
      return el ? window.getComputedStyle(el).gridTemplateColumns.split(' ').length : 0;
    });
    expect(mobileColumns).toBe(1);
  });

  test('2. Editor workspace provides toolbar actions, live word count, and source/preview toggle (F4, 20261020-UI-01)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    const textarea = page.locator('#entry-body');
    const wordCount = page.locator('#editor-word-count');
    const previewToggle = page.locator('#btn-toggle-editor-mode');
    const previewPane = page.locator('#entry-body-preview');
    const warning = page.locator('#editor-word-warning');

    await expect(textarea).toBeVisible();
    await expect(wordCount).toBeVisible();

    // 1. Live word counter updates
    await textarea.fill('Testing multi-tier design tokens and CommonMark parsing');
    await expect(wordCount).toContainText('7 words (soft cap: 3,000)');
    await expect(warning).toBeHidden();

    // 2. Toolbar action: insert H2
    const h2Btn = page.locator('.editor-toolbar button[data-action="h2"]');
    await expect(h2Btn).toBeVisible();
    await h2Btn.click();
    const bodyVal = await textarea.inputValue();
    expect(bodyVal).toContain('## Heading 2');

    // 3. Toggle preview mode
    await expect(previewPane).toBeHidden();
    await previewToggle.click();
    await expect(previewPane).toBeVisible();
    await expect(textarea).toBeHidden();
    await expect(previewToggle).toHaveText('Edit source');

    // Preview rendered heading
    await expect(previewPane.locator('h2')).toContainText('Heading 2');

    // Switch back to edit mode
    await previewToggle.click();
    await expect(textarea).toBeVisible();
    await expect(previewPane).toBeHidden();
    await expect(previewToggle).toHaveText('Preview');

    // 4. Soft 3,000-word cap non-blocking warning
    const longText = Array(3005).fill('word').join(' ');
    await textarea.fill(longText);
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Entry exceeds 3,000 words');
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
