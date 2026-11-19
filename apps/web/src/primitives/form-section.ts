import { escapeHtml } from '../lib/html.js';

export interface FormSectionProps {
  title: string;
  description?: string;
  fieldsHtml: string;
  actionBarHtml?: string;
  id?: string;
  className?: string;
}

/**
 * Unified FormSection primitive (D-COMP #9):
 * - Heading (16px, 600)
 * - Optional one-line description (8px below heading)
 * - Fields (16px to first field, 16px between fields)
 * - 40px between sections, 24px above ActionBar
 */
export function renderFormSection(props: FormSectionProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-form-section', props.className].filter(Boolean).join(' ');
  const descHtml = props.description
    ? `<p class="lp-form-section-desc">${escapeHtml(props.description)}</p>`
    : '';
  const actionHtml = props.actionBarHtml ?? '';

  const headerHtml = descHtml
    ? `<div class="lp-stack lp-gap-8"><h2 class="lp-form-section-title">${escapeHtml(props.title)}</h2>${descHtml}</div>`
    : `<h2 class="lp-form-section-title">${escapeHtml(props.title)}</h2>`;

  return `<section${idAttr} class="${escapeHtml(classes)} lp-stack lp-gap-group">
  <div class="lp-stack lp-gap-related">
    ${headerHtml}
    <div class="lp-stack lp-gap-related">${props.fieldsHtml}</div>
  </div>
  ${actionHtml}
</section>`;
}
