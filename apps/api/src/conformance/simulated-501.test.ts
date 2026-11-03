import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('AUD-18 / AUD-19 Honest Reporting for Simulated Endpoints (Findings M1, M5, M6 / Fix 3)', () => {
  const { app, adminToken } = createApp(undefined, { bootstrapAdminToken: 'simulated-admin-token-501' });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  it('GET /api/settings/evaluation returns 501 Not Implemented instead of fabricated metrics', async () => {
    const res = await app.request('/api/settings/evaluation', { headers: authHeaders });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.code).toBe('SIMULATED');
    expect(body.finding).toBe('M1');
  });

  it('POST /api/settings/backups/run-drill returns 501 Not Implemented instead of fabricated pass', async () => {
    const res = await app.request('/api/settings/backups/run-drill', { method: 'POST', headers: authHeaders });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.code).toBe('SIMULATED');
    expect(body.finding).toBe('M1');
  });

  it('POST /api/settings/notifications/test returns 501 Not Implemented', async () => {
    const res = await app.request('/api/settings/notifications/test', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ channel: 'ntfy', target: 'test' }),
    });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.code).toBe('SIMULATED');
  });

  it('GET /api/calibration/parameters returns 501 Not Implemented (Finding M1 / Fix 3)', async () => {
    const resParams = await app.request('/api/calibration/parameters', { headers: authHeaders });
    expect(resParams.status).toBe(501);
    expect((await resParams.json()).finding).toBe('M1');
  });

  it('GET /.well-known/living-portfolio.json returns 501 Not Implemented until credential verification exists', async () => {
    const res = await app.request('/.well-known/living-portfolio.json');
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.code).toBe('SIMULATED');
    expect(body.finding).toBe('M1');
  });

  it('GET /api/audit/topology-conflicts returns 501 Not Implemented instead of static fixture', async () => {
    const res = await app.request('/api/audit/topology-conflicts', { headers: authHeaders });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.code).toBe('SIMULATED');
    expect(body.finding).toBe('M6');
  });
});
