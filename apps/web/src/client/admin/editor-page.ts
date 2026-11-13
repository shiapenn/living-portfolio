import {
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from '../containers.js';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';

function setupMenu(buttonId: string, menuId: string): void {
  const btn = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return;

  const close = () => {
    menu.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !menu.hasAttribute('hidden');
    if (isOpen) {
      close();
    } else {
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target as Node) && event.target !== btn) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hasAttribute('hidden')) {
      close();
      btn.focus();
    }
  });
}

function bootEditorPage(): void {
  initDismissibleNotices(document);

  const themeBtn = document.getElementById('ref-theme-toggle');
  themeBtn?.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
  });

  const walkthrough = document.getElementById('ref-walkthrough');
  const dismissWalkthrough = document.getElementById('ref-walkthrough-dismiss');
  dismissWalkthrough?.addEventListener('click', () => {
    walkthrough?.setAttribute('hidden', '');
    try {
      localStorage.setItem('lp_editor_walkthrough_dismissed', '1');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  });

  const structureTabs = document.getElementById('ref-structure-tabs');
  if (structureTabs) initTabs(structureTabs);

  const structureDrawerEl = document.getElementById('ref-structure-drawer');
  const structureBtn = document.getElementById('ref-btn-structure');
  if (structureDrawerEl && structureBtn) {
    const ctrl = attachModalController(structureDrawerEl);
    structureBtn.addEventListener('click', () => ctrl.open(structureBtn));
  }

  setupMenu('ref-visibility-menu-btn', 'ref-visibility-menu');
  setupMenu('ref-more-menu-btn', 'ref-more-menu');

  const publishDlgEl = document.getElementById('ref-publish-dialog');
  const publishBtn = document.getElementById('ref-btn-publish');
  const publishCtrl = publishDlgEl ? attachModalController(publishDlgEl) : null;

  const openPublishPreFlight = (triggerEl?: HTMLElement | null) => {
    if (!publishCtrl || !publishDlgEl) return;
    const bodyEl = document.getElementById('ref-field-body') as HTMLTextAreaElement | null;
    const statusEl = document.getElementById('ref-publish-dialog-status');
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const nextHeading = document.getElementById('ref-publish-next-heading');
    const bodyText = bodyEl?.value ?? '';
    const hasSensitive = /confidential|secret|nda|password|api[_ -]?key/i.test(bodyText);

    if (statusEl) {
      statusEl.textContent = hasSensitive
        ? EDITOR_STRINGS.publishDialog.step1Matched
        : EDITOR_STRINGS.publishDialog.step1Clean;
    }
    if (ndaStep && nextHeading) {
      if (hasSensitive) {
        ndaStep.removeAttribute('hidden');
        nextHeading.textContent = EDITOR_STRINGS.publishDialog.step4NdaTitle;
      } else {
        ndaStep.setAttribute('hidden', '');
        nextHeading.textContent = EDITOR_STRINGS.publishDialog.step3CleanTitle;
      }
    }
    publishCtrl.open(triggerEl);
  };

  publishBtn?.addEventListener('click', () => openPublishPreFlight(publishBtn));

  const statusLineEl = document.getElementById('ref-status-line');
  const saveBtn = document.getElementById('ref-btn-save');
  const titleInput = document.getElementById('ref-field-title') as HTMLInputElement | null;
  const bodyInput = document.getElementById('ref-field-body') as HTMLTextAreaElement | null;
  const formEl = document.getElementById('ref-editor-form');
  let previousBody = bodyInput?.value ?? '';

  saveBtn?.addEventListener('click', () => {
    if (!statusLineEl) return;
    const title = titleInput?.value.trim() ?? '';
    if (!title) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.errorTitleRequired,
        tone: 'danger',
      });
      titleInput?.focus();
      return;
    }
    const vis = formEl?.getAttribute('data-visibility') ?? 'draft';
    const snapshot = previousBody;
    previousBody = bodyInput?.value ?? '';
    updateStatusLine(statusLineEl, {
      message: vis === 'draft' ? EDITOR_STRINGS.feedback.savedDraft : EDITOR_STRINGS.feedback.savedChanges,
      tone: 'ok',
      undoLabel: EDITOR_STRINGS.actions.undo,
      undoSeconds: 8,
      onUndo: () => {
        if (bodyInput) bodyInput.value = snapshot;
        updateStatusLine(statusLineEl, {
          message: EDITOR_STRINGS.feedback.restored,
          tone: 'info',
        });
      },
    });
  });

  const confirmPublishBtn = document.getElementById('ref-publish-confirm');
  confirmPublishBtn?.addEventListener('click', () => {
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    if (ndaStep && !ndaStep.hasAttribute('hidden') && !ndaCheck?.checked) {
      const dlgStatus = document.getElementById('ref-publish-dialog-status');
      if (dlgStatus) dlgStatus.textContent = EDITOR_STRINGS.feedback.errorPublishBlocked;
      return;
    }
    publishCtrl?.close();
    formEl?.setAttribute('data-visibility', 'public');
    const badge = document.getElementById('ref-state-badge');
    if (badge) {
      badge.textContent = 'Public';
      badge.className = 'lp-badge lp-badge-ok';
    }
    publishBtn?.classList.add('lp-is-hidden');
    document.getElementById('ref-visibility-menu-wrap')?.classList.remove('lp-is-hidden');
    if (saveBtn) saveBtn.textContent = EDITOR_STRINGS.actions.saveChanges;
    if (statusLineEl) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.published,
        tone: 'ok',
        undoLabel: EDITOR_STRINGS.actions.undo,
        undoSeconds: 8,
        onUndo: () => {
          formEl?.setAttribute('data-visibility', 'draft');
          if (badge) {
            badge.textContent = 'Draft';
            badge.className = 'lp-badge lp-badge-neutral';
          }
          publishBtn?.classList.remove('lp-is-hidden');
          document.getElementById('ref-visibility-menu-wrap')?.classList.add('lp-is-hidden');
          updateStatusLine(statusLineEl, {
            message: EDITOR_STRINGS.feedback.madePrivate,
            tone: 'info',
          });
        },
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootEditorPage);
} else {
  bootEditorPage();
}
