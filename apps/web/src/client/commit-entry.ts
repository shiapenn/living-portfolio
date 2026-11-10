/**
 * WP-14.1: commitEntry State Machine
 * Spec §2.1.2 & §7.5
 * Formalizes entry lifecycle: save, publish, unlist, unpublish.
 * Closes: UX-01, UX-02, UX-03, UX-04, CP-12
 */

import { clientFetch, escapeClientHtml, refreshEntriesList, showEditorFeedback } from './admin-entry.js';
import { clearDraftBuffer } from './draft-buffer.js';

export type Intent = 'save' | 'publish' | 'unlist' | 'unpublish';
export type Visibility = 'private' | 'unlisted' | 'public';

export interface FormState {
  id: string;
  title: string;
  slug: string;
  profile: string;
  visibility: Visibility;
  body: string;
  date: string;
  is_hindsight: boolean;
  temporal_level: 'exact' | 'range' | 'estimated';
  valid_from_range_end?: string;
  bodyChanged: boolean;
}

let activeEntryState: {
  id: string;
  visibility: Visibility;
  lastCommittedBody: string;
  previewToken: string;
  hasWarnings: boolean;
  undoTimeout: any;
} = {
  id: '',
  visibility: 'private',
  lastCommittedBody: '',
  previewToken: '',
  hasWarnings: false,
  undoTimeout: null,
};

export function getActiveEntryState() {
  return activeEntryState;
}

export function setActiveEntryState(partial: Partial<typeof activeEntryState>) {
  activeEntryState = { ...activeEntryState, ...partial };
}

export function setPreviewToken(token: string, hasWarnings = false) {
  activeEntryState.previewToken = token;
  activeEntryState.hasWarnings = hasWarnings;
  const tokenInput = document.getElementById('entry-preview-token') as HTMLInputElement | null;
  if (tokenInput) tokenInput.value = token;
}

export function clearPreviewToken(reason = 'invalidated') {
  activeEntryState.previewToken = '';
  const tokenInput = document.getElementById('entry-preview-token') as HTMLInputElement | null;
  if (tokenInput) tokenInput.value = '';
  const badge = document.getElementById('preview-token-badge');
  if (badge) badge.remove();
  const redactBox = document.getElementById('redaction-preview-box');
  if (redactBox && reason === 'invalidated') {
    redactBox.innerHTML =
      '<div class="later-thinking-banner" data-state="invalidated" role="status">Body edited since last check — preview token invalidated. Re-run "Check for private details" before publishing.</div>';
  }
}

export function updateStateChip(visibility: Visibility, isUnpublished = false) {
  const chip = document.getElementById('chip-current-state');
  if (!chip) return;
  chip.setAttribute('data-status', visibility);
  if (visibility === 'public') {
    chip.textContent = 'State: PUBLIC';
    chip.style.background = '#dcfce7';
    chip.style.color = '#166534';
  } else if (visibility === 'unlisted') {
    chip.textContent = 'State: UNLISTED';
    chip.style.background = '#fef3c7';
    chip.style.color = '#92400e';
  } else {
    chip.textContent = isUnpublished ? 'State: PRIVATE (Unpublished)' : 'State: PRIVATE (Draft)';
    chip.style.background = '#f1f5f9';
    chip.style.color = '#475569';
  }
}

export function updateActionButtons(id: string, visibility: Visibility) {
  const unpublishBtn = document.getElementById('btn-unpublish');
  const unlistBtn = document.getElementById('btn-unlist');
  const deleteBtn = document.getElementById('btn-delete-entry');

  if (deleteBtn) {
    deleteBtn.style.display = id ? 'inline-block' : 'none';
  }
  if (unpublishBtn) {
    unpublishBtn.style.display = (visibility === 'public' || visibility === 'unlisted') ? 'inline-block' : 'none';
  }
  if (unlistBtn) {
    unlistBtn.style.display = id ? 'inline-block' : 'none';
  }
}

export function readForm(): FormState {
  const idInput = document.getElementById('entry-id') as HTMLInputElement | null;
  const titleInput = document.getElementById('entry-title') as HTMLInputElement | null;
  const slugInput = document.getElementById('entry-slug') as HTMLInputElement | null;
  const profileSelect = document.getElementById('entry-profile') as HTMLSelectElement | null;
  const visibilitySelect = document.getElementById('entry-visibility') as HTMLSelectElement | null;
  const dateInput = document.getElementById('entry-date') as HTMLInputElement | null;
  const temporalSelect = document.getElementById('entry-temporal-level') as HTMLSelectElement | null;
  const rangeEndInput = document.getElementById('entry-date-range-end') as HTMLInputElement | null;
  const hindsightInput = document.getElementById('entry-hindsight') as HTMLInputElement | null;
  const bodyTextarea = document.getElementById('entry-body') as HTMLTextAreaElement | null;

  const id = idInput?.value || activeEntryState.id || '';
  const title = titleInput?.value || '';
  const slug = slugInput?.value || '';
  const profile = profileSelect?.value || 'case-study';
  const body = bodyTextarea?.value || '';
  const date = dateInput?.value || '';
  const is_hindsight = hindsightInput?.checked || false;
  const temporal_level = (temporalSelect?.value as 'exact' | 'range' | 'estimated') || 'exact';
  const rangeEndVal = rangeEndInput?.value?.trim() || '';
  const valid_from_range_end =
    temporal_level === 'range' && rangeEndVal && !isNaN(Date.parse(rangeEndVal))
      ? new Date(rangeEndVal).toISOString()
      : undefined;

  const currentVisibility = activeEntryState.id && activeEntryState.id === id
    ? activeEntryState.visibility
    : ((visibilitySelect?.value as Visibility) || 'private');

  const bodyChanged = !id || body !== activeEntryState.lastCommittedBody;

  return {
    id,
    title,
    slug,
    profile,
    visibility: currentVisibility,
    body,
    date,
    is_hindsight,
    temporal_level,
    valid_from_range_end,
    bodyChanged,
  };
}

export async function ensureRedactionToken(
  s: FormState,
  forceScan = false
): Promise<{ token: string; nda: boolean; cancelled?: boolean }> {
  // If we already have a valid token and not forcing re-scan, use it
  if (!forceScan && activeEntryState.previewToken && !s.bodyChanged) {
    const ndaConfirmed = (document.getElementById('entry-nda-confirmed') as HTMLInputElement | null)?.checked || false;
    if (activeEntryState.hasWarnings && !ndaConfirmed) {
      showEditorFeedback(
        '<div class="later-thinking-banner" role="alert" data-gate="nda-confirmed">Confidentiality &amp; NDA confirmation is required before publishing entries with potential secrets or exclusion warnings.</div>',
        true
      );
      return { token: '', nda: false, cancelled: true };
    }
    return { token: activeEntryState.previewToken, nda: ndaConfirmed };
  }

  // Auto-run redaction scan
  try {
    const res = await clientFetch('/api/entries/redaction-preview', {
      method: 'POST',
      body: JSON.stringify({
        text: s.body,
        entryId: s.id || undefined,
      }),
    });
    if (!res.ok) {
      showEditorFeedback(
        '<div class="later-thinking-banner" role="alert" data-gate="preview-token">Redaction preview check is required before publishing. Please click "Check for private details".</div>',
        true
      );
      return { token: '', nda: false, cancelled: true };
    }
    const data = await res.json();
    const token = data.redactionPreviewToken || '';
    const warnings = data.warnings || [];
    const hasWarnings = warnings.length > 0;
    setPreviewToken(token, hasWarnings);

    const ndaConfirmed = (document.getElementById('entry-nda-confirmed') as HTMLInputElement | null)?.checked || false;
    if (hasWarnings && !ndaConfirmed) {
      showEditorFeedback(
        '<div class="later-thinking-banner" role="alert" data-gate="nda-confirmed">Confidentiality &amp; NDA confirmation is required before publishing entries with potential secrets or exclusion warnings.</div>',
        true
      );
      return { token, nda: false, cancelled: true };
    }
    return { token, nda: ndaConfirmed };
  } catch (_) {
    showEditorFeedback(
      '<div class="later-thinking-banner" role="alert">Network error during redaction preview check.</div>',
      true
    );
    return { token: '', nda: false, cancelled: true };
  }
}

export function showUndoBanner(message: string, onUndo: () => Promise<void>) {
  if (activeEntryState.undoTimeout) clearTimeout(activeEntryState.undoTimeout);
  const undoHtml =
    `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">` +
    `<span>${message}</span>` +
    `<button type="button" class="btn btn-secondary" id="btn-undo-action" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>` +
    `</div>`;
  showEditorFeedback(undoHtml, false);

  const banner = document.getElementById('admin-undo-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML =
      `<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center">` +
      `<span>${message}</span>` +
      `<button type="button" class="btn btn-secondary" id="btn-undo-action-banner" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>` +
      `</div>`;
    const bBtn = document.getElementById('btn-undo-action-banner');
    if (bBtn) {
      bBtn.addEventListener('click', async () => {
        if (activeEntryState.undoTimeout) clearTimeout(activeEntryState.undoTimeout);
        banner.style.display = 'none';
        await onUndo();
      });
    }
  }

  const undoBtn = document.getElementById('btn-undo-action');
  if (undoBtn) {
    undoBtn.addEventListener('click', async () => {
      if (activeEntryState.undoTimeout) clearTimeout(activeEntryState.undoTimeout);
      if (banner) banner.style.display = 'none';
      await onUndo();
    });
  }

  activeEntryState.undoTimeout = setTimeout(() => {
    if (banner) banner.style.display = 'none';
  }, 30000);
}

export async function commitEntry(intent: Intent): Promise<boolean> {
  const s = readForm();

  const tokenInput = document.getElementById('entry-preview-token') as HTMLInputElement | null;
  if (tokenInput && tokenInput.value && !activeEntryState.previewToken) {
    activeEntryState.previewToken = tokenInput.value;
  }

  const dateInput = document.getElementById('entry-date') as HTMLInputElement | null;
  const dateStr = dateInput?.value?.trim() || '';
  const dateError = document.getElementById('entry-date-error');
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    if (dateError) {
      dateError.textContent = 'A valid date is required.';
      dateError.style.display = 'block';
    }
    showEditorFeedback('<div class="later-thinking-banner" role="alert">A valid date is required before saving.</div>', true);
    return false;
  } else {
    if (dateError) dateError.style.display = 'none';
  }

  if (!s.title.trim()) {
    showEditorFeedback('<div class="later-thinking-banner" role="alert">Title is required before saving.</div>', true);
    return false;
  }
  if (!s.body.trim()) {
    showEditorFeedback('<div class="later-thinking-banner" role="alert">Body content is required before saving.</div>', true);
    return false;
  }

  const id = s.id;
  const current = id ? s.visibility : 'private';

  // Spec §2.1.2: Visibility only changes on an explicit intent; 'save' preserves it (UX-02)
  const targetMap: Record<Intent, Visibility> = {
    save: current,
    publish: 'public',
    unlist: 'unlisted',
    unpublish: 'private',
  };
  const target = targetMap[intent];

  // Gate: public publication transition requires valid preview token (Spec §2.1.2)
  let gate: { token: string; nda: boolean; cancelled?: boolean } | null = null;
  if (target === 'public' && current !== 'public') {
    // If token is missing, or body was edited since check:
    if (!activeEntryState.previewToken) {
      showEditorFeedback(
        '<div class="later-thinking-banner" role="alert" data-gate="preview-token">Redaction preview check is required before publishing. Please click "Check for private details".</div>',
        true
      );
      return false;
    }
    gate = await ensureRedactionToken(s);
    if (gate && gate.cancelled) return false;
  }

  let entryResultId = id;
  let entryResultSlug = s.slug;
  let enrichmentQueued = false;

  if (id) {
    // Saved entry: PUT /api/entries/:id (UX-01)
    try {
      const putRes = await clientFetch(`/api/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: s.title,
          profile: s.profile,
          visibility: target,
          redactionPreviewToken: gate?.token,
          nda_confirmed: gate?.nda,
        }),
      });

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        const message =
          putRes.status === 409
            ? errData.error || errData.message || `An entry with slug '${s.slug}' already exists. Choose a different slug.`
            : errData.message || errData.error || `Error updating entry (HTTP ${putRes.status})`;
        showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(message)}</div>`, true);
        return false;
      }

      const putData = await putRes.json().catch(() => ({}));
      if (putData.entry?.slug) entryResultSlug = putData.entry.slug;
      if (putData.enrichmentQueued) enrichmentQueued = true;

      // Save revision if body changed
      if (s.bodyChanged) {
        const revRes = await clientFetch(`/api/entries/${id}/revisions`, {
          method: 'POST',
          body: JSON.stringify({
            body_md: s.body,
            temporal_level: s.temporal_level,
            valid_from: new Date(dateStr).toISOString(),
            valid_from_range_end: s.valid_from_range_end || null,
            is_hindsight: s.is_hindsight,
          }),
        });
        if (!revRes.ok) {
          const revErr = await revRes.json().catch(() => ({}));
          showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(revErr.error || revErr.message || 'Error saving entry revision')}</div>`, true);
          return false;
        }
      }
    } catch (_) {
      showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error updating entry.</div>', true);
      return false;
    }
  } else {
    // New entry: POST /api/entries
    try {
      const postRes = await clientFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          title: s.title,
          slug: s.slug,
          profile: s.profile,
          body_md: s.body,
          valid_from: new Date(dateStr).toISOString(),
          valid_from_range_end: s.valid_from_range_end || null,
          is_hindsight: s.is_hindsight,
          temporal_level: s.temporal_level,
          visibility: target,
          view: 'article',
          redactionPreviewToken: gate?.token,
          nda_confirmed: gate?.nda,
        }),
      });

      if (!postRes.ok) {
        const errData = await postRes.json().catch(() => ({}));
        const message =
          postRes.status === 409
            ? errData.error || errData.message || `An entry with slug '${s.slug}' already exists. Choose a different slug.`
            : errData.message || errData.error || `Error creating entry (HTTP ${postRes.status})`;
        showEditorFeedback(`<div class="later-thinking-banner" role="alert">${escapeClientHtml(message)}</div>`, true);
        return false;
      }

      const postData = await postRes.json();
      entryResultId = postData.entry?.id || '';
      entryResultSlug = postData.entry?.slug || s.slug;
      if (postData.enrichmentQueued) enrichmentQueued = true;

      const idInput = document.getElementById('entry-id') as HTMLInputElement | null;
      if (idInput && entryResultId) idInput.value = entryResultId;
      const modeHeading = document.getElementById('editor-mode-heading');
      if (modeHeading) modeHeading.textContent = `Edit Entry: ${s.title}`;
    } catch (_) {
      showEditorFeedback('<div class="later-thinking-banner" role="alert">Network error creating entry.</div>', true);
      return false;
    }
  }

  // Update active state
  setActiveEntryState({
    id: entryResultId,
    visibility: target,
    lastCommittedBody: s.body,
  });

  clearDraftBuffer();

  const visibilitySelect = document.getElementById('entry-visibility') as HTMLSelectElement | null;
  if (visibilitySelect) visibilitySelect.value = target;

  updateStateChip(target, intent === 'unpublish');
  updateActionButtons(entryResultId, target);
  await refreshEntriesList(entryResultId);

  // Present visible feedback per intent
  if (intent === 'publish') {
    clearPreviewToken('published');
    const enrichSpan = enrichmentQueued
      ? ' <span class="chip" style="margin-left:8px">Enrichment pipeline queued</span>'
      : '';
    const msg = `<div class="as-of-banner">Published "${escapeClientHtml(s.title)}" at L0. <a href="/work/${escapeClientHtml(entryResultSlug)}">View entry →</a>${enrichSpan}</div>`;
    showEditorFeedback(msg, false);
    if (typeof (window as any).fetchDeployStatus === 'function') {
      try {
        (window as any).fetchDeployStatus();
      } catch (_) {}
    }
  } else if (intent === 'save') {
    const msg = id
      ? `<div class="as-of-banner">Saved changes to "${escapeClientHtml(s.title)}" (${target}).</div>`
      : `<div class="as-of-banner">Created draft "${escapeClientHtml(s.title)}".</div>`;
    showEditorFeedback(msg, false);
  } else if (intent === 'unlist') {
    const msg = `<div class="as-of-banner">Unlisted "${escapeClientHtml(s.title)}". Available only via direct link.</div>`;
    showEditorFeedback(msg, false);
  } else if (intent === 'unpublish') {
    // Show Undo (30s) banner and feedback (UX-04)
    showUndoBanner(`Unpublished "${escapeClientHtml(s.title)}". Returned to private draft state.`, async () => {
      // Undo re-enters commitEntry, never raw PUT
      await ensureRedactionToken(s, true);
      await commitEntry('publish');
    });
  }

  return true;
}

// Global exposure
if (typeof window !== 'undefined') {
  (window as any).commitEntry = commitEntry;
  (window as any).setPreviewToken = setPreviewToken;
  (window as any).clearPreviewToken = clearPreviewToken;
  (window as any).updateStateChip = updateStateChip;
  (window as any).updateActionButtons = updateActionButtons;
}
