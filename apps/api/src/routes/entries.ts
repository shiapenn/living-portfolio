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
} from '@living-portfolio/core';
import { scanForConfidentialData } from '@living-portfolio/ai';
import { EntryCreateSchema, EntryUpdateSchema, RevisionCreateSchema } from '@living-portfolio/core';

export function createEntriesRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

  // List entries with computed structure levels and facets
  router.get('/', async (c) => {
    const visibilityQuery = c.req.query('visibility');
    const ventureId = c.req.query('venture_id');

    let visibility: ('private' | 'unlisted' | 'public')[] = ['public'];
    if (visibilityQuery === 'all') {
      visibility = ['private', 'unlisted', 'public'];
    } else if (visibilityQuery) {
      visibility = visibilityQuery.split(',') as any;
    }

    const rawEntries = await repo.listEntries({ visibility, venture_id: ventureId });
    const acceptedRelations = await repo.listAcceptedRelations();

    const entries = await Promise.all(
      rawEntries.map(async (entry) => {
        const full = await repo.getEntry(entry.id);
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

  // Get entry by slug
  router.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const result = await repo.getEntryBySlug(slug);

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

    // Compute structure level
    const structureLevel = computeStructureLevel({
      revision: currentRevision,
      profile,
      facets,
      annotations,
      claims,
    });
    const levelDetails = getStructureLevelDetails(structureLevel);

    // Compute gap questions (§10.2)
    const gapQuestions = generateGapQuestions({
      revision: currentRevision,
      facets,
      claims,
    });

    // Check for later-thinking alerts (§10.7)
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

  // Create entry (L0 Markdown ingest)
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = EntryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const bodyHash = (await import('crypto')).createHash('sha256').update(data.body_md).digest('hex');

    // 1. Create entry & initial revision
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

    // 2. Chunk markdown into spans
    const chunks = chunkMarkdown(revision.id, data.body_md);
    const savedSpans = await repo.saveSpans(chunks);

    // 3. Scan for redaction preview
    const redactionWarnings = scanForConfidentialData(data.body_md);

    return c.json({
      entry,
      revision,
      spansCount: savedSpans.length,
      redactionWarnings,
    }, 201);
  });

  // Update entry metadata
  router.put('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = EntryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const updatedEntry = await repo.updateEntry(id, {
      ...parsed.data,
      ...(body.title ? { title: body.title } : {}),
    });
    if (!updatedEntry) return c.json({ error: 'Entry not found' }, 404);

    return c.json({ entry: updatedEntry });
  });

  // Delete entry and all derived records (§15 Deletion)
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await repo.getEntry(id);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    const report = await repo.deleteEntry(id);
    return c.json({
      deleted: true,
      entryId: id,
      slug: existing.entry.slug,
      report,
    });
  });

  // Create new revision for entry (Immutable revision with span re-anchoring)
  router.post('/:id/revisions', async (c) => {
    const entryId = c.req.param('id');
    const body = await c.req.json();
    const parsed = RevisionCreateSchema.safeParse({ ...body, entry_id: entryId });

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const existing = await repo.getEntry(entryId);
    if (!existing) return c.json({ error: 'Entry not found' }, 404);

    const oldRev = existing.currentRevision;
    const oldSpans = oldRev ? await repo.getSpans(oldRev.id) : [];

    const bodyHash = (await import('crypto')).createHash('sha256').update(data.body_md).digest('hex');
    const newRevision = await repo.createRevision(entryId, {
      body_md: data.body_md,
      body_hash: bodyHash,
      temporal_level: data.temporal_level,
      valid_from: data.valid_from,
      valid_to: data.valid_to,
      valid_from_range_end: data.valid_from_range_end,
      is_hindsight: data.is_hindsight,
    });

    // Chunk new revision
    const newChunks = chunkMarkdown(newRevision.id, data.body_md);
    const savedNewSpans = await repo.saveSpans(newChunks);

    // Re-anchor annotations from old revision if present
    const reanchorResults = [];
    if (oldRev) {
      const oldAnnotations = await repo.listAnnotationsForRevision(oldRev.id);
      for (const ann of oldAnnotations) {
        const oldSpan = oldSpans.find((s) => s.id === ann.span_id);
        if (oldSpan) {
          const match = reanchorSpan(oldSpan, data.body_md);
          if (match.found) {
            // Find corresponding new span
            const matchingNewSpan = savedNewSpans.find(
              (s) => s.start_off <= match.start_off && s.end_off >= match.end_off
            ) || savedNewSpans[0];

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

    return c.json({
      revision: newRevision,
      spans: savedNewSpans,
      reanchorSummary: reanchorResults,
    }, 201);
  });

  // Redaction preview
  router.post('/redaction-preview', async (c) => {
    const { text } = await c.req.json();
    if (typeof text !== 'string') {
      return c.json({ error: 'Text string required' }, 400);
    }
    const warnings = scanForConfidentialData(text);
    return c.json({ warnings });
  });

  return router;
}
