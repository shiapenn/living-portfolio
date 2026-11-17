import { escapeHtml } from '../lib/html.js';
import { renderBackLink } from './back-link.js';

export interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actionHtml?: string;
  id?: string;
  className?: string;
}

/**
 * Unified PageHeader primitive (D-COMP #2):
 * - Optional back link (chevron-left + text) on its own row above the title (8px gap to title)
 * - h1 (24px)
 * - Optional one-line description below it (14px grey, 8px gap from title)
 * - Page-level primary action right-aligned on the title row from 640px up,
 *   and below the description at full width under 640px
 * - 24px gap below header to page content
 */
export function renderPageHeader(props: PageHeaderProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-page-header', 'lp-page-header-dcomp', props.className].filter(Boolean).join(' ');

  const backHtml = props.backHref
    ? renderBackLink({ href: props.backHref, destination: props.backLabel ?? 'previous page' })
    : '';

  const descHtml = props.description
    ? `<p class="lp-page-description">${escapeHtml(props.description)}</p>`
    : '';

  const actionHtml = props.actionHtml
    ? `<div class="lp-page-header-action">${props.actionHtml}</div>`
    : '';

  return `<header${idAttr} class="${escapeHtml(classes)}">
  ${backHtml}
  <h1 class="lp-page-header-title">${escapeHtml(props.title)}</h1>
  ${descHtml}
  ${actionHtml}
</header>`;
}
