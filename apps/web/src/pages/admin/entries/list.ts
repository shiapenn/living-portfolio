import { renderAdminShell } from '../../../layouts/admin-shell.js';
import { renderButton, renderStatusDot } from '../../../primitives/index.js';
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

function levelSteps(level?: string): number {
  if (level === 'L3') return 4;
  if (level === 'L2') return 3;
  if (level === 'L1') return 2;
  return 1;
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
    .map((entry) => {
      const lvl = (entry as any).structureLevel || 'L0';
      const steps = levelSteps(lvl);
      const meter = [1, 2, 3, 4]
        .map((n) => `<span class="lp-structure-step${n <= steps ? ' is-filled' : ''}"></span>`)
        .join('');
      const unpublishBtn =
        entry.visibility === 'private'
          ? ''
          : `<button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-action="unpublish" data-id="${escapeHtml(entry.id)}">${escapeHtml(ENTRIES_LIST_STRINGS.rowActions.unpublish)}</button>`;
      return `<li class="lp-entries-row" data-entry-row="${escapeHtml(entry.id)}">
  <div class="lp-entries-row-main">
    <a href="/admin/entries/${encodeURIComponent(entry.id)}" class="lp-entries-row-title">${escapeHtml(entry.title || 'Untitled')}</a>
    <div class="lp-entries-row-meta">
      ${renderStatusDot({ label: visibilityLabel(entry.visibility), tone: entry.visibility === 'public' ? 'ok' : entry.visibility === 'unlisted' ? 'warn' : 'neutral' })}
      <span class="lp-entry-profile">${escapeHtml(entry.profile || 'work')}</span>
      <span class="lp-structure-meter" aria-label="Structure ${escapeHtml(lvl)}">${meter}<span class="lp-structure-label">${escapeHtml(lvl)}</span></span>
    </div>
  </div>
  <div class="lp-menu-wrap">
    <button type="button" class="lp-btn lp-btn-secondary lp-btn-sm lp-row-menu-btn" aria-haspopup="menu" aria-expanded="false">Actions</button>
    <div class="lp-popover-menu lp-menu-popover-float" role="menu" hidden>
      <a href="/admin/entries/${encodeURIComponent(entry.id)}" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(ENTRIES_LIST_STRINGS.rowActions.edit)}</a>
      <a href="/admin/entries/${encodeURIComponent(entry.id)}?tab=context" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(ENTRIES_LIST_STRINGS.rowActions.addContext)}</a>
      ${unpublishBtn}
      <button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-action="delete" data-id="${escapeHtml(entry.id)}">${escapeHtml(ENTRIES_LIST_STRINGS.rowActions.del)}</button>
    </div>
  </div>
</li>`;
    })
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

  const content = `<div class="lp-entries-stack">
  <header class="lp-entries-header">
    <div>
      <h1 class="lp-type-title">${escapeHtml(ENTRIES_LIST_STRINGS.heading)}</h1>
      <p class="lp-field-help">${escapeHtml(ENTRIES_LIST_STRINGS.lead)}</p>
    </div>
    <a href="/admin/entries/new" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(ENTRIES_LIST_STRINGS.newEntryLabel)}</a>
  </header>

  ${renderPageNotice({ id: 'entries-offline-banner', tone: 'warn', message: ENTRIES_LIST_STRINGS.states.offline, hidden: true })}
  ${renderPageNotice({ id: 'entries-error-banner', tone: 'danger', message: ENTRIES_LIST_STRINGS.states.error, hidden: !options.simulateError })}
  ${renderPageNotice({ id: 'entries-loading-banner', tone: 'info', message: ENTRIES_LIST_STRINGS.states.loading, hidden: true })}

  <div class="lp-entries-toolbar">
    <div class="lp-entries-filter-group">
      <label class="lp-field-label" for="entries-filter-state">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateLabel)}</label>
      <select id="entries-filter-state" class="lp-input">
        <option value="all">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateAll)}</option>
        <option value="private">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateDraft)}</option>
        <option value="unlisted">${escapeHtml(ENTRIES_LIST_STRINGS.filters.stateUnlisted)}</option>
        <option value="public">${escapeHtml(ENTRIES_LIST_STRINGS.filters.statePublic)}</option>
      </select>
    </div>
    <div class="lp-entries-filter-group">
      <label class="lp-field-label" for="entries-filter-type">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeLabel)}</label>
      <select id="entries-filter-type" class="lp-input">
        <option value="all">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeAll)}</option>
        <option value="work">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeWork)}</option>
        <option value="note">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeNote)}</option>
        <option value="venture">${escapeHtml(ENTRIES_LIST_STRINGS.filters.typeVenture)}</option>
      </select>
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
  <ul id="entries-list-region" class="lp-entries-list">${rowsHtml}</ul>

  <div id="entries-pagination" class="lp-entries-pagination">
    ${renderButton({ id: 'btn-entries-prev', label: ENTRIES_LIST_STRINGS.pagination.prev, variant: 'secondary', size: 'sm', disabled: page <= 1 })}
    <span id="entries-page-summary" class="lp-field-help">${escapeHtml(ENTRIES_LIST_STRINGS.pagination.summary(page, totalPages, total))}</span>
    ${renderButton({ id: 'btn-entries-next', label: ENTRIES_LIST_STRINGS.pagination.next, variant: 'secondary', size: 'sm', disabled: page >= totalPages })}
  </div>

  ${deleteDialogHtml}
</div>
${ENTRIES_LIST_SCRIPT}`;

  return renderAdminShell(ENTRIES_LIST_STRINGS.pageTitle, '/admin/entries', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
  });
}
