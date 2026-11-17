import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface BackLinkProps {
  href: string;
  destination: string;
  id?: string;
  className?: string;
}

/**
 * Unified BackLink primitive (D-SYS #5):
 * chevron-left icon + visible text "Back", left-aligned, accessible name "Back to <destination>".
 */
export function renderBackLink(props: BackLinkProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-back-link', props.className].filter(Boolean).join(' ');
  const dest = props.destination.replace(/^Back to\s+/i, '').trim() || 'previous page';
  const ariaLabel = `Back to ${dest}`;
  return `<a href="${escapeHtml(props.href)}"${idAttr} class="${escapeHtml(classes)}" aria-label="${escapeHtml(ariaLabel)}">${renderIcon('chevron-left', 16)}<span>Back</span></a>`;
}
