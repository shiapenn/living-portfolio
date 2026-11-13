import { escapeHtml } from '../lib/html.js';
import { renderIconButton } from '../primitives/index.js';

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
  bodyHtml: string;
  open?: boolean;
  className?: string;
}

export interface TabItem {
  id: string;
  label: string;
  panelHtml: string;
  active?: boolean;
}

export interface TabsProps {
  id: string;
  ariaLabel: string;
  tabs: TabItem[];
  className?: string;
}

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableProps {
  id?: string;
  caption: string;
  columns: TableColumn[];
  rows: Array<Record<string, string>>;
  emptyMessage?: string;
  className?: string;
}

export interface EmptyStateProps {
  id?: string;
  title: string;
  body: string;
  actionHtml?: string;
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
    icon: '×',
    variant: 'quiet',
    size: 'sm',
    dataAttrs: { 'lp-dialog-close': 'true' },
  });

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}"${hiddenAttr}>
  <div class="lp-dialog-panel">
    <header class="lp-dialog-header">
      <h2 id="${escapeHtml(titleId)}" class="lp-dialog-title">${escapeHtml(props.title)}</h2>
      ${closeBtn}
    </header>
    <div class="lp-dialog-body">${props.bodyHtml}</div>
    ${props.footerHtml ? `<footer class="lp-dialog-footer">${props.footerHtml}</footer>` : ''}
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
    icon: '×',
    variant: 'quiet',
    size: 'sm',
    dataAttrs: { 'lp-dialog-close': 'true' },
  });

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}"${hiddenAttr}>
  <div class="lp-drawer-panel">
    <header class="lp-dialog-header">
      <h2 id="${escapeHtml(titleId)}" class="lp-dialog-title">${escapeHtml(props.title)}</h2>
      ${closeBtn}
    </header>
    <div class="lp-drawer-body">${props.bodyHtml}</div>
  </div>
</div>`;
}

/**
 * Renders a native <details> Disclosure with optional one-line summary metadata.
 */
export function renderDisclosure(props: DisclosureProps): string {
  const classes = ['lp-disclosure', props.className].filter(Boolean).join(' ');
  const openAttr = props.open ? ' open' : '';
  return `<details id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}"${openAttr}>
  <summary class="lp-disclosure-summary">
    <span class="lp-disclosure-label">${escapeHtml(props.summary)}</span>
    ${props.summaryMeta ? `<span class="lp-disclosure-meta">${escapeHtml(props.summaryMeta)}</span>` : ''}
  </summary>
  <div class="lp-disclosure-body">${props.bodyHtml}</div>
</details>`;
}

/**
 * Renders an accessible Tabs container with roving tabindex and hidden inactive panels.
 */
export function renderTabs(props: TabsProps): string {
  const activeIdx = Math.max(
    0,
    props.tabs.findIndex((t) => t.active)
  );
  const tabButtons = props.tabs
    .map((tab, idx) => {
      const isSelected = idx === activeIdx;
      const tabId = `${props.id}-tab-${tab.id}`;
      const panelId = `${props.id}-panel-${tab.id}`;
      return `<button type="button" role="tab" id="${escapeHtml(tabId)}" class="lp-tab" aria-selected="${isSelected ? 'true' : 'false'}" aria-controls="${escapeHtml(panelId)}" tabindex="${isSelected ? '0' : '-1'}">${escapeHtml(tab.label)}</button>`;
    })
    .join('');

  const panels = props.tabs
    .map((tab, idx) => {
      const isSelected = idx === activeIdx;
      const tabId = `${props.id}-tab-${tab.id}`;
      const panelId = `${props.id}-panel-${tab.id}`;
      return `<div role="tabpanel" id="${escapeHtml(panelId)}" class="lp-tab-panel" aria-labelledby="${escapeHtml(tabId)}"${isSelected ? '' : ' hidden'}>${tab.panelHtml}</div>`;
    })
    .join('');

  const classes = ['lp-tabs', props.className].filter(Boolean).join(' ');
  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}">
  <div class="lp-tablist" role="tablist" aria-label="${escapeHtml(props.ariaLabel)}">${tabButtons}</div>
  ${panels}
</div>`;
}

/**
 * Renders a semantic Table with caption and scoped column headers.
 */
export function renderTable(props: TableProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-table-wrap', props.className].filter(Boolean).join(' ');
  const headCells = props.columns.map((c) => `<th scope="col">${escapeHtml(c.label)}</th>`).join('');
  const bodyRows =
    props.rows.length > 0
      ? props.rows
          .map(
            (row) =>
              `<tr>${props.columns.map((c) => `<td>${escapeHtml(row[c.key] ?? '')}</td>`).join('')}</tr>`
          )
          .join('')
      : `<tr><td colspan="${Math.max(1, props.columns.length)}">${escapeHtml(props.emptyMessage ?? 'No items.')}</td></tr>`;

  return `<div class="${escapeHtml(classes)}"${idAttr}>
  <table class="lp-table">
    <caption>${escapeHtml(props.caption)}</caption>
    <thead><tr>${headCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</div>`;
}

/**
 * Renders a centred EmptyState block with optional primary action.
 */
export function renderEmptyState(props: EmptyStateProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-empty-state', props.className].filter(Boolean).join(' ');
  return `<div class="${escapeHtml(classes)}"${idAttr}>
  <h3 class="lp-empty-title">${escapeHtml(props.title)}</h3>
  <p class="lp-empty-body">${escapeHtml(props.body)}</p>
  ${props.actionHtml ? `<div class="lp-empty-action">${props.actionHtml}</div>` : ''}
</div>`;
}
