/**
 * Admin Entry Client Bundle (WP-14.0 & WP-14.1)
 * Typed, modular client-side handlers for entry authoring, save, publish, unlist, unpublish, and delete.
 */

import {
  commitEntry,
  clearPreviewToken,
  setPreviewToken,
  updateStateChip,
  updateActionButtons,
  setActiveEntryState,
  Intent,
  Visibility,
} from './commit-entry.js';
import {
  initPublishDialogHandlers,
  openPublishDialog,
  closePublishDialog,
} from './publish-dialog.js';
import {
  initDraftBuffer,
  clearDraftBuffer,
  saveDraftBuffer,
  restoreDraftBuffer,
} from './draft-buffer.js';

export {
  commitEntry,
  clearPreviewToken,
  setPreviewToken,
  updateStateChip,
  updateActionButtons,
  setActiveEntryState,
  initPublishDialogHandlers,
  openPublishDialog,
  closePublishDialog,
  initDraftBuffer,
  clearDraftBuffer,
  saveDraftBuffer,
  restoreDraftBuffer,
};

export function escapeClientHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function clientFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const csrf = sessionStorage.getItem('lp_csrf_token');
  if (csrf) {
    headers.set('X-CSRF-Token', csrf);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { credentials: 'same-origin', ...options, headers });
}

let toastTimeout: any = null;
export function showEditorFeedback(messageHtml: string, isError = false, toastDurationMs = 6000): void {
  const statusLine = document.getElementById('editor-status-line');
  const toast = document.getElementById('editor-toast');
  const banner = document.getElementById('admin-status-banner');
  const cleanHtml = messageHtml.startsWith('<div') ? messageHtml : `<span>${messageHtml}</span>`;

  if (statusLine) {
    statusLine.innerHTML = cleanHtml;
    statusLine.style.display = 'inline-flex';
    statusLine.style.outline = 'none';
    statusLine.focus();
  }

  if (toast) {
    toast.innerHTML = cleanHtml;
    toast.style.display = 'block';
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, toastDurationMs);
  }

  if (banner) {
    banner.innerHTML = messageHtml.startsWith('<div')
      ? messageHtml
      : `<div class="${isError ? 'later-thinking-banner' : 'as-of-banner'}">${messageHtml}</div>`;
  }
}

export async function refreshEntriesList(selectedId?: string): Promise<void> {
  try {
    const res = await clientFetch('/api/entries?visibility=all');
    if (!res.ok) return;
    const data = await res.json();
    const entries = data.entries || [];
    const listEl = document.getElementById('admin-entries-list');
    if (listEl) {
      listEl.innerHTML = entries
        .map((e: any) => {
          const isCurrent = selectedId && (e.id === selectedId || e.slug === selectedId);
          const selStyle = isCurrent
            ? 'background:var(--surface-raised, var(--lp-color-surface-l1));border-left:var(--lp-border-role-rule) solid var(--lp-color-accent-default);'
            : '';
          let badgeColor = 'var(--lp-color-role-neutral-fg)';
          let badgeBg = 'var(--lp-color-role-neutral-bg)';
          if (e.visibility === 'public') {
            badgeColor = 'var(--lp-color-role-success-fg)';
            badgeBg = 'var(--lp-color-role-success-bg)';
          } else if (e.visibility === 'unlisted') {
            badgeColor = 'var(--lp-color-role-warning-fg)';
            badgeBg = 'var(--lp-color-role-warning-bg)';
          }
          const visibilityBadge = `<span class="chip" style="font-size:var(--lp-font-size-12);padding:var(--lp-border-hairline) var(--lp-space-inset-badge-x);background:${badgeBg};color:${badgeColor}">${escapeClientHtml(
            e.visibility
          )}</span>`;
          return `
          <li data-entry-id="${escapeClientHtml(e.id)}" style="display:flex;align-items:center;justify-content:space-between;padding:var(--lp-space-inset-item-x) var(--lp-space-proximity-2);border-bottom:var(--lp-border-hairline) solid var(--rule);font-size:var(--lp-font-size-12);cursor:pointer;${selStyle}" class="admin-entry-item" role="button" tabindex="0">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:var(--lp-size-card-min-h)">${escapeClientHtml(e.title || 'Untitled')}</span>
            ${visibilityBadge}
          </li>`;
        })
        .join('');
    }
    const heading = document.getElementById('entries-heading');
    if (heading) {
      heading.textContent = `All entries (${entries.length})`;
    }
  } catch (_) {}
}

export function initAdminEntryHandlers(): void {
  const form = document.getElementById('admin-entry-form') as HTMLFormElement | null;
  const saveDraftBtn = document.getElementById('btn-save-draft');
  const unlistBtn = document.getElementById('btn-unlist');
  const unpublishBtn = document.getElementById('btn-unpublish');
  const deleteBtn = document.getElementById('btn-delete-entry');
  const redactBtn = document.getElementById('btn-redaction-check');
  const newEntryBtn = document.getElementById('btn-new-entry');
  const entryIdInput = document.getElementById('entry-id') as HTMLInputElement | null;
  const titleInput = document.getElementById('entry-title') as HTMLInputElement | null;
  const slugInput = document.getElementById('entry-slug') as HTMLInputElement | null;
  const bodyInput = document.getElementById('entry-body') as HTMLTextAreaElement | null;
  const dateInput = document.getElementById('entry-date') as HTMLInputElement | null;
  const dateError = document.getElementById('entry-date-error');
  const temporalSelect = document.getElementById('entry-temporal-level') as HTMLSelectElement | null;
  const rangeEndContainer = document.getElementById('range-end-container');
  const rangeEndInput = document.getElementById('entry-date-range-end') as HTMLInputElement | null;
  const visibilityInput = document.getElementById('entry-visibility') as HTMLSelectElement | null;

  // Default date to today on client (Spec §2.1.3, UX-11)
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  // Validate date on blur (UX-11)
  if (dateInput) {
    dateInput.addEventListener('blur', () => {
      const val = dateInput.value.trim();
      if (!val || isNaN(Date.parse(val))) {
        if (dateError) {
          dateError.textContent = 'A valid date is required.';
          dateError.style.display = 'block';
        }
      } else {
        if (dateError) dateError.style.display = 'none';
      }
    });
  }

  // Temporal confidence control (UX-22)
  if (temporalSelect && rangeEndContainer) {
    temporalSelect.addEventListener('change', () => {
      rangeEndContainer.style.display = temporalSelect.value === 'range' ? 'block' : 'none';
      if (temporalSelect.value !== 'range' && rangeEndInput) {
        rangeEndInput.value = '';
      }
    });
  }

  // Track slug auto-generation
  let slugIsManual = false;
  if (slugInput) {
    slugInput.addEventListener('input', () => {
      slugIsManual = true;
    });
  }
  if (titleInput && slugInput) {
    titleInput.addEventListener('input', (e: any) => {
      if ((!entryIdInput || !entryIdInput.value) && !slugIsManual) {
        slugInput.value = slugify(e.target.value);
      }
    });
  }

  // Clear preview token on body input (Spec §2.1.2)
  if (bodyInput) {
    bodyInput.addEventListener('input', () => {
      clearPreviewToken('invalidated');
    });
  }

  // Save Draft (commitEntry('save'))
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await commitEntry('save');
    });
  }

  // Form submit opens pre-flight publish dialog (single publish path, UX-57)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      openPublishDialog();
    });
  }

  // Unlist (commitEntry('unlist'))
  if (unlistBtn) {
    unlistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await commitEntry('unlist');
    });
  }

  // Unpublish (commitEntry('unpublish'))
  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await commitEntry('unpublish');
    });
  }

  // Delete
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const entryId = entryIdInput?.value;
      if (!entryId) return;
      const title = titleInput?.value || 'Entry';
      if (!confirm(`Permanently delete "${title}" and all its revisions?`)) return;
      try {
        const res = await clientFetch(`/api/entries/${entryId}`, { method: 'DELETE' });
        if (res.ok) {
          if (newEntryBtn) newEntryBtn.click();
          showEditorFeedback(`<div class="as-of-banner">Deleted "${escapeClientHtml(title)}".</div>`, false);
          await refreshEntriesList();
        } else {
          const errData = await res.json().catch(() => ({}));
          showEditorFeedback(
            `<div class="later-thinking-banner" role="alert">${escapeClientHtml(
              errData.error || errData.message || 'Error deleting entry'
            )}</div>`,
            true
          );
        }
      } catch (_) {
        showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error deleting entry.</div>', true);
      }
    });
  }

  // New Entry button
  if (newEntryBtn) {
    newEntryBtn.addEventListener('click', () => {
      clearDraftBuffer();
      if (entryIdInput) entryIdInput.value = '';
      if (titleInput) titleInput.value = '';
      if (slugInput) slugInput.value = '';
      if (bodyInput) bodyInput.value = '';
      if (visibilityInput) visibilityInput.value = 'private';
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      if (dateError) dateError.style.display = 'none';
      if (temporalSelect) temporalSelect.value = 'exact';
      if (rangeEndContainer) rangeEndContainer.style.display = 'none';
      if (rangeEndInput) rangeEndInput.value = '';
      slugIsManual = false;
      setActiveEntryState({
        id: '',
        visibility: 'private',
        lastCommittedBody: '',
        previewToken: '',
        hasWarnings: false,
      });
      clearPreviewToken('new');
      updateStateChip('private');
      updateActionButtons('', 'private');
      const modeHeading = document.getElementById('editor-mode-heading');
      if (modeHeading) modeHeading.textContent = 'New entry';
    });
  }

  // Sync state when entries are selected in the list
  const listEl = document.getElementById('admin-entries-list');
  if (listEl) {
    listEl.addEventListener('click', async (e: any) => {
      const item = e.target.closest('li[data-entry-id]');
      if (!item) return;
      const id = item.getAttribute('data-entry-id');
      if (!id) return;
      try {
        const res = await clientFetch(`/api/entries/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        const entry = data.entry;
        const currentRev = data.currentRevision || data.revision;
        if (entryIdInput) entryIdInput.value = entry.id;
        if (titleInput) titleInput.value = entry.title || '';
        if (slugInput) slugInput.value = entry.slug || '';
        if (bodyInput) bodyInput.value = currentRev?.body_md || '';
        if (visibilityInput) visibilityInput.value = entry.visibility;
        if (dateInput && currentRev?.valid_from) {
          dateInput.value = currentRev.valid_from.slice(0, 10);
        }
        if (dateError) dateError.style.display = 'none';
        if (temporalSelect) {
          temporalSelect.value = currentRev?.temporal_level || 'exact';
        }
        if (rangeEndContainer) {
          rangeEndContainer.style.display = currentRev?.temporal_level === 'range' ? 'block' : 'none';
        }
        if (rangeEndInput) {
          rangeEndInput.value = currentRev?.valid_from_range_end ? currentRev.valid_from_range_end.slice(0, 10) : '';
        }
        slugIsManual = true;

        setActiveEntryState({
          id: entry.id,
          visibility: entry.visibility as Visibility,
          lastCommittedBody: currentRev?.body_md || '',
          previewToken: '',
          hasWarnings: false,
        });

        clearPreviewToken('select');
        updateStateChip(entry.visibility as Visibility);
        updateActionButtons(entry.id, entry.visibility as Visibility);

        const modeHeading = document.getElementById('editor-mode-heading');
        if (modeHeading) modeHeading.textContent = `Edit Entry: ${entry.title}`;
      } catch (_) {}
    });
  }

  // Initialize Publish Dialog handlers (WP-14.3)
  initPublishDialogHandlers();

  // Initialize Draft Buffer & Autosave (WP-14.4)
  initDraftBuffer();
}

// Make functions accessible globally
if (typeof window !== 'undefined') {
  (window as any).showEditorFeedback = showEditorFeedback;
  (window as any).refreshEntriesList = refreshEntriesList;
  (window as any).initAdminEntryHandlers = initAdminEntryHandlers;
  (window as any).__lp_client_bundle_loaded = true;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAdminEntryHandlers());
  } else {
    initAdminEntryHandlers();
  }
}
