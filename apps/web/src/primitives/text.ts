import { escapeHtml } from '../lib/html.js';

export type TextVariant = 'body' | 'description' | 'caption' | 'prose';

/** Closed set of text purposes (WP-17.13 D2). */
export type TextPurpose =
  | 'title'
  | 'label'
  | 'value'
  | 'helper'
  | 'consequence'
  | 'status'
  | 'feedback'
  | 'empty'
  | 'meta'
  | 'intro';

export interface TextProps {
  text?: string;
  html?: string;
  variant?: TextVariant;
  purpose?: TextPurpose;
  tag?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
  dataRel?: string;
}

const VARIANT_CLASS: Record<TextVariant, string> = {
  body: 'lp-body',
  description: 'lp-description',
  caption: 'lp-caption',
  prose: 'lp-prose',
};

const DEFAULT_PURPOSE: Record<TextVariant, TextPurpose> = {
  body: 'value',
  description: 'helper',
  caption: 'meta',
  prose: 'value',
};

/**
 * Unified Text primitive (D-FINAL #8, D-K3, WP-17.13 D2):
 * Expresses the registered text roles with an explicit data-purpose.
 */
export function renderText(props: TextProps): string {
  const variant: TextVariant = props.variant ?? 'body';
  const purpose: TextPurpose = props.purpose ?? DEFAULT_PURPOSE[variant];
  const tag = props.tag ?? (variant === 'prose' ? 'div' : 'p');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const relAttr = props.dataRel ? ` data-rel="${escapeHtml(props.dataRel)}"` : '';
  const classes = [VARIANT_CLASS[variant], props.className].filter(Boolean).join(' ');
  const content = props.html !== undefined ? props.html : escapeHtml(props.text ?? '');
  return `<${tag}${idAttr} data-c="Text" data-variant="${variant}" data-purpose="${purpose}"${relAttr} class="${escapeHtml(classes)}">${content}</${tag}>`;
}
