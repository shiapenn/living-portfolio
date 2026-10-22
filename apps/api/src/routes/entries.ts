import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  chunkMarkdown,
  computeStructureLevel,
  detectLaterThinking,
  generateGapQuestions,
  getProfile,
  getStructureLevelDetails,
  reanchorSpan,
  EntryCreateSchema,
  EntryUpdateSchema,
  RevisionCreateSchema,
} from '@living-portfolio/core';
import { scanForConfidentialData } from '@living-portfolio/ai';
import { AuthManager, sha256Hex } from '../auth/security.js';
import type { RuntimeSettingsState } from './settings.js';

export function createEntriesRoutes(
  repo: IPortfolioRepository,
  auth: AuthManager,
  settingsState?: RuntimeSettingsState
) {
  const router = new Hono();

  // List entries with computed structure levels and facets
  router.get('/', async (c) => {
    const visibilityQuery = c.req.query('visibility');
    const ventureId = c.req.query('venture_id');

    let visibility: ('private' | 'unlisted' | 'public')[] = ['public'];
    if (visibilityQuery) {
      const requested =
        visibilityQuery === 'all'
          ? (['private', 'unlisted', 'public'] as const)
          : (visibilityQuery.split(',').map((v) => v.trim()) as ('private' | 'unlisted' | 'public')[]);

      const requestsNonPublic = requested.some((v) => v !== 'public');
      if (requestsNonPublic && !auth.isAdminAuthenticated(c).authenticated) {
        return c.json({ error: 'Unauthorized: admin authentication required for non-public visibility filter' }, 401);
      }
      visibility = [...requested];
    }

    const rawEntries = await repo.listEntries({ visibility, venture_id: ventureId });
    const acceptedRelations = await repo.listAcceptedRelations();

    const entries = await Promise.all(
      rawEntries.map(async (entry) => {
        const full = await repo.getEntry(entry.id, visibility);
        const currentRevision = full?.currentRevision ?? null;
        const profile = getProfile(entry.profile);
        const [facets, annotations, claims, evidence] = currentRevision
          ? await Promise.all([
              repo.getFacetsForEntry(entry.id),
              repo.listAnnotationsForRevision(currentRevision.id),
              repo.getClaimsForRevision(currentRevision.id),
              repo.getEvidenceForEntry(entry.id),
            ])
          : [[], [], [], []];

        const structureLevel = currentRevision
          ? computeStructureLevel({
              revision: currentRevision,
              profile,
              facets,
              annotations,
              claims,
            })
          : 'L0';

        const laterThinkingAlerts = detectLaterThinking(
          claims.map((cl) => ({ ...cl, entry_id: entry.id, entry_slug: entry.slug })),
          acceptedRelations
        );

        return {
          ...entry,
          revision: currentRevision,
          facets,
          claims,
          evidence,
          structureLevel,
          laterThinkingAlerts,
        };
      })
    );

    return c.json({ entries });
  });

  // Redaction preview & signed confirmation token issuer (Protected admin route, C.4)
  router.post('/redaction-preview', auth.requireAdminMiddleware(), async (c) => {
    const { entryId, text, exclusions } = await c.req.json();
    if (typeof text !== 'string') {
      return c.json({ error: 'Text string required' }, 400);
    }
    const effectiveExclusions = Array.isArray(exclusions)
      ? exclusions
      : (settingsState?.redactionExclusions ?? undefined);
    const warnings = scanForConfidentialData(text, effectiveExclusions);
    const state = warnings.length === 0 ? 'clean' : 'needs review';
    const { token, payload } = auth.issueRedactionPreviewToken({
      entryId: typeof entryId === 'string' && entryId ? entryId : 'draft',
      bodyMd: text,
      warnings,
    });
    return c.json({
      state,
      clean: warnings.length === 0,
      warnings,
      exclusionsMatched: warnings.filter((w) => w.type === 'exclusion' || w.type === 'client'),
      redactionPreviewToken: token,
      tokenPayload: payload,
    });
  });

  // Get entry by slug (Structural visibility enforcement: S1, S2)
  router.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const isAdmin = auth.isAdminAuthenticated(c).authenticated;

    if (!isAdmin) {
      const unguarded = await repo.getEntryBySlug(slug);
      if (!unguarded || !unguarded.currentRevision) {
        return c.json({ error: 'Entry not found' }, 404);
      }
      if (unguarded.entry.visibility === 'private') {
        return c.json({ error: 'Unauthorized: private entry requires admin authentication' }, 401);
      }
    }

    const allowedVisibilities: ('private' | 'unlisted' | 'public')[] = isAdmin
      ? ['private', 'unlisted', 'public']
      : ['public', 'unlisted'];
    const result = await repo.getEntryBySlug(slug, allowedVisibilities);

    if (!result || !result.currentRevision) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    const { entry, currentRevision } = result;
    const profile = getProfile(entry.profile);

    const [spans, facets, claims, evidence, revisions] = await Promise.all([
      repo.getSpans(currentRevision.id),
      repo.getFacetsForEntry(entry.id),
      repo.getClaimsForRevision(currentRevision.id),
      repo.getEvidenceForEntry(entry.id),
      repo.getRevisions(entry.id),
    ]);

    const annotations = await repo.listAnnotationsForRevision(currentRevision.id);
    const acceptedRelations = await repo.listAcceptedRelations();

    const structureLevel = computeStructureLevel({
      revision: currentRevision,
      profile,
      facets,
      annotations,
      claims,
    });
    const levelDetails = getStructureLevelDetails(structureLevel);

    const gapQuestions = generateGapQuestions({
      revision: currentRevision,
      facets,
      claims,
    });

    const laterThinkingAlerts = detectLaterThinking(
      claims.map((cl) => ({ ...cl, entry_id: entry.id, entry_slug: entry.slug })),
      acceptedRelations
    );

    return c.json({
      entry,
      revision: currentRevision,
      revisions,
      spans,
      annotations,
      facets,
      claims,
      evidence,
      structureLevel,
      levelDetails,
      gapQuestions,
      laterThinkingAlerts,
    });
  });

  // Create entry (Admin-only L0 Markdown ingest)
  router.post('/', auth.requireAdminMiddleware(), async (c) => {
    const body = await c.req.json();
    const parsed = EntryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const data = parsed.data;

    // Server-side publish gate (UX P0-3, Fix 2 / S2): public entries require a valid signed redactionPreviewToken
    if (data.visibility === 'public') {
      const effectiveExclusions = settingsState?.redactionExclusions;
      const warnings = scanForConfidentialData(data.body_md, effectiveExclusions);
      const tokenCheck = auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: 'draft',
        bodyMd: data.body_md,
        warnings,
      });
      if (!tokenCheck.valid) {
        return c.json(
          {
            error: 'Redaction preview confirmation required before publishing as public',
            reason: tokenCheck.reason,
          },
          400
        );
      }

      // Mandatory NDA question (§4.3, UX P0-3): if warnings or confidential terms are detected,
      // nda_confirmed must be explicitly true.
      if (warnings.length > 0 && body.nda_confirmed !== true) {
        return c.json(
          {
            error: 'Confidentiality & NDA confirmation required when potential secrets or exclusions are flagged before publishing as public',
            warningsCount: warnings.length,
          },
          400
        );
      }
    }

    const bodyHash = sha256Hex(data.body_md);

    const { entry, revision } = await repo.createEntry(
      {
        slug: data.slug,
        title: body.title || data.slug.replace(/-/g, ' '),
        profile: data.profile,
        view: data.view,
        visibility: data.visibility,
        venture_id: data.venture_id,
        current_revision_id: null,
      },
      {
        body_md: data.body_md,
        body_hash: bodyHash,
        temporal_level: data.temporal_level,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        valid_from_range_end: data.valid_from_range_end,
        is_hindsight: data.is_hindsight,
      }
    );

    const chunks = chunkMarkdown(revision.id, data.body_md);
    const savedSpans = await repo.saveSpans(chunks);
    const redactionWarnings = scanForConfidentialData(data.body_md, settingsState?.redactionExclusions);
    const { token: redactionPreviewToken } = auth.issueRedactionPreviewToken({
      entryId: entry.id,
      bodyMd: data.body_md,
      warnings: redactionWarnings,
    });

    return c.json(
      {
        entry,
        revision,
        spansCount: savedSpans.length,
        redactionWarnings,
        redactionPreviewToken,
      },
      201
    );
  });

  // Update entry metadata (Admin-only; visibility transition to public requires signed redaction token per Fix 2 & C.4)
  router.put('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') || '';
    const body = await c.req.json();
    const parsed = EntryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const existing = await repo.getEntry(id, ['private', 'unlisted', 'public']);
    if (!existing || !existing.currentRevision) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    if (parsed.data.visibility === 'public' && existing.entry.visibility !== 'public') {
      const currentBody = existing.currentRevision.body_md;
      const effectiveExclusions = settingsState?.redactionExclusions;
      const warnings = scanForConfidentialData(currentBody, effectiveExclusions);
      const tokenCheck = auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: id,
        bodyMd: currentBody,
        warnings,
      });
      if (!tokenCheck.valid) {
        return c.json(
          {
            error: 'Redaction preview confirmation required before changing visibility to public',
            reason: tokenCheck.reason,
          },
          400
        );
      }

      // Mandatory NDA question (§4.3, UX P0-3): if warnings or confidential terms are detected,
      // nda_confirmed must be explicitly true.
      if (warnings.length > 0 && body.nda_confirmed !== true) {
        return c.json(
          {
            error: 'Confidentiality & NDA confirmation required when potential secrets or exclusions are flagged before changing visibility to public',
            warningsCount: warnings.length,
          },
          400
        );
      }
    }

    const updatedEntry = await repo.updateEntry(id, {
      ...parsed.data,
      ...(body.title ? { title: body.title } : {}),
    });
    if (!updatedEntry) return c.json({ error: 'Entry not found' }, 404);

    return c.json({ entry: updatedEntry });
  });

  // Delete entry and all derived records (§15 Deletion, Admin-only)
  router.delete('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') || '';
    const existing = await repo.getEntry(id, ['private', 'unlisted', 'public']);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    const report = await repo.deleteEntry(id);
    return c.json({
      deleted: true,
      entryId: id,
      slug: existing.entry.slug,
      report,
    });
  });

  // Create new revision for entry (Admin-only, immutable revision with span re-anchoring)
  router.post('/:id/revisions', auth.requireAdminMiddleware(), async (c) => {
    const entryId = c.req.param('id') || '';
    const body = await c.req.json();
    const parsed = RevisionCreateSchema.safeParse({ ...body, entry_id: entryId });

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const existing = await repo.getEntry(entryId, ['private', 'unlisted', 'public']);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    const oldRev = existing.currentRevision;
    const oldSpans = oldRev ? await repo.getSpans(oldRev.id) : [];

    const bodyHash = sha256Hex(data.body_md);
    const newRevision = await repo.createRevision(entryId, {
      body_md: data.body_md,
      body_hash: bodyHash,
      temporal_level: data.temporal_level,
      valid_from: data.valid_from,
      valid_to: data.valid_to,
      valid_from_range_end: data.valid_from_range_end,
      is_hindsight: data.is_hindsight,
    });

    const newChunks = chunkMarkdown(newRevision.id, data.body_md);
    const savedNewSpans = await repo.saveSpans(newChunks);

    const reanchorResults = [];
    if (oldRev) {
      const oldAnnotations = await repo.listAnnotationsForRevision(oldRev.id);
      for (const ann of oldAnnotations) {
        const oldSpan = oldSpans.find((s) => s.id === ann.span_id);
        if (oldSpan) {
          const match = reanchorSpan(oldSpan, data.body_md);
          if (match.found) {
            const matchingNewSpan =
              savedNewSpans.find((s) => s.start_off <= match.start_off && s.end_off >= match.end_off) ||
              savedNewSpans[0];

            if (matchingNewSpan) {
              await repo.saveAnnotation({
                span_id: matchingNewSpan.id,
                role: ann.role,
                profile: ann.profile,
                source: ann.source,
                status: ann.status,
                confidence: ann.confidence,
              });
              reanchorResults.push({ annotationId: ann.id, reanchored: true });
            }
          } else {
            reanchorResults.push({ annotationId: ann.id, reanchored: false, reason: 'Context altered significantly' });
          }
        }
      }
    }

    return c.json(
      {
        revision: newRevision,
        spans: savedNewSpans,
        reanchorSummary: reanchorResults,
      },
      201
    );
  });

  return router;
}
