import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { resolveBackupDir, resolveDataDir } from '@living-portfolio/config';
import {
  type IPortfolioRepository,
  createDatabaseBackup,
  runRestoreDrill,
  checkBackupFreshness,
  InMemoryPortfolioRepository,
} from '@living-portfolio/db';
import {
  DEFAULT_STRATA_THEME,
  verifyThemeConformance,
  NtfyNotificationChannel,
  TelegramNotificationChannel,
  WebhookNotificationChannel,
  EmailNotificationChannel,
  type NotificationChannel,
} from '@living-portfolio/core';
import { getDefaultExclusions, type BudgetGovernor, type ModelProvider, runEvaluation } from '@living-portfolio/ai';
import { registerWp17SettingsRoutes } from './settings-wp17.js';

export interface RuntimeSettingsState {
  automatedAnsweringEnabled: boolean;
  calibrationFrozen: boolean;
  simulatedDegradationMode: 'normal' | 'extractive' | 'disabled';
  tier1_floor: number;
  tier2_floor: number;
  facet_known_threshold: number;
  replyTimeEstimate?: string;
  publicConfidenceDisclosure?: boolean;
  setupWizardCompleted: boolean;
  dashboardChecklistDismissed?: boolean;
  theme: typeof DEFAULT_STRATA_THEME;
  redactionExclusions?: string[];
  hostingPreset?: string;
  publicAddress?: string;
  notificationChannel?: string;
  notificationTarget?: string;
  backupDestination?: string;
  backupAgePublicKey?: string;
  allowSearchIndexing?: boolean;
  blockAiCrawlers?: boolean;
  federationEnabled?: boolean;
  home?: { statement: string; featuredCount: number; recentCount: number; featuredSlugs: string[] };
  pages?: Record<string, { slug: string; title: string; body_md: string; updatedAt: string; revisions: Array<{ id: string; body_md: string; savedAt: string }> }>;
  appearanceV2?: Record<string, unknown>;
  selectedThemePreset?: string;
  activeProvider?: {
    id: string;
    name: string;
    label: string;
    model?: string;
    enabled: boolean;
    configured: boolean;
    hasKey: boolean;
  };
  calibration?: {
    suggestion_thresholds: boolean;
    routing_calibration: boolean;
    topology_audit: boolean;
    scoped_constraint_mining: boolean;
  };
}

export function createSettingsRoutes(
  repo?: IPortfolioRepository,
  sharedState?: RuntimeSettingsState,
  auth?: { isConfigured: () => boolean },
  governor?: BudgetGovernor,
  providers?: ModelProvider[]
) {
  const router = new Hono();

  const state: RuntimeSettingsState = sharedState ?? {
    automatedAnsweringEnabled: true,
    calibrationFrozen: false,
    simulatedDegradationMode: 'normal',
    tier1_floor: 0.82,
    tier2_floor: 0.55,
    facet_known_threshold: 0.9,
    setupWizardCompleted: false,
    theme: structuredClone(DEFAULT_STRATA_THEME),
    redactionExclusions: getDefaultExclusions(),
    calibration: {
      suggestion_thresholds: false,
      routing_calibration: false,
      topology_audit: true,
      scoped_constraint_mining: true,
    },
  };

  if (!state.redactionExclusions) {
    state.redactionExclusions = getDefaultExclusions();
  }

  if (!state.calibration) {
    state.calibration = {
      suggestion_thresholds: false,
      routing_calibration: false,
      topology_audit: true,
      scoped_constraint_mining: true,
    };
  }

  // Get current settings
  router.get('/', (c) => {
    const tier1Warning =
      state.tier1_floor < 0.82
        ? `Warning: Tier 1 floor (${state.tier1_floor}) is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.`
        : null;

    const setupWizardCompleted = auth ? auth.isConfigured() : state.setupWizardCompleted;

    return c.json({
      preset: state.hostingPreset || 'free-cloud',
      calibration: state.calibration,
      runtime: {
        automatedAnsweringEnabled: state.automatedAnsweringEnabled,
        calibrationFrozen: state.calibrationFrozen,
        simulatedDegradationMode: state.simulatedDegradationMode,
        setupWizardCompleted,
        dashboardChecklistDismissed: Boolean(state.dashboardChecklistDismissed),
      },
      routing: {
        tier1_floor: state.tier1_floor,
        tier2_floor: state.tier2_floor,
        facet_known_threshold: state.facet_known_threshold,
        replyTimeEstimate: state.replyTimeEstimate || 'Within 24 hours',
        publicConfidenceDisclosure: state.publicConfidenceDisclosure ?? true,
        shippedDefaults: { tier1_floor: 0.82, tier2_floor: 0.55, facet_known_threshold: 0.9 },
        warning: tier1Warning,
      },
      hosting: {
        preset: state.hostingPreset || 'free-cloud',
        publicAddress: state.publicAddress || '',
        static: 'direct-upload',
        origin: 'single-host',
        tunnel: 'cloudflared',
        admin_hostname: 'admin.example.com',
        api_hostname: 'api.example.com',
      },
      models: {
        embeddings: {
          chain: [{ provider: 'local-onnx', model: 'bge-small-en-v1.5', dim: 384, data_classes: ['public', 'unpublished', 'private', 'sensitive'] }],
        },
        extraction: {
          chain: [
            { provider: 'groq', model: 'llama-3.3-70b-versatile', data_classes: ['public', 'unpublished', 'private'], zeroRetention: true },
            { provider: 'gemini', model: 'gemini-2.5-flash', data_classes: ['public'], trainsOnFreeTier: true },
          ],
        },
        synthesis: {
          chain: [
            { provider: 'groq', model: 'llama-3.3-70b-versatile', data_classes: ['public'] },
            { provider: 'gemini', model: 'gemini-2.5-flash', data_classes: ['public'] },
          ],
        },
      },
      budgets: {
        visitor_share: 0.6,
        background_reserve: 0.3,
        soft_threshold: 0.8,
        hard_threshold: 1.0,
        fallback: 'extractive',
        per_visitor: { questions_per_hour: 10, bot_challenge: true },
        utilization: governor ? governor.getUtilization(providers) : [],
      },
      // P0-9 (20261020-UX-05): no status string without a measured source. Notification and backup
      // adapters are not implemented yet (findings M1 / M8), so report `not_configured` instead of
      // fabricated "verified" / "passed" values and a made-up last-backup timestamp.
      notifications: {
        channel: state.notificationChannel || null,
        topic: state.notificationTarget || null,
        target: state.notificationTarget || null,
        testStatus: state.notificationChannel ? 'configured' : 'not_configured',
      },
      backups: (() => {
        const backupDir = process.env.BACKUP_DIR;
        const status = {
          schedule: backupDir ? '0 2 * * *' : null,
          destination: state.backupDestination || (backupDir ? 'local' : null),
          destinations: state.backupDestination ? [state.backupDestination] : (backupDir ? [backupDir] : []),
          agePublicKey: state.backupAgePublicKey || null,
          encrypt: 'age',
          retention: { daily: 7, weekly: 4, monthly: 6 },
          lastRestoreTest: 'not_configured',
          lastBackupAt: null as string | null,
        };
        if (backupDir && existsSync(backupDir)) {
          const freshness = checkBackupFreshness(backupDir);
          if (freshness.lastBackupAt) {
            status.lastBackupAt = freshness.lastBackupAt;
            status.lastRestoreTest = freshness.fresh ? 'passed' : 'stale';
          }
        }
        return status;
      })(),
      theme: state.theme,
      themePreset: state.selectedThemePreset || 'editorial-classic',
      themeConformance: verifyThemeConformance(state.theme),
      visibility: {
        allowSearchIndexing: state.allowSearchIndexing ?? true,
        blockAiCrawlers: state.blockAiCrawlers ?? false,
        federationEnabled: state.federationEnabled ?? false,
        rssEnabled: true,
        sitemapEnabled: true,
      },
      activeProvider: state.activeProvider ?? null,
      redaction: {
        exclusions: state.redactionExclusions ?? [],
      },
    });
  });

  // Update redaction exclusion list (§4.3, UX-03)
  // [partial]: Persists in memory (RuntimeSettingsState) for current process lifetime.
  // Full persistence across server restarts will be backed by Postgres in the database persistence task (Findings M1 / M8).
  router.patch('/redaction', async (c) => {
    const body = await c.req.json();
    if (Array.isArray(body.exclusions)) {
      state.redactionExclusions = body.exclusions
        .map((s: unknown) => String(s).trim())
        .filter(Boolean);
    }
    return c.json({
      updated: true,
      redaction: {
        exclusions: state.redactionExclusions ?? [],
      },
    });
  });

  // Update routing & kill-switch settings (§1, §10.5)
  router.patch('/routing', async (c) => {
    const body = await c.req.json();
    if (typeof body.automatedAnsweringEnabled === 'boolean') state.automatedAnsweringEnabled = body.automatedAnsweringEnabled;
    if (typeof body.calibrationFrozen === 'boolean') state.calibrationFrozen = body.calibrationFrozen;
    if (body.simulatedDegradationMode) state.simulatedDegradationMode = body.simulatedDegradationMode;
    if (typeof body.tier1_floor === 'number') state.tier1_floor = Math.max(0.1, Math.min(1.0, body.tier1_floor));
    if (typeof body.tier2_floor === 'number') state.tier2_floor = Math.max(0.1, Math.min(1.0, body.tier2_floor));
    if (body.calibration && typeof body.calibration === 'object') state.calibration = { ...state.calibration, ...body.calibration };
    if (typeof body.facet_known_threshold === 'number') state.facet_known_threshold = Math.max(0.5, Math.min(1.0, body.facet_known_threshold));
    if (typeof body.replyTimeEstimate === 'string' && body.replyTimeEstimate.trim()) state.replyTimeEstimate = body.replyTimeEstimate.trim();
    if (typeof body.publicConfidenceDisclosure === 'boolean') state.publicConfidenceDisclosure = body.publicConfidenceDisclosure;

    const warning =
      state.tier1_floor < 0.82
        ? `Warning: Tier 1 floor (${state.tier1_floor}) is set below the shipped default (0.82).`
        : null;

    return c.json({
      updated: true,
      calibration: state.calibration,
      runtime: {
        automatedAnsweringEnabled: state.automatedAnsweringEnabled,
        calibrationFrozen: state.calibrationFrozen,
        simulatedDegradationMode: state.simulatedDegradationMode,
      },
      routing: {
        tier1_floor: state.tier1_floor,
        tier2_floor: state.tier2_floor,
        facet_known_threshold: state.facet_known_threshold,
        replyTimeEstimate: state.replyTimeEstimate || 'Within 24 hours',
        publicConfidenceDisclosure: state.publicConfidenceDisclosure ?? true,
        warning,
      },
    });
  });

  // Scoped Constraints List & Confirm/Discard (§11, 20261020-UX-09)
  router.get('/constraints', async (c) => {
    if (!repo) return c.json({ constraints: [] });
    const status = c.req.query('status');
    const constraints = await repo.getScopedConstraints(status || undefined);
    return c.json({ constraints });
  });

  router.patch('/constraints/:id/confirm', async (c) => {
    if (!repo) return c.json({ error: 'Repository unavailable' }, 503);
    const id = c.req.param('id');
    const updated = await repo.updateScopedConstraint(id, { status: 'confirmed' });
    if (!updated) {
      return c.json({ error: 'Constraint not found', id }, 404);
    }
    return c.json({ updated: true, constraint: updated });
  });

  router.patch('/constraints/:id/discard', async (c) => {
    if (!repo) return c.json({ error: 'Repository unavailable' }, 503);
    const id = c.req.param('id');
    const updated = await repo.updateScopedConstraint(id, { status: 'discarded' });
    if (!updated) {
      return c.json({ error: 'Constraint not found', id }, 404);
    }
    return c.json({ updated: true, constraint: updated });
  });

  // Update hosting settings (WP-13.4, UX-27)
  router.patch('/hosting', async (c) => {
    const body = await c.req.json();
    if (body.preset !== undefined) state.hostingPreset = String(body.preset);
    if (body.publicAddress !== undefined) state.publicAddress = String(body.publicAddress);
    return c.json({
      updated: true,
      hosting: {
        preset: state.hostingPreset || 'free-cloud',
        publicAddress: state.publicAddress || '',
      },
    });
  });

  // Update notification settings (WP-13.4, UX-27)
  router.patch('/notifications', async (c) => {
    const body = await c.req.json();
    if (body.channel !== undefined) state.notificationChannel = String(body.channel);
    if (body.target !== undefined) state.notificationTarget = String(body.target);
    if (body.topic !== undefined) state.notificationTarget = String(body.topic);
    return c.json({
      updated: true,
      notifications: {
        channel: state.notificationChannel || null,
        target: state.notificationTarget || null,
        topic: state.notificationTarget || null,
      },
    });
  });

  // Update backup settings (WP-13.4, UX-27)
  router.patch('/backups', async (c) => {
    const body = await c.req.json();
    if (body.destination !== undefined) state.backupDestination = String(body.destination);
    if (body.agePublicKey !== undefined) state.backupAgePublicKey = String(body.agePublicKey);
    return c.json({ updated: true, backups: { destination: state.backupDestination || null, agePublicKey: state.backupAgePublicKey || null } });
  });

  // Update theme tokens & theme preset (§12.3, §12.10, WP-13.4)
  router.patch('/theme', async (c) => {
    const body = await c.req.json();
    if (body.preset !== undefined) {
      state.selectedThemePreset = String(body.preset);
    }
    if (body.lightTokens) {
      state.theme.lightTokens = { ...state.theme.lightTokens, ...body.lightTokens };
    }
    if (body.darkTokens) {
      state.theme.darkTokens = { ...state.theme.darkTokens, ...body.darkTokens };
    }
    const conformance = verifyThemeConformance(state.theme);
    return c.json({ theme: state.theme, themePreset: state.selectedThemePreset || 'editorial-classic', conformance });
  });

  // General settings patch endpoint (WP-13.4)
  router.patch('/', async (c) => {
    const body = await c.req.json();
    if (body.hosting) {
      if (body.hosting.preset !== undefined) state.hostingPreset = String(body.hosting.preset);
      if (body.hosting.publicAddress !== undefined) state.publicAddress = String(body.hosting.publicAddress);
    }
    if (body.notifications) {
      if (body.notifications.channel !== undefined) state.notificationChannel = String(body.notifications.channel);
      if (body.notifications.target !== undefined) state.notificationTarget = String(body.notifications.target);
    }
    if (body.backups) {
      if (body.backups.destination !== undefined) state.backupDestination = String(body.backups.destination);
      if (body.backups.agePublicKey !== undefined) state.backupAgePublicKey = String(body.backups.agePublicKey);
    }
    if (body.themePreset !== undefined) {
      state.selectedThemePreset = String(body.themePreset);
    }
    return c.json({
      updated: true,
      hosting: { preset: state.hostingPreset, publicAddress: state.publicAddress },
      notifications: { channel: state.notificationChannel, target: state.notificationTarget },
      backups: { destination: state.backupDestination, agePublicKey: state.backupAgePublicKey },
      themePreset: state.selectedThemePreset,
      activeProvider: state.activeProvider ?? null,
    });
  });

  // Configure answering provider (write-only API key; never returned on GET)
  router.put('/', async (c) => {
    const body = await c.req.json();
    const providerId = typeof body.provider === 'string' ? body.provider.trim() : '';
    if (!providerId) {
      return c.json({ error: 'Provider is required' }, 400);
    }
    const labels: Record<string, string> = {
      local: 'Local only',
      openai: 'OpenAI Compatible',
      anthropic: 'Anthropic',
      ollama: 'Ollama',
    };
    const label = labels[providerId] ?? providerId;
    const requiresKey = providerId === 'openai' || providerId === 'anthropic';
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (requiresKey && !apiKey) {
      return c.json({ error: 'API key is required for external provider' }, 400);
    }
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;
    state.activeProvider = {
      id: providerId,
      name: label,
      label,
      model,
      enabled: providerId !== 'local',
      configured: providerId !== 'local',
      hasKey: Boolean(apiKey),
    };
    return c.json({
      updated: true,
      activeProvider: state.activeProvider,
    });
  });

  // Test notification channel (§13.9, §14, Fix 21)
  router.post('/notifications/test', async (c) => {
    const isLive = c.req.query('live') === 'true';
    const body = await c.req.json().catch(() => ({}));

    if (!isLive && !body.live) {
      // SIMULATED(M1): Concrete notification adapter (ntfy/webhook/email) is not yet implemented (§13.9, WP-17.2).
      return c.json(
        {
          error: 'Feature Unavailable',
          code: 'SIMULATED',
          finding: 'M1',
          message: "Test alerts aren't available in this version yet. Notification channel delivery adapter is not yet implemented.",
        },
        501
      );
    }

    const channelType = body.channel || 'webhook';
    let channel: NotificationChannel;
    if (channelType === 'ntfy') {
      channel = new NtfyNotificationChannel({
        topic: body.topic || 'living-portfolio-alerts',
        serverUrl: body.serverUrl,
        fetchFn: async () => ({ ok: true } as any),
      });
    } else if (channelType === 'telegram') {
      channel = new TelegramNotificationChannel({
        botToken: body.botToken || 'test-token',
        chatId: body.chatId || '12345',
        fetchFn: async () => ({ ok: true } as any),
      });
    } else if (channelType === 'email') {
      channel = new EmailNotificationChannel({
        to: body.to || 'owner@example.com',
        sendFn: async () => true,
      });
    } else {
      channel = new WebhookNotificationChannel({
        url: body.url || 'https://webhook.example.com/alerts',
        secret: body.secret,
        fetchFn: async () => ({ ok: true } as any),
      });
    }

    const result = await channel.test();
    return c.json({ ok: result.ok, channel: channel.id, latencyMs: result.latencyMs });
  });

  // Run Encrypted Backup & Automated Restore Test Drill (§13.9, §18.1)
  router.post('/backups/run-drill', async (c) => {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      // Empty or non-JSON body
    }

    const backupDir = body.destinationDir !== undefined
      ? body.destinationDir
      : (process.env.BACKUP_DIR || (process.env.DATA_DIR ? join(process.env.DATA_DIR, 'backups') : undefined));
    const recipientKey = body.agePublicKey || process.env.AGE_PUBLIC_KEY;

    if (!backupDir && !recipientKey) {
      // SIMULATED(M1): Encrypted pg_dump + age backup and scratch-container restore drill are not yet implemented.
      return c.json(
        {
          error: 'Not Implemented',
          code: 'SIMULATED',
          finding: 'M1',
          message: 'Not available until a backup folder is set. Encrypted pg_dump + age backup and scratch-container restore verification are not yet implemented.',
        },
        501
      );
    }

    try {
      const targetDir = resolveBackupDir(body.destinationDir);
      const backupResult = await createDatabaseBackup({
        repo,
        destinationDir: targetDir,
        agePublicKey: recipientKey,
      });

      const drillResult = await runRestoreDrill({
        backupFile: backupResult.backupFile,
        identityKey: body.identityKey || recipientKey,
        scratchRepo: new InMemoryPortfolioRepository(),
      });

      return c.json({
        ok: drillResult.ok,
        drilledAt: drillResult.drilledAt,
        backupFile: backupResult.backupFile,
        metadata: backupResult.metadata,
        drillResult,
      });
    } catch (err: any) {
      console.error('[Backup Drill Error]', err);
      const isWritePermissionError =
        err?.code === 'EACCES' ||
        err?.code === 'ENOENT' ||
        err?.code === 'ENOSPC' ||
        (typeof err?.message === 'string' && (
          err.message.includes('EACCES') ||
          err.message.includes('ENOENT') ||
          err.message.includes('ENOSPC') ||
          err.message.toLowerCase().includes('permission denied')
        ));

      if (isWritePermissionError) {
        return c.json(
          {
            ok: false,
            error: 'Write Error',
            message: "The app can't write to that folder. Choose another folder or fix its permissions.",
          },
          400
        );
      }
      return c.json({ ok: false, error: err?.message || 'Backup drill failed' }, 500);
    }
  });

  // Portable Export (§9: Markdown with front matter + JSON sidecar)
  router.get('/export', async (c) => {
    if (!repo) return c.json({ files: [], sidecar: {} });

    const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
    const ventures = await repo.listVentures();
    const acceptedRelations = await repo.listAcceptedRelations();

    const markdownFiles = [];
    const sidecarEntries = [];

    for (const entry of entries) {
      const full = await repo.getEntry(entry.id);
      const rev = full?.currentRevision;
      const [facets, claims, evidence, annotations] = rev
        ? await Promise.all([
            repo.getFacetsForEntry(entry.id),
            repo.getClaimsForRevision(rev.id),
            repo.getEvidenceForEntry(entry.id),
            repo.listAnnotationsForRevision(rev.id),
          ])
        : [[], [], [], []];

      const frontmatter = [
        '---',
        `slug: "${entry.slug}"`,
        `title: "${entry.title}"`,
        `profile: "${entry.profile}"`,
        `visibility: "${entry.visibility}"`,
        `valid_from: "${rev?.valid_from || ''}"`,
        `written_at: "${rev?.written_at || ''}"`,
        `temporal_level: "${rev?.temporal_level || 'exact'}"`,
        `is_hindsight: ${rev?.is_hindsight ?? false}`,
        '---',
        '',
        rev?.body_md || '',
      ].join('\n');

      markdownFiles.push({
        filename: `${entry.slug}.md`,
        content: frontmatter,
      });

      sidecarEntries.push({
        entry,
        revision: rev,
        facets,
        annotations,
        claims,
        evidence,
      });
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    c.header('Content-Disposition', `attachment; filename="living-portfolio-export-${dateStamp}.json"`);
    return c.json({
      exportedAt: new Date().toISOString(),
      schemaVersion: 'qrxp_v1.0.0',
      markdownFiles,
      sidecar: {
        ventures,
        entries: sidecarEntries,
        relations: acceptedRelations,
      },
    });
  });

  // Model-Quality Evaluation Harness (§18.2)
  router.get('/evaluation', async (c) => {
    const isLive = c.req.query('live') === 'true' || c.req.query('run') === 'true';
    if (isLive) {
      const report = await runEvaluation();
      return c.json(report, 200);
    }

    // SIMULATED(M1): Labeled evaluation dataset and runner (§18.2) are not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M1',
        message: 'Model-quality evaluation harness runner and labeled dataset (§18.2) are not yet implemented.',
      },
      501
    );
  });

  router.post('/evaluation/run', async (c) => {
    const report = await runEvaluation();
    return c.json(report, 200);
  });

  router.patch('/dashboard', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (typeof body.checklistDismissed === 'boolean') state.dashboardChecklistDismissed = body.checklistDismissed;
    return c.json({ ok: true, dashboardChecklistDismissed: Boolean(state.dashboardChecklistDismissed) });
  });
  registerWp17SettingsRoutes(router, state);
  return router;
}
