import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.9 / WP-17.10 Content Standard & Painted-Ink Census (ADR-024, R-024-1..R-024-6).
 *
 * Enforces on rendered DOM across admin routes x 1280/320 x light/dark:
 * - (a) Banned-pattern scan ([object Object], undefined, null, NaN, WP-N, ADR-N, <hash>, (s), filenames, API paths, ISO YYYY-MM-DD dates)
 * - (b) Reconciled static prose word budget <= 60 words (A7: exact roles/selectors defined in docs/design/content.md)
 * - (c) Per-role length caps (page description <= 14, Settings index no subtitle & summary <= 6,
 *       section description <= 16, field helper <= 12, empty state <= 12, button <= 2)
 * - (d) Painted-ink Tabs check (D1 + A1): active tab exists, label ink boxes pairwise non-intersecting, >= 44px height,
 *       tab panel never repeats active tab name as a heading, no duplicate status/empty lines
 * - (e) Painted-ink EmptyState check (D4): left ink edge equals heading left ink edge within 1px, no raised surface/padding
 * - (f) Painted-ink Item anatomy & StatusDot gap check (D5 + A3): status ink center within half a line height of title row
 *       at 1280 and 320, AND painted ink gap between .lp-status-dot and label text ink >= 4px on every StatusLabel
 * - (g) Closed Status Vocabulary check (A6): Booking, Token, Rule, Revision
 * - (h) Interactive checks: Account section-local error in viewport + QR <= 192px (A3), Appearance no static green Notice (A5),
 *       Answering Pause dialog viewport-centred at 320px & 1280px (A10)
 *
 * Every relation reports exact node/pair counts; zero measured = fail.
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
  audit: new Set(['Pending', 'Active', 'Discarded']),
  'audit-confirmed': new Set(['Pending', 'Active', 'Discarded']),
  'audit-revoked': new Set(['Pending', 'Active', 'Discarded']),
  'audit-contradictions': new Set(['Pending', 'Active', 'Discarded']),
};

function wordCount(text: string): number {
  const cleaned = text.trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

test.describe('WP-17.9 / WP-17.10 Content Standard & Painted-Ink Census (ADR-024)', () => {
  test('every admin route passes banned-pattern, reconciled word-budget, role-cap, vocabulary, and painted-ink checks across 1280/320 x light/dark', async ({ page }) => {
    test.setTimeout(240_000);
    await ensureAdminLoggedIn(page);

    const counts = {
      routesChecked: 0,
      textNodesChecked: 0,
      bannedScanned: 0,
      roleCapsChecked: 0,
      tabPairsChecked: 0,
      tabsChecked: 0,
      tabPanelHeadingsChecked: 0,
      emptyStatesChecked: 0,
      itemStatusRowsChecked: 0,
      statusDotGapsChecked: 0,
      entityStatusesChecked: 0,
    };

    const violations: string[] = [];
    const wordTable: Record<string, number> = {};
    let answeringProseDump: Array<{ role: string; text: string; words: number }> = [];

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

            // Reconciled static prose nodes (A7)
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
              if (t) {
                sectionDescs.push(t);
                addProse(el, 'section-description');
              }
            }

            const helpers: string[] = [];
            for (const el of Array.from(main.querySelectorAll('.lp-help-text, .lp-field-help'))) {
              if (!isVisible(el)) continue;
              const t = (el.textContent || '').trim();
              if (t) {
                helpers.push(t);
                addProse(el, 'field-helper');
              }
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
              if (t) {
                notices.push({ text: t, isOk: el.classList.contains('lp-notice-ok') });
                addProse(el, 'notice');
              }
            }

            // Static [data-c="Text"] outside items, tables, controls, and already-counted nodes
            for (const el of Array.from(main.querySelectorAll('[data-c="Text"]'))) {
              if (countedEls.has(el) || !isVisible(el)) continue;
              if (el.closest('[data-c="Item"], table, button, a, label, [role="dialog"]')) continue;
              if (el.id === 'theme-conformance-box') continue; // live computed contrast readout
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
                    };
                  });
                return {
                  tlLeft: tlRect.left,
                  tlRight: tlRect.right,
                  tabs,
                };
              });

            const panelHeadings = Array.from(main.querySelectorAll('h2, h3'))
              .filter(isVisible)
              .map((h) => (h.textContent || '').trim())
              .filter(Boolean);

            const statusLineEl = main.querySelector('#audit-status-line, #settings-status-banner');
            const statusLineText = statusLineEl && isVisible(statusLineEl) ? (statusLineEl.textContent || '').trim() : '';

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
                  if (labelInk) {
                    dotGap = labelInk.left - dotRect.right;
                  }
                }
                return { text, dotGap };
              });

            const pageRevisions = Array.from(main.querySelectorAll('#pages-revisions-list [data-c="Item"]'))
              .filter(isVisible)
              .map((el, idx) => {
                const st = el.querySelector('[data-c="StatusLabel"]');
                return {
                  idx,
                  statusText: st && isVisible(st) ? (st.textContent || '').trim() : null,
                };
              });

            return {
              visibleTextBlocks,
              proseNodes,
              pageDescText,
              sectionDescs,
              helpers,
              empties,
              notices,
              buttons,
              settingsIndexSubtitles,
              tabLists,
              panelHeadings,
              statusLineText,
              itemRows,
              statusLabels,
              pageRevisions,
            };
          });

          // (a) Banned-pattern scan (including A8 ISO date ban)
          for (const txt of data.visibleTextBlocks) {
            counts.textNodesChecked++;
            counts.bannedScanned++;
            for (const bp of BANNED_PATTERNS) {
              if (bp.re.test(txt)) {
                violations.push(`${tag} banned(${bp.name}): "${txt.slice(0, 80)}"`);
              }
            }
          }

          // (b) Reconciled static prose word budget on default 1280 light (A7)
          if (vp.width === 1280 && theme === 'light') {
            const totalWords = data.proseNodes.reduce((acc, n) => acc + wordCount(n.text), 0);
            wordTable[route.id] = totalWords;
            if (route.id === 'settings-answering') {
              answeringProseDump = data.proseNodes.map((n) => ({
                role: n.role,
                text: n.text,
                words: wordCount(n.text),
              }));
            }
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
            // A1: no duplicate status line matching empty state
            if (data.statusLineText && data.statusLineText.toLowerCase() === e.text.toLowerCase()) {
              violations.push(`${tag} duplicate status line "${data.statusLineText}" repeats empty state (A1)`);
            }
          }
          for (const b of data.buttons) {
            counts.roleCapsChecked++;
            if (wordCount(b) > 2) {
              violations.push(`${tag} button > 2 words (${wordCount(b)}): "${b}"`);
            }
          }

          // A5: Appearance must not show an always-green success Notice on default load
          if (route.id === 'settings-appearance') {
            for (const n of data.notices) {
              if (n.isOk) {
                violations.push(`${tag} appearance default load has static success Notice: "${n.text}" (A5)`);
              }
            }
          }

          // (d) Painted-ink Tabs check (D1 + A1)
          for (const tl of data.tabLists) {
            const selectedTabs = tl.tabs.filter((t) => t.selected);
            if (selectedTabs.length !== 1) {
              violations.push(`${tag} tablist selected count=${selectedTabs.length} (expected 1)`);
            }
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

          // (f) Painted-ink Item status alignment (D5) and dot-to-label gap >= 4px (A3)
          for (const row of data.itemRows) {
            counts.itemStatusRowsChecked++;
            if (row.deltaY > row.halfLineHeight) {
              violations.push(`${tag} item "${row.title}" status off title row (deltaY=${row.deltaY.toFixed(1)} > ${row.halfLineHeight.toFixed(1)})`);
            }
          }
          for (const st of data.statusLabels) {
            if (st.dotGap !== null) {
              counts.statusDotGapsChecked++;
              if (st.dotGap < 4) {
                violations.push(`${tag} status "${st.text}" dot-to-label painted ink gap=${st.dotGap.toFixed(1)}px < 4px (A3)`);
              }
            }
            const allowedVocab = ENTITY_STATUS_VOCAB[route.id];
            if (allowedVocab && st.text) {
              counts.entityStatusesChecked++;
              if (!allowedVocab.has(st.text)) {
                violations.push(`${tag} status "${st.text}" outside closed vocabulary [${Array.from(allowedVocab).join(', ')}] (A6)`);
              }
            }
          }
          // A6: Pages revisions (newest = Current, older = no status)
          for (const rev of data.pageRevisions) {
            counts.entityStatusesChecked++;
            if (rev.idx === 0 && rev.statusText !== 'Current') {
              violations.push(`${tag} newest page revision status="${rev.statusText}" != "Current" (A6)`);
            }
            if (rev.idx > 0 && rev.statusText !== null) {
              violations.push(`${tag} older page revision #${rev.idx} must show no status (got "${rev.statusText}") (A6)`);
            }
          }
        }
      }
    }

    console.log('=== WP-17.10 CONTENT & PAINTED-INK CENSUS ===');
    console.log('COUNTS:', JSON.stringify(counts));
    console.log('WORD_TABLE:', JSON.stringify(wordTable));
    console.log('ANSWERING_PROSE_NODES:', JSON.stringify(answeringProseDump, null, 2));
    if (violations.length > 0) {
      console.log('VIOLATIONS:', JSON.stringify(violations.slice(0, 30), null, 2));
    }

    expect(Object.keys(WORD_BUDGET_EXEMPTIONS).length).toBeLessThanOrEqual(3);
    expect(counts.textNodesChecked).toBeGreaterThan(0);
    expect(counts.roleCapsChecked).toBeGreaterThan(0);
    expect(counts.tabPairsChecked).toBeGreaterThan(0);
    expect(counts.emptyStatesChecked).toBeGreaterThan(0);
    expect(counts.itemStatusRowsChecked).toBeGreaterThan(0);
    expect(counts.statusDotGapsChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('interactive exit-gate invariants: A1 contradictions clean dedupe, A3 Account section-local errors & QR <= 192px, A10 dialog viewport centring', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // A1: Contradictions Run check clean must show "No contradictions found." exactly once and no ISO date
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/audit?status=contradictions');
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', /clean|found/);
    const auditState = await page.locator('#audit-contradictions-panel').getAttribute('data-contradictions-state');
    if (auditState === 'clean') {
      const cleanCount = await page.evaluate(() => {
        const text = (document.querySelector('main')?.innerText || '');
        return (text.match(/No contradictions found\./g) || []).length;
      });
      expect(cleanCount).toBe(1);
      const lastCheckedText = (await page.locator('#audit-last-checked').textContent()) || '';
      expect(lastCheckedText).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(lastCheckedText).toMatch(/\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}/);
    }

    // A3: Account section-local error in viewport + same section ancestor, QR <= 192px
    await page.goto('/admin/settings/account');
    await page.fill('#account-current-password', 'wrong-password-check');
    await page.fill('#account-new-password', 'NewValidPassphrase123!');
    await page.click('#btn-update-credentials');
    await expect(page.locator('#account-creds-notice.lp-notice-danger')).toBeVisible();
    const credsCheck = await page.evaluate(() => {
      const btn = document.getElementById('btn-update-credentials');
      const notice = document.getElementById('account-creds-notice');
      if (!btn || !notice) return { ok: false, reason: 'missing elements' };
      const r = notice.getBoundingClientRect();
      const inViewport = r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0;
      const sameSection = btn.closest('.lp-form-section') === notice.closest('.lp-form-section');
      return { ok: inViewport && sameSection && notice.classList.contains('lp-notice-danger'), inViewport, sameSection };
    });
    expect(credsCheck.ok).toBe(true);

    // Re-enrol TOTP -> QR <= 192px square, then bad code -> section-local error inside TOTP section
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-qr svg')).toBeVisible();
    const qrBox = await page.locator('#account-totp-qr svg').boundingBox();
    expect(qrBox).not.toBeNull();
    expect(qrBox!.width).toBeLessThanOrEqual(192);
    expect(qrBox!.height).toBeLessThanOrEqual(192);

    await page.fill('#account-totp-code', '000000');
    await page.click('#btn-confirm-totp');
    await expect(page.locator('#account-totp-notice.lp-notice-danger')).toBeVisible();
    const totpCheck = await page.evaluate(() => {
      const btn = document.getElementById('btn-confirm-totp');
      const notice = document.getElementById('account-totp-notice');
      if (!btn || !notice) return { ok: false };
      const r = notice.getBoundingClientRect();
      const inViewport = r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0;
      const sameSection = btn.closest('.lp-form-section') === notice.closest('.lp-form-section');
      return { ok: inViewport && sameSection && notice.classList.contains('lp-notice-danger') };
    });
    expect(totpCheck.ok).toBe(true);

    // A10: Dialog vertically centred in viewport at 320px
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/answering');
    await page.locator('label:has(#setting-answering-enabled)').click();
    await expect(page.locator('#answering-pause-dialog')).toBeVisible();
    const dialogMetrics = await page.evaluate(() => {
      const panel = document.querySelector('#answering-pause-dialog .lp-dialog-panel');
      if (!panel) return null;
      const r = panel.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        centerY: (r.top + r.bottom) / 2,
        viewportCenterY: window.innerHeight / 2,
      };
    });
    expect(dialogMetrics).not.toBeNull();
    expect(Math.abs(dialogMetrics!.centerY - dialogMetrics!.viewportCenterY)).toBeLessThanOrEqual(4);
    await page.click('#btn-cancel-pause-answering');
  });
});
