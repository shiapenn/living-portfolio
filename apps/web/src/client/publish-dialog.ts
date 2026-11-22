/**
 * Publish Dialog (WP-14.3)
 * Spec §2.1.2 & §7.5
 * Pre-flight checklist: auto-scan, NDA confirmation, Public/Unlisted choice, what happens next, single publish action.
 * Closes: UX-03 (part), UX-13 (part)
 */

import {
  clientFetch,
  escapeClientHtml,
  showEditorFeedback,
} from './admin-entry.js';
import {
  commitEntry,
  getActiveEntryState,
  readForm,
  setPreviewToken,
} from './commit-entry.js';

let previousActiveElement: HTMLElement | null = null;
let currentDialogWarnings: any[] = [];
let currentDialogToken = '';

export function updatePublishDialogStepNumbers(ndaVisible: boolean): void {
  const scanHeading = document.getElementById('publish-step-heading-scan');
  const ndaHeading = document.getElementById('publish-step-heading-nda');
  const visHeading = document.getElementById('publish-step-heading-visibility');
  const nextHeading = document.getElementById('publish-step-heading-next');

  if (scanHeading) scanHeading.textContent = '1. Private-Detail Check';
  if (ndaVisible) {
    if (ndaHeading) ndaHeading.textContent = '2. Confidentiality & NDA Confirmation';
    if (visHeading) visHeading.textContent = '3. Who Can See It';
    if (nextHeading) nextHeading.textContent = '4. What Happens Next';
  } else {
    if (visHeading) visHeading.textContent = '2. Who Can See It';
    if (nextHeading) nextHeading.textContent = '3. What Happens Next';
  }
}

export function openPublishDialog(): void {
  const dialog = document.getElementById('publish-dialog');
  const backdrop = document.getElementById('publish-dialog-backdrop');
  const targetUrlEl = document.getElementById('publish-target-url');
  const scanStatusEl = document.getElementById('publish-scan-status');
  const ndaSection = document.getElementById('publish-nda-section');
  const ndaCheckbox = document.getElementById('publish-dialog-nda') as HTMLInputElement | null;
  const alertEl = document.getElementById('publish-dialog-alert');
  const matchesDetail = document.getElementById('publish-matches-detail');

  if (!dialog) return;

  const s = readForm();
  if (!s.title.trim()) {
    showEditorFeedback('<div class="later-thinking-banner" role="alert">Title is required before publishing.</div>', true);
    return;
  }
  if (!s.body.trim()) {
    showEditorFeedback('<div class="later-thinking-banner" role="alert">Body content is required before publishing.</div>', true);
    return;
  }

  previousActiveElement = document.activeElement as HTMLElement | null;

  if (targetUrlEl) {
    targetUrlEl.textContent = `/work/${s.slug || 'untitled'}`;
  }

  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.textContent = '';
  }

  if (ndaCheckbox) {
    ndaCheckbox.checked = false;
  }

  if (ndaSection) {
    ndaSection.style.display = 'none';
  }
  updatePublishDialogStepNumbers(false);

  if (scanStatusEl) {
    scanStatusEl.innerHTML = '<div style="color:var(--text-muted)">Checking for private details...</div>';
  }

  dialog.style.display = 'block';
  if (backdrop) backdrop.style.display = 'block';

  // Focus trap: focus close button or first button
  const closeBtn = document.getElementById('btn-close-publish-dialog');
  if (closeBtn) closeBtn.focus();

  // Auto-run redaction scan (Spec §2.1.2, WP-14.3)
  runDialogAutoScan(s.body, s.id);
}

export function closePublishDialog(): void {
  const dialog = document.getElementById('publish-dialog');
  const backdrop = document.getElementById('publish-dialog-backdrop');
  if (dialog) dialog.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';

  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

async function runDialogAutoScan(text: string, entryId?: string): Promise<void> {
  const scanStatusEl = document.getElementById('publish-scan-status');
  const ndaSection = document.getElementById('publish-nda-section');
  const matchesDetail = document.getElementById('publish-matches-detail');

  try {
    const res = await clientFetch('/api/entries/redaction-preview', {
      method: 'POST',
      body: JSON.stringify({ text, entryId: entryId || undefined }),
    });

    if (!res.ok) {
      if (scanStatusEl) {
        scanStatusEl.innerHTML = '<div class="later-thinking-banner" style="margin:0" role="alert">Error connecting to redaction scan. Please retry.</div>';
      }
      return;
    }

    const data = await res.json();
    currentDialogWarnings = data.warnings || [];
    currentDialogToken = data.redactionPreviewToken || '';
    setPreviewToken(currentDialogToken, currentDialogWarnings.length > 0);

    if (currentDialogWarnings.length === 0) {
      if (scanStatusEl) {
        scanStatusEl.innerHTML = '<span class="chip" data-state="clean" style="border-color:var(--role-outcome,var(--lp-color-role-success-fg));background:var(--lp-color-role-success-bg);color:var(--lp-color-role-success-fg);font-weight:600">✓ Nothing found (0 confidential findings)</span>';
      }
      if (ndaSection) ndaSection.style.display = 'none';
      if (matchesDetail) matchesDetail.style.display = 'none';
      updatePublishDialogStepNumbers(false);
    } else {
      if (scanStatusEl) {
        scanStatusEl.innerHTML = `<div class="later-thinking-banner" data-state="needs-review" role="alert" style="margin:0">⚠ Needs Review: Found ${currentDialogWarnings.length} potential private item(s).</div>`;
      }
      if (ndaSection) ndaSection.style.display = 'block';
      if (matchesDetail) matchesDetail.style.display = 'block';
      updatePublishDialogStepNumbers(true);
    }
  } catch (_) {
    if (scanStatusEl) {
      scanStatusEl.innerHTML = '<div class="later-thinking-banner" style="margin:0" role="alert">Network error during private details check.</div>';
    }
  }
}

export function showPublishSuccessToast(title: string, slug: string): void {
  const toast = document.getElementById('editor-toast');
  if (!toast) return;

  toast.innerHTML =
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:var(--lp-space-12)">` +
    `<div>` +
    `<strong>Published "${escapeClientHtml(title)}"</strong><br/>` +
    `<a href="/work/${escapeClientHtml(slug)}" style="font-size:var(--lp-size-13);color:var(--lp-color-accent-default))">View page</a>` +
    `</div>` +
    `<button type="button" class="btn btn-secondary" id="btn-toast-unpublish" style="font-size:var(--lp-space-12);padding:var(--lp-border-role-rule) var(--lp-space-8)">Unpublish</button>` +
    `</div>`;

  toast.style.display = 'block';

  const unpublishBtn = document.getElementById('btn-toast-unpublish');
  if (unpublishBtn) {
    unpublishBtn.addEventListener('click', async () => {
      await commitEntry('unpublish');
      toast.style.display = 'none';
    });
  }
}

export function initPublishDialogHandlers(): void {
  const openBtn = document.getElementById('btn-open-publish-dialog');
  const closeBtn = document.getElementById('btn-close-publish-dialog');
  const cancelBtn = document.getElementById('btn-cancel-publish');
  const confirmBtn = document.getElementById('btn-confirm-publish');
  const backdrop = document.getElementById('publish-dialog-backdrop');
  const dialog = document.getElementById('publish-dialog');
  const openDrawerBtn = document.getElementById('btn-publish-open-drawer');

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPublishDialog();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closePublishDialog();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closePublishDialog();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closePublishDialog();
    });
  }

  // Focus trap key listener (Escape to close, Tab cycles inside)
  if (dialog) {
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePublishDialog();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }

  // Open full redaction drawer from dialog
  if (openDrawerBtn) {
    openDrawerBtn.addEventListener('click', () => {
      const drawer = document.getElementById('redaction-preview-drawer');
      if (drawer) drawer.style.display = 'block';
    });
  }

  // Confirm publish button handler
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const s = readForm();
      const ndaCheckbox = document.getElementById('publish-dialog-nda') as HTMLInputElement | null;
      const alertEl = document.getElementById('publish-dialog-alert');

      // Check NDA requirement if warnings exist
      if (currentDialogWarnings.length > 0 && (!ndaCheckbox || !ndaCheckbox.checked)) {
        if (alertEl) {
          alertEl.textContent = 'Confidentiality & NDA confirmation is required before publishing entries with flagged warnings.';
          alertEl.style.display = 'block';
        }
        return;
      }

      // Sync NDA checkbox into form nda confirmed checkbox
      const formNda = document.getElementById('entry-nda-confirmed') as HTMLInputElement | null;
      if (formNda && ndaCheckbox) {
        formNda.checked = ndaCheckbox.checked;
      }

      // Determine visibility choice
      const visibilityChoice = (document.querySelector('input[name="publish-visibility-choice"]:checked') as HTMLInputElement | null)?.value || 'public';

      closePublishDialog();

      const ok = await commitEntry(visibilityChoice === 'unlisted' ? 'unlist' : 'publish');
      if (ok && visibilityChoice !== 'unlisted') {
        showPublishSuccessToast(s.title, s.slug);
      }
    });
  }
}

// Global exposure
if (typeof window !== 'undefined') {
  (window as any).openPublishDialog = openPublishDialog;
  (window as any).closePublishDialog = closePublishDialog;
  (window as any).initPublishDialogHandlers = initPublishDialogHandlers;
}
