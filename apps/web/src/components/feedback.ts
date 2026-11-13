import { escapeHtml } from '../lib/html.js';
import { renderButton, renderIconButton } from '../primitives/index.js';

export type NoticeTone = 'info' | 'ok' | 'warn' | 'danger';

export interface PageNoticeProps {
  id?: string;
  tone?: NoticeTone;
  message: string;
  dismissible?: boolean;
  role?: 'status' | 'alert';
  hidden?: boolean;
  className?: string;
}

export interface StatusLineProps {
  id: string;
  message?: string;
  tone?: NoticeTone;
  undoLabel?: string;
  undoSeconds?: number;
  role?: 'status' | 'alert';
  className?: string;
}

/**
 * Renders a persistent, optionally dismissible page notice directly under the header.
 * Never auto-dismisses (no timed toast per D-CONTRACT-7 / D-FEEDBACK).
 */
export function renderPageNotice(props: PageNoticeProps): string {
  const tone = props.tone ?? 'info';
  const role = props.role ?? (tone === 'danger' ? 'alert' : 'status');
  const classes = ['lp-notice', `lp-notice-${tone}`, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const hiddenAttr = props.hidden ? ' hidden' : '';

  const dismissBtn = props.dismissible
    ? renderIconButton({
        ariaLabel: 'Dismiss notice',
        icon: '×',
        variant: 'quiet',
        size: 'sm',
        className: 'lp-notice-dismiss',
        dataAttrs: { 'lp-notice-dismiss': 'true' },
      })
    : '';

  return `<div class="${escapeHtml(classes)}" role="${role}" aria-live="${role === 'alert' ? 'assertive' : 'polite'}"${idAttr}${hiddenAttr}>
  <span class="lp-notice-text">${escapeHtml(props.message)}</span>
  ${dismissBtn}
</div>`;
}

/**
 * Renders the single action status line directly under the editor action bar,
 * with optional real-countdown Undo control.
 */
export function renderStatusLine(props: StatusLineProps): string {
  const tone = props.tone ?? 'info';
  const role = props.role ?? (tone === 'danger' ? 'alert' : 'status');
  const classes = ['lp-status-line', `lp-status-line-${tone}`, props.className].filter(Boolean).join(' ');
  const message = props.message ?? '';

  let undoBtn = '';
  if (props.undoLabel && props.undoSeconds && props.undoSeconds > 0) {
    undoBtn = renderButton({
      label: `${props.undoLabel} (${props.undoSeconds}s)`,
      variant: 'quiet',
      size: 'sm',
      className: 'lp-status-undo',
      dataAttrs: { 'lp-status-undo': 'true' },
    });
  }

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="${role}" aria-live="${role === 'alert' ? 'assertive' : 'polite'}" aria-atomic="true">
  <span class="lp-status-line-text">${escapeHtml(message)}</span>
  ${undoBtn}
</div>`;
}
