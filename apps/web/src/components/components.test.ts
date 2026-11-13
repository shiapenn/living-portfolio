import { describe, it, expect } from 'vitest';
import {
  renderPageNotice,
  renderStatusLine,
  renderDialog,
  renderDrawer,
  renderDisclosure,
  renderTabs,
  renderTable,
  renderEmptyState,
} from './index.js';

describe('WP-15.3 Feedback & Containers', () => {
  it('renders PageNotice as persistent dismissible notice without timed toast', () => {
    const notice = renderPageNotice({
      id: 'notice-1',
      tone: 'warn',
      message: 'Your backup folder is not configured yet.',
      dismissible: true,
    });
    expect(notice).toContain('role="status"');
    expect(notice).toContain('lp-notice-warn');
    expect(notice).toContain('data-lp-notice-dismiss');
    expect(notice).toContain('Your backup folder is not configured yet.');
  });

  it('renders StatusLine with polite/alert live region and optional Undo button', () => {
    const line = renderStatusLine({
      id: 'editor-status-line',
      message: 'Moved to Private.',
      tone: 'ok',
      undoLabel: 'Undo',
      undoSeconds: 8,
    });
    expect(line).toContain('id="editor-status-line"');
    expect(line).toContain('role="status"');
    expect(line).toContain('Moved to Private.');
    expect(line).toContain('Undo (8s)');
  });

  it('renders Dialog and Drawer with role="dialog", aria-modal="true", aria-labelledby, and close button', () => {
    const dialog = renderDialog({
      id: 'dlg-confirm',
      title: 'Publish entry',
      bodyHtml: '<p>Ready to publish?</p>',
      footerHtml: '<button type="button" class="lp-btn lp-btn-primary">Publish</button>',
    });
    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain('aria-labelledby="dlg-confirm-title"');
    expect(dialog).toContain('data-lp-dialog-close');

    const drawer = renderDrawer({
      id: 'drw-structure',
      title: 'Structure',
      bodyHtml: '<p>Details here</p>',
      position: 'right',
    });
    expect(drawer).toContain('role="dialog"');
    expect(drawer).toContain('aria-modal="true"');
    expect(drawer).toContain('lp-drawer-right');
    expect(drawer).toContain('data-lp-dialog-close');
  });

  it('renders Disclosure with summary and optional summaryMeta', () => {
    const disc = renderDisclosure({
      id: 'disc-details',
      summary: 'Details',
      summaryMeta: 'Unlisted · 13 Nov 2026 · Exact',
      bodyHtml: '<p>Slug and visibility</p>',
    });
    expect(disc).toContain('<details');
    expect(disc).toContain('<summary');
    expect(disc).toContain('Details');
    expect(disc).toContain('Unlisted · 13 Nov 2026 · Exact');
  });

  it('renders Tabs with tablist, roving tabindex (0/-1), aria-selected, and hidden inactive panels', () => {
    const tabs = renderTabs({
      id: 'inspector-tabs',
      ariaLabel: 'Entry structure sections',
      tabs: [
        { id: 'overview', label: 'Overview', panelHtml: '<p>Overview content</p>', active: true },
        { id: 'history', label: 'History', panelHtml: '<p>History content</p>' },
      ],
    });
    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-label="Entry structure sections"');
    expect(tabs).toContain('aria-selected="true"');
    expect(tabs).toContain('tabindex="0"');
    expect(tabs).toContain('aria-selected="false"');
    expect(tabs).toContain('tabindex="-1"');
    expect(tabs).toContain('role="tabpanel"');
    expect(tabs).toContain('hidden');
  });

  it('renders Table and EmptyState with semantic markup', () => {
    const table = renderTable({
      id: 'tbl-entries',
      caption: 'Recent entries',
      columns: [
        { key: 'title', label: 'Title' },
        { key: 'state', label: 'State' },
      ],
      rows: [{ title: 'First post', state: 'Public' }],
    });
    expect(table).toContain('<table');
    expect(table).toContain('<caption>Recent entries</caption>');
    expect(table).toContain('<th scope="col">Title</th>');
    expect(table).toContain('First post');

    const empty = renderEmptyState({
      id: 'empty-entries',
      title: 'No entries yet',
      body: 'Write your first entry to get started.',
      actionHtml: '<button type="button" class="lp-btn lp-btn-primary">New entry</button>',
    });
    expect(empty).toContain('lp-empty-state');
    expect(empty).toContain('No entries yet');
  });
});
