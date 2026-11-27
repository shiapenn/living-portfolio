import { describe, it, expect } from 'vitest';
import { createWebApp } from '../../app.js';

describe('WP-18.8 Quick Log capture route canaries', () => {
  const stubClient = {
    listEntries: async () => [],
    getEntry: async () => null,
    getRevisions: async () => [],
    listVentures: async () => [{ id: 'v-1', name: 'Core Platform', slug: 'core-platform', summary: '', status: 'active' }],
    listAcceptedRelations: async () => [],
    listEscalations: async () => [],
    listBookings: async () => [],
    listPendingRules: async () => [],
    listActiveRules: async () => [],
    listDiscardedRules: async () => [],
    listConflicts: async () => [],
    listMedia: async () => [],
    getTotalMediaBytes: async () => 0,
    getSettings: async () => ({}),
    getAuthStatus: async () => ({ setupCompleted: true, authenticated: true }),
    getSession: async () => ({ authenticated: true, username: 'owner' }),
  } as any;

  const authOpts = {
    client: stubClient,
    checkSession: async () => ({ authenticated: true, setupRequired: false }),
  };

  it('[1-QUICK-LOG-ROUTE-AND-4-FIELDS] serves /admin/quick-log with 4 capture fields and single primary Save button', async () => {
    const { app } = createWebApp(authOpts);
    const res = await app.request('/admin/quick-log');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="ql-happened"');
    expect(html).toContain('id="ql-decided"');
    expect(html).toContain('id="ql-learned"');
    expect(html).toContain('id="ql-venture"');
    expect(html).toContain('Core Platform');
    expect(html).toContain('id="btn-ql-save"');
    expect(html).toContain('data-archetype="form"');
  });

  it('[2-QUICK-LOG-SHORTCUT-ALIAS] serves /quick-log alias pointing to Quick Log capture', async () => {
    const { app } = createWebApp(authOpts);
    const res = await app.request('/quick-log');
    expect([200, 302]).toContain(res.status);
    if (res.status === 200) {
      const html = await res.text();
      expect(html).toContain('id="ql-happened"');
    } else {
      expect(res.headers.get('location')).toBe('/admin/quick-log');
    }
  });

  it('[3-WEB-MANIFEST-SHORTCUT] exposes /manifest.webmanifest with Quick Log shortcut', async () => {
    const { app } = createWebApp(authOpts);
    const res = await app.request('/manifest.webmanifest');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.shortcuts)).toBe(true);
    expect(json.shortcuts.some((s: any) => s.url === '/admin/quick-log')).toBe(true);
  });
});
