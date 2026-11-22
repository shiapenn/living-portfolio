import { escapeHtml } from '../lib/html.js';

export type TextVariant = 'body' | 'description' | 'caption' | 'prose';

export interface TextProps {
  text?: string;
  html?: string;
  variant?: TextVariant;
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

/**
 * Unified Text primitive (D-FINAL #8, D-K3):
 * Expresses the registered text roles (body, description, caption, prose).
 */
export function renderText(props: TextProps): string {
  const variant: TextVariant = props.variant ?? 'body';
  const tag = props.tag ?? (variant === 'prose' ? 'div' : 'p');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const relAttr = props.dataRel ? ` data-rel="${escapeHtml(props.dataRel)}"` : '';
  const classes = [VARIANT_CLASS[variant], props.className].filter(Boolean).join(' ');
  const content = props.html !== undefined ? props.html : escapeHtml(props.text ?? '');
  return `<${tag}${idAttr} data-c="Text" data-variant="${variant}"${relAttr} class="${escapeHtml(classes)}">${content}</${tag}>`;
}
