import { renderAdminShell } from '../../../layouts/admin-shell.js';
import { escapeHtml } from '../../../lib/html.js';
import {
  renderBadge,
  renderButton,
  renderField,
  renderIcon,
  renderIconButton,
} from '../../../primitives/index.js';
import {
  renderDisclosure,
  renderEmptyState,
  renderPageNotice,
  renderStatusLine,
} from '../../../components/index.js';
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';
import { renderStructureInspectorPanel, type StructureInspectorData } from '../../../patterns/structure-panel.js';
import {
  renderDraftAndOfflineBanners,
  renderEditorDialogsAndDrawers,
  type WorkspaceEscalationItem,
} from './editor-sections.js';

export type ReferenceEntryVisibility = 'draft' | 'unlisted' | 'public';

export interface ReferenceEditorEntry {
  id: string;
  slug: string;
  title: string;
  body: string;
  visibility: ReferenceEntryVisibility;
  date: string;
  temporalConfidence: 'exact' | 'range' | 'estimated';
  profile: string;
}

export interface ReferenceEditorOptions {
  entries: ReferenceEditorEntry[];
  selectedId?: string;
  isNew?: boolean;
  dedicatedRoute?: boolean;
  siteName?: string;
  showWalkthrough?: boolean;
  legacyRecoveryUsed?: boolean;
  pageError?: string;
  titleError?: string;
  statusMessage?: string;
  statusTone?: 'info' | 'ok' | 'warn' | 'danger';
  nonce?: string;
  initialTheme?: 'light' | 'dark';
  answeringEnabled?: boolean;
  escalations?: WorkspaceEscalationItem[];
  inspector?: StructureInspectorData;
}

function formatVisibilityLabel(vis: ReferenceEntryVisibility): string {
  return EDITOR_STRINGS.states[vis];
}

function visibilityTone(vis: ReferenceEntryVisibility): 'ok' | 'warn' | 'neutral' {
  if (vis === 'public') return 'ok';
  if (vis === 'unlisted') return 'warn';
  return 'neutral';
}

function formatDateSummary(isoDate: string): string {
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDetailsMeta(entry: ReferenceEditorEntry): string {
  const dateStr = formatDateSummary(entry.date);
  const temporalStr = EDITOR_STRINGS.temporalShort[entry.temporalConfidence] ?? 'Exact date';
  const profileStr = EDITOR_STRINGS.profileShort[entry.profile] ?? 'Freeform Essay';
  return `${dateStr} · ${temporalStr} · ${profileStr}`;
}

function renderVisibilityMenuItem(
  vis: ReferenceEntryVisibility,
  current: ReferenceEntryVisibility,
  label: string
): string {
  const checked = vis === current;
  return `<button type="button" role="menuitemradio" aria-checked="${checked ? 'true' : 'false'}" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item lp-menu-item-vis" data-vis="${vis}"><span class="lp-menu-check">${renderIcon({ name: 'check-circle', size: 16 })}</span><span>${escapeHtml(label)}</span></button>`;
}

function renderActionBar(entry: ReferenceEditorEntry): string {
  const isDraft = entry.visibility === 'draft';
  const saveLabel = isDraft ? EDITOR_STRINGS.actions.saveDraft : EDITOR_STRINGS.actions.saveChanges;
  const chevron = renderIcon({ name: 'chevron-down', size: 16, className: 'lp-disclosure-chevron' });

  return `<div class="lp-editor-action-bar">
  <div class="lp-editor-primary-actions">
    ${renderButton({ id: 'ref-btn-save', label: saveLabel, variant: 'primary', size: 'sm' })}
    ${renderButton({ id: 'ref-btn-publish', label: EDITOR_STRINGS.actions.publish, variant: 'secondary', size: 'sm', className: isDraft ? '' : 'lp-is-hidden' })}
    <div id="ref-visibility-menu-wrap" class="lp-menu-wrap${isDraft ? ' lp-is-hidden' : ''}">
      <button type="button" id="ref-visibility-menu-btn" class="lp-btn lp-btn-secondary lp-btn-sm" aria-haspopup="menu" aria-expanded="false" aria-controls="ref-visibility-menu">${escapeHtml(EDITOR_STRINGS.actions.visibility)} ${chevron}</button>
      <div id="ref-visibility-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.actions.visibility)}" hidden>
        ${renderVisibilityMenuItem('public', entry.visibility, EDITOR_STRINGS.visibilityMenu.public)}
        ${renderVisibilityMenuItem('unlisted', entry.visibility, EDITOR_STRINGS.visibilityMenu.unlisted)}
        ${renderVisibilityMenuItem('draft', entry.visibility, EDITOR_STRINGS.visibilityMenu.draft)}
      </div>
    </div>
  </div>
  <div class="lp-editor-secondary-actions">
    ${renderButton({ id: 'ref-btn-structure', label: EDITOR_STRINGS.actions.structure, variant: 'quiet', size: 'sm' })}
    <div class="lp-menu-wrap">
      ${renderIconButton({
        id: 'ref-more-menu-btn',
        ariaLabel: EDITOR_STRINGS.actions.more,
        title: EDITOR_STRINGS.actions.more,
        icon: 'more-horizontal',
        iconSize: 16,
        variant: 'quiet',
        size: 'sm',
      })}
      <div id="ref-more-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.actions.more)}" hidden>
        <button type="button" role="menuitem" id="ref-more-history" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" tabindex="0">${escapeHtml(EDITOR_STRINGS.actions.history)}</button>
        <hr class="lp-menu-separator" role="separator" />
        <button type="button" role="menuitem" id="ref-more-delete" class="lp-btn lp-btn-danger lp-btn-sm lp-menu-item lp-menu-item-danger" tabindex="-1">${escapeHtml(EDITOR_STRINGS.actions.deleteEntry)}</button>
      </div>
    </div>
  </div>
</div>`;
}

function renderEditorCanvas(selected: ReferenceEditorEntry, options: ReferenceEditorOptions): string {
  const detailsBody = `<div class="lp-details-grid">
  ${renderField({ kind: 'input', id: 'ref-field-slug', name: 'slug', label: EDITOR_STRINGS.fields.slugLabel, value: selected.slug })}
  ${renderField({
    kind: 'select',
    id: 'ref-field-profile',
    name: 'profile',
    label: EDITOR_STRINGS.fields.profileLabel,
    value: selected.profile,
    options: [...EDITOR_STRINGS.profiles],
  })}
  ${renderField({ kind: 'input', inputType: 'date', id: 'ref-field-date', name: 'date', label: EDITOR_STRINGS.fields.dateLabel, value: selected.date.slice(0, 10) })}
  ${renderField({
    kind: 'select',
    id: 'ref-field-temporal',
    name: 'temporalConfidence',
    label: EDITOR_STRINGS.fields.temporalLabel,
    value: selected.temporalConfidence,
    options: [...EDITOR_STRINGS.temporal],
  })}
</div>`;

  const headingText = selected.title.trim() || EDITOR_STRINGS.sidebar.untitled;

  return `<div id="ref-editor-form" class="lp-editor-canvas" data-entry-id="${escapeHtml(selected.id)}" data-visibility="${escapeHtml(selected.visibility)}" data-is-new="${options.isNew ? 'true' : 'false'}">
  <div class="lp-dialog-header">
    <h1 id="ref-editor-heading" class="lp-type-title lp-editor-heading">${escapeHtml(headingText)}</h1>
    ${renderBadge({
      id: 'ref-state-badge',
      label: formatVisibilityLabel(selected.visibility),
      tone: visibilityTone(selected.visibility),
    })}
  </div>
  ${renderField({ kind: 'input', id: 'ref-field-title', name: 'title', label: EDITOR_STRINGS.fields.titleLabel, value: selected.title, placeholder: EDITOR_STRINGS.fields.titlePlaceholder, error: options.titleError, required: true })}
  ${renderField({ kind: 'textarea', id: 'ref-field-body', name: 'body', label: EDITOR_STRINGS.fields.bodyLabel, value: selected.body, placeholder: EDITOR_STRINGS.fields.bodyPlaceholder, rows: 6, className: 'lp-writing-surface-field' })}
  <div id="ref-details-wrap">
    ${renderDisclosure({
      id: 'ref-details-disclosure',
      summary: EDITOR_STRINGS.details.summary,
      summaryMeta: formatDetailsMeta(selected),
      summaryMetaId: 'ref-details-summary-meta',
      bodyHtml: detailsBody,
    })}
  </div>
  ${renderActionBar(selected)}
  <div class="lp-status-line-slot">
    ${renderStatusLine({
      id: 'ref-status-line',
      message: options.statusMessage ?? '',
      tone: options.statusTone ?? 'info',
    })}
  </div>
</div>`;
}

/**
 * Renders the Reference Editor Page built to D-FOUND-1..6, D-WORKSPACE, D-EDITOR, D-FEEDBACK, and D-HELP.
 */
export function renderReferenceEditorPage(options: ReferenceEditorOptions): string {
  const siteName = options.siteName || 'Living Portfolio';
  const theme = options.initialTheme === 'dark' ? 'dark' : 'light';
  const entries = options.entries;
  const savedCount = entries.filter((e) => e.id !== 'new').length;
  const selected =
    entries.find((e) => e.id === options.selectedId) ??
    (!options.dedicatedRoute && entries.length > 0 ? entries[0] : undefined);

  const sidebarItems = entries
    .map((e) => {
      const active = selected && e.id === selected.id;
      const isPlaceholder = e.id === 'new';
      const rowTitle = isPlaceholder
        ? EDITOR_STRINGS.sidebar.newUnsaved
        : e.title.trim() || EDITOR_STRINGS.sidebar.untitled;
      const rowHref = options.dedicatedRoute
        ? isPlaceholder
          ? '/admin/entries/new'
          : `/admin/entries/${encodeURIComponent(e.id)}`
        : isPlaceholder
          ? '/admin?new=1'
          : `/admin?entry=${escapeHtml(e.id)}`;
      const rowBadge = isPlaceholder
        ? renderBadge({ label: EDITOR_STRINGS.sidebar.unsavedBadge, tone: 'warn' })
        : renderBadge({ label: formatVisibilityLabel(e.visibility), tone: visibilityTone(e.visibility) });
      return `<li>
  <a href="${rowHref}" class="lp-entry-row${active ? ' lp-entry-row-active' : ''}" data-entry-row="${escapeHtml(e.id)}"${active ? ' aria-current="page"' : ''}>
    <span class="lp-entry-list-title">${escapeHtml(rowTitle)}</span>
    ${rowBadge}
  </a>
</li>`;
    })
    .join('');

  const emptyMainHtml = options.showWalkthrough
    ? renderEmptyState({
        id: 'ref-empty-state',
        title: EDITOR_STRINGS.firstRun.title,
        headingTag: 'h1',
        body: EDITOR_STRINGS.firstRun.body,
        guideSteps: [...EDITOR_STRINGS.firstRun.steps],
        dismissHtml: renderIconButton({
          id: 'ref-walkthrough-dismiss',
          ariaLabel: EDITOR_STRINGS.firstRun.dismiss,
          title: EDITOR_STRINGS.firstRun.dismiss,
          icon: 'x',
          iconSize: 16,
          variant: 'quiet',
          size: 'sm',
        }),
        actionHtml: renderButton({
          id: 'ref-empty-start-btn',
          label: EDITOR_STRINGS.firstRun.action,
          variant: 'primary',
        }),
      })
    : renderEmptyState({
        id: 'ref-empty-state',
        title: EDITOR_STRINGS.emptyState.title,
        headingTag: 'h1',
        body: EDITOR_STRINGS.emptyState.body,
        actionHtml: renderButton({ id: 'ref-empty-start-btn', label: EDITOR_STRINGS.emptyState.action, variant: 'primary' }),
      });

  const mainContent = selected ? renderEditorCanvas(selected, options) : emptyMainHtml;

  const nonceAttr = options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';

  const legacyMessage = options.legacyRecoveryUsed
    ? 'You signed in with an older recovery code. Replace your recovery codes in Settings > Account as soon as you can.'
    : '';
  const noticeMessage = options.pageError || legacyMessage;
  const noticeTone = options.pageError ? 'danger' : 'warn';

  const contentHtml = `<div class="lp-admin-notice-slot">
    ${renderDraftAndOfflineBanners()}
    <div class="lp-page-notice-slot">
      ${renderPageNotice({
        id: options.legacyRecoveryUsed && !options.pageError ? 'admin-legacy-recovery-notice' : 'ref-page-notice',
        tone: noticeTone,
        message: noticeMessage,
        dismissible: true,
        hidden: !noticeMessage,
      })}
    </div>
  </div>
  <div id="ref-main" class="lp-editor-shell">
    <aside class="lp-editor-sidebar" aria-label="${escapeHtml(EDITOR_STRINGS.sidebar.heading)}">
      <div class="lp-preview-list-header">
        <div class="lp-sidebar-title-group">
          <span class="lp-type-body-sm">${escapeHtml(EDITOR_STRINGS.sidebar.heading)}</span>
          ${renderBadge({ id: 'ref-entries-count', label: String(savedCount), tone: 'neutral' })}
        </div>
        ${entries.length > 0 ? renderButton({ id: 'ref-btn-new-entry', label: EDITOR_STRINGS.sidebar.newEntry, variant: 'secondary', size: 'sm' }) : ''}
      </div>
      <button type="button" id="ref-sidebar-toggle" class="lp-btn lp-btn-secondary lp-btn-sm lp-sidebar-toggle" aria-expanded="false" aria-controls="ref-entry-list">${escapeHtml(EDITOR_STRINGS.sidebar.toggleEntries)} (${savedCount})</button>
      <ul id="ref-entry-list" class="lp-entry-list" data-collapsed="true">${sidebarItems}</ul>
    </aside>
    <section id="ref-editor-main" class="lp-editor-main" aria-label="Entry editor">
      ${mainContent}
    </section>
    ${selected ? renderStructureInspectorPanel(options.inspector ?? { entryId: selected.id, visibility: selected.visibility, structureLevel: 0, gapQuestions: [], facets: [], claims: [], evidence: [], revisions: [] }) : ''}
  </div>
  ${renderEditorDialogsAndDrawers()}
  <script type="module" src="/assets/client/editor-page.js"${nonceAttr}></script>`;

  return renderAdminShell(EDITOR_STRINGS.pageTitle, '/admin/entries', contentHtml, {
    nonce: options.nonce,
    initialTheme: theme,
    answeringEnabled: options.answeringEnabled,
    siteName,
    legacyRecoveryUsed: options.legacyRecoveryUsed,
  });
}

function mapRawEditorEntry(e: any, rev?: any): ReferenceEditorEntry {
  const effectiveRev = rev ?? e.revision ?? e.currentRevision;
  return {
    id: e.id,
    slug: e.slug,
    title: e.title ?? '',
    body: e.body ?? effectiveRev?.body_md ?? '',
    visibility: e.visibility === 'public' ? 'public' : e.visibility === 'unlisted' ? 'unlisted' : 'draft',
    date: e.created_at ?? effectiveRev?.valid_from ?? new Date().toISOString().slice(0, 10),
    temporalConfidence: e.temporal_confidence ?? effectiveRev?.temporal_level ?? 'exact',
    profile: e.profile ?? 'freeform',
  };
}

export async function renderAdminEntriesPage(
  clientOrRepo: any,
  options: { selectedId?: string; selectedEntry?: ReferenceEditorEntry; isNew?: boolean; dedicatedRoute?: boolean; siteName?: string; legacyRecoveryUsed?: boolean; answeringEnabled?: boolean; initialTheme?: 'light' | 'dark'; nonce?: string; inspector?: StructureInspectorData } = {}
): Promise<string> {
  const listRes = clientOrRepo?.entries?.list ? await clientOrRepo.entries.list() : { entries: (await clientOrRepo?.listEntries?.()) ?? [] };
  let answeringEnabled = options.answeringEnabled ?? true;
  let escalations: WorkspaceEscalationItem[] = [];
  try {
    const s = clientOrRepo?.settings?.get ? await clientOrRepo.settings.get() : null;
    if (typeof s?.automatedAnsweringEnabled === 'boolean') answeringEnabled = s.automatedAnsweringEnabled;
  } catch { /* fallback */ }
  try {
    const rawEsc = clientOrRepo?.inbox?.list ? (await clientOrRepo.inbox.list('pending'))?.escalations : await clientOrRepo?.getEscalations?.('pending');
    if (Array.isArray(rawEsc)) escalations = rawEsc.map((e: any) => ({ id: String(e.id), question: String(e.question ?? ''), draft: typeof e.draft === 'string' ? e.draft : '' }));
  } catch { /* fallback */ }
  const mapped: ReferenceEditorEntry[] = (listRes?.entries ?? []).map((e: any) => mapRawEditorEntry(e));
  if (options.selectedEntry) {
    const idx = mapped.findIndex((item) => item.id === options.selectedEntry!.id);
    if (idx >= 0) mapped[idx] = options.selectedEntry;
    else mapped.unshift(options.selectedEntry);
  }
  if (options.isNew) {
    const newEntry: ReferenceEditorEntry = { id: 'new', slug: '', title: '', body: '', visibility: 'draft', date: new Date().toISOString().slice(0, 10), temporalConfidence: 'exact', profile: 'freeform' };
    return renderReferenceEditorPage({ entries: [newEntry, ...mapped], selectedId: 'new', isNew: true, dedicatedRoute: options.dedicatedRoute, siteName: options.siteName, legacyRecoveryUsed: options.legacyRecoveryUsed, initialTheme: options.initialTheme, nonce: options.nonce, answeringEnabled, escalations });
  }
  return renderReferenceEditorPage({ entries: mapped, selectedId: options.dedicatedRoute ? options.selectedId : (options.selectedId ?? mapped[0]?.id), dedicatedRoute: options.dedicatedRoute, siteName: options.siteName, legacyRecoveryUsed: options.legacyRecoveryUsed, showWalkthrough: mapped.length === 0, initialTheme: options.initialTheme, nonce: options.nonce, answeringEnabled, escalations, inspector: options.inspector });
}

export async function renderDedicatedEditorPage(
  clientOrRepo: any,
  options: { selectedId?: string; isNew?: boolean; siteName?: string; answeringEnabled?: boolean; initialTheme?: 'light' | 'dark'; nonce?: string } = {}
): Promise<string | null> {
  if (options.isNew) return renderAdminEntriesPage(clientOrRepo, { ...options, isNew: true, dedicatedRoute: true });
  if (!options.selectedId) return null;
  let found: any = null;
  try {
    const res =
      typeof clientOrRepo?.getEntry === 'function'
        ? await clientOrRepo.getEntry(options.selectedId, ['private', 'unlisted', 'public'])
        : await clientOrRepo?.entries?.get?.(options.selectedId);
    if (res && (res.entry || res.id)) found = res;
  } catch { return null; }
  if (!found) return null;
  const rawEntry = found.entry ?? found;
  const selectedEntry = mapRawEditorEntry(rawEntry, found.currentRevision);
  const vis = rawEntry.visibility === 'public' ? 'public' : rawEntry.visibility === 'unlisted' ? 'unlisted' : 'draft';
  const inspector: StructureInspectorData = { entryId: rawEntry.id, visibility: vis, structureLevel: Number(found.structureLevel ?? 0), gapQuestions: Array.isArray(found.gapQuestions) ? found.gapQuestions : [], facets: Array.isArray(found.facets) ? found.facets : [], claims: Array.isArray(found.claims) ? found.claims : [], evidence: Array.isArray(found.evidence) ? found.evidence : [], revisions: Array.isArray(found.revisions) ? found.revisions : [] };
  return renderAdminEntriesPage(clientOrRepo, { ...options, selectedId: options.selectedId, selectedEntry, dedicatedRoute: true, inspector });
}
