import { escapeHtml } from '../../../lib/html.js';
import {
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

export function renderEditorDialogsAndDrawers(): string {
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
