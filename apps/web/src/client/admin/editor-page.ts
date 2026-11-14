import {
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from '../containers.js';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';

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

function setupMenu(buttonId: string, menuId: string): () => void {
  const btn = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return () => {};

  const getItems = () =>
    Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]'));

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
    if (isFixtureMode) {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      window.location.href = `/admin/entries/editor?fixture=new-draft&theme=${currentTheme}`;
      return;
    }
    window.location.href = '/admin?new=1';
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
  let isDirty = isNewEntry || (titleInput ? titleInput.value.trim().length === 0 : false);
  const markDirty = () => {
    isDirty = true;
  };

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

  const formatApiError = (status: number, data: any): string => {
    if (status === 401) {
      return 'Your session has expired. Sign in again at /admin/login.';
    }
    if (status === 403) {
      return 'Security check failed (CSRF token invalid or missing). Reload and sign in again.';
    }
    if (status >= 500) {
      return `Server error (HTTP ${status}). Please try again.`;
    }
    return data?.error || data?.message || EDITOR_STRINGS.feedback.saveFailed;
  };

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
      window.history.replaceState(null, '', `/admin?entry=${encodeURIComponent(activeEntryId)}`);
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
    isDirty = false;
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

  // Publish pre-flight dialog
  const publishDlgEl = document.getElementById('ref-publish-dialog');
  const publishCtrl = publishDlgEl ? attachModalController(publishDlgEl) : null;

  let checkTimer = 0;
  const openPublishPreFlight = async (triggerEl?: HTMLElement | null) => {
    if (!publishCtrl || !publishDlgEl) return;
    const statusEl = document.getElementById('ref-publish-dialog-status');
    const ndaStep = document.getElementById('ref-publish-nda-step');
    const ndaCheck = document.getElementById('ref-publish-nda-check') as HTMLInputElement | null;
    const nextHeading = document.getElementById('ref-publish-next-heading');
    const confirmBtn = document.getElementById('ref-publish-confirm');
    const bodyText = bodyInput?.value ?? '';

    if (checkTimer) window.clearTimeout(checkTimer);
    if (ndaCheck) ndaCheck.checked = false;
    ndaStep?.setAttribute('hidden', '');
    if (nextHeading) nextHeading.textContent = `2. ${EDITOR_STRINGS.publishDialog.nextTitle}`;
    if (statusEl) statusEl.textContent = EDITOR_STRINGS.publishDialog.checking;
    if (confirmBtn) {
      confirmBtn.setAttribute('data-loading', 'true');
      confirmBtn.setAttribute('aria-disabled', 'true');
      confirmBtn.innerHTML = `<svg class="lp-icon lp-icon-spin" width="16" height="16" aria-hidden="true"><use href="#lp-icon-loader-circle"></use></svg><span>${EDITOR_STRINGS.publishDialog.confirm}</span>`;
    }
    publishCtrl.open(triggerEl);

    const finishScanUi = (hasSensitive: boolean) => {
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
      if (confirmBtn) {
        confirmBtn.removeAttribute('data-loading');
        confirmBtn.removeAttribute('aria-disabled');
        confirmBtn.textContent = EDITOR_STRINGS.publishDialog.confirm;
      }
    };

    if (isFixtureMode) {
      const hasSensitive = /confidential|secret|nda|password|api[_ -]?key/i.test(bodyText);
      checkTimer = window.setTimeout(() => finishScanUi(hasSensitive), 220);
      return;
    }

    if (isNewEntry || !activeEntryId || activeEntryId === 'new' || isDirty) {
      const saved = await persistEntry('draft');
      if (saved.ok) {
        previousBody = bodyInput?.value ?? '';
        isDirty = false;
      }
    }
    const scanEntryId = (isNewEntry || !activeEntryId || activeEntryId === 'new') ? 'draft' : activeEntryId;
    const scanRes = await apiRequest<{ redactionPreviewToken?: string; warnings?: unknown[]; clean?: boolean }>(
      '/api/entries/redaction-preview',
      {
        method: 'POST',
        body: JSON.stringify({ entryId: scanEntryId, text: bodyText }),
      }
    );
    previewToken = scanRes.data?.redactionPreviewToken ?? '';
    const hasSensitive = Boolean((scanRes.data?.warnings?.length ?? 0) > 0 || scanRes.data?.clean === false);
    finishScanUi(hasSensitive);
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
        window.history.replaceState(null, '', `/admin?entry=${encodeURIComponent(activeEntryId)}`);
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
      isDirty = false;
    }

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
  const deleteCtrl = deleteDlgEl ? attachModalController(deleteDlgEl) : null;
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootEditorPage);
} else {
  bootEditorPage();
}
