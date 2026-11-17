import { escapeHtml } from '../lib/html.js';

export interface SectionHeaderProps {
  title: string;
  actionHtml?: string;
  id?: string;
  className?: string;
  headingTag?: 'h2' | 'h3';
}

/**
 * Unified SectionHeader primitive (D-SYS #13):
 * Heading (16px, 600) with optional trailing icon button vertically centred on the heading line.
 */
export function renderSectionHeader(props: SectionHeaderProps): string {
  const tag = props.headingTag ?? 'h2';
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-section-header', props.className].filter(Boolean).join(' ');
  const action = props.actionHtml ? `<div class="lp-section-header-action">${props.actionHtml}</div>` : '';
  return `<div${idAttr} class="${escapeHtml(classes)}"><${tag} class="lp-section-header-title">${escapeHtml(props.title)}</${tag}>${action}</div>`;
}
