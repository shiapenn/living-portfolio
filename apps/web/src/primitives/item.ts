import { escapeHtml } from '../lib/html.js';
import { renderStatusDot, type StatusTone } from './chip.js';
import { renderIcon, type IconName } from './icons.js';
import { renderActionBar, type ActionBarProps } from './action-bar.js';

export interface ItemBodySegment {
  heading?: string;
  headingHref?: string;
  body: string;
  quote?: boolean;
}

export interface ItemMetaField {
  text: string;
  breakable?: boolean;
  strong?: boolean;
}

export interface ItemProps {
  id?: string;
  href?: string;
  leadingIcon?: IconName;
  title: string;
  /** 'entity' (default) clamps to 3 lines in lists; 'content' (questions, rules, claims) never clamps (A5). */
  titleVariant?: 'entity' | 'content';
  titleClamp2?: boolean;
  subtitle?: string;
  body?: string;
  segments?: ItemBodySegment[];
  /** Optional custom raw HTML body (e.g. Contradiction side-by-side claim blocks). */
  customBodyHtml?: string;
  meta?: string;
  metaFields?: ItemMetaField[];
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

  const titleCls = [
    'lp-item-title',
    props.titleVariant === 'content' ? 'lp-item-title-content' : '',
    props.titleClamp2 ? 'lp-item-title-clamp-2' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const titleHtml = `<div data-rel="title" data-purpose="title" class="${titleCls}"${props.titleVariant === 'content' ? ' data-title-variant="content"' : ''}>${leadingHtml}<span>${escapeHtml(props.title)}</span></div>`;
  const subtitleHtml = props.subtitle ? `<div data-purpose="meta" class="lp-item-subtitle">${escapeHtml(props.subtitle)}</div>` : '';

  let bodyHtml = '';
  if (props.customBodyHtml) {
    bodyHtml = `<div data-rel="itembody" class="lp-item-segments">${props.customBodyHtml}</div>`;
  } else if (props.segments && props.segments.length > 0) {
    bodyHtml = `<div data-rel="itembody" class="lp-item-segments">${props.segments
      .map((seg) => {
        const headingInner = seg.heading
          ? seg.headingHref
            ? `<a href="${escapeHtml(seg.headingHref)}" class="lp-item-link">${escapeHtml(seg.heading)}</a>`
            : escapeHtml(seg.heading)
          : '';
        const headingHtml = headingInner
          ? `<div data-rel="segment-label" data-purpose="label" class="lp-item-segment-heading">${headingInner}</div>`
          : '';
        const textHtml = seg.quote
          ? `<blockquote data-c="Text" data-variant="quote" data-purpose="value" data-rel="segment-text" class="lp-item-quote">${escapeHtml(seg.body)}</blockquote>`
          : `<div data-rel="segment-text" data-purpose="value" class="lp-item-body">${escapeHtml(seg.body)}</div>`;
        return `<div data-rel="segment" class="lp-item-segment">${headingHtml}${textHtml}</div>`;
      })
      .join('')}</div>`;
  } else if (props.body) {
    bodyHtml = `<div data-rel="itembody" data-purpose="value" class="lp-item-body">${escapeHtml(props.body)}</div>`;
  }

  const statusHtml = props.statusLabel
    ? `<div class="lp-item-status">${renderStatusDot({ label: props.statusLabel, tone: props.statusTone ?? 'neutral' })}${
        props.showChevron ? `<span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span>` : ''
      }</div>`
    : props.trailingValue
      ? `<div class="lp-item-status"><span data-purpose="value" class="lp-caption">${escapeHtml(props.trailingValue)}</span>${
          props.showChevron ? `<span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span>` : ''
        }</div>`
      : props.showChevron
        ? `<div class="lp-item-status lp-item-chevron-only"><span class="lp-item-chevron" aria-hidden="true">${renderIcon('chevron-right', 16)}</span></div>`
        : '';

  const metaHtml =
    props.metaFields && props.metaFields.length > 0
      ? `<div data-purpose="meta" class="lp-item-meta">${props.metaFields
          .filter((f) => f.text.trim().length > 0)
          .map(
            (f) =>
              `<span class="lp-item-meta-field${f.breakable ? ' lp-item-meta-break' : ''}${f.strong ? ' lp-item-meta-strong' : ''}">${escapeHtml(f.text)}</span>`
          )
          .join('')}</div>`
      : props.meta
        ? `<div data-purpose="meta" class="lp-item-meta"><span class="lp-item-meta-field">${escapeHtml(props.meta)}</span></div>`
        : '';
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

export type ListVariant = 'plain' | 'interactive' | 'definition';

export interface DefinitionRow {
  label: string;
  value?: string;
  valueHtml?: string;
}

export interface ListProps {
  id?: string;
  variant: ListVariant;
  itemsHtml?: string;
  definitionRows?: DefinitionRow[];
  empty?: boolean;
  className?: string;
  attributes?: string;
}

/**
 * Unified List primitive (D-L2, D-L3, WP-17.13 D5):
 * - plain: no hover/selected/pressed tint, no chevron; Item content and buttons sit flush on the column edge.
 * - interactive: rows that navigate or select; Item rect equals column, content inset, hover and selected tint.
 * - definition: semantic <dl> for detail screens (label above value <640px, 2-col >=640px, no per-row dividers).
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
  if (props.variant === 'definition' && props.definitionRows) {
    const rowsHtml = props.definitionRows
      .map((row) => {
        const val = row.valueHtml !== undefined ? row.valueHtml : escapeHtml(row.value ?? '');
        return `<div class="lp-list-def-row"><dt data-purpose="label" class="lp-list-def-label">${escapeHtml(row.label)}</dt><dd data-purpose="value" class="lp-list-def-value">${val}</dd></div>`;
      })
      .join('');
    return `<dl${idAttr} data-c="List" data-variant="definition" class="${escapeHtml(classes)}"${extra}>${rowsHtml}</dl>`;
  }
  return `<div${idAttr} data-c="List" data-variant="${props.variant}" class="${escapeHtml(classes)}"${extra}>${props.itemsHtml ?? ''}</div>`;
}

/**
 * Browser-safe Item renderer matching renderItem() anatomy (WP-18.10 V10/V11/K46).
 * Keeps all .lp-item-* markup strictly inside the Item primitive.
 */
export const ITEM_CLIENT_SCRIPT = `
var lpRenderItem = function (opts) {
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
  var hasActions = Boolean(opts.actionsHtml);
  var variantCls = opts.variant === 'review' ? 'lp-item-review' : '';
  var cls = ['lp-item', variantCls, opts.selected ? 'is-selected' : '', hasActions ? 'lp-item-has-actions' : '', opts.className || '']
    .filter(Boolean)
    .join(' ');
  var idAttr = opts.id ? ' id="' + esc(opts.id) + '"' : '';
  var extra = opts.attributes ? ' ' + opts.attributes : '';
  var titleHtml = '<div data-rel="title" data-purpose="title" class="lp-item-title"><span>' + esc(opts.title || '') + '</span></div>';
  var statusHtml = '';
  var chevronHtml = opts.showChevron ? '<span class="lp-item-chevron" aria-hidden="true"><svg class="lp-icon lp-icon-16" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></span>' : '';
  if (opts.statusLabel) {
    var tone = opts.statusTone || 'neutral';
    statusHtml = '<div class="lp-item-status"><span data-c="StatusLabel" data-purpose="status" class="lp-status-indicator"><span class="lp-status-dot lp-status-dot-' + esc(tone) + '" aria-hidden="true"></span><span class="lp-status-label">' + esc(opts.statusLabel) + '</span></span>' + chevronHtml + '</div>';
  } else if (opts.showChevron) {
    statusHtml = '<div class="lp-item-status lp-item-chevron-only">' + chevronHtml + '</div>';
  }
  var subtitleHtml = opts.subtitle ? '<div data-purpose="meta" class="lp-item-subtitle">' + esc(opts.subtitle) + '</div>' : '';
  var bodyHtml = '';
  if (opts.body) {
    bodyHtml += '<div data-rel="itembody" data-purpose="value" class="lp-item-body' + (opts.bodyClamp2 ? ' lp-item-body-clamp-2' : '') + '">' + esc(opts.body) + '</div>';
  }
  if (opts.customBodyHtml) {
    bodyHtml += '<div data-rel="itembody" class="lp-item-segments">' + opts.customBodyHtml + '</div>';
  }
  var metaHtml = opts.meta
    ? '<div data-purpose="meta" class="lp-item-meta"><span class="lp-item-meta-field">' + esc(opts.meta) + '</span></div>'
    : '';
  var actionsBlock = hasActions
    ? '<div data-rel="actions" class="lp-item-actions"><div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item">' + opts.actionsHtml + '</div></div>'
    : '';
  var contentInner = titleHtml + statusHtml + subtitleHtml + bodyHtml + metaHtml;
  var inner = hasActions ? '<div class="lp-item-content">' + contentInner + '</div>' + actionsBlock : contentInner;
  if (opts.href && !hasActions) {
    return '<a href="' + esc(opts.href) + '"' + idAttr + ' data-c="Item" data-rel="item" class="' + esc(cls) + '"' + extra + '>' + inner + '</a>';
  }
  return '<div' + idAttr + ' data-c="Item" data-rel="item" class="' + esc(cls) + '"' + extra + '>' + inner + '</div>';
};`;
