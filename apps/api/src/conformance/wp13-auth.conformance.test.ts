import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { CONFIG_SETTINGS_METADATA, AppConfigSchema } from '@living-portfolio/config';
import { createApp } from '../app.js';
import { computeTotpCode } from '../auth/security.js';

describe('WP-13.1 Conformance: Real Authenticator Enrolment', () => {
  it('Setup generates valid base32 TOTP secret and otpauth URI', async () => {
    const { app, auth } = createApp();

    expect(auth.isSetupCompleted()).toBe(false);
    expect(auth.hasAccount()).toBe(false);

    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice_owner',
        password: 'SuperSecretPassword2026!',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.configured).toBe(true);
    expect(data.username).toBe('alice_owner');
    // Hex secret
    expect(data.totpSecret).toMatch(/^[0-9a-f]{40}$/i);
    // Base32 secret (20 bytes = 32 chars in Base32)
    expect(data.totpSecretBase32).toMatch(/^[A-Z2-7]{32}$/);
    // OTPAuth URI
    expect(data.otpauthUri).toContain('otpauth://totp/');
    expect(data.otpauthUri).toContain('secret=' + data.totpSecretBase32);
    // Local SVG QR code
    expect(data.qrCodeSvg).toContain('<svg');
    expect(data.qrCodeSvg).toContain('</svg>');

    // Account exists but is not yet marked complete until confirmed
    expect(auth.hasAccount()).toBe(true);
    expect(auth.isSetupCompleted()).toBe(false);
  });

  it('Confirms valid TOTP code via POST /auth/totp/confirm and rejects invalid codes', async () => {
    const { app, auth } = createApp();

    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'bob_owner',
        password: 'ValidPassword12345!',
      }),
    });
    expect(setupRes.status).toBe(201);
    const setupData = await setupRes.json();

    // 1. Invalid TOTP code is rejected
    const badConfirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '000000' }),
    });
    expect(badConfirmRes.status).toBe(400);
    const badData = await badConfirmRes.json();
    expect(badData.error).toContain('Invalid TOTP code');
    expect(auth.isSetupCompleted()).toBe(false);

    // 2. Valid TOTP code completes setup
    const validCode = computeTotpCode(setupData.totpSecret);
    const goodConfirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode }),
    });
    expect(goodConfirmRes.status).toBe(200);
    const goodData = await goodConfirmRes.json();
    expect(goodData.ok).toBe(true);
    expect(auth.isSetupCompleted()).toBe(true);

    // 3. Re-confirming already-completed setup returns 409
    const secondConfirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode }),
    });
    expect(secondConfirmRes.status).toBe(409);
  });
});

describe('WP-13.2 Conformance: Session from Setup', () => {
  it('Wizard completion issues lp_session cookie and csrfToken', async () => {
    const { app } = createApp();

    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'session_owner',
        password: 'ValidPassword12345!',
      }),
    });
    expect(setupRes.status).toBe(201);
    const setupData = await setupRes.json();

    const validCode = computeTotpCode(setupData.totpSecret);
    const confirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode }),
    });
    expect(confirmRes.status).toBe(200);

    // 1. Assert Set-Cookie header for lp_session
    const setCookie = confirmRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('lp_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');

    const match = setCookie!.match(/lp_session=([a-f0-9]+)/);
    expect(match).toBeTruthy();
    const sessionId = match![1];

    // 2. Assert response body contains csrfToken and authenticated: true
    const confirmData = await confirmRes.json();
    expect(confirmData.authenticated).toBe(true);
    expect(confirmData.username).toBe('session_owner');
    expect(confirmData.csrfToken).toBeTruthy();

    // 3. GET /auth/session with session cookie returns authenticated: true
    const sessionRes = await app.request('/api/auth/session', {
      headers: { Cookie: `lp_session=${sessionId}` },
    });
    expect(sessionRes.status).toBe(200);
    const sessionData = await sessionRes.json();
    expect(sessionData.authenticated).toBe(true);
    expect(sessionData.username).toBe('session_owner');
    expect(sessionData.csrfToken).toBe(confirmData.csrfToken);

    // 4. Authenticated request to /api/settings/notifications/test succeeds with session (returns 501 instead of 401)
    const alertRes = await app.request('/api/settings/notifications/test', {
      method: 'POST',
      headers: {
        Cookie: `lp_session=${sessionId}`,
        'X-CSRF-Token': confirmData.csrfToken,
      },
    });
    expect(alertRes.status).toBe(501);
  });
});

describe('WP-13.3 Conformance: Credentials Screen & Recovery Codes', () => {
  it('Generates 8 single-use recovery codes during setup; allows sign-in once per code', async () => {
    const { app, auth } = createApp();

    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'recovery_owner',
        password: 'ValidPassword12345!',
      }),
    });
    expect(setupRes.status).toBe(201);
    const setupData = await setupRes.json();

    // Setup returns 8 recovery codes
    expect(Array.isArray(setupData.recoveryCodes)).toBe(true);
    expect(setupData.recoveryCodes.length).toBe(8);
    for (const code of setupData.recoveryCodes) {
      expect(typeof code).toBe('string');
      expect(code).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}$/);
    }

    // Server stores only SHA-256 hashes, not plaintext recovery codes
    const account = (auth as any).account;
    expect(account).toBeTruthy();
    expect(Array.isArray(account.recoveryCodeHashes)).toBe(true);
    expect(account.recoveryCodeHashes.length).toBe(8);
    expect(account.recoveryCodeHashes).not.toContain(setupData.recoveryCodes[0]);

    // Confirm TOTP to mark setup completed
    const validTotp = computeTotpCode(setupData.totpSecret);
    const confirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validTotp }),
    });
    expect(confirmRes.status).toBe(200);

    // First login with recovery code #0 succeeds
    const codeToUse = setupData.recoveryCodes[0];
    const loginRes1 = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'recovery_owner',
        password: 'ValidPassword12345!',
        recoveryCode: codeToUse,
      }),
    });
    expect(loginRes1.status).toBe(200);
    const loginData1 = await loginRes1.json();
    expect(loginData1.authenticated).toBe(true);

    // Remaining stored recovery code hashes count is 7
    expect(account.recoveryCodeHashes.length).toBe(7);

    // Second login with the same recovery code #0 fails (single-use)
    const loginRes2 = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'recovery_owner',
        password: 'ValidPassword12345!',
        recoveryCode: codeToUse,
      }),
    });
    expect(loginRes2.status).toBe(401);
  });
});

describe('WP-13.4 Conformance: Persist Wizard Choices via Settings API', () => {
  it('Persists hosting, notifications, backups, and theme choices via PATCH endpoints and retrieves them via GET /settings', async () => {
    const { app } = createApp();

    // Complete setup first to get valid session and CSRF token
    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'wizard_persister',
        password: 'ValidPassword12345!',
      }),
    });
    expect(setupRes.status).toBe(201);
    const setupData = await setupRes.json();

    const validTotp = computeTotpCode(setupData.totpSecret);
    const confirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validTotp }),
    });
    expect(confirmRes.status).toBe(200);

    const setCookie = confirmRes.headers.get('set-cookie');
    const sessionId = setCookie!.match(/lp_session=([a-f0-9]+)/)![1];
    const confirmData = await confirmRes.json();
    const csrfToken = confirmData.csrfToken;

    const authHeaders = {
      'Content-Type': 'application/json',
      Cookie: `lp_session=${sessionId}`,
      'X-CSRF-Token': csrfToken,
    };

    // 1. PATCH /api/settings/hosting
    const hostingRes = await app.request('/api/settings/hosting', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        preset: 'private-local',
        publicAddress: 'https://my-domain.example.org',
      }),
    });
    expect(hostingRes.status).toBe(200);

    // 2. PATCH /api/settings/notifications
    const notifRes = await app.request('/api/settings/notifications', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        channel: 'email',
        target: 'alerts@domain.example.org',
      }),
    });
    expect(notifRes.status).toBe(200);

    // 3. PATCH /api/settings/backups
    const backupRes = await app.request('/api/settings/backups', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        destination: 's3',
        agePublicKey: 'age1testkey1234567890abcdef',
      }),
    });
    expect(backupRes.status).toBe(200);

    // 4. PATCH /api/settings/theme
    const themeRes = await app.request('/api/settings/theme', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        preset: 'modern-monospace',
      }),
    });
    expect(themeRes.status).toBe(200);

    // 5. GET /api/settings returns all persisted choices
    const getRes = await app.request('/api/settings', {
      headers: { Cookie: `lp_session=${sessionId}` },
    });
    expect(getRes.status).toBe(200);
    const settings = await getRes.json();

    expect(settings.hosting.preset).toBe('private-local');
    expect(settings.hosting.publicAddress).toBe('https://my-domain.example.org');
    expect(settings.notifications.channel).toBe('email');
    expect(settings.notifications.target).toBe('alerts@domain.example.org');
    expect(settings.backups.destination).toBe('s3');
    expect(settings.backups.agePublicKey).toBe('age1testkey1234567890abcdef');
    expect(settings.themePreset).toBe('modern-monospace');
  });

  it('WP-13.5: POST /api/settings/backups/run-drill reports honest disabled message when folder unconfigured (UX-33)', async () => {
    const { app, auth } = createApp();

    // 1. Setup admin and login
    const setupRes = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'drill_admin',
        password: 'ValidPassword12345!',
      }),
    });
    const setupData = await setupRes.json();
    const totpCode = computeTotpCode(setupData.totpSecret);
    const confirmRes = await app.request('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: totpCode }),
    });
    const confirmData = await confirmRes.json();
    const setCookie = confirmRes.headers.get('set-cookie') || '';
    const sessionMatch = setCookie.match(/lp_session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : '';
    const csrfToken = confirmData.csrfToken;

    // 2. Run drill without destinationDir
    const drillRes = await app.request('/api/settings/backups/run-drill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `lp_session=${sessionId}`,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({}),
    });

    expect(drillRes.status).toBe(501);
    const drillData = await drillRes.json();
    expect(drillData.code).toBe('SIMULATED');
    expect(drillData.finding).toBe('M1');
    expect(drillData.message).toContain('Not available until a backup folder is set');
  });

  it('WP-13.7: START-HERE.md runbook exists and verifies onboarding prerequisites, checklist, time, and port truth (UX-32)', () => {
    const startHerePath = resolve(__dirname, '../../../../docs/START-HERE.md');
    expect(existsSync(startHerePath)).toBe(true);
    const content = readFileSync(startHerePath, 'utf8');

    // Expected time < 15 min
    expect(content).toContain('< 15 min');

    // Prerequisites checklist
    expect(content).toContain('Node.js');
    expect(content).toContain('pnpm');
    expect(content).toContain('Authenticator App');

    // What to have to hand
    expect(content).toContain('What You Will Need to Hand');
    expect(content).toContain('recovery codes');

    // Ordered steps
    expect(content).toContain('Step 1: Clone the Repository');
    expect(content).toContain('Step 2: Configure Environment');
    expect(content).toContain('Step 3: Launch the Runtime');
    expect(content).toContain('Step 4: Open the Setup Wizard');
    expect(content).toContain('Step 5: Complete the 6-Step Setup Wizard');
    expect(content).toContain('Step 6: Verify Sign-Out and Login');

    // Port truth 4000
    expect(content).toContain('http://localhost:4000/admin/setup');
    expect(content).toContain('http://localhost:4000/admin/login');
  });

  it('WP-13.7: self-hosting documentation and compose stack reflect port 4000 truth and ENABLE_BUNDLED_WEB (UX-32)', () => {
    const selfHostingPath = resolve(__dirname, '../../../../docs/self-hosting.md');
    const selfHosting = readFileSync(selfHostingPath, 'utf8');
    expect(selfHosting).toContain('http://localhost:4000/admin/setup');
    expect(selfHosting).not.toContain('http://localhost:3000/admin/setup');
    expect(selfHosting).toContain('ENABLE_BUNDLED_WEB');

    const envExamplePath = resolve(__dirname, '../../../../.env.example');
    const envExample = readFileSync(envExamplePath, 'utf8');
    expect(envExample).toContain('ENABLE_BUNDLED_WEB=true');

    const composePath = resolve(__dirname, '../../../../docker/docker-compose.hobbyist.yml');
    const compose = readFileSync(composePath, 'utf8');
    expect(compose).toContain('"${PORT:-4000}:4000"');
    expect(compose).toContain('ENABLE_BUNDLED_WEB: ${ENABLE_BUNDLED_WEB:-true}');
  });

  it('WP-13.7: @living-portfolio/config schema defines ENABLE_BUNDLED_WEB with default true (UX-05, UX-32)', () => {
    const meta = CONFIG_SETTINGS_METADATA.find((m) => m.key === 'ENABLE_BUNDLED_WEB');
    expect(meta).toBeDefined();
    expect(meta?.defaultValue).toBe(true);

    const parsed = AppConfigSchema.parse({});
    expect(parsed.ENABLE_BUNDLED_WEB).toBe(true);
  });
});
