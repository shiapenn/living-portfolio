import { escapeHtml } from '../lib/html.js';
import { renderIcon } from './icons.js';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface FieldProps {
  kind: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio';
  id: string;
  name: string;
  label: string;
  inputType?: 'text' | 'password' | 'email' | 'url' | 'date' | 'search' | 'number';
  value?: string;
  placeholder?: string;
  rows?: number;
  options?: SelectOption[];
  optionGroups?: SelectOptionGroup[];
  checked?: boolean;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  error?: string;
  className?: string;
  attributes?: string;
}

/**
 * Renders an accessible form field (input, textarea, select, checkbox, or radio)
 * with linked label, help text, and field-level error message.
 */
export function renderField(props: FieldProps): string {
  const helpId = props.help ? `${props.id}-help` : '';
  const errorId = props.error ? `${props.id}-error` : '';
  const describedByIds = [helpId, errorId].filter(Boolean).join(' ');
  const describedByAttr = describedByIds ? ` aria-describedby="${escapeHtml(describedByIds)}"` : '';
  const invalidAttr = props.error ? ' aria-invalid="true"' : '';
  const requiredAttr = props.required ? ' required' : '';
  const disabledAttr = props.disabled ? ' disabled' : '';
  const placeholderAttr = props.placeholder ? ` placeholder="${escapeHtml(props.placeholder)}"` : '';
  const wrapperClass = ['lp-field', props.error ? 'lp-field-has-error' : '', props.className].filter(Boolean).join(' ');

  if (props.kind === 'checkbox' || props.kind === 'radio') {
    const checkedAttr = props.checked ? ' checked' : '';
    const valueAttr = props.value !== undefined ? ` value="${escapeHtml(props.value)}"` : '';
    return `<div class="${escapeHtml(wrapperClass)}">
  <label class="lp-choice-label" data-purpose="label" for="${escapeHtml(props.id)}">
    <input type="${props.kind}" id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-choice-input"${valueAttr}${checkedAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr} />
    <span>${escapeHtml(props.label)}</span>
  </label>
  ${props.help ? `<p class="lp-field-help" data-purpose="helper" id="${escapeHtml(helpId)}">${escapeHtml(props.help)}</p>` : ''}
  ${props.error ? `<p class="lp-field-error" data-purpose="feedback" id="${escapeHtml(errorId)}" role="alert">${escapeHtml(props.error)}</p>` : ''}
</div>`;
  }

  const extraAttrs = props.attributes ? ` ${props.attributes}` : '';
  let controlHtml = '';
  if (props.kind === 'textarea') {
    const rows = Math.max(6, props.rows ?? 6);
    controlHtml = `<textarea id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" data-rel="control" class="lp-input lp-textarea" rows="${rows}" data-lp-autogrow="true"${placeholderAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr}${extraAttrs}>${escapeHtml(props.value ?? '')}</textarea>`;
  } else if (props.kind === 'select') {
    const renderOpts = (list: SelectOption[]) =>
      list
        .map((opt) => {
          const selected = props.value === opt.value ? ' selected' : '';
          return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
        })
        .join('');
    const inner = props.optionGroups?.length
      ? props.optionGroups
          .map((grp) => `<optgroup label="${escapeHtml(grp.label)}">${renderOpts(grp.options)}</optgroup>`)
          .join('')
      : renderOpts(props.options ?? []);
    controlHtml = `<div data-c="Select" data-rel="control" class="lp-select-wrap"><select id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-input lp-select"${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr}${extraAttrs}>${inner}</select><span class="lp-select-chevron" aria-hidden="true">${renderIcon('chevron-down', 16)}</span></div>`;
  } else {
    const type = props.inputType ?? 'text';
    const valAttr = props.value !== undefined ? ` value="${escapeHtml(props.value)}"` : '';
    controlHtml = `<input type="${type}" id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" data-rel="control" class="lp-input"${valAttr}${placeholderAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr}${extraAttrs} />`;
  }

  return `<div data-c="Field" data-rel="field" class="${escapeHtml(wrapperClass)}">
  <label class="lp-field-label" for="${escapeHtml(props.id)}" data-rel="label" data-purpose="label">${escapeHtml(props.label)}${props.required ? ' <span class="lp-field-required" aria-hidden="true">*</span>' : ''}</label>
  ${controlHtml}
  ${props.help ? `<p data-rel="help" data-purpose="helper" class="lp-field-help" id="${escapeHtml(helpId)}">${escapeHtml(props.help)}</p>` : ''}
  ${props.error ? `<p class="lp-field-error" data-purpose="feedback" id="${escapeHtml(errorId)}" role="alert">${escapeHtml(props.error)}</p>` : ''}
</div>`;
}
