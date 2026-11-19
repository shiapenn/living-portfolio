import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface TagProps {
  id?: string;
  label: string;
  category?: string;
  removeAction?: string;
  removeValue?: string;
  className?: string;
}

/**
 * Themed Tag chip (D-FINAL #18):
 * 28px high, caption role (12px/400), L2 fill, 160ms enter animation,
 * remove icon button with 36px hit area.
 */
export function renderTag(props: TagProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-tag', props.className].filter(Boolean).join(' ');
  const text = props.category ? `${props.category}: ${props.label}` : props.label;
  const removeAttrs = [
    props.removeAction ? `data-tag-remove="${escapeHtml(props.removeAction)}"` : '',
    props.removeValue ? `data-tag-value="${escapeHtml(props.removeValue)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<span${idAttr} class="${escapeHtml(classes)}"><span class="lp-tag-label">${escapeHtml(text)}</span><button type="button" class="lp-tag-remove" aria-label="Remove tag ${escapeHtml(text)}" title="Remove ${escapeHtml(text)}" ${removeAttrs}>${renderIcon('x', 16)}</button></span>`;
}
