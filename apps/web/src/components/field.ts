/**
 * §12.4 Standard Field Abstraction (Finding 20261020-UI-04 [P1])
 *
 * Provides accessible form control wrappers with wired label, hint, and error associations.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface FieldOptions {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  controlHtml: string;
}

export function renderField(opts: FieldOptions): string {
  const { id, label, hint, error, required, controlHtml } = opts;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  let fieldHtml = `<div class="field-group" style="margin-bottom: var(--space-4, 16px);">\n`;
  fieldHtml += `  <label for="${escapeHtml(id)}" class="field-label text-ui-sm" style="font-size: var(--font-size-1, 14px); font-weight: 600; display: block; margin-bottom: var(--space-1, 4px);">\n`;
  fieldHtml += `    ${escapeHtml(label)}${required ? ' <span aria-hidden="true" style="color: var(--status-error, #B42318);">*</span>' : ''}\n`;
  fieldHtml += `  </label>\n`;

  if (hint) {
    fieldHtml += `  <div id="${escapeHtml(hintId!)}" class="field-hint text-ui-sm" style="font-size: 13px; color: var(--text-muted); margin-bottom: var(--space-2, 8px); line-height: 1.4;">\n`;
    fieldHtml += `    ${escapeHtml(hint)}\n`;
    fieldHtml += `  </div>\n`;
  }

  fieldHtml += `  <div class="field-control">\n`;
  fieldHtml += `    ${controlHtml}\n`;
  fieldHtml += `  </div>\n`;

  if (error) {
    fieldHtml += `  <div id="${escapeHtml(errorId!)}" role="alert" class="field-error text-ui-sm" style="font-size: 13px; color: var(--status-error, #B42318); margin-top: var(--space-1, 4px); font-weight: 600;">\n`;
    fieldHtml += `    ${escapeHtml(error)}\n`;
    fieldHtml += `  </div>\n`;
  }

  fieldHtml += `</div>`;
  return fieldHtml;
}
