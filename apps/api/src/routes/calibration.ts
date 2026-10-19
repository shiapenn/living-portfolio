import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { CalibrationEngine } from '@living-portfolio/core';

export function createCalibrationRoutes(repo: IPortfolioRepository) {
  const router = new Hono();
  const engine = new CalibrationEngine({ minSampleSize: 5, maxStep: 0.05, autoApplyThreshold: 0.02 });

  // Current parameters
  router.get('/parameters', async (c) => {
    // SIMULATED(M1): Persisted calibration parameter store and live routing state binding are not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M1',
        message: 'Persisted calibration parameter store is not yet implemented.',
      },
      501
    );
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
    // SIMULATED(M5): Guarded calibration application and live parameter persistence (§11, Fix 16) are not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M5',
        message: 'Guarded calibration parameter application (§11) is not yet implemented.',
      },
      501
    );
  });

  // History
  router.get('/history', async (c) => {
    const history = await repo.getCalibrationChanges();
    return c.json({ history });
  });

  // One-click rollback (§11)
  router.post('/rollback/:id', async (c) => {
    // SIMULATED(M5): Stateful calibration parameter rollback (§11, Fix 16) is not yet implemented.
    return c.json(
      {
        error: 'Not Implemented',
        code: 'SIMULATED',
        finding: 'M5',
        message: 'Stateful calibration parameter rollback (§11) is not yet implemented.',
      },
      501
    );
  });

  return router;
}
