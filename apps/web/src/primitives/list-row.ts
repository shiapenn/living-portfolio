import { escapeHtml } from '../lib/html.js';
import { renderStatusDot, type StatusTone } from './chip.js';

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
 * Unified List row primitive (D-LAYOUT #3):
 * primary text, optional one-line secondary text, right-aligned trailing slot for state label (dot + text),
 * hairline separators, whole row is the click target, hover tint, no per-row buttons.
 */
export function renderListRow(props: ListRowProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-list-row', props.selected ? 'is-selected' : '', props.className].filter(Boolean).join(' ');
  const extra = props.attributes ? ` ${props.attributes}` : '';

  const trailing = props.trailingHtml
    ? `<div class="lp-list-row-trailing">${props.trailingHtml}</div>`
    : props.stateLabel
      ? `<div class="lp-list-row-trailing">${renderStatusDot({ label: props.stateLabel, tone: props.stateTone ?? 'neutral' })}</div>`
      : '';

  const inner = `<div class="lp-list-row-main"><div class="lp-list-row-primary">${escapeHtml(props.primary)}</div>${
    props.secondary ? `<div class="lp-list-row-secondary">${escapeHtml(props.secondary)}</div>` : ''
  }</div>${trailing}`;

  if (props.href) {
    return `<a href="${escapeHtml(props.href)}"${idAttr} class="${escapeHtml(classes)}"${extra}>${inner}</a>`;
  }
  return `<div${idAttr} class="${escapeHtml(classes)}"${extra}>${inner}</div>`;
}
