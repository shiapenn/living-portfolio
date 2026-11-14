import {
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from '../containers.js';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';

type Visibility = 'draft' | 'unlisted' | 'public';

function setupMenu(buttonId: string, menuId: string): () => void {
  const btn = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return () => {};

  const getItems = () =>
    Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));

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

  menu.addEventListener('keydown', (event) => {
    const items = getItems();
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      btn.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target as Node) && event.target !== btn && !btn.contains(event.target as Node)) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hasAttribute('hidden')) {
      close();
      btn.focus();
    }
  });

  return close;
}

function autoGrowTextarea(ta: HTMLTextAreaElement): void {
  ta.style.height = 'auto';
  ta.style.height = `${Math.max(ta.scrollHeight, 144)}px`;
}

function setFieldError(input: HTMLElement | null, message: string | null): void {
  if (!input) return;
  const field = input.closest('.lp-field');
  if (!field) return;
  const errId = `${input.id}-error`;
  let errEl = document.getElementById(errId);
  if (message) {
    field.classList.add('lp-field-has-error');
    input.setAttribute('aria-invalid', 'true');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = errId;
      errEl.className = 'lp-field-error';
      errEl.setAttribute('role', 'alert');
      field.appendChild(errEl);
    }
    errEl.textContent = message;
  } else {
    field.classList.remove('lp-field-has-error');
    input.removeAttribute('aria-invalid');
    errEl?.remove();
  }
}

function bootEditorPage(): void {
  initDismissibleNotices(document);

  // Auto-grow writing surface textarea
  document.querySelectorAll<HTMLTextAreaElement>('textarea[data-lp-autogrow]').forEach((ta) => {
    autoGrowTextarea(ta);
    ta.addEventListener('input', () => autoGrowTextarea(ta));
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll<HTMLTextAreaElement>('textarea[data-lp-autogrow]').forEach(autoGrowTextarea);
  });

  // Theme toggle (target-mode icon & label: moon in light -> Switch to dark theme; sun in dark -> Switch to light theme)
  const themeBtn = document.getElementById('ref-theme-toggle');
  const applyThemeToggleUi = (theme: 'light' | 'dark') => {
    if (!themeBtn) return;
    const nextLabel = theme === 'dark' ? EDITOR_STRINGS.nav.toLight : EDITOR_STRINGS.nav.toDark;
    const nextIcon = theme === 'dark' ? 'sun' : 'moon';
    themeBtn.setAttribute('aria-label', nextLabel);
    themeBtn.setAttribute('title', nextLabel);
    themeBtn.setAttribute('data-tooltip', nextLabel);
    const useEl = themeBtn.querySelector('use');
    if (useEl) useEl.setAttribute('href', `#lp-icon-${nextIcon}`);
  };

  themeBtn?.addEventListener('click', () => {
    const html = document.documentElement;
    const next: 'light' | 'dark' = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    applyThemeToggleUi(next);
    try {
      localStorage.setItem('strata-theme', next);
    } catch {
      // Ignore storage errors
    }
  });

  // Sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Ignore network errors on logout
    }
    window.location.href = '/admin/login';
  };
  document.getElementById('ref-btn-signout')?.addEventListener('click', handleSignOut);
  document.getElementById('ref-mobile-signout')?.addEventListener('click', handleSignOut);

  // Dismiss first-run guide inside EmptyState
  const dismissGuideBtn = document.getElementById('ref-walkthrough-dismiss');
  dismissGuideBtn?.addEventListener('click', () => {
    const emptyState = document.getElementById('ref-empty-state');
    emptyState?.querySelector('.lp-empty-guide')?.remove();
    const titleEl = emptyState?.querySelector('.lp-empty-title');
    const bodyEl = emptyState?.querySelector('.lp-empty-body');
    const ctaEl = document.getElementById('ref-empty-start-btn');
    if (titleEl) titleEl.textContent = EDITOR_STRINGS.emptyState.title;
    if (bodyEl) bodyEl.textContent = EDITOR_STRINGS.emptyState.body;
    if (ctaEl) ctaEl.textContent = EDITOR_STRINGS.emptyState.action;
    dismissGuideBtn.remove();
    try {
      localStorage.setItem('lp_editor_walkthrough_dismissed', '1');
    } catch {
      // Ignore storage errors
    }
  });

  // Start new draft from EmptyState or Sidebar New entry
  const startNewDraft = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    window.location.href = `/admin/entries/editor?fixture=new-draft&theme=${currentTheme}`;
  };
  document.getElementById('ref-empty-start-btn')?.addEventListener('click', startNewDraft);
  document.getElementById('ref-btn-new-entry')?.addEventListener('click', startNewDraft);

  // Structure & History drawers
  const structureTabs = document.getElementById('ref-structure-tabs');
  if (structureTabs) initTabs(structureTabs);

  const structureDrawerEl = document.getElementById('ref-structure-drawer');
  const structureBtn = document.getElementById('ref-btn-structure');
  if (structureDrawerEl && structureBtn) {
    const ctrl = attachModalController(structureDrawerEl);
    structureBtn.addEventListener('click', () => ctrl.open(structureBtn));
  }

  const historyDrawerEl = document.getElementById('ref-history-drawer');
  const historyCtrl = historyDrawerEl ? attachModalController(historyDrawerEl) : null;

  // Popover menus
  setupMenu('ref-mobile-menu-btn', 'ref-mobile-nav-menu');
  const closeVisMenu = setupMenu('ref-visibility-menu-btn', 'ref-visibility-menu');
  const closeMoreMenu = setupMenu('ref-more-menu-btn', 'ref-more-menu');

  const formEl = document.getElementById('ref-editor-form');
  const statusLineEl = document.getElementById('ref-status-line');
  const saveBtn = document.getElementById('ref-btn-save');
  const publishBtn = document.getElementById('ref-btn-publish');
  const visMenuWrap = document.getElementById('ref-visibility-menu-wrap');
  const titleInput = document.getElementById('ref-field-title') as HTMLInputElement | null;
  const bodyInput = document.getElementById('ref-field-body') as HTMLTextAreaElement | null;
  const headingEl = document.getElementById('ref-editor-heading');
  const stateBadge = document.getElementById('ref-state-badge');
  const activeEntryId = formEl?.getAttribute('data-entry-id') ?? '';
  const activeRowBadge = activeEntryId
    ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-badge`)
    : null;
  const activeRowTitle = activeEntryId
    ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-entry-list-title`)
    : null;

  const historyEntries: Array<{ time: string; title: string }> = [];

  const applyVisibility = (vis: Visibility) => {
    formEl?.setAttribute('data-visibility', vis);
    const label = EDITOR_STRINGS.states[vis];
    const badgeCls = vis === 'public' ? 'lp-badge lp-badge-ok' : vis === 'unlisted' ? 'lp-badge lp-badge-warn' : 'lp-badge lp-badge-neutral';
    if (stateBadge) {
      stateBadge.textContent = label;
      stateBadge.className = badgeCls;
    }
    if (activeRowBadge) {
      activeRowBadge.textContent = label;
      activeRowBadge.className = badgeCls;
    }
    if (saveBtn) {
      const span = saveBtn.querySelector('span');
      const nextText = vis === 'draft' ? EDITOR_STRINGS.actions.saveDraft : EDITOR_STRINGS.actions.saveChanges;
      if (span) span.textContent = nextText;
      else saveBtn.textContent = nextText;
    }
    if (vis === 'public') {
      publishBtn?.classList.add('lp-is-hidden');
      visMenuWrap?.classList.remove('lp-is-hidden');
    } else {
      publishBtn?.classList.remove('lp-is-hidden');
      visMenuWrap?.classList.add('lp-is-hidden');
      if (publishBtn) {
        const span = publishBtn.querySelector('span');
        const pubText = vis === 'unlisted' ? EDITOR_STRINGS.actions.makePublic : EDITOR_STRINGS.actions.publish;
        if (span) span.textContent = pubText;
        else publishBtn.textContent = pubText;
      }
    }
  };

  titleInput?.addEventListener('input', () => {
    const val = titleInput.value.trim();
    if (headingEl) headingEl.textContent = val || EDITOR_STRINGS.sidebar.untitled;
    if (activeRowTitle) activeRowTitle.textContent = val || EDITOR_STRINGS.sidebar.untitled;
    if (val) setFieldError(titleInput, null);
  });

  // Details summary meta live sync
  const updateDetailsSummary = () => {
    const metaEl = document.getElementById('ref-details-summary-meta');
    const dateEl = document.getElementById('ref-field-date') as HTMLInputElement | null;
    const temporalEl = document.getElementById('ref-field-temporal') as HTMLSelectElement | null;
    const profileEl = document.getElementById('ref-field-profile') as HTMLSelectElement | null;
    if (!metaEl || !dateEl || !temporalEl || !profileEl) return;
    const parsed = new Date(`${dateEl.value.slice(0, 10)}T00:00:00Z`);
    const dateStr = Number.isNaN(parsed.getTime())
      ? dateEl.value
      : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const temporalStr = EDITOR_STRINGS.temporalShort[temporalEl.value] ?? 'Exact date';
    const profileStr = EDITOR_STRINGS.profileShort[profileEl.value] ?? 'Case Study';
    metaEl.textContent = `${dateStr} · ${temporalStr} · ${profileStr}`;
  };
  document.getElementById('ref-field-date')?.addEventListener('change', updateDetailsSummary);
  document.getElementById('ref-field-temporal')?.addEventListener('change', updateDetailsSummary);
  document.getElementById('ref-field-profile')?.addEventListener('change', updateDetailsSummary);

  // Save action
  let previousBody = bodyInput?.value ?? '';
  saveBtn?.addEventListener('click', () => {
    if (!statusLineEl) return;
    const title = titleInput?.value.trim() ?? '';
    if (!title) {
      setFieldError(titleInput, EDITOR_STRINGS.fields.titleError);
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.errorTitleRequired,
        tone: 'danger',
      });
      titleInput?.focus();
      return;
    }
    setFieldError(titleInput, null);
    const vis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'draft';
    const snapshot = previousBody;
    previousBody = bodyInput?.value ?? '';
    historyEntries.unshift({
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      title,
    });
    updateStatusLine(statusLineEl, {
      message: vis === 'draft' ? EDITOR_STRINGS.feedback.savedDraft : EDITOR_STRINGS.feedback.savedChanges,
      tone: 'ok',
      undoLabel: EDITOR_STRINGS.actions.undo,
      undoSeconds: 8,
      onUndo: () => {
        if (bodyInput) {
          bodyInput.value = snapshot;
          autoGrowTextarea(bodyInput);
        }
        updateStatusLine(statusLineEl, {
          message: EDITOR_STRINGS.feedback.restored,
          tone: 'info',
        });
      },
    });
  });

  // Publish pre-flight dialog
  const publishDlgEl = document.getElementById('ref-publish-dialog');
  const publishCtrl = publishDlgEl ? attachModalController(publishDlgEl) : null;

  const openPublishPreFlight = (triggerEl?: HTMLElement | null) => {
    if (!publishCtrl || !publishDlgEl) return;
    const statusEl = document.getElementById('ref-publish-dialog-status');
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    const nextHeading = document.getElementById('ref-publish-next-heading');
    const bodyText = bodyInput?.value ?? '';
    const hasSensitive = /confidential|secret|nda|password|api[_ -]?key/i.test(bodyText);

    if (ndaCheck) ndaCheck.checked = false;
    if (statusEl) {
      statusEl.textContent = hasSensitive ? EDITOR_STRINGS.publishDialog.matched : EDITOR_STRINGS.publishDialog.clean;
    }
    if (ndaStep && nextHeading) {
      if (hasSensitive) {
        ndaStep.removeAttribute('hidden');
        nextHeading.textContent = `3. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
      } else {
        ndaStep.setAttribute('hidden', '');
        nextHeading.textContent = `2. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
      }
    }
    publishCtrl.open(triggerEl);
  };

  publishBtn?.addEventListener('click', () => openPublishPreFlight(publishBtn));

  document.getElementById('ref-publish-confirm')?.addEventListener('click', () => {
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    if (ndaStep && !ndaStep.hasAttribute('hidden') && !ndaCheck?.checked) {
      const dlgStatus = document.getElementById('ref-publish-dialog-status');
      if (dlgStatus) dlgStatus.textContent = EDITOR_STRINGS.publishDialog.blocked;
      return;
    }
    const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'draft';
    publishCtrl?.close();
    applyVisibility('public');
    if (statusLineEl) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.published,
        tone: 'ok',
        undoLabel: EDITOR_STRINGS.actions.undo,
        undoSeconds: 8,
        onUndo: () => {
          applyVisibility(priorVis);
          updateStatusLine(statusLineEl, {
            message: EDITOR_STRINGS.feedback.restored,
            tone: 'info',
          });
        },
      });
    }
  });

  // Visibility menu items
  document.querySelectorAll<HTMLElement>('#ref-visibility-menu [data-vis]').forEach((item) => {
    item.addEventListener('click', () => {
      const targetVis = item.getAttribute('data-vis') as Visibility;
      const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'public';
      closeVisMenu();
      if (targetVis === 'public') {
        openPublishPreFlight(document.getElementById('ref-visibility-menu-btn'));
        return;
      }
      applyVisibility(targetVis);
      if (statusLineEl) {
        updateStatusLine(statusLineEl, {
          message: targetVis === 'unlisted' ? EDITOR_STRINGS.feedback.unlisted : EDITOR_STRINGS.feedback.madePrivate,
          tone: 'ok',
          undoLabel: EDITOR_STRINGS.actions.undo,
          undoSeconds: 8,
          onUndo: () => {
            applyVisibility(priorVis);
            updateStatusLine(statusLineEl, {
              message: EDITOR_STRINGS.feedback.restored,
              tone: 'info',
            });
          },
        });
      }
    });
  });

  // More menu: Make private, History, Delete entry…
  document.getElementById('ref-more-unpublish')?.addEventListener('click', () => {
    const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'public';
    closeMoreMenu();
    applyVisibility('draft');
    if (statusLineEl) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.madePrivate,
        tone: 'info',
        undoLabel: EDITOR_STRINGS.actions.undo,
        undoSeconds: 8,
        onUndo: () => {
          applyVisibility(priorVis);
          updateStatusLine(statusLineEl, {
            message: EDITOR_STRINGS.feedback.restored,
            tone: 'info',
          });
        },
      });
    }
  });

  document.getElementById('ref-more-history')?.addEventListener('click', () => {
    closeMoreMenu();
    const listEl = document.getElementById('ref-history-list');
    const emptyEl = document.getElementById('ref-history-empty');
    if (listEl && emptyEl) {
      listEl.innerHTML = '';
      if (historyEntries.length === 0) {
        emptyEl.removeAttribute('hidden');
      } else {
        emptyEl.setAttribute('hidden', '');
        historyEntries.forEach((h) => {
          const li = document.createElement('li');
          li.className = 'lp-entry-row';
          li.textContent = `${h.time} — ${h.title}`;
          listEl.appendChild(li);
        });
      }
    }
    historyCtrl?.open(document.getElementById('ref-more-menu-btn'));
  });

  const deleteDlgEl = document.getElementById('ref-delete-dialog');
  const deleteCtrl = deleteDlgEl ? attachModalController(deleteDlgEl) : null;
  document.getElementById('ref-more-delete')?.addEventListener('click', () => {
    closeMoreMenu();
    deleteCtrl?.open(document.getElementById('ref-more-menu-btn'));
  });

  document.getElementById('ref-delete-confirm')?.addEventListener('click', () => {
    deleteCtrl?.close();
    const activeRow = activeEntryId
      ? document.querySelector<HTMLElement>(`[data-entry-row="${activeEntryId}"]`)?.closest('li')
      : null;
    const countBadge = document.getElementById('ref-entries-count');
    const prevCount = parseInt(countBadge?.textContent ?? '1', 10) || 1;
    if (activeRow) activeRow.setAttribute('hidden', '');
    if (countBadge) countBadge.textContent = String(Math.max(0, prevCount - 1));
    if (statusLineEl) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.deleted,
        tone: 'warn',
        undoLabel: EDITOR_STRINGS.actions.undo,
        undoSeconds: 8,
        onUndo: () => {
          if (activeRow) activeRow.removeAttribute('hidden');
          if (countBadge) countBadge.textContent = String(prevCount);
          updateStatusLine(statusLineEl, {
            message: EDITOR_STRINGS.feedback.restored,
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
