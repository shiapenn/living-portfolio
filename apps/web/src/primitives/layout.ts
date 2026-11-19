import { escapeHtml } from '../lib/html.js';

export type SpaceToken = 4 | 8 | 16 | 24 | 40 | 64;
export type StackGapName = 'tight' | 'related' | 'group' | 'section';

const STACK_GAP_PX: Record<StackGapName, 8 | 16 | 24 | 40> = {
  tight: 8,
  related: 16,
  group: 24,
  section: 40,
};

export interface StackProps {
  /** D-FINAL #2: Stack accepts only named relation gaps: tight (8), related (16), group (24), section (40). */
  gap?: StackGapName;
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
 * Vertical layout container owning all inter-child spacing via named relation gap tokens (D-FINAL #2, D-SYS #1).
 */
export function renderStack(props: StackProps): string {
  const tag = props.tag ?? 'div';
  const gapName = props.gap ?? 'related';
  const gapPx = STACK_GAP_PX[gapName];
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-stack', `lp-gap-${gapName}`, `lp-gap-${gapPx}`, props.className].filter(Boolean).join(' ');
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
