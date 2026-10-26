import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { loadConfig } from '@living-portfolio/config';
import {
  InMemoryPortfolioRepository,
  PostgresPortfolioRepository,
  DualWritePortfolioRepository,
  seedDemoPortfolio,
  type IPortfolioRepository,
} from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider, OpenAICompatibleProvider, resolveConfiguredProviders, AnswerCache, type ModelProvider } from '@living-portfolio/ai';
import { DEFAULT_STRATA_THEME } from '@living-portfolio/core';
import {
  renderAdminLoginPage,
  renderAdminSetupPage,
  renderAdminWorkspacePage,
} from '@living-portfolio/web';
import { AuthManager, createAuthRoutes } from './auth/security.js';
import { createHealthRoutes } from './routes/health.js';
import { createEntriesRoutes } from './routes/entries.js';
import { createStructureRoutes } from './routes/structure.js';
import { createAskRoutes } from './routes/ask.js';
import { createTimelineRoutes } from './routes/timeline.js';
import { createInboxRoutes } from './routes/inbox.js';
import { createCalibrationRoutes } from './routes/calibration.js';
import { createAuditRoutes } from './routes/audit.js';
import { createImportRoutes } from './routes/import.js';
import { createSettingsRoutes, type RuntimeSettingsState } from './routes/settings.js';

export function createApp(
  customRepo?: IPortfolioRepository,
  options?: {
    signingKey?: string;
    bootstrapAdminToken?: string;
    allowedOrigins?: string[];
    providers?: ModelProvider[];
    databaseKind?: 'in-memory' | 'postgres' | 'dual-write';
  }
) {
  const app = new Hono();
  const cfg = loadConfig();
  const defaultDbKind =
    process.env.NODE_ENV === 'test'
      ? 'in-memory'
      : process.env.NODE_ENV === 'production' || process.env.DATABASE_URL
        ? 'postgres'
        : 'in-memory';
  const dbKind =
    options?.databaseKind ??
    (process.env.PORTFOLIO_DB_MODE as any) ??
    defaultDbKind;

  if (dbKind === 'in-memory' && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[DEPRECATION] InMemoryPortfolioRepository is deprecated for production deployments (§13.10, Fix 7, P1). Configure DATABASE_URL to use PostgresPortfolioRepository or DualWritePortfolioRepository.'
    );
  }

  const repo =
    customRepo ??
    (dbKind === 'dual-write'
      ? new DualWritePortfolioRepository({
          primary: new InMemoryPortfolioRepository(),
          shadow: new PostgresPortfolioRepository(),
        })
      : dbKind === 'postgres'
      ? new PostgresPortfolioRepository()
      : new InMemoryPortfolioRepository());
  const governor = new BudgetGovernor({}, repo);
  const mockProvider = new MockModelProvider();

  // Resolve model providers strictly from configuration or explicit options (Spec §10.8, §13.5)
  // With none configured, providers is empty and Ask degrades to extractive excerpts with disclosure.
  let providers: ModelProvider[] = [];
  if (options?.providers) {
    providers = options.providers;
  } else {
    providers = resolveConfiguredProviders(cfg);
  }
  const adminToken = options?.bootstrapAdminToken || cfg.ADMIN_API_TOKEN || '';
  const auth = new AuthManager({
    signingKey: options?.signingKey || (cfg.SESSION_SECRET ? cfg.SESSION_SECRET : undefined),
    bootstrapAdminToken: adminToken || undefined,
  });

  const configuredOrigins = [
    ...cfg.SITE_ORIGIN.split(',').map((s) => s.trim()),
    ...cfg.ADMIN_ORIGIN.split(',').map((s) => s.trim()),
  ].filter(Boolean);
  const primarySiteOrigin = configuredOrigins[0] || cfg.SITE_ORIGIN;
  const allowedOrigins = new Set(options?.allowedOrigins ?? configuredOrigins);

  const runtimeState: RuntimeSettingsState = {
    automatedAnsweringEnabled: true,
    calibrationFrozen: false,
    simulatedDegradationMode: 'normal',
    tier1_floor: 0.82,
    tier2_floor: 0.55,
    facet_known_threshold: 0.9,
    setupWizardCompleted: auth.isConfigured(),
    theme: structuredClone(DEFAULT_STRATA_THEME),
  };

  // Global middleware: logging, security headers + CSP (S5), and origin-restricted CORS (S5)
  app.use('*', logger());
  app.use('*', async (c, next) => {
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none'; base-uri 'self'"
    );
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    await next();
  });
  app.use(
    '*',
    cors({
      origin: (requestOrigin) => {
        if (!requestOrigin) return primarySiteOrigin;
        return allowedOrigins.has(requestOrigin) ? requestOrigin : null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      credentials: true,
    })
  );

  // Public & Auth routes
  const providerNames = providers.map((p) => p.name);
  const healthRouter = createHealthRoutes(
    async () => {
      if (typeof (repo as any).checkHealth === 'function') {
        return await (repo as any).checkHealth();
      }
      return true;
    },
    {
      databaseKind: dbKind,
      configuredProviders: providerNames,
    }
  );
  const answerCache = new AnswerCache();

  app.route('/healthz', healthRouter);
  app.route('/api/health', healthRouter);
  app.route('/api/auth', createAuthRoutes(auth));
  app.route('/api/entries', createEntriesRoutes(repo, auth, runtimeState, answerCache));
  app.route(
    '/api/ask',
    createAskRoutes({
      repo,
      governor,
      providers,
      answerCache,
      auth,
      tier1Floor: 0.82,
      tier2Floor: 0.55,
      getRuntimeSettings: () => runtimeState,
    })
  );
  app.route('/api/timeline', createTimelineRoutes(repo));

  // Admin-only routes protected by default-deny auth middleware (Fix 1 / S1, S2)
  app.use('/api/structure/*', auth.requireAdminMiddleware());
  app.use('/api/inbox', auth.requireAdminMiddleware());
  app.use('/api/inbox/*', auth.requireAdminMiddleware());
  app.use('/api/calibration/*', auth.requireAdminMiddleware());
  app.use('/api/audit/*', auth.requireAdminMiddleware());
  app.use('/api/import/*', auth.requireAdminMiddleware());
  app.use('/api/settings', auth.requireAdminMiddleware());
  app.use('/api/settings/*', auth.requireAdminMiddleware());

  app.route('/api/structure', createStructureRoutes(repo, answerCache));
  app.route('/api/inbox', createInboxRoutes(repo));
  app.route('/api/calibration', createCalibrationRoutes(repo));
  app.route('/api/audit', createAuditRoutes(repo));
  app.route('/api/import', createImportRoutes(repo, auth));
  app.route('/api/settings', createSettingsRoutes(repo, runtimeState, auth));

  // Shadow verification & metrics endpoints (WP-2.4, Fix 8, Fix 10, OSR-15)
  app.get('/api/admin/metrics/shadow', auth.requireAdminMiddleware(), (c) => {
    if (repo instanceof DualWritePortfolioRepository) {
      return c.json({
        ok: true,
        mode: 'dual-write',
        metrics: repo.getShadowMetrics(),
      });
    }
    return c.json({
      ok: true,
      mode: dbKind,
      metrics: null,
      message: 'Dual-write verification harness is not active in this runtime mode.',
    });
  });

  app.post('/api/admin/metrics/shadow/reset', auth.requireAdminMiddleware(), (c) => {
    if (repo instanceof DualWritePortfolioRepository) {
      repo.resetShadowMetrics();
      return c.json({ ok: true, reset: true });
    }
    return c.json({ ok: false, message: 'Dual-write repository is not active.' }, 400);
  });

  app.get('/api/admin/metrics/shadow/parity', auth.requireAdminMiddleware(), async (c) => {
    if (repo instanceof DualWritePortfolioRepository) {
      const parity = await repo.verifyParity();
      return c.json({ ok: true, parity });
    }
    return c.json({ ok: false, message: 'Dual-write repository is not active.' }, 400);
  });

  // Seed demo portfolio on demand (Admin-only, S1; disabled in production per OSR-04)
  app.post('/api/seed', auth.requireAdminMiddleware(), async (c) => {
    if (cfg.DEPLOYMENT_CLASS === 'production') {
      return c.json({ error: 'Demo seeding is disabled in production (OSR-04).' }, 403);
    }
    await seedDemoPortfolio(repo);
    const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
    return c.json({ seeded: true, entriesCount: entries.length });
  });

  // Admin UI routes (UX P0-1, 20261020-UX-01 / V1)
  app.get('/admin/setup', (c) => {
    if (auth.isSetupCompleted()) {
      return c.redirect('/admin/login', 302);
    }
    return c.html(renderAdminSetupPage());
  });
  app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));
  app.get('/admin', auth.requireAdminMiddleware(), async (c) => c.html(await renderAdminWorkspacePage(repo)));

  // Federation manifest (§17)
  app.get('/.well-known/living-portfolio.json', async (c) => {
    // SIMULATED(M1): Cryptographic credential verification for federation manifest (§17) is not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M1',
        message: 'Federation manifest credential verification (§17) is not yet implemented.',
      },
      501
    );
  });

  // RSS Feed (§5.1)
  app.get('/rss.xml', async (c) => {
    const entries = await repo.listEntries({ visibility: ['public'] });
    const items = entries
      .map(
        (e) =>
          `    <item>\n      <title>${e.title}</title>\n      <link>${primarySiteOrigin}/writing/${e.slug}</link>\n      <pubDate>${new Date(e.created_at).toUTCString()}</pubDate>\n    </item>`
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${cfg.PUBLIC_SITE_NAME}</title>\n    <link>${primarySiteOrigin}</link>\n    <description>Time-aware personal portfolio and engineering log</description>\n${items}\n  </channel>\n</rss>`;
    return c.text(xml, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
  });

  // Sitemap XML (§5.1)
  app.get('/sitemap.xml', async (c) => {
    const entries = await repo.listEntries({ visibility: ['public'] });
    const urls = entries
      .map((e) => `  <url><loc>${primarySiteOrigin}/work/${e.slug}</loc></url>`)
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${primarySiteOrigin}/</loc></url>\n  <url><loc>${primarySiteOrigin}/work</loc></url>\n  <url><loc>${primarySiteOrigin}/writing</loc></url>\n  <url><loc>${primarySiteOrigin}/build</loc></url>\n  <url><loc>${primarySiteOrigin}/timeline</loc></url>\n  <url><loc>${primarySiteOrigin}/ask</loc></url>\n${urls}\n</urlset>`;
    return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
  });

  // Root welcome
  app.get('/', (c) => {
    return c.json({
      name: cfg.PUBLIC_SITE_NAME,
      version: '0.1.0-alpha.0',
      status: 'online',
      schema_version: 'qrxp_v1.0.0',
      docs: '/healthz',
    });
  });

  return { app, repo, governor, mockProvider, providers, runtimeState, auth, adminToken, answerCache };
}
