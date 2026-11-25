import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { AnswerCache } from '@living-portfolio/ai';
import {
  AnnotationUpdateSchema,
  BUILTIN_PROFILES,
  ClaimUpsertSchema,
  EvidenceUpsertSchema,
  FacetUpsertSchema,
  RelationUpsertSchema,
} from '@living-portfolio/core';

export function createStructureRoutes(repo: IPortfolioRepository, answerCache?: AnswerCache) {
  const router = new Hono();

  // Profiles (§3.4)
  router.get('/profiles', (c) => {
    return c.json({ profiles: Object.values(BUILTIN_PROFILES) });
  });

  // Spans & Annotations
  router.get('/revisions/:revId/spans', async (c) => {
    const revId = c.req.param('revId');
    const spans = await repo.getSpans(revId);
    return c.json({ spans });
  });

  router.post('/annotations', async (c) => {
    const body = await c.req.json();
    const annotation = await repo.saveAnnotation({
      span_id: body.span_id,
      role: body.role,
      profile: body.profile || 'case-study',
      source: body.source || 'owner',
      status: body.status || 'suggested',
      confidence: body.confidence ?? 1.0,
    });
    return c.json({ annotation }, 201);
  });

  router.patch('/annotations/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = AnnotationUpdateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid update' }, 400);

    const updated = await repo.updateAnnotation(id, parsed.data);

    // Save correction log (§11)
    await repo.saveCorrection({
      kind: 'role',
      role: parsed.data.role,
      owner_action: parsed.data.status === 'accepted' ? 'accept' : 'reject',
    });

    return c.json({ updated: true, annotation: updated });
  });

  // Facets
  router.get('/entries/:entryId/facets', async (c) => {
    const entryId = c.req.param('entryId');
    const facets = await repo.getFacetsForEntry(entryId);
    return c.json({ facets });
  });

  router.post('/facets', async (c) => {
    const body = await c.req.json();
    const parsed = FacetUpsertSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid facet data', details: parsed.error.issues }, 400);

    const facet = await repo.saveFacet({ ...parsed.data, value: parsed.data.value ?? '' });
    return c.json({ facet }, 201);
  });

  router.patch('/facets/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = await repo.updateFacet(id, body);
    if (!updated) return c.json({ error: 'Facet not found' }, 404);

    await repo.saveCorrection({
      kind: 'facet',
      owner_action: body.status === 'confirmed' ? 'accept' : 'reject',
    });
    return c.json({ facet: updated });
  });

  // Claims & Relations
  router.get('/entries/:entryId/claims', async (c) => {
    const entryId = c.req.param('entryId');
    const claims = await repo.listClaimsForEntry(entryId);
    return c.json({ claims });
  });

  router.post('/claims', async (c) => {
    const body = await c.req.json();
    const parsed = ClaimUpsertSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid claim data', details: parsed.error.issues }, 400);

    const claim = await repo.saveClaim(parsed.data);
    return c.json({ claim }, 201);
  });

  router.patch('/claims/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = await repo.updateClaim(id, body);
    if (!updated) return c.json({ error: 'Claim not found' }, 404);
    if (answerCache) {
      answerCache.invalidateClaim(id);
    }
    return c.json({ claim: updated });
  });

  router.post('/relations', async (c) => {
    const body = await c.req.json();
    const parsed = RelationUpsertSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid relation data', details: parsed.error.issues }, 400);

    const relation = await repo.saveRelation(parsed.data);
    if (answerCache) {
      if (parsed.data.src_claim) answerCache.invalidateClaim(parsed.data.src_claim);
      if (parsed.data.dst_claim) answerCache.invalidateClaim(parsed.data.dst_claim);
    }
    return c.json({ relation }, 201);
  });

  router.patch('/relations/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = await repo.updateRelation(id, body);
    if (!updated) return c.json({ error: 'Relation not found' }, 404);

    if (answerCache) {
      if (updated.src_claim) answerCache.invalidateClaim(updated.src_claim);
      if (updated.dst_claim) answerCache.invalidateClaim(updated.dst_claim);
    }

    return c.json({ relation: updated, recomputed: updated.status === 'accepted' });
  });

  // Evidence
  router.get('/entries/:entryId/evidence', async (c) => {
    const entryId = c.req.param('entryId');
    const evidence = await repo.getEvidenceForEntry(entryId);
    return c.json({ evidence });
  });

  router.post('/evidence', async (c) => {
    const body = await c.req.json();
    const parsed = EvidenceUpsertSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid evidence data', details: parsed.error.issues }, 400);

    if (parsed.data.url) {
      try {
        const u = new URL(parsed.data.url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return c.json({ error: 'Invalid evidence URL: only http and https protocols are allowed' }, 400);
        }
      } catch {
        return c.json({ error: 'Invalid evidence URL format' }, 400);
      }
    }

    const ev = await repo.saveEvidence(parsed.data);
    return c.json({ evidence: ev }, 201);
  });

  // Ventures
  router.get('/ventures', async (c) => {
    const ventures = await repo.listVentures();
    return c.json({ ventures });
  });

  router.post('/ventures', async (c) => {
    const body = await c.req.json();
    const venture = await repo.createVenture({
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: body.name,
      description: body.description || '',
      status: body.status || 'building',
      links: body.links || {},
      started_at: body.started_at || new Date().toISOString(),
      facets: body.facets || {},
    });
    return c.json({ venture }, 201);
  });

  router.patch('/ventures/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const venture = await repo.getVenture(id);
    if (!venture) return c.json({ error: 'Venture not found' }, 404);
    if (typeof body.name === 'string' && body.name.trim()) (venture as any).name = body.name.trim();
    if (typeof body.description === 'string') (venture as any).description = body.description;
    if (typeof body.status === 'string' && ['building', 'launched', 'paused', 'archived'].includes(body.status)) {
      (venture as any).status = body.status;
    }
    return c.json({ updated: true, venture });
  });

  return router;
}
