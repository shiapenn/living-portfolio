import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { CalibrationEngine, type CalibrationQualityReport } from '@living-portfolio/core';
import type { RuntimeSettingsState } from './settings.js';

export function createCalibrationRoutes(
  repo: IPortfolioRepository,
  runtimeState?: RuntimeSettingsState,
  engine?: CalibrationEngine
) {
  const router = new Hono();
  const calibEngine =
    engine ??
    new CalibrationEngine({
      minSampleSize: 5,
      maxStep: 0.05,
      autoApplyThreshold: 0.02,
      windowDays: 30,
      maxWindowSize: 500,
      calibrationFrozen: runtimeState?.calibrationFrozen ?? false,
      mechanisms: {
        suggestion_thresholds: false, // Off per §11
        routing_calibration: false,    // Off per §11
        topology_audit: true,          // On per §11
        scoped_constraint_mining: true,// On per §11
      },
    });

  // Mutable live parameter cache
  const calibrationParameters: Record<string, number> = {
    role_suggestion_threshold: 0.8,
    facet_suggestion_threshold: 0.85,
    claim_suggestion_threshold: 0.75,
    tier1_floor: runtimeState?.tier1_floor ?? 0.82,
    tier2_floor: runtimeState?.tier2_floor ?? 0.55,
    facet_known_threshold: runtimeState?.facet_known_threshold ?? 0.9,
    'routing_weights.w1': 0.4,
    'routing_weights.w2': 0.35,
    'routing_weights.w3': 0.25,
    'routing_weights.temporal_decay': 0.05,
  };

  // Canonical OpenAPI endpoint: GET /api/v1/calibration (§11)
  router.get('/', async (c) => {
    const isFrozen = runtimeState?.calibrationFrozen ?? calibEngine.isFrozen();
    const history = await repo.getCalibrationChanges();

    // Compute calibration quality metrics from recent changes/samples
    const samples = history.map((h) => ({
      confidence: h.new_value,
      correct: h.applied_by === 'owner' || h.reversible,
    }));
    const quality: CalibrationQualityReport = calibEngine.computeECE(samples);

    return c.json({
      frozen: isFrozen,
      mechanisms: calibEngine.getMechanisms(),
      window: calibEngine.getWindowConfig(),
      parameters: {
        ...calibrationParameters,
        tier1_floor: runtimeState?.tier1_floor ?? calibrationParameters.tier1_floor,
        tier2_floor: runtimeState?.tier2_floor ?? calibrationParameters.tier2_floor,
        facet_known_threshold:
          runtimeState?.facet_known_threshold ?? calibrationParameters.facet_known_threshold,
      },
      quality,
      recentChanges: history.slice(-10),
    });
  });

  // Legacy /parameters endpoint preserving SIMULATED(M1) unless live=true
  router.get('/parameters', async (c) => {
    if (c.req.query('live') === 'true') {
      return c.json({ parameters: calibrationParameters });
    }
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

  // Pending proposals (§11)
  router.get('/proposals', async (c) => {
    const isFrozen = runtimeState?.calibrationFrozen ?? calibEngine.isFrozen();
    if (isFrozen) {
      return c.json({
        proposals: [],
        frozen: true,
        message: 'Self-calibration is frozen by owner setting (§11).',
      });
    }

    const roleLogs = await repo.getCorrectionLogs('role');
    const facetLogs = await repo.getCorrectionLogs('facet');
    const proposals = [];

    // 1. Suggestion thresholds mechanism (evaluated if mechanism is enabled or query forces evaluation)
    const force = c.req.query('force') === 'true';
    const roleProposal = calibEngine.proposeThresholdAdjustment(
      'role_suggestion_threshold',
      calibrationParameters.role_suggestion_threshold ?? 0.8,
      roleLogs,
      { forceEvaluate: force }
    );
    if (roleProposal) proposals.push(roleProposal);

    const facetProposal = calibEngine.proposeThresholdAdjustment(
      'facet_known_threshold',
      runtimeState?.facet_known_threshold ?? calibrationParameters.facet_known_threshold ?? 0.9,
      facetLogs,
      { forceEvaluate: force }
    );
    if (facetProposal) proposals.push(facetProposal);

    return c.json({ proposals, frozen: false });
  });

  // Guarded apply handler for POST /apply and POST / (§11, Fix 16)
  const handleApply = async (c: any) => {
    const isFrozen = runtimeState?.calibrationFrozen ?? calibEngine.isFrozen();
    if (isFrozen) {
      return c.json(
        {
          error: 'Conflict',
          code: 'CALIBRATION_FROZEN',
          finding: 'M5',
          message:
            'Self-calibration is frozen by owner setting (§11). Unfreeze calibration in Settings before applying parameter adjustments.',
        },
        409
      );
    }

    const body = await c.req.json().catch(() => ({}));
    const parameter = typeof body.parameter === 'string' ? body.parameter.trim() : '';
    const newValue = Number(body.new_value);
    const force = Boolean(body.force);

    if (!parameter) {
      return c.json({ error: 'Missing required field: parameter', code: 'INVALID_PAYLOAD' }, 400);
    }
    if (Number.isNaN(newValue) || newValue < 0 || newValue > 1) {
      return c.json(
        {
          error: 'Parameter new_value must be a finite number between 0.0 and 1.0',
          code: 'OUT_OF_BOUNDS',
        },
        400
      );
    }

    const currentValue =
      calibrationParameters[parameter] ??
      (typeof body.old_value === 'number' ? body.old_value : 0.5);
    const delta = Math.abs(newValue - currentValue);

    // Guard: Maximum bounded adjustment clamping (maxStep = 0.05) unless owner forced override
    const maxStep = 0.05;
    if (!force && delta > maxStep + 0.0001) {
      return c.json(
        {
          error: `Requested parameter adjustment (${delta.toFixed(3)}) exceeds maximum bounded step of ${maxStep} (§11).`,
          code: 'STEP_TOO_LARGE',
          maxStep,
          requestedDelta: Number(delta.toFixed(3)),
        },
        400
      );
    }

    // Apply to live runtime state
    calibrationParameters[parameter] = newValue;
    if (runtimeState) {
      if (parameter === 'tier1_floor') runtimeState.tier1_floor = newValue;
      if (parameter === 'tier2_floor') runtimeState.tier2_floor = newValue;
      if (parameter === 'facet_known_threshold') runtimeState.facet_known_threshold = newValue;
    }

    const changeRecord = await repo.saveCalibrationChange({
      parameter,
      old_value: currentValue,
      new_value: newValue,
      evidence_count: typeof body.evidence_count === 'number' ? body.evidence_count : 1,
      applied_by: 'owner',
      reversible: true,
    });

    return c.json({
      ok: true,
      change: changeRecord,
      parameters: calibrationParameters,
    });
  };

  router.post('/apply', handleApply);
  router.post('/', handleApply);

  // History
  router.get('/history', async (c) => {
    const history = await repo.getCalibrationChanges();
    return c.json({ history });
  });

  // Stateful one-click rollback (§11, Fix 16)
  router.post('/rollback/:id', async (c) => {
    const changeId = c.req.param('id');
    const history = await repo.getCalibrationChanges();
    const targetChange = history.find((h) => h.id === changeId);

    if (!targetChange) {
      return c.json(
        {
          error: 'Not Found',
          code: 'CHANGE_NOT_FOUND',
          message: `Calibration change with ID '${changeId}' not found.`,
        },
        404
      );
    }

    if (!targetChange.reversible) {
      return c.json(
        {
          error: 'Bad Request',
          code: 'ALREADY_REVERTED',
          message: `Calibration change '${changeId}' has already been rolled back and cannot be reverted again (§11).`,
        },
        400
      );
    }

    // Restore state using engine logic
    const { restoredParameter, restoredValue, rollbackChange } = calibEngine.applyRollback(
      targetChange,
      calibrationParameters
    );

    // Update live runtime state
    if (runtimeState) {
      if (restoredParameter === 'tier1_floor') runtimeState.tier1_floor = restoredValue;
      if (restoredParameter === 'tier2_floor') runtimeState.tier2_floor = restoredValue;
      if (restoredParameter === 'facet_known_threshold')
        runtimeState.facet_known_threshold = restoredValue;
    }

    // Persist rollback change to repository
    const savedRollback = await repo.saveCalibrationChange(rollbackChange);

    return c.json({
      ok: true,
      restoredParameter,
      restoredValue,
      rollback: savedRollback,
      parameters: calibrationParameters,
    });
  });

  return router;
}
