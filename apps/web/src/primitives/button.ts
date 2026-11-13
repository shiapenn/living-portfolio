import { escapeHtml } from '../lib/html.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  dataAttrs?: Record<string, string>;
}

export interface IconButtonProps {
  ariaLabel: string;
  icon: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  id?: string;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  dataAttrs?: Record<string, string>;
}

function formatDataAttrs(dataAttrs?: Record<string, string>): string {
  if (!dataAttrs) return '';
  return Object.entries(dataAttrs)
    .map(([k, v]) => ` data-${escapeHtml(k)}="${escapeHtml(v)}"`)
    .join('');
}

/**
 * Renders a shared button primitive with variant, size, disabled, and loading states.
 */
export function renderButton(props: ButtonProps): string {
  const variant = props.variant ?? 'secondary';
  const size = props.size ?? 'md';
  const type = props.type ?? 'button';
  const isDisabled = Boolean(props.disabled || props.loading);
  const classes = ['lp-btn', `lp-btn-${variant}`, `lp-btn-${size}`, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const nameAttr = props.name ? ` name="${escapeHtml(props.name)}"` : '';
  const valueAttr = props.value !== undefined ? ` value="${escapeHtml(props.value)}"` : '';
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  return `<button type="${type}" class="${escapeHtml(classes)}"${idAttr}${nameAttr}${valueAttr}${busyAttr}${disabledAttr}${data}>${escapeHtml(props.label)}</button>`;
}

/**
 * Renders a shared icon-only button primitive requiring an accessible aria-label.
 */
export function renderIconButton(props: IconButtonProps): string {
  const variant = props.variant ?? 'quiet';
  const sizeClass = props.size === 'sm' ? ' lp-icon-btn-sm' : '';
  const isDisabled = Boolean(props.disabled || props.loading);
  const classes = ['lp-icon-btn', `lp-btn-${variant}`, sizeClass.trim(), props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const titleAttr = props.title ? ` title="${escapeHtml(props.title)}"` : '';
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  return `<button type="button" class="${escapeHtml(classes)}" aria-label="${escapeHtml(props.ariaLabel)}"${idAttr}${titleAttr}${busyAttr}${disabledAttr}${data}><span aria-hidden="true">${escapeHtml(props.icon)}</span></button>`;
}
