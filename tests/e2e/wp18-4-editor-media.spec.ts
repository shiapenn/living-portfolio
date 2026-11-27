import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);
const TINY_PNG_B64 = TINY_PNG.toString('base64');

test.describe('WP-18.4 Editor Media & Public Rendering Journeys', () => {
  test.setTimeout(90_000);

  test('J1-J3: toolbar, /image slash, paste, drop, alt required, decorative, edit, remove + undo', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new', { waitUntil: 'networkidle' });

    // 1. Toolbar button + Alt text required + Decorative round-trip
    await page.click('#ref-fmt-image');
    await expect(page.locator('#ref-media-dialog')).toBeVisible();
    await page.setInputFiles('#ref-media-file', { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG });
    await page.click('#ref-media-submit');
    await expect(page.locator('#ref-media-alt')).toHaveAttribute('aria-invalid', 'true');

    // Mark decorative -> alt disabled, round-trips as ![](/api/media/:id "caption")
    await page.click('label[for="ref-media-decorative"]');
    await expect(page.locator('#ref-media-alt')).toBeDisabled();
    await page.fill('#ref-media-caption', 'Ornament caption');
    await page.click('#ref-media-submit');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();
    await expect(page.locator('.lp-editor-media-block[data-media-node="image"]')).toHaveCount(1);

    const mdAfterDec = await page.locator('#ref-field-body').inputValue();
    expect(mdAfterDec).toMatch(/^!\[\]\(\/api\/media\/[0-9a-f-]{36} "Ornament caption"\)$/);
    expect(mdAfterDec).not.toContain('/api/v1');
    expect(mdAfterDec).not.toContain('http://');

    // 2. Edit mode -> Save updates alt & caption
    await page.locator('.lp-editor-media-block [data-media-edit="true"]').first().click();
    await expect(page.locator('#ref-media-dialog[data-media-mode="edit"]')).toBeVisible();
    await expect(page.locator('#ref-media-remove')).toBeVisible();
    await page.click('label[for="ref-media-decorative"]');
    await page.fill('#ref-media-alt', 'Updated topology diagram');
    await page.fill('#ref-media-caption', 'Updated caption');
    await page.click('#ref-media-submit');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();

    const mdAfterEdit = await page.locator('#ref-field-body').inputValue();
    expect(mdAfterEdit).toMatch(/!\[Updated topology diagram\]\(\/api\/media\/[0-9a-f-]{36} "Updated caption"\)/);

    // 3. Remove (no confirmation dialog) + Editor undo restores it!
    await page.locator('.lp-editor-media-block [data-media-edit="true"]').first().click();
    await page.click('#ref-media-remove');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();
    await expect(page.locator('.lp-editor-media-block[data-media-node="image"]')).toHaveCount(0);

    await page.locator('.ProseMirror').click();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page.locator('.lp-editor-media-block[data-media-node="image"]')).toHaveCount(1);

    // 4. Slash /image opens the same dialog
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/image');
    await expect(page.locator('#ref-slash-menu')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ref-media-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();

    // 5. Paste image file onto editor surface -> uploads then opens dialog for alt text
    await page.evaluate((b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], 'pasted.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      document.querySelector('.ProseMirror')?.dispatchEvent(ev);
    }, TINY_PNG_B64);
    await expect(page.locator('#ref-media-dialog')).toBeVisible();
    await expect(page.locator('#ref-media-file-filename')).toHaveText('pasted.png');
    await page.fill('#ref-media-alt', 'Pasted screenshot');
    await page.click('#ref-media-submit');
    await expect(page.locator('.lp-editor-media-block[data-media-node="image"]')).toHaveCount(2);

    // 6. Drop image file onto editor surface -> uploads then opens dialog for alt text
    await page.evaluate((b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], 'dropped.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const ev = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      document.querySelector('.lp-editor-surface-wrap')?.dispatchEvent(ev);
    }, TINY_PNG_B64);
    await expect(page.locator('#ref-media-dialog')).toBeVisible();
    await expect(page.locator('#ref-media-file-filename')).toHaveText('dropped.png');
    await page.fill('#ref-media-alt', 'Dropped diagram');
    await page.click('#ref-media-submit');
    await expect(page.locator('.lp-editor-media-block[data-media-node="image"]')).toHaveCount(3);
  });

  test('J4-J6: video embed allowlist, public embed gate zero-request click-through, keyboard & reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    await page.goto('/admin/entries/new', { waitUntil: 'networkidle' });

    // Open video dialog via toolbar + verify keyboard Tab/Escape focus return
    const videoBtn = page.locator('#ref-fmt-video');
    await videoBtn.click();
    await expect(page.locator('#ref-media-dialog')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();
    await expect(videoBtn).toBeFocused();

    // Reopen, switch to Embed URL, verify consequence S2 line & disallowed host inline error
    await videoBtn.click();
    await page.click('label[for="ref-media-mode-embed"]');
    await expect(page.locator('#ref-media-consequence')).toHaveText('Visitors must click to load this video.');
    await page.fill('#ref-media-embed-url', 'https://evil-tracker.example/embed/1');
    await page.fill('#ref-media-description', 'Blocked host test');
    await page.click('#ref-media-submit');
    await expect(page.locator('#ref-media-embed-url')).toHaveAttribute('aria-invalid', 'true');

    // Valid stub host + Enter submits
    await page.fill('#ref-media-embed-url', 'https://stub.invalid/embed/journey');
    await page.locator('#ref-media-description').fill('Journey stub video');
    await page.locator('#ref-media-description').press('Enter');
    await expect(page.locator('#ref-media-dialog')).toBeHidden();
    const md = await page.locator('#ref-field-body').inputValue();
    expect(md).toContain(':::video{embed="https://stub.invalid/embed/journey" description="Journey stub video"}');

    // Public embed gate click-through: ZERO requests to stub.invalid before click!
    const stubRequests: string[] = [];
    await page.route('https://stub.invalid/**', async (route) => {
      stubRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body>Stub player</body></html>',
      });
    });

    // Visit seeded public showcase entry (or verify via API)
    const csrf = await page.evaluate(() => sessionStorage.getItem('lp_csrf_token') || '');
    const slug = `wp18-4-journey-${Date.now()}`;
    const preview = await (
      await page.request.post('/api/entries/redaction-preview', {
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        data: { entryId: 'draft', text: md },
      })
    ).json();
    await page.request.post('/api/entries', {
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      data: {
        title: 'Journey Embed Gate',
        slug,
        profile: 'case-study',
        visibility: 'public',
        body_md: md,
        redactionPreviewToken: preview.redactionPreviewToken,
      },
    });

    await page.goto(`/work/${slug}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.pub-embed-gate[data-embed-state="unloaded"]')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(stubRequests).toEqual([]);

    // Click Load video -> iframe created and stub host requested
    const stubRespPromise = page.waitForResponse((r) => r.url().startsWith('https://stub.invalid/'));
    await page.click('.pub-embed-load-btn');
    await stubRespPromise;
    await expect(page.locator('.pub-embed-gate[data-embed-state="loaded"] iframe.pub-embed-frame')).toBeVisible();
    expect(stubRequests.length).toBeGreaterThanOrEqual(1);
  });
});
