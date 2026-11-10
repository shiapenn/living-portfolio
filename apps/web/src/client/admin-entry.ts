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

export {
  commitEntry,
  clearPreviewToken,
  setPreviewToken,
  updateStateChip,
  updateActionButtons,
  setActiveEntryState,
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
export function showEditorFeedback(messageHtml: string, isError = false): void {
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
    }, 6000);
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
            ? 'background:var(--surface-raised,#f8fafc);border-left:3px solid var(--indigo-600,#3b82f6);'
            : '';
          let badgeColor = '#475569';
          let badgeBg = '#f1f5f9';
          if (e.visibility === 'public') {
            badgeColor = '#166534';
            badgeBg = '#dcfce7';
          } else if (e.visibility === 'unlisted') {
            badgeColor = '#92400e';
            badgeBg = '#fef3c7';
          }
          const visibilityBadge = `<span class="chip" style="font-size:10px;padding:1px 5px;background:${badgeBg};color:${badgeColor}">${escapeClientHtml(
            e.visibility
          )}</span>`;
          return `
          <li data-entry-id="${escapeClientHtml(e.id)}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 6px;border-bottom:1px solid var(--rule);font-size:13px;cursor:pointer;${selStyle}" class="admin-entry-item" role="button" tabindex="0">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${escapeClientHtml(e.title || 'Untitled')}</span>
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
  const publishBtn = document.getElementById('btn-publish-entry');
  const unlistBtn = document.getElementById('btn-unlist');
  const unpublishBtn = document.getElementById('btn-unpublish');
  const deleteBtn = document.getElementById('btn-delete-entry');
  const redactBtn = document.getElementById('btn-redaction-check');
  const newEntryBtn = document.getElementById('btn-new-entry');
  const entryIdInput = document.getElementById('entry-id') as HTMLInputElement | null;
  const titleInput = document.getElementById('entry-title') as HTMLInputElement | null;
  const slugInput = document.getElementById('entry-slug') as HTMLInputElement | null;
  const bodyInput = document.getElementById('entry-body') as HTMLTextAreaElement | null;
  const visibilityInput = document.getElementById('entry-visibility') as HTMLSelectElement | null;

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

  // Publish (commitEntry('publish'))
  if (publishBtn) {
    publishBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await commitEntry('publish');
    });
  }

  // Form submit fallback
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await commitEntry('publish');
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
      if (entryIdInput) entryIdInput.value = '';
      if (titleInput) titleInput.value = '';
      if (slugInput) slugInput.value = '';
      if (bodyInput) bodyInput.value = '';
      if (visibilityInput) visibilityInput.value = 'private';
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
        const currentRev = data.currentRevision;
        if (entryIdInput) entryIdInput.value = entry.id;
        if (titleInput) titleInput.value = entry.title || '';
        if (slugInput) slugInput.value = entry.slug || '';
        if (bodyInput) bodyInput.value = currentRev?.body_md || '';
        if (visibilityInput) visibilityInput.value = entry.visibility;
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
