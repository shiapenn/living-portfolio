import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  seedManifestFixtures,
  navigateToManifestEntry,
  type ManifestFixtures,
} from './wp17-manifest.js';

/**
 * WP-18.10 Corrective Slice Audit Checks (K44–K54).
 * Every check must FAIL with count > 0 on the pre-WP-18.10 commit (de379ba)
 * and PASS with 0 violations on HEAD.
 */

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
  { width: 1920, height: 900 },
] as const;

async function prepareCleanCapture(page: Page, theme: 'light' | 'dark' = 'light'): Promise<void> {
  // Move pointer off-page so no element retains :hover (V12 / K51)
  await page.mouse.move(-100, -100);
  await page.evaluate((t) => {
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
  }, theme);
}

function pngDimensions(buf: Buffer): { width: number; height: number } {
  // PNG IHDR chunk starts at byte 16 (width: uint32be, height: uint32be)
  if (buf.length < 24) return { width: 0, height: 0 };
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test.describe('WP-18.10 Corrective Slice Checks (K44–K54)', () => {
  test.setTimeout(300_000);

  let fixtures: ManifestFixtures;

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    if (!fixtures) {
      fixtures = await seedManifestFixtures(page);
    }
  });

  test('K44, K45, K46, K48, K49, K51, K52, K54: Full manifest audit across 1280 (and 320/1920 for K48)', async ({
    page,
  }) => {
    const k44Hashes = new Map<string, string[]>();
    const k45Violations: string[] = [];
    const k46Violations: string[] = [];
    const k48Violations: string[] = [];
    const k49Violations: string[] = [];
    const k51Violations: string[] = [];
    const k52Violations: string[] = [];
    const k54Violations: string[] = [];

    // K46 static check: no hand-built .lp-item-* outside Item primitive in WP-18 modules
    const wp18UiFiles = [
      'apps/web/src/settings/modules/storage.ts',
      'apps/web/src/pages/admin/import.ts',
      'apps/web/src/pages/admin/import-script.ts',
      'apps/web/src/client/admin/import-page.ts',
    ];
    for (const rel of wp18UiFiles) {
      try {
        const src = readFileSync(join(process.cwd(), rel), 'utf8');
        const matches = src.match(/\blp-item-[a-z0-9-]+\b/g) || [];
        if (matches.length > 0) {
          k46Violations.push(`static:${rel} has ${matches.length} hand-built .lp-item-* token(s): ${Array.from(new Set(matches)).join(', ')}`);
        }
      } catch {
        // Ignore if file doesn't exist in an older worktree
      }
    }

    const isCanaryMode = process.env.WP18_10_CANARY === '1';

    for (const entry of WP17_MANIFEST) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await navigateToManifestEntry(page, entry, fixtures);

      // In canary mode, simulate pre-WP-18.10 contact-sheet capture prep (mouse(0,0) + single blur, fullPage: true for dialogs)
      if (isCanaryMode) {
        await page.mouse.move(0, 0);
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'light');
        });
      } else {
        await prepareCleanCapture(page, 'light');
      }

      const isDialogState = Boolean((entry as any).isDialog);
      const hasOpenDialog = await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>('[data-c="Overlay"]:not([hidden]), .lp-modal-backdrop:not([hidden])')
        );
        return candidates.some((dlg) => {
          if (dlg.closest('.lp-gallery-overlay-sample') || dlg.classList.contains('lp-gallery-overlay-sample')) return false;
          const r = dlg.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
      });

      // K44: Screenshot md5 at 1280px must be unique per manifest state
      const useFullPage = isCanaryMode ? true : !(isDialogState || hasOpenDialog);
      const shotBuf = await page.screenshot({ fullPage: useFullPage });
      const md5 = createHash('md5').update(shotBuf).digest('hex').slice(0, 8);
      const existing = k44Hashes.get(md5) ?? [];
      existing.push(entry.id);
      k44Hashes.set(md5, existing);

      // K52: Dialog captures must have scrim height === capture height
      if (hasOpenDialog) {
        const { height: captureH } = pngDimensions(shotBuf);
        const scrimH = await page.evaluate(() => {
          const scrim = document.querySelector<HTMLElement>(
            '[data-c="Overlay"]:not([hidden]) .lp-overlay-backdrop, .lp-modal-backdrop:not([hidden])'
          );
          return scrim ? Math.round(scrim.getBoundingClientRect().height) : 0;
        });
        if (Math.abs(scrimH - captureH) > 2) {
          k52Violations.push(`${entry.id}@1280: scrim height=${scrimH} != capture height=${captureH}`);
        }
      }

      // K45, K46 (DOM), K49, K51, K54 in-page evaluation at 1280px
      const pageAudit = await page.evaluate(async ({ id }) => {
        const k45: string[] = [];
        const k46: string[] = [];
        const k49: string[] = [];
        const k51: string[] = [];
        const k54: string[] = [];

        const isVis = (el: Element | null): el is HTMLElement => {
          if (!el || !(el instanceof HTMLElement)) return false;
          if (el.hasAttribute('hidden') || el.classList.contains('lp-is-hidden')) return false;
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };

        const main = document.querySelector<HTMLElement>('main') || document.body;

        // K45: Content census over visible main text (excluding <time datetime> and input values)
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
        const visibleTextChunks: string[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (!parent || !isVis(parent)) continue;
          if (parent.closest('script, style, template, code, pre, textarea, input, select, option')) continue;
          const txt = (node.textContent || '').trim();
          if (!txt) continue;
          visibleTextChunks.push(txt);

          // ISO date regex outside <time> and inputs
          if (!parent.closest('time') && /\b\d{4}-\d{2}-\d{2}\b/.test(txt)) {
            k45.push(`${id}: ISO date in text: "${txt.slice(0, 80)}"`);
          }
          // "1 entries|files|items"
          if (/\b1\s+(entries|files|items)\b/i.test(txt)) {
            k45.push(`${id}: singular-plural mismatch: "${txt.slice(0, 80)}"`);
          }
          // Leading "# " in excerpts (.lp-item-body)
          if (parent.closest('.lp-item-body') && /^#\s+/.test(txt)) {
            k45.push(`${id}: leading "# " in excerpt: "${txt.slice(0, 80)}"`);
          }
          // Stray quote after URLs
          if (/https?:\/\/[^\s"'<>]+["']/.test(txt)) {
            k45.push(`${id}: stray quote after URL: "${txt.slice(0, 80)}"`);
          }
        }
        // Also check combined text of .lp-item-body for leading "# "
        for (const bodyEl of Array.from(main.querySelectorAll<HTMLElement>('.lp-item-body')).filter(isVis)) {
          const t = (bodyEl.textContent || '').trim();
          if (/^#\s+/.test(t)) {
            k45.push(`${id}: leading "# " in .lp-item-body: "${t.slice(0, 80)}"`);
          }
        }

        // K46 (DOM): Repeated rows in main must be data-c="Item" with canonical Item anatomy
        for (const list of Array.from(main.querySelectorAll<HTMLElement>('[data-c="List"]:not([data-variant="definition"])')).filter(isVis)) {
          if (list.closest('#gallery-state-matrix')) continue;
          const children = Array.from(list.children).filter(isVis);
          if (children.length >= 2) {
            for (const ch of children) {
              if (ch.getAttribute('data-c') !== 'Item') {
                k46.push(`${id}: repeated row <${ch.tagName.toLowerCase()} class="${ch.className}"> missing data-c="Item"`);
              }
              if (ch.querySelector('.lp-item-main, .lp-item-head')) {
                k46.push(`${id}: Item uses legacy hand-built .lp-item-main/.lp-item-head`);
              }
            }
          }
        }

        // K49: Buttons labelled Delete|Remove|Discard|Revoke outside dialogs must be danger-text variant
        const destructiveRe = /^(Delete|Remove|Discard|Revoke)(\b|$)/i;
        for (const btn of Array.from(document.querySelectorAll<HTMLElement>('button, a.lp-btn')).filter(isVis)) {
          if (btn.closest('[data-c="Overlay"], .lp-modal-backdrop, .lp-dialog-panel, #gallery-state-matrix')) continue;
          const label = (btn.textContent || '').trim();
          if (!destructiveRe.test(label)) continue;
          const isDangerText = btn.classList.contains('lp-btn-text-danger') || btn.getAttribute('data-destructive') === 'true';
          if (!isDangerText) {
            k49.push(`${id}: destructive button "${label}" outside dialog is not danger-text (class="${btn.className}")`);
          }
        }

        // K51: Non-state captures must have activeElement = body and no :hover on interactive controls
        if (id !== 'gallery') {
          if (document.activeElement && document.activeElement !== document.body) {
            const ae = document.activeElement as HTMLElement;
            k51.push(`${id}: activeElement is <${ae.tagName.toLowerCase()} id="${ae.id}" class="${ae.className}">, expected body`);
          }
          const hovered = Array.from(document.querySelectorAll<HTMLElement>('button:hover, a:hover, .lp-item:hover, .lp-btn:hover')).filter(isVis);
          if (hovered.length > 0) {
            k51.push(`${id}: ${hovered.length} interactive element(s) in :hover state (${hovered[0].tagName.toLowerCase()}#${hovered[0].id})`);
          }
        }

        // K54: Media render proof (image pixel variance > 50; video readyState >= 1 and videoWidth > 0)
        for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('.pub-media img')).filter(isVis)) {
          if (!img.complete) {
            await new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
              setTimeout(resolve, 2000);
            });
          }
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            k54.push(`${id}: image failed to load (naturalWidth=${img.naturalWidth})`);
            continue;
          }
          try {
            const canvas = document.createElement('canvas');
            const w = Math.min(64, img.naturalWidth);
            const h = Math.min(64, img.naturalHeight);
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const px = ctx.getImageData(0, 0, w, h).data;
              const lums: number[] = [];
              for (let i = 0; i < px.length; i += 4) {
                lums.push(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
              }
              const mean = lums.reduce((a, b) => a + b, 0) / Math.max(1, lums.length);
              const variance = lums.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, lums.length);
              if (variance <= 50) {
                k54.push(`${id}: image pixel variance=${variance.toFixed(1)} <= 50 (blank/flat image, ${img.naturalWidth}x${img.naturalHeight})`);
              }
            }
          } catch (e) {
            k54.push(`${id}: canvas variance probe failed (${String(e)})`);
          }
        }

        for (const vid of Array.from(document.querySelectorAll<HTMLVideoElement>('.pub-media video')).filter(isVis)) {
          if (vid.readyState < 1) {
            await new Promise<void>((resolve) => {
              vid.addEventListener('loadedmetadata', () => resolve(), { once: true });
              vid.addEventListener('error', () => resolve(), { once: true });
              setTimeout(resolve, 2500);
            });
          }
          if (vid.readyState < 1 || vid.videoWidth <= 0) {
            k54.push(`${id}: video not playable (readyState=${vid.readyState}, videoWidth=${vid.videoWidth})`);
          }
        }

        return { k45, k46, k49, k51, k54 };
      }, { id: entry.id });

      k45Violations.push(...pageAudit.k45);
      k46Violations.push(...pageAudit.k46);
      k49Violations.push(...pageAudit.k49);
      k51Violations.push(...pageAudit.k51);
      k54Violations.push(...pageAudit.k54);

      // K48: Inline actions (Item, section ActionBar, dialog text actions) are auto-width at 320/1280/1920
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        await prepareCleanCapture(page, 'light');
        const vpK48 = await page.evaluate(({ id, width }) => {
          const errs: string[] = [];
          const isVis = (el: Element | null): el is HTMLElement => {
            if (!el || !(el instanceof HTMLElement)) return false;
            const st = getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };
          const inlineBars = Array.from(
            document.querySelectorAll<HTMLElement>('.lp-action-bar-item, .lp-action-bar-inline, .lp-item-actions .lp-action-bar')
          ).filter(isVis);
          for (const bar of inlineBars) {
            if (bar.closest('#gallery-state-matrix')) continue;
            const barRect = bar.getBoundingClientRect();
            const btns = Array.from(bar.querySelectorAll<HTMLElement>(':scope > .lp-btn, :scope > a.lp-btn')).filter(isVis);
            for (const btn of btns) {
              const br = btn.getBoundingClientRect();
              const label = (btn.textContent || '').trim();
              // An inline action button must NOT stretch to full container width (within 4px) unless its text itself fills the narrow 320px bar
              if (barRect.width >= 260 && br.width >= barRect.width - 4 && label.length < 22) {
                errs.push(`${id}@${width}: inline ActionBar btn "${label}" stretched to full width (${br.width.toFixed(1)}/${barRect.width.toFixed(1)})`);
              }
              // Must not be fixed at 220px (--lp-size-btn-action-max) when text is short
              if (width >= 640 && Math.abs(br.width - 220) < 2 && label.length <= 14) {
                errs.push(`${id}@${width}: inline ActionBar btn "${label}" forced to fixed 220px width`);
              }
            }
          }
          // Dialog text actions must also be auto-width
          const dialogTextBtns = Array.from(
            document.querySelectorAll<HTMLElement>('.lp-action-bar-dialog > .lp-btn-text')
          ).filter(isVis);
          for (const btn of dialogTextBtns) {
            const bar = btn.parentElement!;
            const barRect = bar.getBoundingClientRect();
            const br = btn.getBoundingClientRect();
            if (barRect.width >= 240 && br.width >= barRect.width - 4) {
              errs.push(`${id}@${width}: dialog text btn "${(btn.textContent || '').trim()}" stretched to full width`);
            }
          }
          return errs;
        }, { id: entry.id, width: vp.width });
        k48Violations.push(...vpK48);
      }
    }

    const k44Violations: string[] = [];
    for (const [hash, ids] of k44Hashes.entries()) {
      if (ids.length > 1) {
        k44Violations.push(`identical 1280 screenshot md5=${hash}: [${ids.join(', ')}]`);
      }
    }

    console.log(
      `[WP-18.10 AUDIT] K44=${k44Violations.length} K45=${k45Violations.length} K46=${k46Violations.length} K48=${k48Violations.length} K49=${k49Violations.length} K51=${k51Violations.length} K52=${k52Violations.length} K54=${k54Violations.length}`
    );
    if (k44Violations.length) console.log('K44:', k44Violations);
    if (k45Violations.length) console.log('K45:', k45Violations);
    if (k46Violations.length) console.log('K46:', k46Violations);
    if (k48Violations.length) console.log('K48:', k48Violations);
    if (k49Violations.length) console.log('K49:', k49Violations);
    if (k51Violations.length) console.log('K51:', k51Violations);
    if (k52Violations.length) console.log('K52:', k52Violations);
    if (k54Violations.length) console.log('K54:', k54Violations);

    expect(k44Violations, `K44 duplicate 1280 screenshots:\n${k44Violations.join('\n')}`).toEqual([]);
    expect(k45Violations, `K45 content census violations:\n${k45Violations.join('\n')}`).toEqual([]);
    expect(k46Violations, `K46 Item primitive violations:\n${k46Violations.join('\n')}`).toEqual([]);
    expect(k48Violations, `K48 inline action auto-width violations:\n${k48Violations.join('\n')}`).toEqual([]);
    expect(k49Violations, `K49 danger-text variant violations:\n${k49Violations.join('\n')}`).toEqual([]);
    expect(k51Violations, `K51 focus/hover hygiene violations:\n${k51Violations.join('\n')}`).toEqual([]);
    expect(k52Violations, `K52 dialog scrim height violations:\n${k52Violations.join('\n')}`).toEqual([]);
    expect(k54Violations, `K54 media render proof violations:\n${k54Violations.join('\n')}`).toEqual([]);
  });

  test('K47: No vertically adjacent text/control boxes with gap < 4px; classified-pair count > 0 for import-review & settings-storage', async ({
    page,
  }) => {
    const k47Violations: string[] = [];
    const targetIds = ['import-review', 'settings-storage'];
    const pairCounts: Record<string, number> = { 'import-review': 0, 'settings-storage': 0 };

    for (const id of targetIds) {
      const entry = WP17_MANIFEST.find((e) => e.id === id);
      if (!entry) continue;
      for (const vp of [
        { width: 320, height: 640 },
        { width: 1280, height: 800 },
      ]) {
        await page.setViewportSize(vp);
        await navigateToManifestEntry(page, entry, fixtures);
        await prepareCleanCapture(page, 'light');

        const res = await page.evaluate(({ stateId, width }) => {
          const errs: string[] = [];
          let classified = 0;
          const isVis = (el: Element | null): el is HTMLElement => {
            if (!el || !(el instanceof HTMLElement)) return false;
            if (el.hasAttribute('hidden') || el.classList.contains('lp-is-hidden')) return false;
            const st = getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const col = document.querySelector<HTMLElement>('.lp-page-column') || document.querySelector<HTMLElement>('main');
          if (!col) return { errs, classified };

          // Inspect every visible Item, Item inner container (.lp-item-content/.lp-item-main/.lp-item-segments), Field, and FormSection
          const containers = Array.from(
            col.querySelectorAll<HTMLElement>(
              '[data-c="Item"], .lp-item-content, .lp-item-main, .lp-item-segments, [data-c="Field"], [data-c="FormSection"]'
            )
          ).filter(isVis);

          for (const parent of containers) {
            const kids = Array.from(parent.children).filter(isVis);
            for (let i = 0; i < kids.length - 1; i++) {
              const a = kids[i];
              const b = kids[i + 1];
              const ra = a.getBoundingClientRect();
              const rb = b.getBoundingClientRect();
              // Only vertically stacked siblings (not side-by-side in same row)
              if (rb.top < ra.bottom - 2 && rb.left >= ra.right - 2) continue;
              if (Math.abs(ra.top - rb.top) < 2 && ra.height > 0 && rb.height > 0 && rb.left > ra.left + 4) continue;
              const gap = rb.top - ra.bottom;
              classified++;
              if (gap < 3.5) {
                errs.push(
                  `${stateId}@${width}: vertical gap=${gap.toFixed(1)}px (<4px) between <${a.tagName.toLowerCase()} class="${a.className}"> and <${b.tagName.toLowerCase()} class="${b.className}">`
                );
              }
            }
          }
          return { errs, classified };
        }, { stateId: id, width: vp.width });

        pairCounts[id] += res.classified;
        k47Violations.push(...res.errs);
      }
    }

    console.log(`[WP-18.10 K47] violations=${k47Violations.length} pairCounts=${JSON.stringify(pairCounts)}`);
    expect(pairCounts['import-review'], 'K47 import-review classified-pair count must be > 0').toBeGreaterThan(0);
    expect(pairCounts['settings-storage'], 'K47 settings-storage classified-pair count must be > 0').toBeGreaterThan(0);
    expect(k47Violations, `K47 vertical gap < 4px violations:\n${k47Violations.join('\n')}`).toEqual([]);
  });

  test('K50: Dialog top y identical across editor-media-* states per viewport (320/1280/1920)', async ({ page }) => {
    const dialogStates = WP17_MANIFEST.filter(
      (e) => e.id.startsWith('editor-media-') && e.id !== 'editor-media-inserted'
    );
    const k50Violations: string[] = [];

    for (const vp of VIEWPORTS) {
      const tops: Array<{ id: string; top: number }> = [];
      for (const entry of dialogStates) {
        await page.setViewportSize(vp);
        await navigateToManifestEntry(page, entry, fixtures);
        await prepareCleanCapture(page, 'light');
        const top = await page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>(
            '#ref-media-dialog:not([hidden]) .lp-dialog-panel, #ref-media-dialog:not([hidden]) .lp-overlay-surface'
          );
          return panel ? Math.round(panel.getBoundingClientRect().top) : -1;
        });
        tops.push({ id: entry.id, top });
      }
      const validTops = tops.filter((t) => t.top >= 0);
      const unique = Array.from(new Set(validTops.map((t) => t.top)));
      if (unique.length > 1) {
        k50Violations.push(
          `@${vp.width}: dialog top y drifted across editor-media-* states: ${validTops.map((t) => `${t.id}=${t.top}`).join(', ')}`
        );
      }
    }

    console.log(`[WP-18.10 K50] violations=${k50Violations.length}`);
    if (k50Violations.length) console.log('K50:', k50Violations);
    expect(k50Violations, `K50 dialog top-anchor drift:\n${k50Violations.join('\n')}`).toEqual([]);
  });

  test('K53: Per-state text hash of main stable across viewports (320/1280/1920) modulo responsive', async ({
    page,
  }) => {
    const k53Violations: string[] = [];
    const targetStates = WP17_MANIFEST.filter((e) =>
      ['settings-storage', 'import-review', 'import-done', 'quick-log', 'today', 'public-entry-media', 'public-entry-image'].includes(e.id)
    );

    for (const entry of targetStates) {
      const hashes: Array<{ vp: number; len: number; hash: string }> = [];
      for (const vp of VIEWPORTS) {
        // V16: Re-seeding before each capture must yield identical content across viewports (non-idempotent seeding drifts)
        const vpFixtures = entry.id === 'settings-storage' ? await seedManifestFixtures(page) : fixtures;
        await page.setViewportSize(vp);
        await navigateToManifestEntry(page, entry, vpFixtures);
        await prepareCleanCapture(page, 'light');
        const normText = await page.evaluate(() => {
          const main = document.querySelector<HTMLElement>('main') || document.body;
          const clone = main.cloneNode(true) as HTMLElement;
          // Exclude explicitly responsive-only elements (e.g. regular-width-only key legend)
          clone.querySelectorAll('.triage-keys-legend, script, style').forEach((el) => el.remove());
          return (clone.textContent || '').replace(/\s+/g, ' ').trim();
        });
        const hash = createHash('md5').update(normText).digest('hex').slice(0, 8);
        hashes.push({ vp: vp.width, len: normText.length, hash });
      }
      const uniqueHashes = Array.from(new Set(hashes.map((h) => h.hash)));
      if (uniqueHashes.length > 1) {
        k53Violations.push(
          `${entry.id}: main text hash drifted across viewports: ${hashes.map((h) => `${h.vp}px=${h.hash}(${h.len}B)`).join(', ')}`
        );
      }
    }

    console.log(`[WP-18.10 K53] violations=${k53Violations.length}`);
    if (k53Violations.length) console.log('K53:', k53Violations);
    expect(k53Violations, `K53 cross-viewport text drift:\n${k53Violations.join('\n')}`).toEqual([]);
  });
});
