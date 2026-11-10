import { type Page, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export const TEST_USERNAME = 'admin_tester';
export const TEST_PASSWORD = 'StrongMasterPassword2026!';
export const TEST_TOTP_SECRET = Buffer.alloc(20, 0x42).toString('hex');

const CACHE_FILE = resolve(process.cwd(), 'node_modules/.cache/e2e-totp-secret.txt');

export function saveSharedTotp(secret: string) {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, secret, 'utf8');
  } catch {}
}

export function getSharedTotp(): string {
  try {
    if (existsSync(CACHE_FILE)) {
      return readFileSync(CACHE_FILE, 'utf8').trim();
    }
  } catch {}
  return '';
}

export function computeTotp(secretHex: string, timestampMs = Date.now()): string {
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

export async function ensureAdminLoggedIn(page: Page) {
  await page.goto('/admin');
  if (page.url().includes('/admin/setup')) {
    await page.fill('#setup-username', TEST_USERNAME);
    await page.fill('#setup-password', TEST_PASSWORD);
    await page.fill('#setup-totp-secret', TEST_TOTP_SECRET);
    await page.click('button[type="submit"]');
    const enrolContainer = page.locator('#totp-enrolment-container');
    await enrolContainer.waitFor({ state: 'visible', timeout: 5000 });
    await page.fill('#confirm-totp-code', computeTotp(TEST_TOTP_SECRET));
    await page.click('#btn-confirm-totp');
    await expect(page.locator('#setup-status')).toBeVisible();
    saveSharedTotp(TEST_TOTP_SECRET);
    await page.goto('/admin/login');
  }
  if (page.url().includes('/admin/login')) {
    const totpSecret = getSharedTotp() || TEST_TOTP_SECRET;
    await page.fill('#login-username', TEST_USERNAME);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-totp', computeTotp(totpSecret));
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin');
  }
  await expect(page.locator('h1')).toContainText('Admin Workspace');
}
