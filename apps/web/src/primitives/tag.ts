import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface TagProps {
  id?: string;
  label: string;
  category?: string;
  removable?: boolean;
  removeAction?: string;
  removeValue?: string;
  className?: string;
}

/**
 * Themed Tag chip (D-FINAL #18, D-G #14):
 * 28px high, caption role (12px/400), L2 fill, 160ms enter animation,
 * symmetric padding (8px L/R without remove; 8px L / 4px R with 20px remove icon inside 36px hit area).
 */
export function renderTag(props: TagProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const hasRemove = Boolean(props.removable || props.removeAction);
  const classes = ['lp-tag', hasRemove ? 'lp-tag-removable' : '', props.className].filter(Boolean).join(' ');
  const text = props.category ? `${props.category}: ${props.label}` : props.label;
  const removeAttrs = [
    props.removeAction ? `data-tag-remove="${escapeHtml(props.removeAction)}"` : '',
    props.removeValue ? `data-tag-value="${escapeHtml(props.removeValue)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const removeBtn = hasRemove
    ? `<button type="button" class="lp-tag-remove" aria-label="Remove tag ${escapeHtml(text)}" title="Remove ${escapeHtml(text)}" ${removeAttrs}>${renderIcon('x', 16)}</button>`
    : '';
  return `<span${idAttr} data-c="Tag" class="${escapeHtml(classes)}"><span class="lp-tag-label">${escapeHtml(text)}</span>${removeBtn}</span>`;
}
