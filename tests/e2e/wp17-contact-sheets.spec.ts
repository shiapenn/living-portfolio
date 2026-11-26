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

const OUT_DIR = join(process.cwd(), 'test-results', 'wp17-14-contact-sheets');
const BEFORE_STAGING = '/tmp/wp17-14-before-sheets';

type ShotSpec = { width: number; height: number; theme: 'light' | 'dark' };
const SHOTS_FULL: ShotSpec[] = [
  { width: 320, height: 640, theme: 'dark' },
  { width: 320, height: 640, theme: 'light' },
  { width: 1280, height: 800, theme: 'light' },
  { width: 1920, height: 900, theme: 'light' },
];

test.describe('WP-17.14 Manifest-Driven Contact Sheets Capture', () => {
  test.skip(process.env.CAPTURE_WP17_SHEETS !== '1', 'Run with CAPTURE_WP17_SHEETS=1 to capture contact sheets');

  test('captures 100% of WP17_MANIFEST (320 dark/light, 1280 light, 1920 light), State Matrix both themes, and da622d0 before-sheets', async ({ page }) => {
    test.setTimeout(360_000);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    const fixtures = await seedManifestFixtures(page);
    const indexRows: Array<{ file: string; state: string; assertion: string; checkIds: string }> = [];

    // Include da622d0 before-sheets (Account, Booking detail, Contradictions found)
    if (existsSync(BEFORE_STAGING)) {
      for (const f of readdirSync(BEFORE_STAGING).filter((n) => n.endsWith('.png')).sort()) {
        copyFileSync(join(BEFORE_STAGING, f), join(OUT_DIR, f));
        indexRows.push({
          file: f,
          state: `da622d0 before (${f.replace(/\.png$/, '')})`,
          assertion: 'Pre-WP-17.14 baseline comparison sheet',
          checkIds: 'K22-K26',
        });
      }
    }

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
          { theme: s.theme, strip: `${entry.id} [${entry.archetype}] | ${entry.stateLabel} | ${s.width}px ${s.theme} | ${entry.checkIds.join(',')}` }
        );
        const file = `${entry.id}-${s.width}px-${s.theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, file), fullPage: true });
        indexRows.push({
          file,
          state: `${entry.id} (${entry.stateLabel}, ${s.width}px ${s.theme})`,
          assertion: entry.assertion,
          checkIds: entry.checkIds.join(', '),
        });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());

      // State Matrix focused captures in both themes
      if (entry.id === 'gallery') {
        for (const s of [
          { width: 1280, height: 900, theme: 'light' as const },
          { width: 1280, height: 900, theme: 'dark' as const },
          { width: 320, height: 640, theme: 'light' as const },
          { width: 320, height: 640, theme: 'dark' as const },
        ]) {
          await page.setViewportSize({ width: s.width, height: s.height });
          await page.mouse.move(0, 0);
          await page.evaluate((theme) => {
            document.documentElement.setAttribute('data-theme-switching', 'true');
            document.documentElement.setAttribute('data-theme', theme);
            void document.documentElement.offsetHeight;
            document.documentElement.removeAttribute('data-theme-switching');
          }, s.theme);
          const file = `state-matrix-${s.width}px-${s.theme}.png`;
          await page.locator('#gallery-state-matrix').screenshot({ path: join(OUT_DIR, file) });
          indexRows.push({
            file,
            state: `state-matrix (${s.width}px ${s.theme})`,
            assertion: 'D5 tonal hover/active ladder, unified unclipped focus ring, distinct disabled Choice',
            checkIds: 'K25',
          });
        }
      }
    }

    const idxLines = [
      '# WP-17.14 Contact Sheets Index',
      '',
      '| File | State | Assertion | Check ID |',
      '| --- | --- | --- | --- |',
      ...indexRows.map((r) => `| \`${r.file}\` | ${r.state} | ${r.assertion} | ${r.checkIds} |`),
      '',
    ];
    writeFileSync(join(OUT_DIR, 'INDEX.md'), idxLines.join('\n'), 'utf8');

    const zipPath = join(process.env.HOME || '~', 'Desktop', 'wp17-14-contact-sheets.zip');
    execSync(`rm -f "${zipPath}" && cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
    expect(existsSync(zipPath)).toBe(true);
    console.log(`Captured ${indexRows.length} WP-17.14 contact sheets -> ${zipPath}`);
  });
});
