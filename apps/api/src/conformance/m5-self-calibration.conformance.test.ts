import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

describe('Self-Calibration Layer & Routing Calibration Conformance (§11, Finding M5, Fix 16)', () => {
  let repo: InMemoryPortfolioRepository;
  let app: any;
  let adminToken: string;
  let authHeaders: Record<string, string>;

  beforeEach(() => {
    repo = new InMemoryPortfolioRepository();
    const appInstance = createApp(repo, { bootstrapAdminToken: 'm5-admin-token-secret' });
    app = appInstance.app;
    adminToken = appInstance.adminToken;
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
  });

  it('GET /api/calibration returns live calibration state, mechanisms flags, sliding window, and ECE report (§11)', async () => {
    const res = await app.request('/api/calibration', { headers: authHeaders });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.frozen).toBe(false);

    // Spec §11 table: suggestion_thresholds and routing_calibration ship OFF
    expect(body.mechanisms.suggestion_thresholds).toBe(false);
    expect(body.mechanisms.routing_calibration).toBe(false);
    expect(body.mechanisms.topology_audit).toBe(true);
    expect(body.mechanisms.scoped_constraint_mining).toBe(true);

    // Sliding window config
    expect(body.window.windowDays).toBe(30);
    expect(body.window.maxWindowSize).toBe(500);

    // Active parameters
    expect(body.parameters.tier1_floor).toBe(0.82);
    expect(body.parameters.tier2_floor).toBe(0.55);
    expect(body.parameters['routing_weights.w1']).toBe(0.4);

    // ECE quality report
    expect(body.quality).toBeDefined();
    expect(typeof body.quality.expectedCalibrationError).toBe('number');
    expect(Array.isArray(body.quality.reliabilityCurve)).toBe(true);
  });

  it('POST /api/calibration/apply enforces bounded step clamping and updates runtime state (§11, Fix 16)', async () => {
    // 1. Step too large without force is rejected with 400
    const resTooLarge = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'tier1_floor',
        old_value: 0.82,
        new_value: 0.70, // delta 0.12 > maxStep 0.05
      }),
    });
    expect(resTooLarge.status).toBe(400);
    const bodyTooLarge = await resTooLarge.json();
    expect(bodyTooLarge.code).toBe('STEP_TOO_LARGE');
    expect(bodyTooLarge.maxStep).toBe(0.05);

    // 2. Bounded adjustment (<= 0.05) succeeds and updates live runtime state
    const resValid = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'tier1_floor',
        old_value: 0.82,
        new_value: 0.79, // delta 0.03 <= 0.05
        evidence_count: 24,
        reason: 'Observed high answer faithfulness across recent queries.',
      }),
    });
    expect(resValid.status).toBe(200);
    const bodyValid = await resValid.json();
    expect(bodyValid.ok).toBe(true);
    expect(bodyValid.change.parameter).toBe('tier1_floor');
    expect(bodyValid.change.new_value).toBe(0.79);
    expect(bodyValid.change.old_value).toBe(0.82);

    // 3. Settings endpoint reflects the updated parameter
    const resSettings = await app.request('/api/settings', { headers: authHeaders });
    const settingsBody = await resSettings.json();
    expect(settingsBody.routing.tier1_floor).toBe(0.79);

    // 4. Change is recorded in history
    const resHistory = await app.request('/api/calibration/history', { headers: authHeaders });
    const historyBody = await resHistory.json();
    expect(historyBody.history.length).toBeGreaterThanOrEqual(1);
    expect(historyBody.history[0].parameter).toBe('tier1_floor');
  });

  it('honors calibrationFrozen setting by suppressing proposals and rejecting apply with 409 Conflict (§11, Fix 16)', async () => {
    // 1. Freeze self-calibration in Settings
    const resFreeze = await app.request('/api/settings/routing', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ calibrationFrozen: true }),
    });
    expect(resFreeze.status).toBe(200);
    expect((await resFreeze.json()).runtime.calibrationFrozen).toBe(true);

    // 2. Proposals endpoint reports frozen status
    const resProposals = await app.request('/api/calibration/proposals', { headers: authHeaders });
    expect(resProposals.status).toBe(200);
    const proposalsBody = await resProposals.json();
    expect(proposalsBody.frozen).toBe(true);
    expect(proposalsBody.proposals).toHaveLength(0);

    // 3. Applying adjustment is blocked with 409 Conflict
    const resApply = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'tier1_floor',
        old_value: 0.82,
        new_value: 0.80,
      }),
    });
    expect(resApply.status).toBe(409);
    const applyBody = await resApply.json();
    expect(applyBody.code).toBe('CALIBRATION_FROZEN');
    expect(applyBody.finding).toBe('M5');
  });

  it('POST /api/calibration/rollback/:id restores live parameter value and marks record reverted (§11, Fix 16)', async () => {
    // 1. Apply a calibration change
    const resApply = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'facet_known_threshold',
        old_value: 0.90,
        new_value: 0.86,
        evidence_count: 30,
      }),
    });
    expect(resApply.status).toBe(200);
    const changeId = (await resApply.json()).change.id;

    // Verify parameter was changed
    const checkState = await app.request('/api/settings', { headers: authHeaders });
    expect((await checkState.json()).routing.facet_known_threshold).toBe(0.86);

    // 2. Perform one-click rollback
    const resRollback = await app.request(`/api/calibration/rollback/${changeId}`, {
      method: 'POST',
      headers: authHeaders,
    });
    expect(resRollback.status).toBe(200);
    const rollbackBody = await resRollback.json();
    expect(rollbackBody.ok).toBe(true);
    expect(rollbackBody.restoredParameter).toBe('facet_known_threshold');
    expect(rollbackBody.restoredValue).toBe(0.90);

    // Verify parameter in runtime settings reverted to original 0.90
    const resReverted = await app.request('/api/settings', { headers: authHeaders });
    expect((await resReverted.json()).routing.facet_known_threshold).toBe(0.90);

    // 3. Re-attempting rollback on already reverted change returns 400 Bad Request
    const resRollbackAgain = await app.request(`/api/calibration/rollback/${rollbackBody.rollback.id}`, {
      method: 'POST',
      headers: authHeaders,
    });
    expect(resRollbackAgain.status).toBe(400);
    expect((await resRollbackAgain.json()).code).toBe('ALREADY_REVERTED');
  });
});
