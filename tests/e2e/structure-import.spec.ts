import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-4.1: Structure Review Loop, Import Triage, and Visitor Ask States', () => {
  test('1. Structure Drawer 3-tab inspector in Reference Editor (20261020-UX-06, UX-07, WP-15.4)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');

    // Open Structure drawer from editor action bar
    await page.click('#ref-btn-structure');
    const drawer = page.locator('#ref-structure-drawer');
    await expect(drawer).toBeVisible();

    // Verify 3 Structure tabs exist with accessible tablist role
    const tablist = drawer.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(page.locator('#ref-structure-tabs-tab-summary')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#ref-structure-tabs-panel-summary')).toBeVisible();

    // Switch to Context tab
    await page.click('#ref-structure-tabs-tab-context');
    await expect(page.locator('#ref-structure-tabs-tab-context')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#ref-structure-tabs-panel-context')).toBeVisible();

    // Switch to Evidence tab
    await page.click('#ref-structure-tabs-tab-evidence');
    await expect(page.locator('#ref-structure-tabs-tab-evidence')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#ref-structure-tabs-panel-evidence')).toBeVisible();
  });

  test('2. Import Planner and J K A R D S triage keyboard workflow (20261020-UX-07)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new');
    await page.goto('/admin/import');
    await expect(page.locator('h1')).toContainText('Import & Triage');

    // Step 1: Add Material
    await expect(page.locator('#import-step-add')).toBeVisible();
    await page.click('#btn-load-sample');
    const pasteVal = await page.inputValue('#import-paste-area');
    expect(pasteVal).toContain('Zero-Downtime Migration');

    // Generate Plan -> Step 2
    await page.click('#btn-generate-plan');
    await expect(page.locator('#import-step-plan')).toBeVisible();
    await expect(page.locator('#plan-free-est')).toContainText('within free limits');
    await expect(page.locator('#plan-paid-est')).toContainText('Finish in minutes');

    // Proceed to Triage -> Step 3
    await page.click('#btn-proceed-triage');
    await expect(page.locator('#import-step-triage')).toBeVisible();

    // Keyboard legend present
    const legend = page.locator('.triage-keys-legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Navigate items');

    // Triage cards rendered
    const cards = page.locator('.triage-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toHaveClass(/selected/);

    // Press 'A' to accept first item
    await page.keyboard.press('a');
    await expect(cards.first()).toHaveClass(/status-accepted/);

    // Second card should now be selected
    await expect(cards.nth(1)).toHaveClass(/selected/);

    // Use on-screen Next / Prev buttons
    await page.click('#btn-key-prev');
    await expect(cards.first()).toHaveClass(/selected/);
    await page.click('#btn-key-next');
    await expect(cards.nth(1)).toHaveClass(/selected/);

    // Commit batch
    await page.click('#btn-commit-batch');
    const banner = page.locator('#import-status-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Successfully imported');
  });

  test('3. Visitor Ask states, scope chips, and accessibility mechanics (20261020-CP-04, UX-10, UX-15)', async ({ page }) => {
    // Check Skip Link on public page
    await page.goto('/ask');
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeAttached();
    expect(await skipLink.getAttribute('href')).toBe('#main-content');

    // Check Home page has valid h1
    await page.goto('/home');
    const homeH1 = page.locator('main h1');
    await expect(homeH1).toBeAttached();

    // Check Ask page with scope query parameter
    await page.goto('/ask?scope=advisory-locks-revisited');
    const scopeChip = page.locator('#scope-chip-container');
    await expect(scopeChip).toBeVisible();
    await expect(scopeChip).toContainText('advisory-locks-revisited');

    // Dismiss scope chip
    await page.click('#btn-clear-scope');
    await expect(scopeChip).toBeHidden();

    // Ask a question and check live region output
    await page.fill('#ask-q', 'What did you use to replace Redis?');
    await page.click('#btn-ask-submit');

    const liveRegion = page.locator('#ask-live-region');
    await expect(liveRegion).toBeVisible();
    await expect(liveRegion.locator('.chip')).toBeVisible();
    await expect(liveRegion).toContainText("Showing excerpts from the owner's records. Automated answers are paused for now.");
    await expect(liveRegion).not.toContainText('Origin unreachable');
  });
});
