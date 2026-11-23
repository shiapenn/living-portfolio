import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PUBLIC_STATES, THEMES, VIEWPORTS } from './public-states-manifest.js';

const CAPTURE = process.env.CAPTURE_PUBLIC_SHEETS === '1';
const OUT_DIR = process.env.PUBLIC_SHEETS_OUT_DIR || '/tmp/wp16n-public-sheets';

interface SheetFontRecord {
  id: string;
  route: string;
  viewport: number;
  theme: string;
  loadedFamilies: string[];
  bodyFont: string;
  headingFont: string;
  inlineStyles: number;
}

test.describe('WP-16.N Public Census (Core + Public-Only Checks + Real Fonts + CJK)', () => {
  test('every public route ships zero admin CSS/JS, loads real fonts, has zero inline styles, and passes isolation & a11y floors', async ({ page }) => {
    test.setTimeout(180_000);
    const failures: string[] = [];
    const fontRecords: SheetFontRecord[] = [];
    if (CAPTURE) mkdirSync(OUT_DIR, { recursive: true });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      for (const theme of THEMES) {
        for (const state of PUBLIC_STATES) {
          await page.goto(state.route, { waitUntil: 'load' });
          await page.evaluate(async (t) => {
            document.documentElement.setAttribute('data-theme', t);
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          }, theme);

          const result = await page.evaluate((sel) => {
            const lang = document.documentElement.getAttribute('data-lang');
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) =>
              l.getAttribute('href') || ''
            );
            const scripts = Array.from(document.querySelectorAll('script[src]')).map((s) =>
              s.getAttribute('src') || ''
            );
            const hasAdminCss = stylesheets.some((h) => h.includes('admin.'));
            const hasAdminJs = scripts.some((s) => s.includes('admin-entry') || s.includes('editor-page'));
            const hasCoreCss = stylesheets.some((h) => h.includes('core.'));
            const hasPublicCss = stylesheets.some((h) => h.includes('public.'));
            const hasAccentCss = stylesheets.some((h) => h.includes('accent.'));
            const overflowPx = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
            const markerPresent = Boolean(document.querySelector(sel));
            const skipLinkPresent = Boolean(document.querySelector('.skip-link, .lp-core-skip-link'));
            const inlineStyles = document.querySelectorAll('[style]').length;

            const loadedFamilies = Array.from(document.fonts)
              .filter((f) => f.status === 'loaded')
              .map((f) => f.family.replace(/^['"]|['"]$/g, ''));
            const uniqueLoaded = Array.from(new Set(loadedFamilies)).sort();

            const bodyFont = getComputedStyle(document.body).fontFamily;
            const h1 = document.querySelector('h1');
            const headingFont = h1 ? getComputedStyle(h1).fontFamily : bodyFont;

            // Check :lang(zh) rules when zh sample is present
            const zhEl = document.querySelector('.pub-zh-sample p') as HTMLElement | null;
            const zhEm = document.querySelector('.pub-zh-sample em') as HTMLElement | null;
            let zhCheck: { lineRatio: number; emFontStyle: string; letterSpacing: string } | null = null;
            if (zhEl) {
              const cs = getComputedStyle(zhEl);
              const lh = parseFloat(cs.lineHeight);
              const fs = parseFloat(cs.fontSize);
              zhCheck = {
                lineRatio: fs > 0 ? lh / fs : 0,
                emFontStyle: zhEm ? getComputedStyle(zhEm).fontStyle : 'normal',
                letterSpacing: cs.letterSpacing,
              };
            }

            return {
              lang,
              hasAdminCss,
              hasAdminJs,
              hasCoreCss,
              hasPublicCss,
              hasAccentCss,
              overflowPx,
              markerPresent,
              skipLinkPresent,
              inlineStyles,
              uniqueLoaded,
              bodyFont,
              headingFont,
              zhCheck,
            };
          }, state.markerSelector);

          const tag = `${state.id}@${vp.width}px-${theme}`;
          if (result.lang !== 'public') failures.push(`${tag}: data-lang=${result.lang} (expected public)`);
          if (result.hasAdminCss) failures.push(`${tag}: admin CSS shipped to public route`);
          if (result.hasAdminJs) failures.push(`${tag}: admin JS shipped to public route`);
          if (!result.hasCoreCss || !result.hasPublicCss || !result.hasAccentCss) {
            failures.push(`${tag}: missing core/public/accent CSS link`);
          }
          if (!result.markerPresent) failures.push(`${tag}: missing marker ${state.markerSelector}`);
          if (!result.skipLinkPresent) failures.push(`${tag}: missing skip link`);
          if (result.overflowPx > 2) failures.push(`${tag}: horizontal overflow ${result.overflowPx}px`);
          if (result.inlineStyles > 0) failures.push(`${tag}: ${result.inlineStyles} inline style= attributes`);
          if (!result.uniqueLoaded.includes('Literata')) {
            failures.push(`${tag}: Literata WOFF2 font not loaded (loaded=${result.uniqueLoaded.join(',')})`);
          }
          if (!result.uniqueLoaded.includes('Atkinson Hyperlegible Next')) {
            failures.push(`${tag}: Atkinson Hyperlegible Next WOFF2 font not loaded (loaded=${result.uniqueLoaded.join(',')})`);
          }
          if (state.id === 'pub-work-entry-zh') {
            if (!result.zhCheck) {
              failures.push(`${tag}: missing .pub-zh-sample Chinese passage`);
            } else {
              if (result.zhCheck.lineRatio < 1.65) {
                failures.push(`${tag}: :lang(zh) line-height ratio ${result.zhCheck.lineRatio.toFixed(2)} < 1.65`);
              }
              if (result.zhCheck.emFontStyle !== 'normal') {
                failures.push(`${tag}: :lang(zh) em has synthetic italic (${result.zhCheck.emFontStyle})`);
              }
            }
          }

          fontRecords.push({
            id: state.id,
            route: state.route,
            viewport: vp.width,
            theme,
            loadedFamilies: result.uniqueLoaded,
            bodyFont: result.bodyFont,
            headingFont: result.headingFont,
            inlineStyles: result.inlineStyles,
          });

          if (CAPTURE) {
            const filename = `${state.id}__${vp.width}px__${theme}.png`;
            await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: true });
          }
        }
      }
    }

    if (CAPTURE) {
      writeFileSync(resolve(OUT_DIR, 'fonts.json'), JSON.stringify(fontRecords, null, 2));
      const rows = fontRecords
        .map(
          (r) =>
            `<tr><td>${r.id}</td><td>${r.route}</td><td>${r.viewport}px</td><td>${r.theme}</td><td>${r.loadedFamilies.join(', ')}</td><td><a href="${r.id}__${r.viewport}px__${r.theme}.png">PNG</a></td></tr>`
        )
        .join('\n');
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>WP-16.N Public Contact Sheets</title>
<style>body{font-family:system-ui,sans-serif;max-width:1200px;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;font-size:13px}th{background:#f5f5f5}</style>
</head>
<body>
<h1>WP-16.N Public Contact Sheets (${fontRecords.length} sheets)</h1>
<p>Direction: Quiet Editorial (neutral, ADR-007). Fonts: Literata + Atkinson Hyperlegible Next (self-hosted WOFF2).</p>
<table><thead><tr><th>State</th><th>Route</th><th>Viewport</th><th>Theme</th><th>Loaded WOFF2 Faces</th><th>Sheet</th></tr></thead><tbody>
${rows}
</tbody></table>
</body></html>`;
      writeFileSync(resolve(OUT_DIR, 'index.html'), indexHtml);
    }

    expect(failures, failures.join('\n')).toHaveLength(0);
  });
});
