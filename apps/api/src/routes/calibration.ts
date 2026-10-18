import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { CalibrationEngine } from '@living-portfolio/core';

export function createCalibrationRoutes(repo: IPortfolioRepository) {
  const router = new Hono();
  const engine = new CalibrationEngine({ minSampleSize: 5, maxStep: 0.05, autoApplyThreshold: 0.02 });

  // Current parameters
  router.get('/parameters', async (c) => {
    return c.json({
      parameters: {
        tier1_floor: 0.82,
        tier2_floor: 0.55,
        facet_known_threshold: 0.9,
        lookup_threshold: 0.70,
        w1: 1.0,
        w2: 0.5,
        w3: 0.5,
      },
      shippedDefaults: {
        tier1_floor: 0.82,
        tier2_floor: 0.55,
      },
      warning: null, // Admin shows warning if tier1_floor < 0.82
    });
  });

  // Pending proposals
  router.get('/proposals', async (c) => {
    const roleLogs = await repo.getCorrectionLogs('role');
    const proposals = [];

    const roleProposal = engine.proposeThresholdAdjustment('role_suggestion_threshold', 0.80, roleLogs);
    if (roleProposal) proposals.push(roleProposal);

    return c.json({ proposals });
  });

  // Apply proposal
  router.post('/apply', async (c) => {
    const body = await c.req.json();
    const change = await repo.saveCalibrationChange({
      parameter: body.parameter,
      old_value: body.old_value,
      new_value: body.new_value,
      evidence_count: body.evidence_count || 1,
      applied_by: body.applied_by || 'owner',
      reversible: true,
    });
    return c.json({ change }, 201);
  });

  // History
  router.get('/history', async (c) => {
    const history = await repo.getCalibrationChanges();
    return c.json({ history });
  });

  // One-click rollback (§11)
  router.post('/rollback/:id', async (c) => {
    const id = c.req.param('id');
    const history = await repo.getCalibrationChanges();
    const change = history.find((h) => h.id === id);

    if (!change) return c.json({ error: 'Change record not found' }, 404);
    if (!change.reversible) return c.json({ error: 'This change is not reversible' }, 400);

    const rollbackData = engine.createRollbackChange(change);
    const rollbackRecord = await repo.saveCalibrationChange(rollbackData);

    return c.json({ rollback: rollbackRecord });
  });

  return router;
}
