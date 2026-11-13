import { escapeHtml } from '../lib/html.js';

export interface SwitchProps {
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  description?: string;
  className?: string;
}

/**
 * Renders an accessible toggle switch using role="switch" and aria-checked.
 */
export function renderSwitch(props: SwitchProps): string {
  const checked = Boolean(props.checked);
  const disabledAttr = props.disabled ? ' disabled' : '';
  const descId = props.description ? `${props.id}-desc` : undefined;
  const describedBy = descId ? ` aria-describedby="${escapeHtml(descId)}"` : '';
  const classes = ['lp-switch-row', props.className].filter(Boolean).join(' ');

  return `<div class="${escapeHtml(classes)}">
  <button type="button" role="switch" id="${escapeHtml(props.id)}" class="lp-switch" aria-checked="${checked ? 'true' : 'false'}"${describedBy}${disabledAttr}>
    <span class="lp-switch-track" aria-hidden="true"><span class="lp-switch-thumb"></span></span>
    <span class="lp-switch-label">${escapeHtml(props.label)}</span>
  </button>
  ${props.description ? `<p class="lp-field-help" id="${escapeHtml(descId!)}">${escapeHtml(props.description)}</p>` : ''}
</div>`;
}
