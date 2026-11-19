import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  checkColoursAndNativeControls,
  checkLines,
  checkPaintedGaps,
  checkRenderedText,
  setTheme,
} from './census-helpers.js';

test.describe('WP-16.F F1 Pattern-Only Fixture Page (/admin/_fixture)', () => {
  test('passes rendered-text, colour, painted-gap, and line checks in light & dark at 320 & 1280', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);

    for (const width of [320, 1280] as const) {
      await page.setViewportSize({ width, height: 800 });
      for (const theme of ['light', 'dark'] as const) {
        await page.goto('/admin/_fixture');
        await setTheme(page, theme);

        const textIssues = await checkRenderedText(page);
        expect(textIssues, `text @ ${width} ${theme}`).toEqual([]);

        const colourIssues = await checkColoursAndNativeControls(page, theme);
        expect(colourIssues, `colour @ ${width} ${theme}`).toEqual([]);

        const gapRes = await checkPaintedGaps(page);
        expect(gapRes.violations, `gaps @ ${width} ${theme}`).toEqual([]);

        const lineIssues = await checkLines(page, { hasTopBar: true });
        expect(lineIssues, `lines @ ${width} ${theme}`).toEqual([]);
      }
    }
  });
});
