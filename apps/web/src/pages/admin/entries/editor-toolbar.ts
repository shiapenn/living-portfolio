import { resolveEntrySection } from '@living-portfolio/core';
import { escapeHtml } from '../../../lib/html.js';
import {
  renderButton,
  renderIcon,
  renderIconButton,
  renderStatusDot,
} from '../../../primitives/index.js';
import { renderStatusLine } from '../../../components/index.js';
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';
import type { ReferenceEditorEntry, ReferenceEntryVisibility } from './editor.js';

export function formatVisibilityLabel(vis: ReferenceEntryVisibility): string {
  return EDITOR_STRINGS.states[vis];
}

function visibilityTone(vis: ReferenceEntryVisibility): 'ok' | 'warn' | 'neutral' {
  if (vis === 'public') return 'ok';
  if (vis === 'unlisted') return 'warn';
  return 'neutral';
}

function formatDateSummary(isoDate: string): string {
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDetailsMeta(entry: ReferenceEditorEntry): string {
  const section = resolveEntrySection(entry.profile, { slug: entry.slug });
  const dateStr = formatDateSummary(entry.date);
  const temporalStr = EDITOR_STRINGS.temporalShort[entry.temporalConfidence] ?? 'Exact';
  const profileStr = EDITOR_STRINGS.profileShort[entry.profile] ?? 'Freeform';
  return `${section.label} · ${profileStr} · ${dateStr} · ${temporalStr}`;
}

function renderVisibilityMenuItem(
  vis: ReferenceEntryVisibility,
  current: ReferenceEntryVisibility,
  label: string
): string {
  const checked = vis === current;
  return `<button type="button" role="menuitemradio" aria-checked="${checked ? 'true' : 'false'}" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item lp-menu-item-vis" data-vis="${vis}"><span class="lp-menu-check">${renderIcon({ name: 'check-circle', size: 16 })}</span><span>${escapeHtml(label)}</span></button>`;
}

export function renderEditorToolbar(
  entry: ReferenceEditorEntry,
  statusMessage: string,
  statusTone: 'info' | 'ok' | 'warn' | 'danger'
): string {
  const isDraft = entry.visibility === 'draft';
  const saveLabel = 'Save';
  const historyHref = entry.id && entry.id !== 'new' ? `/admin/entries/${encodeURIComponent(entry.id)}/history` : '#';

  return `<div id="ref-editor-toolbar" class="lp-editor-toolbar" role="toolbar" aria-label="Editor toolbar">
  <div class="lp-editor-toolbar-left">
    ${renderIconButton({
      id: 'ref-sidebar-toggle',
      ariaLabel: 'Toggle entries list',
      title: 'Entries',
      icon: 'sidebar',
      iconSize: 16,
      variant: 'quiet',
      size: 'sm',
      dataAttrs: { 'aria-expanded': 'false', 'aria-controls': 'ref-entries-drawer' },
    })}
  </div>
  <div class="lp-editor-toolbar-center">
    ${renderIconButton({ id: 'ref-fmt-heading', ariaLabel: 'Heading', title: 'Heading', icon: 'heading', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'heading' } })}
    ${renderIconButton({ id: 'ref-fmt-bold', ariaLabel: 'Bold', title: 'Bold (Ctrl+B)', icon: 'bold', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'bold' } })}
    ${renderIconButton({ id: 'ref-fmt-italic', ariaLabel: 'Italic', title: 'Italic (Ctrl+I)', icon: 'italic', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'italic' } })}
    ${renderIconButton({ id: 'ref-fmt-link', ariaLabel: 'Link', title: 'Link', icon: 'link', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'link' } })}
    ${renderIconButton({ id: 'ref-fmt-bullet', ariaLabel: 'Bullet list', title: 'Bullet list', icon: 'list', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'list' } })}
    ${renderIconButton({ id: 'ref-fmt-quote', ariaLabel: 'Quote', title: 'Quote', icon: 'quote', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'quote' } })}
    ${renderIconButton({ id: 'ref-fmt-code', ariaLabel: 'Code block', title: 'Code block', icon: 'code', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { format: 'code' } })}
    ${renderIconButton({ id: 'ref-btn-source-toggle', ariaLabel: 'Markdown source', title: 'Markdown source', icon: 'source', iconSize: 16, variant: 'quiet', size: 'sm', dataAttrs: { 'aria-pressed': 'false', format: 'source' } })}
  </div>
  <div class="lp-editor-toolbar-right">
    <div id="ref-visibility-menu-wrap" class="lp-menu-wrap">
      <button type="button" id="ref-visibility-menu-btn" class="lp-btn lp-btn-quiet lp-btn-sm" aria-haspopup="menu" aria-expanded="false" aria-controls="ref-visibility-menu">
        ${renderStatusDot({ label: formatVisibilityLabel(entry.visibility), tone: visibilityTone(entry.visibility) })}
      </button>
      <div id="ref-visibility-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.actions.visibility)}" hidden>
        ${renderVisibilityMenuItem('draft', entry.visibility, EDITOR_STRINGS.visibilityMenu.draft)}
        ${renderVisibilityMenuItem('unlisted', entry.visibility, EDITOR_STRINGS.visibilityMenu.unlisted)}
        ${renderVisibilityMenuItem('public', entry.visibility, EDITOR_STRINGS.visibilityMenu.public)}
        <hr class="lp-menu-separator" role="separator" />
        <button type="button" role="menuitem" id="ref-btn-publish" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item${isDraft ? '' : ' lp-is-hidden'}">${escapeHtml(EDITOR_STRINGS.actions.publish)}</button>
      </div>
    </div>
    <a id="ref-btn-history" href="${escapeHtml(historyHref)}" class="lp-icon-btn lp-icon-btn-quiet lp-icon-btn-sm" aria-label="History" title="History">${renderIcon('clock', 16)}</a>
    ${renderIconButton({
      id: 'ref-btn-structure',
      ariaLabel: 'Structure',
      title: 'Structure',
      icon: 'layers',
      iconSize: 16,
      variant: 'quiet',
      size: 'sm',
      dataAttrs: { 'aria-expanded': 'false', 'aria-controls': 'ref-inspector-pane' },
    })}
    <div class="lp-menu-wrap">
      ${renderIconButton({
        id: 'ref-more-menu-btn',
        ariaLabel: EDITOR_STRINGS.actions.more,
        title: EDITOR_STRINGS.actions.more,
        icon: 'more-horizontal',
        iconSize: 16,
        variant: 'quiet',
        size: 'sm',
      })}
      <div id="ref-more-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="${escapeHtml(EDITOR_STRINGS.actions.more)}" hidden>
        <button type="button" role="menuitem" id="ref-more-source" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item lp-mobile-only-menu-item" tabindex="0">Markdown source</button>
        <button type="button" role="menuitem" id="ref-more-delete" class="lp-btn lp-btn-danger lp-btn-sm lp-menu-item lp-menu-item-danger" tabindex="0">${escapeHtml(EDITOR_STRINGS.actions.deleteEntry)}</button>
      </div>
    </div>
    ${renderButton({ id: 'ref-btn-save', label: saveLabel, variant: 'primary', size: 'sm' })}
    <div class="lp-editor-toolbar-status">
      ${renderStatusLine({
        id: 'ref-status-line',
        message: statusMessage,
        tone: statusTone,
      })}
    </div>
  </div>
</div>`;
}
