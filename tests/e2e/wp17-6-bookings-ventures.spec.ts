import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-17.6: Bookings & Ventures (/admin/bookings, /admin/ventures)', () => {
  test('public booking appears in /admin/bookings and can be confirmed; venture created in /admin/ventures appears on /build', async ({ page }) => {
    // 1. Submit public consultation request via API
    const bookRes = await page.request.post('/api/book', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        topic: 'Distributed systems review',
        visitor_name: 'Jordan Lee',
        visitor_contact: 'jordan@example.org',
        preferred_time: 'Next Tuesday afternoon',
        notes: 'Looking for architecture feedback.',
      },
    });
    expect(bookRes.status()).toBe(201);

    await ensureAdminLoggedIn(page);

    // 2. Verify booking appears in /admin/bookings and can be confirmed
    await page.goto('/admin/bookings');
    await expect(page.locator('h1')).toContainText('Bookings');
    await expect(page.locator('#bookings-list')).toContainText('Distributed systems review');
    const confirmBtn = page.locator('[data-c="Item"]:has-text("Distributed systems review") button[data-booking-status="confirmed"]').first();
    await confirmBtn.click();
    await expect(page.locator('[data-c="Item"]:has-text("Distributed systems review")')).toContainText('Active');

    // 3. Create venture on /admin/ventures and verify it appears on /build
    await page.goto('/admin/ventures');
    await expect(page.locator('h1')).toContainText('Ventures');
    await page.fill('#venture-name', 'Signal Bench');
    await page.fill('#venture-description', 'Lightweight telemetry studio for self-hosted apps.');
    await page.click('#btn-create-venture');
    await expect(page.locator('#ventures-list')).toContainText('Signal Bench');

    await page.goto('/build');
    await expect(page.locator('main')).toContainText('Signal Bench');
  });
});
