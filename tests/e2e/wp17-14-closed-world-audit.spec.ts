import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  WP17_MANIFEST,
  MANIFEST_UNIQUE_ROUTES,
  seedManifestFixtures,
  navigateToManifestEntry,
  type ManifestEntry,
  type PageArchetype,
} from './wp17-manifest.js';

/**
 * WP-17.14 Generic Closed-World Design Audit (K22–K27).
 * STRICT RULE: NO check may hard-code a specific route or sample name.
 * Every check iterates WP17_MANIFEST generically.
 */

const VALID_ARCHETYPES = new Set<PageArchetype>(['form', 'list', 'detail', 'review', 'dashboard']);

/** D2 Relation -> Expected box gap in px (S1=4, S2=8, S3=16, S4=24, S5=40). */
const D2_RELATIONS: Record<string, { tier: string; px: number }> = {
  'page-title->description': { tier: 'S1', px: 4 },
  'page-header->content': { tier: 'S4', px: 24 },
  'tabs->content': { tier: 'S3', px: 16 },
  'section->section': { tier: 'S5', px: 40 },
  'section->page-action-bar': { tier: 'S5', px: 40 },
  'heading->first': { tier: 'S3', px: 16 },
  'field->field': { tier: 'S3', px: 16 },
  'label->control': { tier: 'S2', px: 8 },
  'control->helper': { tier: 'S2', px: 8 },
  'sibling->action-group': { tier: 'S4', px: 24 },
  'consequence->action-bar': { tier: 'S2', px: 8 },
  'action-bar->feedback': { tier: 'S3', px: 16 },
  'subsection->subsection': { tier: 'S4', px: 24 },
  'item-row->item-row': { tier: 'S1', px: 4 },
  'item-content->action-bar': { tier: 'S3', px: 16 },
  'item-segments': { tier: 'S3', px: 16 },
  'def-row->def-row': { tier: 'S3', px: 16 },
  'def-label->def-value': { tier: 'S1', px: 4 },
  'credential-inner': { tier: 'S3', px: 16 },
  'credential-cell->credential-cell': { tier: 'S2', px: 8 },
  'helper->credential': { tier: 'S3', px: 16 },
  'choice->choice': { tier: 'S2', px: 8 },
  'state-panel->items': { tier: 'S4', px: 24 },
  'state-headline->meta': { tier: 'S2', px: 8 },
  'state-meta->action-bar': { tier: 'S4', px: 24 },
};

function parseRgb(rgb: string): [number, number, number] | null {
  const m = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const c = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

test.describe('WP-17.14 Generic Closed-World Audit (K22–K27)', () => {
  test('K22 & K27: Closed-world adjacency audit across 100% of WP17_MANIFEST (0 unclassified pairs, <=1px drift, uniform per viewport)', async ({ page }) => {
    test.setTimeout(240_000);
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);

    const auditedIds = new Set<string>();
    const auditedRoutes = new Set<string>();
    const unclassified: string[] = [];
    const driftViolations: string[] = [];
    const relationGapsByViewport: Record<string, Record<string, Set<number>>> = {};
    const countsByRelation: Record<string, number> = {};

    const viewports = [
      { width: 320, height: 800 },
      { width: 1280, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      const vpKey = `${vp.width}px`;
      relationGapsByViewport[vpKey] = {};

      for (const entry of WP17_MANIFEST) {
        auditedIds.add(entry.id);
        auditedRoutes.add(entry.route);
        if (!entry.checkIds.includes('K22')) continue;

        await navigateToManifestEntry(page, entry, fixtures);

        const res = await page.evaluate((relMap) => {
          const isVisible = (el: Element) => {
            if (el.hasAttribute('hidden')) return false;
            if (el.classList.contains('lp-is-hidden') || el.classList.contains('lp-sr-only')) return false;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const tagOf = (el: Element): string => {
            const dc = el.getAttribute('data-c') || '';
            const dp = el.getAttribute('data-purpose') || '';
            const dr = el.getAttribute('data-rel') || '';
            if (dc) return `${dc}${dp ? `[${dp}]` : ''}`;
            if (el.classList.contains('lp-action-bar-group')) return 'ActionGroup';
            if (el.classList.contains('lp-page-sections')) return 'PageSections';
            if (el.classList.contains('lp-item-content')) return 'ItemContent';
            if (el.classList.contains('lp-item-actions')) return 'ItemActions';
            if (el.classList.contains('lp-list-def-row')) return 'DefRow';
            if (el.classList.contains('lp-credential-header')) return 'CredHeader';
            if (el.classList.contains('lp-credential-panel') || el.classList.contains('lp-credential-list') || el.classList.contains('lp-credential-single')) return 'CredBody';
            if (dp) return `${el.tagName.toLowerCase()}[${dp}]`;
            if (dr) return `${el.tagName.toLowerCase()}[rel=${dr}]`;
            if (/^H[1-6]$/.test(el.tagName)) return 'Heading';
            return el.tagName.toLowerCase();
          };

          const classify = (parent: Element, a: Element, b: Element): string | null => {
            const ac = a.getAttribute('data-c') || '';
            const bc = b.getAttribute('data-c') || '';
            const ap = a.getAttribute('data-purpose') || '';
            const bp = b.getAttribute('data-purpose') || '';
            const aIsHeading = /^H[1-6]$/.test(a.tagName) || ac === 'SectionHeader' || ap === 'title' && (a.classList.contains('lp-form-section-title') || a.classList.contains('lp-subsection-title'));
            const bIsActionGroup = b.classList.contains('lp-action-bar-group') || bc === 'ActionBar';
            const aIsActionGroup = a.classList.contains('lp-action-bar-group') || ac === 'ActionBar';

            if (ac === 'PageHeader') return 'page-header->content';
            if (parent.classList.contains('lp-page-header-main')) return 'page-title->description';
            if (ac === 'Tabs') return 'tabs->content';
            if (ac === 'FormSection' && bc === 'FormSection') return 'section->section';
            if (ac === 'FormSection' && bIsActionGroup) return 'section->page-action-bar';
            if (ac === 'Subsection' && bc === 'Subsection') return 'subsection->subsection';
            if (parent.classList.contains('lp-action-bar-group') && ap === 'consequence') return 'consequence->action-bar';
            if (parent.classList.contains('lp-credential-list')) return 'credential-cell->credential-cell';
            if (parent.getAttribute('data-c') === 'Credential') return 'helper->credential';
            if (parent.classList.contains('lp-choice-list')) return 'choice->choice';
            if (parent.classList.contains('lp-page-sections')) return 'section->section';
            if (parent.getAttribute('data-c') === 'Field') {
              if (a.classList.contains('lp-field-label')) return 'label->control';
              if (b.classList.contains('lp-field-help') || b.classList.contains('lp-field-error')) return 'control->helper';
            }
            if (parent.classList.contains('lp-item-has-actions') && a.classList.contains('lp-item-content') && b.classList.contains('lp-item-actions')) {
              return 'item-content->action-bar';
            }
            if (parent.classList.contains('lp-item-content') || (parent.getAttribute('data-c') === 'Item' && !parent.classList.contains('lp-item-has-actions'))) {
              if (!b.classList.contains('lp-item-actions')) return 'item-row->item-row';
            }
            if (parent.getAttribute('data-variant') === 'definition' && a.classList.contains('lp-list-def-row') && b.classList.contains('lp-list-def-row')) {
              return 'def-row->def-row';
            }
            if (parent.classList.contains('lp-list-def-row') && a.tagName === 'DT' && b.tagName === 'DD') {
              return 'def-label->def-value';
            }
            if (parent.classList.contains('lp-item-segments')) return 'item-segments';
            if (parent.classList.contains('lp-credential-surface')) return 'credential-inner';
            if (aIsHeading) return 'heading->first';
            if (aIsActionGroup && (bc === 'Notice' || bc === 'Credential' || bc === 'StatusLine' || b.classList.contains('lp-status-line') || b.classList.contains('lp-notice'))) {
              return 'action-bar->feedback';
            }
            if (bIsActionGroup) return 'sibling->action-group';
            if (ac === 'Field' && bc === 'Field') return 'field->field';
            if (a.id === 'audit-state-headline' && b.id === 'audit-last-checked') return 'state-headline->meta';
            if (parent.id === 'audit-conflicts-section') return 'state-meta->action-bar';
            if (parent.id === 'audit-contradictions-panel') return 'state-panel->items';
            // Form / stack of sections or decision bar + section
            if (parent.classList.contains('lp-gap-section')) return 'section->section';
            if (parent.classList.contains('lp-gap-group')) return 'sibling->action-group';
            if (parent.classList.contains('lp-gap-related')) return 'field->field';
            if (parent.classList.contains('lp-gap-tight')) return 'label->control';
            if (parent.classList.contains('lp-entries-toolbar') || parent.classList.contains('lp-filter-bar') || parent.querySelector('[data-c="Field"]')) return 'field->field';
            return null;
          };

          const root = document.querySelector('main .lp-page-column') || document.querySelector('main');
          if (!root) return { pairs: [], unclassified: [] };

          const containers = [root, ...Array.from(root.querySelectorAll('section, form, div, dl'))].filter((el) => {
            if (!isVisible(el)) return false;
            if (el.closest('[data-c="List"][data-variant="plain"] > [data-c="Item"] .lp-item-claims-grid')) return false;
            if (el.classList.contains('lp-list-plain') || el.classList.contains('lp-list-interactive')) return false;
            if (el.classList.contains('lp-action-bar') || el.classList.contains('lp-tabs') || el.classList.contains('lp-item-meta')) return false;
            const cs = getComputedStyle(el);
            return cs.display === 'flex' && cs.flexDirection === 'column' || cs.display === 'grid';
          });

          const pairs: Array<{ rel: string; gap: number; detail: string }> = [];
          const bad: string[] = [];

          for (const container of containers) {
            const kids = Array.from(container.children).filter(
              (c) => isVisible(c) && !c.classList.contains('lp-item-chevron-only') && !c.classList.contains('lp-item-row-link')
            );
            for (let i = 0; i < kids.length - 1; i++) {
              const a = kids[i];
              const b = kids[i + 1];
              const ra = a.getBoundingClientRect();
              const rb = b.getBoundingClientRect();
              // Only vertically adjacent siblings (not side-by-side in a 2-col grid row)
              if (rb.top < ra.bottom - 1) continue;
              const gap = Math.round(rb.top - ra.bottom);
              const rel = classify(container, a, b);
              if (!rel || !relMap[rel]) {
                bad.push(`${tagOf(a)} -> ${tagOf(b)} (gap=${gap}px in ${tagOf(container)})`);
              } else {
                pairs.push({ rel, gap, detail: `${tagOf(a)} -> ${tagOf(b)}` });
              }
            }
          }
          return { pairs, unclassified: bad };
        }, D2_RELATIONS);

        for (const u of res.unclassified) {
          unclassified.push(`[${entry.id} ${vpKey}] ${u}`);
        }
        for (const p of res.pairs) {
          countsByRelation[p.rel] = (countsByRelation[p.rel] || 0) + 1;
          if (!relationGapsByViewport[vpKey][p.rel]) relationGapsByViewport[vpKey][p.rel] = new Set();
          relationGapsByViewport[vpKey][p.rel].add(p.gap);
          const expected = D2_RELATIONS[p.rel].px;
          if (Math.abs(p.gap - expected) > 1) {
            driftViolations.push(`[${entry.id} ${vpKey}] ${p.rel} (${p.detail}): measured ${p.gap}px != expected ${expected}px (${D2_RELATIONS[p.rel].tier})`);
          }
        }
      }
    }

    // K27 Coverage check: 100% of manifest entries & unique routes
    expect(auditedIds.size).toBe(WP17_MANIFEST.length);
    expect(auditedRoutes.size).toBe(MANIFEST_UNIQUE_ROUTES.length);

    const summaryTable = Object.entries(countsByRelation).map(([rel, count]) => ({
      relation: rel,
      tier: D2_RELATIONS[rel]?.tier,
      expectedPx: D2_RELATIONS[rel]?.px,
      gaps320: Array.from(relationGapsByViewport['320px'][rel] || []),
      gaps1280: Array.from(relationGapsByViewport['1280px'][rel] || []),
      count,
    }));
    console.log('=== WP-17.14 K22/K27 CLOSED-WORLD ADJACENCY & COVERAGE ===\n' + JSON.stringify({
      routesCovered: `${auditedRoutes.size}/${MANIFEST_UNIQUE_ROUTES.length}`,
      statesCovered: `${auditedIds.size}/${WP17_MANIFEST.length}`,
      totalPairsMeasured: Object.values(countsByRelation).reduce((a, b) => a + b, 0),
      unclassifiedCount: unclassified.length,
      driftViolationCount: driftViolations.length,
      relations: summaryTable,
    }, null, 2));

    expect(unclassified).toEqual([]);
    expect(driftViolations).toEqual([]);
  });

  test('K23: Archetype slot order & data-archetype declaration across 100% of WP17_MANIFEST', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 900 });

    const countsByArchetype: Record<string, number> = {};
    const violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      if (!entry.checkIds.includes('K23')) continue;
      await navigateToManifestEntry(page, entry, fixtures);

      const check = await page.evaluate((expectedArch) => {
        const col = document.querySelector('main .lp-page-column') || document.querySelector('main [data-archetype]');
        const arch = col?.getAttribute('data-archetype') || '';
        const issues: string[] = [];
        if (!arch) {
          issues.push(`missing data-archetype (expected "${expectedArch}")`);
        } else if (arch !== expectedArch) {
          issues.push(`data-archetype="${arch}" != expected "${expectedArch}"`);
        }

        const header = col?.querySelector('[data-c="PageHeader"]');
        if (!header) issues.push('missing PageHeader');

        if (expectedArch === 'detail' && col && header) {
          const back = header.querySelector('.lp-back-link, .lp-page-header-back');
          if (!back) issues.push('detail archetype missing BackLink in header');
          const defLists = Array.from(col.querySelectorAll('[data-c="List"][data-variant="definition"]'));
          if (defLists.length > 1) issues.push(`detail archetype has ${defLists.length} definition lists (max 1 without >=3-row groups)`);
          const actionBar = col.querySelector('[data-c="ActionBar"]');
          if (actionBar && defLists[0]) {
            const abTop = actionBar.getBoundingClientRect().top;
            const dlTop = defLists[0].getBoundingClientRect().top;
            if (abTop > dlTop) issues.push('detail archetype Decision ActionBar appears below definition list instead of directly under header');
          }
        }
        return { arch, issues };
      }, entry.archetype);

      countsByArchetype[entry.archetype] = (countsByArchetype[entry.archetype] || 0) + 1;
      for (const iss of check.issues) violations.push(`[${entry.id}] ${iss}`);
    }

    console.log('=== WP-17.14 K23 ARCHETYPE CENSUS ===', JSON.stringify({ countsByArchetype, violations }));
    expect(Object.keys(countsByArchetype).length).toBeGreaterThanOrEqual(4);
    expect(violations).toEqual([]);
  });

  test('K24: Item internals (S1 rows, S3 to ActionBar, S3 padding) and chevron on every navigable Item across manifest', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);

    let itemsMeasured = 0;
    let navigableChecked = 0;
    const violations: string[] = [];

    for (const vp of [{ width: 320, height: 800 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(vp);
      for (const entry of WP17_MANIFEST) {
        if (!entry.checkIds.includes('K24')) continue;
        await navigateToManifestEntry(page, entry, fixtures);

        const res = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('main [data-c="Item"]')).filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          });
          const issues: string[] = [];
          let navCount = 0;

          for (const item of items) {
            const cs = getComputedStyle(item);
            const pt = Math.round(parseFloat(cs.paddingTop));
            const pb = Math.round(parseFloat(cs.paddingBottom));
            // Allow first/last absorbed padding (0) or S3 (16px)
            if (pt !== 0 && Math.abs(pt - 16) > 1) issues.push(`item padding-top=${pt}px (expected 16px S3 or 0 absorbed)`);
            if (pb !== 0 && Math.abs(pb - 16) > 1) issues.push(`item padding-bottom=${pb}px (expected 16px S3 or 0 absorbed)`);

            // Check S3 (16px) from last content row to ActionBar
            const content = item.querySelector('.lp-item-content');
            const actions = item.querySelector('.lp-item-actions');
            if (content && actions) {
              const gap = Math.round(actions.getBoundingClientRect().top - content.getBoundingClientRect().bottom);
              if (Math.abs(gap - 16) > 1) {
                issues.push(`item content->ActionBar gap=${gap}px (expected 16px S3)`);
              }
            }

            // Check S1 (4px) between vertically stacked internal rows inside .lp-item-content
            const rowHost = content || item;
            const visibleRows = Array.from(rowHost.children).filter((c) => {
              if (c.classList.contains('lp-item-actions') || c.classList.contains('lp-item-row-link') || c.classList.contains('lp-item-chevron-only')) return false;
              const r = c.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });
            for (let i = 0; i < visibleRows.length - 1; i++) {
              const ra = visibleRows[i].getBoundingClientRect();
              const rb = visibleRows[i + 1].getBoundingClientRect();
              if (rb.top < ra.bottom - 1) continue; // side-by-side in row 1
              const rowGap = Math.round(rb.top - ra.bottom);
              if (Math.abs(rowGap - 4) > 1) {
                issues.push(`item internal row gap=${rowGap}px between ${visibleRows[i].className} and ${visibleRows[i + 1].className} (expected 4px S1)`);
              }
            }

            // D6: Navigable Item affordance (chevron visible + no link-styled title)
            const isNav = item.tagName === 'A' || Boolean(item.querySelector('a.lp-item-row-link, a.lp-item-chevron, a.lp-item-title-link'));
            if (isNav) {
              navCount++;
              const chev = item.querySelector('.lp-item-chevron');
              const chevVisible = chev ? chev.getBoundingClientRect().width > 0 && chev.getBoundingClientRect().height > 0 : false;
              if (!chevVisible) {
                issues.push(`navigable Item missing visible trailing chevron`);
              }
              if (item.querySelector('a.lp-item-title-link')) {
                issues.push(`navigable Item relies on link-styled title (.lp-item-title-link) instead of whole-row hit target`);
              }
            }
          }
          return { count: items.length, navCount, issues };
        });

        itemsMeasured += res.count;
        navigableChecked += res.navCount;
        for (const iss of res.issues) violations.push(`[${entry.id} ${vp.width}px] ${iss}`);
      }
    }

    console.log('=== WP-17.14 K24 ITEM INTERNALS & AFFORDANCE ===', JSON.stringify({ itemsMeasured, navigableChecked, violations }));
    expect(itemsMeasured).toBeGreaterThan(0);
    expect(navigableChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test('K25: Interaction conventions (D5) — tonal hover/active direction, unified unclipped focus ring, distinct disabled Choice', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);
    const galleryEntries = WP17_MANIFEST.filter((e) => e.checkIds.includes('K25'));
    expect(galleryEntries.length).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await navigateToManifestEntry(page, galleryEntries[0], fixtures);

    const violations: string[] = [];
    const results: Record<string, unknown> = {};

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme-switching', 'true');
        document.documentElement.setAttribute('data-theme', t);
        void document.documentElement.offsetHeight;
        document.documentElement.removeAttribute('data-theme-switching');
      }, theme);
      const data = await page.evaluate(() => {
        const root = document.querySelector('#gallery-state-matrix');
        if (!root) return null;

        const bgOf = (sel: string) => {
          const el = root.querySelector(sel);
          return el ? getComputedStyle(el).backgroundColor : '';
        };
        const colorOf = (sel: string) => {
          const el = root.querySelector(sel);
          return el ? getComputedStyle(el).color : '';
        };
        const focusOf = (sel: string) => {
          const el = root.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const clipParent = el.closest('.lp-tabs[role="tablist"]');
          let clipped = false;
          if (clipParent) {
            const pr = clipParent.getBoundingClientRect();
            clipped = r.top - pr.top < 3 || pr.bottom - r.bottom < 3;
          }
          return {
            outlineWidth: parseFloat(cs.outlineWidth),
            outlineOffset: parseFloat(cs.outlineOffset),
            outlineColor: cs.outlineColor,
            boxShadow: cs.boxShadow,
            borderRadius: parseFloat(cs.borderRadius),
            clipped,
          };
        };

        return {
          primaryDefault: bgOf('[data-state-group="Button"] .lp-btn-primary:not(.lp-state-hover):not(.lp-state-active):not(.lp-state-focus):not(:disabled):not([aria-busy])'),
          primaryHover: bgOf('[data-state-group="Button"] .lp-btn-primary.lp-state-hover'),
          primaryActive: bgOf('[data-state-group="Button"] .lp-btn-primary.lp-state-active'),
          primaryHoverOpacity: parseFloat(getComputedStyle(root.querySelector('[data-state-group="Button"] .lp-btn-primary.lp-state-hover')!).opacity),
          secondaryDefault: bgOf('[data-state-group="Button"] .lp-btn-secondary:not(.lp-state-hover):not(.lp-state-active):not(.lp-state-focus):not(:disabled):not([aria-busy])'),
          secondaryHover: bgOf('[data-state-group="Button"] .lp-btn-secondary.lp-state-hover'),
          secondaryActive: bgOf('[data-state-group="Button"] .lp-btn-secondary.lp-state-active'),
          choiceDefaultBg: bgOf('[data-state-group="Choice"] .lp-choice:not(.lp-state-hover):not(.is-selected):not(.lp-state-focus):not(.is-disabled)'),
          choiceHoverBg: bgOf('[data-state-group="Choice"] .lp-choice.lp-state-hover'),
          choiceDisabledBg: bgOf('[data-state-group="Choice"] .lp-choice.is-disabled'),
          choiceDefaultText: colorOf('[data-state-group="Choice"] .lp-choice:not(.lp-state-hover):not(.is-selected):not(.lp-state-focus):not(.is-disabled) .lp-choice-card-title'),
          choiceDisabledText: colorOf('[data-state-group="Choice"] .lp-choice.is-disabled .lp-choice-card-title'),
          itemDefaultBg: bgOf('[data-state-group="Item"] .lp-item:not(.lp-state-hover):not(.lp-state-focus):not(.lp-state-active)'),
          itemHoverBg: (() => {
            const el = root.querySelector('[data-state-group="Item"] .lp-item.lp-state-hover');
            if (!el) return '';
            const beforeBg = getComputedStyle(el, '::before').backgroundColor;
            if (beforeBg && beforeBg !== 'rgba(0, 0, 0, 0)' && beforeBg !== 'transparent') return beforeBg;
            return bgOf('[data-state-group="Item"] .lp-item.lp-state-hover');
          })(),
          itemActiveBg: (() => {
            const el = root.querySelector('[data-state-group="Item"] .lp-item.lp-state-active');
            if (!el) return '';
            const beforeBg = getComputedStyle(el, '::before').backgroundColor;
            if (beforeBg && beforeBg !== 'rgba(0, 0, 0, 0)' && beforeBg !== 'transparent') return beforeBg;
            return bgOf('[data-state-group="Item"] .lp-item.lp-state-active');
          })(),
          focuses: {
            button: focusOf('[data-state-group="Button"] .lp-btn-primary.lp-state-focus'),
            field: focusOf('[data-state-group="Field"] .lp-input.lp-state-focus'),
            choice: focusOf('[data-state-group="Choice"] .lp-choice.lp-state-focus'),
            tab: focusOf('[data-state-group="Tab"] .lp-tab.lp-state-focus'),
            link: focusOf('[data-state-group="Link"] .lp-item-link.lp-state-focus'),
            item: focusOf('[data-state-group="Item"] .lp-item.lp-state-focus'),
          },
        };
      });

      expect(data).not.toBeNull();
      if (!data) continue;

      // Expected direction: light moves darker (delta < 0), dark moves lighter (delta > 0)
      const expectDir = (name: string, aStr: string, bStr: string) => {
        const a = parseRgb(aStr);
        const b = parseRgb(bStr);
        if (!a || !b) {
          violations.push(`[${theme}] ${name}: unparseable rgb (${aStr} -> ${bStr})`);
          return;
        }
        const delta = relativeLuminance(b) - relativeLuminance(a);
        const ok = theme === 'light' ? delta < -0.005 : delta > 0.005;
        if (!ok) {
          violations.push(`[${theme}] ${name}: luminance delta ${delta.toFixed(4)} wrong direction (${aStr} -> ${bStr})`);
        }
      };

      if (data.primaryHoverOpacity < 0.99) {
        violations.push(`[${theme}] primary hover uses opacity (${data.primaryHoverOpacity}) instead of darker/lighter tonal token`);
      }
      expectDir('primary default->hover', data.primaryDefault, data.primaryHover);
      expectDir('primary hover->active', data.primaryHover, data.primaryActive);
      expectDir('secondary default->hover', data.secondaryDefault, data.secondaryHover);
      expectDir('secondary hover->active', data.secondaryHover, data.secondaryActive);
      expectDir('choice default->hover', data.choiceDefaultBg, data.choiceHoverBg);
      expectDir('item hover->active', data.itemHoverBg, data.itemActiveBg);

      // Disabled Choice must have distinct fill AND text from default Choice
      if (data.choiceDisabledBg === data.choiceDefaultBg) {
        violations.push(`[${theme}] disabled Choice background equals default Choice (${data.choiceDisabledBg})`);
      }
      if (data.choiceDisabledText === data.choiceDefaultText) {
        violations.push(`[${theme}] disabled Choice text equals default Choice (${data.choiceDisabledText})`);
      }

      // Unified focus ring geometry across all 6 controls
      for (const [ctrl, f] of Object.entries(data.focuses)) {
        if (!f) {
          violations.push(`[${theme}] missing focus specimen for ${ctrl}`);
          continue;
        }
        const expectedOffset = ctrl === 'tab' ? -2 : 2;
        if (f.outlineWidth !== 2 || f.outlineOffset !== expectedOffset) {
          violations.push(`[${theme}] ${ctrl} focus ring outline=${f.outlineWidth}px offset=${f.outlineOffset}px (expected 2px / ${expectedOffset}px)`);
        }
        if (f.boxShadow && f.boxShadow !== 'none') {
          violations.push(`[${theme}] ${ctrl} focus ring has extra box-shadow (${f.boxShadow})`);
        }
        if (f.borderRadius <= 0) {
          violations.push(`[${theme}] ${ctrl} focus ring has 0-radius square geometry`);
        }
        if (ctrl !== 'tab' && f.clipped) {
          violations.push(`[${theme}] ${ctrl} focus ring is clipped by container overflow`);
        }
      }
      results[theme] = data;
    }

    console.log('=== WP-17.14 K25 INTERACTION CONVENTIONS ===', JSON.stringify({ violations }));
    expect(violations).toEqual([]);
  });

  test('K26: Credential nesting <= 2, Contradictions header/eyebrow/equal-date labels, humanised values (no snake_case)', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureAdminLoggedIn(page);
    const fixtures = await seedManifestFixtures(page);
    await page.setViewportSize({ width: 1280, height: 900 });

    let credentialsChecked = 0;
    let conflictsChecked = 0;
    let textNodesChecked = 0;
    const violations: string[] = [];

    for (const entry of WP17_MANIFEST) {
      if (!entry.checkIds.includes('K26')) continue;
      await navigateToManifestEntry(page, entry, fixtures);

      const res = await page.evaluate(() => {
        const issues: string[] = [];
        let credCount = 0;
        let confCount = 0;
        let txtCount = 0;

        // 1. Credential nesting depth <= 2 & no separate Notice sibling
        const creds = Array.from(document.querySelectorAll('main [data-c="Credential"]')).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        for (const cred of creds) {
          credCount++;
          if (cred.querySelector('[data-c="Notice"]')) {
            issues.push('Credential still renders separate Notice box instead of internal header line');
          }
          const borderedDepth = (el: Element, depth: number): number => {
            const cs = getComputedStyle(el);
            const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
            const nextDepth = hasBorder ? depth + 1 : depth;
            let maxD = nextDepth;
            for (const c of Array.from(el.children)) {
              const r = c.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              maxD = Math.max(maxD, borderedDepth(c, nextDepth));
            }
            return maxD;
          };
          const depth = borderedDepth(cred, 0);
          if (depth > 2) {
            issues.push(`Credential bordered container nesting depth=${depth} (> 2)`);
          }
        }

        // 2. Contradictions item header & eyebrows (generic: any [data-conflict-row])
        const conflictRows = Array.from(document.querySelectorAll('[data-conflict-row]'));
        for (const row of conflictRows) {
          confCount++;
          const titleText = (row.querySelector('.lp-item-title')?.textContent || '').trim();
          if (titleText === 'Possible contradiction') {
            issues.push('Contradiction item still uses generic title "Possible contradiction"');
          }
          if (!/\d+%\s+likely conflict/i.test(titleText)) {
            issues.push(`Contradiction item header "${titleText}" does not match "{N}% likely conflict"`);
          }
          const fromLinks = Array.from(row.querySelectorAll('a')).filter((a) => /^From\s+/i.test((a.textContent || '').trim()));
          if (fromLinks.length > 0) {
            issues.push('Contradiction item still renders separate "From ..." source link');
          }
          const eyebrows = Array.from(row.querySelectorAll('.lp-item-claim-eyebrow')).map((e) => (e.textContent || '').trim());
          if (eyebrows.length === 2) {
            const d0 = eyebrows[0].replace(/^(Older|Newer|Same time)\s*·\s*/i, '').split('·')[0].trim();
            const d1 = eyebrows[1].replace(/^(Older|Newer|Same time)\s*·\s*/i, '').split('·')[0].trim();
            if (d0 && d0 === d1 && (/^Older/i.test(eyebrows[0]) || /^Newer/i.test(eyebrows[0]))) {
              issues.push(`Contradiction equal dates labelled Older/Newer: "${eyebrows[0]}" vs "${eyebrows[1]}"`);
            }
          }
        }

        // 3. No raw snake_case in rendered text outside mono/Credential/code/ids
        const snakeRe = /\b[a-z]+_[a-z]+(?:_[a-z]+)*\b/;
        const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = (node.nodeValue || '').trim();
          if (!text) continue;
          const el = node.parentElement;
          if (!el || el.closest('code, pre, blockquote, [data-c="Credential"], script, style, .lp-sr-only, .lp-is-hidden, [hidden]')) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          txtCount++;
          const m = snakeRe.exec(text);
          if (m) {
            issues.push(`raw snake_case "${m[0]}" in rendered text: "${text.slice(0, 60)}"`);
          }
        }

        return { credCount, confCount, txtCount, issues };
      });

      credentialsChecked += res.credCount;
      conflictsChecked += res.confCount;
      textNodesChecked += res.txtCount;
      for (const iss of res.issues) violations.push(`[${entry.id}] ${iss}`);
    }

    console.log('=== WP-17.14 K26 CREDENTIAL / CONTRADICTIONS / HUMANISED ===', JSON.stringify({ credentialsChecked, conflictsChecked, textNodesChecked, violations }));
    expect(credentialsChecked).toBeGreaterThan(0);
    expect(textNodesChecked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
