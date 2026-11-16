import { renderAdminShell, renderPageTemplate } from '../../../layouts/admin-shell.js';
import { renderButton, renderIcon, renderListRow } from '../../../primitives/index.js';
import { renderDialog, renderEmptyState, renderPageNotice } from '../../../components/index.js';
import { adaptDataSource, type WebDataClient } from '../../../lib/data-source.js';
import { escapeHtml } from '../../../lib/html.js';
import { ENTRIES_LIST_STRINGS } from '../../../strings/admin/entries-list.js';
import { ENTRIES_LIST_SCRIPT } from './list-script.js';

export interface EntriesListOptions {
  nonce?: string;
  siteName?: string;
  answeringEnabled?: boolean;
  page?: number;
  limit?: number;
  simulateError?: boolean;
}

function visibilityLabel(vis?: string): string {
  if (vis === 'private') return 'Draft';
  if (vis === 'unlisted') return 'Unlisted';
  return 'Public';
}

export async function renderAdminEntriesListPage(
  client: WebDataClient,
  options: EntriesListOptions = {}
): Promise<string> {
  const ds = adaptDataSource(client);
  const allEntries = options.simulateError ? [] : await ds.listEntries({ includePrivate: true });
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const total = allEntries.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = allEntries.slice((page - 1) * limit, page * limit);

  const rowsHtml = paged
    .map((entry) =>
      renderListRow({
        href: `/admin/entries/${encodeURIComponent(entry.id)}`,
        primary: entry.title || 'Untitled',
        secondary: entry.profile || 'freeform',
        stateLabel: visibilityLabel(entry.visibility),
        stateTone: entry.visibility === 'public' ? 'ok' : entry.visibility === 'unlisted' ? 'warn' : 'neutral',
        attributes: `data-entry-row="${escapeHtml(entry.id)}"`,
      })
    )
    .join('\n');

  const deleteDialogHtml = renderDialog({
    id: 'entries-delete-dialog',
    title: ENTRIES_LIST_STRINGS.deleteDialog.title,
    open: false,
    bodyHtml: `<p>${escapeHtml(ENTRIES_LIST_STRINGS.deleteDialog.warning)}</p>
<div class="lp-field">
  <label class="lp-field-label" for="entries-delete-confirm-input">${escapeHtml(ENTRIES_LIST_STRINGS.deleteDialog.inputLabel)}</label>
  <input type="text" id="entries-delete-confirm-input" class="lp-input" autocomplete="off" />
</div>`,
    footerHtml: `${renderButton({ id: 'entries-delete-cancel', label: ENTRIES_LIST_STRINGS.deleteDialog.cancelLabel, variant: 'secondary', size: 'sm' })}
${renderButton({ id: 'btn-entries-delete-confirm', label: ENTRIES_LIST_STRINGS.deleteDialog.confirmLabel, variant: 'danger', size: 'sm', disabled: true })}`,
  });

  const emptyStateHtml = renderEmptyState({
    id: 'entries-empty-state',
    headingTag: 'h2',
    title: ENTRIES_LIST_STRINGS.states.emptyTitle,
    body: ENTRIES_LIST_STRINGS.states.emptyBody,
    actionHtml: `<a href="/admin/entries/new" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(ENTRIES_LIST_STRINGS.newEntryLabel)}</a>`,
    hidden: Boolean(paged.length),
  });

  const bodyHtml = `
  ${renderPageNotice({ id: 'entries-offline-banner', tone: 'warn', message: ENTRIES_LIST_STRINGS.states.offline, hidden: true })}
  ${renderPageNotice({ id: 'entries-error-banner', tone: 'danger', message: ENTRIES_LIST_STRINGS.states.error, hidden: !options.simulateError })}
  ${renderPageNotice({ id: 'entries-loading-banner', tone: 'info', message: ENTRIES_LIST_STRINGS.states.loading, hidden: true })}

  <div class="lp-entries-toolbar">
    <div class="lp-entries-filter-group">
      <label class="lp-field-label" for="entries-filter-state">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateLabel)}</label>
      <div class="lp-select-wrap">
        <select id="entries-filter-state" class="lp-input lp-select">
          <option value="all">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateAll)}</option>
          <option value="private">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateDraft)}</option>
          <option value="unlisted">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateUnlisted)}</option>
          <option value="public">${escapeHtml(ENTRIES_LIST_STRINGS.filters.statePublic)}</option>
        </select>
        ${renderIcon('chevron-down', 16, 'lp-select-chevron')}
      </div>
    </div>
    <div class="lp-entries-filter-group">
      <label class="lp-field-label" for="entries-filter-type">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeLabel)}</label>
      <div class="lp-select-wrap">
        <select id="entries-filter-type" class="lp-input lp-select">
          <option value="all">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeAll)}</option>
          <option value="work">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeWork)}</option>
          <option value="note">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeNote)}</option>
          <option value="venture">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeVenture)}</option>
        </select>
        ${renderIcon('chevron-down', 16, 'lp-select-chevron')}
      </div>
    </div>
    <div class="lp-entries-search-group">
      <label class="lp-field-label" for="entries-search">${escapeHtml(ENTRIES_LIST_STRINGS.filters.searchLabel)}</label>
      <div class="lp-entries-search-row">
        <input type="search" id="entries-search" class="lp-input" placeholder="${escapeHtml(ENTRIES_LIST_STRINGS.filters.searchPlaceholder)}" />
        ${renderButton({ id: 'entries-search-submit', label: ENTRIES_LIST_STRINGS.filters.searchSubmit, variant: 'secondary', size: 'sm' })}
      </div>
    </div>
  </div>

  ${emptyStateHtml}
  <div id="entries-list-region" class="lp-list">${rowsHtml}</div>

  <div id="entries-pagination" class="lp-entries-pagination">
    ${renderButton({ id: 'btn-entries-prev', label: ENTRIES_LIST_STRINGS.pagination.prev, variant: 'secondary', size: 'sm', disabled: page <= 1 })}
    <span id="entries-page-summary" class="lp-field-help">${escapeHtml(ENTRIES_LIST_STRINGS.pagination.summary(page, totalPages, total))}</span>
    ${renderButton({ id: 'btn-entries-next', label: ENTRIES_LIST_STRINGS.pagination.next, variant: 'secondary', size: 'sm', disabled: page >= totalPages })}
  </div>

  ${deleteDialogHtml}
  ${ENTRIES_LIST_SCRIPT}`;

  const content = renderPageTemplate({
    title: ENTRIES_LIST_STRINGS.heading,
    description: ENTRIES_LIST_STRINGS.lead,
    actionsHtml: `<a href="/admin/entries/new" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(ENTRIES_LIST_STRINGS.newEntryLabel)}</a>`,
    bodyHtml,
  });

  return renderAdminShell(ENTRIES_LIST_STRINGS.pageTitle, '/admin/entries', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
  });
}
