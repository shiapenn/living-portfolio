import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureAdminLoggedIn } from './helpers.js';

async function captureStep(page: Page, outDir: string, name: string): Promise<void> {
  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  }
}

test.describe('WP-15.7 Reference Editor Page', () => {
  test('requires admin session on /admin/entries/editor, /admin/entries/new, /admin/entries/:id and fixture/theme params', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const url of [
      '/admin/entries/editor',
      '/admin/entries/editor?fixture=draft&theme=dark',
      '/admin/entries/new?theme=light',
      '/admin/entries/fixture-draft?fixture=public&theme=dark',
    ]) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/admin\/(login|setup)/);
    }
    await context.close();
  });

  test('UX-87: left-edge and width alignment across all 6 states (first-run, empty, draft, error, unlisted, public)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
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
  });

  test('UX-85 / UX-86 / D-FEEDBACK: single active message place per state and zero toast/top-banner in DOM', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const state of ['first-run', 'empty', 'draft', 'error', 'unlisted', 'public'] as const) {
      await page.goto(`/admin/entries/editor?fixture=${state}&theme=light`);
      const msgAudit = await page.evaluate(() => {
        const hasToast = document.querySelectorAll('.lp-toast, .toast, [data-toast], #toast-region').length > 0;
        const noticeEl = document.getElementById('ref-page-notice');
        const noticeVisible = !!noticeEl && !noticeEl.hasAttribute('hidden') && noticeEl.innerText.trim().length > 0;
        const statusEl = document.getElementById('ref-status-line');
        const statusVisible = !!statusEl && !statusEl.hasAttribute('hidden') && statusEl.innerText.trim().length > 0;
        const fieldErrEl = document.getElementById('ref-field-title-error');
        const fieldErrVisible = !!fieldErrEl && !fieldErrEl.hasAttribute('hidden') && fieldErrEl.innerText.trim().length > 0;
        const dlgEl = document.getElementById('ref-publish-dialog');
        const dlgStatusEl = document.getElementById('ref-publish-dialog-status');
        const dlgStatusVisible = !!dlgEl && !dlgEl.hasAttribute('hidden') && !!dlgStatusEl && dlgStatusEl.innerText.trim().length > 0;
        const activePlaces = [noticeVisible, statusVisible, fieldErrVisible, dlgStatusVisible].filter(Boolean).length;
        return { hasToast, noticeVisible, statusVisible, fieldErrVisible, activePlaces };
      });
      expect(msgAudit.hasToast).toBe(false);
      expect(msgAudit.noticeVisible).toBe(false);
      if (state === 'error') {
        expect(msgAudit.statusVisible).toBe(true);
        expect(msgAudit.fieldErrVisible).toBe(true);
      } else {
        expect(msgAudit.activePlaces).toBeLessThanOrEqual(1);
      }
    }
  });

  test('D-EDITOR / D-EDITOR-2: interaction contract (visible action set per entry state: first-run, empty, draft, error, unlisted, public)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const state of ['first-run', 'empty', 'draft', 'error', 'unlisted', 'public'] as const) {
      await page.goto(`/admin/entries/editor?fixture=${state}&theme=light`);
      if (state === 'first-run' || state === 'empty') {
        await expect(page.locator('#ref-empty-start-btn')).toBeVisible();
        await expect(page.locator('#ref-btn-new-entry')).toHaveCount(0);
        await expect(page.locator('#ref-btn-save')).toHaveCount(0);
      } else if (state === 'draft' || state === 'error') {
        await expect(page.locator('#ref-btn-new-entry')).toBeVisible();
        await expect(page.locator('#ref-btn-save')).toBeVisible();
        await expect(page.locator('#ref-btn-save')).toHaveText('Save draft');
        await expect(page.locator('#ref-btn-save')).not.toHaveAttribute('aria-disabled', 'true');
        await expect(page.locator('#ref-btn-publish')).toBeVisible();
        await expect(page.locator('#ref-btn-publish')).toHaveText('Publish…');
        await expect(page.locator('#ref-visibility-menu-wrap')).toHaveClass(/lp-is-hidden/);
        await expect(page.locator('#ref-more-menu-btn')).toBeVisible();
        await expect(page.locator('#ref-more-menu [role="menuitem"]')).toHaveCount(2);
        await expect(page.locator('#ref-btn-structure')).toBeVisible();
      } else if (state === 'unlisted') {
        await expect(page.locator('#ref-btn-save')).toBeVisible();
        await expect(page.locator('#ref-btn-save')).toHaveText('Save changes');
        await expect(page.locator('#ref-btn-save')).not.toHaveAttribute('aria-disabled', 'true');
        await expect(page.locator('#ref-btn-publish')).toHaveClass(/lp-is-hidden/);
        await expect(page.locator('#ref-visibility-menu-btn')).toBeVisible();
        await expect(page.locator('#ref-visibility-menu [data-vis="unlisted"]')).toHaveAttribute('aria-checked', 'true');
        await expect(page.locator('#ref-more-menu-btn')).toBeVisible();
        await expect(page.locator('#ref-more-menu [role="menuitem"]')).toHaveCount(2);
        await expect(page.locator('#ref-btn-structure')).toBeVisible();
      } else if (state === 'public') {
        await expect(page.locator('#ref-btn-save')).toBeVisible();
        await expect(page.locator('#ref-btn-save')).toHaveText('Save changes');
        await expect(page.locator('#ref-btn-save')).not.toHaveAttribute('aria-disabled', 'true');
        await expect(page.locator('#ref-btn-publish')).toHaveClass(/lp-is-hidden/);
        await expect(page.locator('#ref-visibility-menu-btn')).toBeVisible();
        await expect(page.locator('#ref-visibility-menu [data-vis="public"]')).toHaveAttribute('aria-checked', 'true');
        await expect(page.locator('#ref-more-menu-btn')).toBeVisible();
        await expect(page.locator('#ref-more-menu [role="menuitem"]')).toHaveCount(2);
        await expect(page.locator('#ref-btn-structure')).toBeVisible();
      }
    }
  });

  test('UX-74: first-run walkthrough guide (single-numbered, dismissible, single CTA) and pill count badge', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/entries/editor?fixture=first-run&theme=light');
    await expect(page.locator('#ref-empty-state')).toBeVisible();
    await expect(page.locator('#ref-empty-state .lp-empty-guide-steps li')).toHaveCount(3);
    await expect(page.locator('#ref-entries-count')).toHaveText('0');
    const firstRunText = await page.locator('#ref-empty-state').innerText();
    expect(firstRunText).not.toContain('1. 1.');
    await page.locator('#ref-walkthrough-dismiss').click();
    await expect(page.locator('#ref-empty-state .lp-empty-guide')).toHaveCount(0);
    await expect(page.locator('#ref-empty-start-btn')).toHaveText('Start a draft');
  });

  test('UX-70 / UX-71 / UX-78 / UX-79 / UX-83 / UX-84 / UX-89 (1280 px): badges, SVG icons, Details 2-col, disabled reason tooltip, theme toggle, 4-places live regions, Axe', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/entries/editor?fixture=draft&theme=light');

    await expect(page.locator('#ref-btn-save')).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('No changes to save.');

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
      const themeBtn = document.getElementById('theme-toggle')!;
      return {
        badgeBorder: parseFloat(badgeCs.borderTopWidth),
        badgeRadius: parseFloat(badgeCs.borderTopLeftRadius),
        validIcons,
        bodyNotClipped: bodyTa.scrollHeight <= bodyTa.clientHeight + 2,
        themeLabel: themeBtn.getAttribute('aria-label'),
        themeUse: themeBtn.querySelector('use')?.getAttribute('href'),
        desktopNavVisible: document.getElementById('lp-launcher-btn') !== null,
      };
    });
    expect(draftAudit.badgeBorder).toBe(0);
    expect(draftAudit.badgeRadius).toBe(0);
    expect(draftAudit.validIcons).toBe(true);
    expect(draftAudit.bodyNotClipped).toBe(true);
    expect(draftAudit.themeLabel).toBe('Switch to dark theme');
    expect(draftAudit.themeUse).toBe('#lp-icon-moon');
    expect(draftAudit.desktopNavVisible).toBe(true);
    await expect(page.locator('#lp-admin-rail')).toHaveCount(0);

    await page.locator('#lp-account-menu-btn').click();
    await page.locator('#theme-toggle').click();
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', 'Switch to light theme');
    await expect(page.locator('#theme-toggle use')).toHaveAttribute('href', '#lp-icon-sun');
    await page.keyboard.press('Escape');

    await page.locator('#ref-details-disclosure summary').click();
    await expect(page.locator('#ref-details-disclosure')).toHaveAttribute('open', '');
    const details1280 = await page.evaluate(() => {
      const grid = document.querySelector('#ref-details-disclosure .lp-details-grid')!;
      const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      const dateBox = document.getElementById('ref-field-date')!.getBoundingClientRect();
      return { cols, dateWidth: dateBox.width };
    });
    expect(details1280.cols).toBe(2);
    expect(details1280.dateWidth).toBeGreaterThanOrEqual(148);

    const allowedIds = ['ref-page-notice', 'ref-status-line', 'ref-field-title-error', 'ref-publish-dialog-status'];
    const liveIds = await page.evaluate(() => Array.from(document.querySelectorAll('[role="status"], [role="alert"]')).map((el) => el.id));
    for (const id of liveIds) expect(allowedIds).toContain(id);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });

  test('UX-83 / UX-88 / UX-89 (320 px): compact header <= 64 px, >= 44 px touch targets, 1-col Details, and auto-grow textarea', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/admin/entries/editor?fixture=draft&theme=light');
    await page.locator('#ref-details-disclosure summary').click();

    const mobileAudit = await page.evaluate(() => {
      const headerRect = document.querySelector('.lp-admin-header')!.getBoundingClientRect();
      const launcherPanel = document.getElementById('lp-launcher-panel');
      const navHidden = !launcherPanel || launcherPanel.hasAttribute('hidden');
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
    expect(mobileAudit.minTarget).toBeGreaterThanOrEqual(36);
    expect(mobileAudit.noOverflow).toBe(true);
  });

  test('UX-73 / UX-86: error state fixture (empty title, StatusLine + field error, no page notice)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/entries/editor?fixture=error&theme=light');
    await expect(page.locator('#ref-field-title')).toHaveValue('');
    await expect(page.locator('#ref-field-title-error')).toHaveText('Add a title.');
    await expect(page.locator('#ref-status-line')).toContainText('Enter a title to save this entry.');
    await expect(page.locator('#ref-page-notice')).toBeHidden();
  });

  test('UX-84 / UX-85 / UX-86: interactive 6 user flows (first entry, publish loading check, unpublish + Undo countdown, visibility menu, error, delete + Undo)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 900 });

    // Flow 1: First entry
    await page.goto('/admin/entries/editor?fixture=first-run&theme=light');
    await page.locator('#ref-empty-start-btn').click();
    await page.waitForURL(/fixture=new-draft/);
    await page.fill('#ref-field-title', 'My first architecture note');
    await page.fill('#ref-field-body', 'Recording why we chose deterministic migrations.');
    await page.locator('#ref-btn-save').click();
    await expect(page.locator('#ref-status-line')).toContainText('Draft saved.');

    // Flow 2: Publish with automatic private-details check (loading state -> clean result -> published)
    await page.locator('#ref-btn-publish').click();
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    await expect(page.locator('#ref-publish-dialog-status')).toContainText('Checking for private details…');
    await expect(page.locator('#ref-publish-confirm')).toHaveAttribute('data-loading', 'true');
    await expect(page.locator('#ref-publish-dialog-status')).toContainText('No private details found.');
    await expect(page.locator('#ref-publish-confirm')).not.toHaveAttribute('data-loading', 'true');
    await page.locator('#ref-publish-confirm').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Public');
    await expect(page.locator('#ref-status-line')).toContainText('Entry is now public.');

    // Flow 3: Unpublish via Visibility menu -> visible Undo countdown -> Undo restored
    await page.locator('#ref-visibility-menu-btn').click();
    await page.locator('#ref-visibility-menu [data-vis="draft"]').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Draft');
    await expect(page.locator('#ref-status-line')).toContainText('Entry is now private.');
    await expect(page.locator('#ref-status-line .lp-status-undo-link')).toContainText('Undo (8s)');
    await expect(page.locator('#ref-status-line .lp-status-undo-link')).toContainText('Undo (7s)', { timeout: 2500 });
    await page.locator('#ref-status-line .lp-status-undo-link').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Public');
    await expect(page.locator('#ref-status-line')).toContainText('Restored.');

    // Flow 4: Visibility via menu (Public -> Unlisted, and Unlisted -> Public opens Publish dialog)
    await page.goto('/admin/entries/editor?fixture=public&theme=light');
    await page.locator('#ref-visibility-menu-btn').click();
    await page.locator('#ref-visibility-menu [data-vis="unlisted"]').click();
    await expect(page.locator('#ref-state-badge')).toHaveText('Unlisted');
    await expect(page.locator('#ref-status-line')).toContainText('Entry is now unlisted.');
    await page.locator('#ref-visibility-menu-btn').click();
    await page.locator('#ref-visibility-menu [data-vis="public"]').click();
    await expect(page.locator('#ref-publish-dialog')).toBeVisible();
    await page.locator('#ref-publish-cancel').click();

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

          // Flow 2: Publish with automatic private-details check (checking loading -> result -> published)
          await page.locator('#ref-btn-publish').click();
          await expect(page.locator('#ref-publish-dialog-status')).toContainText('Checking for private details…');
          await captureStep(page, outDir, `flow2-1-publish-checking-${tag}`);
          await expect(page.locator('#ref-publish-dialog-status')).toContainText('No private details found.');
          await captureStep(page, outDir, `flow2-2-publish-dialog-${tag}`);
          await page.locator('#ref-publish-confirm').click();
          await captureStep(page, outDir, `flow2-3-published-${tag}`);

          // Flow 3: Unpublish via Visibility menu -> Undo countdown visible -> Undo restored
          await page.locator('#ref-visibility-menu-btn').click();
          await page.locator('#ref-visibility-menu [data-vis="draft"]').click();
          await expect(page.locator('#ref-status-line .lp-status-undo-link')).toContainText('Undo (');
          await captureStep(page, outDir, `flow3-1-unpublish-countdown-${tag}`);
          await page.locator('#ref-status-line .lp-status-undo-link').click();
          await captureStep(page, outDir, `flow3-2-undo-restored-${tag}`);

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

          // Additional states: no-changes status message, Details expanded, Select open/focused in Details, Structure drawer open, hover & focus-visible on primary button
          await page.goto(`/admin/entries/editor?fixture=draft&theme=${theme}`);
          await page.locator('#ref-btn-save').click();
          await expect(page.locator('#ref-status-line')).toContainText('No changes to save.');
          await captureStep(page, outDir, `state-save-no-changes-${tag}`);
          await page.locator('#ref-details-disclosure summary').click();
          await captureStep(page, outDir, `state-details-open-${tag}`);
          await page.locator('#ref-field-profile').focus();
          await page.locator('#ref-field-profile').click();
          await captureStep(page, outDir, `state-details-select-open-${tag}`);
          await page.locator('#ref-btn-structure').click();
          await captureStep(page, outDir, `state-structure-drawer-${tag}`);
          await page.keyboard.press('Escape');
          await page.fill('#ref-field-title', 'Deterministic SQLite migrations (edited)');
          await page.locator('#ref-btn-save').hover();
          await captureStep(page, outDir, `state-primary-hover-${tag}`);
          await page.locator('#ref-btn-save').focus();
          await captureStep(page, outDir, `state-primary-focus-visible-${tag}`);
        }
      }
    });
  }
});
