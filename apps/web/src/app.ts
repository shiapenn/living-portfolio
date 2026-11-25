import { Hono } from 'hono';
import {
  CORE_BUNDLE_CSS,
  CORE_CSS_FILENAME,
  DEFAULT_ACCENT_CSS,
  DEFAULT_ACCENT_CSS_FILENAME,
  FONT_ASSETS,
  BUILTIN_THEME_PACKS_V2,
  buildThemePreviewCss,
  deriveAccentPairFromSeed,
  resolveAdminThemeCssAsset,
  type DensityChoice,
  type RadiusScaleChoice,
  type ThemePackId,
  type ThemePackV2,
  type VettedFontChoice,
} from '@living-portfolio/ui-core';
import {
  ADMIN_BASE_CSS,
  ADMIN_CSS_FILENAME,
  ADMIN_EDITOR_CSS,
  ADMIN_EDITOR_CSS_FILENAME,
  ADMIN_GALLERY_CSS,
  ADMIN_GALLERY_CSS_FILENAME,
} from '@living-portfolio/ui-admin';
import {
  PUBLIC_BUNDLE_CSS,
  PUBLIC_CSS_FILENAME,
} from '@living-portfolio/ui-public';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { loadConfig } from '@living-portfolio/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
import {
  createLivingPortfolioClient,
  type LivingPortfolioClient,
} from '@living-portfolio/client';
import {
  renderAdminEntriesPage,
  renderDedicatedEditorPage,
  renderEntryHistoryPage,
  renderAdminInboxPage,
  renderAdminAuditRulesPage,
  renderAdminCalibrationPage,
  renderAdminStructurePage,
  renderAdminBookingsPage,
  renderAdminVenturesPage,
  renderAdminPagesEditorPage,
  renderAdminEntriesListPage,
  renderAdminDashboardPage,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSectionPage,
  renderAdminSettingsPage,
  renderAdminSettingsModulePage,
  renderAdminSetupPage,
  renderNotFoundPage,
  adaptDataSource,
  type WebDataClient,
} from './renderer.js';
import { registerAdminDevRoutes } from './routes/admin-dev-routes.js';
import { registerPublicRoutes } from './routes/public-routes.js';
import { deliveryMiddleware } from './middleware/delivery.js';

export interface WebAppOptions {
  client?: LivingPortfolioClient | WebDataClient;
  apiBaseUrl?: string;
  checkSession?: (cookieHeader?: string) => Promise<{ authenticated: boolean; setupRequired?: boolean; legacyRecoveryUsed?: boolean }>;
  getSettings?: () => Promise<Record<string, unknown>> | Record<string, unknown>;
}

/**
 * Creates the Strata Public Site and Admin Web Application (apps/web).
 * Decoupled from database / repository layer, communicating strictly via @living-portfolio/client.
 */
export function createWebApp(options?: WebAppOptions) {
  const app = new Hono();
  app.use('*', deliveryMiddleware);
  const cfg = loadConfig();
  const primarySiteOrigin = cfg.SITE_ORIGIN.split(',')[0].trim();

  const defaultPort = process.env.API_PORT || process.env.PORT || '4000';
  const defaultHost = process.env.API_HOST || 'localhost';
  const fallbackBaseUrl = `http://${defaultHost}:${defaultPort}/api/v1`;

  const client: WebDataClient = adaptDataSource(
    options?.client ??
    createLivingPortfolioClient({
      baseUrl: options?.apiBaseUrl ?? process.env.PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
    })
  );

  const checkSession =
    options?.checkSession ??
    (async (cookieHeader?: string) => {
      try {
        if ((client as any)?.auth?.session && typeof (client as any).auth.session === 'function') {
          const res = await (client as any).auth.session(
            cookieHeader ? { headers: { cookie: cookieHeader } } : undefined
          );
          return {
            authenticated: Boolean(res?.authenticated),
            setupRequired: Boolean(res?.setupRequired),
            legacyRecoveryUsed: Boolean(res?.legacyRecoveryUsed),
          };
        }
        const apiHost = process.env.API_HOST || '127.0.0.1';
        const apiPort = process.env.API_PORT || process.env.PORT || '4000';
        const rawBase = options?.apiBaseUrl ?? process.env.INTERNAL_API_URL ?? fallbackBaseUrl;
        const resolvedApiBase = rawBase.startsWith('http') ? rawBase : `http://${apiHost}:${apiPort}${rawBase}`;
        const res = await fetch(`${resolvedApiBase}/auth/session`, {
          headers: {
            Accept: 'application/json',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          return {
            authenticated: Boolean(data?.authenticated),
            setupRequired: Boolean(data?.setupRequired),
            legacyRecoveryUsed: Boolean(data?.legacyRecoveryUsed),
          };
        }
        return { authenticated: false, setupRequired: false, legacyRecoveryUsed: false };
      } catch {
        return { authenticated: false, setupRequired: false, legacyRecoveryUsed: false };
      }
    });

  // Search engine indexing prevention (§6.4 item 2, OSR-19)
  if (cfg.DEPLOYMENT_CLASS === 'staging') {
    app.use('*', async (c, next) => {
      await next();
      c.header('X-Robots-Tag', 'noindex, nofollow');
    });
  }

  // Liveness / health endpoint for load balancers & container health checks
  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'web' }));

  // Search engine crawler instructions (§6.4 item 2, OSR-19, WP-17.3 UX-42)
  app.get('/robots.txt', async (c) => {
    if (cfg.DEPLOYMENT_CLASS === 'staging') {
      return c.text('User-agent: *\nDisallow: /\n', 200, {
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }
    let settingsObj: Record<string, unknown> = {};
    try {
      if (options?.getSettings) {
        settingsObj = (await options.getSettings()) || {};
      } else if ((client as any)?.settings?.get) {
        settingsObj = ((await (client as any).settings.get()) as Record<string, unknown>) || {};
      }
    } catch {
      settingsObj = {};
    }
    const vis = (settingsObj.visibility && typeof settingsObj.visibility === 'object'
      ? settingsObj.visibility
      : settingsObj) as Record<string, unknown>;
    const allowSearch = vis.allowSearchIndexing !== false;
    const blockAi = Boolean(vis.blockAiCrawlers);

    const lines: string[] = ['User-agent: *'];
    if (!allowSearch) {
      lines.push('Disallow: /');
    } else {
      lines.push('Allow: /');
      lines.push('Disallow: /admin');
      lines.push('Disallow: /api');
      lines.push('Disallow: /ask/status');
    }
    if (blockAi) {
      for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot']) {
        lines.push('', `User-agent: ${bot}`, 'Disallow: /');
      }
    }
    lines.push('', `Sitemap: ${primarySiteOrigin}/sitemap.xml`, '');
    return c.text(lines.join('\n'), 200, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
  });

  // Hashed static CSS bundles with immutable caching (WP-16.M D-M1)
  const cssBundles: Record<string, string> = {
    [CORE_CSS_FILENAME]: CORE_BUNDLE_CSS,
    'core.css': CORE_BUNDLE_CSS,
    [DEFAULT_ACCENT_CSS_FILENAME]: DEFAULT_ACCENT_CSS,
    'accent.css': DEFAULT_ACCENT_CSS,
    [ADMIN_CSS_FILENAME]: ADMIN_BASE_CSS,
    'admin.css': ADMIN_BASE_CSS,
    [ADMIN_EDITOR_CSS_FILENAME]: ADMIN_EDITOR_CSS,
    'admin-editor.css': ADMIN_EDITOR_CSS,
    [ADMIN_GALLERY_CSS_FILENAME]: ADMIN_GALLERY_CSS,
    'admin-gallery.css': ADMIN_GALLERY_CSS,
    [PUBLIC_CSS_FILENAME]: PUBLIC_BUNDLE_CSS,
    'public.css': PUBLIC_BUNDLE_CSS,
  };
  app.get('/assets/css/theme-preview.css', (c) => {
    const base = BUILTIN_THEME_PACKS_V2[(c.req.query('pack') || 'quiet-default') as ThemePackId] || BUILTIN_THEME_PACKS_V2['quiet-default'];
    const rawSeed = (c.req.query('seed') || base.accent.light).trim();
    const accent = /^#[0-9a-fA-F]{6}$/.test(rawSeed) ? deriveAccentPairFromSeed(rawSeed) : base.accent;
    const previewPack: ThemePackV2 = { ...base, accent, density: (c.req.query('density') || base.density) as DensityChoice, radiusScale: (c.req.query('radius') || base.radiusScale) as RadiusScaleChoice, fontFamily: (c.req.query('font') || base.fontFamily) as VettedFontChoice };
    return c.body(buildThemePreviewCss(previewPack), 200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' });
  });

  app.get('/assets/css/:filename', async (c) => {
    const filename = c.req.param('filename');
    let css: string | undefined = cssBundles[filename];
    if (!css && /^theme\.[0-9a-f]{10}\.css$/.test(filename)) {
      const s = (await options?.getSettings?.()) ?? {};
      const adminPack = (s.appearanceV2 as { admin?: ThemePackV2 } | undefined)?.admin;
      const asset = resolveAdminThemeCssAsset(adminPack);
      if (asset.css && asset.filename === filename) {
        css = asset.css;
      }
    }
    if (!css) return c.text('Not Found', 404);
    const isHashed = /\.[0-9a-f]{10}\.css$/.test(filename);
    return c.body(css, 200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': isHashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    });
  });

  // Self-hosted WOFF2 fonts with immutable caching (WP-16.N D-N1/D-N4)
  app.get('/assets/fonts/:filename', (c) => {
    const filename = c.req.param('filename');
    const fontBuf = FONT_ASSETS[filename];
    if (!fontBuf) return c.text('Not Found', 404);
    const isHashed = /\.[0-9a-f]{10}\.woff2$/.test(filename);
    return c.body(new Uint8Array(fontBuf), 200, {
      'Content-Type': 'font/woff2',
      'Cache-Control': isHashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    });
  });

  // Static client bundled script assets (WP-14.0)
  app.get('/assets/client/:filename', async (c) => {
    const filename = c.req.param('filename');
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const possiblePaths = [
      resolve(currentDir, 'client', safeFilename),
      resolve(currentDir, '../dist/client', safeFilename),
      resolve(currentDir, '../../dist/client', safeFilename),
      resolve(currentDir, '../../../dist/client', safeFilename),
    ];
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf8');
        return c.body(content, 200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        });
      }
    }
    return c.text('Not Found', 404);
  });

  // Admin UI routes
  app.get('/admin/setup', async (c) => {
    const session = await checkSession(c.req.header('cookie'));
    if (!session.setupRequired && !session.authenticated) {
      return c.redirect('/admin/login', 302);
    }
    return c.html(renderAdminSetupPage());
  });
  app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));

  // Unauthenticated guard for admin workspace, import, and settings (§13.4, UX-05)
  const adminGuard = async (c: any, next: any) => {
    if (c.req.path === '/admin/login' || c.req.path === '/admin/setup') {
      return next();
    }
    const session = await checkSession(c.req.header('cookie'));
    if (!session.authenticated) {
      const target = session.setupRequired ? '/admin/setup' : '/admin/login';
      return c.redirect(target, 302);
    }
    return next();
  };

  app.use('/admin', adminGuard);
  app.use('/admin/*', adminGuard);
  app.use('/quick-log', adminGuard);

  app.get('/admin', async (c) => {
    const session = await checkSession(c.req.header('cookie'));
    return c.html(
      await renderAdminDashboardPage(client, {
        siteName: cfg.PUBLIC_SITE_NAME,
        legacyRecoveryUsed: session.legacyRecoveryUsed,
      })
    );
  });
  app.get('/admin/today', async (c) => {
    const session = await checkSession(c.req.header('cookie'));
    return c.html(
      await renderAdminDashboardPage(client, {
        siteName: cfg.PUBLIC_SITE_NAME,
        legacyRecoveryUsed: session.legacyRecoveryUsed,
      })
    );
  });
  app.get('/admin/entries', async (c) => c.html(await renderAdminEntriesListPage(client, { siteName: cfg.PUBLIC_SITE_NAME })));
  app.get('/admin/entries/new', async (c) => {
    const html = await renderDedicatedEditorPage(client, { isNew: true, siteName: cfg.PUBLIC_SITE_NAME });
    return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
  });
  app.get('/admin/entries/:id', async (c, next) => {
    const id = c.req.param('id');
    if (id === 'editor') {
      if (process.env.NODE_ENV === 'production') {
        return c.notFound();
      }
      return next();
    }
    const html = await renderDedicatedEditorPage(client, { selectedId: id, siteName: cfg.PUBLIC_SITE_NAME });
    return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
  });
  app.get('/admin/entries/:id/history', async (c) => {
    const html = await renderEntryHistoryPage(client, c.req.param('id'), { siteName: cfg.PUBLIC_SITE_NAME });
    return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
  });
  app.get('/admin/inbox', async (c) =>
    c.html(await renderAdminInboxPage(client, { status: c.req.query('status'), siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/inbox/:id', async (c) =>
    c.html(await renderAdminInboxPage(client, { selectedId: c.req.param('id'), siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/audit', async (c) =>
    c.html(await renderAdminAuditRulesPage(client, { status: c.req.query('status'), siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/calibration', async (c) =>
    c.html(await renderAdminCalibrationPage(client, { siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/structure', async (c) =>
    c.html(await renderAdminStructurePage(client, { siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/bookings', async (c) =>
    c.html(await renderAdminBookingsPage(client, { siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/ventures', async (c) =>
    c.html(await renderAdminVenturesPage(client, { siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/pages', async (c) =>
    c.html(await renderAdminPagesEditorPage(client, { section: c.req.query('section'), siteName: cfg.PUBLIC_SITE_NAME }))
  );
  app.get('/admin/import', async (c) => c.html(await renderAdminImportPage(client)));
  app.get('/admin/status', async (c) => {
    const { renderAdminStatusPage } = await import('./pages/admin/status.js');
    return c.html(await renderAdminStatusPage(client, { siteName: cfg.PUBLIC_SITE_NAME }));
  });
  app.get('/admin/settings', (c) => c.redirect('/admin/settings/answering', 302));
  app.get('/admin/settings/providers/change', async (c) => {
    const { renderProviderChangePage } = await import('./pages/admin/providers-change.js');
    const stepParam = Number(c.req.query('step') || '1');
    const step = (stepParam === 2 || stepParam === 3 ? stepParam : 1) as 1 | 2 | 3;
    const provParam = c.req.query('provider');
    const provider = (provParam === 'openai' || provParam === 'anthropic' || provParam === 'ollama' ? provParam : 'local');
    const model = c.req.query('model') || undefined;
    return c.html(renderProviderChangePage({ step, provider, model }));
  });
  app.get('/admin/routing', async (c) => {
    const html = await renderAdminSettingsModulePage(client, 'answering');
    return html ? c.html(html) : c.html(renderAdminSectionPage(c.req.path));
  });
  app.get('/admin/account', async (c) => {
    const html = await renderAdminSettingsModulePage(client, 'account');
    return html ? c.html(html) : c.html(renderAdminSectionPage(c.req.path));
  });
  app.get('/admin/theme', async (c) => {
    const html = await renderAdminSettingsModulePage(client, 'appearance');
    return html ? c.html(html) : c.html(renderAdminSectionPage(c.req.path));
  });
  app.get('/admin/settings/:id', async (c) => {
    const html = await renderAdminSettingsModulePage(client, c.req.param('id'));
    if (html) return c.html(html);
    return c.html(renderAdminSectionPage(c.req.path));
  });
  const adminSectionRoutes = [
    '/admin/quick-log',
    '/quick-log',
  ];
  for (const routePath of adminSectionRoutes) {
    app.get(routePath, async (c) => c.html(renderAdminSectionPage(c.req.path)));
  }
  registerAdminDevRoutes(app, { client, siteName: cfg.PUBLIC_SITE_NAME, checkSession });
  registerPublicRoutes(app, { client, siteName: cfg.PUBLIC_SITE_NAME, primarySiteOrigin });

  return { app, client };
}
