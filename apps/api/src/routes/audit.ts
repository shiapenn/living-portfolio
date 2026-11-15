import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { detectTopologyConflicts, type ClaimWithContext } from '@living-portfolio/core';
import type { AnswerCache } from '@living-portfolio/ai';

export function createAuditRoutes(repo: IPortfolioRepository, answerCache?: AnswerCache) {
  const router = new Hono();

  // Scoped Constraints (§11)
  router.get('/scoped-constraints', async (c) => {
    const status = c.req.query('status');
    const constraints = await repo.getScopedConstraints(status);
    return c.json({ constraints });
  });

  router.post('/scoped-constraints', async (c) => {
    const body = await c.req.json();
    const constraint = body?.constraint && typeof body.constraint === 'object' ? body.constraint : { guidance: String(body?.source_quote || '') };
    const saved = await repo.saveScopedConstraint({
      constraint,
      scope: body?.scope && typeof body.scope === 'object' ? body.scope : {},
      source_escalation: typeof body?.source_escalation === 'string' ? body.source_escalation : undefined,
      source_quote: String(body?.source_quote || 'Owner rule'),
      status: 'proposed',
    });
    return c.json({ constraint: saved }, 201);
  });

  router.patch('/scoped-constraints/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    if (status !== 'confirmed' && status !== 'revoked') {
      return c.json({ error: 'Invalid status: must be confirmed or revoked' }, 400);
    }

    const constraints = await repo.getScopedConstraints();
    const existing = constraints.find((s) => s.id === id);
    if (!existing) return c.json({ error: 'Scoped constraint not found' }, 404);

    const updated = await repo.updateScopedConstraint(id, { status });
    return c.json({ constraint: updated ?? { ...existing, status } });
  });

  // Dynamic Topology Conflict Detection (§11, Fix 17)
  async function runDetector(): Promise<ReturnType<typeof detectTopologyConflicts>> {
    const entries = await repo.listEntries();
    const allClaims: ClaimWithContext[] = [];
    for (const entry of entries) {
      const claims = await repo.listClaimsForEntry(entry.id);
      for (const cl of claims) {
        allClaims.push({
          ...cl,
          entry_id: entry.id,
          entry_title: entry.title,
          entry_slug: entry.slug,
        });
      }
    }
    const relations = await repo.listAcceptedRelations();
    return detectTopologyConflicts(allClaims, relations);
  }

  // Topology conflict reports (§11, Fix 17)
  router.get('/topology-conflicts', async (c) => {
    // If not live/detect mode, return honest 501 for backward compatibility
    if (c.req.query('live') !== 'true' && c.req.query('detect') !== 'true') {
      // SIMULATED(M6): Automated claim topology conflict detector (§11) is not yet implemented.
      return c.json(
        {
          error: 'Not Implemented',
          code: 'SIMULATED',
          finding: 'M6',
          message: 'Automated claim topology conflict detector is not yet implemented.',
        },
        501
      );
    }

    const detected = await runDetector();
    const stored = await repo.getTopologyReports();

    // Deduplicate reports by claim pair
    const seen = new Set<string>();
    const conflicts = [];
    for (const rep of [...stored, ...detected]) {
      const pairKey = `${rep.claim_a}:${rep.claim_b}`;
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        conflicts.push(rep);
      }
    }

    return c.json({ conflicts, count: conflicts.length, detector: 'automated' });
  });

  // Explicit run detector endpoint
  router.post('/topology-conflicts/detect', async (c) => {
    const detected = await runDetector();
    for (const report of detected) {
      await repo.saveTopologyReport(report);
    }
    return c.json({ detected: detected.length, conflicts: detected });
  });

  // Resolve topology conflict (owner action required to create relation edge §6.2, §11, §18.1)
  router.post('/topology-conflicts/:id/resolve', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { resolution, note } = body;

    if (resolution !== 'supersedes' && resolution !== 'contradicts' && resolution !== 'dismiss') {
      return c.json({ error: 'Invalid resolution: must be supersedes, contradicts, or dismiss' }, 400);
    }

    // Locate the conflict report from stored or dynamic detector
    const stored = await repo.getTopologyReports();
    let report = stored.find((r) => r.id === id);
    if (!report) {
      const dynamic = await runDetector();
      report = dynamic.find((r) => r.id === id);
    }

    if (!report) {
      // Check if claims were passed directly in body
      if (body.claim_a && body.claim_b) {
        report = {
          id,
          claim_a: body.claim_a,
          claim_b: body.claim_b,
          confidence: 0.8,
          status: 'pending',
          at: new Date().toISOString(),
          overlap: body.overlap ?? null,
        };
      } else {
        return c.json({ error: 'Topology conflict not found' }, 404);
      }
    }

    if (resolution === 'dismiss') {
      await repo.updateTopologyReport(id, { status: 'dismissed' });
      return c.json({ resolved: true, status: 'dismissed' });
    }

    // Owner explicitly chose 'supersedes' or 'contradicts' (§11, §18.1):
    // Now create the relation edge with status: 'accepted'
    const relation = await repo.saveRelation({
      src_claim: report.claim_a,
      dst_claim: report.claim_b,
      type: resolution,
      status: 'accepted',
      scope: report.overlap,
    });

    await repo.updateTopologyReport(id, { status: 'resolved', resolution });

    // Invalidate answer cache for affected claims
    if (answerCache) {
      answerCache.invalidateClaim(report.claim_a);
      answerCache.invalidateClaim(report.claim_b);
    }

    return c.json({
      resolved: true,
      status: 'resolved',
      relation,
      stalenessRecomputed: true,
    });
  });

  return router;
}
