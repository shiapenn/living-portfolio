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
    const { status } = await c.req.json();
    if (status !== 'confirmed' && status !== 'revoked') {
      return c.json({ error: 'Invalid status: must be confirmed or revoked' }, 400);
    }

    const constraints = await repo.getScopedConstraints();
    const existing = constraints.find((s) => s.id === id);
    if (!existing) return c.json({ error: 'Scoped constraint not found' }, 404);

    existing.status = status;
    return c.json({ constraint: existing });
  });

  // Topology conflict reports (§11)
  router.get('/topology-conflicts', async (c) => {
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
  });

  // Resolve topology conflict (owner action required to create relation edge §6.2, §11)
  router.post('/topology-conflicts/:id/resolve', async (c) => {
    // SIMULATED(M6): Automated claim topology conflict resolution is not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M6',
        message: 'Automated claim topology conflict resolution is not yet implemented.',
      },
      501
    );
  });

  return router;
}
