import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LUCIDE_ICON_NAMES,
  renderIcon,
  renderIconSprite,
  renderFoundationsGalleryPage,
} from './foundations-gallery.js';
import {
  renderBadge,
  renderButton,
  renderChip,
  renderIconButton,
} from './index.js';
import {
  renderDisclosure,
  renderEmptyState,
  renderPageNotice,
  renderStatusLine,
} from '../components/index.js';
import { createWebApp } from '../app.js';

describe('WP-15.3a Design Foundations (D-FOUND-1..6)', () => {
  it('registers docs/design/foundations.md with D-FOUND-1 through D-FOUND-6, Lucide ISC licence, and theme toggle rule', () => {
    const docPath = resolve(process.cwd(), '../../docs/design/foundations.md');
    expect(existsSync(docPath)).toBe(true);
    const content = readFileSync(docPath, 'utf8');
    for (const rule of [
      'D-FOUND-1',
      'D-FOUND-2',
      'D-FOUND-3',
      'D-FOUND-4',
      'D-FOUND-5',
      'D-FOUND-6',
      'ISC',
      'Switch to dark theme',
      'Switch to light theme',
    ]) {
      expect(content).toContain(rule);
    }
  });

  it('renders self-hosted 24px SVG icon sprite with full inventory and icons at 16, 20, and 24 px only (D-FOUND-1)', () => {
    const sprite = renderIconSprite();
    expect(sprite).toContain('<svg id="lp-icon-sprite"');
    expect(sprite).toContain('viewBox="0 0 24 24"');
    for (const iconName of LUCIDE_ICON_NAMES) {
      expect(sprite).toContain(`id="lp-icon-${iconName}"`);
    }

    const icon16 = renderIcon({ name: 'x', size: 16 });
    expect(icon16).toContain('width="16" height="16"');
    expect(icon16).toContain('href="#lp-icon-x"');
  });

  it('enforces ghost/outlined icon buttons with accessible label and tooltip, loading button spinner, and theme toggle icons (D-FOUND-1, D-FOUND-5)', () => {
    const ghost = renderIconButton({
      ariaLabel: 'Dismiss notice',
      icon: 'x',
      variant: 'quiet',
      iconSize: 16,
    });
    expect(ghost).toContain('aria-label="Dismiss notice"');
    expect(ghost).toContain('title="Dismiss notice"');
    expect(ghost).toContain('lp-icon-btn');
    expect(ghost).not.toContain('×');

    const outlined = renderIconButton({
      ariaLabel: 'Switch to dark theme',
      icon: 'moon',
      variant: 'secondary',
      iconSize: 20,
    });
    expect(outlined).toContain('lp-icon-btn');
    expect(outlined).toContain('#lp-icon-moon');

    const loadingBtn = renderButton({
      label: 'Saving…',
      variant: 'primary',
      loading: true,
    });
    expect(loadingBtn).toContain('aria-busy="true"');
    expect(loadingBtn).toContain('lp-icon-spin');
    expect(loadingBtn).toContain('#lp-icon-loader');
  });

  it('renders Badge as borderless pill and Chip as interactive pill with border (D-FOUND-2)', () => {
    const badge = renderBadge({ label: 'Public', tone: 'ok' });
    expect(badge).toContain('lp-badge');
    expect(badge).toContain('<span');

    const chip = renderChip({ label: 'Architecture', state: 'confirmed', interactive: true });
    expect(chip).toContain('<button');
    expect(chip).toContain('lp-chip');
  });

  it('renders Notice with tone icon + link-style action + ghost X dismiss, StatusLine with tone icon + inline Undo, and Disclosure with rotating chevron (D-FOUND-6)', () => {
    const notice = renderPageNotice({
      id: 'n1',
      tone: 'warn',
      message: 'Session expires soon.',
      actionLabel: 'Extend session',
      dismissible: true,
    });
    expect(notice).toContain('#lp-icon-alert-triangle');
    expect(notice).toContain('lp-notice-action-link');
    expect(notice).toContain('#lp-icon-x');
    expect(notice).not.toContain('×');

    const status = renderStatusLine({
      id: 's1',
      tone: 'ok',
      message: 'Saved draft.',
      undoLabel: 'Undo',
      undoSeconds: 8,
    });
    expect(status).toContain('#lp-icon-check-circle');
    expect(status).toContain('lp-status-undo-link');

    const disc = renderDisclosure({
      id: 'd1',
      summary: 'Details',
      summaryMeta: '14 Nov 2026 · Exact date · Case Study',
      bodyHtml: '<p>Fields</p>',
    });
    expect(disc).toContain('#lp-icon-chevron-down');
  });

  it('renders EmptyState with single primary CTA and optional embedded first-run guide numbered once (D-FOUND-6)', () => {
    const empty = renderEmptyState({
      id: 'e1',
      title: 'Write your first entry',
      body: 'Start a draft to record your notes.',
      actionHtml: renderButton({ label: 'Start a draft', variant: 'primary' }),
      guideSteps: [
        { title: 'Write a draft', body: 'Add a clear title and notes.' },
        { title: 'Publish safely', body: 'Check for private details.' },
      ],
    });
    expect(empty).toContain('lp-empty-guide');
    expect(empty).not.toMatch(/1\.\s*1\./);
  });

  it('renders /admin/dev/foundations with computed contrast ratios (no AA Pass), theme-specific toggle, and all specimens', () => {
    const lightHtml = renderFoundationsGalleryPage('light');
    expect(lightHtml).toContain('Design Foundations Gallery');
    expect(lightHtml).toContain('id="foundations-specimens"');
    expect(lightHtml).toContain('id="foundations-components"');
    expect(lightHtml).toContain('id="foundations-layout-preview"');
    expect(lightHtml).not.toContain('AA Pass');
    expect(lightHtml).toMatch(/\d+\.\d:1/);
    expect(lightHtml).toContain('aria-label="Switch to dark theme"');
    expect(lightHtml).toContain('#lp-icon-moon');
    expect(lightHtml).not.toMatch(/\sstyle="/i);

    const darkHtml = renderFoundationsGalleryPage('dark');
    expect(darkHtml).not.toContain('AA Pass');
    expect(darkHtml).toContain('aria-label="Switch to light theme"');
    expect(darkHtml).toContain('#lp-icon-sun');
  });

  it('enforces admin session authentication on /admin/dev/foundations and excludes the route in production', async () => {
    const unauthApp = createWebApp({
      checkSession: async () => ({ authenticated: false, setupRequired: false }),
    }).app;
    const unauthRes = await unauthApp.request('/admin/dev/foundations');
    expect(unauthRes.status).toBe(302);
    expect(unauthRes.headers.get('location')).toBe('/admin/login');

    const authApp = createWebApp({
      checkSession: async () => ({ authenticated: true, setupRequired: false }),
    }).app;
    const authRes = await authApp.request('/admin/dev/foundations');
    expect(authRes.status).toBe(200);

    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const prodApp = createWebApp({
        checkSession: async () => ({ authenticated: true, setupRequired: false }),
      }).app;
      const prodRes = await prodApp.request('/admin/dev/foundations');
      expect(prodRes.status).toBe(404);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});
