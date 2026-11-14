import { STRATA_DESIGN_SYSTEM_CSS } from '../../../styles.js';
import { escapeHtml } from '../../../lib/html.js';
import {
  renderBadge,
  renderButton,
  renderField,
  renderIcon,
  renderIconButton,
  renderIconSprite,
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
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';

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
  statusMessage?: string;
  statusTone?: 'info' | 'ok' | 'warn' | 'danger';
  nonce?: string;
  initialTheme?: 'light' | 'dark';
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

function renderSlimAdminHeader(theme: 'light' | 'dark'): string {
  const toggleIcon = theme === 'dark' ? 'sun' : 'moon';
  const toggleLabel = theme === 'dark' ? EDITOR_STRINGS.nav.toLight : EDITOR_STRINGS.nav.toDark;

  return `<header class="lp-admin-header" role="banner">
  <a href="/admin/entries/editor" class="lp-admin-header-brand">${escapeHtml(EDITOR_STRINGS.brand)}</a>
  <nav class="lp-admin-header-nav" aria-label="${escapeHtml(EDITOR_STRINGS.nav.label)}">
    <a href="/admin/entries/editor" class="lp-admin-header-link" aria-current="page">${escapeHtml(EDITOR_STRINGS.nav.entries)}</a>
    <a href="/admin/import" class="lp-admin-header-link">${escapeHtml(EDITOR_STRINGS.nav.import)}</a>
    <a href="/admin/settings" class="lp-admin-header-link">${escapeHtml(EDITOR_STRINGS.nav.settings)}</a>
    <a href="/home" class="lp-admin-header-link">${escapeHtml(EDITOR_STRINGS.nav.publicSite)}</a>
  </nav>
  <div class="lp-admin-header-actions">
    ${renderIconButton({
      id: 'ref-theme-toggle',
      ariaLabel: toggleLabel,
      title: toggleLabel,
      icon: toggleIcon,
      iconSize: 20,
      variant: 'secondary',
    })}
    ${renderButton({
      id: 'ref-btn-signout',
      label: EDITOR_STRINGS.nav.signOut,
      variant: 'quiet',
      size: 'sm',
      className: 'lp-admin-header-desktop-only',
    })}
    <div class="lp-menu-wrap lp-admin-header-mobile-only">
      ${renderIconButton({
        id: 'ref-mobile-menu-btn',
        ariaLabel: EDITOR_STRINGS.nav.menu,
        title: EDITOR_STRINGS.nav.menu,
        icon: 'menu',
        iconSize: 20,
        variant: 'secondary',
        dataAttrs: { 'aria-controls': 'ref-mobile-nav-menu' },
      })}
      <div id="ref-mobile-nav-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.nav.label)}" hidden>
        <a href="/admin/entries/editor" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" aria-current="page">${escapeHtml(EDITOR_STRINGS.nav.entries)}</a>
        <a href="/admin/import" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(EDITOR_STRINGS.nav.import)}</a>
        <a href="/admin/settings" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(EDITOR_STRINGS.nav.settings)}</a>
        <a href="/home" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(EDITOR_STRINGS.nav.publicSite)}</a>
        <hr class="lp-menu-separator" role="separator" />
        <button type="button" role="menuitem" id="ref-mobile-signout" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">${escapeHtml(EDITOR_STRINGS.nav.signOut)}</button>
      </div>
    </div>
  </div>
</header>`;
}

function renderActionBar(entry: ReferenceEditorEntry): string {
  const isDraft = entry.visibility === 'draft';
  const isPublic = entry.visibility === 'public';
  const saveLabel = isDraft ? EDITOR_STRINGS.actions.saveDraft : EDITOR_STRINGS.actions.saveChanges;
  const publishLabel = entry.visibility === 'unlisted' ? EDITOR_STRINGS.actions.makePublic : EDITOR_STRINGS.actions.publish;
  const chevron = renderIcon({ name: 'chevron-down', size: 16, className: 'lp-disclosure-chevron' });

  return `<div class="lp-editor-action-bar">
  <div class="lp-editor-primary-actions">
    <span class="lp-tooltip-wrap" id="ref-save-wrap">${renderButton({ id: 'ref-btn-save', label: saveLabel, variant: 'primary', size: 'sm' })}<span class="lp-tooltip-bubble" role="tooltip" id="ref-save-tooltip" hidden>${escapeHtml(EDITOR_STRINGS.actions.noUnsavedChanges)}</span></span>
    ${renderButton({ id: 'ref-btn-publish', label: publishLabel, variant: 'secondary', size: 'sm', className: isPublic ? 'lp-is-hidden' : '' })}
    <div id="ref-visibility-menu-wrap" class="lp-menu-wrap${isPublic ? '' : ' lp-is-hidden'}">
      <button type="button" id="ref-visibility-menu-btn" class="lp-btn lp-btn-secondary lp-btn-sm" aria-haspopup="menu" aria-expanded="false" aria-controls="ref-visibility-menu">${escapeHtml(EDITOR_STRINGS.actions.visibility)} ${chevron}</button>
      <div id="ref-visibility-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.actions.visibility)}" hidden>
        <button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-vis="public">${escapeHtml(EDITOR_STRINGS.visibilityMenu.public)}</button>
        <button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-vis="unlisted">${escapeHtml(EDITOR_STRINGS.visibilityMenu.unlisted)}</button>
        <button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-vis="draft">${escapeHtml(EDITOR_STRINGS.visibilityMenu.draft)}</button>
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
        <button type="button" role="menuitem" id="ref-more-unpublish" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" tabindex="0">${escapeHtml(EDITOR_STRINGS.actions.makePrivate)}</button>
        <button type="button" role="menuitem" id="ref-more-history" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" tabindex="-1">${escapeHtml(EDITOR_STRINGS.actions.history)}</button>
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

  return `<div id="ref-editor-form" class="lp-editor-canvas" data-entry-id="${escapeHtml(selected.id)}" data-visibility="${escapeHtml(selected.visibility)}">
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
  const selected =
    entries.find((e) => e.id === options.selectedId) ??
    (entries.length > 0 ? entries[0] : undefined);

  const sidebarItems = entries
    .map((e) => {
      const active = selected && e.id === selected.id;
      const rowTitle = e.title.trim() || EDITOR_STRINGS.sidebar.untitled;
      return `<li>
  <a href="/admin/entries/${escapeHtml(e.id)}" class="lp-entry-row${active ? ' lp-entry-row-active' : ''}" data-entry-row="${escapeHtml(e.id)}"${active ? ' aria-current="page"' : ''}>
    <span class="lp-entry-list-title">${escapeHtml(rowTitle)}</span>
    ${renderBadge({ label: formatVisibilityLabel(e.visibility), tone: visibilityTone(e.visibility) })}
  </a>
</li>`;
    })
    .join('');

  const emptyMainHtml = options.showWalkthrough
    ? renderEmptyState({
        id: 'ref-empty-state',
        title: EDITOR_STRINGS.firstRun.title,
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
        body: EDITOR_STRINGS.emptyState.body,
        actionHtml: renderButton({ id: 'ref-empty-start-btn', label: EDITOR_STRINGS.emptyState.action, variant: 'primary' }),
      });

  const mainContent = selected ? renderEditorCanvas(selected, options) : emptyMainHtml;

  const publishDialogBody = `<div class="lp-publish-steps">
  <section class="lp-publish-step">
    <h3>1. ${escapeHtml(EDITOR_STRINGS.publishDialog.checkTitle)}</h3>
    <p id="ref-publish-dialog-status" role="status" aria-live="polite">${escapeHtml(EDITOR_STRINGS.publishDialog.clean)}</p>
  </section>
  <section id="ref-publish-nda-step" class="lp-publish-step" hidden>
    <h3>2. ${escapeHtml(EDITOR_STRINGS.publishDialog.ndaTitle)}</h3>
    ${renderField({
      kind: 'checkbox',
      id: 'ref-publish-nda-check',
      name: 'ndaConfirm',
      label: EDITOR_STRINGS.publishDialog.ndaLabel,
    })}
  </section>
  <section class="lp-publish-step">
    <h3 id="ref-publish-next-heading">2. ${escapeHtml(EDITOR_STRINGS.publishDialog.nextTitle)}</h3>
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
  ${renderIconSprite()}
  <a href="#ref-main" class="skip-link">Skip to editor</a>
  ${renderSlimAdminHeader(theme)}
  <div class="lp-admin-notice-slot">
    <div class="lp-page-notice-slot">
      ${renderPageNotice({
        id: 'ref-page-notice',
        tone: options.pageError ? 'danger' : 'info',
        message: options.pageError ?? '',
        dismissible: true,
        hidden: !options.pageError,
      })}
    </div>
  </div>
  <main id="ref-main" class="lp-editor-shell">
    <aside class="lp-editor-sidebar" aria-label="${escapeHtml(EDITOR_STRINGS.sidebar.heading)}">
      <div class="lp-preview-list-header">
        <div class="lp-sidebar-title-group">
          <span class="lp-type-body-sm">${escapeHtml(EDITOR_STRINGS.sidebar.heading)}</span>
          ${renderBadge({ id: 'ref-entries-count', label: String(entries.length), tone: 'neutral' })}
        </div>
        ${renderButton({ id: 'ref-btn-new-entry', label: EDITOR_STRINGS.sidebar.newEntry, variant: 'secondary', size: 'sm' })}
      </div>
      <ul id="ref-entry-list" class="lp-entry-list">${sidebarItems}</ul>
    </aside>
    <section id="ref-editor-main" class="lp-editor-main" aria-label="Entry editor">
      ${mainContent}
    </section>
  </main>
  ${renderDialog({
    id: 'ref-publish-dialog',
    title: EDITOR_STRINGS.publishDialog.title,
    bodyHtml: publishDialogBody,
    footerHtml: `${renderButton({ id: 'ref-publish-cancel', label: EDITOR_STRINGS.publishDialog.cancel, variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } })} ${renderButton({ id: 'ref-publish-confirm', label: EDITOR_STRINGS.publishDialog.confirm, variant: 'primary' })}`,
  })}
  ${renderDialog({
    id: 'ref-delete-dialog',
    title: EDITOR_STRINGS.deleteDialog.title,
    bodyHtml: `<p>${escapeHtml(EDITOR_STRINGS.deleteDialog.body)}</p>`,
    footerHtml: `${renderButton({ id: 'ref-delete-cancel', label: EDITOR_STRINGS.deleteDialog.cancel, variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } })} ${renderButton({ id: 'ref-delete-confirm', label: EDITOR_STRINGS.deleteDialog.confirm, variant: 'danger', className: 'lp-btn-danger-confirm' })}`,
  })}
  ${renderDrawer({
    id: 'ref-structure-drawer',
    title: EDITOR_STRINGS.structureDrawer.title,
    bodyHtml: structureBody,
    position: 'right',
  })}
  ${renderDrawer({
    id: 'ref-history-drawer',
    title: EDITOR_STRINGS.historyDrawer.title,
    bodyHtml: `<p id="ref-history-empty" class="lp-field-help">${escapeHtml(EDITOR_STRINGS.historyDrawer.empty)}</p><ul id="ref-history-list" class="lp-entry-list"></ul>`,
    position: 'right',
  })}
  <script type="module" src="/assets/client/editor-page.js"${nonceAttr}></script>
</body>
</html>`;
}
