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
  undoInterval: any;
} = {
  id: '',
  visibility: 'private',
  lastCommittedBody: '',
  previewToken: '',
  hasWarnings: false,
  undoTimeout: null,
  undoInterval: null,
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
  s: FormState
): Promise<{ token: string; nda: boolean; cancelled?: boolean }> {
  if (!activeEntryState.previewToken) {
    showEditorFeedback(
      '<div class="later-thinking-banner" role="alert" data-gate="preview-token">Redaction preview check is required before publishing. Please click "Check for private details".</div>',
      true
    );
    return { token: '', nda: false, cancelled: true };
  }

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

function clearUndoTimers() {
  if (activeEntryState.undoTimeout) {
    clearTimeout(activeEntryState.undoTimeout);
    activeEntryState.undoTimeout = null;
  }
  if (activeEntryState.undoInterval) {
    clearInterval(activeEntryState.undoInterval);
    activeEntryState.undoInterval = null;
  }
}

export function showUndoBanner(message: string, onUndo: () => Promise<void>) {
  clearUndoTimers();

  const statusLineHtml =
    `<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center;gap:12px">` +
    `<span>${message}</span>` +
    `<button type="button" class="btn btn-secondary" id="btn-undo-status-line" data-undo-action="true" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>` +
    `</div>`;

  const toastHtml =
    `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">` +
    `<span>${message}</span>` +
    `<button type="button" class="btn btn-secondary" id="btn-undo-toast" data-undo-action="true" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>` +
    `</div>`;

  const bannerHtml =
    `<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center;gap:12px">` +
    `<span>${message}</span>` +
    `</div>`;

  showEditorFeedback(bannerHtml, false, 30000);

  const statusLine = document.getElementById('editor-status-line');
  if (statusLine) {
    statusLine.innerHTML = statusLineHtml;
    statusLine.style.display = 'inline-flex';
  }

  const toast = document.getElementById('editor-toast');
  if (toast) {
    toast.innerHTML = toastHtml;
    toast.style.display = 'block';
  }

  const banner = document.getElementById('admin-undo-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML =
      `<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center">` +
      `<span>${message}</span>` +
      `<button type="button" class="btn btn-secondary" id="btn-undo-action-banner" data-undo-action="true" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>` +
      `</div>`;
  }

  let undoTriggered = false;
  const handleUndoClick = async (e: Event) => {
    e.preventDefault();
    if (undoTriggered) return;
    undoTriggered = true;
    clearUndoTimers();
    if (banner) banner.style.display = 'none';
    document.querySelectorAll('[data-undo-action="true"]').forEach((btn) => btn.remove());
    await onUndo();
  };

  document.querySelectorAll<HTMLButtonElement>('[data-undo-action="true"]').forEach((btn) => {
    btn.addEventListener('click', handleUndoClick);
  });

  let remainingSeconds = 30;
  activeEntryState.undoInterval = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      clearUndoTimers();
      if (banner) banner.style.display = 'none';
      document.querySelectorAll('[data-undo-action="true"]').forEach((btn) => btn.remove());
      return;
    }
    document.querySelectorAll<HTMLButtonElement>('[data-undo-action="true"]').forEach((btn) => {
      btn.textContent = `Undo (${remainingSeconds}s)`;
    });
  }, 1000);

  activeEntryState.undoTimeout = setTimeout(() => {
    clearUndoTimers();
    if (banner) banner.style.display = 'none';
    document.querySelectorAll('[data-undo-action="true"]').forEach((btn) => btn.remove());
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
  const previousCommittedBody = activeEntryState.lastCommittedBody;
  const hadBodyEditToUndo = Boolean(id && s.bodyChanged && previousCommittedBody !== s.body);

  if (id) {
    try {
      // If transitioning a non-public entry and the body changed since last save,
      // save the revision first so the server validates redactionPreviewToken against the new body.
      if (s.bodyChanged && current !== 'public') {
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
          showEditorFeedback(
            `<div class="later-thinking-banner" role="alert">${escapeClientHtml(
              revErr.error || revErr.message || 'Error saving entry revision'
            )}</div>`,
            true
          );
          return false;
        }
      }

      // Saved entry: PUT /api/entries/:id (UX-01)
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

      // Save revision if body changed and entry was already public
      if (s.bodyChanged && current === 'public') {
        const revRes = await clientFetch(`/api/entries/${id}/revisions`, {
          method: 'POST',
          body: JSON.stringify({
            body_md: s.body,
            temporal_level: s.temporal_level,
            valid_from: new Date(dateStr).toISOString(),
            valid_from_range_end: s.valid_from_range_end || null,
            is_hindsight: s.is_hindsight,
            redactionPreviewToken: gate?.token,
            nda_confirmed: gate?.nda,
          }),
        });
        if (!revRes.ok) {
          const revErr = await revRes.json().catch(() => ({}));
          showEditorFeedback(
            `<div class="later-thinking-banner" role="alert">${escapeClientHtml(
              revErr.error || revErr.message || 'Error saving entry revision'
            )}</div>`,
            true
          );
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
    if (hadBodyEditToUndo) {
      showUndoBanner(
        `Saved changes to "${escapeClientHtml(s.title)}" (${target}).`,
        async () => {
          try {
            const revRes = await clientFetch(`/api/entries/${entryResultId}/revisions`, {
              method: 'POST',
              body: JSON.stringify({
                body_md: previousCommittedBody,
                temporal_level: s.temporal_level,
                valid_from: new Date(dateStr).toISOString(),
                valid_from_range_end: s.valid_from_range_end || null,
                is_hindsight: s.is_hindsight,
              }),
            });
            if (!revRes.ok) {
              const revErr = await revRes.json().catch(() => ({}));
              showEditorFeedback(
                `<div class="later-thinking-banner" role="alert">${escapeClientHtml(
                  revErr.error || revErr.message || 'Error restoring previous version'
                )}</div>`,
                true
              );
              return;
            }
            const bodyTextarea = document.getElementById('entry-body') as HTMLTextAreaElement | null;
            if (bodyTextarea) {
              bodyTextarea.value = previousCommittedBody;
            }
            setActiveEntryState({
              lastCommittedBody: previousCommittedBody,
            });
            clearDraftBuffer();
            showEditorFeedback(
              `<div class="as-of-banner">Restored previous version of "${escapeClientHtml(s.title)}".</div>`,
              false
            );
          } catch (_) {
            showEditorFeedback(
              '<div class="later-thinking-banner" role="alert">Network error restoring previous version.</div>',
              true
            );
          }
        }
      );
    } else {
      const msg = id
        ? `<div class="as-of-banner">Saved changes to "${escapeClientHtml(s.title)}" (${target}).</div>`
        : `<div class="as-of-banner">Created draft "${escapeClientHtml(s.title)}".</div>`;
      showEditorFeedback(msg, false);
    }
  } else if (intent === 'unlist') {
    const msg = `<div class="as-of-banner">Unlisted "${escapeClientHtml(s.title)}". Available only via direct link.</div>`;
    showEditorFeedback(msg, false);
  } else if (intent === 'unpublish') {
    const unpublishSnapshotBody = s.body;
    const unpublishSnapshotNda =
      (document.getElementById('entry-nda-confirmed') as HTMLInputElement | null)?.checked || false;
    // Show Undo (30s) banner and feedback (UX-04)
    showUndoBanner(`Unpublished "${escapeClientHtml(s.title)}". Returned to private draft state.`, async () => {
      const currentForm = readForm();
      if (currentForm.body === unpublishSnapshotBody) {
        try {
          const scanRes = await clientFetch('/api/entries/redaction-preview', {
            method: 'POST',
            body: JSON.stringify({
              text: unpublishSnapshotBody,
              entryId: entryResultId || undefined,
            }),
          });
          if (scanRes.ok) {
            const scanData = await scanRes.json();
            const token = scanData.redactionPreviewToken || '';
            const warnings = scanData.warnings || [];
            setPreviewToken(token, warnings.length > 0);
            if (warnings.length > 0 && unpublishSnapshotNda) {
              const ndaInput = document.getElementById('entry-nda-confirmed') as HTMLInputElement | null;
              if (ndaInput) ndaInput.checked = true;
            }
          }
        } catch (_) {}
      }
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
