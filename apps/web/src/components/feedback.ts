import { escapeHtml } from '../lib/html.js';
import { renderIcon, renderIconButton, type IconName } from '../primitives/index.js';

export type NoticeTone = 'info' | 'ok' | 'warn' | 'danger';

export interface PageNoticeProps {
  id?: string;
  tone?: NoticeTone;
  message: string;
  actionHtml?: string;
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

const TONE_ICONS: Record<NoticeTone, IconName> = {
  info: 'info',
  ok: 'check-circle',
  warn: 'alert-triangle',
  danger: 'alert-circle',
};

/**
 * Renders a persistent, optionally dismissible page notice directly under the header.
 * Never auto-dismisses (no timed toast per D-CONTRACT-7 / D-FEEDBACK / D-FOUND-6).
 */
export function renderPageNotice(props: PageNoticeProps): string {
  const tone = props.tone ?? 'info';
  const role = props.role ?? (tone === 'danger' ? 'alert' : 'status');
  const classes = ['lp-notice', `lp-notice-${tone}`, props.className].filter(Boolean).join(' ');
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const hiddenAttr = props.hidden ? ' hidden' : '';
  const toneIcon = renderIcon({ name: TONE_ICONS[tone], size: 16, className: 'lp-notice-icon' });

  const dismissBtn = props.dismissible
    ? renderIconButton({
        ariaLabel: 'Dismiss notice',
        icon: 'x',
        iconSize: 16,
        variant: 'quiet',
        size: 'sm',
        className: 'lp-notice-dismiss',
        dataAttrs: { 'lp-notice-dismiss': 'true' },
      })
    : '';

  return `<div class="${escapeHtml(classes)}" role="${role}" aria-live="${role === 'alert' ? 'assertive' : 'polite'}"${idAttr}${hiddenAttr}>
  <div class="lp-notice-main">
    ${toneIcon}
    <div class="lp-notice-content">
      <span class="lp-notice-text">${escapeHtml(props.message)}</span>
      ${props.actionHtml ?? ''}
    </div>
  </div>
  ${dismissBtn}
</div>`;
}

/**
 * Renders the single action status line directly under the editor action bar,
 * with tone icon and optional real-countdown link-style Undo control (D-FOUND-6).
 */
export function renderStatusLine(props: StatusLineProps): string {
  const tone = props.tone ?? 'info';
  const role = props.role ?? (tone === 'danger' ? 'alert' : 'status');
  const classes = ['lp-status-line', `lp-status-line-${tone}`, props.className].filter(Boolean).join(' ');
  const message = props.message ?? '';
  const toneIcon = message ? renderIcon({ name: TONE_ICONS[tone], size: 16, className: 'lp-status-icon' }) : '';

  let undoBtn = '';
  if (props.undoLabel && props.undoSeconds && props.undoSeconds > 0) {
    undoBtn = `<button type="button" class="lp-status-undo lp-status-undo-link" data-lp-status-undo="true">${escapeHtml(`${props.undoLabel} (${props.undoSeconds}s)`)}</button>`;
  }

  return `<div id="${escapeHtml(props.id)}" class="${escapeHtml(classes)}" role="${role}" aria-live="${role === 'alert' ? 'assertive' : 'polite'}" aria-atomic="true">
  ${toneIcon}
  <span class="lp-status-line-text">${escapeHtml(message)}</span>
  ${undoBtn}
</div>`;
}
