import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { DEFAULT_STRATA_THEME, verifyThemeConformance } from '@living-portfolio/core';
import { getDefaultExclusions } from '@living-portfolio/ai';

export interface RuntimeSettingsState {
  automatedAnsweringEnabled: boolean;
  calibrationFrozen: boolean;
  simulatedDegradationMode: 'normal' | 'extractive' | 'disabled';
  tier1_floor: number;
  tier2_floor: number;
  facet_known_threshold: number;
  setupWizardCompleted: boolean;
  theme: typeof DEFAULT_STRATA_THEME;
  redactionExclusions?: string[];
}

export function createSettingsRoutes(
  repo?: IPortfolioRepository,
  sharedState?: RuntimeSettingsState,
  auth?: { isConfigured: () => boolean }
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
  };

  if (!state.redactionExclusions) {
    state.redactionExclusions = getDefaultExclusions();
  }

  // Get current settings
  router.get('/', (c) => {
    const tier1Warning =
      state.tier1_floor < 0.82
        ? `Warning: Tier 1 floor (${state.tier1_floor}) is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.`
        : null;

    const setupWizardCompleted = auth ? auth.isConfigured() : state.setupWizardCompleted;

    return c.json({
      preset: 'free-cloud',
      runtime: {
        automatedAnsweringEnabled: state.automatedAnsweringEnabled,
        calibrationFrozen: state.calibrationFrozen,
        simulatedDegradationMode: state.simulatedDegradationMode,
        setupWizardCompleted,
      },
      routing: {
        tier1_floor: state.tier1_floor,
        tier2_floor: state.tier2_floor,
        facet_known_threshold: state.facet_known_threshold,
        shippedDefaults: { tier1_floor: 0.82, tier2_floor: 0.55, facet_known_threshold: 0.9 },
        warning: tier1Warning,
      },
      hosting: {
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
      },
      // P0-9 (20261020-UX-05): no status string without a measured source. Notification and backup
      // adapters are not implemented yet (findings M1 / M8), so report `not_configured` instead of
      // fabricated "verified" / "passed" values and a made-up last-backup timestamp.
      notifications: {
        channel: null,
        topic: null,
        testStatus: 'not_configured',
      },
      backups: {
        schedule: null,
        destinations: [],
        encrypt: 'age',
        retention: { daily: 7, weekly: 4, monthly: 6 },
        lastRestoreTest: 'not_configured',
        lastBackupAt: null,
      },
      theme: state.theme,
      themeConformance: verifyThemeConformance(state.theme),
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
    if (typeof body.automatedAnsweringEnabled === 'boolean') {
      state.automatedAnsweringEnabled = body.automatedAnsweringEnabled;
    }
    if (typeof body.calibrationFrozen === 'boolean') {
      state.calibrationFrozen = body.calibrationFrozen;
    }
    if (body.simulatedDegradationMode) {
      state.simulatedDegradationMode = body.simulatedDegradationMode;
    }
    if (typeof body.tier1_floor === 'number') {
      state.tier1_floor = Math.max(0.1, Math.min(1.0, body.tier1_floor));
    }
    if (typeof body.tier2_floor === 'number') {
      state.tier2_floor = Math.max(0.1, Math.min(1.0, body.tier2_floor));
    }
    if (typeof body.facet_known_threshold === 'number') {
      state.facet_known_threshold = Math.max(0.5, Math.min(1.0, body.facet_known_threshold));
    }

    const warning =
      state.tier1_floor < 0.82
        ? `Warning: Tier 1 floor (${state.tier1_floor}) is set below the shipped default (0.82).`
        : null;

    return c.json({
      updated: true,
      runtime: {
        automatedAnsweringEnabled: state.automatedAnsweringEnabled,
        calibrationFrozen: state.calibrationFrozen,
        simulatedDegradationMode: state.simulatedDegradationMode,
      },
      routing: {
        tier1_floor: state.tier1_floor,
        tier2_floor: state.tier2_floor,
        facet_known_threshold: state.facet_known_threshold,
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

  // Update theme tokens (§12.3, §12.10)
  router.patch('/theme', async (c) => {
    const body = await c.req.json();
    if (body.lightTokens) {
      state.theme.lightTokens = { ...state.theme.lightTokens, ...body.lightTokens };
    }
    if (body.darkTokens) {
      state.theme.darkTokens = { ...state.theme.darkTokens, ...body.darkTokens };
    }
    const conformance = verifyThemeConformance(state.theme);
    return c.json({ theme: state.theme, conformance });
  });

  // Test notification channel
  router.post('/notifications/test', async (c) => {
    // SIMULATED(M1): Concrete notification adapter (ntfy/webhook/email) is not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M1',
        message: 'Notification channel delivery adapter is not yet implemented.',
      },
      501
    );
  });

  // Run Encrypted Backup & Automated Restore Test Drill (§13.9, §18.1)
  router.post('/backups/run-drill', async (c) => {
    // SIMULATED(M1): Encrypted pg_dump + age backup and scratch-container restore drill are not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M1',
        message: 'Encrypted pg_dump + age backup and scratch-container restore verification are not yet implemented.',
      },
      501
    );
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
  router.get('/evaluation', (c) => {
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

  return router;
}
