import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface ChoiceOption {
  id?: string;
  value: string;
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface ChoiceGroupProps {
  id?: string;
  name: string;
  legend?: string;
  mode: 'single' | 'multiple';
  variant?: 'button' | 'card' | 'segmented';
  /** D-FINAL #18: Allows single-select button Choice to deselect back to none (e.g. Accept/Ignore -> Suggested). */
  deselectable?: boolean;
  options: ChoiceOption[];
  error?: string;
  className?: string;
}

/**
 * Unified Choice primitive (D-COMP #5):
 * - Single (radio group) and multiple (checkbox) selection in two variants:
 *   - button: option label only; multi-select shows check icon left of label when selected
 *   - card: title + description; multi-select shows check at far right of title row;
 *           titles wrap to 2 lines then truncate with ellipsis and tooltip
 * - Single on/off setting is a one-option card
 * - Native input remains in DOM, visually hidden, for keyboard/a11y/forms
 */
export function renderChoiceGroup(props: ChoiceGroupProps): string {
  const variant = props.variant ?? (props.options.some((o) => Boolean(o.description)) ? 'card' : 'button');
  const inputType = props.mode === 'single' ? 'radio' : 'checkbox';
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-choice-group', `lp-choice-variant-${variant}`, `lp-choice-mode-${props.mode}`, props.className]
    .filter(Boolean)
    .join(' ');
  const roleAttr = props.mode === 'single' ? ' role="radiogroup"' : ' role="group"';

  const optionsHtml = props.options
    .map((opt, idx) => {
      const optId = opt.id ?? `${props.name}-${idx}`;
      const checkedAttr = opt.checked ? ' checked' : '';
      const disabledAttr = opt.disabled ? ' disabled' : '';
      const stateClasses = [
        'lp-choice',
        `lp-choice-${variant}`,
        opt.checked ? 'is-selected' : '',
        opt.disabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const checkSpan = `<span class="lp-choice-check" aria-hidden="true">${renderIcon('check', 16)}</span>`;

      if (variant === 'card') {
        return `<label class="${escapeHtml(stateClasses)}" for="${escapeHtml(optId)}">
          <input type="${inputType}" id="${escapeHtml(optId)}" name="${escapeHtml(props.name)}" value="${escapeHtml(opt.value)}" class="lp-choice-input"${checkedAttr}${disabledAttr} />
          <span class="lp-choice-card-body">
            <span class="lp-choice-card-title-row">
              <span class="lp-choice-card-title" title="${escapeHtml(opt.label)}">${escapeHtml(opt.label)}</span>
              ${props.mode === 'multiple' ? checkSpan : '<span class="lp-choice-radio-dot" aria-hidden="true"></span>'}
            </span>
            ${opt.description ? `<span class="lp-choice-card-desc">${escapeHtml(opt.description)}</span>` : ''}
          </span>
        </label>`;
      }

      return `<label class="${escapeHtml(stateClasses)}" for="${escapeHtml(optId)}">
        <input type="${inputType}" id="${escapeHtml(optId)}" name="${escapeHtml(props.name)}" value="${escapeHtml(opt.value)}" class="lp-choice-input"${checkedAttr}${disabledAttr} />
        ${props.mode === 'multiple' ? checkSpan : ''}
        <span class="lp-choice-btn-label">${escapeHtml(opt.label)}</span>
      </label>`;
    })
    .join('');

  const legendHtml = props.legend ? `<div class="lp-choice-legend">${escapeHtml(props.legend)}</div>` : '';
  const errorHtml = props.error ? `<div class="lp-field-error">${escapeHtml(props.error)}</div>` : '';

  const deselectAttr = props.deselectable ? ' data-deselectable="true"' : '';
  return `<div${idAttr} data-c="Choice" class="${escapeHtml(classes)}"${roleAttr}${deselectAttr}${props.legend ? ` aria-label="${escapeHtml(props.legend)}"` : ''}>
    ${legendHtml}
    <div class="lp-choice-list">${optionsHtml}</div>
    ${errorHtml}
  </div>`;
}
