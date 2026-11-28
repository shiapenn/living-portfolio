import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface BackLinkProps {
  href: string;
  destination: string;
  label?: string;
  id?: string;
  className?: string;
  dataAttrs?: Record<string, string>;
}

/**
 * Unified BackLink primitive (D-SYS #5):
 * chevron-left icon + visible text "Back" (or custom label), left-aligned, accessible name "Back to <destination>".
 */
export function renderBackLink(props: BackLinkProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-back-link', props.className].filter(Boolean).join(' ');
  const dest = props.destination.replace(/^Back to\s+/i, '').trim() || 'previous page';
  const ariaLabel = `Back to ${dest}`;
  const visibleLabel = props.label ?? 'Back';
  const dataStr = props.dataAttrs
    ? Object.entries(props.dataAttrs)
        .map(([k, v]) => ` data-${escapeHtml(k)}="${escapeHtml(v)}"`)
        .join('')
    : '';
  return `<a href="${escapeHtml(props.href)}"${idAttr} data-c="BackLink" class="${escapeHtml(classes)}" aria-label="${escapeHtml(ariaLabel)}"${dataStr}>${renderIcon('chevron-left', 16)}<span>${escapeHtml(visibleLabel)}</span></a>`;
}
