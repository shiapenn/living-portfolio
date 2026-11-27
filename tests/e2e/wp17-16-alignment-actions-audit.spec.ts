import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  seedManifestFixtures,
  navigateToManifestEntry,
  type ManifestFixtures,
} from './wp17-manifest.js';

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
  { width: 1920, height: 900 },
];

async function setThemeClean(page: import('@playwright/test').Page, theme: 'light' | 'dark' = 'light') {
  await page.mouse.move(0, 0);
  await page.evaluate((t) => {
    if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
      (document.activeElement as HTMLElement).blur();
    }
    document.documentElement.setAttribute('data-theme-switching', 'true');
    document.documentElement.setAttribute('data-theme', t);
    void document.documentElement.offsetHeight;
    document.documentElement.removeAttribute('data-theme-switching');
  }, theme);
}

test.describe('WP-17.16 Horizontal Alignment, Form Actions, Pager, Credential & L7 Self-Test (K36–K43)', () => {
  test.setTimeout(240_000);

  let fixtures: ManifestFixtures;

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ensureAdminLoggedIn(page);
    if (!fixtures) {
      fixtures = await seedManifestFixtures(page);
    }
  });

  test('K36–K40: Generic closed-world horizontal alignment (HA1–HA5) across 100% of manifest at 320/1280/1920', async ({ page }) => {
    const ha1Violations: string[] = [];
    const ha2Violations: string[] = [];
    const ha3Violations: string[] = [];
    const ha4Violations: string[] = [];
    const ha5Violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      await navigateToManifestEntry(page, entry, fixtures);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        await setThemeClean(page, 'light');

        const res = await page.evaluate(({ id, width }) => {
          const ha1: string[] = [];
          const ha2: string[] = [];
          const ha3: string[] = [];
          const ha4: string[] = [];
          const ha5: string[] = [];

          const isVis = (el: Element | null): el is HTMLElement => {
            if (!el || !(el instanceof HTMLElement)) return false;
            const st = getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const col = document.querySelector<HTMLElement>('.lp-page-column');
          if (!col || !isVis(col)) return { ha1, ha2, ha3, ha4, ha5 };
          const colSt = getComputedStyle(col);
          const colRect = col.getBoundingClientRect();
          const contentLeft = colRect.left + parseFloat(colSt.paddingLeft || '0');
          const contentRight = colRect.right - parseFloat(colSt.paddingRight || '0');
          const contentWidth = contentRight - contentLeft;

          // HA1: Header title and description left edge = content-left (+/-1px) & text-align start/left
          const header = col.querySelector<HTMLElement>('.lp-page-header');
          if (header && isVis(header)) {
            const title = header.querySelector<HTMLElement>('.lp-page-header-title, h1');
            const desc = header.querySelector<HTMLElement>('.lp-page-description');
            const main = header.querySelector<HTMLElement>('.lp-page-header-main');
            if (title && isVis(title)) {
              const tr = title.getBoundingClientRect();
              const tst = getComputedStyle(title);
              if (Math.abs(tr.left - contentLeft) > 1.5) {
                ha1.push(`${id}@${width}: header title left=${tr.left.toFixed(1)} != contentLeft=${contentLeft.toFixed(1)}`);
              }
              if (tst.textAlign !== 'start' && tst.textAlign !== 'left') {
                ha1.push(`${id}@${width}: header title textAlign=${tst.textAlign}`);
              }
            }
            if (desc && isVis(desc)) {
              const dr = desc.getBoundingClientRect();
              const dst = getComputedStyle(desc);
              if (Math.abs(dr.left - contentLeft) > 1.5) {
                ha1.push(`${id}@${width}: header desc left=${dr.left.toFixed(1)} != contentLeft=${contentLeft.toFixed(1)}`);
              }
              if (dst.textAlign !== 'start' && dst.textAlign !== 'left') {
                ha1.push(`${id}@${width}: header desc textAlign=${dst.textAlign}`);
              }
            }
            if (main && isVis(main) && width < 480) {
              const mr = main.getBoundingClientRect();
              if (Math.abs(mr.width - contentWidth) > 2) {
                ha1.push(`${id}@${width}: .lp-page-header-main width=${mr.width.toFixed(1)} != contentWidth=${contentWidth.toFixed(1)}`);
              }
            }
          }

          // HA2 & HA3: Every visible List and its Items
          const lists = Array.from(col.querySelectorAll<HTMLElement>('.lp-list')).filter(isVis);
          for (const list of lists) {
            // Skip gallery sample containers that intentionally sit inside bordered demo frames
            if (list.closest('#gallery-state-matrix, .lp-gallery-overlay-sample')) continue;
            const listRect = list.getBoundingClientRect();
            const listSt = getComputedStyle(list);
            const listLeft = listRect.left + parseFloat(listSt.paddingLeft || '0');
            const listRight = listRect.right - parseFloat(listSt.paddingRight || '0');
            const items = Array.from(list.children).filter((c) => c.classList.contains('lp-item') && isVis(c)) as HTMLElement[];

            const trailingRights: number[] = [];
            for (const item of items) {
              const title = item.querySelector<HTMLElement>('.lp-item-title');
              if (title && isVis(title)) {
                const tr = title.getBoundingClientRect();
                if (Math.abs(tr.left - listLeft) > 1.5) {
                  ha3.push(`${id}@${width}: item title "${(title.textContent || '').trim().slice(0, 24)}" left=${tr.left.toFixed(1)} != listLeft=${listLeft.toFixed(1)}`);
                }
              }
              const sub = item.querySelector<HTMLElement>('.lp-item-subtitle');
              if (sub && isVis(sub)) {
                const sr = sub.getBoundingClientRect();
                if (Math.abs(sr.left - listLeft) > 1.5) {
                  ha3.push(`${id}@${width}: item subtitle left=${sr.left.toFixed(1)} != listLeft=${listLeft.toFixed(1)}`);
                }
              }
              const trailing = item.querySelector<HTMLElement>('.lp-item-status, .lp-item-trailing');
              if (trailing && isVis(trailing)) {
                const tr = trailing.getBoundingClientRect();
                trailingRights.push(tr.right);
                if (width >= 480 && Math.abs(tr.right - listRight) > 1.5) {
                  ha2.push(`${id}@${width}: item trailing right=${tr.right.toFixed(1)} != listRight=${listRight.toFixed(1)}`);
                }
              }
            }
            if (trailingRights.length >= 2) {
              const minR = Math.min(...trailingRights);
              const maxR = Math.max(...trailingRights);
              if (maxR - minR > 1.5) {
                ha2.push(`${id}@${width}: list trailing rights inconsistent (min=${minR.toFixed(1)}, max=${maxR.toFixed(1)}, delta=${(maxR - minR).toFixed(1)})`);
              }
            }
          }

          // HA4: Sibling controls — page-level ActionBar vertical full-width stack & Pager equal-width buttons on one row
          const pageBars = Array.from(col.querySelectorAll<HTMLElement>('.lp-action-bar-page')).filter(isVis);
          for (const bar of pageBars) {
            if (bar.closest('#gallery-state-matrix')) continue;
            const barRect = bar.getBoundingClientRect();
            const btns = Array.from(bar.querySelectorAll<HTMLElement>(':scope > .lp-btn:not(.lp-btn-text), :scope > a.lp-btn:not(.lp-btn-text)')).filter(isVis);
            let prevBottom = -Infinity;
            const widths: number[] = [];
            for (const btn of btns) {
              const br = btn.getBoundingClientRect();
              widths.push(br.width);
              if (Math.abs(br.width - barRect.width) > 2) {
                ha4.push(`${id}@${width}: page ActionBar btn "${(btn.textContent || '').trim()}" width=${br.width.toFixed(1)} != container=${barRect.width.toFixed(1)}`);
              }
              if (prevBottom > -Infinity && br.top < prevBottom - 1) {
                ha4.push(`${id}@${width}: page ActionBar btn "${(btn.textContent || '').trim()}" not stacked vertically (top=${br.top.toFixed(1)} < prevBottom=${prevBottom.toFixed(1)})`);
              }
              prevBottom = br.bottom;
            }
            if (widths.length >= 2 && Math.max(...widths) - Math.min(...widths) > 1.5) {
              ha4.push(`${id}@${width}: page ActionBar sibling widths unequal (${widths.map((w) => w.toFixed(1)).join(', ')})`);
            }
          }

          const pagers = Array.from(col.querySelectorAll<HTMLElement>('[data-c="Pagination"], .lp-entries-pagination')).filter(isVis);
          for (const pager of pagers) {
            const btns = Array.from(pager.querySelectorAll<HTMLElement>('button')).filter(isVis);
            if (btns.length === 2) {
              const r0 = btns[0].getBoundingClientRect();
              const r1 = btns[1].getBoundingClientRect();
              if (Math.abs(r0.width - r1.width) > 1.5) {
                ha4.push(`${id}@${width}: pager buttons unequal width (${r0.width.toFixed(1)} vs ${r1.width.toFixed(1)})`);
              }
              if (Math.abs(r0.top - r1.top) > 2) {
                ha4.push(`${id}@${width}: pager buttons stacked instead of single row (top ${r0.top.toFixed(1)} vs ${r1.top.toFixed(1)})`);
              }
            }
          }

          // HA5: No primary content/item/header/QR left edge in (contentLeft, contentLeft + 8px)
          const candidates = Array.from(
            col.querySelectorAll<HTMLElement>(
              '.lp-page-header-title, .lp-page-description, .lp-section-title, .lp-subsection-title, .lp-item-title, #account-totp-qr'
            )
          ).filter(isVis);
          for (const el of candidates) {
            if (el.closest('#gallery-state-matrix, .lp-gallery-overlay-sample, .lp-gallery-panel-sample')) continue;
            const er = el.getBoundingClientRect();
            const dx = er.left - contentLeft;
            if (dx > 1.5 && dx < 8.5) {
              ha5.push(`${id}@${width}: element ${el.tagName.toLowerCase()}.${el.className.split(' ')[0] || el.id} left offset dx=${dx.toFixed(1)}px in forbidden (1.5, 8.5)px band`);
            }
          }

          return { ha1, ha2, ha3, ha4, ha5 };
        }, { id: entry.id, width: vp.width });

        ha1Violations.push(...res.ha1);
        ha2Violations.push(...res.ha2);
        ha3Violations.push(...res.ha3);
        ha4Violations.push(...res.ha4);
        ha5Violations.push(...res.ha5);
      }
    }

    expect(ha1Violations, `K36 (HA1) Header alignment violations:\n${ha1Violations.slice(0, 20).join('\n')}`).toEqual([]);
    expect(ha2Violations, `K37 (HA2) Trailing-cluster right-edge violations:\n${ha2Violations.slice(0, 20).join('\n')}`).toEqual([]);
    expect(ha3Violations, `K38 (HA3) Item content-edge alignment violations:\n${ha3Violations.slice(0, 20).join('\n')}`).toEqual([]);
    expect(ha4Violations, `K39 (HA4) Sibling control & page ActionBar violations:\n${ha4Violations.slice(0, 20).join('\n')}`).toEqual([]);
    expect(ha5Violations, `K40 (HA5) Forbidden (0,8px) left-edge offset violations:\n${ha5Violations.slice(0, 20).join('\n')}`).toEqual([]);
  });

  test('K41: Pager contract (hidden on 1 page, single-row 44x44 icon buttons, compact/regular tabular summary)', async ({ page }) => {
    const violations: string[] = [];

    // Check paged manifest states (first, middle, last)
    const pagedIds = ['entries-paged-first', 'entries-paged-middle', 'entries-paged-last'];
    for (const pid of pagedIds) {
      const entry = WP17_MANIFEST.find((m) => m.id === pid);
      if (!entry) {
        violations.push(`Missing manifest entry ${pid}`);
        continue;
      }
      await navigateToManifestEntry(page, entry, fixtures);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        await setThemeClean(page, 'light');

        const check = await page.evaluate(({ pid: stateId, width }) => {
          const errs: string[] = [];
          const pager = document.querySelector<HTMLElement>('[data-c="Pagination"], #entries-pagination');
          if (!pager) return [`${stateId}@${width}: pager missing`];
          const pst = getComputedStyle(pager);
          if (pst.display === 'none') return [`${stateId}@${width}: pager hidden on multi-page list`];

          const prev = pager.querySelector<HTMLButtonElement>('#btn-entries-prev');
          const next = pager.querySelector<HTMLButtonElement>('#btn-entries-next');
          const summary = pager.querySelector<HTMLElement>('#entries-page-summary');
          if (!prev || !next || !summary) return [`${stateId}@${width}: pager missing prev/next/summary`];

          const pr = prev.getBoundingClientRect();
          const nr = next.getBoundingClientRect();
          const sr = summary.getBoundingClientRect();

          if (Math.abs(pr.width - 44) > 1 || Math.abs(pr.height - 44) > 1) {
            errs.push(`${stateId}@${width}: prev btn size ${pr.width}x${pr.height} != 44x44`);
          }
          if (Math.abs(nr.width - 44) > 1 || Math.abs(nr.height - 44) > 1) {
            errs.push(`${stateId}@${width}: next btn size ${nr.width}x${nr.height} != 44x44`);
          }
          if (prev.getAttribute('aria-label') !== 'Previous page') {
            errs.push(`${stateId}@${width}: prev aria-label="${prev.getAttribute('aria-label')}" != "Previous page"`);
          }
          if (next.getAttribute('aria-label') !== 'Next page') {
            errs.push(`${stateId}@${width}: next aria-label="${next.getAttribute('aria-label')}" != "Next page"`);
          }
          if (Math.abs(pr.top - nr.top) > 2 || Math.abs(sr.top + sr.height / 2 - (pr.top + pr.height / 2)) > 4) {
            errs.push(`${stateId}@${width}: pager not single centered row`);
          }

          if (stateId === 'entries-paged-first' && (!prev.disabled || next.disabled)) {
            errs.push(`${stateId}@${width}: first page disabled state wrong (prev=${prev.disabled}, next=${next.disabled})`);
          }
          if (stateId === 'entries-paged-middle' && (prev.disabled || next.disabled)) {
            errs.push(`${stateId}@${width}: middle page disabled state wrong (prev=${prev.disabled}, next=${next.disabled})`);
          }
          if (stateId === 'entries-paged-last' && (prev.disabled || !next.disabled)) {
            errs.push(`${stateId}@${width}: last page disabled state wrong (prev=${prev.disabled}, next=${next.disabled})`);
          }

          // Visible summary text check
          const regularSpan = summary.querySelector<HTMLElement>('.lp-entries-pagination-regular');
          const compactSpan = summary.querySelector<HTMLElement>('.lp-entries-pagination-compact');
          const sst = getComputedStyle(summary);
          if (!sst.fontVariantNumeric.includes('tabular-nums')) {
            errs.push(`${stateId}@${width}: summary missing tabular-nums (${sst.fontVariantNumeric})`);
          }
          if (width < 480) {
            const visibleTxt = compactSpan && getComputedStyle(compactSpan).display !== 'none'
              ? (compactSpan.textContent || '').trim()
              : (summary.textContent || '').trim();
            if (!/^\d+\s*\/\s*\d+$/.test(visibleTxt)) {
              errs.push(`${stateId}@${width}: compact summary "${visibleTxt}" does not match "N / M"`);
            }
          } else {
            const visibleTxt = regularSpan && getComputedStyle(regularSpan).display !== 'none'
              ? (regularSpan.textContent || '').trim()
              : (summary.textContent || '').trim();
            if (!/^Page \d+ of \d+ · \d+ total$/.test(visibleTxt)) {
              errs.push(`${stateId}@${width}: regular summary "${visibleTxt}" does not match "Page X of Y · N total"`);
            }
          }
          return errs;
        }, { pid, width: vp.width });

        violations.push(...check);
      }
    }

    // Check single-page hides pager (filter to a unique search query matching 0-1 entry)
    const firstEntry = WP17_MANIFEST.find((m) => m.id === 'entries')!;
    await navigateToManifestEntry(page, firstEntry, fixtures);
    await page.fill('#entries-search', 'nonexistent-single-page-probe-xyz');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const hiddenOnSingle = await page.evaluate(() => {
      const p = document.querySelector<HTMLElement>('#entries-pagination');
      return !p || p.hasAttribute('hidden') || getComputedStyle(p).display === 'none';
    });
    if (!hiddenOnSingle) {
      violations.push('entries (<=1 page): pager still visible when pages <= 1');
    }

    expect(violations, `K41 Pager violations:\n${violations.join('\n')}`).toEqual([]);
  });

  test('K42: Credential contract (icon copy in header, no footer, sunken value panel, TOTP QR quiet-zone box)', async ({ page }) => {
    const violations: string[] = [];
    const credStates = ['account-recovery-codes', 'account-token-created', 'account-totp'];

    for (const cid of credStates) {
      const entry = WP17_MANIFEST.find((m) => m.id === cid)!;
      await navigateToManifestEntry(page, entry, fixtures);

      for (const vp of [{ width: 320, height: 640 }, { width: 1280, height: 800 }]) {
        await page.setViewportSize(vp);
        await setThemeClean(page, 'light');

        const check = await page.evaluate(({ stateId, width }) => {
          const errs: string[] = [];
          const col = document.querySelector<HTMLElement>('.lp-page-column');
          const colSt = col ? getComputedStyle(col) : null;
          const contentLeft = col && colSt ? col.getBoundingClientRect().left + parseFloat(colSt.paddingLeft || '0') : 0;

          const creds = Array.from(document.querySelectorAll<HTMLElement>('[data-c="Credential"]')).filter((el) => {
            const st = getComputedStyle(el);
            return st.display !== 'none' && el.getBoundingClientRect().height > 0;
          });
          if (creds.length === 0) return [`${stateId}@${width}: no visible Credential`];

          for (const cred of creds) {
            const variant = cred.getAttribute('data-variant');
            if (cred.querySelector('.lp-credential-footer')) {
              errs.push(`${stateId}@${width}: forbidden .lp-credential-footer still present`);
            }
            const header = cred.querySelector<HTMLElement>('.lp-credential-header');
            const copyBtn = header?.querySelector<HTMLButtonElement>('button[data-credential-copy]');
            if (!header || !copyBtn) {
              errs.push(`${stateId}@${width}: copy icon button missing from .lp-credential-header`);
            } else {
              const br = copyBtn.getBoundingClientRect();
              if (Math.abs(br.width - 44) > 1 || Math.abs(br.height - 44) > 1) {
                errs.push(`${stateId}@${width}: copy icon button size ${br.width}x${br.height} != 44x44`);
              }
              const expectedLabel = variant === 'list' ? 'Copy all' : 'Copy';
              if (copyBtn.getAttribute('aria-label') !== expectedLabel) {
                errs.push(`${stateId}@${width}: copy aria-label="${copyBtn.getAttribute('aria-label')}" != "${expectedLabel}"`);
              }
              if ((copyBtn.textContent || '').trim().length > 0) {
                errs.push(`${stateId}@${width}: copy button is not icon-only (text="${copyBtn.textContent?.trim()}")`);
              }
            }

            const surface = cred.querySelector<HTMLElement>('.lp-credential-surface');
            const panel = cred.querySelector<HTMLElement>('.lp-credential-panel');
            if (!surface || !panel) {
              errs.push(`${stateId}@${width}: missing .lp-credential-panel inside .lp-credential-surface`);
            } else {
              const sst = getComputedStyle(surface);
              const pst = getComputedStyle(panel);
              if (pst.backgroundColor === sst.backgroundColor || pst.backgroundColor === 'rgba(0, 0, 0, 0)') {
                errs.push(`${stateId}@${width}: .lp-credential-panel background (${pst.backgroundColor}) not distinct sunken surface from (${sst.backgroundColor})`);
              }
              if (parseFloat(pst.borderRadius) !== 8) {
                errs.push(`${stateId}@${width}: .lp-credential-panel radius=${pst.borderRadius} != 8px`);
              }
              if (parseFloat(pst.paddingTop) < 15 || parseFloat(pst.paddingLeft) < 15) {
                errs.push(`${stateId}@${width}: .lp-credential-panel padding=${pst.paddingTop}/${pst.paddingLeft} < 16px`);
              }
              if (parseFloat(pst.borderTopWidth) !== 0) {
                errs.push(`${stateId}@${width}: .lp-credential-panel has border (${pst.borderTopWidth})`);
              }
            }

            if (variant === 'list') {
              const list = cred.querySelector<HTMLElement>('.lp-credential-list');
              if (list) {
                const cols = getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length;
                const expectedCols = width < 480 ? 1 : 2;
                if (cols !== expectedCols) {
                  errs.push(`${stateId}@${width}: recovery codes cols=${cols} != ${expectedCols}`);
                }
              }
              const cell = cred.querySelector<HTMLElement>('.lp-credential-cell');
              if (cell) {
                const cst = getComputedStyle(cell);
                if (cst.userSelect !== 'all') {
                  errs.push(`${stateId}@${width}: recovery code cell user-select=${cst.userSelect} != all`);
                }
              }
            }
          }

          if (stateId === 'account-totp') {
            const qr = document.getElementById('account-totp-qr');
            if (qr) {
              const qrRect = qr.getBoundingClientRect();
              const qrSt = getComputedStyle(qr);
              if (Math.abs(qrRect.left - contentLeft) > 1.5) {
                errs.push(`${stateId}@${width}: #account-totp-qr left=${qrRect.left.toFixed(1)} != contentLeft=${contentLeft.toFixed(1)}`);
              }
              if (parseFloat(qrSt.paddingLeft) < 15 || parseFloat(qrSt.paddingTop) < 15) {
                errs.push(`${stateId}@${width}: #account-totp-qr quiet-zone padding=${qrSt.paddingTop}/${qrSt.paddingLeft} < 16px`);
              }
            }
          }
          return errs;
        }, { stateId: cid, width: vp.width });

        violations.push(...check);
      }

      // Verify Copy button click swaps icon to 'check' and announces 'Copied'
      const copyBtn = page.locator('[data-c="Credential"]:visible button[data-credential-copy]').first();
      if (await copyBtn.count() > 0) {
        await copyBtn.click();
        await page.waitForTimeout(150);
        const swapState = await page.evaluate(() => {
          const btn = document.querySelector<HTMLButtonElement>('[data-c="Credential"]:not(.lp-is-hidden) button[data-credential-copy]');
          const live = document.querySelector<HTMLElement>('[data-c="Credential"]:not(.lp-is-hidden) [aria-live="polite"]');
          return {
            icon: btn?.getAttribute('data-icon-name') || '',
            liveText: (live?.textContent || '').trim(),
          };
        });
        if (swapState.icon !== 'check') {
          violations.push(`${cid}: clicking copy did not swap icon to "check" (got "${swapState.icon}")`);
        }
        if (swapState.liveText !== 'Copied') {
          violations.push(`${cid}: clicking copy did not announce "Copied" (got "${swapState.liveText}")`);
        }
      }
    }

    expect(violations, `K42 Credential violations:\n${violations.join('\n')}`).toEqual([]);
  });

  test('K43: L7 scanner --self-test detects planted literal in every property class', async () => {
    const out = execSync('node scripts/design-audit --self-test', {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const parsed = JSON.parse(out);
    expect(parsed.passed).toBe(true);
    for (const [cat, count] of Object.entries(parsed.detected as Record<string, number>)) {
      expect(count, `L7 self-test missed category "${cat}"`).toBeGreaterThan(0);
    }
  });
});
