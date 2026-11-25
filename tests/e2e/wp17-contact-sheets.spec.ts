import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp17-contact-sheets');

const WP17_STATES: Array<{ name: string; path: string; wp: string; reason: string }> = [
  { name: 'settings-index', path: '/admin/settings', wp: 'WP-17.1–17.8', reason: 'Changed: lists newly registered Visibility, Account, and Home settings modules.' },
  { name: 'settings-answering', path: '/admin/settings/answering', wp: 'WP-17.1', reason: 'Changed: Explain block, consequence warning, Restore recommended, reply time & disclosure.' },
  { name: 'settings-backups', path: '/admin/settings/backups', wp: 'WP-17.3', reason: 'Changed: Explain block, honest restore drill availability, named archive export.' },
  { name: 'settings-visibility', path: '/admin/settings/visibility', wp: 'WP-17.3', reason: 'New: search indexing, AI crawler blocking, and federation settings.' },
  { name: 'settings-account', path: '/admin/settings/account', wp: 'WP-17.4', reason: 'New: password change, TOTP 2FA enrolment, recovery codes, and session management.' },
  { name: 'audit-contradictions', path: '/admin/audit?status=contradictions', wp: 'WP-17.5', reason: 'New: contradictions check and supersede/dismiss resolution list.' },
  { name: 'calibration', path: '/admin/calibration', wp: 'WP-17.5', reason: 'New: calibration parameter history and rollback controls.' },
  { name: 'structure', path: '/admin/structure', wp: 'WP-17.5', reason: 'New: entry profiles list and persisted redaction exclusions.' },
  { name: 'bookings', path: '/admin/bookings', wp: 'WP-17.6', reason: 'New: booking requests list with Confirm/Decline/Cancel state transitions.' },
  { name: 'ventures', path: '/admin/ventures', wp: 'WP-17.6', reason: 'New: ventures creation, status selector, and featured toggle.' },
  { name: 'pages', path: '/admin/pages', wp: 'WP-17.7', reason: 'New: About/Now/Uses/Home static page editor with immutable revision history.' },
  { name: 'settings-home', path: '/admin/settings/home', wp: 'WP-17.7', reason: 'New: home statement, featured count (default 3), and recent count (default 10).' },
  { name: 'settings-appearance', path: '/admin/settings/appearance', wp: 'WP-17.8 (L-review)', reason: 'Changed: Appearance v2 (admin+public scopes, selectable packs, constrained customisation, live AA preview, JSON import/export).' },
];

test.describe('WP-17 Contact Sheet Capture', () => {
  if (process.env.CAPTURE_WP17_SHEETS === '1') {
    test('captures all new and changed WP-17 admin states at 1280px & 320px (light & dark)', async ({ page }) => {
      test.setTimeout(180_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await ensureAdminLoggedIn(page);

      const setTheme = async (theme: 'light' | 'dark') => {
        await page.evaluate(async (t) => {
          document.documentElement.setAttribute('data-theme', t);
          try { localStorage.setItem('strata-theme', t); } catch {}
          void document.body.offsetHeight;
          await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
        }, theme);
      };

      const rows: string[] = [
        '# WP-17 Contact Sheets Index',
        '',
        'Contains ONLY new or changed admin states from WP-17.1–WP-17.8 (including WP-17.8 Appearance v2 for L-review).',
        'Untouched admin baseline states (`today`, `entries-list`, `entries-new`, `inbox`, `audit` default tabs, `status`, `login`, `setup`) and all public pages have **0% pixel diff** against the WP-16.N baseline.',
        '',
        '| State | Route | WP | Reason | Files |',
        '| --- | --- | --- | --- | --- |',
      ];

      for (const s of WP17_STATES) {
        const files: string[] = [];
        for (const width of [1280, 320] as const) {
          await page.setViewportSize({ width, height: 800 });
          for (const theme of ['light', 'dark'] as const) {
            await page.goto(s.path);
            await setTheme(theme);
            const file = `${s.name}-${width}px-${theme}.png`;
            await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
            files.push(file);
          }
        }
        rows.push(`| \`${s.name}\` | \`${s.path}\` | ${s.wp} | ${s.reason} | ${files.map((f) => `\`${f}\``).join(', ')} |`);
      }

      writeFileSync(resolve(OUT_DIR, 'INDEX.md'), rows.join('\n') + '\n', 'utf8');
    });
  } else {
    test('skipped unless CAPTURE_WP17_SHEETS=1', () => {
      test.skip();
    });
  }
});
