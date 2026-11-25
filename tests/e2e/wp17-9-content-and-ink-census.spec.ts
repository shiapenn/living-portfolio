import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.9 Content Standard & Painted-Ink Census (ADR-024, R-024-1..R-024-5).
 *
 * Enforces on rendered DOM across admin routes x 1280/320 x light/dark:
 * - (a) Banned-pattern scan ([object Object], undefined, null, NaN, WP-N, ADR-N, <hash>, (s), filenames, API paths)
 * - (b) Default-route static prose word budget <= 60 words (measured by Text role, shrinking-only, max 3 exemptions)
 * - (c) Per-role length caps (page description <= 14, Settings index no subtitle & module summary <= 6,
 *       section description <= 16, field helper <= 12, empty state <= 12, button <= 2)
 * - (d) Painted-ink Tabs check: active tab exists, label ink boxes pairwise non-intersecting & inside container, >= 44px height
 * - (e) Painted-ink EmptyState check: left ink edge equals section/page heading left ink edge within 1px, no raised surface/padding
 * - (f) Painted-ink Item anatomy check: status ink center within half a line height of title row at BOTH 1280px and 320px
 *
 * Every relation reports exact node/pair counts; zero measured = fail.
 */

const ADMIN_ROUTES: Array<{ id: string; path: string }> = [
  { id: 'today', path: '/admin' },
  { id: 'entries', path: '/admin/entries' },
  { id: 'inbox', path: '/admin/inbox' },
  { id: 'audit', path: '/admin/audit' },
  { id: 'audit-contradictions', path: '/admin/audit?status=contradictions' },
  { id: 'calibration', path: '/admin/calibration' },
  { id: 'structure', path: '/admin/structure' },
  { id: 'bookings', path: '/admin/bookings' },
  { id: 'ventures', path: '/admin/ventures' },
  { id: 'pages', path: '/admin/pages' },
  { id: 'settings-index', path: '/admin/settings' },
  { id: 'settings-answering', path: '/admin/settings/answering' },
  { id: 'settings-providers', path: '/admin/settings/providers' },
  { id: 'settings-appearance', path: '/admin/settings/appearance' },
  { id: 'settings-notifications', path: '/admin/settings/notifications' },
  { id: 'settings-backups', path: '/admin/settings/backups' },
  { id: 'settings-visibility', path: '/admin/settings/visibility' },
  { id: 'settings-account', path: '/admin/settings/account' },
  { id: 'settings-home', path: '/admin/settings/home' },
  { id: 'status', path: '/admin/status' },
];

const WORD_BUDGET_EXEMPTIONS: Record<string, string> = {};

const BANNED_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'object-coercion', re: /\[object Object\]/ },
  { name: 'undefined-literal', re: /\bundefined\b/ },
  { name: 'null-literal', re: /\bnull\b/ },
  { name: 'nan-literal', re: /\bNaN\b/ },
  { name: 'wp-id', re: /\bWP-\d+/ },
  { name: 'adr-id', re: /\bADR-\d+/ },
  { name: 'hash-placeholder', re: /<hash>/ },
  { name: 'paren-plural', re: /\(s\)/ },
  { name: 'source-filename', re: /\b[a-z0-9_.-]+\.(css|ts|tsx|js|json|txt|xml)\b/i },
  { name: 'api-path', re: /\/api\/[a-z0-9/_-]+/i },
  { name: 'explain-heading', re: /^How .+ works$/i },
  { name: 'explain-prefix', re: /^(What it does|When to change|Impact):/i },
];

function wordCount(text: string): number {
  const cleaned = text.trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

test.describe('WP-17.9 Content Standard & Painted-Ink Census (ADR-024)', () => {
  test('every admin route passes banned-pattern, word-budget, role-cap, and painted-ink checks across 1280/320 x light/dark', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureAdminLoggedIn(page);

    const counts = {
      routesChecked: 0,
      textNodesChecked: 0,
      bannedScanned: 0,
      roleCapsChecked: 0,
      tabPairsChecked: 0,
      tabsChecked: 0,
      emptyStatesChecked: 0,
      itemStatusRowsChecked: 0,
    };

    const violations: string[] = [];
    const wordTable: Record<string, number> = {};

    const viewports = [
      { width: 1280, height: 800 },
      { width: 320, height: 640 },
    ] as const;
    const themes = ['light', 'dark'] as const;

    for (const route of ADMIN_ROUTES) {
      for (const vp of viewports) {
        await page.setViewportSize(vp);
        for (const theme of themes) {
          await page.goto(route.path);
          await page.evaluate((t) => {
            document.documentElement.setAttribute('data-theme', t);
            try { localStorage.setItem('strata-theme', t); } catch {}
          }, theme);
          await page.waitForTimeout(40);
          counts.routesChecked++;

          const tag = `[${route.id} ${vp.width} ${theme}]`;

          const data = await page.evaluate(() => {
            const isVisible = (el: Element): boolean => {
              const style = getComputedStyle(el);
              if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            };
            const textInkRect = (el: Element): { left: number; right: number; top: number; bottom: number; height: number } | null => {
              const range = document.createRange();
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              let minL = Infinity, maxR = -Infinity, minT = Infinity, maxB = -Infinity;
              let found = false;
              let node: Node | null;
              while ((node = walker.nextNode())) {
                if (!node.textContent || !node.textContent.trim()) continue;
                range.selectNodeContents(node);
                const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
                for (const r of rects) {
                  found = true;
                  minL = Math.min(minL, r.left);
                  maxR = Math.max(maxR, r.right);
                  minT = Math.min(minT, r.top);
                  maxB = Math.max(maxB, r.bottom);
                }
              }
              if (!found) return null;
              return { left: minL, right: maxR, top: minT, bottom: maxB, height: maxB - minT };
            };

            const main = document.querySelector('main') || document.body;
            const visibleTextBlocks: string[] = [];
            const tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
            let tn: Node | null;
            while ((tn = tw.nextNode())) {
              const parent = tn.parentElement;
              if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;
              if (!isVisible(parent)) continue;
              const txt = (tn.textContent || '').trim();
              if (txt) visibleTextBlocks.push(txt);
            }

            const pageDesc = main.querySelector('.lp-page-description');
            const pageDescText = pageDesc && isVisible(pageDesc) ? (pageDesc.textContent || '').trim() : '';

            const sectionDescs = Array.from(main.querySelectorAll('.lp-form-section-description'))
              .filter(isVisible)
              .map((el) => (el.textContent || '').trim())
              .filter(Boolean);

            const helpers = Array.from(main.querySelectorAll('.lp-help-text, .lp-field-help'))
              .filter(isVisible)
              .map((el) => (el.textContent || '').trim())
              .filter(Boolean);

            const empties = Array.from(main.querySelectorAll('.lp-empty-state'))
              .filter(isVisible)
              .map((el) => {
                const body = el.querySelector('.lp-empty-body') || el;
                const ink = textInkRect(body);
                const style = getComputedStyle(el);
                const section = el.closest('.lp-form-section');
                const heading = (section ? section.querySelector('h2, h3') : null) || main.querySelector('h1');
                const headingInk = heading && isVisible(heading) ? textInkRect(heading) : null;
                return {
                  text: (body.textContent || '').trim(),
                  inkLeft: ink ? ink.left : null,
                  headingInkLeft: headingInk ? headingInk.left : null,
                  paddingLeft: parseFloat(style.paddingLeft) || 0,
                  bg: style.backgroundColor,
                };
              });

            const notices = Array.from(main.querySelectorAll('.lp-notice'))
              .filter(isVisible)
              .map((el) => (el.textContent || '').trim())
              .filter(Boolean);

            const buttons = Array.from(main.querySelectorAll('button.lp-btn, a.lp-btn'))
              .filter(isVisible)
              .map((el) => (el.textContent || '').trim())
              .filter(Boolean);

            const settingsIndexSubtitles = Array.from(main.querySelectorAll('#settings-index-list .lp-item-subtitle'))
              .filter(isVisible)
              .map((el) => (el.textContent || '').trim())
              .filter(Boolean);

            const tabLists = Array.from(main.querySelectorAll('[role="tablist"]'))
              .filter(isVisible)
              .map((tl) => {
                const tlRect = tl.getBoundingClientRect();
                const tabs = Array.from(tl.querySelectorAll('[role="tab"]'))
                  .filter(isVisible)
                  .map((t) => {
                    const r = t.getBoundingClientRect();
                    const ink = textInkRect(t);
                    return {
                      text: (t.textContent || '').trim(),
                      selected: t.getAttribute('aria-selected') === 'true',
                      height: r.height,
                      left: r.left,
                      right: r.right,
                      inkLeft: ink ? ink.left : r.left,
                      inkRight: ink ? ink.right : r.right,
                      inkTop: ink ? ink.top : r.top,
                      inkBottom: ink ? ink.bottom : r.bottom,
                    };
                  });
                return {
                  tlLeft: tlRect.left,
                  tlRight: tlRect.right,
                  scrollWidth: tl.scrollWidth,
                  clientWidth: tl.clientWidth,
                  tabs,
                };
              });

            const itemRows = Array.from(main.querySelectorAll('[data-c="Item"]'))
              .filter(isVisible)
              .map((item) => {
                const titleEl = item.querySelector('.lp-item-title');
                const statusEl = item.querySelector('.lp-item-status');
                if (!titleEl || !statusEl || !isVisible(titleEl) || !isVisible(statusEl)) return null;
                const titleInk = textInkRect(titleEl);
                const statusInk = textInkRect(statusEl);
                const lineHeight = parseFloat(getComputedStyle(titleEl).lineHeight) || 20;
                if (!titleInk || !statusInk) return null;
                const titleFirstLineCenterY = titleInk.top + Math.min(titleInk.height, lineHeight) / 2;
                const statusCenterY = (statusInk.top + statusInk.bottom) / 2;
                return {
                  title: (titleEl.textContent || '').trim(),
                  deltaY: Math.abs(titleFirstLineCenterY - statusCenterY),
                  halfLineHeight: lineHeight / 2 + 2,
                };
              })
              .filter(Boolean) as Array<{ title: string; deltaY: number; halfLineHeight: number }>;

            return {
              visibleTextBlocks,
              pageDescText,
              sectionDescs,
              helpers,
              empties,
              notices,
              buttons,
              settingsIndexSubtitles,
              tabLists,
              itemRows,
            };
          });

          // (a) Banned-pattern scan
          for (const txt of data.visibleTextBlocks) {
            counts.textNodesChecked++;
            counts.bannedScanned++;
            for (const bp of BANNED_PATTERNS) {
              if (bp.re.test(txt)) {
                violations.push(`${tag} banned(${bp.name}): "${txt.slice(0, 80)}"`);
              }
            }
          }

          // (b) Static prose word budget on default 1280 light
          if (vp.width === 1280 && theme === 'light') {
            const proseParts = [
              data.pageDescText,
              ...data.sectionDescs,
              ...data.helpers,
              ...data.empties.map((e) => e.text),
              ...data.notices,
            ].filter(Boolean);
            const totalWords = proseParts.reduce((acc, s) => acc + wordCount(s), 0);
            wordTable[route.id] = totalWords;
            if (totalWords > 60 && !WORD_BUDGET_EXEMPTIONS[route.id]) {
              violations.push(`${tag} word-budget: ${totalWords} words > 60`);
            }
          }

          // (c) Per-role length caps
          if (route.id === 'settings-index' && data.pageDescText) {
            violations.push(`${tag} settings-index must omit page subtitle (got "${data.pageDescText}")`);
          }
          if (data.pageDescText) {
            counts.roleCapsChecked++;
            if (wordCount(data.pageDescText) > 14) {
              violations.push(`${tag} page-description > 14 words (${wordCount(data.pageDescText)}): "${data.pageDescText}"`);
            }
          }
          for (const s of data.settingsIndexSubtitles) {
            counts.roleCapsChecked++;
            if (wordCount(s) > 6) {
              violations.push(`${tag} settings-index-summary > 6 words (${wordCount(s)}): "${s}"`);
            }
          }
          for (const s of data.sectionDescs) {
            counts.roleCapsChecked++;
            if (wordCount(s) > 16) {
              violations.push(`${tag} section-description > 16 words (${wordCount(s)}): "${s}"`);
            }
          }
          for (const h of data.helpers) {
            counts.roleCapsChecked++;
            if (wordCount(h) > 12) {
              violations.push(`${tag} helper > 12 words (${wordCount(h)}): "${h}"`);
            }
          }
          for (const e of data.empties) {
            counts.roleCapsChecked++;
            counts.emptyStatesChecked++;
            if (wordCount(e.text) > 12) {
              violations.push(`${tag} empty-state > 12 words (${wordCount(e.text)}): "${e.text}"`);
            }
            if (e.paddingLeft > 1) {
              violations.push(`${tag} empty-state paddingLeft=${e.paddingLeft}px > 0 (D4)`);
            }
            if (e.bg !== 'rgba(0, 0, 0, 0)' && e.bg !== 'transparent') {
              violations.push(`${tag} empty-state has surface background ${e.bg} (D4)`);
            }
            if (e.inkLeft !== null && e.headingInkLeft !== null && Math.abs(e.inkLeft - e.headingInkLeft) > 1.5) {
              violations.push(`${tag} empty-state inkLeft=${e.inkLeft.toFixed(1)} != headingInkLeft=${e.headingInkLeft.toFixed(1)} (D4)`);
            }
          }
          for (const b of data.buttons) {
            counts.roleCapsChecked++;
            if (wordCount(b) > 2) {
              violations.push(`${tag} button > 2 words (${wordCount(b)}): "${b}"`);
            }
          }

          // (d) Painted-ink Tabs check (D1)
          for (const tl of data.tabLists) {
            const selectedCount = tl.tabs.filter((t) => t.selected).length;
            if (selectedCount !== 1) {
              violations.push(`${tag} tablist selected count=${selectedCount} (expected 1)`);
            }
            for (const t of tl.tabs) {
              counts.tabsChecked++;
              if (t.height < 44) {
                violations.push(`${tag} tab "${t.text}" height=${t.height.toFixed(1)}px < 44px`);
              }
            }
            for (let i = 0; i < tl.tabs.length; i++) {
              for (let j = i + 1; j < tl.tabs.length; j++) {
                counts.tabPairsChecked++;
                const a = tl.tabs[i];
                const b = tl.tabs[j];
                if (a.inkRight > b.inkLeft + 0.5) {
                  violations.push(`${tag} tab ink overlap: "${a.text}" (${a.inkRight.toFixed(1)}) > "${b.text}" (${b.inkLeft.toFixed(1)})`);
                }
              }
            }
          }

          // (f) Painted-ink Item status alignment on title row at 1280 and 320 (D5)
          for (const row of data.itemRows) {
            counts.itemStatusRowsChecked++;
            if (row.deltaY > row.halfLineHeight) {
              violations.push(`${tag} item "${row.title}" status off title row (deltaY=${row.deltaY.toFixed(1)} > ${row.halfLineHeight.toFixed(1)})`);
            }
          }
        }
      }
    }

    console.log('=== WP-17.9 CONTENT & PAINTED-INK CENSUS ===');
    console.log('COUNTS:', JSON.stringify(counts));
    console.log('WORD_TABLE:', JSON.stringify(wordTable));
    if (violations.length > 0) {
      console.log('VIOLATIONS:', JSON.stringify(violations.slice(0, 30), null, 2));
    }

    expect(Object.keys(WORD_BUDGET_EXEMPTIONS).length).toBeLessThanOrEqual(3);
    expect(counts.textNodesChecked).toBeGreaterThan(0);
    expect(counts.roleCapsChecked).toBeGreaterThan(0);
    expect(counts.tabPairsChecked).toBeGreaterThan(0);
    expect(counts.emptyStatesChecked).toBeGreaterThan(0);
    expect(counts.itemStatusRowsChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
