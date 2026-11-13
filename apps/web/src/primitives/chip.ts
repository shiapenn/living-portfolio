import { escapeHtml } from '../lib/html.js';

export type ChipState = 'confirmed' | 'suggested';
export type StatusTone = 'neutral' | 'ok' | 'warn' | 'danger';

export interface ChipProps {
  label: string;
  state?: ChipState;
  interactive?: boolean;
  selected?: boolean;
  id?: string;
  className?: string;
  dataAttrs?: Record<string, string>;
}

export interface BadgeProps {
  label: string;
  tone?: StatusTone;
  id?: string;
  className?: string;
}

export interface StatusDotProps {
  label: string;
  tone?: StatusTone;
  id?: string;
  className?: string;
}

function formatDataAttrs(dataAttrs?: Record<string, string>): string {
  if (!dataAttrs) return '';
  return Object.entries(dataAttrs)
    .map(([k, v]) => ` data-${escapeHtml(k)}="${escapeHtml(v)}"`)
    .join('');
}

/**
 * Renders a Chip: uses a native <button> when interactive, or a non-interactive <span> otherwise.
 */
export function renderChip(props: ChipProps): string {
  const state = props.state ?? 'confirmed';
  const classes = [
    'lp-chip',
    state === 'suggested' ? 'lp-chip-suggested' : 'lp-chip-confirmed',
    props.selected ? 'lp-chip-selected' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const data = formatDataAttrs(props.dataAttrs);
  if (props.interactive) {
    const pressed = props.selected !== undefined ? ` aria-pressed="${props.selected ? 'true' : 'false'}"` : '';
    return `<button type="button" class="${escapeHtml(classes)}"${idAttr}${pressed}${data}>${escapeHtml(props.label)}</button>`;
  }
  return `<span class="${escapeHtml(classes)}"${idAttr}${data}>${escapeHtml(props.label)}</span>`;
}

/**
 * Renders a non-interactive status or count Badge.
 */
export function renderBadge(props: BadgeProps): string {
  const tone = props.tone ?? 'neutral';
  const classes = ['lp-badge', `lp-badge-${tone}`, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  return `<span class="${escapeHtml(classes)}"${idAttr}>${escapeHtml(props.label)}</span>`;
}

/**
 * Renders a StatusDot paired with visible accessible text (never colour-only).
 */
export function renderStatusDot(props: StatusDotProps): string {
  const tone = props.tone ?? 'neutral';
  const classes = ['lp-status-indicator', props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  return `<span class="${escapeHtml(classes)}"${idAttr}><span class="lp-status-dot lp-status-dot-${escapeHtml(tone)}" aria-hidden="true"></span><span class="lp-status-label">${escapeHtml(props.label)}</span></span>`;
}
