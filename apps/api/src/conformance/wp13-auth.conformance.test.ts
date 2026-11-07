import { describe, it, expect } from 'vitest';
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
