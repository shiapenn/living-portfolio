import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Hono, type Context, type Next } from 'hono';

export interface AdminAccount {
  username: string;
  passwordSalt: string;
  passwordHash: string;
  totpSecret: string;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  username: string;
  csrfToken: string;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface ApiBearerTokenRecord {
  id: string;
  label: string;
  tokenHash: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface RedactionPreviewTokenPayload {
  entryId: string;
  bodyHash: string;
  scanHash: string;
  warningCount: number;
  exp: number;
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex ?? randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt, hash: derived.toString('hex') };
}

export function verifyPassword(password: string, saltHex: string, expectedHashHex: string): boolean {
  const { hash } = hashPassword(password, saltHex);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHashHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * RFC 6238 HMAC-SHA1 TOTP (6 digits, 30-second step)
 */
export function computeTotpCode(secretHex: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const key = Buffer.from(secretHex, 'hex');
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000;
  return String(code).padStart(6, '0');
}

export function verifyTotpCode(secretHex: string, code: string, timestampMs = Date.now()): boolean {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  for (const offsetSteps of [-1, 0, 1]) {
    const candidate = computeTotpCode(secretHex, timestampMs + offsetSteps * 30_000);
    if (candidate === code) return true;
  }
  return false;
}

export interface AuthManagerOptions {
  signingKey?: string;
  bootstrapAdminToken?: string;
  storagePath?: string;
}

export class AuthManager {
  private signingKey: string;
  private dailyIpSalt: string;
  private storagePath?: string;
  private account: AdminAccount | null = null;
  private sessions = new Map<string, AdminSession>();
  private bearerTokens = new Map<string, ApiBearerTokenRecord>();
  private loginFailures = new Map<string, { count: number; windowStartMs: number }>();

  constructor(options?: AuthManagerOptions) {
    this.signingKey = options?.signingKey || process.env.SESSION_SECRET || randomBytes(32).toString('hex');
    this.dailyIpSalt = `${new Date().toISOString().slice(0, 10)}:${this.signingKey}`;
    this.storagePath = options?.storagePath || process.env.AUTH_STATE_FILE;

    if (this.storagePath && existsSync(this.storagePath)) {
      try {
        const raw = readFileSync(this.storagePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.account) {
          this.account = data.account;
        }
        if (Array.isArray(data.bearerTokens)) {
          for (const token of data.bearerTokens) {
            this.bearerTokens.set(token.id, token);
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    if (options?.bootstrapAdminToken && !this.account) {
      this.registerRawBearerToken('bootstrap-token', options.bootstrapAdminToken);
    }
  }

  private persistState(): void {
    if (!this.storagePath) return;
    try {
      const dir = dirname(this.storagePath);
      if (dir && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = {
        account: this.account,
        bearerTokens: Array.from(this.bearerTokens.values()),
      };
      writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Best-effort persistence
    }
  }

  isSetupCompleted(): boolean {
    return this.account !== null;
  }

  isConfigured(): boolean {
    return this.isSetupCompleted();
  }

  setupAdminAccount(username: string, password: string, customTotpSecretHex?: string): {
    username: string;
    totpSecret: string;
    initialBearerToken: string;
    tokenRecord: ApiBearerTokenRecord;
  } {
    if (this.account) {
      throw new Error('Admin account already configured');
    }
    const { salt, hash } = hashPassword(password);
    const totpSecret = customTotpSecretHex || randomBytes(20).toString('hex');
    this.account = {
      username,
      passwordSalt: salt,
      passwordHash: hash,
      totpSecret,
      createdAt: new Date().toISOString(),
    };
    this.persistState();
    const { rawToken, record } = this.issueBearerToken('initial-owner-token');
    return {
      username,
      totpSecret,
      initialBearerToken: rawToken,
      tokenRecord: record,
    };
  }

  registerRawBearerToken(label: string, rawToken: string): ApiBearerTokenRecord {
    const id = randomBytes(8).toString('hex');
    const record: ApiBearerTokenRecord = {
      id,
      label,
      tokenHash: sha256Hex(rawToken),
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };
    this.bearerTokens.set(id, record);
    this.persistState();
    return record;
  }

  issueBearerToken(label: string): { rawToken: string; record: ApiBearerTokenRecord } {
    const rawToken = `lp_pat_${randomBytes(24).toString('hex')}`;
    const record = this.registerRawBearerToken(label, rawToken);
    return { rawToken, record };
  }

  revokeBearerToken(id: string): boolean {
    const rec = this.bearerTokens.get(id);
    if (!rec) return false;
    rec.revokedAt = new Date().toISOString();
    this.persistState();
    return true;
  }

  listBearerTokens(): Omit<ApiBearerTokenRecord, 'tokenHash'>[] {
    return Array.from(this.bearerTokens.values()).map(({ tokenHash, ...rest }) => rest);
  }

  verifyBearerToken(rawToken: string): boolean {
    const candidateHash = sha256Hex(rawToken);
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    for (const rec of this.bearerTokens.values()) {
      if (rec.revokedAt) continue;
      const storedBuf = Buffer.from(rec.tokenHash, 'hex');
      if (storedBuf.length === candidateBuf.length && timingSafeEqual(storedBuf, candidateBuf)) {
        return true;
      }
    }
    return false;
  }

  checkLoginThrottle(hashedClientIp: string, nowMs = Date.now()): boolean {
    const windowMs = 15 * 60 * 1000;
    const entry = this.loginFailures.get(hashedClientIp);
    if (!entry) return true;
    if (nowMs - entry.windowStartMs > windowMs) {
      this.loginFailures.delete(hashedClientIp);
      return true;
    }
    return entry.count < 5;
  }

  recordLoginFailure(hashedClientIp: string, nowMs = Date.now()): void {
    const windowMs = 15 * 60 * 1000;
    const entry = this.loginFailures.get(hashedClientIp);
    if (!entry || nowMs - entry.windowStartMs > windowMs) {
      this.loginFailures.set(hashedClientIp, { count: 1, windowStartMs: nowMs });
    } else {
      entry.count += 1;
    }
  }

  clearLoginFailures(hashedClientIp: string): void {
    this.loginFailures.delete(hashedClientIp);
  }

  authenticateLogin(
    username: string,
    password: string,
    totpCode: string,
    hashedClientIp: string,
    nowMs = Date.now()
  ): { ok: true; session: AdminSession } | { ok: false; status: 401 | 429; error: string } {
    if (!this.checkLoginThrottle(hashedClientIp, nowMs)) {
      return { ok: false, status: 429, error: 'Too many failed login attempts. Try again later.' };
    }
    if (!this.account || this.account.username !== username) {
      this.recordLoginFailure(hashedClientIp, nowMs);
      return { ok: false, status: 401, error: 'Invalid credentials' };
    }
    if (!verifyPassword(password, this.account.passwordSalt, this.account.passwordHash)) {
      this.recordLoginFailure(hashedClientIp, nowMs);
      return { ok: false, status: 401, error: 'Invalid credentials' };
    }
    if (!verifyTotpCode(this.account.totpSecret, totpCode, nowMs)) {
      this.recordLoginFailure(hashedClientIp, nowMs);
      return { ok: false, status: 401, error: 'Invalid TOTP code' };
    }

    this.clearLoginFailures(hashedClientIp);
    const session: AdminSession = {
      id: randomBytes(24).toString('hex'),
      username: this.account.username,
      csrfToken: randomBytes(24).toString('hex'),
      createdAtMs: nowMs,
      expiresAtMs: nowMs + 12 * 3600 * 1000,
    };
    this.sessions.set(session.id, session);
    return { ok: true, session };
  }

  revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getHashedClientIp(c: Context): string {
    const trustProxy = process.env.TRUST_PROXY === 'true';
    const rawIp = trustProxy
      ? c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
      : '127.0.0.1';
    return sha256Hex(`${this.dailyIpSalt}:${rawIp}`);
  }

  /**
   * Checks whether request has valid admin authentication (either non-revoked Bearer token
   * or active session cookie + CSRF header on state-changing methods).
   */
  isAdminAuthenticated(c: Context): { authenticated: boolean; csrfFailed?: boolean } {
    const authHeader = c.req.header('authorization') || c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      if (this.verifyBearerToken(rawToken)) {
        return { authenticated: true };
      }
      return { authenticated: false };
    }

    const cookieHeader = c.req.header('cookie') || '';
    const sessionMatch = cookieHeader.match(/(?:^|;\s*)lp_session=([a-f0-9]+)/);
    if (!sessionMatch) {
      return { authenticated: false };
    }

    const session = this.sessions.get(sessionMatch[1]);
    if (!session || Date.now() > session.expiresAtMs) {
      if (session) this.sessions.delete(session.id);
      return { authenticated: false };
    }

    const method = c.req.method.toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const csrfHeader = c.req.header('x-csrf-token') || c.req.header('X-CSRF-Token');
      if (!csrfHeader || csrfHeader !== session.csrfToken) {
        return { authenticated: false, csrfFailed: true };
      }
    }

    return { authenticated: true };
  }

  requireAdminMiddleware() {
    return async (c: Context, next: Next) => {
      const check = this.isAdminAuthenticated(c);
      if (!check.authenticated) {
        if (check.csrfFailed) {
          return c.json({ error: 'Forbidden: missing or invalid CSRF token' }, 403);
        }
        const accept = c.req.header('accept') || c.req.header('Accept') || '';
        if (accept.includes('text/html')) {
          const target = this.isSetupCompleted() ? '/admin/login' : '/admin/setup';
          return c.redirect(target, 302);
        }
        return c.json({ error: 'Unauthorized: admin authentication required' }, 401);
      }
      await next();
    };
  }

  /**
   * Issues a signed redaction-preview confirmation token bound to entryId, bodyHash, and scan result, with expiry (C.4).
   */
  issueRedactionPreviewToken(params: {
    entryId: string;
    bodyMd: string;
    warnings: unknown[];
    ttlMs?: number;
  }): { token: string; payload: RedactionPreviewTokenPayload } {
    const bodyHash = sha256Hex(params.bodyMd);
    const scanHash = sha256Hex(JSON.stringify(params.warnings));
    const payload: RedactionPreviewTokenPayload = {
      entryId: params.entryId,
      bodyHash,
      scanHash,
      warningCount: params.warnings.length,
      exp: Date.now() + (params.ttlMs ?? 15 * 60 * 1000),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = createHmac('sha256', this.signingKey).update(encodedPayload).digest('base64url');
    return { token: `${encodedPayload}.${sig}`, payload };
  }

  /**
   * Verifies a signed redaction-preview confirmation token against entryId, bodyMd, scan result, and expiry (C.4).
   */
  verifyRedactionPreviewToken(
    token: unknown,
    expected: { entryId: string; bodyMd: string; warnings: unknown[] }
  ): { valid: boolean; reason?: string } {
    if (typeof token !== 'string' || !token.includes('.')) {
      return { valid: false, reason: 'Signed redaction preview token is required before publishing as public' };
    }
    const [encodedPayload, providedSig] = token.split('.');
    if (!encodedPayload || !providedSig) {
      return { valid: false, reason: 'Malformed redaction preview token' };
    }
    const expectedSig = createHmac('sha256', this.signingKey).update(encodedPayload).digest('base64url');
    const sigA = Buffer.from(providedSig);
    const sigB = Buffer.from(expectedSig);
    if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
      return { valid: false, reason: 'Invalid redaction preview token signature' };
    }

    let payload: RedactionPreviewTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch {
      return { valid: false, reason: 'Invalid redaction preview token payload' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'Redaction preview token has expired' };
    }
    if (payload.entryId !== expected.entryId) {
      const isDraftMatch = payload.entryId === 'draft' || expected.entryId === 'draft';
      if (!isDraftMatch) {
        return { valid: false, reason: 'Redaction preview token entryId mismatch' };
      }
    }
    const expectedBodyHash = sha256Hex(expected.bodyMd);
    if (payload.bodyHash !== expectedBodyHash) {
      return { valid: false, reason: 'Redaction preview token bodyHash does not match current revision content' };
    }
    const expectedScanHash = sha256Hex(JSON.stringify(expected.warnings));
    if (payload.scanHash !== expectedScanHash) {
      return { valid: false, reason: 'Redaction preview token scan result mismatch' };
    }

    return { valid: true };
  }
}

export function createAuthRoutes(auth: AuthManager) {
  const router = new Hono();

  // First-run admin setup wizard endpoint (C.3)
  router.post('/setup', async (c) => {
    if (auth.isSetupCompleted()) {
      return c.json({ error: 'Admin account is already configured' }, 409);
    }
    const body = await c.req.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!username || password.length < 12) {
      return c.json({ error: 'Username and password (min 12 chars) are required' }, 400);
    }

    const result = auth.setupAdminAccount(username, password, body.totpSecret);
    return c.json(
      {
        configured: true,
        username: result.username,
        totpSecret: result.totpSecret,
        bearerToken: result.initialBearerToken,
      },
      201
    );
  });

  // Login with password + TOTP and IP throttling (C.3)
  router.post('/login', async (c) => {
    const body = await c.req.json();
    const hashedIp = auth.getHashedClientIp(c);
    const res = auth.authenticateLogin(
      String(body.username || ''),
      String(body.password || ''),
      String(body.totpCode || ''),
      hashedIp
    );

    if (!res.ok) {
      return c.json({ error: res.error }, res.status);
    }

    c.header(
      'Set-Cookie',
      `lp_session=${res.session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`
    );
    return c.json({
      authenticated: true,
      username: res.session.username,
      csrfToken: res.session.csrfToken,
      expiresAt: new Date(res.session.expiresAtMs).toISOString(),
    });
  });

  // Logout (requires admin auth + CSRF if session-based)
  router.post('/logout', auth.requireAdminMiddleware(), async (c) => {
    const cookieHeader = c.req.header('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)lp_session=([a-f0-9]+)/);
    if (match) {
      auth.revokeSession(match[1]);
    }
    c.header('Set-Cookie', 'lp_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return c.json({ loggedOut: true });
  });

  // Issue hashed, revocable Bearer token (C.3)
  router.post('/tokens', auth.requireAdminMiddleware(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const label = String(body.label || 'owner-api-token');
    const { rawToken, record } = auth.issueBearerToken(label);
    return c.json(
      {
        token: rawToken,
        id: record.id,
        label: record.label,
        createdAt: record.createdAt,
      },
      201
    );
  });

  router.get('/tokens', auth.requireAdminMiddleware(), (c) => {
    return c.json({ tokens: auth.listBearerTokens() });
  });

  // Revoke Bearer token (C.3)
  router.delete('/tokens/:id', auth.requireAdminMiddleware(), (c) => {
    const id = c.req.param('id') || '';
    const ok = auth.revokeBearerToken(id);
    if (!ok) return c.json({ error: 'Token not found' }, 404);
    return c.json({ revoked: true, id });
  });

  return router;
}
