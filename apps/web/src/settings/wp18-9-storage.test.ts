import { describe, it, expect } from 'vitest';
import { ensureBuiltinSettingsModulesRegistered, getSettingsModule } from './index.js';
import { renderAdminSettingsModulePage } from '../pages/admin/settings.js';
import { renderAdminDashboardPage } from '../pages/admin/dashboard.js';

describe('WP-18.9 Settings > Storage module canaries', () => {
  const stubClient = {
    listEntries: async () => [],
    listMedia: async () => [],
    getTotalMediaBytes: async () => 0,
    settings: { get: async () => ({}) },
    system: { getProviders: async () => ({ providers: [] }) },
  } as any;

  it('[1-STORAGE-MODULE-REGISTERED] registers storage module in builtin settings registry', () => {
    ensureBuiltinSettingsModulesRegistered();
    const mod = getSettingsModule('storage');
    expect(mod).toBeDefined();
    expect(mod?.route).toBe('/admin/settings/storage');
    expect(mod?.title).toBe('Storage');
  });

  it('[2-STORAGE-PAGE-LIMITS-AND-DIALOGS] renders usage vs quota, backend, editable limits, media list, and ADR-025 delete confirmation dialogs', async () => {
    const html = await renderAdminSettingsModulePage(stubClient, 'storage');
    expect(html).toBeTruthy();
    expect(html).toContain('id="storage-usage-summary"');
    expect(html).toContain('id="storage-backend-value"');
    expect(html).toContain('id="setting-storage-max-image-mb"');
    expect(html).toContain('id="setting-storage-max-video-mb"');
    expect(html).toContain('id="setting-storage-quota-gb"');
    expect(html).toContain('id="storage-media-list"');
    expect(html).toContain('id="btn-storage-remove-unused"');
    expect(html).toContain('id="storage-delete-dialog"');
    expect(html).toContain('id="storage-prune-dialog"');
  });

  it('[3-TODAY-80PCT-QUOTA-WARNING] surfaces storage warning on Today Needs attention at >= 80% quota and omits below 80%', async () => {
    const htmlLow = await renderAdminDashboardPage(stubClient, { storageUsagePct: 45 });
    expect(htmlLow).not.toContain('id="att-storage-quota"');

    const htmlHigh = await renderAdminDashboardPage(stubClient, { storageUsagePct: 85 });
    expect(htmlHigh).toContain('id="att-storage-quota"');
    expect(htmlHigh).toContain('/admin/settings/storage');
    expect(htmlHigh).toContain('85%');
  });
});
