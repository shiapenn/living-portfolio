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
    chip.style.background = 'var(--lp-color-role-success-bg)';
    chip.style.color = 'var(--lp-color-role-success-fg)';
  } else if (visibility === 'unlisted') {
    chip.textContent = 'State: UNLISTED';
    chip.style.background = 'var(--lp-color-role-warning-bg)';
    chip.style.color = 'var(--lp-color-role-warning-fg)';
  } else {
    chip.textContent = isUnpublished ? 'State: PRIVATE (Unpublished)' : 'State: PRIVATE (Draft)';
    chip.style.background = 'var(--lp-color-role-neutral-bg)';
    chip.style.color = 'var(--lp-color-role-neutral-fg)';
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
    `<div class="as-of-banner lp-undo-row">` +
    `<span>${message}</span>` +
    `<button type="button" class="btn btn-secondary lp-undo-btn" id="btn-undo-status-line" data-undo-action="true">Undo (30s)</button>` +
    `</div>`;

  const toastHtml =
    `<div class="lp-undo-row">` +
    `<span>${message}</span>` +
    `<button type="button" class="btn btn-secondary lp-undo-btn" id="btn-undo-toast" data-undo-action="true">Undo (30s)</button>` +
    `</div>`;

  const bannerHtml =
    `<div class="as-of-banner lp-undo-row">` +
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
      `<div class="as-of-banner lp-undo-row">` +
      `<span>${message}</span>` +
      `<button type="button" class="btn btn-secondary lp-undo-btn" id="btn-undo-action-banner" data-undo-action="true">Undo (30s)</button>` +
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
