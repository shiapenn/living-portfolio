import { test, expect } from '@playwright/test';
import { PUBLIC_STATES, THEMES, VIEWPORTS } from './public-states-manifest.js';

test.describe('WP-16.M D-M3/D-M4 Public Census (Core + Public-Only Checks)', () => {
  test('every public route ships zero admin CSS/JS and passes containment, isolation, and accessibility floors', async ({ page }) => {
    const failures: string[] = [];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      for (const theme of THEMES) {
        for (const state of PUBLIC_STATES) {
          await page.goto(state.route, { waitUntil: 'domcontentloaded' });
          await page.evaluate((t) => {
            document.documentElement.setAttribute('data-theme', t);
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
            const overflowPx = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
            const markerPresent = Boolean(document.querySelector(sel));
            const skipLinkPresent = Boolean(document.querySelector('.skip-link, .lp-core-skip-link'));
            return {
              lang,
              hasAdminCss,
              hasAdminJs,
              hasCoreCss,
              hasPublicCss,
              overflowPx,
              markerPresent,
              skipLinkPresent,
            };
          }, state.markerSelector);

          const tag = `${state.id}@${vp.width}px-${theme}`;
          if (result.lang !== 'public') failures.push(`${tag}: data-lang=${result.lang} (expected public)`);
          if (result.hasAdminCss) failures.push(`${tag}: admin CSS shipped to public route`);
          if (result.hasAdminJs) failures.push(`${tag}: admin JS shipped to public route`);
          if (!result.hasCoreCss || !result.hasPublicCss) failures.push(`${tag}: missing core.css or public.css link`);
          if (!result.markerPresent) failures.push(`${tag}: missing marker ${state.markerSelector}`);
          if (!result.skipLinkPresent) failures.push(`${tag}: missing skip link`);
          if (result.overflowPx > 2) failures.push(`${tag}: horizontal overflow ${result.overflowPx}px`);
        }
      }
    }

    expect(failures, failures.join('\n')).toHaveLength(0);
  });
});
