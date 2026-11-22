/**
 * Draft Buffer & Local Autosave (WP-14.4)
 * Spec §2.1.3 & §7.5
 * Local autosave, restore prompt on reopen, beforeunload guard when dirty, offline banner.
 */

const STORAGE_KEY = 'lp_draft_buffer_active';

let isDirty = false;
let autosaveTimer: any = null;

export function getIsDirty(): boolean {
  return isDirty;
}

export function setIsDirty(dirty: boolean): void {
  isDirty = dirty;
  if (typeof window !== 'undefined') {
    (window as any).__lp_is_dirty = dirty;
  }
}

export function saveDraftBuffer(): void {
  const title = (document.getElementById('entry-title') as HTMLInputElement | null)?.value || '';
  const slug = (document.getElementById('entry-slug') as HTMLInputElement | null)?.value || '';
  const body = (document.getElementById('entry-body') as HTMLTextAreaElement | null)?.value || '';
  const date = (document.getElementById('entry-date') as HTMLInputElement | null)?.value || '';
  const temporal = (document.getElementById('entry-temporal-level') as HTMLSelectElement | null)?.value || 'exact';
  const rangeEnd = (document.getElementById('entry-date-range-end') as HTMLInputElement | null)?.value || '';
  const profile = (document.getElementById('entry-profile') as HTMLSelectElement | null)?.value || 'case-study';
  const entryId = (document.getElementById('entry-id') as HTMLInputElement | null)?.value || '';

  // Only buffer if there's actual content
  if (!title.trim() && !body.trim()) return;

  const buffer = {
    entryId,
    title,
    slug,
    body,
    date,
    temporal,
    rangeEnd,
    profile,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch (_) {}
}

export function clearDraftBuffer(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  setIsDirty(false);
  const notice = document.getElementById('draft-restore-notice');
  if (notice) notice.style.display = 'none';
}

export function restoreDraftBuffer(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || (!data.title && !data.body)) return false;

    const currentId = (document.getElementById('entry-id') as HTMLInputElement | null)?.value || '';
    // If buffering matches new entry or matching entry id
    if (data.entryId && currentId && data.entryId !== currentId) return false;

    const titleInput = document.getElementById('entry-title') as HTMLInputElement | null;
    const slugInput = document.getElementById('entry-slug') as HTMLInputElement | null;
    const bodyInput = document.getElementById('entry-body') as HTMLTextAreaElement | null;
    const dateInput = document.getElementById('entry-date') as HTMLInputElement | null;
    const temporalSelect = document.getElementById('entry-temporal-level') as HTMLSelectElement | null;
    const rangeEndInput = document.getElementById('entry-date-range-end') as HTMLInputElement | null;
    const rangeEndContainer = document.getElementById('range-end-container');
    const profileSelect = document.getElementById('entry-profile') as HTMLSelectElement | null;

    if (titleInput && data.title) titleInput.value = data.title;
    if (slugInput && data.slug) slugInput.value = data.slug;
    if (bodyInput && data.body) bodyInput.value = data.body;
    if (dateInput && data.date) dateInput.value = data.date;
    if (profileSelect && data.profile) profileSelect.value = data.profile;
    if (temporalSelect && data.temporal) {
      temporalSelect.value = data.temporal;
      if (rangeEndContainer) {
        rangeEndContainer.style.display = data.temporal === 'range' ? 'block' : 'none';
      }
    }
    if (rangeEndInput && data.rangeEnd) rangeEndInput.value = data.rangeEnd;

    setIsDirty(true);

    // Show restore notice
    const notice = document.getElementById('draft-restore-notice');
    if (notice) {
      notice.style.display = 'flex';
      notice.innerHTML =
        `<span>Restored unsaved draft from local buffer.</span>` +
        `<button type="button" class="btn btn-secondary" id="btn-discard-draft-buffer" style="padding:var(--lp-space-2) var(--lp-space-8);font-size:var(--lp-space-12);margin-left:var(--lp-space-8)">Discard</button>`;
      const discardBtn = document.getElementById('btn-discard-draft-buffer');
      if (discardBtn) {
        discardBtn.addEventListener('click', () => {
          clearDraftBuffer();
          if (titleInput) titleInput.value = '';
          if (slugInput) slugInput.value = '';
          if (bodyInput) bodyInput.value = '';
        });
      }
    }

    return true;
  } catch (_) {
    return false;
  }
}

export function initDraftBuffer(): void {
  const titleInput = document.getElementById('entry-title');
  const slugInput = document.getElementById('entry-slug');
  const bodyInput = document.getElementById('entry-body');

  function triggerAutosave() {
    setIsDirty(true);
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveDraftBuffer();
    }, 1000);
  }

  if (titleInput) titleInput.addEventListener('input', triggerAutosave);
  if (slugInput) slugInput.addEventListener('input', triggerAutosave);
  if (bodyInput) bodyInput.addEventListener('input', triggerAutosave);

  // Restore draft buffer on init
  restoreDraftBuffer();

  // beforeunload guard when dirty (Spec §2.1.3)
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved draft writing. Are you sure you want to leave?';
      return e.returnValue;
    }
  });

  // Offline banner detection (Spec §2.1.3)
  const offlineBanner = document.getElementById('admin-offline-banner');
  window.addEventListener('offline', () => {
    if (offlineBanner) offlineBanner.style.display = 'block';
  });
  window.addEventListener('online', () => {
    if (offlineBanner) offlineBanner.style.display = 'none';
  });
  if (offlineBanner && !navigator.onLine) {
    offlineBanner.style.display = 'block';
  }
}

// Global exposure
if (typeof window !== 'undefined') {
  (window as any).saveDraftBuffer = saveDraftBuffer;
  (window as any).clearDraftBuffer = clearDraftBuffer;
  (window as any).restoreDraftBuffer = restoreDraftBuffer;
  (window as any).initDraftBuffer = initDraftBuffer;
  (window as any).__lp_is_dirty = false;
}
