import { escapeHtml } from '../lib/html.js';
import { renderSectionHeader } from './section-header.js';

export interface FormSectionProps {
  title: string;
  /** Optional consequence note rendered directly above ActionBar (S2 gap inside action group; S4 above group). */
  consequence?: string;
  fieldsHtml: string;
  actionBarHtml?: string;
  /** Optional section-local feedback (Notice, StatusLine, or Credential) rendered directly below ActionBar (S3 gap, ADR-025). */
  feedbackHtml?: string;
  headerId?: string;
  headerActionHtml?: string;
  id?: string;
  className?: string;
  attributes?: string;
}

export interface SubsectionProps {
  title: string;
  bodyHtml: string;
  consequence?: string;
  actionBarHtml?: string;
  id?: string;
  className?: string;
}

/**
 * Unified Subsection primitive (D-G #10, WP-17.13 D1/D2):
 * - Title (14px/600), 16px to first Item/Field, 24px between subsections, 24px above ActionBar
 */
export function renderSubsection(props: SubsectionProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const hasBody = props.bodyHtml.trim().length > 0;
  const classes = ['lp-subsection', 'lp-stack', hasBody ? 'lp-gap-group' : 'lp-gap-related', props.className].filter(Boolean).join(' ');
  const headerHtml = `<h3 data-rel="subsection-title" data-purpose="title" class="lp-subsection-title">${escapeHtml(props.title)}</h3>`;
  const actionBlock = props.consequence && props.actionBarHtml
    ? `<div class="lp-action-bar-group"><p data-c="Text" data-purpose="consequence" class="lp-description">${escapeHtml(props.consequence)}</p>${props.actionBarHtml}</div>`
    : (props.actionBarHtml ?? '');
  if (!hasBody) {
    return `<div${idAttr} data-c="Subsection" data-rel="subsection" class="${escapeHtml(classes)}">
  ${headerHtml}
  ${actionBlock}
</div>`;
  }
  return `<div${idAttr} data-c="Subsection" data-rel="subsection" class="${escapeHtml(classes)}">
  <div class="lp-stack lp-gap-related">
    ${headerHtml}
    ${props.bodyHtml}
  </div>
  ${actionBlock}
</div>`;
}

/**
 * Unified FormSection primitive (D-COMP #9, D-G #10, WP-17.13 D1/D2, WP-17.14 D2):
 * - Heading (18px, 600), zero section intro text (D2)
 * - Heading -> first content S3 (16px) ALWAYS (including consequence-only sections)
 * - Field -> field S3 (16px); Sibling -> ActionGroup/ActionBar S4 (24px) except directly after heading (S3)
 * - Consequence -> ActionBar S2 (8px); ActionBar -> feedback S3 (16px); Section -> section S5 (40px)
 */
export function renderFormSection(props: FormSectionProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const extraAttr = props.attributes ? ` ${props.attributes}` : '';
  const hasFields = props.fieldsHtml.trim().length > 0;
  const classes = ['lp-form-section', 'lp-stack', hasFields ? 'lp-gap-group' : 'lp-gap-related', props.className].filter(Boolean).join(' ');
  const actionHtml = props.actionBarHtml ?? '';
  const feedbackHtml = props.feedbackHtml ?? '';

  const titleOrSectionHeader =
    props.headerActionHtml || props.headerId
      ? renderSectionHeader({ id: props.headerId, title: props.title, actionHtml: props.headerActionHtml })
      : `<h2 data-rel="section-title" data-purpose="title" class="lp-form-section-title">${escapeHtml(props.title)}</h2>`;

  const topBlock = hasFields
    ? `<div class="lp-stack lp-gap-related">
    ${titleOrSectionHeader}
    <div class="lp-stack lp-gap-related">${props.fieldsHtml}</div>
  </div>`
    : titleOrSectionHeader;

  const actionGroup = props.consequence && actionHtml
    ? `<div class="lp-action-bar-group"><p data-c="Text" data-purpose="consequence" class="lp-description">${escapeHtml(props.consequence)}</p>${actionHtml}</div>`
    : actionHtml;

  const footerBlock = actionGroup && feedbackHtml
    ? `<div class="lp-stack lp-gap-related">${actionGroup}${feedbackHtml}</div>`
    : `${actionGroup}${feedbackHtml}`;

  return `<section${idAttr}${extraAttr} data-c="FormSection" data-rel="section" class="${escapeHtml(classes)}">
  ${topBlock}
  ${footerBlock}
</section>`;
}
