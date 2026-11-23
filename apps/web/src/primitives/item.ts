import { escapeHtml } from '../lib/html.js';
import { renderStatusDot, type StatusTone } from './chip.js';
import { renderIcon, type IconName } from './icons.js';
import { renderActionBar, type ActionBarProps } from './action-bar.js';

export interface ItemBodySegment {
  heading?: string;
  body: string;
}

export interface ItemProps {
  id?: string;
  href?: string;
  leadingIcon?: IconName;
  title: string;
  subtitle?: string;
  body?: string;
  segments?: ItemBodySegment[];
  meta?: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  trailingValue?: string;
  showChevron?: boolean;
  actions?: ActionBarProps;
  selected?: boolean;
  className?: string;
  attributes?: string;
}

/**
 * Unified Item primitive (D-COMP #3):
 * Slots in order: leading icon (optional), title (14, 600), subtitle (12 grey),
 * body (14; or segments with 8px between heading/body and 16px between segments),
 * meta (date/time, 12 grey), status (dot + text), actions (ActionBar, max 2).
 * >= 640px: content left; status + chevron in trailing slot aligned to title line; meta under subtitle; actions below body.
 * < 640px: every slot stacks in order: title, subtitle, body, status, meta, actions.
 * Whole row opens on click unless it holds actions.
 */
export function renderItem(props: ItemProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const hasActions = Boolean(props.actions && (props.actions.primary || props.actions.secondary || props.actions.textAction));
  const classes = ['lp-item', props.selected ? 'is-selected' : '', hasActions ? 'lp-item-has-actions' : '', props.className]
    .filter(Boolean)
    .join(' ');
  const extra = props.attributes ? ` ${props.attributes}` : '';

  const leadingHtml = props.leadingIcon
    ? `<span class="lp-item-leading" aria-hidden="true">${renderIcon(props.leadingIcon, 16)}</span>`
    : '';

  const titleHtml = `<div data-rel="title" class="lp-item-title">${leadingHtml}<span>${escapeHtml(props.title)}</span></div>`;
  const subtitleHtml = props.subtitle ? `<div class="lp-item-subtitle">${escapeHtml(props.subtitle)}</div>` : '';

  let bodyHtml = '';
  if (props.segments && props.segments.length > 0) {
    bodyHtml = `<div data-rel="itembody" class="lp-item-segments">${props.segments
      .map(
        (seg) => `<div data-rel="segment" class="lp-item-segment">
          ${seg.heading ? `<div data-rel="segment-label" class="lp-item-segment-heading">${escapeHtml(seg.heading)}</div>` : ''}
          <div data-rel="segment-text" class="lp-item-body">${escapeHtml(seg.body)}</div>
        </div>`
      )
      .join('')}</div>`;
  } else if (props.body) {
    bodyHtml = `<div data-rel="itembody" class="lp-item-body">${escapeHtml(props.body)}</div>`;
  }

  const statusHtml = props.statusLabel
    ? `<div class="lp-item-status">${renderStatusDot({ label: props.statusLabel, tone: props.statusTone ?? 'neutral' })}${
        props.showChevron ? `<span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span>` : ''
      }</div>`
    : props.trailingValue
      ? `<div class="lp-item-status"><span class="lp-body">${escapeHtml(props.trailingValue)}</span>${
          props.showChevron ? `<span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span>` : ''
        }</div>`
      : props.showChevron
        ? `<div class="lp-item-status"><span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span></div>`
        : '';

  const metaHtml = props.meta ? `<div class="lp-item-meta">${escapeHtml(props.meta)}</div>` : '';
  const actionsHtml = hasActions && props.actions ? `<div data-rel="actions" class="lp-item-actions">${renderActionBar(props.actions)}</div>` : '';

  const contentInner = `${titleHtml}${statusHtml}${subtitleHtml}${bodyHtml}${metaHtml}`;
  const inner = hasActions
    ? `<div class="lp-item-content">${contentInner}</div>${actionsHtml}`
    : `${contentInner}${actionsHtml}`;

  if (props.href && !hasActions) {
    return `<a href="${escapeHtml(props.href)}"${idAttr} data-c="Item" data-rel="item" class="${escapeHtml(classes)}"${extra}>${inner}</a>`;
  }
  return `<div${idAttr} data-c="Item" data-rel="item" class="${escapeHtml(classes)}"${extra}>${inner}</div>`;
}

export type ListVariant = 'plain' | 'interactive';

export interface ListProps {
  id?: string;
  variant: ListVariant;
  itemsHtml: string;
  empty?: boolean;
  className?: string;
  attributes?: string;
}

/**
 * Unified List primitive (D-L2, D-L3):
 * - plain: no hover/selected/pressed tint, no chevron; Item content and buttons sit flush on the column edge;
 *   absorbs first/last Item vertical padding (ink-measured).
 * - interactive: rows that navigate or select; Item rect equals column, content inset, hover and selected tint;
 *   keeps top/bottom padding for tint clearance.
 */
export function renderList(props: ListProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = [
    'lp-list',
    `lp-list-${props.variant}`,
    props.empty ? 'lp-is-empty' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const extra = props.attributes ? ` ${props.attributes}` : '';
  return `<div${idAttr} data-c="List" data-variant="${props.variant}" class="${escapeHtml(classes)}"${extra}>${props.itemsHtml}</div>`;
}
