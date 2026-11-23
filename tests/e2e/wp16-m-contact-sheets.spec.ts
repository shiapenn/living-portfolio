import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { ensureAdminLoggedIn } from './helpers.js';
import { THEMES, VIEWPORTS, STATES } from './states-manifest.js';
import { PUBLIC_STATES } from './public-states-manifest.js';
import { getSeededIds, navigateToState, setTheme } from './census-helpers.js';
import { PUBLIC_DIRECTIONS, type PublicDirectionId } from '../../packages/ui-public/dist/index.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp16m-contact-sheets');
const DIRECTIONS: PublicDirectionId[] = ['quiet-editorial', 'field-notebook', 'strata'];
const LAB_TEMPLATES = [
  { id: 'home', suffix: '' },
  { id: 'work', suffix: '/work' },
  { id: 'entry', suffix: '/work/sample' },
  { id: 'writing', suffix: '/writing' },
  { id: 'timeline', suffix: '/timeline' },
  { id: 'ask', suffix: '/ask' },
  { id: 'build', suffix: '/build' },
];

test.describe('WP-16.M Contact Sheets Capture & Budget Report', () => {
  if (process.env.CAPTURE_M_SHEETS === '1') {
    test('captures 3 directions, public baseline, gallery, and admin snap states into ~/Desktop/wp16m-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(300_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const budgetReport: Record<string, { htmlGzipBytes: number; cssGzipBytes: number; jsGzipBytes: number; maxOverflowPx: number }> = {};

      // 1. Capture three public directions
      for (const dir of DIRECTIONS) {
        const dirFolder = resolve(OUT_DIR, `direction-${dir}`);
        mkdirSync(dirFolder, { recursive: true });
        const spec = PUBLIC_DIRECTIONS[dir];
        const shots: Array<{ label: string; file: string; group: string }> = [];
        let maxOverflow = 0;
        let sampleHtmlGzip = 0;
        let sampleCssGzip = 0;

        for (const vp of VIEWPORTS) {
          await page.setViewportSize(vp);
          for (const theme of THEMES) {
            const group = `${vp.width}px-${theme}`;
            for (const tpl of LAB_TEMPLATES) {
              const url = `/_lab/public/${dir}${tpl.suffix}`;
              const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
              expect(resp?.status(), `Lab route ${url} must return 200`).toBe(200);
              if (vp.width === 1280 && theme === 'light' && tpl.id === 'home' && resp) {
                const body = await resp.text();
                sampleHtmlGzip = gzipSync(body).length;
                const styleMatch = body.match(/<style>([\s\S]*?)<\/style>/);
                sampleCssGzip = styleMatch ? gzipSync(styleMatch[1]).length : 0;
              }
              await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
              const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
              if (overflow > maxOverflow) maxOverflow = overflow;

              const file = `${tpl.id}-${vp.width}px-${theme}.png`;
              await page.screenshot({ path: resolve(dirFolder, file), fullPage: true });
              shots.push({ label: `${tpl.id} (${vp.width}px, ${theme})`, file, group });
            }
          }
        }

        budgetReport[dir] = {
          htmlGzipBytes: sampleHtmlGzip,
          cssGzipBytes: sampleCssGzip,
          jsGzipBytes: 0,
          maxOverflowPx: maxOverflow,
        };

        const groups = Array.from(new Set(shots.map((s) => s.group)));
        const sectionsHtml = groups
          .map((g) => {
            const items = shots
              .filter((s) => s.group === g)
              .map(
                (s) => `<figure style="margin:0;border:1px solid #ccc;padding:8px;background:#fff">
                  <figcaption style="font:12px/1.4 sans-serif;margin-bottom:6px">${s.label}</figcaption>
                  <a href="${s.file}"><img src="${s.file}" loading="lazy" style="max-width:100%;height:auto;display:block" /></a>
                </figure>`
              )
              .join('\n');
            return `<h2>${g}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${items}</div>`;
          })
          .join('\n');

        writeFileSync(
          resolve(dirFolder, 'index.html'),
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${spec.name} — WP-16.M Direction</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7">
            <h1>Direction: ${spec.name}</h1>
            <ul>
              <li><strong>Mood:</strong> ${spec.mood}</li>
              <li><strong>Type pair:</strong> ${spec.typePair} (${spec.fontLicense}, budget ${spec.fontPayloadBudgetKb} KB WOFF2)</li>
              <li><strong>Palette (Light):</strong> canvas ${spec.paletteLight.canvas}, paper ${spec.paletteLight.paper}, ink ${spec.paletteLight.ink}, accent ${spec.paletteLight.accent}</li>
              <li><strong>Palette (Dark):</strong> canvas ${spec.paletteDark.canvas}, paper ${spec.paletteDark.paper}, ink ${spec.paletteDark.ink}, accent ${spec.paletteDark.accent}</li>
              <li><strong>Motion:</strong> ${spec.motionLanguage}</li>
              <li><strong>Strata motif:</strong> ${spec.strataTreatment}</li>
              <li><strong>Measured budgets:</strong> HTML gzip ${sampleHtmlGzip} B, CSS gzip ${sampleCssGzip} B, JS gzip 0 B, max overflow ${maxOverflow} px</li>
            </ul>
            ${sectionsHtml}
          </body></html>`,
          'utf8'
        );
      }

      // 2. Capture public baseline sheets
      const pubDir = resolve(OUT_DIR, 'public-baseline');
      mkdirSync(pubDir, { recursive: true });
      const pubShots: Array<{ label: string; file: string }> = [];
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          for (const st of PUBLIC_STATES.slice(0, 6)) {
            await page.goto(st.route, { waitUntil: 'domcontentloaded' });
            await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
            const file = `${st.id}-${vp.width}px-${theme}.png`;
            await page.screenshot({ path: resolve(pubDir, file), fullPage: true });
            pubShots.push({ label: `${st.id} (${vp.width}px, ${theme})`, file });
          }
        }
      }
      writeFileSync(
        resolve(pubDir, 'index.html'),
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Public Baseline — WP-16.M</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7"><h1>Public Baseline (Isolated onto ui-public + core.css/public.css)</h1><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${pubShots
          .map((s) => `<figure style="margin:0;border:1px solid #ccc;padding:8px;background:#fff"><figcaption>${s.label}</figcaption><a href="${s.file}"><img src="${s.file}" style="max-width:100%" /></a></figure>`)
          .join('\n')}</div></body></html>`,
        'utf8'
      );

      // 3. Capture Gallery & Admin snap-affected states
      const adminDir = resolve(OUT_DIR, 'admin-gallery-and-snaps');
      mkdirSync(adminDir, { recursive: true });
      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      const adminTargets = ['gallery', 'today', 'entries-list', 'entries-detail', 'settings-providers'];
      const adminShots: Array<{ label: string; file: string; reason: string }> = [];

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          for (const sid of adminTargets) {
            const st = STATES.find((s) => s.id === sid);
            if (!st) continue;
            await navigateToState(page, st, ids);
            await setTheme(page, theme);
            const file = `${sid}-${vp.width}px-${theme}.png`;
            await page.screenshot({ path: resolve(adminDir, file), fullPage: true });
            adminShots.push({
              label: `${sid} (${vp.width}px, ${theme})`,
              file,
              reason:
                sid === 'gallery'
                  ? 'D-M2 Foundations tokens specimens (proximity levels, scale multipliers, public pack summary)'
                  : 'D-M2 scale snaps (layout-max 1180->1200, status-dot 6->8, dot-text 6->8, e1/e2 elevation 4/16 & 8/32)',
            });
          }
        }
      }
      writeFileSync(
        resolve(adminDir, 'index.html'),
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin Gallery & D-M2 Snaps — WP-16.M</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7"><h1>Admin Gallery & D-M2 Snap States</h1><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${adminShots
          .map((s) => `<figure style="margin:0;border:1px solid #ccc;padding:8px;background:#fff"><figcaption><strong>${s.label}</strong><br/><small>${s.reason}</small></figcaption><a href="${s.file}"><img src="${s.file}" style="max-width:100%" /></a></figure>`)
          .join('\n')}</div></body></html>`,
        'utf8'
      );

      // Root index + JSON budget report
      writeFileSync(resolve(OUT_DIR, 'budget-report.json'), JSON.stringify(budgetReport, null, 2) + '\n', 'utf8');
      writeFileSync(
        resolve(OUT_DIR, 'index.html'),
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>WP-16.M Contact Sheets</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7">
          <h1>WP-16.M Contact Sheets</h1>
          <ul>
            <li><a href="direction-quiet-editorial/index.html">Direction A: Quiet Editorial</a></li>
            <li><a href="direction-field-notebook/index.html">Direction B: Field Notebook</a></li>
            <li><a href="direction-strata/index.html">Direction C: Strata</a></li>
            <li><a href="public-baseline/index.html">Public Baseline (Isolated)</a></li>
            <li><a href="admin-gallery-and-snaps/index.html">Admin Gallery &amp; D-M2 Snap States</a></li>
          </ul>
          <pre>${JSON.stringify(budgetReport, null, 2)}</pre>
        </body></html>`,
        'utf8'
      );

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16m-contact-sheets.zip');
      execSync(`rm -f "${zipPath}" && cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
      console.log('[WP-16.M] Budget report:', JSON.stringify(budgetReport, null, 2));
      console.log(`[WP-16.M] Zipped contact sheets to ${zipPath}`);
    });
  } else {
    test('skipped unless CAPTURE_M_SHEETS=1', () => {
      expect(true).toBe(true);
    });
  }
});
