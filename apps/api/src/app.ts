import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { loadConfig, type AppConfig } from '@living-portfolio/config';
import {
  InMemoryPortfolioRepository,
  PostgresPortfolioRepository,
  DualWritePortfolioRepository,
  seedDemoPortfolio,
  type IPortfolioRepository,
} from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider, OpenAICompatibleProvider, resolveConfiguredProviders, AnswerCache, type ModelProvider } from '@living-portfolio/ai';
import { DEFAULT_STRATA_THEME, buildOpenApiDocument, type NotificationChannel } from '@living-portfolio/core';
import { AuthManager, createAuthRoutes } from './auth/security.js';
import { MetricsCollector } from './observability/metrics.js';
import { createHealthRoutes } from './routes/health.js';
import { createEntriesRoutes } from './routes/entries.js';
import { createStructureRoutes } from './routes/structure.js';
import { createAskRoutes } from './routes/ask.js';
import { createTimelineRoutes } from './routes/timeline.js';
import { createInboxRoutes } from './routes/inbox.js';
import { createCalibrationRoutes } from './routes/calibration.js';
import { createAuditRoutes } from './routes/audit.js';
import { createImportRoutes } from './routes/import.js';
import { createBookRoutes } from './routes/book.js';
import { createSettingsRoutes, type RuntimeSettingsState } from './routes/settings.js';
import { createPublishRoutes } from './routes/publish.js';
import { PortfolioWorker, type WorkerQueueManager } from '@living-portfolio/worker';

export function createApp(
  customRepo?: IPortfolioRepository,
  options?: {
    config?: AppConfig;
    signingKey?: string;
    bootstrapAdminToken?: string;
    authStoragePath?: string;
    allowedOrigins?: string[];
    providers?: ModelProvider[];
    governor?: BudgetGovernor;
    metricsCollector?: MetricsCollector;
    notificationChannel?: NotificationChannel;
    databaseKind?: 'in-memory' | 'postgres' | 'dual-write';
    bundledWeb?: boolean;
    bundledWebAdapter?: (app: Hono, repo: IPortfolioRepository, runtimeState?: any, auth?: AuthManager) => void;
    worker?: PortfolioWorker;
    queueManager?: WorkerQueueManager;
  }
) {
  const app = new Hono();
  const cfg = options?.config ?? loadConfig();
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
  const governor = options?.governor ?? new BudgetGovernor({}, repo);
  const metricsCollector = options?.metricsCollector ?? new MetricsCollector();

  if (options?.notificationChannel) {
    const channel = options.notificationChannel;
    metricsCollector.setAlertListener((alert) => {
      channel.send({
        title: alert.code,
        message: alert.message,
        severity: alert.severity,
      }).catch(() => {});
    });
    governor.setAlertListener((alert) => {
      channel.send({
        title: alert.code,
        message: alert.message,
        severity: alert.severity,
      }).catch(() => {});
    });
  }

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
    storagePath: options?.authStoragePath,
  });

  const configuredOrigins = [
    ...cfg.SITE_ORIGIN.split(',').map((s: string) => s.trim()),
    ...cfg.ADMIN_ORIGIN.split(',').map((s: string) => s.trim()),
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
    calibration: {
      suggestion_thresholds: cfg.calibration?.suggestion_thresholds ?? false,
      routing_calibration: cfg.calibration?.routing_calibration ?? false,
      topology_audit: cfg.calibration?.topology_audit ?? true,
      scoped_constraint_mining: cfg.calibration?.scoped_constraint_mining ?? true,
    },
  };

  // Global middleware: logging, security headers + CSP (S5), origin-restricted CORS (S5), and observability metrics (§13.5, §13.9, OSR-21)
  app.use('*', logger());
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    metricsCollector.recordRequest(c.res.status, duration);
  });
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

  // Search engine indexing prevention (§6.4 item 2, OSR-19)
  if (cfg.DEPLOYMENT_CLASS === 'staging') {
    app.use('*', async (c, next) => {
      await next();
      c.header('X-Robots-Tag', 'noindex, nofollow');
    });
  }

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
      governor,
      metricsCollector,
      providers,
    }
  );
  const answerCache = new AnswerCache();
  const openApiDoc = buildOpenApiDocument();

  const worker =
    options?.worker ??
    new PortfolioWorker({
      repo,
      providers,
      governor,
    });

  // Canonical Versioned API Router (/api/v1, OSR-12 §4.1)
  const apiV1 = new Hono();

  // Public system & diagnostic endpoints
  apiV1.route('/health', healthRouter);
  apiV1.get('/openapi.json', (c) => c.json(openApiDoc));

  // Public & Authenticated Core Routes
  apiV1.route('/auth', createAuthRoutes(auth));
  apiV1.route('/entries', createEntriesRoutes(repo, auth, runtimeState, answerCache, worker));
  apiV1.route(
    '/ask',
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
  apiV1.route('/timeline', createTimelineRoutes(repo));
  apiV1.use('/publish/now', auth.requireAdminMiddleware());
  apiV1.use('/publish/enrich', auth.requireAdminMiddleware());
  apiV1.route('/publish', createPublishRoutes(worker, repo, options?.queueManager));

  // Admin-only routes protected by default-deny auth middleware (Fix 1 / S1, S2)
  apiV1.use('/structure/*', auth.requireAdminMiddleware());
  apiV1.use('/structure', auth.requireAdminMiddleware());
  apiV1.use('/inbox', auth.requireAdminMiddleware());
  apiV1.use('/inbox/*', auth.requireAdminMiddleware());
  apiV1.use('/calibration/*', auth.requireAdminMiddleware());
  apiV1.use('/calibration', auth.requireAdminMiddleware());
  apiV1.use('/audit/*', auth.requireAdminMiddleware());
  apiV1.use('/audit', auth.requireAdminMiddleware());
  if (cfg.DEPLOYMENT_CLASS === 'staging') {
    const stagingImportDisabled = (c: any) =>
      c.json(
        {
          error: 'Import and connector features are disabled in staging environment (synthetic data only).',
          code: 'STAGING_IMPORT_DISABLED',
        },
        403
      );
    apiV1.all('/import', stagingImportDisabled);
    apiV1.all('/import/*', stagingImportDisabled);
  } else {
    apiV1.use('/import/*', auth.requireAdminMiddleware());
    apiV1.use('/import', auth.requireAdminMiddleware());
  }

  apiV1.route('/structure', createStructureRoutes(repo, answerCache));
  apiV1.route('/inbox', createInboxRoutes(repo));
  apiV1.route('/calibration', createCalibrationRoutes(repo, runtimeState));
  apiV1.route('/audit', createAuditRoutes(repo, answerCache));
  apiV1.route('/import', createImportRoutes(repo, auth, cfg.DEPLOYMENT_CLASS));
  apiV1.use('/settings', auth.requireAdminMiddleware());
  apiV1.use('/settings/*', auth.requireAdminMiddleware());
  apiV1.route('/settings', createSettingsRoutes(repo, runtimeState, auth, governor, providers));

  // Consultation booking routes (§6.1, UX-11) - public POST, admin GET
  apiV1.use('/book', (c, next) => (c.req.method === 'GET' ? auth.requireAdminMiddleware()(c, next) : next()));
  apiV1.route('/book', createBookRoutes(repo));

  // Shadow verification & metrics endpoints (WP-2.4, Fix 8, Fix 10, OSR-15)
  apiV1.get('/admin/metrics/shadow', auth.requireAdminMiddleware(), (c) => {
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

  apiV1.post('/admin/metrics/shadow/reset', auth.requireAdminMiddleware(), (c) => {
    if (repo instanceof DualWritePortfolioRepository) {
      repo.resetShadowMetrics();
      return c.json({ ok: true, reset: true });
    }
    return c.json({ ok: false, message: 'Dual-write repository is not active.' }, 400);
  });

  apiV1.get('/admin/metrics/shadow/parity', auth.requireAdminMiddleware(), async (c) => {
    if (repo instanceof DualWritePortfolioRepository) {
      const parity = await repo.verifyParity();
      return c.json({ ok: true, parity });
    }
    return c.json({ ok: false, message: 'Dual-write repository is not active.' }, 400);
  });

  // Seed demo portfolio on demand (Admin-only, S1; disabled in production per OSR-04)
  apiV1.post('/seed', auth.requireAdminMiddleware(), async (c) => {
    if (cfg.DEPLOYMENT_CLASS === 'production') {
      return c.json({ error: 'Demo seeding is disabled in production (OSR-04).' }, 403);
    }
    await seedDemoPortfolio(repo);
    const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
    return c.json({ seeded: true, entriesCount: entries.length });
  });

  // Mount canonical versioned API at /api/v1 (OSR-12)
  app.route('/api/v1', apiV1);
  // Mount backward-compatible alias at /api during transition phase (OSR-12)
  app.route('/api', apiV1);

  // Root probes and OpenAPI specification endpoint
  app.route('/healthz', healthRouter);
  app.get('/openapi.json', (c) => c.json(openApiDoc));

  // Search engine crawler instructions (§6.4 item 2, OSR-19)
  app.get('/robots.txt', (c) => {
    if (cfg.DEPLOYMENT_CLASS === 'staging') {
      return c.text('User-agent: *\nDisallow: /\n', 200, {
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }
    return c.text('User-agent: *\nDisallow: /api/\n', 200, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
  });

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

  // Optional single-process convenience adapter (Spec §4.3, OSR-13)
  if (options?.bundledWeb && options?.bundledWebAdapter) {
    options.bundledWebAdapter(app, repo, runtimeState, auth);
  }

  // Root welcome (pure API contract when decoupled or content-negotiated via next())
  app.get('/', async (c) => {
    return c.json({
      name: `${cfg.PUBLIC_SITE_NAME} API`,
      version: '0.1.0-alpha.0',
      status: 'online',
      schema_version: 'qrxp_v1.0.0',
      docs: '/healthz',
      api_version: '/api/v1',
    });
  });

  return { app, repo, governor, mockProvider, providers, runtimeState, auth, adminToken, answerCache, metricsCollector, worker };
}
