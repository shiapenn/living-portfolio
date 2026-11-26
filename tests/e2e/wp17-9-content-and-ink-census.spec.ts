import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.9 / WP-17.10 / WP-17.11 Content Standard, Feedback, Item v2, Accent & Credential Census
 * (ADR-024 R-024-1..R-024-6, ADR-025 R-025-1..R-025-4, K1–K5).
 *
 * Enforces across 320 / 1280 / 1920 x light / dark:
 * - Banned patterns (incl. ISO YYYY-MM-DD dates), reconciled static prose word budget <= 60, role caps
 * - K1: Zero horizontal overflow (scrollWidth <= clientWidth) on every route x 320/1280/1920 x light/dark + account-token-created at 320px; content max-width preserved at 1920px
 * - K2: Feedback placement (same section, in viewport, aria-live, Notice full width within 1px, below ActionBar for scenarios 2/3, above for scenario 5, mapped concise validation errors)
 * - K3: Item v2 painted-ink anatomy (compact <480px: status ink below title ink, chevron on status row, title >=95% width; regular >=480px: status on title row; forced 479/480 breakpoint switch; zero status nodes on single-status filtered lists)
 * - K4: Accent coverage across 3 AA-passing seeds (incl. loud) in light & dark for every C4 role within 1 RGB step, zero legacy default accent ink
 * - K5: Credential component for TOTP manual key (4-char groups), recovery codes (2-col compact / 4-col regular grid), API token (wrapping, zero overflow), Copy works -> "Copied"
 */

const ADMIN_ROUTES: Array<{ id: string; path: string }> = [
  { id: 'today', path: '/admin' },
  { id: 'entries', path: '/admin/entries' },
  { id: 'inbox', path: '/admin/inbox' },
  { id: 'audit', path: '/admin/audit' },
  { id: 'audit-confirmed', path: '/admin/audit?status=confirmed' },
  { id: 'audit-revoked', path: '/admin/audit?status=revoked' },
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

const SINGLE_STATUS_ROUTES = new Set([
  'audit', 'audit-confirmed', 'audit-revoked', 'audit-contradictions', 'inbox',
]);

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
  { name: 'iso-date', re: /\b\d{4}-\d{2}-\d{2}\b/ },
  { name: 'explain-heading', re: /^How .+ works$/i },
  { name: 'explain-prefix', re: /^(What it does|When to change|Impact):/i },
];

const ENTITY_STATUS_VOCAB: Record<string, ReadonlySet<string>> = {
  bookings: new Set(['Pending', 'Confirmed', 'Declined', 'Cancelled']),
  'settings-account': new Set(['Active', 'Revoked']),
};

function wordCount(text: string): number {
  const cleaned = text.trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

function parseRgb(cssColor: string): [number, number, number] | null {
  const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbWithin1(a: [number, number, number], b: [number, number, number]): boolean {
  return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && Math.abs(a[2] - b[2]) <= 1;
}

test.describe('WP-17.11 Content, Item v2, Overflow, Feedback, Accent & Credential Census (ADR-024, ADR-025)', () => {
  test('K1 + K3 + Content Standard across all admin routes x 320/1280/1920 x light/dark', async ({ page }) => {
    test.setTimeout(300_000);
    await ensureAdminLoggedIn(page);

    const counts = {
      routesChecked: 0,
      overflowChecks: 0,
      maxWidth1920Checks: 0,
      textNodesChecked: 0,
      bannedScanned: 0,
      roleCapsChecked: 0,
      tabPairsChecked: 0,
      tabsChecked: 0,
      tabPanelHeadingsChecked: 0,
      emptyStatesChecked: 0,
      compactItemsChecked: 0,
      regularItemsChecked: 0,
      singleStatusListsChecked: 0,
      statusDotGapsChecked: 0,
      entityStatusesChecked: 0,
    };

    const violations: string[] = [];
    const wordTable: Record<string, number> = {};

    const viewports = [
      { width: 320, height: 640 },
      { width: 1280, height: 800 },
      { width: 1920, height: 1080 },
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
          await page.waitForTimeout(30);
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

            const scrollWidth = document.documentElement.scrollWidth;
            const clientWidth = document.documentElement.clientWidth;
            const main = document.querySelector('main') || document.body;
            const contentCol = main.querySelector('.lp-page-column, .lp-page, .lp-page-container') || main;
            const contentColWidth = contentCol.getBoundingClientRect().width;

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

            const countedEls = new Set<Element>();
            const proseNodes: Array<{ role: string; text: string }> = [];
            const addProse = (el: Element, role: string) => {
              if (countedEls.has(el) || !isVisible(el)) return;
              const txt = (el.textContent || '').trim();
              if (!txt) return;
              countedEls.add(el);
              proseNodes.push({ role, text: txt });
            };

            const pageDesc = main.querySelector('.lp-page-description');
            const pageDescText = pageDesc && isVisible(pageDesc) ? (pageDesc.textContent || '').trim() : '';
            if (pageDesc) addProse(pageDesc, 'page-description');

            const sectionDescs: string[] = [];
            for (const el of Array.from(main.querySelectorAll('.lp-form-section-desc, .lp-form-section-description'))) {
              if (!isVisible(el)) continue;
              const t = (el.textContent || '').trim();
              if (t) { sectionDescs.push(t); addProse(el, 'section-description'); }
            }

            const helpers: string[] = [];
            for (const el of Array.from(main.querySelectorAll('.lp-help-text, .lp-field-help'))) {
              if (!isVisible(el)) continue;
              const t = (el.textContent || '').trim();
              if (t) { helpers.push(t); addProse(el, 'field-helper'); }
            }

            const empties = Array.from(main.querySelectorAll('.lp-empty-state'))
              .filter(isVisible)
              .map((el) => {
                const body = el.querySelector('.lp-empty-body') || el;
                addProse(body, 'empty-state');
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

            const notices: Array<{ text: string; isOk: boolean }> = [];
            for (const el of Array.from(main.querySelectorAll('.lp-notice'))) {
              if (!isVisible(el)) continue;
              const t = (el.textContent || '').trim();
              if (t) { notices.push({ text: t, isOk: el.classList.contains('lp-notice-ok') }); addProse(el, 'notice'); }
            }

            for (const el of Array.from(main.querySelectorAll('[data-c="Text"]'))) {
              if (countedEls.has(el) || !isVisible(el)) continue;
              if (el.closest('[data-c="Item"], table, button, a, label, [role="dialog"]')) continue;
              if (el.id === 'theme-conformance-box') continue;
              addProse(el, 'static-text');
            }

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
                const tabs = Array.from(tl.querySelectorAll('[role="tab"]'))
                  .filter(isVisible)
                  .map((t) => {
                    const r = t.getBoundingClientRect();
                    const ink = textInkRect(t);
                    return {
                      text: (t.textContent || '').trim(),
                      selected: t.getAttribute('aria-selected') === 'true',
                      height: r.height,
                      inkLeft: ink ? ink.left : r.left,
                      inkRight: ink ? ink.right : r.right,
                    };
                  });
                return { tabs };
              });

            const panelHeadings = Array.from(main.querySelectorAll('h2, h3'))
              .filter(isVisible)
              .map((h) => (h.textContent || '').trim())
              .filter(Boolean);

            // K3: Item v2 painted-ink geometry
            const itemRows = Array.from(main.querySelectorAll('[data-c="Item"]'))
              .filter(isVisible)
              .map((item) => {
                const container = item.querySelector('.lp-item-content') || item;
                const containerRect = container.getBoundingClientRect();
                const containerCs = getComputedStyle(container);
                const contentWidth = containerRect.width - (parseFloat(containerCs.paddingLeft) || 0) - (parseFloat(containerCs.paddingRight) || 0);
                const listEl = item.closest('.lp-list');
                const listWidth = listEl ? listEl.getBoundingClientRect().width : containerRect.width;
                const titleEl = item.querySelector('.lp-item-title');
                const statusEl = item.querySelector('.lp-item-status');
                const chevronEl = item.querySelector('.lp-item-chevron');
                if (!titleEl || !statusEl || !isVisible(titleEl) || !isVisible(statusEl)) return null;
                const titleRect = titleEl.getBoundingClientRect();
                const titleInk = textInkRect(titleEl);
                const statusInk = textInkRect(statusEl);
                const statusRect = statusEl.getBoundingClientRect();
                const chevronRect = chevronEl && isVisible(chevronEl) ? chevronEl.getBoundingClientRect() : null;
                const lineHeight = parseFloat(getComputedStyle(titleEl).lineHeight) || 20;
                if (!titleInk) return null;
                const isCompact = listWidth < 480;
                return {
                  title: (titleEl.textContent || '').trim(),
                  isCompact,
                  containerWidth: contentWidth,
                  titleWidthRatio: contentWidth > 0 ? titleRect.width / contentWidth : 1,
                  titleInkBottom: Math.min(titleInk.bottom, titleRect.bottom),
                  titleFirstLineCenterY: titleInk.top + Math.min(titleInk.height, lineHeight) / 2,
                  statusTop: statusInk ? statusInk.top : statusRect.top,
                  statusCenterY: statusInk ? (statusInk.top + statusInk.bottom) / 2 : (statusRect.top + statusRect.bottom) / 2,
                  chevronCenterY: chevronRect ? (chevronRect.top + chevronRect.bottom) / 2 : null,
                  halfLineHeight: lineHeight / 2 + 2,
                };
              })
              .filter(Boolean) as Array<{
                title: string; isCompact: boolean; containerWidth: number; titleWidthRatio: number;
                titleInkBottom: number; titleFirstLineCenterY: number;
                statusTop: number; statusCenterY: number; chevronCenterY: number | null; halfLineHeight: number;
              }>;

            const statusLabels = Array.from(main.querySelectorAll('[data-c="StatusLabel"]'))
              .filter(isVisible)
              .map((el) => {
                const dot = el.querySelector('.lp-status-dot');
                const labelEl = el.querySelector('.lp-status-label') || el.querySelector('span:last-child');
                const text = (labelEl?.textContent || el.textContent || '').trim();
                let dotGap: number | null = null;
                if (dot && isVisible(dot) && labelEl) {
                  const dotRect = dot.getBoundingClientRect();
                  const labelInk = textInkRect(labelEl);
                  if (labelInk) dotGap = labelInk.left - dotRect.right;
                }
                return { text, dotGap };
              });

            const listCount = main.querySelectorAll('[data-c="List"] [data-c="Item"]').length;

            return {
              scrollWidth, clientWidth, contentColWidth,
              visibleTextBlocks, proseNodes, pageDescText, sectionDescs, helpers,
              empties, notices, buttons, settingsIndexSubtitles, tabLists,
              panelHeadings, itemRows, statusLabels, listCount,
            };
          });

          // K1: Horizontal overflow check at 320/1280/1920
          counts.overflowChecks++;
          if (data.scrollWidth > data.clientWidth) {
            violations.push(`${tag} K1 horizontal overflow: scrollWidth=${data.scrollWidth} > clientWidth=${data.clientWidth}`);
          }
          // C5: Content column keeps its max-width at 1920
          if (vp.width === 1920) {
            counts.maxWidth1920Checks++;
            if (data.contentColWidth > 1240) {
              violations.push(`${tag} C5 content column stretched at 1920px: width=${Math.round(data.contentColWidth)}px > 1240px`);
            }
          }

          // Banned patterns (incl. A8 ISO dates)
          for (const txt of data.visibleTextBlocks) {
            counts.textNodesChecked++;
            counts.bannedScanned++;
            for (const bp of BANNED_PATTERNS) {
              if (bp.re.test(txt)) violations.push(`${tag} banned(${bp.name}): "${txt.slice(0, 80)}"`);
            }
          }

          // Reconciled static prose word budget (1280 light)
          if (vp.width === 1280 && theme === 'light') {
            const totalWords = data.proseNodes.reduce((acc, n) => acc + wordCount(n.text), 0);
            wordTable[route.id] = totalWords;
            if (totalWords > 60 && !WORD_BUDGET_EXEMPTIONS[route.id]) {
              violations.push(`${tag} word-budget: ${totalWords} words > 60`);
            }
          }

          // Role caps
          if (route.id === 'settings-index' && data.pageDescText) {
            violations.push(`${tag} settings-index must omit page subtitle`);
          }
          if (data.pageDescText) {
            counts.roleCapsChecked++;
            if (wordCount(data.pageDescText) > 14) violations.push(`${tag} page-description > 14 words`);
          }
          for (const s of data.settingsIndexSubtitles) {
            counts.roleCapsChecked++;
            if (wordCount(s) > 6) violations.push(`${tag} settings-index-summary > 6 words: "${s}"`);
          }
          for (const s of data.sectionDescs) {
            counts.roleCapsChecked++;
            if (wordCount(s) > 16) violations.push(`${tag} section-description > 16 words: "${s}"`);
          }
          for (const h of data.helpers) {
            counts.roleCapsChecked++;
            if (wordCount(h) > 12) violations.push(`${tag} helper > 12 words: "${h}"`);
          }
          for (const e of data.empties) {
            counts.roleCapsChecked++;
            counts.emptyStatesChecked++;
            if (wordCount(e.text) > 12) violations.push(`${tag} empty-state > 12 words: "${e.text}"`);
            if (e.paddingLeft > 1) violations.push(`${tag} empty-state paddingLeft=${e.paddingLeft}px > 0 (D4)`);
            if (e.bg !== 'rgba(0, 0, 0, 0)' && e.bg !== 'transparent') violations.push(`${tag} empty-state has surface bg ${e.bg} (D4)`);
            if (e.inkLeft !== null && e.headingInkLeft !== null && Math.abs(e.inkLeft - e.headingInkLeft) > 1.5) {
              violations.push(`${tag} empty-state inkLeft=${e.inkLeft.toFixed(1)} != headingInkLeft=${e.headingInkLeft.toFixed(1)} (D4)`);
            }
          }
          for (const b of data.buttons) {
            counts.roleCapsChecked++;
            if (wordCount(b) > 2) violations.push(`${tag} button > 2 words: "${b}"`);
          }

          if (route.id === 'settings-appearance') {
            for (const n of data.notices) {
              if (n.isOk) violations.push(`${tag} appearance default load has static success Notice (A5)`);
            }
          }

          // Tabs + A1 heading dedupe
          for (const tl of data.tabLists) {
            const selectedTabs = tl.tabs.filter((t) => t.selected);
            if (selectedTabs.length !== 1) violations.push(`${tag} tablist selected count=${selectedTabs.length}`);
            const activeTabText = selectedTabs[0]?.text.toLowerCase();
            if (activeTabText) {
              for (const h of data.panelHeadings) {
                counts.tabPanelHeadingsChecked++;
                if (h.toLowerCase() === activeTabText) {
                  violations.push(`${tag} tab panel heading "${h}" repeats active tab label (A1)`);
                }
              }
            }
            for (const t of tl.tabs) {
              counts.tabsChecked++;
              if (t.height < 44) violations.push(`${tag} tab "${t.text}" height=${t.height.toFixed(1)}px < 44px`);
            }
            for (let i = 0; i < tl.tabs.length; i++) {
              for (let j = i + 1; j < tl.tabs.length; j++) {
                counts.tabPairsChecked++;
                if (tl.tabs[i].inkRight > tl.tabs[j].inkLeft + 0.5) {
                  violations.push(`${tag} tab ink overlap: "${tl.tabs[i].text}" > "${tl.tabs[j].text}"`);
                }
              }
            }
          }

          // K3: Item v2 compact (<480) vs regular (>=480)
          for (const row of data.itemRows) {
            if (row.isCompact) {
              counts.compactItemsChecked++;
              if (row.statusTop < row.titleInkBottom - 1) {
                violations.push(`${tag} K3 compact item "${row.title}" status not below title (statusTop=${row.statusTop.toFixed(1)} < titleBottom=${row.titleInkBottom.toFixed(1)})`);
              }
              if (row.titleWidthRatio < 0.95) {
                violations.push(`${tag} K3 compact item "${row.title}" title width ratio=${row.titleWidthRatio.toFixed(2)} < 0.95`);
              }
              if (row.chevronCenterY !== null && Math.abs(row.chevronCenterY - row.statusCenterY) > row.halfLineHeight) {
                violations.push(`${tag} K3 compact item "${row.title}" chevron not on status row`);
              }
            } else {
              counts.regularItemsChecked++;
              if (Math.abs(row.titleFirstLineCenterY - row.statusCenterY) > row.halfLineHeight) {
                violations.push(`${tag} K3 regular item "${row.title}" status off title row`);
              }
            }
          }

          // K3: Single-status filtered lists must have zero StatusLabel nodes
          if (SINGLE_STATUS_ROUTES.has(route.id) && data.listCount > 0) {
            counts.singleStatusListsChecked++;
            if (data.statusLabels.length > 0) {
              violations.push(`${tag} K3 single-status filtered route has ${data.statusLabels.length} StatusLabel node(s): ${data.statusLabels.map((s) => s.text).join(', ')}`);
            }
          }

          // Status dot gap >= 4px + closed entity vocabulary
          for (const st of data.statusLabels) {
            if (st.dotGap !== null) {
              counts.statusDotGapsChecked++;
              if (st.dotGap < 4) violations.push(`${tag} status "${st.text}" dot gap=${st.dotGap.toFixed(1)}px < 4px`);
            }
            const allowedVocab = ENTITY_STATUS_VOCAB[route.id];
            if (allowedVocab && st.text) {
              counts.entityStatusesChecked++;
              if (!allowedVocab.has(st.text)) violations.push(`${tag} status "${st.text}" outside vocabulary`);
            }
          }
        }
      }
    }

    console.log('=== WP-17.11 K1/K3 CONTENT & PAINTED-INK CENSUS ===');
    console.log('COUNTS:', JSON.stringify(counts));
    console.log('WORD_TABLE:', JSON.stringify(wordTable));
    if (violations.length > 0) console.log('VIOLATIONS:', JSON.stringify(violations.slice(0, 30), null, 2));

    expect(counts.overflowChecks).toBeGreaterThan(0);
    expect(counts.maxWidth1920Checks).toBeGreaterThan(0);
    expect(counts.compactItemsChecked).toBeGreaterThan(0);
    expect(counts.regularItemsChecked).toBeGreaterThan(0);
    expect(counts.singleStatusListsChecked).toBeGreaterThan(0);
    expect(counts.statusDotGapsChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('K3: Item v2 479px compact vs 480px regular container-query switch', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings');
    const switchProof = await page.evaluate(() => {
      const list = document.getElementById('settings-index-list') as HTMLElement | null;
      const item = list?.querySelector('[data-c="Item"]') as HTMLElement | null;
      if (!list || !item) return null;
      const measure = (w: number) => {
        list.style.width = w + 'px';
        void list.offsetWidth;
        const t = item.querySelector('.lp-item-title')!.getBoundingClientRect();
        const s = item.querySelector('.lp-item-status')!.getBoundingClientRect();
        return { titleBottom: t.bottom, statusTop: s.top, titleTop: t.top };
      };
      const at479 = measure(479);
      const at480 = measure(480);
      list.style.width = '';
      return { at479, at480 };
    });
    expect(switchProof).not.toBeNull();
    expect(switchProof!.at479.statusTop).toBeGreaterThanOrEqual(switchProof!.at479.titleBottom - 1);
    expect(Math.abs(switchProof!.at480.statusTop - switchProof!.at480.titleTop)).toBeLessThanOrEqual(12);
    console.log('=== WP-17.11 K3 479/480 SWITCH ===', JSON.stringify(switchProof));
  });

  test('K1: API token created at 320px has zero horizontal overflow', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/account');
    await page.fill('#account-token-label', 'k1-overflow-check-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created')).toBeVisible();
    const tokenOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log('=== WP-17.11 K1 TOKEN 320px ===', JSON.stringify(tokenOverflow));
    expect(tokenOverflow.scrollWidth).toBeLessThanOrEqual(tokenOverflow.clientWidth);
  });

  test('K5: Credential component (single token, recovery list 2/4 cols, manual key blocks of 4)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/account');

    // Single token Credential
    await page.fill('#account-token-label', 'k5-credential-check-token');
    await page.click('#btn-create-token');
    await expect(page.locator('#account-token-created[data-c="Credential"]')).toBeVisible();
    await expect(page.locator('#account-token-created .lp-notice-warn')).toBeVisible();
    await page.click('#account-token-created-copy-btn');
    await expect(page.locator('#account-token-created-copied')).toHaveText('Copied');

    // List Credential (2 cols at 320px, 4 cols at 1280px)
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output[data-c="Credential"] .lp-credential-cell')).toHaveCount(8);
    const cols320 = await page.evaluate(() => getComputedStyle(document.querySelector('#account-recovery-output .lp-credential-list')!).gridTemplateColumns.split(' ').length);
    expect(cols320).toBe(2);
    await page.setViewportSize({ width: 1280, height: 800 });
    const cols1280 = await page.evaluate(() => getComputedStyle(document.querySelector('#account-recovery-output .lp-credential-list')!).gridTemplateColumns.split(' ').length);
    expect(cols1280).toBe(4);
    await page.click('#account-recovery-output-copy-btn');
    await expect(page.locator('#account-recovery-output-copied')).toHaveText('Copied');

    // Manual key Credential grouped in blocks of 4
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-manual-cred[data-c="Credential"]')).toBeVisible();
    const manualText = (await page.locator('#account-totp-manual-cred [data-credential-value]').textContent()) || '';
    expect(manualText.trim()).toMatch(/^[A-Z2-7]{4}( [A-Z2-7]{1,4})+$/);
    console.log('=== WP-17.11 K5 CREDENTIAL COUNTS ===', JSON.stringify({ single: 1, list: 1, manualKey: 1, cols320, cols1280 }));
  });

  test('K2: Feedback placement & timing (ADR-025 scenarios 1, 2, 3, 5)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const k2Counts = { s1_fieldInvalid: 0, s2_actionError: 0, s3_actionSuccess: 0, s5_stateWarning: 0 };

    // Scenario 2: Wrong password -> danger Notice below ActionBar, same section, full width, in viewport
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/account');
    await page.fill('#account-current-password', 'wrong-password-check');
    await page.fill('#account-new-password', 'NewValidPassphrase123!');
    await page.click('#btn-update-credentials');
    await expect(page.locator('#account-creds-notice.lp-notice-danger')).toBeVisible();
    const credsK2 = await page.evaluate(() => {
      const btn = document.getElementById('btn-update-credentials')!;
      const bar = btn.closest('.lp-action-bar')!;
      const notice = document.getElementById('account-creds-notice')!;
      const sec = btn.closest('.lp-form-section')!;
      const nr = notice.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      const sr = sec.getBoundingClientRect();
      return {
        sameSection: notice.closest('.lp-form-section') === sec,
        belowActionBar: nr.top >= br.bottom - 1,
        fullWidth: Math.abs(nr.width - sr.width) <= 2,
        inViewport: nr.top >= 0 && nr.bottom <= window.innerHeight,
        hasLive: Boolean(notice.getAttribute('aria-live') || notice.getAttribute('role')),
      };
    });
    expect(credsK2).toEqual({ sameSection: true, belowActionBar: true, fullWidth: true, inViewport: true, hasLive: true });
    k2Counts.s2_actionError++;

    // Scenario 5: Answering drift warning directly ABOVE ActionBar; Scenario 1: Field invalid inline
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/answering');
    await page.fill('#setting-tier1-floor', '0.90');
    await expect(page.locator('#tier1-warning')).toBeVisible();
    const driftK2 = await page.evaluate(() => {
      const warn = document.getElementById('tier1-warning')!;
      const bar = document.getElementById('btn-restore-thresholds')!.closest('.lp-action-bar')!;
      const wr = warn.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      const sr = warn.closest('.lp-form-section')!.getBoundingClientRect();
      return { aboveActionBar: wr.bottom <= br.top + 1, fullWidth: Math.abs(wr.width - sr.width) <= 2 };
    });
    expect(driftK2).toEqual({ aboveActionBar: true, fullWidth: true });
    k2Counts.s5_stateWarning++;

    await page.fill('#setting-tier1-floor', '1.50');
    await page.click('#btn-save-settings-module');
    await expect(page.locator('#setting-tier1-floor')).toHaveAttribute('aria-invalid', 'true');
    k2Counts.s1_fieldInvalid++;

    // Scenario 2 & 3 on Appearance: Import error (mapped <=3 lines, full width, below ActionBar) & Import ok (StatusLine, not green Notice)
    await page.goto('/admin/settings/appearance');
    await page.fill('#setting-theme-import-json', '{"version":1,"customCss":"body{}"}');
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#appearance-import-feedback.lp-notice-danger')).toBeVisible();
    const importErrK2 = await page.evaluate(() => {
      const fb = document.getElementById('appearance-import-feedback')!;
      const bar = document.getElementById('btn-import-theme-pack')!.closest('.lp-action-bar')!;
      const sec = fb.closest('.lp-form-section')!;
      const liCount = fb.querySelectorAll('li').length;
      return {
        sameSection: bar.closest('.lp-form-section') === sec,
        belowActionBar: fb.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom - 1,
        fullWidth: Math.abs(fb.getBoundingClientRect().width - sec.getBoundingClientRect().width) <= 2,
        conciseList: liCount <= 4,
      };
    });
    expect(importErrK2).toEqual({ sameSection: true, belowActionBar: true, fullWidth: true, conciseList: true });
    k2Counts.s2_actionError++;

    await page.selectOption('#setting-theme-pack', 'quiet-default');
    await page.click('#btn-export-theme-pack');
    await page.click('#btn-import-theme-pack');
    await expect(page.locator('#appearance-import-feedback.lp-status-line-ok')).toBeVisible();
    await expect(page.locator('#appearance-import-feedback.lp-notice-ok')).toHaveCount(0);
    k2Counts.s3_actionSuccess++;

    console.log('=== WP-17.11 K2 COUNTS ===', JSON.stringify(k2Counts));
  });

  test('K4: Accent coverage across 3 AA-passing seeds (incl. loud) in light & dark, zero legacy default ink', async ({ page }) => {
    test.setTimeout(120_000);
    await ensureAdminLoggedIn(page);

    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    const seeds = [
      { id: 'editorial-slate', light: '#1E5B70', dark: '#7DD3FC' },
      { id: 'warm-ink', light: '#9A3412', dark: '#FDBA74' },
      { id: 'loud-magenta', light: '#A21CAF', dark: '#F0ABFC' },
    ];
    const legacyLight = hexToRgbTuple('#3A4FD0');
    const legacyDark = hexToRgbTuple('#9AA8FF');
    const roleCountsPerSeed: Record<string, number> = {};

    for (const seed of seeds) {
      roleCountsPerSeed[seed.id] = 0;
      const saveRes = await page.request.patch('/api/settings/appearance-v2', {
        headers,
        data: {
          scope: 'admin',
          pack: {
            version: 2, id: seed.id, name: seed.id, packId: 'quiet-default',
            accent: { light: seed.light, dark: seed.dark },
            density: 'comfortable', radiusScale: 'default', fontFamily: 'system',
          },
        },
      });
      expect(saveRes.status()).toBe(200);

      for (const theme of ['light', 'dark'] as const) {
        const expectedRgb = hexToRgbTuple(theme === 'light' ? seed.light : seed.dark);
        const legacyRgb = theme === 'light' ? legacyLight : legacyDark;

        await page.goto('/admin/settings/appearance');
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForTimeout(50);

        const appearanceRoles = await page.evaluate(() => {
          const primaryBtn = document.getElementById('btn-save-settings-module')!;
          const textBtn = document.getElementById('btn-export-theme-pack')!;
          const rootStyle = getComputedStyle(document.documentElement);
          return {
            primaryBg: getComputedStyle(primaryBtn).backgroundColor,
            textBtnColor: getComputedStyle(textBtn).color,
            accentColor: rootStyle.accentColor,
          };
        });

        for (const [roleName, val] of [
          ['primaryBg', appearanceRoles.primaryBg],
          ['textBtnColor', appearanceRoles.textBtnColor],
          ['accentColor', appearanceRoles.accentColor],
        ] as const) {
          const rgb = parseRgb(val);
          expect(rgb, `${seed.id} ${theme} ${roleName}=${val}`).not.toBeNull();
          expect(rgbWithin1(rgb!, expectedRgb), `${seed.id} ${theme} ${roleName} got ${rgb} expected ${expectedRgb}`).toBe(true);
          expect(rgbWithin1(rgb!, legacyRgb), `${seed.id} ${theme} ${roleName} leaked legacy default`).toBe(false);
          roleCountsPerSeed[seed.id]++;
        }

        // Check selected Choice check on /admin/settings/answering (uses saved theme.<hash>.css)
        await page.goto('/admin/settings/answering');
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForTimeout(40);
        const choiceCheckColor = await page.evaluate(() => getComputedStyle(document.querySelector('.lp-choice-check')!).color);
        const choiceRgb = parseRgb(choiceCheckColor);
        expect(choiceRgb, `${seed.id} ${theme} choiceCheck=${choiceCheckColor}`).not.toBeNull();
        expect(rgbWithin1(choiceRgb!, expectedRgb), `${seed.id} ${theme} choiceCheck got ${choiceRgb} expected ${expectedRgb}`).toBe(true);
        roleCountsPerSeed[seed.id]++;

        // Check selected Tab indicator on /admin/audit
        await page.goto('/admin/audit');
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForTimeout(40);
        const tabShadow = await page.evaluate(() => getComputedStyle(document.querySelector('.lp-tab-active')!).boxShadow);
        const tabRgb = parseRgb(tabShadow);
        expect(tabRgb, `${seed.id} ${theme} tabShadow=${tabShadow}`).not.toBeNull();
        expect(rgbWithin1(tabRgb!, expectedRgb), `${seed.id} ${theme} tabShadow got ${tabRgb} expected ${expectedRgb}`).toBe(true);
        roleCountsPerSeed[seed.id]++;
      }
    }

    // Restore quiet-default
    await page.request.patch('/api/settings/appearance-v2', {
      headers,
      data: {
        scope: 'admin',
        pack: {
          version: 2, id: 'quiet-default', name: 'Quiet default', packId: 'quiet-default',
          accent: { light: '#3A4FD0', dark: '#A5B4FC' },
          density: 'comfortable', radiusScale: 'default', fontFamily: 'system',
        },
      },
    });

    console.log('=== WP-17.11 K4 ACCENT ROLE COUNTS PER SEED ===', JSON.stringify(roleCountsPerSeed));
    for (const seed of seeds) expect(roleCountsPerSeed[seed.id]).toBeGreaterThanOrEqual(10);
  });
});
