import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * RFC 6238 TOTP helper matching server implementation in apps/api/src/auth/security.ts
 */
function computeTotp(secretHex: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const key = Buffer.from(secretHex, 'hex');
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

const TEST_USERNAME = 'admin_tester';
const TEST_PASSWORD = 'StrongMasterPassword2026!';
let sharedTotpSecret = '';

test.describe.serial('WP-1 Task 1: Admin Setup & Authentication E2E Harness', () => {
  test('1. First-run setup wizard completes owner account creation', async ({ page }) => {
    // Navigating unauthenticated to /admin redirects to /admin/setup
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/setup$/);
    await expect(page.locator('h1')).toContainText('Owner Account Setup');

    // Fill in setup form (leave TOTP secret blank to exercise server-side random generation)
    await page.fill('#setup-username', TEST_USERNAME);
    await page.fill('#setup-password', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Setup success banner appears with confirmation and generated TOTP secret
    const statusBox = page.locator('#setup-status');
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText('Setup Completed!');
    
    const secretCode = statusBox.locator('code').first();
    await expect(secretCode).toBeVisible();
    sharedTotpSecret = (await secretCode.innerText()).trim();
    expect(sharedTotpSecret).toMatch(/^[a-f0-9]{40}$/i);

    await expect(page.locator('a[href="/admin/login"]')).toBeVisible();
  });

  test('2. /admin/setup is locked down once configured', async ({ page, request }) => {
    // Attempting to visit /admin/setup in browser redirects to /admin/login
    await page.goto('/admin/setup');
    await expect(page).toHaveURL(/\/admin\/login$/);

    // API endpoint /api/auth/setup returns 409 Conflict
    const response = await request.post('/api/auth/setup', {
      data: {
        username: 'intruder',
        password: 'AnotherPassword123!',
      },
    });
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toContain('already configured');
  });

  test('3. Open redirect prevention sanitizes `next` parameter upon login', async ({ page }) => {
    // Helper to log in with a given next parameter and assert resulting pathname
    async function testLoginWithNext(nextParam: string, expectedPathname: string) {
      await page.context().clearCookies();
      // Use encodeURI or raw query string as passed
      const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';
      await page.goto(`/admin/login${nextQuery}`);
      await page.fill('#login-username', TEST_USERNAME);
      await page.fill('#login-password', TEST_PASSWORD);
      await page.fill('#login-totp', computeTotp(sharedTotpSecret));
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === expectedPathname);
      expect(new URL(page.url()).pathname).toBe(expectedPathname);
    }

    // Required adversarial next cases:
    // 1. Protocol-relative //evil.com -> safe /admin fallback
    await testLoginWithNext('//evil.com', '/admin');

    // 2. Backslash prefix /\evil.com -> safe /admin fallback
    await testLoginWithNext('/\\evil.com', '/admin');

    // 3. Absolute external URL https://evil.com -> safe /admin fallback
    await testLoginWithNext('https://evil.com', '/admin');

    // 4. JavaScript URI javascript:alert(1) -> safe /admin fallback
    await testLoginWithNext('javascript:alert(1)', '/admin');

    // 5. URL-encoded backslash /%5Cevil.com -> safe /admin fallback
    await page.context().clearCookies();
    await page.goto('/admin/login?next=/%5Cevil.com');
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', computeTotp(sharedTotpSecret));
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');
    expect(new URL(page.url()).pathname).toBe('/admin');

    // 6. URL-encoded double slash /%2F%2Fevil.com -> safe /admin fallback
    await page.context().clearCookies();
    await page.goto('/admin/login?next=/%2F%2Fevil.com');
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', computeTotp(sharedTotpSecret));
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');
    expect(new URL(page.url()).pathname).toBe('/admin');

    // 7. Whitespace-prefixed malicious variant -> safe /admin fallback
    await testLoginWithNext('   //evil.com', '/admin');

    // 8. Whitespace-prefixed valid relative target -> trimmed and allowed
    await testLoginWithNext('   /admin/entries', '/admin/entries');

    // 9. Valid relative on-site destination (/admin/entries) -> must pass
    await testLoginWithNext('/admin/entries', '/admin/entries');
  });

  test('4. Standard login flow authenticates with password + TOTP to /admin', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Owner Sign in');

    const totpCode = computeTotp(sharedTotpSecret);
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', totpCode);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');
    await expect(page.locator('#btn-killswitch')).toBeVisible();
  });

  test('5. CSRF token is stored in sessionStorage and validated on admin requests', async ({ page }) => {
    // Log in to admin
    await page.goto('/admin/login');
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', computeTotp(sharedTotpSecret));
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');

    // Inspect sessionStorage for lp_csrf_token
    const storedCsrf = await page.evaluate(() => sessionStorage.getItem('lp_csrf_token'));
    expect(storedCsrf).toBeTruthy();
    expect(typeof storedCsrf).toBe('string');
    expect(storedCsrf!.length).toBeGreaterThan(16);

    // Request with valid CSRF token in X-CSRF-Token succeeds (200)
    const successResult = await page.evaluate(async (token) => {
      const res = await fetch('/api/settings/routing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({ automatedAnsweringEnabled: true }),
      });
      return { status: res.status, ok: res.ok };
    }, storedCsrf);
    expect(successResult.status).toBe(200);

    // State-changing request without X-CSRF-Token fails with 403 Forbidden
    const noTokenResult = await page.evaluate(async () => {
      const res = await fetch('/api/settings/routing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ automatedAnsweringEnabled: false }),
      });
      return { status: res.status };
    });
    expect(noTokenResult.status).toBe(403);

    // State-changing request with forged/invalid X-CSRF-Token fails with 403 Forbidden
    const badTokenResult = await page.evaluate(async () => {
      const res = await fetch('/api/settings/routing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'forged_csrf_token_12345',
        },
        body: JSON.stringify({ automatedAnsweringEnabled: false }),
      });
      return { status: res.status };
    });
    expect(badTokenResult.status).toBe(403);
  });

  test('6. Admin workspace apiClient error handling: forced 401, 403, 500 show recovery messages and suppress success banner', async ({ page }) => {
    // Navigate to admin workspace (already authenticated in session or re-authenticate)
    await page.goto('/admin');
    if (page.url().includes('/admin/login')) {
      await page.fill('#login-username', TEST_USERNAME);
      await page.fill('#login-password', TEST_PASSWORD);
      await page.fill('#login-totp', computeTotp(sharedTotpSecret));
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/admin');
    }

    const banner = page.locator('#admin-status-banner');
    const killBtn = page.locator('#btn-killswitch');
    await expect(killBtn).toBeVisible();

    // 1. Forced 401: session expired recovery message shown, success message suppressed
    await page.route('**/api/settings/routing', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired or unauthenticated' }),
      })
    );
    await killBtn.click();
    await expect(banner).toBeVisible();
    await expect(banner.locator('[data-error="401"]')).toBeVisible();
    await expect(banner).toContainText('Your session has expired');
    await expect(banner.locator('a[href="/admin/login"]')).toBeVisible();
    await expect(banner).not.toContainText('Automated answering is now');

    await page.unroute('**/api/settings/routing');

    // 2. Forced 403: CSRF security check failure recovery message shown, success message suppressed
    await page.route('**/api/settings/routing', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'CSRF token invalid or missing' }),
      })
    );
    await killBtn.click();
    await expect(banner.locator('[data-error="403"]')).toBeVisible();
    await expect(banner).toContainText('Security check failed (CSRF token invalid or missing)');
    await expect(banner).not.toContainText('Automated answering is now');

    await page.unroute('**/api/settings/routing');

    // 3. Forced 500: server error recovery message shown, success message suppressed
    await page.route('**/api/settings/routing', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );
    await killBtn.click();
    await expect(banner.locator('[data-error="500"]')).toBeVisible();
    await expect(banner).toContainText('Server error (HTTP 500)');
    await expect(banner).not.toContainText('Automated answering is now');

    await page.unroute('**/api/settings/routing');

    // 4. Redaction preview error handling: forced 401 on redaction preview
    const redactBtn = page.locator('#btn-redaction-check');
    const redactBox = page.locator('#redaction-preview-box');
    await page.fill('#entry-body', 'Draft text for testing error recovery');

    await page.route('**/api/entries/redaction-preview', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      })
    );
    await redactBtn.click();
    await expect(redactBox.locator('[data-error="401"]')).toBeVisible();
    await expect(redactBox).toContainText('Your session has expired');
    await expect(redactBox).not.toContainText('No confidential secrets or NDA markers detected');

    await page.unroute('**/api/entries/redaction-preview');

    // 5. Successful unintercepted request: success banner renders only when res.ok is true
    await killBtn.click();
    await expect(banner.locator('.as-of-banner')).toBeVisible();
    await expect(banner).toContainText('Automated answering is now');
    await expect(banner.locator('[data-error]')).toHaveCount(0);
  });
});
