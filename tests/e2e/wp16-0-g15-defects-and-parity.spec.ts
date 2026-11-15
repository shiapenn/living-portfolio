import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('WP-16.0 G15 Defects & Capability Parity', () => {
  test('UX-96: draft buffer autosave, reload restore prompt, Discard, beforeunload guard, and offline banner on real /admin', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');

    const titleVal = `Buffered Draft ${Date.now()}`;
    const bodyVal = 'Unsaved writing that must survive a full page reload.';
    await page.fill('#ref-field-title', titleVal);
    await page.fill('#ref-field-body', bodyVal);

    // Wait for debounced draft buffer persistence
    await expect.poll(async () => {
      return await page.evaluate(() => Boolean(localStorage.getItem('lp_draft_buffer_active')));
    }).toBe(true);

    // Verify beforeunload guard is active when dirty
    const beforeUnloadPrevented = await page.evaluate(() => {
      const ev = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    expect(beforeUnloadPrevented).toBe(true);

    // Reload the page and verify draft buffer restores + notice appears
    await page.reload();
    await expect(page.locator('#draft-restore-notice')).toBeVisible();
    await expect(page.locator('#ref-field-title')).toHaveValue(titleVal);
    await expect(page.locator('#ref-field-body')).toHaveValue(bodyVal);

    // Discard restores clean state and clears buffer
    await page.locator('#btn-discard-draft-buffer').click();
    await expect(page.locator('#draft-restore-notice')).toBeHidden();
    const bufferAfterDiscard = await page.evaluate(() => localStorage.getItem('lp_draft_buffer_active'));
    expect(bufferAfterDiscard).toBeNull();

    // Offline banner toggles on offline / online events
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.locator('#admin-offline-banner')).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.locator('#admin-offline-banner')).toBeHidden();
  });

  test('UX-97: More and Visibility menus use shared Menu keyboard navigation (Enter focuses first item, ArrowDown moves, Escape returns focus)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');
    await page.fill('#ref-field-title', `Menu Nav Entry ${Date.now()}`);
    await page.fill('#ref-field-body', 'Body for menu keyboard navigation check.');
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('Draft saved.');

    // More menu: Enter on trigger opens menu and focuses first item
    const moreBtn = page.locator('#ref-more-menu-btn');
    await moreBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ref-more-menu')).toBeVisible();
    await expect(page.locator('#ref-more-history')).toBeFocused();

    // ArrowDown moves to Delete entry
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#ref-more-delete')).toBeFocused();

    // Escape closes menu and returns focus to trigger
    await page.keyboard.press('Escape');
    await expect(page.locator('#ref-more-menu')).toBeHidden();
    await expect(moreBtn).toBeFocused();

    // ArrowDown on closed trigger also opens and focuses first item
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#ref-more-menu')).toBeVisible();
    await expect(page.locator('#ref-more-history')).toBeFocused();
    await page.keyboard.press('Escape');
  });

  test('UX-98 & UX-99: Publish dialog hides saved status line (single active message place) and lists matched private details with jump link', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin?new=1');
    const secretToken = ['sk', 'live', 'testsecret9876543210'].join('-');
    await page.fill('#ref-field-title', `Publish Scan Entry ${Date.now()}`);
    await page.fill('#ref-field-body', `Before secret. Using ${secretToken} in this draft.`);
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('Draft saved.');

    // Open Publish dialog -> status line must be hidden while dialog is open
    await page.locator('#ref-btn-publish').click();
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    await expect(page.locator('#ref-status-line')).toBeHidden();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText('Possible private details found');

    // UX-99: matched private details list shows type, masked snippet (not raw secret), position, and jump link
    const matchesList = page.locator('#ref-publish-matches');
    await expect(matchesList).toBeVisible();
    const matchItem = matchesList.locator('li').first();
    await expect(matchItem).toBeVisible();
    const itemText = await matchItem.innerText();
    expect(itemText).toMatch(/secret/i);
    expect(itemText).not.toContain(secretToken);
    expect(itemText).toMatch(/pos|line|char/i);

    // Clicking the jump link closes the dialog and focuses the body textarea
    const jumpLink = matchItem.locator('button, a').first();
    await expect(jumpLink).toBeVisible();
    await jumpLink.click();
    await expect(page.locator('#ref-publish-dialog')).toBeHidden();
    await expect(page.locator('#ref-field-body')).toBeFocused();
  });

  test('UX-100, UX-102, UX-103: 320px brand target >= 44px, h1 in empty/first-run, zero duplicate banner landmark with overlays open', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // UX-100: brand link >= 44px high at 320px
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin');
    const brandBox = await page.locator('a.lp-admin-header-brand').boundingBox();
    expect(brandBox).not.toBeNull();
    expect(brandBox!.height).toBeGreaterThanOrEqual(44);

    // UX-102: empty and first-run states have an <h1>
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const fixture of ['empty', 'first-run'] as const) {
      await page.goto(`/admin/entries/editor?fixture=${fixture}&theme=light`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      const axeEmpty = await new AxeBuilder({ page }).analyze();
      expect(axeEmpty.violations.filter((v) => v.id === 'page-has-heading-one')).toEqual([]);
    }

    // UX-103: zero duplicate banner landmark when overlays (Publish dialog / Structure drawer) are open
    await page.goto('/admin?new=1');
    await page.fill('#ref-field-title', `Landmark Check ${Date.now()}`);
    await page.fill('#ref-field-body', 'Clean body for landmark check.');
    await page.locator('#ref-btn-publish').click();
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    const axeDlg = await new AxeBuilder({ page }).analyze();
    expect(
      axeDlg.violations.filter((v) => v.id === 'landmark-no-duplicate-banner' || v.id === 'landmark-unique')
    ).toEqual([]);
    await page.locator('#ref-publish-cancel').click();

    await page.locator('#ref-btn-structure').click();
    await expect(page.locator('#ref-structure-drawer')).toBeVisible();
    const axeDrawer = await new AxeBuilder({ page }).analyze();
    expect(
      axeDrawer.violations.filter((v) => v.id === 'landmark-no-duplicate-banner' || v.id === 'landmark-unique')
    ).toEqual([]);
  });

  test('UX-104 & UX-105: automated-answering kill switch and escalation review card on real /admin', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // Create a pending escalation via /api/ask (or verify/seed one)
    await page.goto('/admin');

    // UX-104: Kill switch visible on /admin and toggles automated answering across reload
    const killBtn = page.locator('#btn-killswitch');
    await expect(killBtn).toBeVisible();
    const initialPressed = await killBtn.getAttribute('aria-pressed');
    await killBtn.click();
    const nextPressed = initialPressed === 'true' ? 'false' : 'true';
    await expect(killBtn).toHaveAttribute('aria-pressed', nextPressed);
    await page.reload();
    await expect(page.locator('#btn-killswitch')).toHaveAttribute('aria-pressed', nextPressed);
    // Restore original state
    await page.locator('#btn-killswitch').click();
    await expect(page.locator('#btn-killswitch')).toHaveAttribute('aria-pressed', initialPressed ?? 'false');

    // UX-105: Escalation review card visible on /admin with seeded pending escalation
    await expect(page.locator('#ref-escalations-card')).toBeVisible();
    const escCard = page.locator('#ref-escalations-card');
    const escItem = escCard.locator('[data-escalation-id]').first();
    await expect(escItem).toBeVisible();
    const escId = await escItem.getAttribute('data-escalation-id');
    expect(escId).toBeTruthy();

    // Approve the escalation from the UI card
    await escItem.locator('[data-esc-approve]').click();
    await expect(escCard.locator(`[data-escalation-id="${escId}"]`)).toHaveCount(0);

    // Reload and confirm it remains approved (no longer in pending list)
    await page.reload();
    await expect(page.locator(`#ref-escalations-card [data-escalation-id="${escId}"]`)).toHaveCount(0);
  });
});
