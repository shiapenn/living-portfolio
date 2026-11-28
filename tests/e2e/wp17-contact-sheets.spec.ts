import { test, expect, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  seedManifestFixtures,
  navigateToManifestEntry,
} from './wp17-manifest.js';

const OUT_DIR = join(process.cwd(), 'test-results', 'wp18-10-contact-sheets');
const BEFORE_STAGING = '/tmp/wp18-10-before-sheets';
const BEFORE_IDS = new Set([
  'import-review',
  'settings-storage',
  'editor-media-idle',
  'editor-media-error-oversize',
  'import-done',
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

async function prepCleanShot(page: Page, theme: 'light' | 'dark', strip?: string): Promise<void> {
  // V12 / K51: pointer off-page and focus on body
  await page.mouse.move(-100, -100);
  await page.evaluate(
    ({ t, s }) => {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && ae !== document.body && typeof ae.blur === 'function') {
        ae.blur();
      }
      if (document.activeElement !== document.body && typeof document.body.focus === 'function') {
        document.body.setAttribute('tabindex', '-1');
        document.body.focus({ preventScroll: true });
        document.body.removeAttribute('tabindex');
      }
      document.documentElement.setAttribute('data-theme-switching', 'true');
      document.documentElement.setAttribute('data-theme', t);
      void document.documentElement.offsetHeight;
      document.documentElement.removeAttribute('data-theme-switching');
      if (s !== undefined) {
        let bar = document.getElementById('wp17-marker-strip');
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'wp17-marker-strip';
          bar.style.cssText =
            'position:static;margin-top:24px;background:#14202A;color:#E6ECEF;font:11px/16px monospace;padding:4px 8px;pointer-events:none;';
          document.body.appendChild(bar);
        }
        bar.textContent = s;
      }
    },
    { t: theme, s: strip }
  );
}

test.describe('WP-18.10 Manifest-Driven Contact Sheets Capture (1x + 2x close-ups + before/after)', () => {
  test('captures de379ba before-sheets when CAPTURE_WP18_10_BEFORE=1', async ({ page }) => {
    test.skip(process.env.CAPTURE_WP18_10_BEFORE !== '1', 'Run with CAPTURE_WP18_10_BEFORE=1 to capture before-sheets');
    test.setTimeout(180_000);
    mkdirSync(BEFORE_STAGING, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);

    for (const entry of WP17_MANIFEST.filter((e) => BEFORE_IDS.has(e.id))) {
      for (const s of SHOTS_BEFORE) {
        await page.setViewportSize({ width: s.width, height: s.height });
        await navigateToManifestEntry(page, entry, fixtures);
        await prepCleanShot(page, s.theme, `BEFORE de379ba | ${entry.id} | ${s.width}px ${s.theme}`);
        await page.screenshot({
          path: join(BEFORE_STAGING, `${entry.id}-before-${s.width}px-${s.theme}.png`),
          fullPage: true,
        });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }
    console.log(`Captured ${readdirSync(BEFORE_STAGING).length} before-sheets in ${BEFORE_STAGING}`);
  });

  test('captures 100% of WP17_MANIFEST (1x), 2x close-ups (import-review card, storage row, media dialog, state matrix), and before/after sheets', async ({
    page,
    browser,
  }) => {
    test.skip(process.env.CAPTURE_WP17_SHEETS !== '1', 'Run with CAPTURE_WP17_SHEETS=1 to capture contact sheets');
    test.setTimeout(480_000);
    mkdirSync(OUT_DIR, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    const fixtures = await seedManifestFixtures(page);
    const indexRows: Array<{ file: string; state: string; assertion: string; checkIds: string }> = [];

    // Include de379ba before-sheets for before/after pairs
    if (existsSync(BEFORE_STAGING)) {
      for (const f of readdirSync(BEFORE_STAGING).filter((n) => n.endsWith('.png')).sort()) {
        copyFileSync(join(BEFORE_STAGING, f), join(OUT_DIR, f));
        indexRows.push({
          file: f,
          state: `de379ba before (${f.replace(/\.png$/, '')})`,
          assertion: 'Pre-WP-18.10 baseline comparison sheet',
          checkIds: 'K44-K54',
        });
      }
    }

    // 1x captures across 100% of WP17_MANIFEST (V12: dialog states viewport-sized; V16: deterministic per capture)
    for (const entry of WP17_MANIFEST) {
      for (const s of SHOTS_FULL) {
        await page.setViewportSize({ width: s.width, height: s.height });
        await navigateToManifestEntry(page, entry, fixtures);
        const isDialog = Boolean(entry.isDialog);
        await prepCleanShot(
          page,
          s.theme,
          isDialog
            ? undefined
            : `${entry.id} [${entry.archetype}] | ${entry.stateLabel} | ${s.width}px ${s.theme} | ${entry.checkIds.join(',')},K44-K54`
        );
        if (isDialog) {
          // Place marker strip pinned at bottom of dialog scrim so it appears inside the viewport capture
          await page.evaluate(
            (stripText) => {
              let bar = document.getElementById('wp17-marker-strip');
              if (!bar) {
                bar = document.createElement('div');
                bar.id = 'wp17-marker-strip';
                bar.style.cssText =
                  'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#14202A;color:#E6ECEF;font:11px/16px monospace;padding:4px 8px;pointer-events:none;';
                document.body.appendChild(bar);
              }
              bar.textContent = stripText;
            },
            `${entry.id} [${entry.archetype}] | ${entry.stateLabel} | ${s.width}px ${s.theme} | ${entry.checkIds.join(',')},K44-K54`
          );
        }
        const file = `${entry.id}-${s.width}px-${s.theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, file), fullPage: !isDialog });
        indexRows.push({
          file,
          state: `${entry.id} (${entry.stateLabel}, ${s.width}px ${s.theme})`,
          assertion: entry.assertion,
          checkIds: `${entry.checkIds.join(', ')}, K44-K54`,
        });
      }
      await page.evaluate(() => document.getElementById('wp17-marker-strip')?.remove());
    }

    // 2x close-ups (both themes): import-review card, storage row, media dialog, state matrix
    const ctx2x = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2,
    });
    const page2x = await ctx2x.newPage();
    await page2x.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page2x);

    const closeups: Array<{
      manifestId: string;
      selector: string;
      id: string;
      label: string;
      assertion: string;
      checkIds: string;
    }> = [
      {
        manifestId: 'import-review',
        selector: '#triage-cards-container [data-c="Item"]',
        id: 'closeup-import-review-card-2x',
        label: 'Import review Item card (2x)',
        assertion: 'V10, K46-K48: Item anatomy, leading 2px accent bar in bleed zone, stripped 2-line excerpt, auto-width Include/Leave out',
        checkIds: 'K45, K46, K47, K48',
      },
      {
        manifestId: 'settings-storage',
        selector: '#storage-media-list [data-c="Item"]',
        id: 'closeup-storage-row-2x',
        label: 'Storage Item row (2x)',
        assertion: 'V11, K45, K46, K49: Item anatomy, In use/Unused StatusLabel, ui-core date, danger-text Delete',
        checkIds: 'K45, K46, K47, K49',
      },
      {
        manifestId: 'editor-media-idle',
        selector: '#ref-media-dialog .lp-dialog-panel',
        id: 'closeup-media-dialog-2x',
        label: 'Editor media dialog (2x)',
        assertion: 'V12, K50-K52: Top-anchored dialog, Decorative Choice visible selected state, "Describe the image" placeholder',
        checkIds: 'K50, K51, K52',
      },
      {
        manifestId: 'gallery',
        selector: '#gallery-state-matrix',
        id: 'state-matrix-2x',
        label: 'State Matrix (2x)',
        assertion: 'V1-V4, H3: tonal ladder, distinct signatures, unclipped focus rings, outward-bleeding Item hover',
        checkIds: 'K25, K38',
      },
    ];

    for (const cc of closeups) {
      const mEntry = WP17_MANIFEST.find((e) => e.id === cc.manifestId);
      if (!mEntry) continue;
      await navigateToManifestEntry(page2x, mEntry, fixtures);
      for (const theme of ['light', 'dark'] as const) {
        await prepCleanShot(page2x, theme);
        const loc = page2x.locator(cc.selector).first();
        if ((await loc.count()) > 0) {
          const file = `${cc.id}-${theme}.png`;
          await loc.screenshot({ path: join(OUT_DIR, file) });
          indexRows.push({
            file,
            state: `${cc.label} (${theme})`,
            assertion: cc.assertion,
            checkIds: cc.checkIds,
          });
        }
      }
    }
    await ctx2x.close();

    const idxLines = [
      '# WP-18.10 Contact Sheets Index',
      '',
      '| File | State | Assertion | Check ID |',
      '| --- | --- | --- | --- |',
      ...indexRows.map((r) => `| \`${r.file}\` | ${r.state} | ${r.assertion} | ${r.checkIds} |`),
      '',
    ];
    writeFileSync(join(OUT_DIR, 'INDEX.md'), idxLines.join('\n'), 'utf8');

    const zipPath = join(process.env.HOME || '~', 'Desktop', 'wp18-10-contact-sheets.zip');
    execSync(`rm -f "${zipPath}" && cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
    expect(existsSync(zipPath)).toBe(true);
    console.log(`Captured ${indexRows.length} WP-18.10 contact sheets -> ${zipPath}`);
  });
});
