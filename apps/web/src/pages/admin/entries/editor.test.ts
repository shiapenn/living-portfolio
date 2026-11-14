import { describe, it, expect } from 'vitest';
import { renderReferenceEditorPage } from './editor.js';
import { EDITOR_STRINGS, formatCount } from '../../../strings/admin/editor.js';
import { createWebApp } from '../../../app.js';

describe('WP-15.7 Reference Editor Page', () => {
  it('renders without inline styles, text glyph icons, public nav/footer, or internal jargon', () => {
    const html = renderReferenceEditorPage({
      entries: [
        {
          id: 'entry-1',
          slug: 'architecture-notes',
          title: 'Architecture notes',
          body: 'Initial draft body.',
          visibility: 'draft',
          date: '2026-11-14',
          temporalConfidence: 'exact',
          profile: 'decision',
        },
      ],
      selectedId: 'entry-1',
      siteName: 'Living Portfolio',
      initialTheme: 'light',
    });

    // Zero inline styles
    expect(html).not.toMatch(/\sstyle="/i);

    // Self-hosted SVG sprite present, zero text-glyph icons
    expect(html).toContain('id="lp-icon-sprite"');
    expect(html).not.toContain('▾');
    expect(html).not.toContain('◐');

    // Target-mode theme toggle rule in light mode -> moon + "Switch to dark theme"
    expect(html).toContain('#lp-icon-moon');
    expect(html).toContain('aria-label="Switch to dark theme"');

    // No public nav or footer, no unofficial fork notice, no Publish Now, no directional copy
    expect(html).not.toContain('unofficial fork');
    expect(html).not.toContain('Publish Now');
    expect(html).not.toContain('Signed preview token');
    expect(html).not.toContain('Enrichment pipeline');
    expect(html).not.toMatch(/\bL[0-3]\b/);
    expect(html).not.toMatch(/\b(above|below)\b/i);

    // Details summary does not repeat entry visibility state (UX-78)
    const metaMatch = html.match(/id="ref-details-summary-meta"[^>]*>([^<]+)</);
    expect(metaMatch?.[1]).toBe('14 Nov 2026 · Exact date · Decision Record');
    expect(metaMatch?.[1]).not.toMatch(/Draft|Unlisted|Public/);

    // Only the 4 D-FEEDBACK places may carry role="status" or role="alert"
    const roleMatches = html.match(/role="(status|alert)"/g) ?? [];
    expect(roleMatches.length).toBeLessThanOrEqual(4);
  });

  it('uses sun icon and "Switch to light theme" in dark mode, and single-numbered first-run guide', () => {
    const darkFirstRun = renderReferenceEditorPage({
      entries: [],
      showWalkthrough: true,
      initialTheme: 'dark',
    });

    expect(darkFirstRun).toContain('#lp-icon-sun');
    expect(darkFirstRun).toContain('aria-label="Switch to light theme"');
    expect(darkFirstRun).toContain('<ol class="lp-empty-guide-steps">');
    expect(darkFirstRun).not.toContain('1. 1.');
  });

  it('provides single count/plural helper in strings catalogue', () => {
    expect(formatCount(0, 'entry', 'entries')).toBe('0 entries');
    expect(formatCount(1, 'entry', 'entries')).toBe('1 entry');
    expect(formatCount(3, 'entry', 'entries')).toBe('3 entries');
    expect(EDITOR_STRINGS.actions.saveDraft).toBe('Save draft');
    expect(EDITOR_STRINGS.feedback.errorTitleRequired).toBe('Enter a title to save this entry.');
  });

  it('requires admin session and excludes reference editor routes and fixture/theme params in production', async () => {
    const routes = [
      '/admin/entries/editor',
      '/admin/entries/editor?fixture=draft&theme=dark',
      '/admin/entries/new?theme=light',
      '/admin/entries/entry-1?fixture=public&theme=dark',
    ];

    const unauthApp = createWebApp({
      checkSession: async () => ({ authenticated: false, setupRequired: false }),
    }).app;
    for (const route of routes) {
      const res = await unauthApp.request(route);
      expect(res.status, `unauth ${route}`).toBe(302);
      expect(res.headers.get('location')).toBe('/admin/login');
    }

    const authApp = createWebApp({
      checkSession: async () => ({ authenticated: true, setupRequired: false }),
      client: {
        entries: { list: async () => ({ entries: [] }) },
        listEntries: async () => [],
      } as any,
    }).app;
    for (const route of routes) {
      const res = await authApp.request(route);
      expect(res.status, `auth non-prod ${route}`).toBe(200);
    }

    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const prodApp = createWebApp({
        checkSession: async () => ({ authenticated: true, setupRequired: false }),
        client: {
          entries: { list: async () => ({ entries: [] }) },
          listEntries: async () => [],
        } as any,
      }).app;
      for (const route of routes) {
        const res = await prodApp.request(route);
        expect(res.status, `prod ${route}`).toBe(404);
      }
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});
