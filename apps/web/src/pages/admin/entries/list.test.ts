import { describe, expect, it } from 'vitest';
import { renderAdminEntriesListPage } from './list.js';

const mockEntries = [
  { id: 'e1', title: 'Alpha Project', slug: 'alpha', profile: 'work', visibility: 'public', structureLevel: 'L3' },
  { id: 'e2', title: 'Beta Note', slug: 'beta', profile: 'note', visibility: 'private', structureLevel: 'L1' },
];

const mockClient = {
  entries: { list: async () => ({ entries: mockEntries }) },
  listEntries: async () => mockEntries,
} as any;

const emptyClient = {
  entries: { list: async () => ({ entries: [] }) },
  listEntries: async () => [],
} as any;

describe('WP-16.3 Admin Entries List Page', () => {
  it('renders rows with state chips, pagination, and zero inline styles (D-MIN: no meter or row menu)', async () => {
    const html = await renderAdminEntriesListPage(mockClient, { page: 1, limit: 1 });
    expect(html).toContain('data-entry-row="e1"');
    expect(html).not.toContain('data-entry-row="e2"');
    expect(html).toContain('Page 1 of 2 · 2 total');
    expect(html).not.toContain('class="lp-structure-meter"');
    expect(html).not.toContain('class="lp-row-menu-btn"');
    expect(html).toContain('id="entries-delete-dialog"');
    expect(html).not.toMatch(/\bstyle\s*=/);
  });

  it('renders empty and error states cleanly', async () => {
    const emptyHtml = await renderAdminEntriesListPage(emptyClient);
    expect(emptyHtml).toContain('No matching entries');
    const errorHtml = await renderAdminEntriesListPage(emptyClient, { simulateError: true });
    expect(errorHtml).toContain('id="entries-error-banner"');
    expect(errorHtml).not.toContain('id="entries-error-banner" class="lp-page-notice lp-notice-danger" hidden');
  });
});
