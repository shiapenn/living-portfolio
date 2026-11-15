import {
  attachMenuController,
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from '../containers.js';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';
import { formatActionableError } from '../../strings/formatters.js';

type Visibility = 'draft' | 'unlisted' | 'public';

function toApiVisibility(vis: Visibility): 'private' | 'unlisted' | 'public' {
  return vis === 'draft' ? 'private' : vis;
}

async function apiRequest<T = any>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const headers = new Headers(options.headers || {});
  try {
    const csrf = sessionStorage.getItem('lp_csrf_token');
    if (csrf) headers.set('X-CSRF-Token', csrf);
  } catch {
    // Ignore storage errors
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { credentials: 'same-origin', ...options, headers });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

function slugifyTitle(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-entry';
}

const DRAFT_BUFFER_KEY = 'lp_draft_buffer_active';

function maskSensitiveSnippet(raw: string): string {
  const s = (raw || '').trim();
  if (s.length <= 4) return '****';
  if (s.length <= 8) return `${s.slice(0, 2)}****`;
  return `${s.slice(0, 4)}…${s.slice(-2)}`;
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

  const isFixtureMode = new URLSearchParams(window.location.search).has('fixture');

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
      await apiRequest('/api/auth/logout', { method: 'POST' });
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
    if (isDirty && !window.confirm('You have unsaved draft writing. Are you sure you want to leave?')) {
      return;
    }
    if (isFixtureMode) {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      window.location.href = `/admin/entries/editor?fixture=new-draft&theme=${currentTheme}`;
      return;
    }
    if (window.location.pathname.startsWith('/admin/entries') && window.location.pathname !== '/admin/entries/editor') {
      window.location.href = '/admin/entries/new';
      return;
    }
    window.location.href = '/admin?new=1';
  };
  document.getElementById('ref-empty-start-btn')?.addEventListener('click', startNewDraft);
  document.getElementById('ref-btn-new-entry')?.addEventListener('click', startNewDraft);

  // Mobile sidebar Entries (n) collapse toggle (UX-92)
  const sidebarToggle = document.getElementById('ref-sidebar-toggle');
  const entryListEl = document.getElementById('ref-entry-list');
  sidebarToggle?.addEventListener('click', () => {
    if (!entryListEl) return;
    const collapsed = entryListEl.getAttribute('data-collapsed') === 'true';
    entryListEl.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
    sidebarToggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
  });

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

  // Popover menus (shared Menu controller, UX-97)
  attachMenuController('ref-mobile-menu-btn', 'ref-mobile-nav-menu');
  const closeVisMenu = attachMenuController('ref-visibility-menu-btn', 'ref-visibility-menu');
  const closeMoreMenu = attachMenuController('ref-more-menu-btn', 'ref-more-menu');

  const formEl = document.getElementById('ref-editor-form');
  const statusLineEl = document.getElementById('ref-status-line');
  const saveBtn = document.getElementById('ref-btn-save');
  const publishBtn = document.getElementById('ref-btn-publish');
  const visMenuWrap = document.getElementById('ref-visibility-menu-wrap');
  const titleInput = document.getElementById('ref-field-title') as HTMLInputElement | null;
  const bodyInput = document.getElementById('ref-field-body') as HTMLTextAreaElement | null;
  const slugInput = document.getElementById('ref-field-slug') as HTMLInputElement | null;
  const dateInput = document.getElementById('ref-field-date') as HTMLInputElement | null;
  const temporalInput = document.getElementById('ref-field-temporal') as HTMLSelectElement | null;
  const profileInput = document.getElementById('ref-field-profile') as HTMLSelectElement | null;
  const headingEl = document.getElementById('ref-editor-heading');
  const stateBadge = document.getElementById('ref-state-badge');

  let activeEntryId = formEl?.getAttribute('data-entry-id') ?? '';
  let isNewEntry = formEl?.getAttribute('data-is-new') === 'true';
  let previewToken = '';

  const getActiveRowBadge = () =>
    activeEntryId ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-badge`) : null;
  const getActiveRowTitle = () =>
    activeEntryId ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-entry-list-title`) : null;

  const historyEntries: Array<{ time: string; title: string }> = [];

  const applyVisibility = (vis: Visibility) => {
    formEl?.setAttribute('data-visibility', vis);
    const label = EDITOR_STRINGS.states[vis];
    const badgeCls = vis === 'public' ? 'lp-badge lp-badge-ok' : vis === 'unlisted' ? 'lp-badge lp-badge-warn' : 'lp-badge lp-badge-neutral';
    if (stateBadge) {
      stateBadge.textContent = label;
      stateBadge.className = badgeCls;
    }
    const rowBadge = getActiveRowBadge();
    if (rowBadge) {
      rowBadge.textContent = label;
      rowBadge.className = badgeCls;
    }
    if (saveBtn) {
      const span = saveBtn.querySelector('span');
      const nextText = vis === 'draft' ? EDITOR_STRINGS.actions.saveDraft : EDITOR_STRINGS.actions.saveChanges;
      if (span) span.textContent = nextText;
      else saveBtn.textContent = nextText;
    }
    document.querySelectorAll<HTMLElement>('#ref-visibility-menu [data-vis]').forEach((item) => {
      const itemVis = item.getAttribute('data-vis');
      item.setAttribute('aria-checked', itemVis === vis ? 'true' : 'false');
    });
    if (vis === 'draft') {
      publishBtn?.classList.remove('lp-is-hidden');
      visMenuWrap?.classList.add('lp-is-hidden');
    } else {
      publishBtn?.classList.add('lp-is-hidden');
      visMenuWrap?.classList.remove('lp-is-hidden');
    }
  };

  // D-EDITOR-2(c): Save is never disabled for a hidden reason; track dirty state instead
  const initialSnapshot = {
    title: titleInput?.value ?? '',
    body: bodyInput?.value ?? '',
    slug: slugInput?.value ?? '',
    date: dateInput?.value ?? '',
    temporal: temporalInput?.value ?? 'exact',
    profile: profileInput?.value ?? 'freeform',
  };
  let isDirty = isNewEntry || (titleInput ? titleInput.value.trim().length === 0 : false);
  let draftBufferTimer: number | undefined;

  const syncDirtyFlag = (dirty: boolean) => {
    isDirty = dirty;
    (window as any).__lp_is_dirty = dirty;
  };

  const writeDraftBuffer = () => {
    if (!formEl) return;
    const titleVal = titleInput?.value ?? '';
    const bodyVal = bodyInput?.value ?? '';
    if (!titleVal.trim() && !bodyVal.trim()) return;
    try {
      localStorage.setItem(
        DRAFT_BUFFER_KEY,
        JSON.stringify({
          entryId: activeEntryId || 'new',
          title: titleVal,
          body: bodyVal,
          slug: slugInput?.value ?? '',
          date: dateInput?.value ?? '',
          temporal: temporalInput?.value ?? 'exact',
          profile: profileInput?.value ?? 'freeform',
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const clearDraftBuffer = () => {
    if (draftBufferTimer !== undefined) {
      window.clearTimeout(draftBufferTimer);
      draftBufferTimer = undefined;
    }
    try {
      localStorage.removeItem(DRAFT_BUFFER_KEY);
    } catch {
      // Ignore storage errors
    }
    document.getElementById('draft-restore-notice')?.setAttribute('hidden', '');
  };

  const markDirty = () => {
    syncDirtyFlag(true);
    if (draftBufferTimer !== undefined) window.clearTimeout(draftBufferTimer);
    draftBufferTimer = window.setTimeout(writeDraftBuffer, 200);
  };

  // Restore draft buffer on boot if matching current entry (UX-96)
  if (!isFixtureMode && formEl) {
    try {
      const raw = localStorage.getItem(DRAFT_BUFFER_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const currentId = activeEntryId || 'new';
        if (data && data.entryId === currentId && (data.title || data.body)) {
          if (titleInput && typeof data.title === 'string') {
            titleInput.value = data.title;
            if (headingEl) headingEl.textContent = data.title.trim() || EDITOR_STRINGS.sidebar.untitled;
          }
          if (bodyInput && typeof data.body === 'string') {
            bodyInput.value = data.body;
            autoGrowTextarea(bodyInput);
          }
          if (slugInput && typeof data.slug === 'string') slugInput.value = data.slug;
          if (dateInput && typeof data.date === 'string') dateInput.value = data.date;
          if (temporalInput && typeof data.temporal === 'string') temporalInput.value = data.temporal;
          if (profileInput && typeof data.profile === 'string') profileInput.value = data.profile;
          syncDirtyFlag(true);
          document.getElementById('draft-restore-notice')?.removeAttribute('hidden');
        }
      }
    } catch {
      // Ignore malformed buffer
    }
  }

  document.getElementById('btn-discard-draft-buffer')?.addEventListener('click', () => {
    clearDraftBuffer();
    if (titleInput) {
      titleInput.value = initialSnapshot.title;
      if (headingEl) headingEl.textContent = initialSnapshot.title.trim() || EDITOR_STRINGS.sidebar.untitled;
    }
    if (bodyInput) {
      bodyInput.value = initialSnapshot.body;
      autoGrowTextarea(bodyInput);
    }
    if (slugInput) slugInput.value = initialSnapshot.slug;
    if (dateInput) dateInput.value = initialSnapshot.date;
    if (temporalInput) temporalInput.value = initialSnapshot.temporal;
    if (profileInput) profileInput.value = initialSnapshot.profile;
    syncDirtyFlag(false);
  });

  window.addEventListener('beforeunload', (event) => {
    if (isDirty) {
      event.preventDefault();
      event.returnValue = 'You have unsaved draft writing. Are you sure you want to leave?';
    }
  });

  document.addEventListener('click', (event) => {
    if (!isDirty) return;
    const target = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
    if (!target || target.target === '_blank' || target.hasAttribute('download')) return;
    const href = target.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    if (!window.confirm('You have unsaved draft writing. Are you sure you want to leave?')) {
      event.preventDefault();
    }
  });

  const offlineBanner = document.getElementById('admin-offline-banner');
  const syncOfflineBanner = () => {
    if (!offlineBanner) return;
    if (navigator.onLine) offlineBanner.setAttribute('hidden', '');
    else offlineBanner.removeAttribute('hidden');
  };
  window.addEventListener('offline', () => offlineBanner?.removeAttribute('hidden'));
  window.addEventListener('online', () => offlineBanner?.setAttribute('hidden', ''));
  syncOfflineBanner();

  titleInput?.addEventListener('input', () => {
    markDirty();
    const val = titleInput.value.trim();
    if (headingEl) headingEl.textContent = val || EDITOR_STRINGS.sidebar.untitled;
    const rowTitle = getActiveRowTitle();
    if (rowTitle) rowTitle.textContent = val || EDITOR_STRINGS.sidebar.untitled;
    if (val) setFieldError(titleInput, null);
  });
  bodyInput?.addEventListener('input', () => {
    markDirty();
    previewToken = '';
  });
  slugInput?.addEventListener('input', markDirty);

  // Details summary meta live sync
  const updateDetailsSummary = () => {
    markDirty();
    const metaEl = document.getElementById('ref-details-summary-meta');
    if (!metaEl || !dateInput || !temporalInput || !profileInput) return;
    const parsed = new Date(`${dateInput.value.slice(0, 10)}T00:00:00Z`);
    const dateStr = Number.isNaN(parsed.getTime())
      ? dateInput.value
      : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const temporalStr = EDITOR_STRINGS.temporalShort[temporalInput.value] ?? 'Exact date';
    const profileStr = EDITOR_STRINGS.profileShort[profileInput.value] ?? 'Case Study';
    metaEl.textContent = `${dateStr} · ${temporalStr} · ${profileStr}`;
  };
  dateInput?.addEventListener('change', updateDetailsSummary);
  temporalInput?.addEventListener('change', updateDetailsSummary);
  profileInput?.addEventListener('change', updateDetailsSummary);

  const buildPayload = (vis: Visibility) => {
    const title = titleInput?.value.trim() ?? '';
    const slug = slugInput?.value.trim() || slugifyTitle(title);
    if (slugInput && !slugInput.value.trim()) slugInput.value = slug;
    const rawDate = dateInput?.value || new Date().toISOString().slice(0, 10);
    const validFrom = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00.000Z`;
    const profile = profileInput?.value ?? 'freeform';
    const bodyMd = (bodyInput?.value ?? '').trim() || title || 'Untitled draft';
    return {
      title,
      slug,
      body_md: bodyMd,
      profile,
      view: profile === 'freeform' ? 'article' : 'structured',
      visibility: toApiVisibility(vis),
      temporal_level: temporalInput?.value ?? 'exact',
      valid_from: validFrom,
    };
  };

  const formatApiError = (status: number, data: any): string =>
    formatActionableError({
      status,
      message: data?.error || data?.message,
      action: 'save this entry',
    });

  const persistEntry = async (vis: Visibility): Promise<{ ok: boolean; error?: string }> => {
    const payload = buildPayload(vis);
    if (isNewEntry || !activeEntryId || activeEntryId === 'new') {
      const res = await apiRequest<{ entry?: { id: string } }>('/api/entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.data?.entry?.id) {
        return { ok: false, error: formatApiError(res.status, res.data) };
      }
      activeEntryId = res.data.entry.id;
      isNewEntry = false;
      formEl?.setAttribute('data-entry-id', activeEntryId);
      formEl?.setAttribute('data-is-new', 'false');
      const nextPath =
        window.location.pathname.startsWith('/admin/entries') && window.location.pathname !== '/admin/entries/editor'
          ? `/admin/entries/${encodeURIComponent(activeEntryId)}`
          : `/admin?entry=${encodeURIComponent(activeEntryId)}`;
      window.history.replaceState(null, '', nextPath);
      return { ok: true };
    }
    const res = await apiRequest(`/api/entries/${encodeURIComponent(activeEntryId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: formatApiError(res.status, res.data) };
    }
    if ((bodyInput?.value ?? '') !== previousBody && payload.body_md) {
      const revRes = await apiRequest(`/api/entries/${encodeURIComponent(activeEntryId)}/revisions`, {
        method: 'POST',
        body: JSON.stringify({
          entry_id: activeEntryId,
          body_md: payload.body_md,
          valid_from: payload.valid_from,
          temporal_level: payload.temporal_level,
        }),
      });
      if (!revRes.ok) {
        return { ok: false, error: formatApiError(revRes.status, revRes.data) };
      }
    }
    return { ok: true };
  };

  // Save action
  let previousBody = bodyInput?.value ?? '';
  saveBtn?.addEventListener('click', async () => {
    if (!statusLineEl) return;
    if (!isDirty) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.noChangesToSave,
        tone: 'info',
      });
      return;
    }
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

    if (!isFixtureMode) {
      const res = await persistEntry(vis);
      if (!res.ok) {
        updateStatusLine(statusLineEl, {
          message: res.error || EDITOR_STRINGS.feedback.saveFailed,
          tone: 'danger',
        });
        return;
      }
    }

    previousBody = bodyInput?.value ?? '';
    syncDirtyFlag(false);
    clearDraftBuffer();
    historyEntries.unshift({
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      title,
    });
    updateStatusLine(statusLineEl, {
      message: vis === 'draft' ? EDITOR_STRINGS.feedback.savedDraft : EDITOR_STRINGS.feedback.savedChanges,
      tone: 'ok',
      undoLabel: EDITOR_STRINGS.actions.undo,
      undoSeconds: 8,
      onUndo: async () => {
        if (bodyInput) {
          bodyInput.value = snapshot;
          autoGrowTextarea(bodyInput);
        }
        if (!isFixtureMode && activeEntryId) {
          await persistEntry(vis);
        }
        updateStatusLine(statusLineEl, {
          message: EDITOR_STRINGS.feedback.restored,
          tone: 'info',
        });
      },
    });
  });

  // Hide status line while a modal dialog is open so only one message place is active (UX-98)
  let statusHiddenByModal = false;
  const hideStatusLineForModal = () => {
    if (statusLineEl && !statusLineEl.hasAttribute('hidden') && statusLineEl.textContent?.trim()) {
      statusLineEl.setAttribute('hidden', '');
      statusHiddenByModal = true;
    }
  };
  const restoreStatusLineAfterModal = () => {
    if (statusHiddenByModal && statusLineEl && statusLineEl.textContent?.trim()) {
      statusLineEl.removeAttribute('hidden');
    }
    statusHiddenByModal = false;
  };

  // Publish pre-flight dialog
  const publishDlgEl = document.getElementById('ref-publish-dialog');
  const publishCtrl = publishDlgEl
    ? attachModalController(publishDlgEl, {
        onOpen: hideStatusLineForModal,
        onClose: restoreStatusLineAfterModal,
      })
    : null;

  interface MatchWarning {
    type?: string;
    match?: string;
    index?: number;
  }

  const renderPublishMatches = (warnings: MatchWarning[], bodyText: string) => {
    const matchesList = document.getElementById('ref-publish-matches');
    if (!matchesList) return;
    matchesList.innerHTML = '';
    if (!warnings || warnings.length === 0) {
      matchesList.setAttribute('hidden', '');
      return;
    }
    matchesList.removeAttribute('hidden');
    warnings.forEach((w) => {
      const li = document.createElement('li');
      li.className = 'lp-publish-match-item';
      const typeLabel = w.type || 'sensitive';
      const snippet = maskSensitiveSnippet(w.match || '');
      const pos = typeof w.index === 'number' ? w.index : 0;
      const meta = document.createElement('span');
      meta.className = 'lp-publish-match-meta';
      meta.textContent = `${typeLabel} · ${snippet} · pos ${pos}`;
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'lp-publish-match-link';
      jumpBtn.textContent = EDITOR_STRINGS.publishDialog.jumpToMatch;
      jumpBtn.addEventListener('click', () => {
        publishCtrl?.close();
        if (bodyInput) {
          bodyInput.focus();
          const len = (w.match || '').length;
          if (typeof bodyInput.setSelectionRange === 'function' && pos <= bodyText.length) {
            bodyInput.setSelectionRange(pos, Math.min(bodyText.length, pos + len));
          }
        }
      });
      li.appendChild(meta);
      li.appendChild(jumpBtn);
      matchesList.appendChild(li);
    });
  };

  let checkTimer = 0;
  const openPublishPreFlight = async (triggerEl?: HTMLElement | null) => {
    if (!publishCtrl || !publishDlgEl) return;
    const statusEl = document.getElementById('ref-publish-dialog-status');
    const matchesList = document.getElementById('ref-publish-matches');
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    const nextHeading = document.getElementById('ref-publish-next-heading');
    const confirmBtn = document.getElementById('ref-publish-confirm');
    const bodyText = bodyInput?.value ?? '';

    if (checkTimer) window.clearTimeout(checkTimer);
    if (ndaCheck) ndaCheck.checked = false;
    if (matchesList) {
      matchesList.innerHTML = '';
      matchesList.setAttribute('hidden', '');
    }
    ndaStep?.setAttribute('hidden', '');
    if (nextHeading) nextHeading.textContent = `2. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
    if (statusEl) statusEl.textContent = EDITOR_STRINGS.publishDialog.checking;
    if (confirmBtn) {
      confirmBtn.setAttribute('data-loading', 'true');
      confirmBtn.setAttribute('aria-disabled', 'true');
      confirmBtn.innerHTML = `<svg class="lp-icon lp-icon-spin" width="16" height="16" aria-hidden="true"><use href="#lp-icon-loader-circle"></use></svg><span>${EDITOR_STRINGS.publishDialog.confirm}</span>`;
    }
    publishCtrl.open(triggerEl);

    const finishScanUi = (hasSensitive: boolean, warnings: MatchWarning[] = []) => {
      if (statusEl) {
        statusEl.textContent = hasSensitive ? EDITOR_STRINGS.publishDialog.matched : EDITOR_STRINGS.publishDialog.clean;
      }
      renderPublishMatches(hasSensitive ? warnings : [], bodyText);
      if (ndaStep && nextHeading) {
        if (hasSensitive) {
          ndaStep.removeAttribute('hidden');
          nextHeading.textContent = `3. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
        } else {
          ndaStep.setAttribute('hidden', '');
          nextHeading.textContent = `2. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
        }
      }
      if (confirmBtn) {
        confirmBtn.removeAttribute('data-loading');
        confirmBtn.removeAttribute('aria-disabled');
        confirmBtn.textContent = EDITOR_STRINGS.publishDialog.confirm;
      }
    };

    if (isFixtureMode) {
      const m = /confidential|secret|nda|password|api[_ -]?key/i.exec(bodyText);
      const fixtureWarnings: MatchWarning[] = m ? [{ type: 'secret', match: m[0], index: m.index }] : [];
      checkTimer = window.setTimeout(() => finishScanUi(Boolean(m), fixtureWarnings), 220);
      return;
    }

    if (isNewEntry || !activeEntryId || activeEntryId === 'new' || isDirty) {
      const saved = await persistEntry('draft');
      if (saved.ok) {
        previousBody = bodyInput?.value ?? '';
        syncDirtyFlag(false);
        clearDraftBuffer();
      }
    }
    const scanEntryId = (isNewEntry || !activeEntryId || activeEntryId === 'new') ? 'draft' : activeEntryId;
    const scanRes = await apiRequest<{ redactionPreviewToken?: string; warnings?: MatchWarning[]; clean?: boolean }>(
      '/api/entries/redaction-preview',
      {
        method: 'POST',
        body: JSON.stringify({ entryId: scanEntryId, text: bodyText }),
      }
    );
    previewToken = scanRes.data?.redactionPreviewToken ?? '';
    const warnings = Array.isArray(scanRes.data?.warnings) ? scanRes.data.warnings : [];
    const hasSensitive = Boolean(warnings.length > 0 || scanRes.data?.clean === false);
    finishScanUi(hasSensitive, warnings);
  };

  publishBtn?.addEventListener('click', () => openPublishPreFlight(publishBtn));

  document.getElementById('ref-publish-confirm')?.addEventListener('click', async () => {
    const confirmBtn = document.getElementById('ref-publish-confirm');
    if (confirmBtn?.getAttribute('aria-disabled') === 'true') return;
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    if (ndaStep && !ndaStep.hasAttribute('hidden') && !ndaCheck?.checked) {
      const dlgStatus = document.getElementById('ref-publish-dialog-status');
      if (dlgStatus) dlgStatus.textContent = EDITOR_STRINGS.publishDialog.blocked;
      return;
    }
    const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'draft';

    if (!isFixtureMode) {
      const payload = {
        ...buildPayload('public'),
        redactionPreviewToken: previewToken,
        nda_confirmed: Boolean(ndaCheck?.checked),
      };
      if (isNewEntry || !activeEntryId || activeEntryId === 'new') {
        const createRes = await apiRequest<{ entry?: { id: string } }>('/api/entries', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!createRes.ok || !createRes.data?.entry?.id) {
          const dlgStatus = document.getElementById('ref-publish-dialog-status');
          if (dlgStatus) dlgStatus.textContent = formatApiError(createRes.status, createRes.data);
          return;
        }
        activeEntryId = createRes.data.entry.id;
        isNewEntry = false;
        formEl?.setAttribute('data-entry-id', activeEntryId);
        formEl?.setAttribute('data-is-new', 'false');
        const nextPath =
        window.location.pathname.startsWith('/admin/entries') && window.location.pathname !== '/admin/entries/editor'
          ? `/admin/entries/${encodeURIComponent(activeEntryId)}`
          : `/admin?entry=${encodeURIComponent(activeEntryId)}`;
      window.history.replaceState(null, '', nextPath);
      } else {
        const res = await apiRequest(`/api/entries/${encodeURIComponent(activeEntryId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const dlgStatus = document.getElementById('ref-publish-dialog-status');
          if (dlgStatus) dlgStatus.textContent = formatApiError(res.status, res.data);
          return;
        }
      }
      syncDirtyFlag(false);
      clearDraftBuffer();
    }

    statusHiddenByModal = false;
    publishCtrl?.close();
    applyVisibility('public');
    if (statusLineEl) {
      updateStatusLine(statusLineEl, {
        message: EDITOR_STRINGS.feedback.published,
        tone: 'ok',
        undoLabel: EDITOR_STRINGS.actions.undo,
        undoSeconds: 8,
        onUndo: async () => {
          if (!isFixtureMode && activeEntryId) {
            await persistEntry(priorVis);
          }
          applyVisibility(priorVis);
          updateStatusLine(statusLineEl, {
            message: EDITOR_STRINGS.feedback.restored,
            tone: 'info',
          });
        },
      });
    }
  });

  // Visibility menu items (D-EDITOR-2a: Public, Unlisted, Private; Public opens Publish dialog)
  document.querySelectorAll<HTMLElement>('#ref-visibility-menu [data-vis]').forEach((item) => {
    item.addEventListener('click', async () => {
      const targetVis = item.getAttribute('data-vis') as Visibility;
      const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'public';
      closeVisMenu();
      if (targetVis === priorVis) return;
      if (targetVis === 'public') {
        await openPublishPreFlight(document.getElementById('ref-visibility-menu-btn'));
        return;
      }
      if (!isFixtureMode && activeEntryId) {
        const ok = await persistEntry(targetVis);
        if (!ok && statusLineEl) {
          updateStatusLine(statusLineEl, { message: EDITOR_STRINGS.feedback.saveFailed, tone: 'danger' });
          return;
        }
        isDirty = false;
      }
      applyVisibility(targetVis);
      if (statusLineEl) {
        updateStatusLine(statusLineEl, {
          message: targetVis === 'unlisted' ? EDITOR_STRINGS.feedback.unlisted : EDITOR_STRINGS.feedback.madePrivate,
          tone: 'ok',
          undoLabel: EDITOR_STRINGS.actions.undo,
          undoSeconds: 8,
          onUndo: async () => {
            if (!isFixtureMode && activeEntryId && priorVis !== 'public') {
              await persistEntry(priorVis);
            }
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

  // More menu: History, Delete entry… (D-EDITOR-2a: never holds visibility actions)
  document.getElementById('ref-more-history')?.addEventListener('click', async () => {
    closeMoreMenu();
    const listEl = document.getElementById('ref-history-list');
    const emptyEl = document.getElementById('ref-history-empty');
    if (listEl && emptyEl) {
      listEl.innerHTML = '';
      let items = historyEntries;
      if (!isFixtureMode && activeEntryId && activeEntryId !== 'new') {
        const res = await apiRequest<{ revisions?: Array<{ created_at?: string; title?: string }> }>(
          `/api/entries/${encodeURIComponent(activeEntryId)}/revisions`
        );
        if (res.ok && Array.isArray(res.data?.revisions) && res.data.revisions.length > 0) {
          items = res.data.revisions.map((r) => ({
            time: (r.created_at ?? '').slice(0, 16).replace('T', ' '),
            title: r.title ?? EDITOR_STRINGS.historyDrawer.savedAt,
          }));
        }
      }
      if (items.length === 0) {
        emptyEl.removeAttribute('hidden');
      } else {
        emptyEl.setAttribute('hidden', '');
        items.forEach((h) => {
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
  const deleteCtrl = deleteDlgEl
    ? attachModalController(deleteDlgEl, {
        onOpen: hideStatusLineForModal,
        onClose: restoreStatusLineAfterModal,
      })
    : null;
  document.getElementById('ref-more-delete')?.addEventListener('click', () => {
    closeMoreMenu();
    deleteCtrl?.open(document.getElementById('ref-more-menu-btn'));
  });

  document.getElementById('ref-delete-confirm')?.addEventListener('click', async () => {
    deleteCtrl?.close();
    if (!isFixtureMode && activeEntryId && activeEntryId !== 'new') {
      const res = await apiRequest(`/api/entries/${encodeURIComponent(activeEntryId)}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin';
        return;
      }
    }
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

  // Automated-answering kill switch (UX-104)
  const killBtn = document.getElementById('btn-killswitch');
  const killBadge = document.getElementById('ref-killswitch-badge');
  killBtn?.addEventListener('click', async () => {
    const currentlyEnabled = killBtn.getAttribute('aria-pressed') === 'true';
    const nextEnabled = !currentlyEnabled;
    if (!isFixtureMode) {
      const res = await apiRequest('/api/settings/routing', {
        method: 'PATCH',
        body: JSON.stringify({ automatedAnsweringEnabled: nextEnabled }),
      });
      if (!res.ok) return;
    }
    killBtn.setAttribute('aria-pressed', nextEnabled ? 'true' : 'false');
    killBtn.textContent = nextEnabled
      ? EDITOR_STRINGS.safety.killSwitchPauseBtn
      : EDITOR_STRINGS.safety.killSwitchResumeBtn;
    if (killBadge) {
      killBadge.textContent = nextEnabled
        ? EDITOR_STRINGS.safety.killSwitchActive
        : EDITOR_STRINGS.safety.killSwitchPaused;
      killBadge.className = nextEnabled ? 'lp-badge lp-badge-ok' : 'lp-badge lp-badge-warn';
    }
  });

  // Escalation quick review card (UX-105)
  const escCard = document.getElementById('ref-escalations-card');
  const escList = document.getElementById('ref-escalations-list');
  const escEmpty = document.getElementById('ref-escalations-empty');
  const escCountBadge = document.getElementById('ref-escalations-count');
  escCard?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement | null;
    const approveBtn = target?.closest<HTMLElement>('[data-esc-approve]');
    const rejectBtn = target?.closest<HTMLElement>('[data-esc-reject]');
    const escId = approveBtn?.getAttribute('data-esc-approve') ?? rejectBtn?.getAttribute('data-esc-reject');
    if (!escId) return;
    const itemEl = escCard.querySelector<HTMLElement>(`[data-escalation-id="${escId}"]`);
    if (!isFixtureMode) {
      const endpoint = approveBtn
        ? `/api/inbox/${encodeURIComponent(escId)}/approve`
        : `/api/inbox/${encodeURIComponent(escId)}/reject`;
      const payload = approveBtn
        ? { finalReply: itemEl?.querySelector('.lp-escalation-question')?.textContent ?? 'Approved by owner' }
        : { reason: 'Declined by owner from workspace' };
      const res = await apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(payload) });
      if (!res.ok) return;
    }
    itemEl?.remove();
    const remaining = escList?.querySelectorAll('[data-escalation-id]').length ?? 0;
    if (escCountBadge) {
      escCountBadge.textContent = String(remaining);
      escCountBadge.className = remaining > 0 ? 'lp-badge lp-badge-warn' : 'lp-badge lp-badge-neutral';
    }
    if (remaining === 0) {
      escList?.setAttribute('hidden', '');
      escEmpty?.removeAttribute('hidden');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootEditorPage);
} else {
  bootEditorPage();
}
