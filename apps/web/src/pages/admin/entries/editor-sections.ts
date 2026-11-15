import { escapeHtml } from '../../../lib/html.js';
import {
  renderBadge,
  renderButton,
  renderField,
  renderIconButton,
} from '../../../primitives/index.js';
import {
  renderDialog,
  renderDrawer,
  renderTabs,
} from '../../../components/index.js';
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';

export function renderSlimAdminHeader(theme: 'light' | 'dark'): string {
  const toggleIcon = theme === 'dark' ? 'sun' : 'moon';
  const toggleLabel = theme === 'dark' ? EDITOR_STRINGS.nav.toLight : EDITOR_STRINGS.nav.toDark;

  return `<header class="lp-admin-header" role="banner">
  <a href="/admin" class="lp-admin-header-brand">${escapeHtml(EDITOR_STRINGS.brand)}</a>
  <nav class="lp-admin-header-nav" aria-label="${escapeHtml(EDITOR_STRINGS.nav.label)}">
    <a href="/admin" class="lp-admin-header-link" aria-current="page">${escapeHtml(EDITOR_STRINGS.nav.entries)}</a>
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
        <a href="/admin" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" aria-current="page">${escapeHtml(EDITOR_STRINGS.nav.entries)}</a>
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

export function renderDraftAndOfflineBanners(): string {
  return `<div id="admin-offline-banner" class="lp-notice lp-notice-warn" hidden>
  <div class="lp-notice-main">
    <div class="lp-notice-content">
      <span class="lp-notice-text">${escapeHtml(EDITOR_STRINGS.safety.offlineBanner)}</span>
    </div>
  </div>
</div>
<div id="draft-restore-notice" class="lp-notice lp-notice-info" hidden>
  <div class="lp-notice-main">
    <div class="lp-notice-content">
      <span class="lp-notice-text">${escapeHtml(EDITOR_STRINGS.safety.draftRestored)}</span>
      <button type="button" id="btn-discard-draft-buffer" class="lp-notice-action-link">${escapeHtml(EDITOR_STRINGS.safety.draftDiscard)}</button>
    </div>
  </div>
</div>`;
}

export interface WorkspaceEscalationItem {
  id: string;
  question: string;
  draft?: string;
}

export function renderWorkspaceSafetyControls(options: {
  answeringEnabled: boolean;
  escalations: WorkspaceEscalationItem[];
}): string {
  const enabled = options.answeringEnabled;
  const killLabel = enabled
    ? EDITOR_STRINGS.safety.killSwitchPauseBtn
    : EDITOR_STRINGS.safety.killSwitchResumeBtn;
  const killStateLabel = enabled
    ? EDITOR_STRINGS.safety.killSwitchActive
    : EDITOR_STRINGS.safety.killSwitchPaused;
  const escCount = options.escalations.length;
  const escItemsHtml = options.escalations
    .map(
      (esc) => `<li class="lp-escalation-item" data-escalation-id="${escapeHtml(esc.id)}">
  <p class="lp-escalation-question">${escapeHtml(esc.question)}</p>
  <div class="lp-escalation-actions">
    <button type="button" class="lp-btn lp-btn-primary lp-btn-sm" data-esc-approve="${escapeHtml(esc.id)}">${escapeHtml(EDITOR_STRINGS.safety.approveBtn)}</button>
    <button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-esc-reject="${escapeHtml(esc.id)}">${escapeHtml(EDITOR_STRINGS.safety.rejectBtn)}</button>
  </div>
</li>`
    )
    .join('');

  return `<section class="lp-workspace-safety-bar" aria-label="Workspace safety controls">
  <div class="lp-killswitch-row">
    <div class="lp-killswitch-copy">
      <span class="lp-type-body-sm">${escapeHtml(EDITOR_STRINGS.safety.killSwitchTitle)}</span>
      ${renderBadge({
        id: 'ref-killswitch-badge',
        label: killStateLabel,
        tone: enabled ? 'ok' : 'warn',
      })}
    </div>
    <button type="button" id="btn-killswitch" class="lp-btn lp-btn-secondary lp-btn-sm" aria-pressed="${enabled ? 'true' : 'false'}">${escapeHtml(killLabel)}</button>
  </div>
  <div id="ref-escalations-card" class="lp-escalations-card">
    <div class="lp-escalations-header">
      <h2 class="lp-escalations-title">${escapeHtml(EDITOR_STRINGS.safety.escalationsTitle)}</h2>
      ${renderBadge({ id: 'ref-escalations-count', label: String(escCount), tone: escCount > 0 ? 'warn' : 'neutral' })}
    </div>
    <p id="ref-escalations-empty" class="lp-field-help"${escCount > 0 ? ' hidden' : ''}>${escapeHtml(EDITOR_STRINGS.safety.escalationsEmpty)}</p>
    <ul id="ref-escalations-list" class="lp-escalation-list"${escCount === 0 ? ' hidden' : ''}>${escItemsHtml}</ul>
  </div>
</section>`;
}

export function renderEditorDialogsAndDrawers(): string {
  const publishDialogBody = `<div class="lp-publish-steps">
  <section class="lp-publish-step">
    <h3>1. ${escapeHtml(EDITOR_STRINGS.publishDialog.checkTitle)}</h3>
    <p id="ref-publish-dialog-status" role="status" aria-live="polite">${escapeHtml(EDITOR_STRINGS.publishDialog.clean)}</p>
    <ul id="ref-publish-matches" class="lp-publish-matches" hidden></ul>
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

  return `${renderDialog({
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
  })}`;
}
