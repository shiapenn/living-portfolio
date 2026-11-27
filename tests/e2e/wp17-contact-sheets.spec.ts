import { test, expect } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  seedManifestFixtures,
  navigateToManifestEntry,
} from './wp17-manifest.js';

const OUT_DIR = join(process.cwd(), 'test-results', 'wp17-16-contact-sheets');
const BEFORE_STAGING = '/tmp/wp17-16-before-sheets';
const BEFORE_IDS = new Set([
  'bookings-list',
  'entries',
  'account-recovery-codes',
  'account-token-created',
  'account-totp',
  'import',
  'settings-answering',
  'structure',
  'today',
  'settings-index',
]);

type ShotSpec = { width: number; height: number; theme: 'light' | 'dark' };
const SHOTS_FULL: ShotSpec[] = [
  { width: 320, height: 640, theme: 'dark' },
  { width: 320, height: 640, theme: 'light' },
  { width: 1280, height: 800, theme: 'light' },
  { width: 1920, height: 900, theme: 'light' },
];
const SHOTS_BEFORE: ShotSpec[] = [
  { width: 320, height: 640, theme: 'dark' },
  { width: 320, height: 640, theme: 'light' },
  { width: 1280, height: 800, theme: 'light' },
];

test.describe('WP-17.16 Manifest-Driven Contact Sheets Capture (1x + 2x close-ups)', () => {
  test('captures 48ffbee before-sheets when CAPTURE_WP17_BEFORE_16=1', async ({ page }) => {
    test.skip(process.env.CAPTURE_WP17_BEFORE_16 !== '1', 'Run with CAPTURE_WP17_BEFORE_16=1 to capture before-sheets');
    test.setTimeout(180_000);
    mkdirSync(BEFORE_STAGING, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);

    for (const entry of WP17_MANIFEST.filter((e) => BEFORE_IDS.has(e.id))) {
      await navigateToManifestEntry(page, entry, fixtures);
      for (const s of SHOTS_BEFORE) {
        await page.setViewportSize({ width: s.width, height: s.height });
        await page.mouse.move(0, 0);
        await page.evaluate(({ theme, strip }) => {
          if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
            (document.activeElement as HTMLElement).blur();
          }
          document.documentElement.setAttribute('data-theme-switching', 'true');
          document.documentElement.setAttribute('data-theme', theme);
          void document.documentElement.offsetHeight;
          document.documentElement.removeAttribute('data-theme-switching');
          let bar = document.getElementById('wp17-marker-strip');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'wp17-marker-strip';
            bar.style.cssText = 'position:static;margin-top:24px;background:#14202A;color:#E6ECEF;font:11px/16px monospace;padding:4px 8px;pointer-events:none;';
            document.body.appendChild(bar);
          }
          bar.textContent = strip;
        }, { theme: s.theme, strip: `BEFORE 48ffbee | ${entry.id} | ${s.width}px ${s.theme}` });
        await page.screenshot({ path: join(BEFORE_STAGING, `${entry.id}-before-${s.width}px-${s.theme}.png`), fullPage: true });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }
    console.log(`Captured ${readdirSync(BEFORE_STAGING).length} before-sheets in ${BEFORE_STAGING}`);
  });

  test('captures 100% of WP17_MANIFEST (1x), 2x close-ups (Pager, Credential x3, Item bleed), and 48ffbee before-sheets', async ({ page, browser }) => {
    test.skip(process.env.CAPTURE_WP17_SHEETS !== '1', 'Run with CAPTURE_WP17_SHEETS=1 to capture contact sheets');
    test.setTimeout(360_000);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    const fixtures = await seedManifestFixtures(page);
    const indexRows: Array<{ file: string; state: string; assertion: string; checkIds: string }> = [];

    // Include 48ffbee before-sheets
    if (existsSync(BEFORE_STAGING)) {
      for (const f of readdirSync(BEFORE_STAGING).filter((n) => n.endsWith('.png')).sort()) {
        copyFileSync(join(BEFORE_STAGING, f), join(OUT_DIR, f));
        indexRows.push({
          file: f,
          state: `48ffbee before (${f.replace(/\.png$/, '')})`,
          assertion: 'Pre-WP-17.16 baseline comparison sheet',
          checkIds: 'K36-K43',
        });
      }
    }

    // 1x full-page captures across 100% of WP17_MANIFEST
    for (const entry of WP17_MANIFEST) {
      await navigateToManifestEntry(page, entry, fixtures);

      for (const s of SHOTS_FULL) {
        await page.setViewportSize({ width: s.width, height: s.height });
        await page.mouse.move(0, 0);
        await page.evaluate(
          ({ theme, strip }) => {
            if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
              (document.activeElement as HTMLElement).blur();
            }
            document.documentElement.setAttribute('data-theme-switching', 'true');
            document.documentElement.setAttribute('data-theme', theme);
            void document.documentElement.offsetHeight;
            document.documentElement.removeAttribute('data-theme-switching');
            let bar = document.getElementById('wp17-marker-strip');
            if (!bar) {
              bar = document.createElement('div');
              bar.id = 'wp17-marker-strip';
              bar.style.cssText = 'position:static;margin-top:24px;background:#14202A;color:#E6ECEF;font:11px/16px monospace;padding:4px 8px;pointer-events:none;';
              document.body.appendChild(bar);
            }
            bar.textContent = strip;
          },
          { theme: s.theme, strip: `${entry.id} [${entry.archetype}] | ${entry.stateLabel} | ${s.width}px ${s.theme} | ${entry.checkIds.join(',')},K36-K43` }
        );
        const file = `${entry.id}-${s.width}px-${s.theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, file), fullPage: true });
        indexRows.push({
          file,
          state: `${entry.id} (${entry.stateLabel}, ${s.width}px ${s.theme})`,
          assertion: entry.assertion,
          checkIds: `${entry.checkIds.join(', ')}, K36-K43`,
        });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }

    // deviceScaleFactor 2 close-up captures (both themes): Pager all states, Item hover bleed, Credential all 3 variants
    const ctx2x = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2,
    });
    const page2x = await ctx2x.newPage();
    await page2x.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page2x);

    const set2xTheme = async (theme: 'light' | 'dark') => {
      await page2x.mouse.move(0, 0);
      await page2x.evaluate((t) => {
        if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          (document.activeElement as HTMLElement).blur();
        }
        document.documentElement.setAttribute('data-theme-switching', 'true');
        document.documentElement.setAttribute('data-theme', t);
        void document.documentElement.offsetHeight;
        document.documentElement.removeAttribute('data-theme-switching');
      }, theme);
    };

    const galleryEntry = WP17_MANIFEST.find((e) => e.id === 'gallery')!;
    await navigateToManifestEntry(page2x, galleryEntry, fixtures);
    const galleryShots: Array<{ id: string; selector: string; label: string; assertion: string }> = [
      { id: 'closeup-pager-2x', selector: '#gallery-closeups-pager', label: 'Pager all states close-up (2x)', assertion: 'H5, K41: single-row 44x44 tonal icon buttons, first/middle/last disabled ladder, tabular summary' },
      { id: 'closeup-item-bleed-2x', selector: '#gallery-state-items', label: 'Item hover bleed close-up (2x)', assertion: 'H3, K38: text & hairlines flush on content edge, 8px outward hover/pressed surface bleed' },
      { id: 'state-matrix-2x', selector: '#gallery-state-matrix', label: 'State Matrix (2x)', assertion: 'V1-V4, H3: tonal ladder, distinct signatures, unclipped focus rings, outward-bleeding Item hover' },
    ];

    for (const theme of ['light', 'dark'] as const) {
      await set2xTheme(theme);
      for (const shot of galleryShots) {
        const loc = page2x.locator(shot.selector).first();
        if (await loc.count() === 0) continue;
        const file = `${shot.id}-${theme}.png`;
        await loc.screenshot({ path: join(OUT_DIR, file) });
        indexRows.push({
          file,
          state: `${shot.label} (${theme})`,
          assertion: shot.assertion,
          checkIds: 'K38, K41',
        });
      }
    }

    // Credential 2x close-ups (all 3 variants: recovery codes, API token, TOTP QR + manual key)
    const credCloseups: Array<{ manifestId: string; selector: string; id: string; label: string }> = [
      { manifestId: 'account-recovery-codes', selector: '#account-recovery-output[data-c="Credential"]', id: 'closeup-credential-recovery-2x', label: 'Credential recovery codes (2x)' },
      { manifestId: 'account-token-created', selector: '#account-token-created[data-c="Credential"]', id: 'closeup-credential-token-2x', label: 'Credential API token (2x)' },
      { manifestId: 'account-totp', selector: '#account-totp-reenrol-box', id: 'closeup-credential-totp-2x', label: 'Credential TOTP QR + manual key (2x)' },
    ];
    for (const cc of credCloseups) {
      const mEntry = WP17_MANIFEST.find((e) => e.id === cc.manifestId)!;
      await navigateToManifestEntry(page2x, mEntry, fixtures);
      for (const theme of ['light', 'dark'] as const) {
        await set2xTheme(theme);
        const loc = page2x.locator(cc.selector).first();
        if (await loc.count() > 0) {
          const file = `${cc.id}-${theme}.png`;
          await loc.screenshot({ path: join(OUT_DIR, file) });
          indexRows.push({
            file,
            state: `${cc.label} (${theme})`,
            assertion: 'H6, K42: header icon-only Copy button, no footer, sunken borderless value panel, QR 16px quiet zone',
            checkIds: 'K42',
          });
        }
      }
    }
    await ctx2x.close();

    const idxLines = [
      '# WP-17.16 Contact Sheets Index',
      '',
      '| File | State | Assertion | Check ID |',
      '| --- | --- | --- | --- |',
      ...indexRows.map((r) => `| \`${r.file}\` | ${r.state} | ${r.assertion} | ${r.checkIds} |`),
      '',
    ];
    writeFileSync(join(OUT_DIR, 'INDEX.md'), idxLines.join('\n'), 'utf8');

    const zipPath = join(process.env.HOME || '~', 'Desktop', 'wp17-16-contact-sheets.zip');
    execSync(`rm -f "${zipPath}" && cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
    expect(existsSync(zipPath)).toBe(true);
    console.log(`Captured ${indexRows.length} WP-17.16 contact sheets -> ${zipPath}`);
  });
});
