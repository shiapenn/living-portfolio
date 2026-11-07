import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { saveSharedTotp } from './helpers.js';

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

function base32ToHex(b32: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = b32.toUpperCase().replace(/[\s\-=]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes).toString('hex');
}

const TEST_USERNAME = 'admin_tester';
const TEST_PASSWORD = 'StrongMasterPassword2026!';
let sharedTotpSecret = '';
let sharedRecoveryCode = '';
let sharedRecoveryCode2 = '';
let sharedAllRecoveryCodes: string[] = [];
let sharedDownloadedFileContent = '';

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

    // WP-13.1: Enrolment container displays QR code SVG and manual Base32 key
    const enrolContainer = page.locator('#totp-enrolment-container');
    await expect(enrolContainer).toBeVisible();
    await expect(enrolContainer.locator('#setup-qr-code svg')).toBeVisible();

    const manualKeyEl = enrolContainer.locator('#setup-manual-key');
    await expect(manualKeyEl).toBeVisible();
    const manualBase32 = (await manualKeyEl.innerText()).trim();
    expect(manualBase32).toMatch(/^[A-Z2-7]{32}$/);
    const hexFromBase32 = base32ToHex(manualBase32);

    // Entering a wrong code fails verification and keeps setup incomplete
    await page.fill('#confirm-totp-code', '000000');
    await page.click('#btn-confirm-totp');
    const confirmError = page.locator('#totp-confirm-error');
    await expect(confirmError).toBeVisible();
    await expect(confirmError).toContainText('Check the 6-digit code');
    await expect(page.locator('#setup-status')).toBeHidden();

    // Entering the correct TOTP code completes setup
    const validCode = computeTotp(hexFromBase32);
    await page.fill('#confirm-totp-code', validCode);
    await page.click('#btn-confirm-totp');

    // Setup success banner appears with confirmation and generated TOTP secret
    const statusBox = page.locator('#setup-status');
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText('Setup Completed!');
    
    const secretCode = statusBox.locator('code').first();
    await expect(secretCode).toBeVisible();
    sharedTotpSecret = (await secretCode.innerText()).trim();
    saveSharedTotp(sharedTotpSecret);
    expect(sharedTotpSecret).toMatch(/^[a-f0-9]{40}$/i);
    expect(sharedTotpSecret.toLowerCase()).toBe(hexFromBase32.toLowerCase());

    // WP-13.2: Verify bearer token is not shown in the wizard (UX-30 part, D-12)
    expect(await statusBox.innerText()).not.toContain('Your initial API bearer token');
    expect(await statusBox.innerText()).not.toContain('lp_pat_');

    // WP-13.3: Credentials screen display with recovery codes and gate (UX-30)
    const credBox = page.locator('#credentials-display-container');
    await expect(credBox).toBeVisible();
    await expect(credBox.locator('#credentials-totp-key')).toBeVisible();

    // 8 recovery codes are rendered
    const codeElements = credBox.locator('#recovery-codes-grid code');
    await expect(codeElements).toHaveCount(8);
    sharedRecoveryCode = (await codeElements.first().innerText()).trim();
    sharedRecoveryCode2 = (await codeElements.nth(1).innerText()).trim();
    expect(sharedRecoveryCode).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}$/);
    expect(sharedRecoveryCode2).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}$/);

    // Continue button is disabled before ticking the gate
    const continueBtn = page.locator('#btn-continue-step2');
    await expect(continueBtn).toBeDisabled();

    // Download recovery codes file
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-download-recovery-codes');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('living-portfolio-recovery-codes.txt');
    const downloadPath = await download.path();
    if (downloadPath) {
      sharedDownloadedFileContent = readFileSync(downloadPath, 'utf8');
      const matched = sharedDownloadedFileContent.match(/[a-f0-9]{4}-[a-f0-9]{4}/g);
      if (matched) {
        sharedAllRecoveryCodes = matched;
      }
    }
    const displayedTexts = await codeElements.allInnerTexts();
    if (sharedAllRecoveryCodes.length === 0) {
      sharedAllRecoveryCodes = displayedTexts.map((c) => c.trim());
    }
    expect(sharedAllRecoveryCodes).toHaveLength(8);

    // Tick the "I saved these" gate
    await page.check('#setup-saved-credentials-gate');
    await expect(continueBtn).toBeEnabled();

    // WP-13.2 & WP-13.4: Session established from setup allows wizard choices to be saved and test buttons to succeed
    await continueBtn.click();
    await expect(page.locator('#wizard-step-2')).toBeVisible();

    // Step 2: Choose hosting preset and public address
    await page.check('input[name="hosting-preset"][value="private-local"]');
    await page.fill('#setup-origin-url', 'https://custom-origin.example.org');
    await page.click('#wizard-step-2 button[data-target="3"]');
    await expect(page.locator('#wizard-step-3')).toBeVisible();

    // Step 3 to Step 4
    await page.click('#wizard-step-3 button[data-target="4"]');
    await expect(page.locator('#wizard-step-4')).toBeVisible();

    // Step 4: Configure notifications & test alert delivery (WP-13.5: disabled until target configured)
    const testAlertBtn = page.locator('#btn-setup-test-alert');
    await expect(testAlertBtn).toBeDisabled();
    await expect(page.locator('#setup-alert-disabled-reason')).toBeVisible();

    await page.selectOption('#setup-notification-channel', 'email');
    await page.fill('#setup-notification-target', 'owner-alerts@example.org');
    await expect(testAlertBtn).toBeEnabled();

    await page.click('#btn-setup-test-alert');
    const alertResult = page.locator('#setup-alert-result');
    await expect(alertResult).toBeVisible();
    await expect(alertResult).not.toContainText('Unauthorized');
    await expect(alertResult).not.toContainText('401');

    await page.click('#wizard-step-4 button[data-target="5"]');
    await expect(page.locator('#wizard-step-5')).toBeVisible();

    // Step 5: Configure backups (WP-13.5: drill without folder shows honest disabled message UX-33)
    await page.click('#btn-setup-test-drill');
    const drillResult = page.locator('#setup-drill-result');
    await expect(drillResult).toBeVisible();
    await expect(drillResult).toContainText('Not available until a backup folder is set');

    await page.selectOption('#setup-backup-dest', 's3');
    await page.fill('#setup-backup-dir', '/var/backups');
    await page.fill('#setup-age-key', 'age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p');
    await page.click('#wizard-step-5 button[data-target="6"]');
    await expect(page.locator('#wizard-step-6')).toBeVisible();

    // Step 6: WP-13.5: single primary button on final screen (UX-29)
    await expect(page.locator('#wizard-step-6 .btn-primary')).toHaveCount(1);
    await expect(page.locator('#btn-setup-finish-login')).toHaveClass(/btn-primary/);
    await expect(page.locator('#btn-setup-launch-import')).toHaveClass(/btn-secondary/);

    // Step 6: Choose theme preset with real radio input
    await page.check('input[name="theme-preset"][value="modern-monospace"]');

    // WP-13.4: Reload page and verify choices persist
    await page.reload();
    await expect(page.locator('#wizard-step-2')).toBeVisible();
    await expect(page.locator('input[name="hosting-preset"][value="private-local"]')).toBeChecked();
    await expect(page.locator('#setup-origin-url')).toHaveValue('https://custom-origin.example.org');

    // Navigate to step 4 and check values
    await page.click('#wizard-step-2 button[data-target="3"]');
    await page.click('#wizard-step-3 button[data-target="4"]');
    await expect(page.locator('#setup-notification-channel')).toHaveValue('email');
    await expect(page.locator('#setup-notification-target')).toHaveValue('owner-alerts@example.org');

    // Navigate to step 5 and check values
    await page.click('#wizard-step-4 button[data-target="5"]');
    await expect(page.locator('#setup-backup-dest')).toHaveValue('s3');
    await expect(page.locator('#setup-age-key')).toHaveValue('age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p');

    // Navigate to step 6 and check theme preset
    await page.click('#wizard-step-5 button[data-target="6"]');
    await expect(page.locator('input[name="theme-preset"][value="modern-monospace"]')).toBeChecked();

    // Finish wizard
    await page.click('#btn-setup-finish-login');
    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');
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

    // 4. Successful unintercepted request: success banner renders only when res.ok is true
    await killBtn.click();
    await expect(banner.locator('.as-of-banner')).toBeVisible();
    await expect(banner).toContainText('Automated answering is now');
    await expect(banner.locator('[data-error]')).toHaveCount(0);
  });

  test('7. WP-13.3: Recovery code signs in once and is consumed', async ({ page }) => {
    // Clear cookies to test sign in from unauthenticated state
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Owner Sign in');

    // First login using single-use recovery code
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', sharedRecoveryCode);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');

    // Clear session to test second attempt with the same recovery code
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', sharedRecoveryCode);
    await page.click('button[type="submit"]');

    // Second sign-in fails because the recovery code was burned
    await expect(page).toHaveURL(/\/admin\/login/);
    const errorMsg = page.locator('#login-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText("That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once.");
  });

  test('8. WP-13.5: Wizard wording, states, and zero-vendor markup scan (UX-29, UX-33, CP-14, CP-15)', async () => {
    // 1. Verify zero-vendor scan on setup markup in renderer.ts
    const rendererPath = new URL('../../apps/web/src/renderer.ts', import.meta.url);
    const rendererSource = readFileSync(rendererPath, 'utf8');
    const setupFnMatch = rendererSource.match(/export function renderAdminSetupPage\(\)[\s\S]*?return renderLayout/);
    expect(setupFnMatch).toBeTruthy();
    const setupMarkup = setupFnMatch![0];

    // No hard-coded vendor, model, or sample names in setup markup
    expect(setupMarkup).not.toContain('OpenAI');
    expect(setupMarkup).not.toContain('Anthropic');
    expect(setupMarkup).not.toContain('Ollama');
    expect(setupMarkup).not.toContain('bge-small-en-v1.5');
    expect(setupMarkup).not.toContain('gpt-4o-mini');
    expect(setupMarkup).not.toContain('claude-3-5-sonnet');
    expect(setupMarkup).not.toContain('llama3.3');
    expect(setupMarkup).not.toContain('Scaling payment reconciliation');
    expect(setupMarkup).not.toContain('idempotent bisimulation');

    // 2. Render setup page and verify single primary action (.btn-primary) per step
    const { renderAdminSetupPage } = await import('../../apps/web/src/renderer.js');
    const html = renderAdminSetupPage();
    for (let step = 1; step <= 6; step++) {
      const stepMatch = html.match(new RegExp(`<div id="wizard-step-${step}"[\\s\\S]*?(?=<div id="wizard-step-${step + 1}"|</div>\\s*<script>)`));
      expect(stepMatch).toBeTruthy();
      const primaryMatches = stepMatch![0].match(/class="[^"]*btn-primary[^"]*"/g) || [];
      expect(primaryMatches.length).toBe(1);
    }
  });

  test('9. WP-13.6: Recovery code login path and admin sign-out flow (UX-31, UX-41)', async ({ page }) => {
    // 1. Visit /admin/login from unauthenticated state
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Owner Sign in');

    // Field explainer describes the 6-digit authenticator code (UX-31)
    const codeHelp = page.locator('#login-code-help');
    await expect(codeHelp).toBeVisible();
    await expect(codeHelp).toContainText('Enter the 6-digit verification code from your authenticator app');

    // 2. Toggle to recovery code mode via explicit path
    const toggleBtn = page.locator('#btn-toggle-recovery');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    const codeLabel = page.locator('#login-code-label');
    await expect(codeLabel).toContainText('Single-Use Recovery Code');
    await expect(page.locator('#login-totp')).toHaveAttribute('placeholder', 'xxxx-xxxx');
    await expect(codeHelp).toContainText('Enter one of your 8 emergency alphanumeric recovery codes');

    // 3. Sign in with recovery code 2
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', sharedRecoveryCode2);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');

    // 4. Header contains Sign out control (UX-41)
    const logoutBtn = page.locator('#btn-admin-logout');
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toContainText('Sign out');

    // 5. Sign out ends session and redirects to /admin/login
    await logoutBtn.click();
    await page.waitForURL((url) => url.pathname === '/admin/login');
    await expect(page.locator('h1')).toContainText('Owner Sign in');

    // Attempting to visit /admin now redirects back to /admin/login
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('10. WP-13.7: Standalone admin guard redirects unauthenticated /admin to /admin/login (UX-05, UX-32)', async ({ page }) => {
    await page.context().clearCookies();

    // 1. Unauthenticated direct navigation to /admin redirects to /admin/login
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Owner Sign in');

    // 2. Unauthenticated direct navigation to /admin/settings redirects to /admin/login
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 3. Unauthenticated direct navigation to /admin/import redirects to /admin/login
    await page.goto('/admin/import');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('11. WP-13.8: Recovery-code sign-in, pasting multi-line list rejection, normalisation, and single-use burn (UX-31)', async ({ page }) => {
    // 1. Verify login code input has no truncating maxlength attribute
    await page.context().clearCookies();
    await page.goto('/admin/login');
    const codeInput = page.locator('#login-totp');
    await expect(codeInput).not.toHaveAttribute('maxlength', '16');

    // 2. Toggle to recovery mode
    const toggleBtn = page.locator('#btn-toggle-recovery');
    await toggleBtn.click();
    await expect(page.locator('#login-code-label')).toContainText('Single-Use Recovery Code');

    // 3. Pasting whole multi-line recovery codes list shows "Enter one code at a time"
    const multiLinePasted = sharedDownloadedFileContent || 'e135-3eda\ncc77-b6f4\n9a12-88ef\n4b5c-6d7e';
    await page.evaluate((text) => {
      const input = document.getElementById('login-totp') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true,
      });
      pasteEvent.clipboardData!.setData('text/plain', text);
      input.dispatchEvent(pasteEvent);
    }, multiLinePasted);

    const errorMsg = page.locator('#login-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Enter one code at a time');

    // Submitting with multiple codes also triggers "Enter one code at a time"
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', 'e135-3eda cc77-b6f4');
    await page.click('button[type="submit"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Enter one code at a time');

    // 4. One code typed with messy formatting (spaces, uppercase) normalizes and signs in successfully
    const testCode1 = sharedAllRecoveryCodes[2] || 'a1b2-c3d4';
    const messyCode = `  ${testCode1.slice(0, 4).toUpperCase()} - ${testCode1.slice(5).toUpperCase()}  `;
    await page.fill('#login-totp', messyCode);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');

    // 5. Sign out and test one code pasted
    await page.click('#btn-admin-logout');
    await page.waitForURL((url) => url.pathname === '/admin/login');
    await toggleBtn.click();

    const testCode2 = sharedAllRecoveryCodes[3] || 'b2c3-d4e5';
    await page.evaluate((text) => {
      const input = document.getElementById('login-totp') as HTMLInputElement;
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, testCode2);
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');
    await expect(page.locator('h1')).toContainText('Admin Workspace');

    // 6. Sign out and test that the already-used code is rejected with exact recovery error message
    await page.click('#btn-admin-logout');
    await page.waitForURL((url) => url.pathname === '/admin/login');
    await toggleBtn.click();
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', testCode2);
    await page.click('button[type="submit"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText("That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once.");

    // 7. Verify all remaining recovery codes in the downloaded file (indices 4..7) sign in exactly once and burn
    for (let i = 4; i < sharedAllRecoveryCodes.length; i++) {
      const code = sharedAllRecoveryCodes[i];
      await page.fill('#login-totp', code);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/admin');
      await expect(page.locator('h1')).toContainText('Admin Workspace');

      // Sign out
      await page.click('#btn-admin-logout');
      await page.waitForURL((url) => url.pathname === '/admin/login');
      await toggleBtn.click();

      // Immediately verify this code cannot be used again
      await page.fill('#login-username', TEST_USERNAME);
      await page.fill('#login-password', TEST_PASSWORD);
      await page.fill('#login-totp', code);
      await page.click('button[type="submit"]');
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toContainText("That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once.");
    }
  });
});
