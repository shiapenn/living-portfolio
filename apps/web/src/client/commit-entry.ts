/**
 * WP-14.1: commitEntry State Machine
 * Spec §2.1.2 & §7.5
 * Formalizes entry lifecycle: save, publish, unlist, unpublish.
 */

import { clientFetch, escapeClientHtml, refreshEntriesList, showEditorFeedback } from './admin-entry.js';
import { clearDraftBuffer } from './draft-buffer.js';
import {
  type Intent,
  type Visibility,
  type FormState,
  getActiveEntryState,
  setActiveEntryState,
  setPreviewToken,
  clearPreviewToken,
  updateStateChip,
  updateActionButtons,
  readForm,
  ensureRedactionToken,
  showUndoBanner,
} from './commit-entry-state.js';

export {
  type Intent,
  type Visibility,
  type FormState,
  getActiveEntryState,
  setActiveEntryState,
  setPreviewToken,
  clearPreviewToken,
  updateStateChip,
  updateActionButtons,
  readForm,
  ensureRedactionToken,
  showUndoBanner,
};

export async function commitEntry(intent: Intent): Promise<boolean> {
  const s = readForm();

  const tokenInput = document.getElementById('entry-preview-token') as HTMLInputElement | null;
  if (tokenInput && tokenInput.value && !getActiveEntryState().previewToken) {
    getActiveEntryState().previewToken = tokenInput.value;
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
    if (!getActiveEntryState().previewToken) {
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
  const previousCommittedBody = getActiveEntryState().lastCommittedBody;
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
      ? ' <span class="chip">Summary analysis queued</span>'
      : '';
    const msg = `<div class="as-of-banner">Published "${escapeClientHtml(s.title)}". <a href="/work/${escapeClientHtml(entryResultSlug)}">View entry →</a>${enrichSpan}</div>`;
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
