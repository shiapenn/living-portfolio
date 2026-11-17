import { escapeHtml } from '../lib/html.js';
import { renderIcon, renderIconButton } from '../primitives/index.js';

export interface DialogProps {
  id: string;
  title: string;
  bodyHtml: string;
  footerHtml?: string;
  open?: boolean;
  className?: string;
}

export interface DrawerProps {
  id: string;
  title: string;
  bodyHtml: string;
  position?: 'left' | 'right';
  open?: boolean;
  className?: string;
}

export interface DisclosureProps {
  id: string;
  summary: string;
  summaryMeta?: string;
  summaryMetaId?: string;
  bodyHtml: string;
  open?: boolean;
  className?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  danger?: boolean;
}

export interface MenuProps {
  id: string;
  triggerLabel: string;
  items: MenuItem[];
  open?: boolean;
  className?: string;
}

export interface EmptyStateGuideStep {
  title: string;
  body: string;
}

export interface EmptyStateProps {
  id?: string;
  title: string;
  headingTag?: 'h1' | 'h2' | 'h3';
  body: string;
  actionHtml?: string;
  guideSteps?: EmptyStateGuideStep[];
  /** Optional ghost dismiss control placed at the top right of the container (D-FOUND-1). */
  dismissHtml?: string;
  hidden?: boolean;
  className?: string;
}

/**
 * Renders an accessible modal Dialog container with focus-trap and close hooks.
 */
export function renderDialog(props: DialogProps): string {
  const titleId = `${props.id}-title`;
  const hiddenAttr = props.open ? '' : ' hidden';
  const classes = ['lp-modal-backdrop', props.className].filter(Boolean).join(' ');
  const closeBtn = renderIconButton({
    ariaLabel: `Close ${props.title}`,
    icon: 'x',
    iconSize: 16,
    variant: 'quiet',
    size: 'sm',
    dataAttrs: { 'lp-dialog-close': 'true' },
  });

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}"${hiddenAttr}>
  <div class="lp-dialog-panel">
    <div class="lp-dialog-header">
      <h2 id="${escapeHtml(titleId)}" class="lp-dialog-title">${escapeHtml(props.title)}</h2>
      ${closeBtn}
    </div>
    <div class="lp-dialog-body">${props.bodyHtml}</div>
    ${props.footerHtml ? `<div class="lp-dialog-footer">${props.footerHtml}</div>` : ''}
  </div>
</div>`;
}

/**
 * Renders an accessible side Drawer container with role="dialog" and aria-modal="true".
 */
export function renderDrawer(props: DrawerProps): string {
  const titleId = `${props.id}-title`;
  const pos = props.position ?? 'right';
  const hiddenAttr = props.open ? '' : ' hidden';
  const classes = ['lp-modal-backdrop', 'lp-drawer-backdrop', `lp-drawer-${pos}`, props.className]
    .filter(Boolean)
    .join(' ');
  const closeBtn = renderIconButton({
    ariaLabel: `Close ${props.title}`,
    icon: 'x',
    iconSize: 16,
    variant: 'quiet',
    size: 'sm',
    dataAttrs: { 'lp-dialog-close': 'true' },
  });

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}"${hiddenAttr}>
  <div class="lp-drawer-panel">
    <div class="lp-dialog-header">
      <h2 id="${escapeHtml(titleId)}" class="lp-dialog-title">${escapeHtml(props.title)}</h2>
      ${closeBtn}
    </div>
    <div class="lp-drawer-body">${props.bodyHtml}</div>
  </div>
</div>`;
}

/**
 * Renders a native <details> Disclosure with rotating 16px chevron and hairline divider (D-FOUND-1, D-FOUND-6).
 */
export function renderDisclosure(props: DisclosureProps): string {
  const classes = ['lp-disclosure', props.className].filter(Boolean).join(' ');
  const openAttr = props.open ? ' open' : '';
  const metaIdAttr = props.summaryMetaId ? ` id="${escapeHtml(props.summaryMetaId)}"` : '';
  const chevron = renderIcon({ name: 'chevron-down', size: 16, className: 'lp-disclosure-chevron' });
  return `<details id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}"${openAttr}>
  <summary class="lp-disclosure-summary">
    <span class="lp-disclosure-label">${escapeHtml(props.summary)}</span>
    <span class="lp-disclosure-summary-end">
      ${props.summaryMeta ? `<span class="lp-disclosure-meta"${metaIdAttr}>${escapeHtml(props.summaryMeta)}</span>` : ''}
      ${chevron}
    </span>
  </summary>
  <div class="lp-disclosure-body">${props.bodyHtml}</div>
</details>`;
}

/**
 * Renders a Menu popover with a trigger button, standard items, and a separated danger item last (D-FOUND-1, D-FOUND-2).
 */
export function renderMenu(props: MenuProps): string {
  const menuId = `${props.id}-popover`;
  const open = Boolean(props.open);
  const chevron = renderIcon({ name: 'chevron-down', size: 16, className: 'lp-disclosure-chevron' });
  const itemsHtml = props.items
    .map((item, idx) => {
      const separator = item.danger ? '<hr class="lp-menu-separator" role="separator" />' : '';
      const cls = item.danger ? 'lp-btn lp-btn-danger lp-btn-sm lp-menu-item lp-menu-item-danger' : 'lp-btn lp-btn-quiet lp-btn-sm lp-menu-item';
      return `${separator}<button type="button" role="menuitem" id="${escapeHtml(item.id)}" class="${cls}" tabindex="${idx === 0 ? '0' : '-1'}">${escapeHtml(item.label)}</button>`;
    })
    .join('');
  return `<div id="${escapeHtml(props.id)}" class="lp-menu-wrap ${escapeHtml(props.className ?? '')}">
  <button type="button" id="${escapeHtml(props.id)}-trigger" class="lp-btn lp-btn-secondary lp-btn-sm" aria-haspopup="menu" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${escapeHtml(menuId)}">${escapeHtml(props.triggerLabel)} ${chevron}</button>
  <div id="${escapeHtml(menuId)}" role="menu" aria-label="${escapeHtml(props.triggerLabel)}" class="lp-popover-menu"${open ? '' : ' hidden'}>${itemsHtml}</div>
</div>`;
}

/**
 * Renders an EmptyState block with a single primary action and optional embedded first-run guide (D-FOUND-6).
 */
export function renderEmptyState(props: EmptyStateProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-empty-state', props.className].filter(Boolean).join(' ');
  const guideHtml =
    props.guideSteps && props.guideSteps.length > 0
      ? `<div class="lp-empty-guide"><ol class="lp-empty-guide-steps">${props.guideSteps
          .map((step) => {
            const cleanTitle = step.title.replace(/^\d+\.\s*/, '');
            return `<li><strong>${escapeHtml(cleanTitle)}</strong> — ${escapeHtml(step.body)}</li>`;
          })
          .join('')}</ol></div>`
      : '';

  const hiddenAttr = props.hidden ? ' hidden' : '';
  const headingTag = props.headingTag ?? 'h3';
  return `<div class="${escapeHtml(classes)}"${idAttr}${hiddenAttr}>
  ${props.dismissHtml ? `<div class="lp-empty-dismiss">${props.dismissHtml}</div>` : ''}
  <${headingTag} class="lp-empty-title">${escapeHtml(props.title)}</${headingTag}>
  <p class="lp-empty-body">${escapeHtml(props.body)}</p>
  ${guideHtml}
  ${props.actionHtml ? `<div class="lp-empty-action">${props.actionHtml}</div>` : ''}
</div>`;
}
