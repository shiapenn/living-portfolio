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
import { scanForConfidentialData, extractEntitiesMultiPass, type AnswerCache } from '@living-portfolio/ai';
import type { PortfolioWorker } from '@living-portfolio/worker';
import { AuthManager, sha256Hex } from '../auth/security.js';
import type { RuntimeSettingsState } from './settings.js';

export function createEntriesRoutes(
  repo: IPortfolioRepository,
  auth: AuthManager,
  settingsState?: RuntimeSettingsState,
  answerCache?: AnswerCache,
  worker?: PortfolioWorker
) {
  const router = new Hono();

  // List entries with computed structure levels and facets
  router.get('/', async (c) => {
    const visibilityQuery = c.req.query('visibility');
    const ventureId = c.req.query('venture_id');
    const typeFilter = c.req.query('type');
    const searchQuery = (c.req.query('q') || '').trim().toLowerCase();
    const pageParam = c.req.query('page');
    const limitParam = c.req.query('limit');
    const hasPagination = Boolean(pageParam || limitParam);
    const page = Math.max(1, Number.parseInt(pageParam || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam || '20', 10) || 20));

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
    const filteredEntries = rawEntries.filter((entry) => {
      if (typeFilter && typeFilter !== 'all' && entry.profile !== typeFilter) return false;
      if (searchQuery) {
        const haystack = `${entry.title || ''} ${entry.slug || ''} ${entry.id}`.toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
      return true;
    });
    const total = filteredEntries.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const targetEntries = hasPagination
      ? filteredEntries.slice((page - 1) * limit, page * limit)
      : filteredEntries;
    const acceptedRelations = await repo.listAcceptedRelations();

    const entries = await Promise.all(
      targetEntries.map(async (entry) => {
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

    if (hasPagination) {
      return c.json({ entries, total, page, limit, totalPages });
    }
    return c.json({ entries });
  });

  // Redaction preview & signed confirmation token issuer (Protected admin route, C.4)
  router.post('/redaction-preview', auth.requireAdminMiddleware(), async (c) => {
    const { entryId, text, exclusions } = await c.req.json();
    if (typeof text !== 'string') {
      return c.json({ error: 'Text string required' }, 400);
    }
    const cleanText = text.trim();
    const effectiveExclusions = Array.isArray(exclusions)
      ? exclusions
      : (settingsState?.redactionExclusions ?? undefined);
    const multiPass = extractEntitiesMultiPass(cleanText, effectiveExclusions);
    const warnings = multiPass.allWarnings;
    const state = warnings.length === 0 ? 'clean' : 'needs review';
    const { token, payload } = auth.issueRedactionPreviewToken({
      entryId: typeof entryId === 'string' && entryId ? entryId : 'draft',
      bodyMd: cleanText,
      warnings,
    });
    return c.json({
      state,
      clean: warnings.length === 0,
      warnings,
      multiPass,
      exclusionsMatched: warnings.filter((w) => w.type === 'exclusion' || w.type === 'client'),
      redactionPreviewToken: token,
      tokenPayload: payload,
    });
  });

  // Quick log capture route (§4.4, §10.3, 20261020-UX-07)
  router.post('/quick-log', auth.requireAdminMiddleware(), async (c) => {
    const body = await c.req.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return c.json({ error: 'Text content is required for quick log' }, 400);
    }
    const firstLine = text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60).trim();
    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : firstLine || `Quick Log: ${new Date().toISOString().slice(0, 10)}`;
    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim()
      : `quick-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { entry, revision } = await repo.createEntry(
      {
        slug,
        title,
        profile: body.profile || 'case-study',
        view: 'article',
        visibility: 'private',
        venture_id: null,
        current_revision_id: null,
      },
      {
        body_md: text,
        body_hash: sha256Hex(text),
        temporal_level: 'exact',
        valid_from: new Date().toISOString(),
        valid_to: null,
        is_hindsight: false,
      }
    );

    const chunks = chunkMarkdown(revision.id, text);
    await repo.saveSpans(chunks);

    return c.json({ entry, revision, chunksCount: chunks.length }, 201);
  });

  // Get entry by slug or ID (Structural visibility enforcement: S1, S2, UX-04)
  router.get('/:slug', async (c) => {
    const slugOrId = c.req.param('slug');
    const isAdmin = auth.isAdminAuthenticated(c).authenticated;

    let unguarded = await repo.getEntryBySlug(slugOrId);
    if (!unguarded) {
      unguarded = await repo.getEntry(slugOrId);
    }

    if (!isAdmin) {
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
    let result = await repo.getEntryBySlug(slugOrId, allowedVisibilities);
    if (!result) {
      result = await repo.getEntry(slugOrId, allowedVisibilities);
    }

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
      currentRevision,
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
      return c.json({
        error: 'Validation failed',
        message: "Couldn't save entry. Fix the highlighted fields and retry.",
        details: parsed.error.issues,
      }, 400);
    }

    const data = parsed.data;

    // Reject duplicate slugs (Spec §3.11, §9, P6)
    const existingSlug = await repo.getEntryBySlug(data.slug);
    if (existingSlug) {
      return c.json({ error: `Entry with slug '${data.slug}' already exists` }, 409);
    }

    // Server-side publish gate (UX P0-3, Fix 2 / S2, WP-14.8): public entries require a valid signed redactionPreviewToken
    if (data.visibility === 'public') {
      const effectiveExclusions = settingsState?.redactionExclusions;
      const warnings = scanForConfidentialData(data.body_md.trim(), effectiveExclusions);
      const tokenCheck = auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: 'draft',
        bodyMd: data.body_md,
        warnings,
        consume: false,
      });
      if (!tokenCheck.valid) {
        return c.json(
          {
            error: 'Redaction preview confirmation required before publishing as public',
            message: 'Check this entry for private details before making it public.',
            reason: tokenCheck.reason || 'Run the redaction check before publishing as public.',
          },
          400
        );
      }

      // Mandatory NDA question (Spec §4.3, §15, UX P0-3):
      // Definition: `nda_confirmed` asserts that the author has reviewed any flagged confidential items, client names, or secrets and confirms that publishing this content does not violate any non-disclosure agreement (NDA) or confidentiality obligation.
      // Gate behavior: Citing Spec §4.3 (redaction preview asks whether any flagged item is under NDA) and Spec §15 (human preview & confirmation is the consent mechanism for potentially sensitive content), the publication gate requires `nda_confirmed === true` when warnings exist (`warnings.length > 0`). Clean content without flagged warnings does not require explicit confirmation.
      if (warnings.length > 0 && body.nda_confirmed !== true) {
        return c.json(
          {
            error: 'Confidentiality & NDA confirmation required when potential secrets or exclusions are flagged before publishing as public',
            warningsCount: warnings.length,
          },
          400
        );
      }

      auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: 'draft',
        bodyMd: data.body_md,
        warnings,
        consume: true,
      });
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
    const redactionWarnings = scanForConfidentialData(data.body_md.trim(), settingsState?.redactionExclusions);
    const redactionPreviewToken =
      data.visibility === 'public'
        ? auth.issueRedactionPreviewToken({
            entryId: entry.id,
            bodyMd: data.body_md.trim(),
            warnings: redactionWarnings,
          }).token
        : undefined;

    let enrichmentQueued = false;
    if (data.visibility === 'public' && worker) {
      enrichmentQueued = true;
      worker.runEnrichJob(entry.id, revision.id).catch((err) => {
        console.error(`[Entries] Auto background enrichment failed for ${entry.id}:`, err);
      });
      worker.runPublishStaticSiteJob({ forceNow: false }).catch((err) => {
        console.error(`[Entries] Debounced static rebuild trigger failed for ${entry.id}:`, err);
      });
    }

    return c.json(
      {
        entry,
        revision,
        spansCount: savedSpans.length,
        redactionWarnings,
        redactionPreviewToken,
        enrichmentQueued,
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
      return c.json({
        error: 'Validation failed',
        message: "Couldn't save entry. Fix the highlighted fields and retry.",
        details: parsed.error.issues,
      }, 400);
    }

    const existing = await repo.getEntry(id, ['private', 'unlisted', 'public']);
    if (!existing || !existing.currentRevision) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    if (parsed.data.visibility === 'public' && existing.entry.visibility !== 'public') {
      const currentBody = existing.currentRevision.body_md;
      const effectiveExclusions = settingsState?.redactionExclusions;
      const warnings = scanForConfidentialData(currentBody.trim(), effectiveExclusions);
      const tokenCheck = auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: id,
        bodyMd: currentBody,
        warnings,
        consume: false,
      });
      if (!tokenCheck.valid) {
        return c.json(
          {
            error: 'Redaction preview confirmation required before changing visibility to public',
            message: 'Check this entry for private details before making it public.',
            reason: tokenCheck.reason || 'You edited the entry after the last check. Run the check again.',
          },
          400
        );
      }

      // Mandatory NDA question (Spec §4.3, §15, UX P0-3):
      // Definition: `nda_confirmed` asserts that the author has reviewed any flagged confidential items, client names, or secrets and confirms that publishing this content does not violate any non-disclosure agreement (NDA) or confidentiality obligation.
      // Gate behavior: Citing Spec §4.3 (redaction preview asks whether any flagged item is under NDA) and Spec §15 (human preview & confirmation is the consent mechanism for potentially sensitive content), the publication gate requires `nda_confirmed === true` when warnings exist (`warnings.length > 0`). Clean content without flagged warnings does not require explicit confirmation.
      if (warnings.length > 0 && body.nda_confirmed !== true) {
        return c.json(
          {
            error: 'Confidentiality & NDA confirmation required when potential secrets or exclusions are flagged before changing visibility to public',
            warningsCount: warnings.length,
          },
          400
        );
      }

      auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
        entryId: id,
        bodyMd: currentBody,
        warnings,
        consume: true,
      });
    }

    const updatedEntry = await repo.updateEntry(id, {
      ...parsed.data,
      ...(body.title ? { title: body.title } : {}),
    });
    if (!updatedEntry) return c.json({ error: 'Entry not found' }, 404);

    if (existing.currentRevision && answerCache) {
      answerCache.invalidateRevision(existing.currentRevision.id);
    }

    let enrichmentQueued = false;
    if (parsed.data.visibility === 'public' && worker && existing.currentRevision) {
      enrichmentQueued = true;
      worker.runEnrichJob(id, existing.currentRevision.id).catch((err) => {
        console.error(`[Entries] Auto background enrichment failed for ${id}:`, err);
      });
      worker.runPublishStaticSiteJob({ forceNow: false }).catch((err) => {
        console.error(`[Entries] Debounced static rebuild trigger failed for ${id}:`, err);
      });
    }

    return c.json({ entry: updatedEntry, enrichmentQueued });
  });

  // Delete entry and all derived records (§15 Deletion, Admin-only)
  router.delete('/:id', auth.requireAdminMiddleware(), async (c) => {
    const id = c.req.param('id') || '';
    const existing = await repo.getEntry(id, ['private', 'unlisted', 'public']);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    if (existing.currentRevision && answerCache) {
      answerCache.invalidateRevision(existing.currentRevision.id);
    }

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
      return c.json({
        error: 'Validation failed',
        message: "Couldn't save entry. Fix the highlighted fields and retry.",
        details: parsed.error.issues,
      }, 400);
    }

    const data = parsed.data;
    const existing = await repo.getEntry(entryId, ['private', 'unlisted', 'public']);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    if (existing.entry.visibility === 'public') {
      const effectiveExclusions = settingsState?.redactionExclusions;
      const warnings = scanForConfidentialData(data.body_md.trim(), effectiveExclusions);
      if (warnings.length > 0 || body.redactionPreviewToken !== undefined) {
        const tokenCheck = auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
          entryId,
          bodyMd: data.body_md,
          warnings,
          consume: false,
        });
        if (!tokenCheck.valid) {
          return c.json(
            {
              error: 'Redaction preview confirmation required before publishing confidential revisions on a public entry',
              message: 'Check this entry for private details before saving public changes.',
              reason: tokenCheck.reason || 'Run the redaction check before saving changes to a public entry.',
            },
            400
          );
        }
        if (warnings.length > 0 && body.nda_confirmed !== true) {
          return c.json(
            {
              error: 'Confidentiality & NDA confirmation required when potential secrets or exclusions are flagged on a public entry',
              warningsCount: warnings.length,
            },
            400
          );
        }
        auth.verifyRedactionPreviewToken(body.redactionPreviewToken, {
          entryId,
          bodyMd: data.body_md,
          warnings,
          consume: true,
        });
      }
    }

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

    if (oldRev && answerCache) {
      answerCache.invalidateRevision(oldRev.id);
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

  // Get all revisions for entry (Admin-only, Spec §3.11, UX-04)
  router.get('/:id/revisions', auth.requireAdminMiddleware(), async (c) => {
    const entryId = c.req.param('id') || '';
    const existing = await repo.getEntry(entryId, ['private', 'unlisted', 'public']);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    const revisions = await repo.getRevisions(entryId);
    return c.json({ revisions });
  });

  return router;
}
