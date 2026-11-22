import { renderAdminShell } from '../../../layouts/admin-shell.js';
import { BUILTIN_PROFILES, groupProfilesBySection, resolveEntrySection } from '@living-portfolio/core';
import { escapeHtml } from '../../../lib/html.js';
import {
  renderButton,
  renderChoiceGroup,
  renderField,
  renderFormSection,
  renderIconButton,
  renderItem,
  renderStatusDot,
} from '../../../primitives/index.js';
import {
  renderEmptyState,
  renderPageNotice,
} from '../../../components/index.js';
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';
import { type StructureInspectorData } from '../../../patterns/structure-panel.js';
import {
  renderDraftAndOfflineBanners,
  renderEditorDialogsAndDrawers,
  renderStructureSection,
  type WorkspaceEscalationItem,
} from './editor-sections.js';
import { formatDetailsMeta, formatVisibilityLabel, renderEditorFormattingBar, renderEditorToolbar } from './editor-toolbar.js';

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

function visibilityTone(vis: ReferenceEntryVisibility): 'ok' | 'warn' | 'neutral' {
  if (vis === 'public') return 'ok';
  if (vis === 'unlisted') return 'warn';
  return 'neutral';
}

function renderEditorCanvas(selected: ReferenceEditorEntry, options: ReferenceEditorOptions): string {
  const profileGroups = groupProfilesBySection(Object.values(BUILTIN_PROFILES)).map((g) => ({
    label: g.sectionLabel,
    options: g.profiles.map((p) => ({ value: p.id, label: p.label })),
  }));
  const effectiveSlug =
    selected.slug?.trim() ||
    selected.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    'untitled-entry';
  const resolvedTarget = resolveEntrySection(selected.profile, { slug: effectiveSlug });

  const detailsBody = `<div class="lp-stack lp-gap-related">
  ${renderField({ kind: 'input', id: 'ref-field-slug', name: 'slug', label: EDITOR_STRINGS.fields.slugLabel, value: selected.slug })}
  ${renderField({
    kind: 'select',
    id: 'ref-field-profile',
    name: 'profile',
    label: EDITOR_STRINGS.fields.profileLabel,
    value: selected.profile,
    optionGroups: profileGroups,
    help: `Publishes in ${resolvedTarget.label} at ${resolvedTarget.url}`,
  }).replace('<div class="lp-field-help">', '<div id="ref-details-publish-target" class="lp-field-help">')}
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

  const isDraft = selected.visibility === 'draft';
  const visibilitySection = renderFormSection({
    id: 'ref-vis-section',
    title: EDITOR_STRINGS.actions.visibility,
    description: 'Choose who can view this entry.',
    fieldsHtml: `${renderChoiceGroup({
      name: 'ref-visibility-choice',
      mode: 'single',
      variant: 'card',
      options: [
        { id: 'ref-vis-draft', value: 'draft', label: EDITOR_STRINGS.visibilityMenu.draft, checked: selected.visibility === 'draft' },
        { id: 'ref-vis-unlisted', value: 'unlisted', label: EDITOR_STRINGS.visibilityMenu.unlisted, checked: selected.visibility === 'unlisted' },
        { id: 'ref-vis-public', value: 'public', label: EDITOR_STRINGS.visibilityMenu.public, checked: selected.visibility === 'public' },
      ],
    })}
    <div id="ref-publish-wrap" class="lp-stack lp-gap-8${isDraft ? '' : ' lp-is-hidden'}">
      ${renderButton({ id: 'ref-btn-publish', label: EDITOR_STRINGS.actions.publish, variant: 'secondary', size: 'sm' })}
    </div>`,
  });

  const detailsSection = renderFormSection({
    id: 'ref-details-section',
    title: 'Details',
    description: 'Slug, type, date, and precision.',
    fieldsHtml: detailsBody,
  });

  const structureSection = renderStructureSection(options.inspector);

  return `<div id="ref-editor-form" class="lp-editor-fullscreen" data-entry-id="${escapeHtml(selected.id)}" data-visibility="${escapeHtml(selected.visibility)}" data-is-new="${options.isNew ? 'true' : 'false'}">
  ${renderEditorToolbar(selected, options.statusMessage ?? '', options.statusTone ?? 'info')}
  <div id="ref-writing-view" class="lp-editor-writing-view">
    <div class="lp-editor-writing-col">
      <div class="lp-editor-title-wrap">
        <textarea id="ref-field-title" name="title" rows="1" data-lp-autogrow="true" class="lp-editor-title-input" placeholder="${escapeHtml(EDITOR_STRINGS.fields.titlePlaceholder)}" aria-label="${escapeHtml(EDITOR_STRINGS.fields.titleLabel)}" required>${escapeHtml(selected.title)}</textarea>
        <a href="#settings" id="ref-details-line" class="lp-editor-details-line">${escapeHtml(formatVisibilityLabel(selected.visibility))}, ${escapeHtml(formatDetailsMeta(selected))}</a>
        ${options.titleError ? `<p id="ref-field-title-error" class="lp-field-error">${escapeHtml(options.titleError)}</p>` : '<p id="ref-field-title-error" class="lp-field-error lp-is-hidden"></p>'}
      </div>
      <div class="lp-editor-surface-wrap">
        <div id="ref-tiptap-editor" class="lp-tiptap-mount lp-prose"></div>
        <div id="ref-slash-menu" class="lp-popover-menu lp-slash-menu" data-overlay="true" role="menu" aria-label="Insert block" hidden></div>
        <textarea id="ref-field-body" name="body" class="lp-input lp-textarea lp-editor-source-textarea lp-is-hidden" rows="16" placeholder="${escapeHtml(EDITOR_STRINGS.fields.bodyPlaceholder)}" aria-label="${escapeHtml(EDITOR_STRINGS.fields.bodyLabel)}" hidden>${escapeHtml(selected.body)}</textarea>
      </div>
      ${renderEditorFormattingBar()}
    </div>
  </div>
  <div id="ref-settings-view" class="lp-editor-settings-view" hidden>
    <div class="lp-editor-writing-col lp-stack lp-gap-section">
      ${visibilitySection}
      ${detailsSection}
      ${structureSection}
    </div>
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
      const active = Boolean(selected && e.id === selected.id);
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
      const stateLabel = isPlaceholder ? EDITOR_STRINGS.sidebar.unsavedBadge : formatVisibilityLabel(e.visibility);
      const stateTone = isPlaceholder ? 'warn' : visibilityTone(e.visibility);
      return renderItem({
        href: rowHref,
        title: rowTitle,
        statusLabel: stateLabel,
        statusTone: stateTone,
        selected: active,
        attributes: `data-entry-row="${escapeHtml(e.id)}"${active ? ' aria-current="page"' : ''}`,
      });
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
  <div id="ref-main" class="lp-editor-shell-fullscreen">
    <aside id="ref-entries-drawer" class="lp-editor-drawer lp-editor-drawer-left" aria-label="${escapeHtml(EDITOR_STRINGS.sidebar.heading)}" hidden>
      <div class="lp-editor-drawer-header lp-editor-drawer-header-stack">
        <div class="lp-section-header">
          <h2 class="lp-section-header-title">${escapeHtml(EDITOR_STRINGS.sidebar.heading)}</h2>
        </div>
        ${entries.length > 0 ? renderButton({ id: 'ref-btn-new-entry', label: EDITOR_STRINGS.sidebar.newEntry, variant: 'primary', size: 'sm', className: 'lp-btn-full' }) : ''}
        <input type="search" id="ref-entries-search" class="lp-input" placeholder="Search entries…" aria-label="Search entries" />
      </div>
      <div id="ref-entry-list" class="lp-list">${sidebarItems}</div>
    </aside>
    <section id="ref-editor-main" class="lp-editor-main-fullscreen" aria-label="Entry editor">
      ${mainContent}
    </section>
  </div>
  ${renderEditorDialogsAndDrawers()}
  <script type="module" src="/assets/client/editor-page.js"${nonceAttr}></script>`;

  return renderAdminShell(EDITOR_STRINGS.pageTitle, '/admin/entries', contentHtml, {
    nonce: options.nonce,
    initialTheme: theme,
    answeringEnabled: options.answeringEnabled,
    siteName,
    legacyRecoveryUsed: options.legacyRecoveryUsed,
    template: 'editor',
    fullWidth: true,
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
