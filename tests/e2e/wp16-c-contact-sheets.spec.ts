import { test, expect } from '@playwright/test';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp16c-contact-sheets');

test.describe('WP-16.C C4 Contact Sheet Capture', () => {
  if (process.env.CAPTURE_CONTACT_SHEETS === '1') {
    test('captures every page, overlay state, and _gallery at 1280 & 320px (light & dark) + editor 1920px', async ({ page }) => {
      test.setTimeout(300_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const seededId = await page.evaluate(async () => {
        const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
        const data = await res.json();
        return data.entries?.[0]?.id ?? null;
      });
      expect(seededId).toBeTruthy();

      const pages: Array<{ name: string; path: string }> = [
        { name: 'today', path: '/admin' },
        { name: 'entries-list', path: '/admin/entries' },
        { name: 'entries-new', path: '/admin/entries/new' },
        { name: 'entries-detail', path: `/admin/entries/${encodeURIComponent(seededId)}` },
        { name: 'history', path: `/admin/entries/${encodeURIComponent(seededId)}/history` },
        { name: 'inbox', path: '/admin/inbox' },
        { name: 'answer-rules', path: '/admin/audit' },
        { name: 'import', path: '/admin/import' },
        { name: 'settings-answering', path: '/admin/settings/answering' },
        { name: 'settings-providers', path: '/admin/settings/providers' },
        { name: 'settings-appearance', path: '/admin/settings/appearance' },
        { name: 'settings-notifications', path: '/admin/settings/notifications' },
        { name: 'settings-backups', path: '/admin/settings/backups' },
        { name: 'login', path: '/admin/login' },
        { name: 'setup', path: '/admin/setup' },
        { name: 'gallery', path: '/admin/_gallery' },
      ];

      const setTheme = async (theme: 'light' | 'dark') => {
        await page.evaluate(async (t) => {
          document.documentElement.setAttribute('data-theme', t);
          try { localStorage.setItem('strata-theme', t); } catch {}
          void document.body.offsetHeight;
          await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
        }, theme);
      };

      const captured: Array<{ label: string; file: string; group: string }> = [];

      for (const width of [1280, 320] as const) {
        await page.setViewportSize({ width, height: 800 });
        for (const theme of ['light', 'dark'] as const) {
          const group = `${width}px-${theme}`;
          for (const p of pages) {
            await page.goto(p.path);
            await setTheme(theme);
            const file = `${p.name}-${width}px-${theme}.png`;
            await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
            captured.push({ label: `${p.name} (${width}px, ${theme})`, file, group });
          }

          // Overlay states on Today
          await page.goto('/admin');
          await setTheme(theme);
          await page.click('#lp-launcher-btn');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-launcher-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-launcher (${width}px, ${theme})`, file: `overlay-launcher-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.click('#lp-status-popover-btn');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-status-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-status (${width}px, ${theme})`, file: `overlay-status-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.click('#lp-account-menu-btn');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-account-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-account (${width}px, ${theme})`, file: `overlay-account-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          // Overlay states on Editor
          await page.goto(`/admin/entries/${encodeURIComponent(seededId)}`);
          await setTheme(theme);
          await page.click('#ref-sidebar-toggle');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-entries-drawer-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-entries-drawer (${width}px, ${theme})`, file: `overlay-entries-drawer-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.click('#ref-btn-structure');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-structure-drawer-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-structure-drawer (${width}px, ${theme})`, file: `overlay-structure-drawer-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.click('#ref-visibility-menu-btn');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-visibility-menu-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-visibility-menu (${width}px, ${theme})`, file: `overlay-visibility-menu-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.click('#ref-more-menu-btn');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-more-menu-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-more-menu (${width}px, ${theme})`, file: `overlay-more-menu-${width}px-${theme}.png`, group });
          await page.keyboard.press('Escape');

          await page.goto('/admin/entries/new');
          await setTheme(theme);
          await page.click('#ref-tiptap-editor .ProseMirror');
          await page.keyboard.type('/');
          await page.screenshot({ path: resolve(OUT_DIR, `overlay-slash-menu-${width}px-${theme}.png`) });
          captured.push({ label: `overlay-slash-menu (${width}px, ${theme})`, file: `overlay-slash-menu-${width}px-${theme}.png`, group });
        }
      }

      // Editor at 1920px (light & dark)
      await page.setViewportSize({ width: 1920, height: 1080 });
      for (const theme of ['light', 'dark'] as const) {
        await page.goto(`/admin/entries/${encodeURIComponent(seededId)}`);
        await setTheme(theme);
        const file = `entries-detail-1920px-${theme}.png`;
        await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
        captured.push({ label: `entries-detail (1920px, ${theme})`, file, group: `1920px-${theme}` });
      }

      const renderSheet = async (title: string, items: typeof captured, outPng: string, outHtml: string) => {
        const htmlCards = items
          .map((c) => `<figure style="margin:0;border:1px solid #cbd5e1;padding:8px;background:#fff"><img src="${c.file}" style="width:100%;height:auto;display:block" /><figcaption style="font:12px/1.4 sans-serif;margin-top:6px;color:#0f172a">${c.label}</figcaption></figure>`)
          .join('\n');
        const html = `<!doctype html><html><body style="margin:24px;background:#f8fafc"><h1 style="font:600 20px sans-serif">${title} (${items.length} captures)</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${htmlCards}</div></body></html>`;
        writeFileSync(resolve(OUT_DIR, outHtml), html);
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(`file://${resolve(OUT_DIR, outHtml)}`);
        await page.screenshot({ path: resolve(OUT_DIR, outPng), fullPage: true });
      };

      for (const group of ['1280px-light', '1280px-dark', '320px-light', '320px-dark']) {
        await renderSheet(
          `WP-16.C Contact Sheet (${group})`,
          captured.filter((c) => c.group === group),
          `CONTACT-SHEET-${group}.png`,
          `contact-sheet-${group}.html`,
        );
      }
      await renderSheet('WP-16.C Contact Sheets (All)', captured, 'CONTACT-SHEET-ALL.png', 'contact-sheet-index.html');

      const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
      expect(files.length).toBeGreaterThanOrEqual(98);
    });
  } else {
    test('contact sheet capture spec is registered (set CAPTURE_CONTACT_SHEETS=1 to generate)', async () => {
      expect(basename(OUT_DIR)).toBe('wp16c-contact-sheets');
    });
  }
});
