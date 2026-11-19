import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  STATES,
  THEMES,
  VIEWPORTS,
  expectedSheetFiles,
  sheetFileName,
} from './states-manifest.js';
import { getSeededIds, navigateToState, setTheme } from './census-helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp16f-contact-sheets');

test.describe('WP-16.F F4 Contact Sheet Capture (STATES manifest x 2 themes x 320/1280/1920)', () => {
  if (process.env.CAPTURE_CONTACT_SHEETS === '1') {
    test('captures every STATES manifest entry x 2 themes x 320, 1280, 1920 and zips to ~/Desktop/wp16f-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const captured: Array<{ label: string; file: string; group: string }> = [];

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          const group = `${vp.width}px-${theme}`;
          for (const state of STATES) {
            const ok = await navigateToState(page, state, ids);
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(OUT_DIR, file),
              fullPage: state.fullPage ?? true,
            });
            captured.push({
              label: `${state.id} (${vp.width}px, ${theme})${ok ? '' : ' [fallback]'}`,
              file,
              group,
            });
          }
        }
      }

      // Verify 1:1 parity between STATES manifest and captured PNGs (D-FINAL #1)
      const actualFiles = readdirSync(OUT_DIR).filter((f) => f.endsWith('.png')).sort();
      const expected = expectedSheetFiles().sort();
      expect(actualFiles).toEqual(expected);

      // Generate HTML contact-sheet index
      const groups = Array.from(new Set(captured.map((c) => c.group)));
      const sectionsHtml = groups
        .map((g) => {
          const items = captured
            .filter((c) => c.group === g)
            .map(
              (c) => `<figure style="margin:0;border:1px solid #ccc;padding:8px;background:#fff">
                <figcaption style="font:12px/1.4 sans-serif;margin-bottom:6px">${c.label}</figcaption>
                <a href="${c.file}"><img src="${c.file}" loading="lazy" style="max-width:100%;height:auto;display:block" /></a>
              </figure>`
            )
            .join('\n');
          return `<h2>${g}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${items}</div>`;
        })
        .join('\n');

      writeFileSync(
        resolve(OUT_DIR, 'index.html'),
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>WP-16.F Contact Sheets</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7"><h1>WP-16.F Contact Sheets (${captured.length} captures)</h1>${sectionsHtml}</body></html>`,
        'utf8'
      );

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16f-contact-sheets.zip');
      execSync(`cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
      console.log(`[WP-16.F F4] Captured ${captured.length} PNGs and zipped to ${zipPath}`);
    });
  } else {
    test('STATES manifest parity guard (set CAPTURE_CONTACT_SHEETS=1 to capture)', () => {
      expect(expectedSheetFiles().length).toBe(STATES.length * THEMES.length * VIEWPORTS.length);
    });
  }
});
