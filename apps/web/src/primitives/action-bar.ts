import { escapeHtml } from '../lib/html.js';
import { renderButton, type ButtonProps } from './button.js';

export interface ActionBarProps {
  primary?: ButtonProps | string;
  secondary?: ButtonProps | string;
  textAction?: ButtonProps | string;
  id?: string;
  className?: string;
}

function renderActionSlot(item: ButtonProps | string, defaultVariant: 'primary' | 'secondary' | 'quiet'): string {
  if (typeof item === 'string') return item;
  return renderButton({ ...item, variant: item.variant ?? defaultVariant });
}

/**
 * Unified ActionBar primitive (D-COMP #4):
 * - Vertical stack in order: primary, secondary, optional text button
 * - >= 640px: each button same width (min 160px, max 240px), left-aligned
 * - < 640px: full width
 * - 16px above the bar, 8px between buttons
 */
export function renderActionBar(props: ActionBarProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-action-bar', props.className].filter(Boolean).join(' ');
  const slots: string[] = [];
  if (props.primary) slots.push(renderActionSlot(props.primary, 'primary'));
  if (props.secondary) slots.push(renderActionSlot(props.secondary, 'secondary'));
  if (props.textAction) slots.push(renderActionSlot(props.textAction, 'quiet'));

  return `<div${idAttr} class="${escapeHtml(classes)}">${slots.join('')}</div>`;
}
