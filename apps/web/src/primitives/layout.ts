import { escapeHtml } from '../lib/html.js';

export type SpaceToken = 4 | 8 | 16 | 24 | 40 | 64;

export interface StackProps {
  gap?: SpaceToken;
  childrenHtml: string;
  id?: string;
  className?: string;
  tag?: 'div' | 'section';
}

export interface RowProps {
  gap?: SpaceToken;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  childrenHtml: string;
  id?: string;
  className?: string;
}

/**
 * Vertical layout container owning all inter-child spacing via gap tokens (D-SYS #1).
 */
export function renderStack(props: StackProps): string {
  const tag = props.tag ?? 'div';
  const gap = props.gap ?? 16;
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-stack', `lp-gap-${gap}`, props.className].filter(Boolean).join(' ');
  return `<${tag}${idAttr} class="${escapeHtml(classes)}">${props.childrenHtml}</${tag}>`;
}

/**
 * Horizontal layout container owning all inter-child spacing via gap tokens (D-SYS #1).
 */
export function renderRow(props: RowProps): string {
  const gap = props.gap ?? 8;
  const align = props.align ?? 'center';
  const justify = props.justify ?? 'start';
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = [
    'lp-row',
    `lp-gap-${gap}`,
    `lp-align-${align}`,
    `lp-justify-${justify}`,
    props.wrap ? 'lp-row-wrap' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');
  return `<div${idAttr} class="${escapeHtml(classes)}">${props.childrenHtml}</div>`;
}
