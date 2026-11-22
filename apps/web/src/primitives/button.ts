import { escapeHtml } from '../lib/html.js';
import { isKnownIconName, renderIcon, type IconName, type IconSize } from './icons.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet' | 'text';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  label: string;
  ariaLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  href?: string;
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
  if (isKnownIconName(raw)) {
    return raw;
  }
  const legacyGlyphMap: Record<string, IconName> = {
    '×': 'close',
    '✕': 'close',
    '▾': 'chevron-down',
    '▸': 'chevron-right',
    '◐': 'moon',
    '...': 'more',
  };
  const mapped = legacyGlyphMap[raw];
  if (mapped) return mapped;
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`Unknown icon id: "${raw}"`);
  }
  return 'close';
}

/**
 * Renders a shared button primitive with variant, size, disabled, and loading states.
 * Loading buttons retain full text contrast and display a 16px spinner (D-FOUND-5).
 */
export function renderButton(props: ButtonProps): string {
  const variant = props.variant ?? 'secondary';
  const size = props.size ?? 'md';
  const type = props.type ?? 'button';
  const isDisabled = Boolean(props.disabled || props.loading);
  const classes = [
    'lp-btn',
    `lp-btn-${variant}`,
    `lp-btn-${size}`,
    props.loading ? 'lp-btn-loading' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const nameAttr = props.name ? ` name="${escapeHtml(props.name)}"` : '';
  const valueAttr = props.value !== undefined ? ` value="${escapeHtml(props.value)}"` : '';
  const tooltip = props.disabledReason || props.title || (props.disabled ? `${props.label} (unavailable)` : '');
  const titleAttr = tooltip ? ` title="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}"` : '';
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const ariaLabelAttr = props.ariaLabel ? ` aria-label="${escapeHtml(props.ariaLabel)}"` : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  const spinner = props.loading ? `${renderIcon({ name: 'loader', size: 16, className: 'lp-icon-spin' })} ` : '';
  if (props.href && !isDisabled) {
    return `<a href="${escapeHtml(props.href)}" data-c="Button" class="${escapeHtml(classes)}"${idAttr}${ariaLabelAttr}${titleAttr}${data}>${spinner}<span>${escapeHtml(props.label)}</span></a>`;
  }
  return `<button type="${type}" data-c="Button" class="${escapeHtml(classes)}"${idAttr}${nameAttr}${valueAttr}${ariaLabelAttr}${titleAttr}${busyAttr}${disabledAttr}${data}>${spinner}<span>${escapeHtml(props.label)}</span></button>`;
}

/**
 * Renders a shared icon-only button primitive (D-SYS #14: 36x36, radius 4, no border, filled control surface).
 */
export function renderIconButton(props: IconButtonProps): string {
  const sizeClass = props.size === 'sm' ? 'lp-icon-btn-sm' : '';
  const isDisabled = Boolean(props.disabled || props.loading);
  const classes = ['lp-icon-btn', sizeClass, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const tooltip = props.disabledReason || props.title || props.ariaLabel;
  const titleAttr = ` title="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}"`;
  const busyAttr = props.loading ? ' aria-busy="true"' : '';
  const disabledAttr = isDisabled ? ' disabled' : '';
  const data = formatDataAttrs(props.dataAttrs);
  const resolvedIcon = normalizeIconName(props.icon);
  const iconSvg = renderIcon({ name: resolvedIcon, size: props.iconSize ?? 16 });
  return `<button type="button" class="${escapeHtml(classes)}" aria-label="${escapeHtml(props.ariaLabel)}" data-icon-name="${escapeHtml(resolvedIcon)}"${idAttr}${titleAttr}${busyAttr}${disabledAttr}${data}>${iconSvg}</button>`;
}
