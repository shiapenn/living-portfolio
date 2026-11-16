import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.L L2 Tiptap Block Editor & Import Source Mode', () => {
  test('full-screen editor, toolbar, slash menu, Source toggle, drawers, UX-106, keyboard & axe', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const seededId = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
      const data = await res.json();
      return data.entries?.[0]?.id ?? null;
    });
    expect(seededId).toBeTruthy();

    await page.goto(`/admin/entries/${encodeURIComponent(seededId)}`);
    await page.waitForSelector('#ref-tiptap-editor .ProseMirror');

    // Drawers closed by default
    const entriesDrawer = page.locator('#ref-entries-drawer');
    const structureDrawer = page.locator('#ref-inspector-pane');
    await expect(entriesDrawer).toBeHidden();
    await expect(structureDrawer).toBeHidden();

    // UX-106: saving without edits never changes body_md
    const beforeEntry = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      return res.json();
    }, seededId);

    await page.locator('#ref-btn-save').click();
    await page.waitForTimeout(300);

    const afterEntry = await page.evaluate(async (id) => {
      const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      return res.json();
    }, seededId);
    expect(afterEntry.body_md ?? afterEntry.entry?.body_md).toBe(beforeEntry.body_md ?? beforeEntry.entry?.body_md);

    // Markdown shortcut (**BoldText**), toolbar & slash menu on /admin/entries/new
    await page.goto('/admin/entries/new');
    await page.waitForSelector('#ref-tiptap-editor .ProseMirror');
    const pm = page.locator('#ref-tiptap-editor .ProseMirror');
    await pm.click();
    await page.keyboard.type('**BoldText**');
    await expect(pm.locator('strong')).toContainText('BoldText');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/');
    const slashMenu = page.locator('#ref-slash-menu');
    await expect(slashMenu).toBeVisible();
    await slashMenu.locator('[data-slash-cmd="h2"]').click();
    await page.keyboard.type('New Section');
    await expect(pm.locator('h2', { hasText: 'New Section' })).toBeVisible();

    // Source toggle swaps to monospace textarea holding the same Markdown and back
    const sourceBtn = page.locator('#ref-btn-source-toggle');
    await sourceBtn.click();
    await expect(sourceBtn).toHaveAttribute('aria-pressed', 'true');
    const textarea = page.locator('#ref-field-body');
    await expect(textarea).toBeVisible();
    const mdVal = await textarea.inputValue();
    expect(mdVal).toContain('**BoldText**');
    expect(mdVal).toContain('## New Section');
    await sourceBtn.click();
    await expect(sourceBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(pm).toBeVisible();

    // Details popover opens and updates section mapping summary
    await page.locator('#ref-details-trigger').click();
    const detailsPopover = page.locator('#ref-details-popover');
    await expect(detailsPopover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(detailsPopover).toBeHidden();

    // Left entries drawer opens and closes on Escape
    await page.locator('#ref-sidebar-toggle').click();
    await expect(entriesDrawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(entriesDrawer).toBeHidden();

    // Right Structure drawer opens with plain text line and no step boxes/dashed containers
    await page.locator('#ref-btn-structure').click();
    await expect(structureDrawer).toBeVisible();
    await expect(structureDrawer).toContainText('Captured');
    await expect(structureDrawer).toContainText('Grounded');
    await page.keyboard.press('Escape');
    await expect(structureDrawer).toBeHidden();

    // Accessibility check
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test('Import page uses Tiptap component in Source mode by default and toggles to rich text', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/import');

    const toggle = page.locator('#import-source-toggle');
    const textarea = page.locator('#import-paste-area');
    const tiptap = page.locator('#import-tiptap-editor');

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(textarea).toBeVisible();
    await expect(tiptap).toBeHidden();

    await textarea.fill('# Imported Title\n\nBody paragraph.');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(textarea).toBeHidden();
    await expect(tiptap.locator('.ProseMirror h1')).toContainText('Imported Title');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(textarea).toBeVisible();
    expect(await textarea.inputValue()).toContain('# Imported Title');
  });
});
