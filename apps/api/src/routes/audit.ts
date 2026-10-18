import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';

export function createAuditRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

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
    // Return sample or detected conflict report
    const conflicts = [
      {
        id: 'topo-1',
        claim_a_text: 'Always use distributed mutexes with Redis',
        claim_b_text: 'PostgreSQL advisory locks outperform Redis distributed locks',
        overlap: { domain: 'concurrency', scale: 'high' },
        question: 'Does the later claim supersede the earlier one, or do they apply to different situations?',
        status: 'pending',
      },
    ];
    return c.json({ conflicts });
  });

  return router;
}
