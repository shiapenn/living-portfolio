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

const OUT_DIR = join(process.cwd(), 'test-results', 'wp17-15-contact-sheets');
const BEFORE_STAGING = '/tmp/wp17-15-before-sheets';
const BEFORE_IDS = new Set([
  'audit-rules',
  'entries',
  'settings-answering',
  'settings-account',
  'booking-detail-pending',
  'contradictions-found',
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

test.describe('WP-17.15 Manifest-Driven Contact Sheets Capture (1x + K35 2x)', () => {
  test('captures 25e95c6 before-sheets when CAPTURE_WP17_BEFORE_15=1', async ({ page }) => {
    test.skip(process.env.CAPTURE_WP17_BEFORE_15 !== '1', 'Run with CAPTURE_WP17_BEFORE_15=1 to capture before-sheets');
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
        }, { theme: s.theme, strip: `BEFORE 25e95c6 | ${entry.id} | ${s.width}px ${s.theme}` });
        await page.screenshot({ path: join(BEFORE_STAGING, `${entry.id}-before-${s.width}px-${s.theme}.png`), fullPage: true });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }
    console.log(`Captured ${readdirSync(BEFORE_STAGING).length} before-sheets in ${BEFORE_STAGING}`);
  });

  test('captures 100% of WP17_MANIFEST (1x), K35 2x close-ups, State Matrix, Ladder Specimen, and 25e95c6 before-sheets', async ({ page, browser }) => {
    test.skip(process.env.CAPTURE_WP17_SHEETS !== '1', 'Run with CAPTURE_WP17_SHEETS=1 to capture contact sheets');
    test.setTimeout(360_000);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    const fixtures = await seedManifestFixtures(page);
    const indexRows: Array<{ file: string; state: string; assertion: string; checkIds: string }> = [];

    // Include 25e95c6 before-sheets (Audit, Entries, Answering, Account, Booking detail, Contradictions found)
    if (existsSync(BEFORE_STAGING)) {
      for (const f of readdirSync(BEFORE_STAGING).filter((n) => n.endsWith('.png')).sort()) {
        copyFileSync(join(BEFORE_STAGING, f), join(OUT_DIR, f));
        indexRows.push({
          file: f,
          state: `25e95c6 before (${f.replace(/\.png$/, '')})`,
          assertion: 'Pre-WP-17.15 baseline comparison sheet',
          checkIds: 'K28-K34',
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
          { theme: s.theme, strip: `${entry.id} [${entry.archetype}] | ${entry.stateLabel} | ${s.width}px ${s.theme} | ${entry.checkIds.join(',')},K28-K34` }
        );
        const file = `${entry.id}-${s.width}px-${s.theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, file), fullPage: true });
        indexRows.push({
          file,
          state: `${entry.id} (${entry.stateLabel}, ${s.width}px ${s.theme})`,
          assertion: entry.assertion,
          checkIds: `${entry.checkIds.join(', ')}, K28-K34`,
        });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }

    // K35: deviceScaleFactor 2 close-up captures (both themes)
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

    // Gallery 2x close-ups: State Matrix, Ladder Specimen, Tabs, Buttons, Field, Choice, Item dividers, Notice, StatusLabel
    const galleryEntry = WP17_MANIFEST.find((e) => e.id === 'gallery')!;
    await navigateToManifestEntry(page2x, galleryEntry, fixtures);
    const galleryShots: Array<{ id: string; selector: string; label: string; assertion: string }> = [
      { id: 'state-matrix-2x', selector: '#gallery-state-matrix', label: 'State Matrix (2x)', assertion: 'V1-V4, V8: tonal ladder, distinct signatures, unclipped focus rings, inset Item hover' },
      { id: 'ladder-specimen-2x', selector: '#gallery-ladder-specimen', label: 'Ladder Specimen (2x)', assertion: 'V3, V6: surface, border, fill, elevation, radius, and OKLCH status ramps' },
      { id: 'closeup-tabs-2x', selector: '#gallery-state-tabs', label: 'Tabs close-up (2x)', assertion: 'V1, V2, K32: 1px baseline hairline, 0-radius 2px accent bar, weight-stable 500, inset focus ring' },
      { id: 'closeup-buttons-2x', selector: '#gallery-state-buttons', label: 'Buttons close-up (2x)', assertion: 'V4, K31: primary accent fill, secondary neutral-tint-1 no outline, text accent, destructive' },
      { id: 'closeup-field-2x', selector: '#gallery-state-field', label: 'Field close-up (2x)', assertion: 'V3, V4, K29, K31: 3.0-3.5:1 control border, 8px control radius, focus/invalid/disabled' },
      { id: 'closeup-choice-2x', selector: '#gallery-state-choice', label: 'Choice close-up (2x)', assertion: 'V3, V4, K31: control border off, accent border + accent-tint-1 selected, 12px radius' },
      { id: 'closeup-items-2x', selector: '#gallery-state-items', label: 'Item dividers & hover close-up (2x)', assertion: 'V1, V8, K28: 0-radius ::after hairlines, inset 12px hover/pressed row, hidden hairline on hover' },
      { id: 'closeup-notice-2x', selector: '#gallery-closeups-notice', label: 'Notice close-up (2x)', assertion: 'V6, K35: OKLCH status ramp tints and borders (info, ok, warn, danger)' },
      { id: 'closeup-status-label-2x', selector: '#gallery-closeups-status', label: 'StatusLabel close-up (2x)', assertion: 'V6, K35: OKLCH status step 600 light / 400 dark, Pending on warning ramp' },
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
          checkIds: 'K35',
        });
      }
    }

    // Credential 2x close-up (from Account recovery codes revealed)
    const recEntry = WP17_MANIFEST.find((e) => e.id === 'account-recovery-codes')!;
    await navigateToManifestEntry(page2x, recEntry, fixtures);
    for (const theme of ['light', 'dark'] as const) {
      await set2xTheme(theme);
      const cred = page2x.locator('#account-recovery-output[data-c="Credential"]').first();
      if (await cred.count() > 0) {
        const file = `closeup-credential-2x-${theme}.png`;
        await cred.screenshot({ path: join(OUT_DIR, file) });
        indexRows.push({
          file,
          state: `Credential close-up (2x, ${theme})`,
          assertion: 'V1, V3, D7, K35: single raised container (12px radius), internal header, borderless mono grid',
          checkIds: 'K35',
        });
      }
    }
    await ctx2x.close();

    const idxLines = [
      '# WP-17.15 Contact Sheets Index',
      '',
      '| File | State | Assertion | Check ID |',
      '| --- | --- | --- | --- |',
      ...indexRows.map((r) => `| \`${r.file}\` | ${r.state} | ${r.assertion} | ${r.checkIds} |`),
      '',
    ];
    writeFileSync(join(OUT_DIR, 'INDEX.md'), idxLines.join('\n'), 'utf8');

    const zipPath = join(process.env.HOME || '~', 'Desktop', 'wp17-15-contact-sheets.zip');
    execSync(`rm -f "${zipPath}" && cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
    expect(existsSync(zipPath)).toBe(true);
    console.log(`Captured ${indexRows.length} WP-17.15 contact sheets -> ${zipPath}`);
  });
});
