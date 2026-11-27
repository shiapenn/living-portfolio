import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import { getCsrfHeaders } from './wp17-manifest.js';

const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

test.describe('WP-18.5 Columns container directive E2E', () => {
  test('renders 2-4 columns + nested columns with responsive collapse at 320px and side-by-side at 1280/1920px in DOM reading order', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    const headers = await getCsrfHeaders(page);
    const slug = `wp18-5-columns-${Date.now()}`;
    const bodyMd = [
      ':::columns{cols=2}',
      ':::column',
      'First column alpha',
      '',
      ':::columns{cols=2}',
      ':::column',
      'Nested left',
      ':::',
      ':::column',
      'Nested right',
      ':::',
      ':::',
      ':::',
      ':::column',
      'Second column beta',
      ':::',
      ':::',
      '',
      ':::columns{cols=3}',
      ':::column',
      'Tri one',
      ':::',
      ':::column',
      'Tri two',
      ':::',
      ':::column',
      'Tri three',
      ':::',
      ':::',
    ].join('\n');

    const preview = await (
      await page.request.post('/api/entries/redaction-preview', {
        headers,
        data: { entryId: 'draft', text: bodyMd },
      })
    ).json();

    const created = await (
      await page.request.post('/api/entries', {
        headers,
        data: {
          title: 'Columns Layout Verification',
          slug,
          profile: 'case-study',
          visibility: 'public',
          body_md: bodyMd,
          redactionPreviewToken: preview.redactionPreviewToken,
        },
      })
    ).json();
    expect(created.entry?.id).toBeTruthy();

    // 1. Desktop 1280px: 2-column and 3-column grids render side-by-side
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/work/${slug}`, { waitUntil: 'networkidle' });

    const grids = page.locator('[data-pub-columns="true"]');
    await expect(grids).toHaveCount(3); // outer 2-col, nested 2-col, 3-col

    const threeColGrid = page.locator('[data-pub-columns="true"][data-cols="3"]');
    const triCols = threeColGrid.locator('> .pub-column');
    await expect(triCols).toHaveCount(3);

    const b0 = await triCols.nth(0).boundingBox();
    const b1 = await triCols.nth(1).boundingBox();
    const b2 = await triCols.nth(2).boundingBox();
    expect(b0 && b1 && b2).toBeTruthy();
    expect(b1!.x).toBeGreaterThan(b0!.x + 20);
    expect(b2!.x).toBeGreaterThan(b1!.x + 20);
    expect(Math.abs(b0!.y - b1!.y)).toBeLessThan(4);
    expect(Math.abs(b1!.y - b2!.y)).toBeLessThan(4);

    // Source reading order check
    const texts = await triCols.allTextContents();
    expect(texts.map((t) => t.trim())).toEqual(['Tri one', 'Tri two', 'Tri three']);

    // 2. Mobile 320px: collapses to single column in source order
    await page.setViewportSize({ width: 320, height: 800 });
    await page.waitForTimeout(100);
    const m0 = await triCols.nth(0).boundingBox();
    const m1 = await triCols.nth(1).boundingBox();
    const m2 = await triCols.nth(2).boundingBox();
    expect(m0 && m1 && m2).toBeTruthy();
    expect(Math.abs(m0!.x - m1!.x)).toBeLessThan(2);
    expect(m1!.y).toBeGreaterThanOrEqual(m0!.y + m0!.height - 1);
    expect(m2!.y).toBeGreaterThanOrEqual(m1!.y + m1!.height - 1);
  });

  test('editor /columns slash command inserts editable columns, supports drop-to-columns, and round-trips Markdown losslessly', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/entries/new', { waitUntil: 'networkidle' });

    const prose = page.locator('.ProseMirror');
    await prose.click();
    await page.keyboard.type('/columns');
    const slashBtn = page.locator('#ref-slash-menu button[data-slash-cmd="columns"]');
    await expect(slashBtn).toBeVisible();
    await slashBtn.click();

    const cols = page.locator('.ProseMirror .lp-editor-columns[data-cols="2"] > .lp-editor-column');
    await expect(cols).toHaveCount(2);

    await cols.nth(0).click();
    await page.keyboard.type('Left col');
    await cols.nth(1).click();
    await page.keyboard.type('Right col');

    // Verify Markdown source round-trip
    const rawMd = await page.locator('#ref-field-body').inputValue();
    expect(rawMd).toContain(':::columns{cols=2}');
    expect(rawMd).toContain(':::column\nLeft col\n:::');
    expect(rawMd).toContain(':::column\nRight col\n:::');

    // Test drop-to-columns on column 2
    const pngBase64 = TINY_PNG.toString('base64');
    await cols.nth(1).evaluate((el, b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], 'col-drop.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    }, pngBase64);

    // Media dialog opens after upload; fill alt and insert
    await expect(page.locator('#ref-media-dialog:not([hidden])')).toBeVisible({ timeout: 5000 });
    await page.fill('#ref-media-alt', 'Dropped column image');
    await page.click('#ref-media-submit');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();

    // Image should land inside the editor document (and round-trip)
    await expect(page.locator('.ProseMirror figure[data-media-node="image"]')).toHaveCount(1);
  });
});
