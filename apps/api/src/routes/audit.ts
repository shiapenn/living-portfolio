import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';

export function createAuditRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

  const conflictsState = [
    {
      id: 'topo-1',
      claim_a_id: 'claim-redis-2021',
      claim_b_id: 'claim-pg-advisory-2024',
      claim_a_text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
      claim_b_text: 'Transaction-scoped PostgreSQL advisory locks outperform external Redis locks under 50k TPS.',
      overlap: { database: 'PostgreSQL', scale: 'under 50k TPS' },
      question: 'Does the later claim supersede the earlier one, or do they apply to different situations?',
      status: 'pending' as 'pending' | 'resolved' | 'dismissed',
      resolution: null as string | null,
    },
  ];

  // Scoped Constraints
  router.get('/scoped-constraints', async (c) => {
    const status = c.req.query('status');
    const constraints = await repo.getScopedConstraints(status);
    return c.json({ constraints });
  });

  router.patch('/scoped-constraints/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json(); // confirmed | revoked

    const constraints = await repo.getScopedConstraints();
    const existing = constraints.find((s) => s.id === id);
    if (!existing) return c.json({ error: 'Scoped constraint not found' }, 404);

    existing.status = status;
    return c.json({ constraint: existing });
  });

  // Topology conflict reports (§11)
  router.get('/topology-conflicts', async (c) => {
    return c.json({ conflicts: conflictsState });
  });

  // Resolve topology conflict (owner action required to create relation edge §6.2, §11)
  router.post('/topology-conflicts/:id/resolve', async (c) => {
    const id = c.req.param('id');
    const { action, scope } = await c.req.json(); // action: 'supersedes' | 'different_scope' | 'dismiss'
    const conflict = conflictsState.find((item) => item.id === id);
    if (!conflict) return c.json({ error: 'Topology conflict not found' }, 404);

    if (action === 'dismiss') {
      conflict.status = 'dismissed';
      conflict.resolution = 'Dismissed by owner';
      return c.json({ conflict, edgeCreated: null });
    }

    const relType = action === 'different_scope' ? 'refines' : 'supersedes';
    const relation = await repo.saveRelation({
      src_claim: conflict.claim_a_id,
      dst_claim: conflict.claim_b_id,
      type: relType,
      scope: scope || conflict.overlap,
      status: 'accepted',
      valid_from: new Date().toISOString(),
    });

    conflict.status = 'resolved';
    conflict.resolution = `Owner created ${relType} edge`;
    return c.json({ conflict, edgeCreated: relation });
  });

  return router;
}
