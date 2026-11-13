import { STRATA_DESIGN_SYSTEM_CSS } from '../../../styles.js';
import { escapeHtml } from '../../../lib/html.js';
import {
  renderBadge,
  renderButton,
  renderField,
  renderIconButton,
} from '../../../primitives/index.js';
import {
  renderDialog,
  renderDisclosure,
  renderDrawer,
  renderEmptyState,
  renderPageNotice,
  renderStatusLine,
  renderTabs,
} from '../../../components/index.js';
import { EDITOR_STRINGS, formatCount } from '../../../strings/admin/editor.js';

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
  siteName?: string;
  showWalkthrough?: boolean;
  pageError?: string;
  titleError?: string;
  nonce?: string;
  initialTheme?: 'light' | 'dark';
}

function formatVisibilityLabel(vis: ReferenceEntryVisibility): string {
  if (vis === 'public') return 'Public';
  if (vis === 'unlisted') return 'Unlisted';
  return 'Draft';
}

function formatTemporalLabel(tc: ReferenceEditorEntry['temporalConfidence']): string {
  if (tc === 'range') return 'Range';
  if (tc === 'estimated') return 'Estimated';
  return 'Exact';
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

function renderSlimAdminHeader(siteName: string): string {
  return `<header class="lp-admin-header">
  <div class="lp-admin-header-brand">
    <a href="/admin" class="lp-admin-brand-link">${escapeHtml(siteName)}</a>
  </div>
  <nav class="lp-admin-nav" aria-label="Workspace">
    <a href="/admin" class="lp-admin-nav-link">${escapeHtml(EDITOR_STRINGS.nav.today)}</a>
    <a href="/admin/entries/editor" class="lp-admin-nav-link" aria-current="page">${escapeHtml(EDITOR_STRINGS.nav.entries)}</a>
    <a href="/admin/inbox" class="lp-admin-nav-link">${escapeHtml(EDITOR_STRINGS.nav.inbox)}</a>
    <a href="/admin/settings" class="lp-admin-nav-link">${escapeHtml(EDITOR_STRINGS.nav.settings)}</a>
  </nav>
  <div class="lp-admin-header-actions">
    ${renderIconButton({ id: 'ref-theme-toggle', ariaLabel: EDITOR_STRINGS.nav.themeToggle, icon: '◐', variant: 'quiet', size: 'sm' })}
    ${renderButton({ id: 'ref-btn-signout', label: EDITOR_STRINGS.nav.signOut, variant: 'secondary', size: 'sm' })}
  </div>
</header>`;
}

function renderWalkthrough(show: boolean): string {
  const stepsHtml = EDITOR_STRINGS.walkthrough.steps
    .map(
      (step) => `<li class="lp-walkthrough-step">
  <strong>${escapeHtml(step.title)}</strong>
  <p>${escapeHtml(step.body)}</p>
</li>`
    )
    .join('');

  return `<section id="ref-walkthrough" class="lp-walkthrough" aria-labelledby="ref-walkthrough-heading"${show ? '' : ' hidden'}>
  <div class="lp-walkthrough-head">
    <h2 id="ref-walkthrough-heading">${escapeHtml(EDITOR_STRINGS.walkthrough.heading)}</h2>
    ${renderButton({ id: 'ref-walkthrough-dismiss', label: EDITOR_STRINGS.walkthrough.dismiss, variant: 'quiet', size: 'sm' })}
  </div>
  <ol class="lp-walkthrough-steps">${stepsHtml}</ol>
</section>`;
}

function renderActionBar(entry: ReferenceEditorEntry): string {
  const isDraft = entry.visibility === 'draft';
  const isUnlisted = entry.visibility === 'unlisted';
  const isPublic = entry.visibility === 'public';

  const saveLabel = isDraft ? EDITOR_STRINGS.actions.saveDraft : EDITOR_STRINGS.actions.saveChanges;
  const publishLabel = isUnlisted
    ? EDITOR_STRINGS.actions.makePublicEllipsis
    : EDITOR_STRINGS.actions.publishEllipsis;

  return `<div class="lp-editor-action-bar">
  <div class="lp-editor-primary-actions">
    ${renderButton({ id: 'ref-btn-save', label: saveLabel, variant: 'primary' })}
    ${renderButton({
      id: 'ref-btn-publish',
      label: publishLabel,
      variant: 'secondary',
      className: isPublic ? 'lp-is-hidden' : '',
    })}
    <div id="ref-visibility-menu-wrap" class="lp-menu-wrap${isPublic ? '' : ' lp-is-hidden'}">
      <button type="button" id="ref-visibility-menu-btn" class="lp-btn lp-btn-secondary lp-btn-md" aria-haspopup="menu" aria-expanded="false" aria-controls="ref-visibility-menu">${escapeHtml(EDITOR_STRINGS.actions.visibilityMenu)} ▾</button>
      <div id="ref-visibility-menu" class="lp-menu-list" role="menu" hidden>
        <button type="button" role="menuitem" class="lp-menu-item" data-vis="public">Public</button>
        <button type="button" role="menuitem" class="lp-menu-item" data-vis="unlisted">Unlisted</button>
        <button type="button" role="menuitem" class="lp-menu-item" data-vis="draft">Private (Draft)</button>
      </div>
    </div>
  </div>
  <div class="lp-editor-secondary-actions">
    ${renderButton({ id: 'ref-btn-structure', label: EDITOR_STRINGS.actions.structure, variant: 'quiet' })}
    <div class="lp-menu-wrap">
      <button type="button" id="ref-more-menu-btn" class="lp-btn lp-btn-quiet lp-btn-md" aria-haspopup="menu" aria-expanded="false" aria-controls="ref-more-menu">${escapeHtml(EDITOR_STRINGS.actions.moreMenu)} ▾</button>
      <div id="ref-more-menu" class="lp-menu-list" role="menu" hidden>
        <button type="button" role="menuitem" id="ref-more-unpublish" class="lp-menu-item">${escapeHtml(EDITOR_STRINGS.actions.makePrivate)}</button>
        <button type="button" role="menuitem" id="ref-more-history" class="lp-menu-item">${escapeHtml(EDITOR_STRINGS.actions.history)}</button>
        <hr class="lp-menu-sep" />
        <button type="button" role="menuitem" id="ref-more-delete" class="lp-menu-item lp-menu-item-danger">${escapeHtml(EDITOR_STRINGS.actions.deleteEntry)}</button>
      </div>
    </div>
  </div>
</div>`;
}

/**
 * Renders the Reference Editor Page built to D-WORKSPACE, D-EDITOR, D-FEEDBACK, and D-HELP.
 */
export function renderReferenceEditorPage(options: ReferenceEditorOptions): string {
  const siteName = options.siteName || 'Living Portfolio';
  const entries = options.entries;
  const selected =
    entries.find((e) => e.id === options.selectedId) ??
    (entries.length > 0 ? entries[0] : undefined);

  const sidebarItems =
    entries.length > 0
      ? entries
          .map((e) => {
            const active = selected && e.id === selected.id;
            const tone = e.visibility === 'public' ? 'ok' : e.visibility === 'unlisted' ? 'warn' : 'neutral';
            return `<li class="lp-entry-list-item${active ? ' lp-entry-list-item-active' : ''}">
  <a href="/admin/entries/${escapeHtml(e.id)}" class="lp-entry-list-link"${active ? ' aria-current="page"' : ''}>
    <span class="lp-entry-list-title">${escapeHtml(e.title)}</span>
    ${renderBadge({ label: formatVisibilityLabel(e.visibility), tone })}
  </a>
</li>`;
          })
          .join('')
      : `<li class="lp-entry-list-empty">${escapeHtml(EDITOR_STRINGS.sidebar.emptyList)}</li>`;

  const detailsBody = selected
    ? `<div class="lp-details-grid">
  ${renderField({ kind: 'input', id: 'ref-field-slug', name: 'slug', label: EDITOR_STRINGS.fields.slugLabel, value: selected.slug, help: EDITOR_STRINGS.fields.slugHelp })}
  ${renderField({
    kind: 'select',
    id: 'ref-field-profile',
    name: 'profile',
    label: EDITOR_STRINGS.fields.profileLabel,
    value: selected.profile,
    help: EDITOR_STRINGS.fields.profileHelp,
    options: [
      { value: 'decision', label: 'Architecture Decision' },
      { value: 'project', label: 'Project Case Study' },
      { value: 'freeform', label: 'Essay or Note' },
    ],
  })}
  ${renderField({ kind: 'input', inputType: 'date', id: 'ref-field-date', name: 'date', label: EDITOR_STRINGS.fields.dateLabel, value: selected.date.slice(0, 10), help: EDITOR_STRINGS.fields.dateHelp })}
  ${renderField({
    kind: 'select',
    id: 'ref-field-temporal',
    name: 'temporalConfidence',
    label: EDITOR_STRINGS.fields.temporalLabel,
    value: selected.temporalConfidence,
    help: EDITOR_STRINGS.fields.temporalHelp,
    options: [
      { value: 'exact', label: 'Exact' },
      { value: 'range', label: 'Range' },
      { value: 'estimated', label: 'Estimated' },
    ],
  })}
</div>`
    : '';

  const editorCanvas = selected
    ? `<div id="ref-editor-form" class="lp-editor-canvas" data-entry-id="${escapeHtml(selected.id)}" data-visibility="${escapeHtml(selected.visibility)}">
  <div class="lp-editor-state-row">
    ${renderBadge({
      id: 'ref-state-badge',
      label: formatVisibilityLabel(selected.visibility),
      tone: selected.visibility === 'public' ? 'ok' : selected.visibility === 'unlisted' ? 'warn' : 'neutral',
    })}
  </div>
  ${renderField({
    kind: 'input',
    id: 'ref-field-title',
    name: 'title',
    label: EDITOR_STRINGS.fields.titleLabel,
    value: selected.title,
    placeholder: EDITOR_STRINGS.fields.titlePlaceholder,
    help: EDITOR_STRINGS.fields.titleHelp,
    error: options.titleError,
    required: true,
  })}
  ${renderField({
    kind: 'textarea',
    id: 'ref-field-body',
    name: 'body',
    label: EDITOR_STRINGS.fields.bodyLabel,
    value: selected.body,
    placeholder: EDITOR_STRINGS.fields.bodyPlaceholder,
    help: EDITOR_STRINGS.fields.bodyHelp,
    rows: 12,
  })}
  <div id="ref-details-wrap">
    ${renderDisclosure({
      id: 'ref-details-disclosure',
      summary: EDITOR_STRINGS.details.summary,
      summaryMeta: `${formatVisibilityLabel(selected.visibility)} · ${formatDateSummary(selected.date)} · ${formatTemporalLabel(selected.temporalConfidence)}`,
      summaryMetaId: 'ref-details-summary-meta',
      bodyHtml: detailsBody,
    })}
  </div>
  ${renderActionBar(selected)}
  ${renderStatusLine({ id: 'ref-status-line', message: '' })}
</div>`
    : renderEmptyState({
        id: 'ref-empty-state',
        title: EDITOR_STRINGS.emptyState.title,
        body: EDITOR_STRINGS.emptyState.body,
        actionHtml: renderButton({
          id: 'ref-empty-start-btn',
          label: EDITOR_STRINGS.emptyState.action,
          variant: 'primary',
        }),
      });

  const publishDialogBody = `<div class="lp-publish-steps">
  <section class="lp-publish-step">
    <h3>${escapeHtml(EDITOR_STRINGS.publishDialog.step1Title)}</h3>
    <p id="ref-publish-dialog-status" role="status" aria-live="polite">${escapeHtml(EDITOR_STRINGS.publishDialog.step1Clean)}</p>
  </section>
  <section id="ref-publish-nda-step" class="lp-publish-step" hidden>
    <h3>${escapeHtml(EDITOR_STRINGS.publishDialog.step2NdaTitle)}</h3>
    ${renderField({
      kind: 'checkbox',
      id: 'ref-publish-nda-check',
      name: 'ndaConfirm',
      label: EDITOR_STRINGS.publishDialog.step2NdaLabel,
    })}
  </section>
  <section class="lp-publish-step">
    <h3 id="ref-publish-next-heading">${escapeHtml(EDITOR_STRINGS.publishDialog.step3CleanTitle)}</h3>
    <p>${escapeHtml(EDITOR_STRINGS.publishDialog.nextSummary)}</p>
  </section>
</div>`;

  const structureBody = `<p class="lp-field-help">${escapeHtml(EDITOR_STRINGS.structureDrawer.intro)}</p>
${renderTabs({
  id: 'ref-structure-tabs',
  ariaLabel: EDITOR_STRINGS.structureDrawer.title,
  tabs: [
    { id: 'summary', label: EDITOR_STRINGS.structureDrawer.tabs.summary, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.summaryText)}</p>`, active: true },
    { id: 'context', label: EDITOR_STRINGS.structureDrawer.tabs.context, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.contextText)}</p>` },
    { id: 'evidence', label: EDITOR_STRINGS.structureDrawer.tabs.evidence, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.evidenceText)}</p>` },
  ],
})}`;

  const themeAttr = options.initialTheme ? ` data-theme="${escapeHtml(options.initialTheme)}"` : '';
  const nonceAttr = options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';

  return `<!DOCTYPE html>
<html lang="en"${themeAttr}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(EDITOR_STRINGS.pageTitle)} — ${escapeHtml(siteName)}</title>
  <style>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body class="lp-admin-body">
  <a href="#ref-main" class="skip-link">Skip to editor</a>
  ${renderSlimAdminHeader(siteName)}
  <div class="lp-admin-notice-slot">
    ${renderPageNotice({
      id: 'ref-page-notice',
      tone: options.pageError ? 'danger' : 'info',
      message: options.pageError ?? '',
      dismissible: true,
      hidden: !options.pageError,
    })}
  </div>
  <main id="ref-main" class="lp-editor-shell">
    <aside class="lp-editor-sidebar" aria-label="${escapeHtml(EDITOR_STRINGS.sidebar.heading)}">
      <div class="lp-editor-sidebar-head">
        <h1 class="lp-editor-sidebar-title">${escapeHtml(EDITOR_STRINGS.sidebar.heading)} (${escapeHtml(formatCount(entries.length, 'entry', 'entries'))})</h1>
        ${renderButton({ id: 'ref-btn-new-entry', label: EDITOR_STRINGS.sidebar.newEntry, variant: 'secondary', size: 'sm' })}
      </div>
      <ul class="lp-entry-list">${sidebarItems}</ul>
    </aside>
    <section class="lp-editor-main" aria-label="Entry editor">
      ${renderWalkthrough(Boolean(options.showWalkthrough))}
      ${editorCanvas}
    </section>
  </main>
  ${renderDialog({
    id: 'ref-publish-dialog',
    title: EDITOR_STRINGS.publishDialog.title,
    bodyHtml: publishDialogBody,
    footerHtml: `${renderButton({ id: 'ref-publish-cancel', label: EDITOR_STRINGS.publishDialog.cancel, variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } })} ${renderButton({ id: 'ref-publish-confirm', label: EDITOR_STRINGS.publishDialog.confirmPublish, variant: 'primary' })}`,
  })}
  ${renderDrawer({
    id: 'ref-structure-drawer',
    title: EDITOR_STRINGS.structureDrawer.title,
    bodyHtml: structureBody,
    position: 'right',
  })}
  <script type="module" src="/assets/client/editor-page.js"${nonceAttr}></script>
</body>
</html>`;
}
