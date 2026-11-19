import { escapeHtml } from '../lib/html.js';

export interface SegmentedOption {
  value: string;
  label: string;
  id?: string;
}

export interface SegmentedControlProps {
  id?: string;
  ariaLabel: string;
  options: SegmentedOption[];
  selectedValue: string;
  className?: string;
}

/**
 * Two-or-more option SegmentedControl (D-FINAL #15):
 * Filled container (--surface-l2) with a filled selected thumb (--surface-l0),
 * text labels, no underline, radio-group semantics, 36px height.
 */
export function renderSegmentedControl(props: SegmentedControlProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-segmented-control', props.className].filter(Boolean).join(' ');
  const buttons = props.options
    .map((opt) => {
      const checked = opt.value === props.selectedValue;
      const optIdAttr = opt.id ? ` id="${escapeHtml(opt.id)}"` : '';
      return `<button type="button"${optIdAttr} role="radio" aria-checked="${checked ? 'true' : 'false'}" data-segment-value="${escapeHtml(opt.value)}" class="lp-segment-btn${checked ? ' is-selected' : ''}">${escapeHtml(opt.label)}</button>`;
    })
    .join('');
  return `<div${idAttr} class="${escapeHtml(classes)}" role="radiogroup" aria-label="${escapeHtml(props.ariaLabel)}">${buttons}</div>`;
}
