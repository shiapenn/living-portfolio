import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  AnnotationUpdateSchema,
  ClaimUpsertSchema,
  EvidenceUpsertSchema,
  FacetUpsertSchema,
  RelationUpsertSchema,
} from '@living-portfolio/core';

export function createStructureRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

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
    const body = await c.req.json();
    const parsed = AnnotationUpdateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid update' }, 400);

    // Save correction log (§11)
    await repo.saveCorrection({
      kind: 'role',
      role: parsed.data.role,
      owner_action: parsed.data.status === 'accepted' ? 'accept' : 'reject',
    });

    return c.json({ updated: true });
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

    const facet = await repo.saveFacet(parsed.data);
    return c.json({ facet }, 201);
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

  router.post('/relations', async (c) => {
    const body = await c.req.json();
    const parsed = RelationUpsertSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid relation data', details: parsed.error.issues }, 400);

    const relation = await repo.saveRelation(parsed.data);
    return c.json({ relation }, 201);
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
      name: body.name,
      status: body.status || 'building',
      links: body.links || {},
      started_at: body.started_at || new Date().toISOString(),
      facets: body.facets || {},
    });
    return c.json({ venture }, 201);
  });

  return router;
}
