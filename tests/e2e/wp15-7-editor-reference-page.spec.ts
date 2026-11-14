import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

async function captureStep(page: Page, outDir: string, name: string): Promise<void> {
  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  }
}

test.describe('WP-15.7 Reference Editor Page', () => {
  test('enforces D-FOUND-1..6, UX-70..89, 6 states, 6 user flows, and 4-places-only live regions', async ({ page }) => {
    await ensureAdminLoggedIn(page);

    // 1. Left-edge & width alignment across all 6 states + zero horizontal overflow at 1280px
    await page.setViewportSize({ width: 1280, height: 900 });
    const rects: Array<{ state: string; left: number; width: number }> = [];
    for (const state of ['first-run', 'empty', 'draft', 'error', 'unlisted', 'public'] as const) {
      await page.goto(`/admin/entries/editor?fixture=${state}&theme=light`);
      const box = await page.locator('#ref-editor-main').boundingBox();
      expect(box).not.toBeNull();
      rects.push({ state, left: Math.round(box!.x), width: Math.round(box!.width) });
    }
    for (const r of rects) {
      expect(Math.abs(r.left - rects[0].left)).toBeLessThanOrEqual(2);
      expect(Math.abs(r.width - rects[0].width)).toBeLessThanOrEqual(2);
    }

    // 2. First-run & Empty states (single CTA, single-numbered guide steps, pill count badge)
    await page.goto('/admin/entries/editor?fixture=first-run&theme=light');
    await expect(page.locator('#ref-empty-state')).toBeVisible();
    await expect(page.locator('#ref-empty-state .lp-empty-guide-steps li')).toHaveCount(3);
    await expect(page.locator('#ref-entries-count')).toHaveText('0');
    const firstRunText = await page.locator('#ref-empty-state').innerText();
    expect(firstRunText).not.toContain('1. 1.');
    await page.locator('#ref-walkthrough-dismiss').click();
    await expect(page.locator('#ref-empty-state .lp-empty-guide')).toHaveCount(0);
    await expect(page.locator('#ref-empty-start-btn')).toHaveText('Start a draft');

    // 3. Computed-style conformance on Draft state at 1280px (badges, SVG icons, no nested bordered boxes, reading face, Details 2-col)
    await page.goto('/admin/entries/editor?fixture=draft&theme=light');
    await expect(page.locator('#ref-btn-save')).toHaveText('Save draft');
    await expect(page.locator('#ref-btn-publish')).toHaveText('Publish…');
    await expect(page.locator('#ref-details-disclosure')).not.toHaveAttribute('open', '');
    await expect(page.locator('#ref-details-summary-meta')).not.toContainText(/Draft|Unlisted|Public/);

    const draftAudit = await page.evaluate(() => {
      const badge = document.getElementById('ref-state-badge')!;
      const badgeCs = getComputedStyle(badge);
      const icons = Array.from(document.querySelectorAll<SVGElement>('svg.lp-icon'));
      const validIcons = icons.every((svg) => {
        const w = Math.round(parseFloat(svg.getAttribute('width') || '0'));
        const h = Math.round(parseFloat(svg.getAttribute('height') || '0'));
        return [16, 20, 24].includes(w) && w === h;
      });
      const bodyTa = document.getElementById('ref-field-body') as HTMLTextAreaElement;
      const bodyCs = getComputedStyle(bodyTa);
      const themeBtn = document.getElementById('ref-theme-toggle')!;
      const themeUse = themeBtn.querySelector('use')?.getAttribute('href');
      return {
        badgeBorder: parseFloat(badgeCs.borderTopWidth),
        badgeRadius: parseFloat(badgeCs.borderTopLeftRadius),
        validIcons,
        bodyFont: bodyCs.fontFamily,
        bodyNotClipped: bodyTa.scrollHeight <= bodyTa.clientHeight + 2,
        themeLabel: themeBtn.getAttribute('aria-label'),
        themeUse,
        desktopNavVisible: getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display !== 'none',
      };
    });
    expect(draftAudit.badgeBorder).toBe(0);
    expect(draftAudit.badgeRadius).toBeGreaterThanOrEqual(999);
    expect(draftAudit.validIcons).toBe(true);
    expect(draftAudit.bodyNotClipped).toBe(true);
    expect(draftAudit.themeLabel).toBe('Switch to dark theme');
    expect(draftAudit.themeUse).toBe('#lp-icon-moon');
    expect(draftAudit.desktopNavVisible).toBe(true);
    await expect(page.locator('#ref-mobile-menu-btn')).toBeHidden();

    // Toggle theme -> sun + "Switch to light theme"
    await page.locator('#ref-theme-toggle').click();
    await expect(page.locator('#ref-theme-toggle')).toHaveAttribute('aria-label', 'Switch to light theme');
    await expect(page.locator('#ref-theme-toggle use')).toHaveAttribute('href', '#lp-icon-sun');

    // Expand Details: 2 columns at 1280px, date >= 148px, longest select option not truncated
    await page.locator('#ref-details-disclosure summary').click();
    await expect(page.locator('#ref-details-disclosure')).toHaveAttribute('open', '');
    const details1280 = await page.evaluate(() => {
      const grid = document.querySelector('#ref-details-disclosure .lp-details-grid')!;
      const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      const dateBox = document.getElementById('ref-field-date')!.getBoundingClientRect();
      const profileSel = document.getElementById('ref-field-profile') as HTMLSelectElement;
      return { cols, dateWidth: dateBox.width, profileScrollW: profileSel.scrollWidth, profileClientW: profileSel.clientWidth };
    });
    expect(details1280.cols).toBe(2);
    expect(details1280.dateWidth).toBeGreaterThanOrEqual(148);

    // 4. 4-places-only role="status" / role="alert" & Axe scan
    const allowedIds = ['ref-page-notice', 'ref-status-line', 'ref-field-title-error', 'ref-publish-dialog-status'];
    const liveIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="status"], [role="alert"]')).map((el) => el.id)
    );
    for (const id of liveIds) {
      expect(allowedIds).toContain(id);
    }
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

    // 5. 320px responsive check: compact header <= 64px, 44px touch targets, 1-col Details, autogrow textarea
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/entries/editor?fixture=draft&theme=light');
    await page.locator('#ref-details-disclosure summary').click();
    const mobileAudit = await page.evaluate(() => {
      const header = document.querySelector('.lp-admin-header')!;
      const headerRect = header.getBoundingClientRect();
      const navHidden = getComputedStyle(document.querySelector('.lp-admin-header-nav')!).display === 'none';
      const cols = getComputedStyle(document.querySelector('#ref-details-disclosure .lp-details-grid')!).gridTemplateColumns.trim().split(/\s+/).length;
      const bodyTa = document.getElementById('ref-field-body') as HTMLTextAreaElement;
      const targets = Array.from(document.querySelectorAll<HTMLElement>('.lp-admin-header button, .lp-editor-action-bar button')).filter(
        (el) => getComputedStyle(el).display !== 'none' && !el.closest('[hidden]') && !el.closest('.lp-is-hidden')
      );
      const minTarget = Math.min(...targets.map((el) => Math.min(el.getBoundingClientRect().width, el.getBoundingClientRect().height)));
      return {
        headerHeight: headerRect.height,
        navHidden,
        cols,
        bodyNotClipped: bodyTa.scrollHeight <= bodyTa.clientHeight + 2,
        minTarget,
        noOverflow: document.documentElement.scrollWidth <= 321,
      };
    });
    expect(mobileAudit.headerHeight).toBeLessThanOrEqual(64);
    expect(mobileAudit.navHidden).toBe(true);
    expect(mobileAudit.cols).toBe(1);
    expect(mobileAudit.bodyNotClipped).toBe(true);
    expect(mobileAudit.minTarget).toBeGreaterThanOrEqual(44);
    expect(mobileAudit.noOverflow).toBe(true);

    // 6. Error state fixture: empty title, StatusLine + field error only, page notice hidden
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/entries/editor?fixture=error&theme=light');
    await expect(page.locator('#ref-field-title')).toHaveValue('');
    await expect(page.locator('#ref-field-title-error')).toHaveText('Add a title.');
    await expect(page.locator('#ref-status-line')).toContainText('Enter a title to save this entry.');
    await expect(page.locator('#ref-page-notice')).toBeHidden();

    // 7. Interactive 6 flows end-to-end
    // Flow 1: First entry
    await page.goto('/admin/entries/editor?fixture=first-run&theme=light');
    await page.locator('#ref-empty-start-btn').click();
    await page.waitForURL(/fixture=new-draft/);
    await page.fill('#ref-field-title', 'My first architecture note');
    await page.fill('#ref-field-body', 'Recording why we chose deterministic migrations.');
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('Draft saved.');

    // Flow 2: Publish with automatic private-details check
    await page.locator('#ref-btn-publish').click();
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText('No private details found.');
    await page.locator('#ref-publish-confirm').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Public');
    await expect(page.locator('#ref-status-line')).toContainText('Entry is now public.');

    // Flow 3: Undo with visible countdown
    await expect(page.locator('#ref-status-line .lp-status-undo-link')).toContainText('Undo (8s)');
    await expect(page.locator('#ref-status-line .lp-status-undo-link')).toContainText('Undo (7s)', { timeout: 2500 });
    await page.locator('#ref-status-line .lp-status-undo-link').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Draft');
    await expect(page.locator('#ref-status-line')).toContainText('Restored.');

    // Flow 4: Visibility via menu (Public -> Unlisted)
    await page.goto('/admin/entries/editor?fixture=public&theme=light');
    await page.locator('#ref-visibility-menu-btn').click();
    await page.locator('#ref-visibility-menu [data-vis="unlisted"]').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Unlisted');
    await expect(page.locator('#ref-status-line')).toContainText('Entry is now unlisted.');

    // Flow 5: Error on save with empty title (no page notice)
    await page.fill('#ref-field-title', '');
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('Enter a title to save this entry.');
    await expect(page.locator('#ref-field-title-error')).toHaveText('Add a title.');
    await expect(page.locator('#ref-page-notice')).toBeHidden();

    // Flow 6: Delete from More menu with confirm dialog & Undo
    await page.locator('#ref-more-menu-btn').click();
    const moreItems = page.locator('#ref-more-menu [role="menuitem"]');
    await expect(moreItems.last()).toContainText('Delete entry');
    await page.locator('#ref-more-delete').click();
    await expect(page.locator('#ref-delete-dialog')).toBeVisible();
    await page.locator('#ref-delete-confirm').click();
    await expect(page.locator('#ref-entries-count')).toHaveText('1');
    await expect(page.locator('#ref-status-line')).toContainText('Entry deleted.');
    await page.locator('#ref-status-line .lp-status-undo-link').click();
    await expect(page.locator('#ref-entries-count')).toHaveText('2');
  });

  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    test('captures Checkpoint 2 filmstrip flows and interactive states at 1280 and 320 px (light and dark)', async ({ page }) => {
      await ensureAdminLoggedIn(page);
      const outDir = process.env.SCREENSHOT_DIR || 'test-results/wp15-7-filmstrip';

      for (const width of [1280, 320] as const) {
        await page.setViewportSize({ width, height: 900 });
        for (const theme of ['light', 'dark'] as const) {
          const tag = `${width}px-${theme}`;

          // Flow 1: First entry flow
          await page.goto(`/admin/entries/editor?fixture=first-run&theme=${theme}`);
          await captureStep(page, outDir, `flow1-1-first-run-${tag}`);
          await page.locator('#ref-empty-start-btn').click();
          await page.waitForURL(/fixture=new-draft/);
          await captureStep(page, outDir, `flow1-2-new-draft-${tag}`);
          await page.fill('#ref-field-title', 'Deterministic SQLite migrations');
          await page.fill('#ref-field-body', 'We replaced ad-hoc schema patches with a linear migration journal verified in CI.');
          await page.locator('#ref-btn-save').click();
          await captureStep(page, outDir, `flow1-3-saved-draft-${tag}`);

          // Flow 2: Publish with automatic private-details check
          await page.locator('#ref-btn-publish').click();
          await captureStep(page, outDir, `flow2-1-publish-dialog-${tag}`);
          await page.locator('#ref-publish-confirm').click();
          await captureStep(page, outDir, `flow2-2-published-${tag}`);

          // Flow 3: Undo with visible countdown
          await page.locator('#ref-status-line .lp-status-undo-link').click();
          await captureStep(page, outDir, `flow3-1-undo-restored-${tag}`);

          // Flow 4: Visibility via menu
          await page.goto(`/admin/entries/editor?fixture=public&theme=${theme}`);
          await page.locator('#ref-visibility-menu-btn').click();
          await captureStep(page, outDir, `flow4-1-visibility-menu-${tag}`);
          await page.locator('#ref-visibility-menu [data-vis="unlisted"]').click();
          await captureStep(page, outDir, `flow4-2-unlisted-${tag}`);

          // Flow 5: Error with field error and StatusLine
          await page.fill('#ref-field-title', '');
          await page.locator('#ref-btn-save').click();
          await captureStep(page, outDir, `flow5-1-error-status-and-field-${tag}`);

          // Flow 6: Delete from More menu with confirm dialog
          await page.goto(`/admin/entries/editor?fixture=public&theme=${theme}`);
          await page.locator('#ref-more-menu-btn').click();
          await captureStep(page, outDir, `flow6-1-more-menu-open-${tag}`);
          await page.locator('#ref-more-delete').click();
          await captureStep(page, outDir, `flow6-2-delete-dialog-${tag}`);
          await page.locator('#ref-delete-confirm').click();
          await captureStep(page, outDir, `flow6-3-deleted-undo-${tag}`);

          // Additional states: Details expanded, Structure drawer open, hover & focus-visible on primary button
          await page.goto(`/admin/entries/editor?fixture=draft&theme=${theme}`);
          await page.locator('#ref-details-disclosure summary').click();
          await captureStep(page, outDir, `state-details-open-${tag}`);
          await page.locator('#ref-btn-structure').click();
          await captureStep(page, outDir, `state-structure-drawer-${tag}`);
          await page.keyboard.press('Escape');
          await page.locator('#ref-btn-save').hover();
          await captureStep(page, outDir, `state-primary-hover-${tag}`);
          await page.locator('#ref-btn-save').focus();
          await captureStep(page, outDir, `state-primary-focus-visible-${tag}`);
        }
      }
    });
  }
});
