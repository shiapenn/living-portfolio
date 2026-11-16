import { escapeHtml } from '../lib/html.js';
import { type StatusTone } from './chip.js';
import { renderItem } from './item.js';

export interface ListRowProps {
  id?: string;
  href?: string;
  primary: string;
  secondary?: string;
  stateLabel?: string;
  stateTone?: StatusTone;
  trailingHtml?: string;
  selected?: boolean;
  className?: string;
  attributes?: string;
}

/**
 * ListRow delegates to Item (D-COMP #3), preserving trailingHtml until C2 migrates callers.
 */
export function renderListRow(props: ListRowProps): string {
  if (props.trailingHtml) {
    const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
    const classes = ['lp-list-row', props.selected ? 'is-selected' : '', props.className].filter(Boolean).join(' ');
    const extra = props.attributes ? ` ${props.attributes}` : '';
    const inner = `<div class="lp-list-row-main"><div class="lp-list-row-primary">${escapeHtml(props.primary)}</div>${
      props.secondary ? `<div class="lp-list-row-secondary">${escapeHtml(props.secondary)}</div>` : ''
    }</div><div class="lp-list-row-trailing">${props.trailingHtml}</div>`;
    return props.href
      ? `<a href="${escapeHtml(props.href)}"${idAttr} class="${escapeHtml(classes)}"${extra}>${inner}</a>`
      : `<div${idAttr} class="${escapeHtml(classes)}"${extra}>${inner}</div>`;
  }

  return renderItem({
    id: props.id,
    href: props.href,
    title: props.primary,
    subtitle: props.secondary,
    statusLabel: props.stateLabel,
    statusTone: props.stateTone,
    showChevron: Boolean(props.href),
    selected: props.selected,
    className: props.className,
    attributes: props.attributes,
  });
}
