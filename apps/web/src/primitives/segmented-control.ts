import { escapeHtml } from '../lib/html.js';
import { renderIcon, type IconName } from './icons.js';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: IconName;
  id?: string;
}

export interface SegmentedControlProps {
  id?: string;
  ariaLabel: string;
  options: SegmentedOption[];
  selectedValue: string;
  iconOnlyBelow640?: boolean;
  className?: string;
}

/**
 * Two-or-more option SegmentedControl (D-FINAL #15, D-G #12):
 * Track (--surface-l2, radius 8, padding 4) with equal-width segments (grid 1fr)
 * and selected thumb (--surface-l0, radius 4, inset 4px, 160ms transition).
 */
export function renderSegmentedControl(props: SegmentedControlProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = [
    'lp-segmented-control',
    props.iconOnlyBelow640 ? 'lp-segmented-responsive-icons' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const buttons = props.options
    .map((opt) => {
      const checked = opt.value === props.selectedValue;
      const optIdAttr = opt.id ? ` id="${escapeHtml(opt.id)}"` : '';
      const iconHtml = opt.icon
        ? `<span class="lp-segment-icon" aria-hidden="true">${renderIcon(opt.icon, 16)}</span>`
        : '';
      const labelHtml = `<span class="lp-segment-label">${escapeHtml(opt.label)}</span>`;
      const ariaTitle = props.iconOnlyBelow640
        ? ` aria-label="${escapeHtml(opt.label)}" title="${escapeHtml(opt.label)}"`
        : '';
      return `<button type="button"${optIdAttr} role="radio" aria-checked="${checked ? 'true' : 'false'}"${ariaTitle} data-segment-value="${escapeHtml(opt.value)}" class="lp-segment-btn${checked ? ' is-selected' : ''}">${iconHtml}${labelHtml}</button>`;
    })
    .join('');
  return `<div${idAttr} data-c="SegmentedControl" class="${escapeHtml(classes)}" role="radiogroup" aria-label="${escapeHtml(props.ariaLabel)}">${buttons}</div>`;
}
