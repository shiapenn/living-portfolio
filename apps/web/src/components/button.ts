/**
 * §12.4 Standard Button Abstraction (Finding 20261020-UI-04 [P1])
 *
 * Implements primary, secondary, quiet, and danger variants with loading, disabled,
 * and touch-target accessibility states.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'sm';

export interface ButtonOptions {
  label: string;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  className?: string;
  onclick?: string;
  ariaPressed?: boolean;
  ariaCurrent?: string;
  ariaLabel?: string;
  iconStart?: string;
}

export function renderButton(opts: ButtonOptions): string {
  const {
    label,
    href,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    id,
    className = '',
    onclick,
    ariaPressed,
    ariaCurrent,
    ariaLabel,
    iconStart,
  } = opts;

  const classes = ['btn', `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(' ');
  const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
  const onclickAttr = onclick ? ` onclick="${escapeHtml(onclick)}"` : '';
  const ariaPressedAttr = ariaPressed !== undefined ? ` aria-pressed="${ariaPressed}"` : '';
  const ariaCurrentAttr = ariaCurrent ? ` aria-current="${escapeHtml(ariaCurrent)}"` : '';
  const ariaLabelAttr = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  const busyAttr = loading ? ' aria-busy="true"' : '';
  const disabledAttr = disabled ? ' disabled aria-disabled="true"' : '';

  const content = `${iconStart ? `<span class="btn-icon" aria-hidden="true">${iconStart}</span> ` : ''}${escapeHtml(label)}`;

  if (href && !disabled) {
    return `<a href="${escapeHtml(href)}"${idAttr} class="${classes}"${onclickAttr}${ariaPressedAttr}${ariaCurrentAttr}${ariaLabelAttr}>${content}</a>`;
  }

  return `<button type="${type}"${idAttr} class="${classes}"${disabledAttr}${busyAttr}${onclickAttr}${ariaPressedAttr}${ariaLabelAttr}>${content}</button>`;
}
