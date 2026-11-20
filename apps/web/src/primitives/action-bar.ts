import { escapeHtml } from '../lib/html.js';
import { renderButton, type ButtonProps } from './button.js';

export interface ActionBarProps {
  primary?: ButtonProps | string;
  secondary?: ButtonProps | string;
  textAction?: ButtonProps | string;
  pageLevel?: boolean;
  id?: string;
  className?: string;
}

function renderActionSlot(item: ButtonProps | string, defaultVariant: 'primary' | 'secondary' | 'text'): string {
  if (typeof item === 'string') return item;
  return renderButton({ ...item, variant: item.variant ?? defaultVariant });
}

/**
 * Unified ActionBar primitive (D-COMP #4, D-G #10):
 * - Vertical stack in order: primary, secondary, optional text button
 * - >= 400px container: same width (min 160px, max 240px), left-aligned; < 400px: full width
 * - 40px above pageLevel bar, 24px above subsection/dialog/item bar, 8px between buttons
 */
export function renderActionBar(props: ActionBarProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-action-bar', props.pageLevel ? 'lp-action-bar-page' : '', props.className].filter(Boolean).join(' ');
  const relAttr = props.pageLevel ? 'page-actions' : 'actions';
  const slots: string[] = [];
  if (props.primary) slots.push(renderActionSlot(props.primary, 'primary'));
  if (props.secondary) slots.push(renderActionSlot(props.secondary, 'secondary'));
  if (props.textAction) slots.push(renderActionSlot(props.textAction, 'text'));

  return `<div${idAttr} data-c="ActionBar" data-rel="${relAttr}" class="${escapeHtml(classes)}">${slots.join('')}</div>`;
}
