import {
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from '../containers.js';
import { resolveEntrySection } from '@living-portfolio/core/sections';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';
import { mountTiptapEditor, type MountedTiptapController } from './tiptap-editor.js';
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

function autoGrowTextarea(_ta: HTMLTextAreaElement): void {
  // Auto-sizing handled by CSS field-sizing: content without inline styles
}

function setFieldError(input: HTMLElement | null, message: string | null): void {
  if (!input) return;
  const field = input.closest('.lp-field, .lp-editor-title-wrap');
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
      field.appendChild(errEl);
    }
    errEl.classList.remove('lp-is-hidden');
    errEl.textContent = message;
  } else {
    field.classList.remove('lp-field-has-error');
    input.removeAttribute('aria-invalid');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('lp-is-hidden');
    }
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

  const formEl = document.getElementById('ref-editor-form');
  const statusLineEl = document.getElementById('ref-status-line');
  const saveBtn = document.getElementById('ref-btn-save');
  const publishBtn = document.getElementById('ref-btn-publish');
  const titleInput = document.getElementById('ref-field-title') as HTMLInputElement | null;
  const bodyInput = document.getElementById('ref-field-body') as HTMLTextAreaElement | null;
  const slugInput = document.getElementById('ref-field-slug') as HTMLInputElement | null;
  const dateInput = document.getElementById('ref-field-date') as HTMLInputElement | null;
  const temporalInput = document.getElementById('ref-field-temporal') as HTMLSelectElement | null;
  const profileInput = document.getElementById('ref-field-profile') as HTMLSelectElement | null;
  const headingEl = document.getElementById('ref-editor-heading');

  let activeEntryId = formEl?.getAttribute('data-entry-id') ?? '';
  let isNewEntry = formEl?.getAttribute('data-is-new') === 'true';
  let previewToken = '';

  const getActiveRowBadge = () =>
    activeEntryId ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-badge`) : null;
  const getActiveRowTitle = () =>
    activeEntryId ? document.querySelector(`[data-entry-row="${activeEntryId}"] .lp-entry-list-title`) : null;

  const applyVisibility = (vis: Visibility) => {
    formEl?.setAttribute('data-visibility', vis);
    const label = EDITOR_STRINGS.states[vis];
    const badgeCls = vis === 'public' ? 'lp-badge lp-badge-ok' : vis === 'unlisted' ? 'lp-badge lp-badge-warn' : 'lp-badge lp-badge-neutral';
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
    document.querySelectorAll<HTMLInputElement>('input[name="ref-visibility-choice"]').forEach((radio) => {
      radio.checked = radio.value === vis;
    });
    const publishWrap = document.getElementById('ref-publish-wrap');
    if (vis === 'draft') {
      publishWrap?.classList.remove('lp-is-hidden');
      publishBtn?.classList.remove('lp-is-hidden');
    } else {
      publishWrap?.classList.add('lp-is-hidden');
      publishBtn?.classList.add('lp-is-hidden');
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

  // Mount Tiptap editor (D-LAYOUT #8 & #9)
  const tiptapMountEl = document.getElementById('ref-tiptap-editor');
  const slashMenuEl = document.getElementById('ref-slash-menu');
  let tiptapCtrl: MountedTiptapController | null = null;
  if (tiptapMountEl && bodyInput) {
    tiptapCtrl = mountTiptapEditor({
      mountEl: tiptapMountEl,
      textareaEl: bodyInput,
      slashMenuEl,
      onMarkdownChange: () => {
        markDirty();
      },
    });
  }

  // Formatting toolbar buttons & Source toggle
  const fmtHeading = document.getElementById('ref-fmt-heading');
  const fmtBold = document.getElementById('ref-fmt-bold');
  const fmtItalic = document.getElementById('ref-fmt-italic');
  const fmtLink = document.getElementById('ref-fmt-link');
  const fmtBullet = document.getElementById('ref-fmt-bullet');
  const fmtQuote = document.getElementById('ref-fmt-quote');
  const fmtCode = document.getElementById('ref-fmt-code');
  const sourceToggleBtn = document.getElementById('ref-btn-source-toggle');

  for (const btn of [fmtHeading, fmtBold, fmtItalic, fmtLink, fmtBullet, fmtQuote, fmtCode]) {
    btn?.addEventListener('mousedown', (e) => e.preventDefault());
  }
  fmtHeading?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleHeading({ level: 2 }).run());
  fmtBold?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleBold().run());
  fmtItalic?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleItalic().run());
  fmtLink?.addEventListener('click', () => {
    const href = window.prompt('Link URL', 'https://');
    if (href) tiptapCtrl?.editor.chain().focus().setLink({ href }).run();
  });
  fmtBullet?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleBulletList().run());
  fmtQuote?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleBlockquote().run());
  fmtCode?.addEventListener('click', () => tiptapCtrl?.editor.chain().focus().toggleCodeBlock().run());
  sourceToggleBtn?.addEventListener('click', () => {
    if (!tiptapCtrl) return;
    const next = !tiptapCtrl.isSourceMode();
    tiptapCtrl.setSourceMode(next);
    sourceToggleBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
  });

  // View switcher: Edit vs Settings (D-EDITOR-4)
  const switchEditBtn = document.getElementById('ref-switch-edit');
  const switchSettingsBtn = document.getElementById('ref-switch-settings');
  const writingViewEl = document.getElementById('ref-writing-view');
  const settingsViewEl = document.getElementById('ref-settings-view');

  const setEditorView = (view: 'edit' | 'settings') => {
    const isEdit = view === 'edit';
    if (writingViewEl) writingViewEl.hidden = !isEdit;
    if (settingsViewEl) settingsViewEl.hidden = isEdit;
    switchEditBtn?.setAttribute('aria-checked', isEdit ? 'true' : 'false');
    switchEditBtn?.classList.toggle('is-selected', isEdit);
    switchSettingsBtn?.setAttribute('aria-checked', isEdit ? 'false' : 'true');
    switchSettingsBtn?.classList.toggle('is-selected', !isEdit);
    if (!isEdit) {
      void loadStructureData();
    }
  };

  switchEditBtn?.addEventListener('click', () => setEditorView('edit'));
  switchSettingsBtn?.addEventListener('click', () => setEditorView('settings'));
  document.getElementById('ref-details-line')?.addEventListener('click', (e) => {
    e.preventDefault();
    setEditorView('settings');
  });

  document.getElementById('ref-btn-open-claim')?.addEventListener('click', () => {
    document.getElementById('ref-claim-form-wrap')?.classList.remove('lp-is-hidden');
    document.getElementById('ref-claim-input')?.focus();
  });
  document.getElementById('ref-btn-cancel-claim')?.addEventListener('click', () => {
    document.getElementById('ref-claim-form-wrap')?.classList.add('lp-is-hidden');
  });
  document.getElementById('ref-btn-open-evidence')?.addEventListener('click', () => {
    document.getElementById('ref-evidence-form-wrap')?.classList.remove('lp-is-hidden');
    document.getElementById('ref-evidence-title')?.focus();
  });
  document.getElementById('ref-btn-cancel-evidence')?.addEventListener('click', () => {
    document.getElementById('ref-evidence-form-wrap')?.classList.add('lp-is-hidden');
  });

  // Full Structure restoration (D-EDITOR-4)
  let cachedRevId = '';
  const updateStructureLevel = (facetCount: number, claimCount: number, evidenceCount: number) => {
    const levelEl = document.getElementById('ref-structure-level');
    const nextEl = document.getElementById('ref-structure-next-step');
    const levels = ['Captured', 'Tagged', 'Claimed', 'Grounded'] as const;
    const idx = evidenceCount > 0 ? 3 : claimCount > 0 ? 2 : facetCount > 0 ? 1 : 0;
    if (levelEl) {
      levelEl.setAttribute('data-current-level', levels[idx]);
      const segs = Array.from(levelEl.querySelectorAll('.lp-level-segment'));
      segs.forEach((seg, i) => {
        seg.classList.toggle('is-done', i <= idx);
        seg.classList.toggle('is-upcoming', i > idx);
        seg.classList.toggle('is-current', i === idx);
      });
    }
    if (nextEl) {
      const msg =
        idx === 0
          ? 'Add a tag to reach Tagged.'
          : idx === 1
            ? 'Add a claim to reach Claimed.'
            : idx === 2
              ? 'Attach evidence to reach Grounded.'
              : 'All structure levels complete.';
      const targetId =
        idx === 0
          ? 'ref-facet-value'
          : idx === 1
            ? 'ref-btn-open-claim'
            : idx === 2
              ? 'ref-btn-open-evidence'
              : '';
      nextEl.setAttribute('data-next-target', targetId);
      const span = nextEl.querySelector('span');
      if (span) span.textContent = msg;
      else nextEl.textContent = msg;
    }
  };

  document.getElementById('ref-structure-next-step')?.addEventListener('click', (e) => {
    const btn = (e.currentTarget as HTMLElement | null);
    const targetId = btn?.getAttribute('data-next-target');
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  });

  const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderStructureLists = (
    facets: any[],
    claims: any[],
    evidence: any[],
    spans: any[],
    bodyText = ''
  ) => {
    const visibleFacets = facets.filter((f) => f?.status !== 'rejected');
    const byId = (id: string) => document.getElementById(id);
    const fEl = byId('ref-facets-list');
    if (fEl) {
      fEl.innerHTML = visibleFacets
        .map((f) => {
          const cat = f.key || f.facet_type || 'topic';
          const val = f.value ?? f.facet_value ?? '';
          const id = f.id ?? '';
          return `<span class="lp-tag" data-c="Tag" data-facet-id="${esc(id)}"><span class="lp-tag-label">${esc(cat)}: ${esc(val)}</span><button type="button" class="lp-tag-remove" data-remove-action="facet" data-remove-value="${esc(id)}" aria-label="Remove ${esc(val)}"><svg class="lp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></span>`;
        })
        .join('');
    }
    const cEl = byId('ref-claims-list');
    if (cEl) {
      cEl.classList.toggle('lp-is-empty', claims.length === 0);
      cEl.closest('.lp-subsection')?.classList.toggle('lp-gap-related', claims.length === 0);
      cEl.innerHTML = claims.length
        ? claims
            .map((c) => {
              const rawStatus = String(c.status || 'accepted');
              const stLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
              const tone = rawStatus === 'accepted' ? 'ok' : 'neutral';
              return `<div class="lp-item" data-c="Item"><div class="lp-item-title"><span>${esc(c.text ?? c.claim_text)}</span></div><div class="lp-item-status"><span data-c="StatusLabel" class="lp-status-indicator"><span class="lp-status-dot lp-status-dot-${tone}" aria-hidden="true"></span><span class="lp-status-label">${esc(stLabel)}</span></span></div></div>`;
            })
            .join('')
        : '';
    }
    const eEl = byId('ref-evidence-list');
    if (eEl) {
      eEl.classList.toggle('lp-is-empty', evidence.length === 0);
      eEl.closest('.lp-subsection')?.classList.toggle('lp-gap-related', evidence.length === 0);
      eEl.innerHTML = evidence.length
        ? evidence
            .map((ev) => `<div class="lp-item" data-c="Item"><div class="lp-item-title"><span>${esc(ev.verification?.title ?? ev.title ?? ev.url ?? 'Evidence')}</span></div><div class="lp-item-status"><span data-c="StatusLabel" class="lp-status-indicator"><span class="lp-status-dot lp-status-dot-ok" aria-hidden="true"></span><span class="lp-status-label">${esc(ev.kind || 'url')}</span></span></div>${ev.url ? `<div class="lp-item-subtitle">${esc(ev.url)}</div>` : ''}</div>`)
            .join('')
        : '';
    }
    const sEl = byId('ref-spans-list');
    if (sEl) {
      const formatRoleLabel = (raw: string) => {
        const clean = (raw || 'context').replace(/[-_]+/g, ' ').trim();
        return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Context';
      };
      const statusMeta = (rawStatus: string) => {
        const st = rawStatus || 'suggested';
        if (st === 'accepted') return { st: 'accepted', label: 'Accepted', tone: 'ok' };
        if (st === 'rejected') return { st: 'rejected', label: 'Ignored', tone: 'muted' };
        return { st: 'suggested', label: 'Suggested', tone: 'neutral' };
      };
      const extractCleanPassage = (sp: any, body: string): string => {
        const start = Number(sp.start_off ?? sp.start_offset ?? sp.start ?? 0);
        const end = Number(sp.end_off ?? sp.end_offset ?? sp.end ?? 0);
        let raw = String(sp.text || sp.text_exact || (end > start && body ? body.slice(start, end) : ''));
        if (!raw && body) raw = body;
        const bodyOnly = raw.replace(/^#{1,6}\s+.*$/gm, '').trim();
        const paras = (bodyOnly || raw).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        const nonHeading = paras.find((p) => !/^#{1,6}\s/.test(p)) ?? paras[0] ?? '';
        return nonHeading
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[*_`~>#]/g, '')
          .replace(/^\s*[-+]\s+/gm, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      const renderSpanActionsHtml = (spanId: string, roleRaw: string, status: string) => {
        if (status === 'accepted') {
          return `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="undo" data-span-id="${esc(spanId)}" data-span-role="${esc(roleRaw)}"><span>Undo</span></button></div>`;
        }
        if (status === 'rejected') {
          return `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="restore" data-span-id="${esc(spanId)}" data-span-role="${esc(roleRaw)}"><span>Restore</span></button></div>`;
        }
        return `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="accept" data-span-id="${esc(spanId)}" data-span-role="${esc(roleRaw)}"><span>Accept</span></button><button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-md" data-span-action="reject" data-span-id="${esc(spanId)}" data-span-role="${esc(roleRaw)}"><span>Ignore</span></button></div>`;
      };
      sEl.innerHTML = spans.length
        ? spans
            .map((sp) => {
              const roleRaw = sp.suggested_role || sp.role || 'context';
              const roleLabel = formatRoleLabel(roleRaw);
              const passage = extractCleanPassage(sp, bodyText);
              const meta = statusMeta(sp.status);
              return `<div class="lp-item lp-item-has-actions" data-c="Item" data-span-id="${esc(sp.id)}" data-span-status="${esc(meta.st)}"><div class="lp-item-content"><div class="lp-item-title"><span>${esc(roleLabel)}</span></div><div class="lp-item-status"><span data-c="StatusLabel" class="lp-status-indicator"><span class="lp-status-dot lp-status-dot-${meta.tone}" aria-hidden="true"></span><span class="lp-status-label">${esc(meta.label)}</span></span></div>${passage ? `<div class="lp-item-body lp-line-clamp-3" data-rel="itembody" title="${esc(passage)}">${esc(passage)}</div>` : ''}</div><div class="lp-item-actions" data-rel="actions">${renderSpanActionsHtml(String(sp.id), roleRaw, meta.st)}</div></div>`;
            })
            .join('')
        : '<p class="lp-field-help">Save entry to detect suggested span roles.</p>';
    }
    updateStructureLevel(visibleFacets.length, claims.length, evidence.length);
  };

  async function loadStructureData() {
    if (isFixtureMode || !activeEntryId || activeEntryId === 'new') return;
    const [entryRes, facetsRes, claimsRes, evRes] = await Promise.all([
      apiRequest<any>(`/api/entries/${encodeURIComponent(activeEntryId)}`),
      apiRequest<{ facets?: any[] }>(`/api/structure/entries/${encodeURIComponent(activeEntryId)}/facets`),
      apiRequest<{ claims?: any[] }>(`/api/structure/entries/${encodeURIComponent(activeEntryId)}/claims`),
      apiRequest<{ evidence?: any[] }>(`/api/structure/entries/${encodeURIComponent(activeEntryId)}/evidence`),
    ]);
    const revId =
      entryRes.data?.currentRevision?.id ??
      entryRes.data?.revisions?.[0]?.id ??
      '';
    cachedRevId = revId;
    const bodyText =
      entryRes.data?.currentRevision?.body_md ??
      entryRes.data?.revisions?.[0]?.body_md ??
      (document.getElementById('ref-body') as HTMLTextAreaElement | null)?.value ??
      '';
    let spans: any[] = [];
    if (revId) {
      const spansRes = await apiRequest<{ spans?: any[] }>(`/api/structure/revisions/${encodeURIComponent(revId)}/spans`);
      spans = spansRes.data?.spans ?? [];
    }
    const facets = facetsRes.data?.facets ?? [];
    const claims = claimsRes.data?.claims ?? [];
    const evidence = evRes.data?.evidence ?? [];
    renderStructureLists(facets, claims, evidence, spans, bodyText);
  }

  document.getElementById('ref-facets-list')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('button[data-remove-action="facet"]');
    if (!btn) return;
    const id = btn.getAttribute('data-remove-value') ?? '';
    if (!id) return;
    const res = await apiRequest(`/api/structure/facets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (res.ok) {
      btn.closest('.lp-tag')?.remove();
      const remaining = document.querySelectorAll('#ref-facets-list .lp-tag').length;
      const claimsCount = document.querySelectorAll('#ref-claims-list .lp-item').length;
      const evCount = document.querySelectorAll('#ref-evidence-list .lp-item').length;
      updateStructureLevel(remaining, claimsCount, evCount);
    }
  });

  document.getElementById('ref-btn-add-facet')?.addEventListener('click', async () => {
    const typeEl = document.getElementById('ref-facet-type') as HTMLSelectElement | null;
    const valEl = document.getElementById('ref-facet-value') as HTMLInputElement | null;
    const value = valEl?.value.trim() ?? '';
    if (!value || !activeEntryId || activeEntryId === 'new') return;
    const res = await apiRequest('/api/structure/facets', {
      method: 'POST',
      body: JSON.stringify({
        entry_id: activeEntryId,
        key: typeEl?.value || 'topic',
        value,
        source: 'owner',
        status: 'confirmed',
      }),
    });
    if (res.ok) {
      if (valEl) valEl.value = '';
      await loadStructureData();
    }
  });

  document.getElementById('ref-btn-add-claim')?.addEventListener('click', async () => {
    const claimEl = document.getElementById('ref-claim-input') as HTMLInputElement | null;
    const text = claimEl?.value.trim() ?? '';
    if (!text || !cachedRevId) return;
    const res = await apiRequest('/api/structure/claims', {
      method: 'POST',
      body: JSON.stringify({
        revision_id: cachedRevId,
        text,
        kind: 'fact',
        source: 'owner',
        status: 'accepted',
      }),
    });
    if (res.ok) {
      if (claimEl) claimEl.value = '';
      await loadStructureData();
    }
  });

  document.getElementById('ref-btn-add-evidence')?.addEventListener('click', async () => {
    const titleEl = document.getElementById('ref-evidence-title') as HTMLInputElement | null;
    const urlEl = document.getElementById('ref-evidence-url') as HTMLInputElement | null;
    const title = titleEl?.value.trim() ?? '';
    const url = urlEl?.value.trim() ?? '';
    if ((!title && !url) || !activeEntryId || activeEntryId === 'new') return;
    const res = await apiRequest('/api/structure/evidence', {
      method: 'POST',
      body: JSON.stringify({
        entry_id: activeEntryId,
        url: url || undefined,
        kind: 'url',
        verification: title ? { title } : undefined,
      }),
    });
    if (res.ok) {
      if (titleEl) titleEl.value = '';
      if (urlEl) urlEl.value = '';
      await loadStructureData();
    }
  });

  document.getElementById('ref-spans-list')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('button[data-span-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-span-action');
    const span_id = btn.getAttribute('data-span-id') ?? '';
    const role = btn.getAttribute('data-span-role') ?? 'context';
    if (!span_id) return;
    const row = btn.closest('.lp-item[data-span-id]');
    const nextStatus = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'suggested';
    const res = await apiRequest('/api/structure/annotations', {
      method: 'POST',
      body: JSON.stringify({ span_id, role, status: nextStatus }),
    });
    if (res.ok && row) {
      row.setAttribute('data-span-status', nextStatus);
      const tone = nextStatus === 'accepted' ? 'ok' : nextStatus === 'rejected' ? 'muted' : 'neutral';
      const label = nextStatus === 'accepted' ? 'Accepted' : nextStatus === 'rejected' ? 'Ignored' : 'Suggested';
      const dotEl = row.querySelector('.lp-item-status .lp-status-dot');
      if (dotEl) dotEl.className = `lp-status-dot lp-status-dot-${tone}`;
      const labelEl = row.querySelector('.lp-item-status .lp-status-label');
      if (labelEl) labelEl.textContent = label;
      const actionsEl = row.querySelector('.lp-item-actions');
      if (actionsEl) {
        if (nextStatus === 'accepted') {
          actionsEl.innerHTML = `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="undo" data-span-id="${esc(span_id)}" data-span-role="${esc(role)}"><span>Undo</span></button></div>`;
        } else if (nextStatus === 'rejected') {
          actionsEl.innerHTML = `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="restore" data-span-id="${esc(span_id)}" data-span-role="${esc(role)}"><span>Restore</span></button></div>`;
        } else {
          actionsEl.innerHTML = `<div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-md" data-span-action="accept" data-span-id="${esc(span_id)}" data-span-role="${esc(role)}"><span>Accept</span></button><button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-md" data-span-action="reject" data-span-id="${esc(span_id)}" data-span-role="${esc(role)}"><span>Ignore</span></button></div>`;
        }
      }
    }
  });

  // Left entries drawer (push panel, closed by default)
  const entriesDrawer = document.getElementById('ref-entries-drawer');
  const entriesToggleBtn = document.getElementById('ref-sidebar-toggle');
  const entriesSearchInput = document.getElementById('ref-entries-search') as HTMLInputElement | null;

  const toggleDrawer = (drawer: HTMLElement | null, btn: HTMLElement | null, open: boolean) => {
    if (!drawer) return;
    if (open) drawer.removeAttribute('hidden');
    else drawer.setAttribute('hidden', '');
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  entriesToggleBtn?.addEventListener('click', () => {
    const isOpen = entriesDrawer ? !entriesDrawer.hasAttribute('hidden') : false;
    toggleDrawer(entriesDrawer, entriesToggleBtn, !isOpen);
  });

  entriesSearchInput?.addEventListener('input', () => {
    const q = entriesSearchInput.value.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>('#ref-entry-list [data-entry-row]').forEach((row) => {
      const txt = (row.textContent || '').toLowerCase();
      row.hidden = Boolean(q && !txt.includes(q));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (entriesDrawer && !entriesDrawer.hasAttribute('hidden')) {
      toggleDrawer(entriesDrawer, entriesToggleBtn, false);
      entriesToggleBtn?.focus();
    }
  });
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
            tiptapCtrl?.setMarkdown(data.body);
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
    const resolved = resolveEntrySection(profileInput.value, { slug: slugInput?.value });
    const temporalStr = EDITOR_STRINGS.temporalShort[temporalInput.value] ?? 'Exact';
    const profileStr = EDITOR_STRINGS.profileShort[profileInput.value] ?? 'Freeform';
    metaEl.textContent = `${resolved.label} · ${profileStr} · ${dateStr} · ${temporalStr}`;
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
    const sectionTargetEl = document.getElementById('ref-publish-section-target');
    if (sectionTargetEl) {
      const effectiveSlug =
        slugInput?.value?.trim() ||
        (titleInput?.value || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ||
        'untitled-entry';
      const resolved = resolveEntrySection(profileInput?.value, { slug: effectiveSlug });
      sectionTargetEl.textContent = `Publishes to ${resolved.label} at ${resolved.url}`;
    }
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

  // Visibility choice radios (D-EDITOR-4: Public, Unlisted, Private; Public opens Publish dialog)
  document.querySelectorAll<HTMLInputElement>('input[name="ref-visibility-choice"]').forEach((radio) => {
    radio.addEventListener('change', async () => {
      if (!radio.checked) return;
      const targetVis = radio.value as Visibility;
      const priorVis = (formEl?.getAttribute('data-visibility') as Visibility) ?? 'draft';
      if (targetVis === priorVis) return;
      if (targetVis === 'public') {
        applyVisibility(priorVis);
        await openPublishPreFlight(radio);
        return;
      }
      if (!isFixtureMode && activeEntryId) {
        const ok = await persistEntry(targetVis);
        if (!ok && statusLineEl) {
          applyVisibility(priorVis);
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
  const deleteDlgEl = document.getElementById('ref-delete-dialog');
  const deleteCtrl = deleteDlgEl
    ? attachModalController(deleteDlgEl, {
        onOpen: hideStatusLineForModal,
        onClose: restoreStatusLineAfterModal,
      })
    : null;

  // Dock formatting bar above virtual keyboard on mobile using visualViewport (D-COMP #10)
  const fmtBar = document.querySelector<HTMLElement>('.lp-editor-toolbar-center');
  if (fmtBar && window.visualViewport) {
    const syncViewportDock = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
      if (offset > 0) {
        fmtBar.style.setProperty('--vv-bottom', `${offset}px`);
      } else {
        fmtBar.style.removeProperty('--vv-bottom');
        if (!fmtBar.getAttribute('style')) fmtBar.removeAttribute('style');
      }
    };
    window.visualViewport.addEventListener('resize', syncViewportDock);
    window.visualViewport.addEventListener('scroll', syncViewportDock);
    syncViewportDock();
  }

  document.getElementById('ref-btn-delete')?.addEventListener('click', () => {
    deleteCtrl?.open(document.getElementById('ref-btn-delete'));
  });
  document.getElementById('ref-btn-more')?.addEventListener('click', () => {
    deleteCtrl?.open(document.getElementById('ref-btn-more'));
  });

  document.getElementById('ref-delete-confirm')?.addEventListener('click', async () => {
    deleteCtrl?.close();
    if (!isFixtureMode && activeEntryId && activeEntryId !== 'new') {
      const res = await apiRequest(`/api/entries/${encodeURIComponent(activeEntryId)}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href =
          window.location.pathname.startsWith('/admin/entries') && window.location.pathname !== '/admin/entries/editor'
            ? '/admin/entries'
            : '/admin';
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
