import { escapeHtml } from '../lib/html.js';
import { renderButton, type ButtonProps } from './button.js';

export type ActionBarLevel = 'page' | 'dialog' | 'item';

export interface ActionBarProps {
  primary?: ButtonProps | string;
  secondary?: ButtonProps | string;
  textAction?: ButtonProps | string;
  level?: ActionBarLevel;
  pageLevel?: boolean;
  id?: string;
  className?: string;
}

function renderActionSlot(item: ButtonProps | string, defaultVariant: 'primary' | 'secondary' | 'text'): string {
  if (typeof item === 'string') return item;
  return renderButton({ ...item, variant: item.variant ?? defaultVariant });
}

/**
 * Unified ActionBar primitive (D-COMP #4, D-I1, D-K1):
 * - page / dialog levels: full width, stacked
 * - item level: always compact, auto width (min 96px), left-aligned flex-wrap row (gap 8px),
 *   wrapping only when buttons do not fit; touch size from 44px control height < 640px.
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
  const defaultSecondaryOrPrimary = level === 'item' ? 'secondary' : 'primary';
  if (props.primary) slots.push(renderActionSlot(props.primary, defaultSecondaryOrPrimary));
  if (props.secondary) slots.push(renderActionSlot(props.secondary, 'secondary'));
  if (props.textAction) slots.push(renderActionSlot(props.textAction, 'text'));

  return `<div${idAttr} data-c="ActionBar" data-level="${level}" data-rel="${relAttr}" class="${escapeHtml(classes)}">${slots.join('')}</div>`;
}
