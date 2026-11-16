import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureAdminLoggedIn } from './helpers.js';

interface DCompBudgetFile {
  version: number;
  note: string;
  budgets: {
    iconViolations: number;
    stackingViolations: number;
    overlayViolations: number;
    actionBarViolations: number;
    choiceViolations: number;
    verticalRhythmViolations: number;
    pageHeaderViolations: number;
    tabWrapViolations: number;
  };
}

interface ScanMetrics {
  measured: {
    icons: number;
    stackingContainers: number;
    overlays: number;
    actionBars: number;
    choices: number;
    rhythmPairs: number;
    pageHeaders: number;
    tabLists: number;
  };
  violations: {
    icons: number;
    stacking: number;
    overlays: number;
    actionBar: number;
    choice: number;
    verticalRhythm: number;
    pageHeader: number;
    tabs: number;
  };
  details: Record<string, string[]>;
}

const BUDGET_PATH = resolve(process.cwd(), 'docs/audits/dcomp-census-budget.json');

async function scanDCompOnPage(page: Page, vpWidth: number, vpHeight: number, isEditor: boolean): Promise<ScanMetrics> {
  return page.evaluate(({ width, height, editor }) => {
    const measured = {
      icons: 0,
      stackingContainers: 0,
      overlays: 0,
      actionBars: 0,
      choices: 0,
      rhythmPairs: 0,
      pageHeaders: 0,
      tabLists: 0,
    };
    const violations = {
      icons: 0,
      stacking: 0,
      overlays: 0,
      actionBar: 0,
      choice: 0,
      verticalRhythm: 0,
      pageHeader: 0,
      tabs: 0,
    };
    const details: Record<string, string[]> = {
      icons: [],
      stacking: [],
      overlays: [],
      actionBar: [],
      choice: [],
      verticalRhythm: [],
      pageHeader: [],
      tabs: [],
    };

    const isVisible = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };

    // (a) Icons: sprite resolution, close-only rule, distinct toolbar glyphs
    const spriteIds = new Set(
      Array.from(document.querySelectorAll('#lp-icon-sprite symbol')).map((s) => `#${s.id}`)
    );
    const iconUses = Array.from(document.querySelectorAll<SVGUseElement>('svg use'));
    for (const use of iconUses) {
      const btn = use.closest('button, a, [data-icon-name]');
      if (!btn || !isVisible(btn)) continue;
      measured.icons++;
      const href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      if (!href || !spriteIds.has(href)) {
        violations.icons++;
        details.icons.push(`Missing sprite symbol "${href}" on ${btn.tagName.toLowerCase()}`);
        continue;
      }
      const requested = btn.getAttribute('data-icon-name') || btn.getAttribute('data-format');
      if (requested && href !== `#lp-icon-${requested}` && !(requested === 'close' && href === '#lp-icon-x')) {
        violations.icons++;
        details.icons.push(`Icon mismatch: requested "${requested}" resolved to "${href}"`);
      }
      const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      const isCloseBtn =
        label.includes('close') ||
        label.includes('dismiss') ||
        requested === 'close' ||
        requested === 'x' ||
        btn.classList.contains('lp-dismiss-btn');
      if ((href === '#lp-icon-close' || href === '#lp-icon-x') && !isCloseBtn) {
        violations.icons++;
        details.icons.push(`Non-close control "${label || btn.className}" renders close glyph "${href}"`);
      }
    }

    // Check distinct glyphs in editor toolbars
    const toolbars = Array.from(document.querySelectorAll<HTMLElement>('.lp-editor-toolbar, [data-canary-toolbar]'));
    for (const tb of toolbars) {
      if (!isVisible(tb)) continue;
      const seenGlyphs = new Map<string, string>();
      const formatBtns = Array.from(tb.querySelectorAll<HTMLElement>('button[data-format], button[data-command]'));
      for (const fb of formatBtns) {
        if (!isVisible(fb)) continue;
        const u = fb.querySelector('svg use');
        const href = u?.getAttribute('href') || '';
        const name = fb.getAttribute('aria-label') || fb.getAttribute('data-format') || 'btn';
        if (href && seenGlyphs.has(href)) {
          violations.icons++;
          details.icons.push(`Duplicate toolbar glyph "${href}" shared by "${seenGlyphs.get(href)}" and "${name}"`);
        } else if (href) {
          seenGlyphs.set(href, name);
        }
      }
    }

    // (b) Stacking at 320px: siblings inside Item, FormSection, PageHeader, ActionBar, filter groups
    if (width <= 320) {
      const stackTargets = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.lp-item, .lp-list-row, .lp-form-section, .lp-page-header, .lp-action-bar, .lp-filter-bar, .lp-entries-filters'
        )
      );
      for (const container of stackTargets) {
        if (!isVisible(container)) continue;
        measured.stackingContainers++;
        const kids = Array.from(container.children).filter((k): k is HTMLElement => {
          if (!isVisible(k)) return false;
          if (k.classList.contains('lp-tabs') || k.getAttribute('role') === 'tablist') return false;
          if (k.classList.contains('lp-icon') || k.tagName.toLowerCase() === 'svg') return false;
          const cs = getComputedStyle(k);
          return cs.position !== 'fixed' && cs.position !== 'absolute';
        });
        for (let i = 1; i < kids.length; i++) {
          const prev = kids[i - 1].getBoundingClientRect();
          const curr = kids[i].getBoundingClientRect();
          if (curr.top < prev.bottom - 2) {
            violations.stacking++;
            details.stacking.push(
              `Siblings in .${container.className.split(' ').join('.')} share a row at 320px (prev.bottom=${Math.round(prev.bottom)}, curr.top=${Math.round(curr.top)})`
            );
          }
        }
      }
    }

    // (c) Overlays: every open overlay box is inside viewport
    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.lp-popover, .lp-popover-menu, .lp-launcher-panel, .lp-sheet, .lp-dialog, .lp-panel, [role="dialog"], [role="menu"]'
      )
    );
    for (const ov of overlays) {
      if (ov.hasAttribute('hidden') || !isVisible(ov)) continue;
      measured.overlays++;
      const r = ov.getBoundingClientRect();
      if (r.left < -1 || r.top < -1 || r.right > width + 1 || r.bottom > height + 1) {
        violations.overlays++;
        details.overlays.push(
          `Overlay #${ov.id || ov.className} outside viewport (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)} vs ${width}x${height})`
        );
      }
    }

    // (d) ActionBar: order (primary, secondary, text), equal widths (160..240 >=640, full width <640), left aligned
    const actionBars = Array.from(document.querySelectorAll<HTMLElement>('.lp-action-bar'));
    for (const bar of actionBars) {
      if (!isVisible(bar)) continue;
      measured.actionBars++;
      const btns = Array.from(bar.querySelectorAll<HTMLElement>('button, a.lp-btn')).filter(isVisible);
      if (btns.length === 0) continue;
      const roleRank = (el: HTMLElement): number => {
        if (el.classList.contains('lp-btn-primary')) return 0;
        if (el.classList.contains('lp-btn-secondary')) return 1;
        return 2;
      };
      for (let i = 1; i < btns.length; i++) {
        if (roleRank(btns[i]) < roleRank(btns[i - 1])) {
          violations.actionBar++;
          details.actionBar.push(`ActionBar button order wrong: ${btns[i - 1].textContent?.trim()} before ${btns[i].textContent?.trim()}`);
        }
      }
      const barRect = bar.getBoundingClientRect();
      const firstW = Math.round(btns[0].getBoundingClientRect().width);
      for (const b of btns) {
        const br = b.getBoundingClientRect();
        const bw = Math.round(br.width);
        if (Math.abs(bw - firstW) > 2) {
          violations.actionBar++;
          details.actionBar.push(`ActionBar unequal widths: ${bw}px vs ${firstW}px`);
        }
        if (width >= 640) {
          if (bw < 160 || bw > 240) {
            violations.actionBar++;
            details.actionBar.push(`ActionBar button width ${bw}px outside [160, 240] at ${width}px`);
          }
          if (Math.abs(br.left - barRect.left) > 4) {
            violations.actionBar++;
            details.actionBar.push(`ActionBar button not left-aligned (left=${Math.round(br.left)} vs bar=${Math.round(barRect.left)})`);
          }
        } else {
          if (Math.abs(bw - Math.round(barRect.width)) > 4) {
            violations.actionBar++;
            details.actionBar.push(`ActionBar button not full width at 320px (${bw}px vs ${Math.round(barRect.width)}px)`);
          }
        }
      }
    }

    // (e) Choice: no visible native checkbox or radio
    const nativeInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="checkbox"], input[type="radio"]')
    );
    for (const inp of nativeInputs) {
      const r = inp.getBoundingClientRect();
      const cs = getComputedStyle(inp);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      measured.choices++;
      const isVisuallyHidden =
        (r.width <= 2 && r.height <= 2) ||
        parseFloat(cs.opacity) === 0 ||
        cs.clipPath !== 'none' ||
        (cs.clip !== 'auto' && cs.clip !== '');
      if (!isVisuallyHidden) {
        violations.choice++;
        details.choice.push(`Visible native ${inp.type} (${Math.round(r.width)}x${Math.round(r.height)})`);
      }
    }

    // (f) Vertical rhythm: adjacent block pairs in FormSection, PageHeader, ActionBar
    const rhythmChecks: Array<{ el: HTMLElement; pairs: Array<[HTMLElement, HTMLElement, number[]]> }> = [];
    for (const sec of Array.from(document.querySelectorAll<HTMLElement>('.lp-form-section'))) {
      if (!isVisible(sec)) continue;
      const kids = Array.from(sec.children).filter((k): k is HTMLElement => isVisible(k));
      const pairs: Array<[HTMLElement, HTMLElement, number[]]> = [];
      for (let i = 1; i < kids.length; i++) {
        const prev = kids[i - 1];
        const curr = kids[i];
        const expected =
          prev.matches('h2, h3, .lp-form-section-title') && curr.matches('p, .lp-form-section-desc')
            ? [8]
            : curr.classList.contains('lp-action-bar')
              ? [16, 24]
              : [16];
        pairs.push([prev, curr, expected]);
      }
      rhythmChecks.push({ el: sec, pairs });
    }
    for (const ph of Array.from(document.querySelectorAll<HTMLElement>('.lp-page-header'))) {
      if (!isVisible(ph)) continue;
      const kids = Array.from(ph.children).filter((k): k is HTMLElement => isVisible(k));
      const pairs: Array<[HTMLElement, HTMLElement, number[]]> = [];
      for (let i = 1; i < kids.length; i++) {
        if (kids[i].getBoundingClientRect().top < kids[i - 1].getBoundingClientRect().top) continue;
        if (kids[i].classList.contains('lp-page-header-action') && kids[i - 1].tagName === 'H1') continue;
        pairs.push([kids[i - 1], kids[i], [8, 16]]);
      }
      rhythmChecks.push({ el: ph, pairs });
    }
    for (const ab of actionBars) {
      if (!isVisible(ab)) continue;
      const kids = Array.from(ab.children).filter((k): k is HTMLElement => isVisible(k));
      const pairs: Array<[HTMLElement, HTMLElement, number[]]> = [];
      for (let i = 1; i < kids.length; i++) {
        pairs.push([kids[i - 1], kids[i], [8]]);
      }
      rhythmChecks.push({ el: ab, pairs });
    }
    for (const rc of rhythmChecks) {
      for (const [prev, curr, expected] of rc.pairs) {
        measured.rhythmPairs++;
        const gap = Math.round(curr.getBoundingClientRect().top - prev.getBoundingClientRect().bottom);
        const ok = expected.some((e) => Math.abs(gap - e) <= 2);
        if (!ok) {
          violations.verticalRhythm++;
          details.verticalRhythm.push(
            `Rhythm gap ${gap}px between <${prev.tagName.toLowerCase()}> and <${curr.tagName.toLowerCase()}> (expected ${expected.join(' or ')}px)`
          );
        }
      }
    }

    // (g) PageHeader order and 24px title (+ editor title 24px)
    const headers = Array.from(document.querySelectorAll<HTMLElement>('.lp-page-header'));
    for (const ph of headers) {
      if (!isVisible(ph)) continue;
      measured.pageHeaders++;
      const h1 = ph.querySelector<HTMLElement>('h1');
      if (!h1) {
        violations.pageHeader++;
        details.pageHeader.push('PageHeader missing h1');
      } else {
        const fs = Math.round(parseFloat(getComputedStyle(h1).fontSize) || 0);
        if (fs !== 24) {
          violations.pageHeader++;
          details.pageHeader.push(`PageHeader h1 fontSize ${fs}px !== 24px`);
        }
        const desc = ph.querySelector<HTMLElement>('.lp-page-description');
        if (desc && isVisible(desc)) {
          const h1r = h1.getBoundingClientRect();
          const dr = desc.getBoundingClientRect();
          if (dr.top < h1r.bottom - 2) {
            violations.pageHeader++;
            details.pageHeader.push('PageHeader description is not below h1');
          }
        }
      }
    }
    if (editor) {
      const titleInp = document.querySelector<HTMLElement>('.lp-editor-title-input');
      if (titleInp && isVisible(titleInp)) {
        measured.pageHeaders++;
        const fs = Math.round(parseFloat(getComputedStyle(titleInp).fontSize) || 0);
        if (fs !== 24) {
          violations.pageHeader++;
          details.pageHeader.push(`Editor title fontSize ${fs}px !== 24px`);
        }
      }
    }

    // (h) Tabs never wrap at 320px
    if (width <= 320) {
      const tabLists = Array.from(document.querySelectorAll<HTMLElement>('[role="tablist"], .lp-tabs'));
      for (const tl of tabLists) {
        if (!isVisible(tl)) continue;
        measured.tabLists++;
        const tabs = Array.from(tl.querySelectorAll<HTMLElement>('[role="tab"], .lp-tab')).filter(isVisible);
        if (tabs.length > 1) {
          const firstTop = Math.round(tabs[0].getBoundingClientRect().top);
          for (const t of tabs.slice(1)) {
            const top = Math.round(t.getBoundingClientRect().top);
            if (Math.abs(top - firstTop) > 2) {
              violations.tabs++;
              details.tabs.push(`Tab "${t.textContent?.trim()}" wrapped onto a new row (top=${top} vs ${firstTop})`);
            }
          }
        }
        if (tl.scrollWidth > tl.clientWidth + 2) {
          violations.tabs++;
          details.tabs.push(`Tablist overflows horizontally (${tl.scrollWidth} > ${tl.clientWidth})`);
        }
      }
    }

    return { measured, violations, details };
  }, { width: vpWidth, height: vpHeight, editor: isEditor });
}

test.describe('WP-16.C D-COMP Component Contract Census & Canaries', () => {
  test('canaries: every D-COMP check (a)-(h) catches its intentional violation and measures > 0 items', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/_canary');
    const canary320 = await scanDCompOnPage(page, 320, 640, false);

    console.log('=== WP-16.C CANARY REPORT (320px) ===');
    console.log(JSON.stringify(canary320, null, 2));

    expect(canary320.measured.icons).toBeGreaterThan(0);
    expect(canary320.violations.icons).toBeGreaterThan(0);

    expect(canary320.measured.stackingContainers).toBeGreaterThan(0);
    expect(canary320.violations.stacking).toBeGreaterThan(0);

    expect(canary320.measured.overlays).toBeGreaterThan(0);
    expect(canary320.violations.overlays).toBeGreaterThan(0);

    expect(canary320.measured.actionBars).toBeGreaterThan(0);
    expect(canary320.violations.actionBar).toBeGreaterThan(0);

    expect(canary320.measured.choices).toBeGreaterThan(0);
    expect(canary320.violations.choice).toBeGreaterThan(0);

    expect(canary320.measured.rhythmPairs).toBeGreaterThan(0);
    expect(canary320.violations.verticalRhythm).toBeGreaterThan(0);

    expect(canary320.measured.pageHeaders).toBeGreaterThan(0);
    expect(canary320.violations.pageHeader).toBeGreaterThan(0);

    expect(canary320.measured.tabLists).toBeGreaterThan(0);
    expect(canary320.violations.tabs).toBeGreaterThan(0);
  });

  test('D-COMP census across pages, overlays, gallery, and auth x 2 themes x 1280/320px (+ editor 1920px)', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const budgetFile: DCompBudgetFile = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));

    await ensureAdminLoggedIn(page);
    const seededId = await page.evaluate(async () => {
      const res = await fetch('/api/entries?visibility=all&page=1&limit=5', { credentials: 'same-origin' });
      const data = await res.json();
      return data.entries?.[0]?.id ?? null;
    });
    expect(seededId).toBeTruthy();

    const routes = [
      '/admin',
      '/admin/entries',
      `/admin/entries/${encodeURIComponent(seededId)}/history`,
      '/admin/inbox',
      '/admin/audit',
      '/admin/import',
      '/admin/settings/answering',
      '/admin/settings/providers',
      '/admin/entries/new',
      `/admin/entries/${encodeURIComponent(seededId)}`,
      '/admin/_gallery',
    ];
    const editorRoutes = new Set(['/admin/entries/new', `/admin/entries/${encodeURIComponent(seededId)}`]);
    const themes: Array<'light' | 'dark'> = ['light', 'dark'];
    const viewports = [
      { width: 1280, height: 800 },
      { width: 320, height: 640 },
    ];

    const totals: ScanMetrics = {
      measured: {
        icons: 0,
        stackingContainers: 0,
        overlays: 0,
        actionBars: 0,
        choices: 0,
        rhythmPairs: 0,
        pageHeaders: 0,
        tabLists: 0,
      },
      violations: {
        icons: 0,
        stacking: 0,
        overlays: 0,
        actionBar: 0,
        choice: 0,
        verticalRhythm: 0,
        pageHeader: 0,
        tabs: 0,
      },
      details: {
        icons: [],
        stacking: [],
        overlays: [],
        actionBar: [],
        choice: [],
        verticalRhythm: [],
        pageHeader: [],
        tabs: [],
      },
    };

    const accumulate = (m: ScanMetrics) => {
      for (const k of Object.keys(totals.measured) as Array<keyof typeof totals.measured>) {
        totals.measured[k] += m.measured[k];
      }
      for (const k of Object.keys(totals.violations) as Array<keyof typeof totals.violations>) {
        totals.violations[k] += m.violations[k];
        if (m.details[k]?.length && totals.details[k].length < 25) {
          totals.details[k].push(...m.details[k].slice(0, 25 - totals.details[k].length));
        }
      }
    };

    for (const route of routes) {
      const isEd = editorRoutes.has(route);
      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await page.goto(route);
        for (const theme of themes) {
          await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
          accumulate(await scanDCompOnPage(page, vp.width, vp.height, isEd));
        }
      }
    }

    // Editor at 1920x1080
    for (const route of editorRoutes) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route);
      for (const theme of themes) {
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        accumulate(await scanDCompOnPage(page, 1920, 1080, true));
      }
    }

    // Overlays on /admin (launcher, status, account)
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/admin');
      for (const btnId of ['lp-launcher-btn', 'lp-status-popover-btn', 'lp-account-menu-btn']) {
        const btn = page.locator(`#${btnId}`);
        if (await btn.count()) {
          await btn.click();
          accumulate(await scanDCompOnPage(page, vp.width, vp.height, false));
          await page.keyboard.press('Escape');
        }
      }
    }

    console.log('=== WP-16.C D-COMP CENSUS REPORT ===');
    console.log(JSON.stringify({ measured: totals.measured, violations: totals.violations, sampleDetails: totals.details }, null, 2));

    expect(totals.violations.icons, `iconViolations ${totals.violations.icons} > ${budgetFile.budgets.iconViolations}`).toBeLessThanOrEqual(budgetFile.budgets.iconViolations);
    expect(totals.violations.stacking, `stackingViolations ${totals.violations.stacking} > ${budgetFile.budgets.stackingViolations}`).toBeLessThanOrEqual(budgetFile.budgets.stackingViolations);
    expect(totals.violations.overlays, `overlayViolations ${totals.violations.overlays} > ${budgetFile.budgets.overlayViolations}`).toBeLessThanOrEqual(budgetFile.budgets.overlayViolations);
    expect(totals.violations.actionBar, `actionBarViolations ${totals.violations.actionBar} > ${budgetFile.budgets.actionBarViolations}`).toBeLessThanOrEqual(budgetFile.budgets.actionBarViolations);
    expect(totals.violations.choice, `choiceViolations ${totals.violations.choice} > ${budgetFile.budgets.choiceViolations}`).toBeLessThanOrEqual(budgetFile.budgets.choiceViolations);
    expect(totals.violations.verticalRhythm, `verticalRhythmViolations ${totals.violations.verticalRhythm} > ${budgetFile.budgets.verticalRhythmViolations}`).toBeLessThanOrEqual(budgetFile.budgets.verticalRhythmViolations);
    expect(totals.violations.pageHeader, `pageHeaderViolations ${totals.violations.pageHeader} > ${budgetFile.budgets.pageHeaderViolations}`).toBeLessThanOrEqual(budgetFile.budgets.pageHeaderViolations);
    expect(totals.violations.tabs, `tabWrapViolations ${totals.violations.tabs} > ${budgetFile.budgets.tabWrapViolations}`).toBeLessThanOrEqual(budgetFile.budgets.tabWrapViolations);
  });
});
