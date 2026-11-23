import { renderAdminShell, renderPageTemplate } from '../../../layouts/admin-shell.js';
import { renderButton, renderField, renderIcon, renderItem, renderList, renderText } from '../../../primitives/index.js';
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
      renderItem({
        href: `/admin/entries/${encodeURIComponent(entry.id)}`,
        title: entry.title || 'Untitled',
        subtitle: entry.profile || 'freeform',
        statusLabel: visibilityLabel(entry.visibility),
        statusTone: entry.visibility === 'public' ? 'ok' : entry.visibility === 'unlisted' ? 'warn' : 'neutral',
        showChevron: true,
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

  <div class="lp-stack lp-gap-related">
    <div class="lp-entries-toolbar">
      <div class="lp-entries-filter-group">
        ${renderField({
          kind: 'select',
          id: 'entries-filter-state',
          name: 'filterState',
          label: ENTRIES_LIST_STRINGS.filters.stateLabel,
          options: [
            { value: 'all', label: ENTRIES_LIST_STRINGS.filters.stateAll },
            { value: 'private', label: ENTRIES_LIST_STRINGS.filters.stateDraft },
            { value: 'unlisted', label: ENTRIES_LIST_STRINGS.filters.stateUnlisted },
            { value: 'public', label: ENTRIES_LIST_STRINGS.filters.statePublic },
          ],
        })}
      </div>
      <div class="lp-entries-filter-group">
        ${renderField({
          kind: 'select',
          id: 'entries-filter-type',
          name: 'filterType',
          label: ENTRIES_LIST_STRINGS.filters.typeLabel,
          options: [
            { value: 'all', label: ENTRIES_LIST_STRINGS.filters.typeAll },
            { value: 'work', label: ENTRIES_LIST_STRINGS.filters.typeWork },
            { value: 'note', label: ENTRIES_LIST_STRINGS.filters.typeNote },
            { value: 'venture', label: ENTRIES_LIST_STRINGS.filters.typeVenture },
          ],
        })}
      </div>
      <div class="lp-entries-search-group">
        ${renderField({
          kind: 'input',
          id: 'entries-search',
          name: 'search',
          label: ENTRIES_LIST_STRINGS.filters.searchLabel,
          placeholder: ENTRIES_LIST_STRINGS.filters.searchPlaceholder,
        })}
      </div>
    </div>

    ${emptyStateHtml}
    ${renderList({ id: 'entries-list-region', variant: 'interactive', itemsHtml: rowsHtml })}
  </div>

  <div id="entries-pagination" class="lp-entries-pagination">
    ${renderButton({ id: 'btn-entries-prev', label: ENTRIES_LIST_STRINGS.pagination.prev, variant: 'secondary', size: 'sm', disabled: page <= 1 })}
    ${renderText({ id: 'entries-page-summary', variant: 'caption', tag: 'span', className: 'lp-field-help', text: ENTRIES_LIST_STRINGS.pagination.summary(page, totalPages, total) })}
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
