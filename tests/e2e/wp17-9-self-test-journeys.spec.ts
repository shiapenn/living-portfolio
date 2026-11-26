import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.9 / WP-17.10 Self-Test User Journeys J1–J8 (first-day owner persona, mouse + keyboard, 1280px & 320px).
 *
 * J1: Pause answering, drift threshold warning, set invalid threshold, restore recommended
 * J2: Set backup folder, run drill, download archive
 * J3: Change password with wrong current password (section-local error), re-enrol authenticator (QR <= 192px + section-local error),
 *     regenerate recovery codes, create then revoke a token (dot gap >= 4px)
 * J4 (extended for WP-17.10 A2): Found (2 seeded contradictions) -> supersede one -> dismiss one -> error -> retry -> clean
 * J5: Edit About, save, view revision (Current on newest, none on older, formatted timestamp), save empty
 * J6: Set Home counts out of range, pin an unknown slug
 * J7: Pick a pack, fail AA (Save disabled + Notice), import bad then good JSON, switch scope, reload persistence
 * J8: Add a venture, confirm, decline, and cancel bookings (Confirmed / Declined / Cancelled)
 */
test.describe.serial('WP-17.9 / WP-17.10 Self-Test User Journeys (J1–J8)', () => {
  test('J1: Pause answering, drift warning, set invalid threshold, restore recommended (1280px mouse + 320px keyboard)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/answering');

    // Pause answering via dialog
    await page.locator('label:has(#setting-answering-enabled)').click();
    await expect(page.locator('#answering-pause-dialog')).toBeVisible();
    await page.click('#btn-confirm-pause-answering');
    await expect(page.locator('#setting-answering-enabled')).not.toBeChecked();

    // Drift above recommended shows consequence warning
    await page.fill('#setting-tier1-floor', '0.90');
    await expect(page.locator('#tier1-warning')).toBeVisible();

    // Set invalid threshold -> inline field error (aria-invalid) + danger notice
    await page.fill('#setting-tier1-floor', '1.50');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#setting-tier1-floor')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#settings-status-banner.lp-notice-danger')).toContainText('0.10 and 1.00');

    // Switch to 320px and restore recommended via keyboard
    await page.setViewportSize({ width: 320, height: 640 });
    await page.locator('#btn-restore-thresholds').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#setting-tier1-floor')).toHaveValue('0.82');
    await expect(page.locator('#tier1-warning')).toBeHidden();

    // Re-enable answering and save
    await page.locator('label:has(#setting-answering-enabled)').click();
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');
  });

  test('J2: Set backup folder, run drill, download archive', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/backups');

    // Unconfigured drill shows honest unavailable message
    await page.click('#btn-run-backup-drill');
    await expect(page.locator('#backup-drill-result')).toContainText(/not enabled|backup folder/i);

    // Set backup folder and save
    await page.fill('#setting-backup-destination', './data/backups');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner')).toContainText('Saved.');

    // Download archive returns named attachment
    const exportHref = await page.locator('#btn-export-archive').getAttribute('href');
    expect(exportHref).toBe('/api/settings/export');
    const res = await page.request.get(exportHref!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-disposition']).toMatch(/attachment; filename="living-portfolio-export-/);

    // Clean up destination
    await page.fill('#setting-backup-destination', '');
    await page.click('#btn-save-settings-module');
  });

  test('J3: Wrong current password (section-local), re-enrol authenticator (QR <= 192px + bad code), regenerate recovery codes, create & revoke token', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/account');

    // Wrong current password -> error inside credentials section below ActionBar (K2)
    await page.fill('#account-current-password', 'definitely-wrong-password');
    await page.fill('#account-new-password', 'NewValidPassphrase123!');
    await page.click('#btn-update-credentials');
    await expect(page.locator('#account-credentials-section #account-creds-notice.lp-notice-danger')).toBeVisible();

    // Re-enrol authenticator (QR <= 192px + manual key in Credential) & invalid 6-digit code -> section-local error
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-reenrol-box')).toBeVisible();
    await expect(page.locator('#account-totp-manual-cred[data-c="Credential"]')).toBeVisible();
    const qrBox = await page.locator('#account-totp-qr svg').boundingBox();
    expect(qrBox!.width).toBeLessThanOrEqual(192);
    await page.fill('#account-totp-code', '000000');
    await page.click('#btn-confirm-totp');
    await expect(page.locator('#account-totp-section #account-totp-notice.lp-notice-danger')).toBeVisible();

    // Regenerate recovery codes (8 in Credential list grid + Copy all -> Copied)
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output[data-c="Credential"] .lp-credential-cell')).toHaveCount(8);
    await page.click('#account-recovery-output-copy-btn');
    await expect(page.locator('#account-recovery-output-copied')).toHaveText('Copied');

    // Create then revoke a token (Credential single + Copy -> Copied + StatusLine on revoke)
    await page.fill('#account-token-label', 'journey-j3-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created[data-c="Credential"]')).toContainText('lp_pat_');
    await page.click('#account-token-created-copy-btn');
    await expect(page.locator('#account-token-created-copied')).toHaveText('Copied');
    const tokenItem = page.locator('#account-tokens-container [data-c="Item"]', { hasText: 'journey-j3-token' }).first();
    await expect(tokenItem.locator('[data-c="StatusLabel"]')).toHaveCount(0);
    await expect(tokenItem).toContainText('Created ');
    await tokenItem.locator('button[data-revoke-token]').click();
    await expect(page.locator('#account-tokens-list-notice.lp-status-line-ok')).toContainText('Token revoked.');
  });

  test('J4 (extended A2): Found (2 seeded contradictions) -> supersede one -> dismiss one -> error -> retry -> clean', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // Seed 2 pairs of conflicting claims across entries so detectTopologyConflicts finds 2 real contradictions
    const e1 = await (await page.request.post('/api/entries', {
      headers,
      data: {
        title: 'J4 Caching Decision A',
        slug: `j4-caching-a-${Date.now()}`,
        body_md: 'We recommend Redis caching for API gateway workloads.',
        visibility: 'private',
        valid_from: '2025-01-10T00:00:00.000Z',
      },
    })).json();
    const e2 = await (await page.request.post('/api/entries', {
      headers,
      data: {
        title: 'J4 Caching Decision B',
        slug: `j4-caching-b-${Date.now()}`,
        body_md: 'We avoid Redis caching for API gateway workloads because it is slower.',
        visibility: 'private',
        valid_from: '2026-01-10T00:00:00.000Z',
      },
    })).json();
    const rev1Id = e1.revision?.id;
    const rev2Id = e2.revision?.id;
    expect(rev1Id).toBeTruthy();
    expect(rev2Id).toBeTruthy();

    // Pair 1: Redis caching (recommend vs avoid)
    const c1 = await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev1Id, text: 'We recommend Redis caching for gateway latency.', kind: 'decision', scope: { domain: 'j4-redis' }, status: 'accepted' },
    });
    const c2 = await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev2Id, text: 'We avoid Redis caching for gateway latency as a bottleneck.', kind: 'decision', scope: { domain: 'j4-redis' }, status: 'accepted' },
    });
    // Pair 2: GraphQL federation (prefer vs avoid)
    const c3 = await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev1Id, text: 'We prefer GraphQL federation for service composition.', kind: 'decision', scope: { domain: 'j4-graphql' }, status: 'accepted' },
    });
    const c4 = await page.request.post('/api/structure/claims', {
      headers,
      data: { revision_id: rev2Id, text: 'We avoid GraphQL federation because it fails under load.', kind: 'decision', scope: { domain: 'j4-graphql' }, status: 'accepted' },
    });
    expect(c1.status()).toBe(201);
    expect(c2.status()).toBe(201);
    expect(c3.status()).toBe(201);
    expect(c4.status()).toBe(201);

    // Trigger detection
    const detRes = await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });
    expect(detRes.status()).toBe(200);

    // Load Contradictions tab -> state is 'found' with >= 2 contradictions (Part C decision-completeness)
    await page.goto('/admin/audit?status=contradictions');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'found');
    const rows = page.locator('#audit-conflicts-list [data-conflict-row]');
    const initialCount = await rows.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);
    await expect(rows.first().locator('.lp-item-claim-eyebrow')).toHaveCount(2);
    await expect(rows.first().locator('.lp-item-quote')).toHaveCount(2);
    await expect(rows.first().locator('a.lp-item-link')).toHaveCount(2);

    // Supersede first contradiction -> item removed, count updates, StatusLine confirms "Resolved"
    await rows.first().locator('button[data-conflict-res="supersedes"]').click();
    await expect(rows).toHaveCount(initialCount - 1);
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'resolved');
    await expect(page.locator('#audit-conflicts-resolved-status.lp-status-line-ok')).toHaveText('Resolved');

    // Dismiss remaining contradictions until clean
    while ((await rows.count()) > 0) {
      await rows.first().locator('button[data-conflict-res="dismiss"]').click();
      await page.waitForTimeout(100);
    }
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'clean');
    await expect(page.locator('#audit-state-headline')).toContainText('No contradictions found');

    // Error state via failing detect endpoint -> danger Notice below ActionBar
    await page.route('**/api/audit/topology-conflicts/detect', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Injected failure' }) })
    );
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'error');
    await expect(page.locator('#audit-conflicts-error')).toBeVisible();
    await expect(page.locator('#btn-detect-conflicts')).toHaveText(/Run check|Check again/);

    // Unroute & Retry -> succeeds (clean) with formatted timestamp
    await page.unroute('**/api/audit/topology-conflicts/detect');
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /clean|found/);
    await expect(page.locator('#audit-conflicts-error')).toBeHidden();
  });

  test('J5: Edit About, save, view revision (Current on newest, none on older), save empty rejected', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/pages?section=about');
    await expect(page.locator('#pages-tab-about')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pages-tab-home')).toHaveCount(0);

    await page.fill('#pages-body-md', 'First-day owner About update for J5.');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('#btn-save-page-section'),
    ]);
    await expect(page.locator('#pages-revisions-list [data-c="Item"]').first()).toContainText('Current');

    // Save empty rejected with danger notice
    await page.fill('#pages-body-md', '   ');
    await page.click('#btn-save-page-section');
    await expect(page.locator('#pages-status-line.lp-notice-danger')).toContainText('Content cannot be empty.');
  });

  test('J6: Set Home counts out of range and pin an unknown slug', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/home');

    // Out-of-range featured count
    await page.fill('#setting-home-featured-count', '99');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner.lp-notice-danger')).toContainText('between 0 and 20');

    // Valid count + unknown slug
    await page.fill('#setting-home-featured-count', '3');
    await page.fill('#setting-home-featured-slugs', 'unknown-nonexistent-slug');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner.lp-notice-danger')).toContainText('Unknown entry slug');
  });

  test('J7: Pick pack, fail AA (Save disabled + Notice), import bad then good JSON (K2 section-local), switch scope, reload persistence', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/settings/appearance');

    // Pick pack & fail AA -> Save disabled + Notice visible
    await page.selectOption('#setting-theme-pack', 'warm-ink');
    await page.fill('#setting-theme-accent-seed', '#CCCCCC');
    await expect(page.locator('#appearance-aa-error')).toBeVisible();
    await expect(page.locator('#appearance-aa-error')).toContainText('4.5:1');
    await expect(page.locator('#btn-save-settings-module')).toBeDisabled();

    // Import bad JSON (arbitrary CSS) -> rejected in Import section below ActionBar (K2)
    await page.selectOption('#setting-theme-pack', 'warm-ink');
    await expect(page.locator('#btn-save-settings-module')).toBeEnabled();
    await page.click('#btn-export-theme-pack');
    const validJson = await page.locator('#setting-theme-import-json').inputValue();
    await page.fill('#setting-theme-import-json', JSON.stringify({ ...JSON.parse(validJson), customCss: 'body{}' }));
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#appearance-portability-section #appearance-import-feedback.lp-notice-danger')).toContainText('customCss');

    // Import good JSON -> StatusLine (not green Notice) in Import section below ActionBar (K2)
    await page.fill('#setting-theme-import-json', validJson);
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#appearance-portability-section #appearance-import-feedback.lp-status-line-ok')).toContainText('Imported');

    // Switch scope to public -> shows contrast table, persists across reload
    await page.selectOption('#setting-appearance-scope', 'public');
    await expect(page.locator('#appearance-public-contrast-table')).toBeVisible();
    await page.selectOption('#setting-theme-pack', 'high-contrast');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#settings-status-banner.lp-status-line-ok')).toContainText('Saved public appearance');

    await page.reload();
    await expect(page.locator('#setting-theme-pack')).toHaveValue('warm-ink');
    await page.selectOption('#setting-appearance-scope', 'public');
    await expect(page.locator('#setting-theme-pack')).toHaveValue('high-contrast');

    // Restore default admin pack
    await page.selectOption('#setting-appearance-scope', 'admin');
    await page.selectOption('#setting-theme-pack', 'quiet-default');
    await page.click('#btn-save-settings-module');
  });

  test('J8: Add a venture, confirm, decline, and cancel bookings (Confirmed / Declined / Cancelled)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/ventures');
    await page.fill('#venture-name', 'Journey J8 Toolkit');
    await page.fill('#venture-description', 'Built during WP-17.10 self-test.');
    await page.click('#btn-create-venture');
    await expect(page.locator('#ventures-list')).toContainText('Journey J8 Toolkit');

    // Seed three bookings via public API: confirm one, decline one, confirm-then-cancel one
    const b1 = await page.request.post('/api/book', {
      data: { visitor_name: 'Alice', visitor_contact: 'alice@example.com', topic: 'J8 Confirm Topic', preferred_time: 'Tue 10:00' },
    });
    const b2 = await page.request.post('/api/book', {
      data: { visitor_name: 'Bob', visitor_contact: 'bob@example.com', topic: 'J8 Decline Topic', preferred_time: 'Wed 14:00' },
    });
    const b3 = await page.request.post('/api/book', {
      data: { visitor_name: 'Cara', visitor_contact: 'cara@example.com', topic: 'J8 Cancel Topic', preferred_time: 'Thu 16:00' },
    });
    expect(b1.status()).toBe(201);
    expect(b2.status()).toBe(201);
    expect(b3.status()).toBe(201);

    await page.goto('/admin/bookings');
    const rowConfirm = page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Confirm Topic' }).first();
    // Part C decision-completeness for Bookings confirm: slot (date+tz), requester name, received date all present before action
    await expect(rowConfirm.locator('[data-booking-slot]')).toContainText(/UTC|GMT|your time/i);
    await expect(rowConfirm.locator('[data-booking-requester]')).toHaveText('Alice');
    await expect(rowConfirm.locator('[data-booking-received]')).toContainText('Received ');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      rowConfirm.locator('button[data-booking-status="confirmed"]').click(),
    ]);
    await expect(page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Confirm Topic' }).first()).toContainText('Confirmed');

    // Verify Inbox decision-completeness (Part C): full unclamped question + received date present on Inbox list
    await page.goto('/admin/inbox');
    const inboxRow = page.locator('#inbox-list [data-c="Item"]').first();
    await expect(inboxRow.locator('.lp-item-title[data-title-variant="content"]')).toBeVisible();
    await expect(inboxRow).toContainText('Received ');
    await page.goto('/admin/bookings');

    const rowDecline = page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Decline Topic' }).first();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      rowDecline.locator('button[data-booking-status="declined"]').click(),
    ]);
    await expect(page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Decline Topic' }).first()).toContainText('Declined');

    const rowCancel = page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Cancel Topic' }).first();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      rowCancel.locator('button[data-booking-status="confirmed"]').click(),
    ]);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Cancel Topic' }).first().locator('button[data-booking-status="cancelled"]').click(),
    ]);
    await expect(page.locator('#bookings-list [data-c="Item"]', { hasText: 'J8 Cancel Topic' }).first()).toContainText('Cancelled');
  });
});
