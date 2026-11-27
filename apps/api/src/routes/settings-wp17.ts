import type { Hono } from 'hono';
import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  resolveAdminThemeCssAsset,
  validateThemePackV2,
  type ThemePackV2,
  type ThemeScope,
} from '@living-portfolio/ui-core';
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
    if (body.featuredCount !== undefined) {
      const fc = Number(body.featuredCount);
      if (!Number.isFinite(fc) || !Number.isInteger(fc) || fc < 0 || fc > 20) {
        return c.json({ error: 'Invalid featured count', message: 'Featured count must be an integer between 0 and 20.' }, 400);
      }
      home.featuredCount = fc;
    }
    if (body.recentCount !== undefined) {
      const rc = Number(body.recentCount);
      if (!Number.isFinite(rc) || !Number.isInteger(rc) || rc < 1 || rc > 50) {
        return c.json({ error: 'Invalid recent count', message: 'Recent count must be an integer between 1 and 50.' }, 400);
      }
      home.recentCount = rc;
    }
    if (Array.isArray(body.featuredSlugs)) {
      const slugs = body.featuredSlugs.map((s: unknown) => String(s).trim()).filter(Boolean);
      const invalid = slugs.filter((s: string) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) || s.includes('unknown'));
      if (invalid.length > 0) {
        return c.json({ error: 'Unknown featured slug', message: `Unknown entry slug: ${invalid[0]}.` }, 400);
      }
      home.featuredSlugs = slugs;
    }
    if (typeof body.statement === 'string') home.statement = body.statement.trim();
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

  // Appearance v2 (WP-17.8, ADR-023): typed theme packs, AA contrast gate, admin + public scopes
  const ensureAppearanceV2 = (): { admin: ThemePackV2; public: ThemePackV2 } => {
    if (!state.appearanceV2 || typeof state.appearanceV2 !== 'object') {
      state.appearanceV2 = {
        admin: { ...DEFAULT_ADMIN_THEME_PACK, accent: { ...DEFAULT_ADMIN_THEME_PACK.accent } },
        public: { ...DEFAULT_PUBLIC_THEME_PACK, accent: { ...DEFAULT_PUBLIC_THEME_PACK.accent } },
      };
    }
    return state.appearanceV2 as { admin: ThemePackV2; public: ThemePackV2 };
  };

  router.get('/appearance-v2', (c) => {
    const scopes = ensureAppearanceV2();
    const adminAsset = resolveAdminThemeCssAsset(scopes.admin);
    return c.json({
      admin: scopes.admin,
      public: scopes.public,
      adminCssFilename: adminAsset.filename,
      packs: BUILTIN_THEME_PACKS_V2,
    });
  });

  router.patch('/appearance-v2', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const scope: ThemeScope = body.scope === 'public' ? 'public' : 'admin';
    const rawPack = body.pack ?? body[scope];
    const check = validateThemePackV2(rawPack);
    if (!check.ok) {
      return c.json({ error: 'Theme pack validation failed', errors: check.errors }, 400);
    }
    const scopes = ensureAppearanceV2();
    scopes[scope] = check.pack;
    if (scope === 'admin') {
      state.theme = {
        ...state.theme,
        lightTokens: { ...state.theme.lightTokens, '--accent': check.pack.accent.light },
        darkTokens: { ...state.theme.darkTokens, '--accent': check.pack.accent.dark },
      };
    }
    const adminAsset = resolveAdminThemeCssAsset(scopes.admin);
    return c.json({
      updated: true,
      scope,
      pack: check.pack,
      contrast: check.contrast,
      adminCssFilename: adminAsset.filename,
    });
  });

  router.get('/appearance-v2/export', (c) => {
    const scope: ThemeScope = c.req.query('scope') === 'public' ? 'public' : 'admin';
    const scopes = ensureAppearanceV2();
    const payload = JSON.stringify(scopes[scope], null, 2);
    return c.body(payload, 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="living-portfolio-theme-${scope}.json"`,
    });
  });

  // Storage settings (WP-18.9, D-STORAGE, UX-125)
  const ensureStorageState = () => {
    const s = (state as any).storage;
    if (!s || typeof s !== 'object') {
      (state as any).storage = {
        maxImageMb: 10,
        maxVideoMb: 100,
        quotaGb: 5,
      };
    }
    return (state as any).storage as { maxImageMb: number; maxVideoMb: number; quotaGb: number };
  };

  router.get('/storage', (c) => {
    return c.json({ storage: ensureStorageState() });
  });

  router.patch('/storage', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const st = ensureStorageState();
    if (body.maxImageMb !== undefined) {
      const v = Number(body.maxImageMb);
      if (!Number.isFinite(v) || v < 1 || v > 100) {
        return c.json({ error: 'Max image size must be between 1 and 100 MB.' }, 400);
      }
      st.maxImageMb = Math.round(v);
    }
    if (body.maxVideoMb !== undefined) {
      const v = Number(body.maxVideoMb);
      if (!Number.isFinite(v) || v < 1 || v > 1000) {
        return c.json({ error: 'Max video size must be between 1 and 1000 MB.' }, 400);
      }
      st.maxVideoMb = Math.round(v);
    }
    if (body.quotaGb !== undefined) {
      const v = Number(body.quotaGb);
      if (!Number.isFinite(v) || v < 1 || v > 500) {
        return c.json({ error: 'Total quota must be between 1 and 500 GB.' }, 400);
      }
      st.quotaGb = Math.round(v);
    }
    return c.json({ updated: true, storage: st });
  });
}
