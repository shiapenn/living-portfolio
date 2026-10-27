import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-4.1: Structure Review Loop, Import Triage, and Visitor Ask States', () => {
  test('1. Inspector 5 tabs, walkthrough, and guided/quick authoring modes in Admin Workspace (20261020-UX-06, UX-07)', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // Verify first-run authoring walkthrough banner
    const walkthroughCard = page.locator('#admin-walkthrough-card');
    await expect(walkthroughCard).toBeVisible();
    await expect(walkthroughCard).toContainText('First-Run Authoring Walkthrough');
    await page.click('#btn-dismiss-walkthrough');
    await expect(walkthroughCard).toBeHidden();

    // Verify 5 Inspector tabs exist with accessible tablist role
    const tablist = page.locator('.inspector-tabs[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(page.locator('#tab-btn-structure')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-structure')).toBeVisible();

    // Switch to Context tab
    await page.click('#tab-btn-context');
    await expect(page.locator('#tab-btn-context')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-context')).toBeVisible();
    await expect(page.locator('#btn-add-facet')).toBeVisible();

    // Switch to Evidence tab
    await page.click('#tab-btn-evidence');
    await expect(page.locator('#tab-btn-evidence')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-evidence')).toBeVisible();
    await expect(page.locator('#panel-evidence')).toContainText('Evidence verification confirms artifact authenticity but does not prove the narrative.');

    // Switch to Answerability tab
    await page.click('#tab-btn-answerability');
    await expect(page.locator('#tab-btn-answerability')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-answerability')).toBeVisible();

    // Switch to History tab
    await page.click('#tab-btn-history');
    await expect(page.locator('#tab-btn-history')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-history')).toBeVisible();

    // Return to Structure tab
    await page.click('#tab-btn-structure');
    await expect(page.locator('#panel-structure')).toBeVisible();

    // Test Guided Mode in Editor
    await page.click('#mode-btn-guided');
    const guidedPanel = page.locator('#editor-guided-panel');
    await expect(guidedPanel).toBeVisible();
    await page.fill('#guided-problem', 'High lock contention under peak load');
    await page.fill('#guided-approach', 'Adopted Postgres 15 advisory locks');
    await page.check('#guided-nothing-wrong');
    await expect(page.locator('#guided-lesson')).toHaveValue('Smooth execution with no notable regressions.');

    await page.click('#btn-guided-compile');
    const bodyValue = await page.inputValue('#entry-body');
    expect(bodyValue).toContain('## Problem');
    expect(bodyValue).toContain('High lock contention under peak load');
    expect(bodyValue).toContain('## Lesson');

    // Test Quick Log mode in Editor
    await page.click('#mode-btn-quick');
    const quickPanel = page.locator('#editor-quick-panel');
    await expect(quickPanel).toBeVisible();
    await page.fill('#quick-log-text', 'Quick Log Test: Deployed micro-patch to worker queue with shadow metrics active.');
    await page.click('#btn-submit-quick-log');

    // Verify quick log confirmation banner
    const banner = page.locator('#admin-status-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Quick log saved as');
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
