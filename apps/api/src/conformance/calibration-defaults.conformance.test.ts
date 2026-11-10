import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

describe('Calibration Defaults & Mechanism Gates Conformance (Spec §11, UX-08, WP-14.5)', () => {
  let repo: InMemoryPortfolioRepository;
  let app: any;
  let adminToken: string;
  let authHeaders: Record<string, string>;

  beforeEach(() => {
    repo = new InMemoryPortfolioRepository();
    const appInstance = createApp(repo, { bootstrapAdminToken: 'wp145-admin-token-secret' });
    app = appInstance.app;
    adminToken = appInstance.adminToken;
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
  });

  it('fresh instance reports both parameter mechanisms off by default, and audit/mining on as proposal-only (§11, UX-08)', async () => {
    const res = await app.request('/api/calibration', { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();

    // Spec §11 table: suggestion_thresholds and routing_calibration ship OFF
    expect(body.mechanisms.suggestion_thresholds).toBe(false);
    expect(body.mechanisms.routing_calibration).toBe(false);

    // Topology audit and scoped constraint mining ship ON as proposal-only
    expect(body.mechanisms.topology_audit).toBe(true);
    expect(body.mechanisms.scoped_constraint_mining).toBe(true);

    // Minimum sample gate raised from legacy 5 to spec-mandated 20
    expect(body.minSampleSize).toBe(20);
    expect(body.maxStep).toBe(0.05);

    // Fresh instance has no history: proposals endpoint produces no parameter proposals
    const propRes = await app.request('/api/calibration/proposals', { headers: authHeaders });
    expect(propRes.status).toBe(200);
    const propBody = await propRes.json();
    expect(propBody.proposals).toHaveLength(0);
  });

  it('rejects parameter adjustment when evidence count is below the minimum-sample gate of 20 (§11, UX-08)', async () => {
    // Attempting to apply a parameter change with only 5 samples (legacy gate) fails the 20-sample gate
    const resUnderGate = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'tier1_floor',
        old_value: 0.82,
        new_value: 0.80,
        evidence_count: 5, // below gate of 20
      }),
    });

    expect(resUnderGate.status).toBe(400);
    const errBody = await resUnderGate.json();
    expect(errBody.code).toBe('INSUFFICIENT_SAMPLE_SIZE');
    expect(errBody.minSampleSize).toBe(20);
    expect(errBody.evidenceCount).toBe(5);

    // With evidence_count >= 20, bounded adjustment succeeds
    const resValidGate = await app.request('/api/calibration/apply', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parameter: 'tier1_floor',
        old_value: 0.82,
        new_value: 0.80,
        evidence_count: 20, // meets gate
      }),
    });

    expect(resValidGate.status).toBe(200);
    const validBody = await resValidGate.json();
    expect(validBody.ok).toBe(true);
    expect(validBody.change.new_value).toBe(0.80);
  });

  it('settings endpoint and runtime state reflect individual mechanism switches (§11, UX-08)', async () => {
    const resSettings = await app.request('/api/settings', { headers: authHeaders });
    expect(resSettings.status).toBe(200);
    const settingsBody = await resSettings.json();

    expect(settingsBody.calibration).toBeDefined();
    expect(settingsBody.calibration.suggestion_thresholds).toBe(false);
    expect(settingsBody.calibration.routing_calibration).toBe(false);
    expect(settingsBody.calibration.topology_audit).toBe(true);
    expect(settingsBody.calibration.scoped_constraint_mining).toBe(true);

    // Toggle suggestion_thresholds ON via settings PATCH
    const patchRes = await app.request('/api/settings/routing', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        calibration: {
          suggestion_thresholds: true,
        },
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.calibration.suggestion_thresholds).toBe(true);

    // Verify GET /api/calibration reflects updated mechanism
    const calibRes = await app.request('/api/calibration', { headers: authHeaders });
    const calibBody = await calibRes.json();
    expect(calibBody.mechanisms.suggestion_thresholds).toBe(true);
  });
});
