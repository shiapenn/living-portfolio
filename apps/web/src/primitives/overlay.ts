import { escapeHtml } from '../lib/html.js';
import { renderIconButton } from './button.js';

export type OverlayKind = 'actions' | 'panel' | 'push-panel' | 'dialog';

export interface OverlayProps {
  id: string;
  kind: OverlayKind;
  title: string;
  labelledBy?: string;
  bodyHtml: string;
  footerHtml?: string;
  open?: boolean;
  className?: string;
}

/**
 * Unified Overlay primitive (D-COMP #7):
 * - actions: popover anchored to trigger >= 640px, bottom sheet at full width < 640px
 * - panel: full-screen panel (>8 destinations or search)
 * - dialog: modal dialog for decisions and forms (Publish, Delete)
 * - Role & labelling, Esc closes, focus trap in dialogs/sheets, focus returns to trigger, 160ms enter/exit
 */
export function renderOverlay(props: OverlayProps): string {
  const hiddenAttr = props.open ? '' : ' hidden';
  const kindClass = `lp-overlay-${props.kind}`;
  const roleAttr = props.kind === 'actions' ? 'dialog' : 'dialog';
  const modalAttr = props.kind === 'actions' ? 'false' : 'true';
  const titleId = props.labelledBy ?? `${props.id}-title`;
  const classes = ['lp-overlay', kindClass, props.className].filter(Boolean).join(' ');

  return `<div id="${escapeHtml(props.id)}" data-c="Overlay" class="${escapeHtml(classes)}" role="${roleAttr}" aria-modal="${modalAttr}" aria-labelledby="${escapeHtml(titleId)}" data-overlay-kind="${escapeHtml(props.kind)}"${hiddenAttr}>
  <div class="lp-overlay-backdrop" data-overlay-close="true"></div>
  <div class="lp-overlay-surface">
    <div class="lp-overlay-header">
      <h2 id="${escapeHtml(titleId)}" class="lp-overlay-title">${escapeHtml(props.title)}</h2>
      ${renderIconButton({
        ariaLabel: `Close ${props.title}`,
        icon: 'close',
        iconSize: 16,
        variant: 'quiet',
        className: 'lp-overlay-close',
        dataAttrs: { 'overlay-close': 'true' },
      })}
    </div>
    <div class="lp-overlay-body">${props.bodyHtml}</div>
    ${props.footerHtml ? `<div class="lp-overlay-footer">${props.footerHtml}</div>` : ''}
  </div>
</div>`;
}
