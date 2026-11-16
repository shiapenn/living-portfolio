import { describe, expect, it } from 'vitest';
import { renderAdminDashboardPage } from './dashboard.js';

const emptyClient = {
  entries: { list: async () => ({ entries: [] }) },
  listEntries: async () => [],
} as any;

describe('WP-16.2 / WP-16.C Admin Today Dashboard', () => {
  it('renders needs-attention items from fixtures with zero inline styles', async () => {
    const html = await renderAdminDashboardPage(emptyClient, {
      pendingInboxCount: 2,
      draftCount: 3,
      pendingRulesCount: 1,
      buildFailed: true,
      backupOverdue: true,
      answeringEnabled: false,
      checklistDismissed: false,
    });

    expect(html).toContain('id="att-answering-paused"');
    expect(html).toContain('Automated answering is paused · Resume');
    expect(html).toContain('id="att-build-failed"');
    expect(html).toContain('id="att-inbox"');
    expect(html).toContain('2 visitor questions waiting for review');
    expect(html).toContain('id="att-drafts"');
    expect(html).toContain('3 unpublished drafts in workspace');
    expect(html).toContain('id="att-rules"');
    expect(html).toContain('id="att-backup"');
    expect(html).toContain('id="today-checklist-card"');
    expect(html).not.toContain('id="today-explanation"');
    expect(html).not.toMatch(/\bstyle\s*=/);
  });

  it('omits checklist card when checklistDismissed is true and shows empty line when nothing pending', async () => {
    const html = await renderAdminDashboardPage(emptyClient, {
      checklistDismissed: true,
    });
    expect(html).not.toContain('id="today-checklist-card"');
    expect(html).toContain('Nothing needs your attention.');
  });
});
