import type { Hono } from 'hono';
import type { RuntimeSettingsState } from './settings.js';

export type StaticPageSlug = 'about' | 'now' | 'uses' | 'home';
const PAGE_TITLES: Record<StaticPageSlug, string> = {
  about: 'About',
  now: 'Now',
  uses: 'Uses',
  home: 'Home statement',
};

function ensureHomeState(state: RuntimeSettingsState) {
  if (!state.home) {
    state.home = {
      statement: 'Independent builder documenting real engineering work, decisions, and outcomes.',
      featuredCount: 3,
      recentCount: 10,
      featuredSlugs: [],
    };
  }
  return state.home;
}

function ensurePagesState(state: RuntimeSettingsState) {
  if (!state.pages) {
    const now = new Date().toISOString();
    state.pages = {
      about: { slug: 'about', title: 'About', body_md: 'About this portfolio and its author.', updatedAt: now, revisions: [] },
      now: { slug: 'now', title: 'Now', body_md: 'What I am currently focused on.', updatedAt: now, revisions: [] },
      uses: { slug: 'uses', title: 'Uses', body_md: 'Tools, stack, and hardware I rely on.', updatedAt: now, revisions: [] },
      home: { slug: 'home', title: 'Home statement', body_md: ensureHomeState(state).statement, updatedAt: now, revisions: [] },
    };
  }
  return state.pages;
}

/**
 * Modular WP-17 settings routes (keeps apps/api/src/routes/settings.ts within its shrinking-only line cap).
 */
export function registerWp17SettingsRoutes(router: Hono, state: RuntimeSettingsState): void {
  // Visibility & crawler policy (WP-17.3, UX-42)
  router.patch('/visibility', async (c) => {
    const body = await c.req.json();
    if (typeof body.allowSearchIndexing === 'boolean') state.allowSearchIndexing = body.allowSearchIndexing;
    if (typeof body.blockAiCrawlers === 'boolean') state.blockAiCrawlers = body.blockAiCrawlers;
    if (typeof body.federationEnabled === 'boolean') state.federationEnabled = body.federationEnabled;
    return c.json({
      updated: true,
      visibility: {
        allowSearchIndexing: state.allowSearchIndexing ?? true,
        blockAiCrawlers: state.blockAiCrawlers ?? false,
        federationEnabled: state.federationEnabled ?? false,
        rssEnabled: true,
        sitemapEnabled: true,
      },
    });
  });

  // Home settings (WP-17.7, UX-17, A-04, D-09)
  router.get('/home', (c) => {
    return c.json({ home: ensureHomeState(state) });
  });

  router.patch('/home', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const home = ensureHomeState(state);
    if (typeof body.statement === 'string') home.statement = body.statement.trim();
    if (typeof body.featuredCount === 'number' && Number.isFinite(body.featuredCount)) {
      home.featuredCount = Math.max(0, Math.min(20, Math.round(body.featuredCount)));
    }
    if (typeof body.recentCount === 'number' && Number.isFinite(body.recentCount)) {
      home.recentCount = Math.max(1, Math.min(50, Math.round(body.recentCount)));
    }
    if (Array.isArray(body.featuredSlugs)) {
      home.featuredSlugs = body.featuredSlugs.map((s: unknown) => String(s).trim()).filter(Boolean);
    }
    const pages = ensurePagesState(state);
    pages.home.body_md = home.statement;
    return c.json({ updated: true, home });
  });

  // Static pages with revision history (WP-17.7, UX-17)
  router.get('/pages', (c) => {
    return c.json({ pages: ensurePagesState(state) });
  });

  router.put('/pages/:slug', async (c) => {
    const slug = c.req.param('slug') as StaticPageSlug;
    if (!(slug in PAGE_TITLES)) {
      return c.json({ error: 'Unknown page section', message: 'Valid sections are about, now, uses, and home.' }, 400);
    }
    const body = await c.req.json().catch(() => ({}));
    const bodyMd = typeof body.body_md === 'string' ? body.body_md : '';
    const pages = ensurePagesState(state);
    const prev = pages[slug];
    const savedAt = new Date().toISOString();
    const revId = `rev_${Date.now().toString(36)}_${prev.revisions.length + 1}`;
    prev.revisions.push({ id: revId, body_md: prev.body_md, savedAt });
    prev.body_md = bodyMd;
    prev.updatedAt = savedAt;
    if (slug === 'home') {
      ensureHomeState(state).statement = bodyMd.trim();
    }
    return c.json({ updated: true, page: prev, revisionId: revId });
  });
}
