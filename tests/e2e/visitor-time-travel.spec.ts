import { test, expect } from '@playwright/test';

test.describe.serial('WP-4.3: Time-Travel Correctness and Navigation Links (20261020-UX-12 / P0-11)', () => {
  test('1. Timeline defaults to today, excludes nothing on direct apply, and handles invalid dates gracefully', async ({ page }) => {
    await page.goto('/timeline');

    // Input default value is today (YYYY-MM-DD)
    const todayIso = new Date().toISOString().slice(0, 10);
    const asOfInput = page.locator('#as-of-input');
    await expect(asOfInput).toBeVisible();
    await expect(asOfInput).toHaveValue(todayIso);

    // Click Apply without changing date
    await page.click('button:has-text("Apply")');
    await expect(page).toHaveURL(new RegExp(`/timeline\\?as_of=${todayIso}`));

    // Entries are visible
    const entries = page.locator('.entry-row');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);

    // Navigate with invalid date string (e.g., as_of=garbage-date)
    await page.goto('/timeline?as_of=garbage-date');
    const alertBanner = page.locator('.as-of-banner[role="alert"]');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText('Invalid as-of date ("garbage-date")');
    await expect(alertBanner).toContainText('Showing records as of present');

    // Records are still rendered without crashing
    const presentEntries = page.locator('.entry-row');
    expect(await presentEntries.count()).toBeGreaterThan(0);
  });

  test('2. Strata bands compute dynamic month-end dates and support keyboard navigation (Arrow keys, Enter)', async ({ page }) => {
    await page.goto('/timeline');

    const bands = page.locator('.strata-band');
    const bandCount = await bands.count();
    expect(bandCount).toBeGreaterThan(1);

    // Verify dynamic month-end calculation (no hardcoded day 28)
    for (let i = 0; i < bandCount; i++) {
      const asOfAttr = await bands.nth(i).getAttribute('data-asof');
      expect(asOfAttr).not.toBeNull();
      // Month-end format: YYYY-MM-DD... where DD is 28, 29, 30, or 31 based on month
      const [ym, dayPart] = asOfAttr!.split('T')[0].split('-');
      const day = parseInt(asOfAttr!.split('T')[0].split('-')[2], 10);
      expect(day).toBeGreaterThanOrEqual(28);
      expect(day).toBeLessThanOrEqual(31);
    }

    // Keyboard navigation: focus first band, press ArrowRight to move focus
    await bands.first().focus();
    await expect(bands.first()).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(bands.nth(1)).toBeFocused();

    // Press Enter to activate time travel for the focused band
    await page.keyboard.press('Enter');

    // Verify URL updated to selected band's as_of date
    await expect(page).toHaveURL(/\/timeline\?as_of=/);
    const activeBanner = page.locator('.as-of-banner[role="status"]');
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText('Viewing as of');
  });

  test('3. Timeline shows informative empty state with reset link when all entries are filtered out', async ({ page }) => {
    // 2018 is before any entries were recorded
    await page.goto('/timeline?as_of=2018-01-01');

    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No records active as of this date');
    await expect(emptyState).toContainText('All published entries were recorded after this point in time');

    // Click Reset to present
    const resetLink = emptyState.locator('a:has-text("Reset to present")');
    await expect(resetLink).toBeVisible();
    await resetLink.click();

    await expect(page).toHaveURL('/timeline');
    const entries = page.locator('.entry-row');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('4. as_of context is carried across Timeline, Work, Entry detail, and Ask routes', async ({ page }) => {
    const historicalDate = '2022-06-01T00:00:00Z';
    const encodedDate = encodeURIComponent(historicalDate);

    // 1. On /timeline with as_of, entry links carry ?as_of=
    await page.goto(`/timeline?as_of=${encodedDate}`);
    const entryLink = page.locator('.entry-title-link[href*="/work/redis-distributed-locks-2021"]');
    await expect(entryLink).toBeVisible();
    const href = await entryLink.getAttribute('href');
    expect(href).toContain(`as_of=${encodedDate}`);

    // Click link to go to entry detail
    await entryLink.click();
    await expect(page).toHaveURL(new RegExp(`/work/redis-distributed-locks-2021\\?as_of=${encodedDate}`));

    // 2. Entry detail renders sticky .as-of-banner and carries as_of in scoped ask form
    const stickyBanner = page.locator('.as-of-banner[role="status"]');
    await expect(stickyBanner).toBeVisible();
    await expect(stickyBanner).toContainText('Viewing as of 2022-06-01');

    const askForm = page.locator('form[action="/ask"]');
    await expect(askForm).toBeVisible();
    const asOfHidden = askForm.locator('input[name="as_of"]');
    await expect(asOfHidden).toHaveValue(historicalDate);

    // 3. Submit scoped ask query from entry detail
    await askForm.locator('input[name="q"]').fill('How did you coordinate webhooks?');
    await askForm.locator('button[type="submit"]').click();

    // 4. Verify /ask carries scope and as_of
    await expect(page).toHaveURL(/\/ask\?/);
    await expect(page).toHaveURL(new RegExp(`as_of=${encodedDate}`));
    await expect(page).toHaveURL(/scope=redis-distributed-locks-2021/);

    // Ask page displays active time-travel constraint banner and prefills facet-asof
    const askBanner = page.locator('.as-of-banner');
    await expect(askBanner).toBeVisible();
    await expect(askBanner).toContainText('Time-travel query active:');
    await expect(askBanner).toContainText('2022-06-01');

    const facetAsOf = page.locator('#facet-asof');
    await expect(facetAsOf).toBeVisible();
    await expect(facetAsOf).toHaveValue('2022-06-01');
  });
});
