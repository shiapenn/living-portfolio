import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-4.2: Visitor Escalation Loop and Booking System (20261020-UX-08, UX-11)', () => {
  test('1. Tier 3 Booking form carries context, accepts submission without alert(), and displays confirmation (20261020-UX-11)', async ({ page }) => {
    // Navigate with prefilled topic and facets from Ask routing
    await page.goto('/book?q=Distributed%20Locking%20in%20Postgres&facets=scale%3Ahigh%2Cdatabase%3Apostgres');

    await expect(page.locator('h1')).toContainText('Book a conversation');
    await expect(page.locator('#book-topic')).toHaveValue('Distributed Locking in Postgres');
    await expect(page.locator('#book-facets')).toHaveValue('scale:high,database:postgres');

    // Fill contact details
    await page.fill('#book-name', 'Director of Engineering');
    await page.fill('#book-contact', 'director@startup.example');
    await page.fill('#book-time', 'Tuesdays 10:00 UTC');
    await page.fill('#book-notes', 'Migrating 50 services to PostgreSQL 16.');

    // Listen for alert() to ensure no alert dialog was triggered (UX-11 fix)
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    // Submit booking
    await page.click('#btn-submit-booking');

    // Verify confirmation section is revealed
    const confirmation = page.locator('#booking-confirmation');
    await expect(confirmation).toBeVisible({ timeout: 5000 });
    await expect(confirmation).toContainText('Consultation Request Received');
    await expect(page.locator('#conf-topic')).toContainText('Distributed Locking in Postgres');
    await expect(page.locator('#conf-contact')).toContainText('director@startup.example');
    expect(alertTriggered).toBe(false);

    // Verify persistence via Admin API
    await ensureAdminLoggedIn(page);
    const bookingCheck = await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      const res = await fetch('/api/book', {
        headers: { 'X-CSRF-Token': csrf || '' },
      });
      if (!res.ok) return null;
      return res.json();
    });

    expect(bookingCheck).not.toBeNull();
    expect(bookingCheck.bookings.length).toBeGreaterThan(0);
    const found = bookingCheck.bookings.find((b: any) => b.visitor_contact === 'director@startup.example');
    expect(found).toBeDefined();
    expect(found.topic).toBe('Distributed Locking in Postgres');
  });

  test('2. Visitor Escalation Receipt allows contact capture, owner review & approve, and status delivery (20261020-UX-08)', async ({ page }) => {
    // Ensure portfolio is seeded with the demo escalation
    await ensureAdminLoggedIn(page);
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
      });
    });

    // 1. Visitor visits receipt page for pending escalation
    await page.goto('/ask/status/seed-esc-status-token');
    await expect(page.locator('h1')).toContainText('Escalation Receipt');
    await expect(page.locator('.reading-column')).toContainText('Pending Review');
    await expect(page.locator('.reading-column')).toContainText('Should we use PostgreSQL advisory locks');
    await expect(page.locator('.reading-column')).toContainText('Pending Owner Review');

    // 2. Visitor attaches notification contact details
    await page.fill('#contact-input', 'lead.architect@company.com');
    await page.click('#btn-save-contact');
    const contactFeedback = page.locator('#contact-feedback');
    await expect(contactFeedback).toBeVisible();
    await expect(contactFeedback).toContainText('Contact details saved');

    // 3. Admin approves escalation via authenticated API with edited final reply (escalation Inbox UI retired in WP-15.4)
    await page.goto('/admin');
    const approvedText =
      'Approved owner reply: In our benchmarks, avoid holding locks during external HTTP calls; use pg-boss queues instead.';
    const approveStatus = await page.evaluate(async (finalReply) => {
      const csrf = sessionStorage.getItem('lp_csrf_token') || '';
      const listRes = await fetch('/api/v1/inbox');
      const listData = await listRes.json();
      const esc = (listData.escalations || []).find((e: any) =>
        String(e.question || '').includes('PostgreSQL advisory locks')
      );
      if (!esc) return 404;
      const res = await fetch(`/api/v1/inbox/${encodeURIComponent(esc.id)}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ finalReply }),
      });
      return res.status;
    }, approvedText);
    expect(approveStatus).toBe(200);

    // 4. Visitor refreshes/revisits status page and sees verified reply
    await page.goto('/ask/status/seed-esc-status-token');
    await expect(page.locator('.reading-column')).toContainText('Approved by Owner');
    await expect(page.locator('.reading-column')).toContainText("Owner's Verified Reply");
    await expect(page.locator('.reading-column')).toContainText(
      'Approved owner reply: In our benchmarks, avoid holding locks during external HTTP calls; use pg-boss queues instead.'
    );
  });

  test('3. Invalid or non-existent status token renders friendly 404 receipt screen', async ({ page }) => {
    await page.goto('/ask/status/non-existent-token-xyz');
    await expect(page.locator('h1')).toContainText('Receipt Status Not Found');
    await expect(page.locator('.reading-column')).toContainText('The token provided does not match any active escalation receipt');
    await expect(page.locator('a.btn')).toHaveAttribute('href', '/ask');
  });
});
