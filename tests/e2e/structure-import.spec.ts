import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-4.1: Structure Review Loop, Import Triage, and Visitor Ask States', () => {
  test('1. Structure section (level, facets, spans, claims, evidence) in Reference Editor Settings view (D-EDITOR-4)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/editor?fixture=draft');

    // Open Settings view from editor header
    await page.click('#ref-switch-settings');
    const structureSection = page.locator('#ref-structure-section');
    await expect(structureSection).toBeVisible();

    // Verify Structure level steps and all 4 subsections exist
    await expect(page.locator('#ref-structure-level')).toBeVisible();
    await expect(page.locator('#ref-structure-level')).toContainText('Tagged');
    await expect(page.locator('#ref-facets-list')).toBeAttached();
    await expect(page.locator('#ref-spans-list')).toBeAttached();
    await expect(page.locator('#ref-claims-list')).toBeAttached();
    await expect(page.locator('#ref-evidence-list')).toBeAttached();
    await expect(page.locator('#ref-btn-add-facet')).toBeVisible();
    await page.click('#ref-btn-open-claim');
    await expect(page.locator('#ref-btn-add-claim')).toBeVisible();
    await page.click('#ref-btn-open-evidence');
    await expect(page.locator('#ref-btn-add-evidence')).toBeVisible();
  });

  test('2. Import Planner and J K A R D S triage keyboard workflow (20261020-UX-07)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
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

    // Proceed to Triage -> Step 3
    await page.click('#btn-proceed-triage');
    await expect(page.locator('#import-step-triage')).toBeVisible();

    // Keyboard legend present at regular width
    const legend = page.locator('.triage-keys-legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('J / K');

    // Triage cards rendered as Item
    const cards = page.locator('#triage-cards-container [data-c="Item"]');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toHaveClass(/is-selected/);

    // Press 'A' to accept first item
    await page.keyboard.press('a');
    await expect(cards.first()).toHaveClass(/status-accepted/);

    // Second card should now be selected
    await expect(cards.nth(1)).toHaveClass(/is-selected/);

    // Use J / K keyboard navigation (Previous/Next buttons removed in WP-18.10 V10)
    await page.keyboard.press('k');
    await expect(cards.first()).toHaveClass(/is-selected/);
    await page.keyboard.press('j');
    await expect(cards.nth(1)).toHaveClass(/is-selected/);

    // Commit batch -> dedicated Done screen (WP-18.6 / WP-18.10 V13)
    await page.click('#btn-commit-batch');
    const doneStep = page.locator('#import-step-done');
    await expect(doneStep).toBeVisible();
    await expect(doneStep).toContainText('Imported 1 entry as a private draft.');
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
