import { randomBytes } from 'node:crypto';
import type { Hono } from 'hono';
import { hexToBase32, buildOtpAuthUri, generateQrCodeSvg } from './totp.js';
import { hashPassword, verifyPassword, verifyTotpCode, type AuthManager } from './security.js';

/**
 * WP-17.4 Account management routes (UX-41, UX-47, UX-49):
 * - POST /setup/reset (reset unconfirmed setup wizard dead end)
 * - PATCH /account (change username and/or password)
 * - POST /totp/reenrol & POST /totp/reenrol/confirm (re-enrol authenticator)
 * - POST /sessions/revoke-others (sign out all other sessions)
 */
export function registerAccountRoutes(router: Hono, auth: AuthManager): void {
  let pendingTotpSecret: string | null = null;

  // UX-49: allow resetting an unconfirmed setup if browser was closed before TOTP confirmation
  router.post('/setup/reset', (c) => {
    if (!auth.hasAccount()) {
      return c.json({ reset: true, message: 'No setup in progress.' }, 200);
    }
    if (auth.isSetupCompleted()) {
      return c.json(
        { error: 'Setup already completed', message: 'Account setup is already confirmed and cannot be reset.' },
        409
      );
    }
    (auth as any).account = null;
    if (typeof (auth as any).persistState === 'function') (auth as any).persistState();
    return c.json({ reset: true, message: 'Unconfirmed setup cleared. You can start setup again.' }, 200);
  });

  // Change username and/or password (UX-41)
  router.patch('/account', auth.requireAdminMiddleware(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || '');
    const newUsername = typeof body.newUsername === 'string' ? body.newUsername.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const account = (auth as any).account;
    if (!account) {
      return c.json({ error: 'Account not initialized' }, 400);
    }
    if (!currentPassword || !verifyPassword(currentPassword, account.passwordSalt, account.passwordHash)) {
      return c.json({ error: 'Invalid current password', message: 'Current password is incorrect.' }, 401);
    }
    if (!newUsername && !newPassword) {
      return c.json({ error: 'No changes provided', message: 'Enter a new username or new password.' }, 400);
    }
    if (newPassword && newPassword.length < 12) {
      return c.json({ error: 'Password too short', message: 'New password must be at least 12 characters.' }, 400);
    }
    if (newUsername) {
      account.username = newUsername;
    }
    if (newPassword) {
      const { salt, hash } = hashPassword(newPassword);
      account.passwordSalt = salt;
      account.passwordHash = hash;
    }
    if (typeof (auth as any).persistState === 'function') (auth as any).persistState();
    return c.json({ updated: true, username: account.username });
  });

  // Start authenticator re-enrolment (UX-41)
  router.post('/totp/reenrol', auth.requireAdminMiddleware(), async (c) => {
    const account = (auth as any).account;
    if (!account) return c.json({ error: 'Account not initialized' }, 400);
    pendingTotpSecret = randomBytes(20).toString('hex');
    const totpSecretBase32 = hexToBase32(pendingTotpSecret);
    const issuer = process.env.PUBLIC_SITE_NAME || 'The Living Portfolio';
    const otpauthUri = buildOtpAuthUri({
      issuer,
      accountName: account.username,
      secretBase32: totpSecretBase32,
    });
    const qrCodeSvg = await generateQrCodeSvg(otpauthUri);
    return c.json({ totpSecretBase32, otpauthUri, qrCodeSvg });
  });

  // Confirm authenticator re-enrolment (UX-41)
  router.post('/totp/reenrol/confirm', auth.requireAdminMiddleware(), async (c) => {
    const account = (auth as any).account;
    if (!account || !pendingTotpSecret) {
      return c.json({ error: 'No re-enrolment in progress', message: 'Start re-enrolment first.' }, 400);
    }
    const body = await c.req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    if (!verifyTotpCode(pendingTotpSecret, code)) {
      return c.json({ error: 'Invalid TOTP code', message: 'Check the 6-digit code in your authenticator app and retry.' }, 400);
    }
    account.totpSecret = pendingTotpSecret;
    pendingTotpSecret = null;
    if (typeof (auth as any).persistState === 'function') (auth as any).persistState();
    return c.json({ confirmed: true, message: 'Authenticator updated.' });
  });

  // Sign out all other active sessions (UX-41)
  router.post('/sessions/revoke-others', auth.requireAdminMiddleware(), (c) => {
    const cookieHeader = c.req.header('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)lp_session=([a-f0-9]+)/);
    const currentId = match ? match[1] : null;
    const sessions: Map<string, unknown> | undefined = (auth as any).sessions;
    let revokedCount = 0;
    if (sessions) {
      for (const id of Array.from(sessions.keys())) {
        if (id !== currentId) {
          sessions.delete(id);
          revokedCount++;
        }
      }
    }
    return c.json({ revokedCount });
  });
}
