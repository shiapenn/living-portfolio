import { escapeHtml } from '../lib/html.js';

export interface FormSectionProps {
  title: string;
  description?: string;
  fieldsHtml: string;
  actionBarHtml?: string;
  id?: string;
  className?: string;
}

export interface SubsectionProps {
  title: string;
  intro?: string;
  bodyHtml: string;
  actionBarHtml?: string;
  id?: string;
  className?: string;
}

/**
 * Unified Subsection primitive (D-G #10):
 * - Title (14px/600 item-title), 8px to intro, 16px to first Item/Field, 24px between subsections, 24px above ActionBar
 */
export function renderSubsection(props: SubsectionProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-subsection', 'lp-stack', 'lp-gap-group', props.className].filter(Boolean).join(' ');
  const introHtml = props.intro
    ? `<p data-rel="subsection-intro" class="lp-subsection-intro lp-description">${escapeHtml(props.intro)}</p>`
    : '';
  const headerHtml = introHtml
    ? `<div class="lp-stack lp-gap-tight"><h3 data-rel="subsection-title" class="lp-subsection-title">${escapeHtml(props.title)}</h3>${introHtml}</div>`
    : `<h3 data-rel="subsection-title" class="lp-subsection-title">${escapeHtml(props.title)}</h3>`;
  const actionHtml = props.actionBarHtml ?? '';
  return `<div${idAttr} data-c="Subsection" data-rel="subsection" class="${escapeHtml(classes)}">
  <div class="lp-stack lp-gap-related">
    ${headerHtml}
    ${props.bodyHtml}
  </div>
  ${actionHtml}
</div>`;
}

/**
 * Unified FormSection primitive (D-COMP #9, D-G #10):
 * - Heading (16px, 600)
 * - Optional one-line description (8px below heading)
 * - Fields (16px to first field, 16px between fields)
 * - 40px between sections, 24px above ActionBar
 */
export function renderFormSection(props: FormSectionProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-form-section', props.className].filter(Boolean).join(' ');
  const descHtml = props.description
    ? `<p data-rel="section-intro" class="lp-form-section-desc">${escapeHtml(props.description)}</p>`
    : '';
  const actionHtml = props.actionBarHtml ?? '';

  const headerHtml = descHtml
    ? `<div class="lp-stack lp-gap-8"><h2 data-rel="section-title" class="lp-form-section-title">${escapeHtml(props.title)}</h2>${descHtml}</div>`
    : `<h2 data-rel="section-title" class="lp-form-section-title">${escapeHtml(props.title)}</h2>`;

  return `<section${idAttr} data-c="FormSection" data-rel="section" class="${escapeHtml(classes)} lp-stack lp-gap-group">
  <div class="lp-stack lp-gap-related">
    ${headerHtml}
    <div class="lp-stack lp-gap-related">${props.fieldsHtml}</div>
  </div>
  ${actionHtml}
</section>`;
}
