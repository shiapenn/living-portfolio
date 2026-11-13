import { escapeHtml } from '../lib/html.js';

export interface SelectOption {
  value: string;
  label: string;
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
  checked?: boolean;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  error?: string;
  className?: string;
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
  <label class="lp-choice-label" for="${escapeHtml(props.id)}">
    <input type="${props.kind}" id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-choice-input"${valueAttr}${checkedAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr} />
    <span>${escapeHtml(props.label)}</span>
  </label>
  ${props.help ? `<p class="lp-field-help" id="${escapeHtml(helpId)}">${escapeHtml(props.help)}</p>` : ''}
  ${props.error ? `<p class="lp-field-error" id="${escapeHtml(errorId)}" role="alert">${escapeHtml(props.error)}</p>` : ''}
</div>`;
  }

  let controlHtml = '';
  if (props.kind === 'textarea') {
    const rows = props.rows ?? 4;
    controlHtml = `<textarea id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-input lp-textarea" rows="${rows}"${placeholderAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr}>${escapeHtml(props.value ?? '')}</textarea>`;
  } else if (props.kind === 'select') {
    const opts = (props.options ?? [])
      .map((opt) => {
        const selected = props.value === opt.value ? ' selected' : '';
        return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
      })
      .join('');
    controlHtml = `<select id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-input lp-select"${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr}>${opts}</select>`;
  } else {
    const type = props.inputType ?? 'text';
    const valAttr = props.value !== undefined ? ` value="${escapeHtml(props.value)}"` : '';
    controlHtml = `<input type="${type}" id="${escapeHtml(props.id)}" name="${escapeHtml(props.name)}" class="lp-input"${valAttr}${placeholderAttr}${requiredAttr}${disabledAttr}${invalidAttr}${describedByAttr} />`;
  }

  return `<div class="${escapeHtml(wrapperClass)}">
  <label class="lp-field-label" for="${escapeHtml(props.id)}">${escapeHtml(props.label)}${props.required ? ' <span class="lp-field-required" aria-hidden="true">*</span>' : ''}</label>
  ${controlHtml}
  ${props.help ? `<p class="lp-field-help" id="${escapeHtml(helpId)}">${escapeHtml(props.help)}</p>` : ''}
  ${props.error ? `<p class="lp-field-error" id="${escapeHtml(errorId)}" role="alert">${escapeHtml(props.error)}</p>` : ''}
</div>`;
}
