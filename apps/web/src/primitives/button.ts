import { escapeHtml } from '../lib/html.js';
import { renderIcon, type IconName, type IconSize } from './icons.js';

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
  title?: string;
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  className?: string;
  dataAttrs?: Record<string, string>;
}

export interface IconButtonProps {
  ariaLabel: string;
  icon: IconName | string;
  iconSize?: IconSize;
  variant?: 'secondary' | 'quiet';
  size?: ButtonSize;
  id?: string;
  title?: string;
  disabled?: boolean;
  disabledReason?: string;
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

function normalizeIconName(raw: string): IconName {
  const map: Record<string, IconName> = {
    x: 'x',
    '×': 'x',
    '✕': 'x',
    'chevron-down': 'chevron-down',
    '▾': 'chevron-down',
    'chevron-right': 'chevron-right',
    '▸': 'chevron-right',
    'sun-moon': 'sun-moon',
    '◐': 'sun-moon',
    menu: 'menu',
    info: 'info',
    'check-circle': 'check-circle',
    'alert-triangle': 'alert-triangle',
    'alert-circle': 'alert-circle',
    'more-horizontal': 'more-horizontal',
    '...': 'more-horizontal',
    copy: 'copy',
    plus: 'plus',
    'file-text': 'file-text',
    layers: 'layers',
  };
  return map[raw] ?? 'x';
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
  const tooltip = props.disabledReason || props.title || (props.disabled ? `${props.label} (unavailable)` : '');
  const titleAttr = tooltip ? ` title="${escapeHtml(tooltip)}"` : '';
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  return `<button type="${type}" class="${escapeHtml(classes)}"${idAttr}${nameAttr}${valueAttr}${titleAttr}${busyAttr}${disabledAttr}${data}>${escapeHtml(props.label)}</button>`;
}

/**
 * Renders a shared icon-only button primitive (D-FOUND-1: ghost or outlined only, never filled, with aria-label and title tooltip).
 */
export function renderIconButton(props: IconButtonProps): string {
  const variant = props.variant === 'secondary' ? 'secondary' : 'quiet';
  const surfaceClass = variant === 'secondary' ? 'lp-icon-btn-outlined' : 'lp-icon-btn-ghost';
  const sizeClass = props.size === 'sm' ? 'lp-icon-btn-sm' : '';
  const isDisabled = Boolean(props.disabled || props.loading);
  const classes = ['lp-icon-btn', `lp-btn-${variant}`, surfaceClass, sizeClass, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const tooltip = props.disabledReason || props.title || props.ariaLabel;
  const titleAttr = ` title="${escapeHtml(tooltip)}"`;
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  const iconSvg = renderIcon({ name: normalizeIconName(props.icon), size: props.iconSize ?? 16 });
  return `<button type="button" class="${escapeHtml(classes)}" aria-label="${escapeHtml(props.ariaLabel)}"${idAttr}${titleAttr}${busyAttr}${disabledAttr}${data}>${iconSvg}</button>`;
}
