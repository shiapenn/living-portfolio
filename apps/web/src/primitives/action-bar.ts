import { escapeHtml } from '../lib/html.js';
import { renderButton, type ButtonProps } from './button.js';

export type ActionBarLevel = 'page' | 'dialog' | 'item';

export interface ActionBarProps {
  primary?: ButtonProps | string;
  secondary?: ButtonProps | string;
  textAction?: ButtonProps | string;
  dangerTextAction?: ButtonProps | string;
  level?: ActionBarLevel;
  pageLevel?: boolean;
  id?: string;
  className?: string;
}

function renderActionSlot(item: ButtonProps | string, defaultVariant: 'primary' | 'secondary' | 'text', forceVariant = false): string {
  if (typeof item === 'string') return item;
  const resolvedVariant = forceVariant
    ? defaultVariant === 'text' && (item.variant === 'text-danger' || item.variant === 'danger' || item.destructive)
      ? 'text-danger'
      : defaultVariant
    : item.variant ?? defaultVariant;
  return renderButton({ ...item, variant: resolvedVariant });
}

/**
 * Unified ActionBar primitive (D-COMP #4, D-I1, D-K1, D-L1):
 * - page / dialog levels: full width, stacked (primary -> secondary -> text)
 * - item level (D-L1): always compact, auto width (min 96px), left-aligned flex-wrap row (gap 8px);
 *   never contains a primary; at most two buttons:
 *   1 action -> secondary; 2 actions -> affirmative = secondary, negative = text button.
 */
export function renderActionBar(props: ActionBarProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const level: ActionBarLevel = props.level ?? (props.pageLevel ? 'page' : 'item');
  const classes = [
    'lp-action-bar',
    `lp-action-bar-${level}`,
    level === 'page' ? 'lp-action-bar-page' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const relAttr = level === 'page' ? 'page-actions' : 'actions';
  const slots: string[] = [];

  if (level === 'item') {
    const rawActions = [props.primary, props.secondary, props.textAction].filter(
      (a): a is ButtonProps | string => Boolean(a)
    ).slice(0, 2);
    if (rawActions.length === 1) {
      slots.push(renderActionSlot(rawActions[0], 'secondary', true));
    } else if (rawActions.length === 2) {
      slots.push(renderActionSlot(rawActions[0], 'secondary', true));
      slots.push(renderActionSlot(rawActions[1], 'text', true));
    }
  } else {
    if (props.primary) slots.push(renderActionSlot(props.primary, 'primary'));
    if (props.secondary) slots.push(renderActionSlot(props.secondary, 'secondary'));
    if (props.textAction) slots.push(renderActionSlot(props.textAction, 'text'));
    if (props.dangerTextAction) slots.push(renderActionSlot(props.dangerTextAction, 'text'));
  }

  return `<div${idAttr} data-c="ActionBar" data-level="${level}" data-rel="${relAttr}" class="${escapeHtml(classes)}">${slots.join('')}</div>`;
}
