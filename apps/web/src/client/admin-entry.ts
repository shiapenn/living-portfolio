/**
 * Admin Entry Client Bundle (WP-14.0)
 * Typed, modular client-side handlers for entry authoring, save, publish, unpublish, and delete.
 */

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
      listEl.innerHTML = entries.map((e: any) => {
        const isCurrent = selectedId && (e.id === selectedId || e.slug === selectedId);
        const selStyle = isCurrent
          ? 'background:var(--surface-raised,#f8fafc);border-left:3px solid var(--indigo-600,#3b82f6);'
          : '';
        const visibilityBadge = e.visibility === 'public'
          ? '<span class="chip" style="font-size:10px;padding:1px 5px;background:#dcfce7;color:#166534">public</span>'
          : '<span class="chip" style="font-size:10px;padding:1px 5px;background:#f1f5f9;color:#475569">private</span>';
        return `
          <li data-entry-id="${escapeClientHtml(e.id)}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 6px;border-bottom:1px solid var(--rule);font-size:13px;cursor:pointer;${selStyle}" class="admin-entry-item" role="button" tabindex="0">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${escapeClientHtml(e.title || 'Untitled')}</span>
            ${visibilityBadge}
          </li>`;
      }).join('');
    }
    const heading = document.getElementById('entries-heading');
    if (heading) {
      heading.textContent = `All entries (${entries.length})`;
    }
  } catch (_) {}
}

export function initAdminEntryHandlers(): void {
  const saveDraftBtn = document.getElementById('btn-save-draft');
  const unpublishBtn = document.getElementById('btn-unpublish');
  const deleteBtn = document.getElementById('btn-delete-entry');
  const newEntryBtn = document.getElementById('btn-new-entry');
  const entryIdInput = document.getElementById('entry-id') as HTMLInputElement | null;
  const titleInput = document.getElementById('entry-title') as HTMLInputElement | null;
  const slugInput = document.getElementById('entry-slug') as HTMLInputElement | null;
  const bodyInput = document.getElementById('entry-body') as HTMLTextAreaElement | null;
  const stateBadge = document.getElementById('chip-current-state');
  const modeHeading = document.getElementById('editor-mode-heading');

  // Save Draft
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', async () => {
      const text = bodyInput?.value || '';
      const title = titleInput?.value || '';
      let slug = slugInput?.value || '';
      if (!slug && title) slug = slugify(title);

      if (!text.trim()) {
        showEditorFeedback('<div class="later-thinking-banner" role="alert">Body content is required before saving.</div>', true);
        return;
      }
      if (!title.trim()) {
        showEditorFeedback('<div class="later-thinking-banner" role="alert">Title is required before saving.</div>', true);
        return;
      }

      const isEdit = entryIdInput && entryIdInput.value;
      if (isEdit) {
        const entryId = entryIdInput.value;
        try {
          const res = await clientFetch(`/api/entries/${entryId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title,
              profile: (document.getElementById('entry-profile') as HTMLSelectElement)?.value || 'case-study',
              visibility: 'private',
            }),
          });
          if (res.ok) {
            await clientFetch(`/api/entries/${entryId}/revisions`, {
              method: 'POST',
              body: JSON.stringify({
                body_md: text,
                temporal_level: 'exact',
                valid_from: new Date((document.getElementById('entry-date') as HTMLInputElement)?.value || Date.now()).toISOString(),
                is_hindsight: (document.getElementById('entry-hindsight') as HTMLInputElement)?.checked || false,
              }),
            });
            showEditorFeedback(`<div class="as-of-banner">Saved draft "${escapeClientHtml(title)}" (private).</div>`, false);
            await refreshEntriesList(entryId);
          } else {
            const errData = await res.json().catch(() => ({}));
            showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(errData.error || errData.message || 'Error saving draft')}</div>`, true);
          }
        } catch (_) {
          showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error saving draft.</div>', true);
        }
      } else {
        try {
          const payload = {
            title,
            slug,
            profile: (document.getElementById('entry-profile') as HTMLSelectElement)?.value || 'case-study',
            body_md: text,
            valid_from: new Date((document.getElementById('entry-date') as HTMLInputElement)?.value || Date.now()).toISOString(),
            is_hindsight: (document.getElementById('entry-hindsight') as HTMLInputElement)?.checked || false,
            temporal_level: 'exact',
            visibility: 'private',
            view: 'article',
          };
          const res = await clientFetch('/api/entries', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            const newId = data.entry?.id;
            if (entryIdInput && newId) entryIdInput.value = newId;
            if (modeHeading) modeHeading.textContent = `Edit Entry: ${data.entry?.title || title}`;
            if (stateBadge) stateBadge.textContent = 'State: PRIVATE (Draft)';
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
            showEditorFeedback(`<div class="as-of-banner">Created draft "${escapeClientHtml(title)}".</div>`, false);
            await refreshEntriesList(newId);
          } else {
            const errData = await res.json().catch(() => ({}));
            showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(errData.error || errData.message || 'Error creating draft')}</div>`, true);
          }
        } catch (_) {
          showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error creating draft.</div>', true);
        }
      }
    });
  }

  // Unpublish
  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async () => {
      const entryId = entryIdInput?.value;
      if (!entryId) return;
      const title = titleInput?.value || 'Entry';
      try {
        const res = await clientFetch(`/api/entries/${entryId}`, {
          method: 'PUT',
          body: JSON.stringify({ visibility: 'private' }),
        });
        if (res.ok) {
          unpublishBtn.style.display = 'none';
          if (stateBadge) stateBadge.textContent = 'State: PRIVATE (Unpublished)';
          showEditorFeedback(`<div class="as-of-banner">Unpublished "${escapeClientHtml(title)}". Returned to private draft state.</div>`, false);
          await refreshEntriesList(entryId);
        } else {
          const errData = await res.json().catch(() => ({}));
          showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(errData.error || errData.message || 'Error unpublishing entry')}</div>`, true);
        }
      } catch (_) {
        showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error unpublishing entry.</div>', true);
      }
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
          showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(errData.error || errData.message || 'Error deleting entry')}</div>`, true);
        }
      } catch (_) {
        showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error deleting entry.</div>', true);
      }
    });
  }
}

// Make functions accessible globally for backward compatibility with inline scripts
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
