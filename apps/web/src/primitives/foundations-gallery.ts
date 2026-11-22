import { STRATA_DESIGN_SYSTEM_CSS } from '../styles.js';
import {
  COMPONENT_TOKEN_VALUES,
  PRIMITIVE_VALUES,
  SEMANTIC_DARK_VALUES,
  SEMANTIC_LIGHT_VALUES,
  TYPE_ROLES,
} from '../tokens/index.js';
import { LUCIDE_ICON_NAMES, renderIcon, renderIconSprite } from './icons.js';
import { renderButton, renderIconButton } from './button.js';
import { renderBadge, renderChip, renderStatusDot } from './chip.js';
import { renderField } from './field.js';
import { renderItem } from './item.js';
import { renderSectionHeader } from './section-header.js';
import { renderText } from './text.js';
import { renderSwitch } from './switch.js';
import { renderPageNotice, renderStatusLine } from '../components/feedback.js';
import {
  renderDialog,
  renderDisclosure,
  renderDrawer,
  renderEmptyState,
  renderMenu,
} from '../components/containers.js';

export { LUCIDE_ICON_NAMES, renderIcon, renderIconSprite } from './icons.js';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function computeHexContrastRatio(fgHex: string, bgHex: string): string {
  const l1 = relativeLuminance(hexToRgb(fgHex));
  const l2 = relativeLuminance(hexToRgb(bgHex));
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return `${ratio.toFixed(1)}:1`;
}

const ROLE_PALETTES = {
  light: {
    surface: SEMANTIC_LIGHT_VALUES['--lp-color-surface-page'],
    text: SEMANTIC_LIGHT_VALUES['--lp-color-text-1'],
    borderControl: SEMANTIC_LIGHT_VALUES['--lp-color-border-control'],
    focusRing: SEMANTIC_LIGHT_VALUES['--lp-color-accent-focus-ring'],
    roles: {
      action: { label: 'Action Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-action-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-action-bg'] },
      neutral: { label: 'Neutral Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-neutral-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-neutral-bg'] },
      success: { label: 'Success Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-success-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-success-bg'] },
      warning: { label: 'Warning Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-warning-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-warning-bg'] },
      danger: { label: 'Danger Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-danger-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-danger-bg'] },
      info: { label: 'Info Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-info-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-info-bg'] },
    },
  },
  dark: {
    surface: SEMANTIC_DARK_VALUES['--lp-color-surface-l1'],
    text: SEMANTIC_DARK_VALUES['--lp-color-text-1'],
    borderControl: SEMANTIC_DARK_VALUES['--lp-color-border-control'],
    focusRing: SEMANTIC_DARK_VALUES['--lp-color-accent-focus-ring'],
    roles: {
      action: { label: 'Action Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-action-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-action-bg'] },
      neutral: { label: 'Neutral Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-neutral-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-neutral-bg'] },
      success: { label: 'Success Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-success-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-success-bg'] },
      warning: { label: 'Warning Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-warning-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-warning-bg'] },
      danger: { label: 'Danger Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-danger-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-danger-bg'] },
      info: { label: 'Info Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-info-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-info-bg'] },
    },
  },
} as const;

function renderDetailsFields(prefix: string, visibilityValue: 'draft' | 'unlisted' | 'public' = 'draft'): string {
  return `<div class="lp-details-grid">
    ${renderField({
      kind: 'input',
      id: `${prefix}-slug`,
      name: `${prefix}_slug`,
      label: 'URL slug',
      value: 'deterministic-sqlite-migrations',
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-profile`,
      name: `${prefix}_profile`,
      label: 'Role profile',
      value: 'case-study',
      options: [
        { value: 'case-study', label: 'Case Study — Architecture & Trade-offs' },
        { value: 'decision', label: 'Decision Record — Context & Consequences' },
        { value: 'build-note', label: 'Build Note — Implementation & Benchmarks' },
        { value: 'freeform', label: 'Freeform Essay — Longform Reading' },
      ],
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-visibility`,
      name: `${prefix}_visibility`,
      label: 'Visibility',
      value: visibilityValue,
      options: [
        { value: 'draft', label: 'Draft — Private to workspace' },
        { value: 'unlisted', label: 'Unlisted — Anyone with the signed link' },
        { value: 'public', label: 'Public — Listed on portfolio & timeline' },
      ],
    })}
    ${renderField({
      kind: 'input',
      inputType: 'date',
      id: `${prefix}-date`,
      name: `${prefix}_date`,
      label: 'Entry date',
      value: '2026-11-14',
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-temporal`,
      name: `${prefix}_temporal`,
      label: 'Temporal confidence',
      value: 'exact',
      options: [
        { value: 'exact', label: 'Exact date (day precision)' },
        { value: 'estimated', label: 'Estimated month or quarter' },
        { value: 'range', label: 'Date range (start to end)' },
        { value: 'hindsight', label: 'Retrospective hindsight note' },
      ],
    })}
  </div>`;
}

function renderEntryListRows(
  state: string,
  items: Array<{ title: string; badge: string; tone: 'neutral' | 'warn' | 'ok'; active?: boolean }>
): string {
  if (items.length === 0) return '';
  return `<div class="lp-gallery-stack" data-entry-rows="${state}">
    ${items
      .map(
        (item) => `<div class="lp-entry-row${item.active ? ' lp-entry-row-active' : ''}">
      <span>${item.title}</span>
      ${renderBadge({ label: item.badge, tone: item.tone })}
    </div>`
      )
      .join('')}
  </div>`;
}

export function renderFoundationsGalleryPage(theme: 'light' | 'dark' = 'light'): string {
  const palette = ROLE_PALETTES[theme];
  const themeToggleIcon = theme === 'light' ? 'moon' : 'sun';
  const themeToggleLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  const headerHtml = `<header class="lp-admin-header" role="banner">
  <span class="lp-admin-header-brand">Living Portfolio Admin</span>
  <nav class="lp-admin-header-nav" aria-label="Admin navigation">
    <a href="/admin" class="lp-admin-header-link" aria-current="page">Entries</a>
    <a href="/admin/import" class="lp-admin-header-link">Import</a>
    <a href="/admin/settings" class="lp-admin-header-link">Settings</a>
    <a href="/home" class="lp-admin-header-link">View public site</a>
  </nav>
  <div class="lp-admin-header-actions">
    ${renderIconButton({
      id: 'foundations-theme-toggle',
      ariaLabel: themeToggleLabel,
      title: themeToggleLabel,
      icon: themeToggleIcon,
      iconSize: 20,
      variant: 'secondary',
    })}
    ${renderButton({
      id: 'foundations-signout-btn',
      label: 'Sign out',
      variant: 'quiet',
      size: 'sm',
      className: 'lp-admin-header-desktop-only',
    })}
    ${renderIconButton({
      id: 'foundations-menu-btn',
      ariaLabel: 'Open workspace menu',
      title: 'Open workspace menu',
      icon: 'menu',
      iconSize: 20,
      variant: 'secondary',
      className: 'lp-admin-header-mobile-only',
    })}
  </div>
</header>`;

  const roleSwatchesHtml = (
    Object.entries(palette.roles) as Array<
      [keyof typeof palette.roles, { label: string; fg: string; bg: string }]
    >
  )
    .map(([roleKey, role]) => {
      const ratio = computeHexContrastRatio(role.fg, role.bg);
      return `<div class="lp-specimen-swatch lp-specimen-swatch-${roleKey}" data-contrast-role="${roleKey}">
        <span>${role.label}</span>
        <strong data-contrast-value="${roleKey}">${ratio}</strong>
      </div>`;
    })
    .join('');

  const surfaceTextRatio = computeHexContrastRatio(palette.text, palette.surface);
  const borderRatio = computeHexContrastRatio(palette.borderControl, palette.surface);
  const focusRatio = computeHexContrastRatio(palette.focusRing, palette.surface);

  const spacingSteps = [4, 8, 12, 16, 24, 32, 48, 64] as const;
  const spacingBarsHtml = spacingSteps
    .map(
      (px) => `<div class="lp-spacing-bar-row" data-spacing-specimen="${px}">
      <span class="lp-type-caption">${px}px</span>
      <span class="lp-spacing-bar lp-spacing-bar-${px}" aria-hidden="true"></span>
    </div>`
    )
    .join('');

  const iconInventoryHtml = LUCIDE_ICON_NAMES.map(
    (iconName) => `<span class="lp-icon-inventory-item" data-icon-specimen="${iconName}">
      ${renderIcon({ name: iconName, size: 16 })}
      <span>${iconName}</span>
    </span>`
  ).join('');

  const specimensHtml = `<section id="foundations-specimens" class="lp-foundations-grid" aria-label="Design foundation specimens">
  <div class="lp-card">
    <h2>Shape, Radii, Elevation &amp; Borders (D-FOUND-2)</h2>
    <div class="lp-gallery-row">
      ${renderButton({ label: 'Control 8px', variant: 'secondary', size: 'sm' })}
      <span id="specimen-radius-container" class="lp-specimen-box-container">Container 12px (Flat)</span>
      <span id="specimen-radius-overlay" class="lp-specimen-box-overlay">Overlay 16px (Raised)</span>
      ${renderBadge({ label: 'Pill 999px (0px border)', tone: 'action' })}
      ${renderChip({ label: 'Chip 999px (1px border)', interactive: true, selected: true })}
    </div>
    <div class="lp-card-section">
      <h3>Surface &amp; Border Tokens</h3>
      <div class="lp-specimen-surface-row">
        <span class="lp-specimen-surface-chip lp-surface-chip-page">--surface-page</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-raised">--surface-raised + --border-subtle</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-subtle">--surface-subtle</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-control-border">--border-control (&ge; 3:1)</span>
      </div>
    </div>
    <div class="lp-card-section">
      <h3>Icon Sizes (16 / 20 / 24 px) &amp; Sprite Inventory (D-FOUND-1)</h3>
      <div class="lp-gallery-row">
        <span>16px ${renderIcon({ name: 'info', size: 16 })}</span>
        <span>20px ${renderIcon({ name: 'moon', size: 20 })}</span>
        <span>24px ${renderIcon({ name: 'layers', size: 24 })}</span>
      </div>
      <div id="foundations-icon-inventory" class="lp-icon-inventory-grid">
        ${iconInventoryHtml}
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Type Scale &amp; Spacing Bars (D-FOUND-3, D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      <span class="lp-type-page-title">Page Title — 28/36 Semibold (600)</span>
      <span class="lp-type-title">Section Title — 20/28 Semibold (600)</span>
      <span class="lp-type-body">Body — 16/24 Regular (400)</span>
      <span class="lp-type-body-sm">Body Small / Label — 14/20 Medium (500)</span>
      <span class="lp-type-caption">Caption — 12/16 Regular (400)</span>
    </div>
    <div class="lp-card-section">
      <h3>4 px Spacing Scale Bars</h3>
      <div id="foundations-spacing-bars" class="lp-gallery-stack">
        ${spacingBarsHtml}
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Colour Roles &amp; Computed Contrast Ratios (D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      ${roleSwatchesHtml}
      <div id="contrast-probe-control" class="lp-contrast-probe" data-contrast-role="surface-text">
        <div>Surface Text Contrast: <strong id="contrast-probe-text-val">${surfaceTextRatio}</strong></div>
        <div>Control Boundary (--border-control): <strong id="contrast-probe-border-val">${borderRatio}</strong></div>
        <div>Focus Ring (--focus-ring): <strong id="contrast-probe-focus-val">${focusRatio}</strong></div>
      </div>
    </div>
  </div>
</section>`;

  const componentsHtml = `<section id="foundations-components" class="lp-gallery" aria-label="Component states gallery">
  <div class="lp-card">
    <h2>Buttons, Captioned Icon Buttons &amp; Tooltips (D-FOUND-1, D-FOUND-2, D-FOUND-5)</h2>
    <div class="lp-gallery-row">
      ${renderButton({ id: 'gal-btn-default', label: 'Primary Default', variant: 'primary' })}
      ${renderButton({ id: 'gal-btn-hover', label: 'Primary Hover', variant: 'primary', className: 'is-hover' })}
      ${renderButton({ id: 'gal-btn-focus', label: 'Primary Focus', variant: 'primary', className: 'is-focus-visible' })}
      ${renderButton({ id: 'gal-btn-active', label: 'Primary Active', variant: 'primary', className: 'is-active' })}
      ${renderButton({ id: 'gal-btn-loading', label: 'Saving…', variant: 'primary', loading: true, disabledReason: 'Save in progress' })}
      <div id="gal-disabled-tooltip-wrap" class="lp-tooltip-wrap is-tooltip-open" tabindex="0" aria-describedby="gal-disabled-tooltip">
        ${renderButton({ id: 'gal-btn-disabled', label: 'Publish', variant: 'primary', disabled: true, disabledReason: 'Run privacy scan before publishing' })}
        <span id="gal-disabled-tooltip" role="tooltip" class="lp-tooltip-bubble">Run privacy scan before publishing</span>
      </div>
    </div>
    <div class="lp-card-section">
      <div class="lp-gallery-row">
        ${renderButton({ label: 'Secondary Outlined', variant: 'secondary' })}
        ${renderButton({ label: 'Quiet Ghost', variant: 'quiet' })}
        ${renderButton({ label: 'Quiet Hover', variant: 'quiet', className: 'is-hover' })}
        ${renderButton({ label: 'Danger Outlined', variant: 'danger' })}
        ${renderButton({ label: 'Confirm Delete', variant: 'danger', className: 'lp-btn-danger-confirm' })}
      </div>
    </div>
    <div class="lp-card-section">
      <h3>Captioned Icon Button States &amp; Hover/Focus Tooltip</h3>
      <div class="lp-gallery-row">
        <div class="lp-specimen-captioned" data-icon-btn-caption="Ghost Default">
          ${renderIconButton({ id: 'gal-ibtn-ghost', ariaLabel: 'Dismiss item', icon: 'x', iconSize: 16, variant: 'quiet' })}
          <span class="lp-type-caption">Ghost Default</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Ghost Hover">
          ${renderIconButton({ id: 'gal-ibtn-ghost-hover', ariaLabel: 'More actions', icon: 'more-horizontal', iconSize: 16, variant: 'quiet', className: 'is-hover' })}
          <span class="lp-type-caption">Ghost Hover</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Ghost Focus">
          <div id="gal-icon-tooltip-wrap" class="lp-tooltip-wrap" aria-describedby="gal-icon-tooltip">
            ${renderIconButton({ id: 'gal-ibtn-ghost-focus', ariaLabel: 'Copy link', icon: 'copy', iconSize: 16, variant: 'quiet', className: 'is-focus-visible' })}
            <span id="gal-icon-tooltip" role="tooltip" class="lp-tooltip-bubble">Copy link</span>
          </div>
          <span class="lp-type-caption">Ghost Focus</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Ghost Active">
          ${renderIconButton({ id: 'gal-ibtn-ghost-active', ariaLabel: 'Copy markdown', icon: 'file-text', iconSize: 16, variant: 'quiet', className: 'is-active' })}
          <span class="lp-type-caption">Ghost Active</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Outlined Default">
          ${renderIconButton({ id: 'gal-ibtn-outlined', ariaLabel: themeToggleLabel, icon: themeToggleIcon, iconSize: 20, variant: 'secondary' })}
          <span class="lp-type-caption">Outlined Default</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Outlined Hover">
          ${renderIconButton({ id: 'gal-ibtn-outlined-hover', ariaLabel: 'Open menu', icon: 'menu', iconSize: 20, variant: 'secondary', className: 'is-hover' })}
          <span class="lp-type-caption">Outlined Hover</span>
        </div>
        <div class="lp-specimen-captioned" data-icon-btn-caption="Ghost Disabled">
          <div class="lp-tooltip-wrap" tabindex="0" aria-describedby="gal-ibtn-disabled-tooltip">
            ${renderIconButton({ id: 'gal-ibtn-disabled', ariaLabel: 'Copy preview link', icon: 'copy', iconSize: 16, variant: 'quiet', disabled: true, disabledReason: 'Save entry first to generate link' })}
            <span id="gal-ibtn-disabled-tooltip" role="tooltip" class="lp-tooltip-bubble">Save entry first to generate link</span>
          </div>
          <span class="lp-type-caption">Ghost Disabled</span>
        </div>
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Badges, Chips, Status Dots &amp; Switches (D-FOUND-2, D-FOUND-5)</h2>
    <div class="lp-gallery-row">
      ${renderBadge({ label: 'Draft', tone: 'neutral' })}
      ${renderBadge({ label: 'Public', tone: 'ok' })}
      ${renderBadge({ label: 'Unlisted', tone: 'warn' })}
      ${renderBadge({ label: 'Blocked', tone: 'danger' })}
      ${renderBadge({ label: 'Synced', tone: 'info' })}
      ${renderBadge({ label: '3', tone: 'action' })}
    </div>
    <div class="lp-card-section">
      <div class="lp-gallery-row">
        ${renderChip({ label: 'Architecture', state: 'confirmed', interactive: true, selected: true })}
        ${renderChip({ label: 'Observability', state: 'confirmed', interactive: true, selected: false })}
        ${renderChip({ label: 'Suggested: Systems', state: 'suggested', interactive: true, selected: false })}
        ${renderChip({ label: 'Locked Tag', state: 'confirmed', interactive: true, disabled: true, title: 'Tag locked while publishing' })}
      </div>
    </div>
    <div class="lp-card-section">
      <div class="lp-gallery-row">
        ${renderStatusDot({ label: 'All checks passed', tone: 'ok' })}
        ${renderStatusDot({ label: 'Review suggested', tone: 'warn' })}
        ${renderStatusDot({ label: 'PII detected', tone: 'danger' })}
        ${renderSwitch({ id: 'gal-switch-on', label: 'Include in timeline', checked: true })}
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Fields (Input, Select, Checkbox, Radio, Auto-Grow Textarea) &amp; Details Disclosure (D-FOUND-4, D-FOUND-6)</h2>
    <div class="lp-gallery-stack">
      ${renderField({
        kind: 'input',
        id: 'gal-field-default',
        name: 'title_default',
        label: 'Entry title (Default)',
        value: 'Migrating the event log to SQLite',
        help: 'Shown as the main heading on the public entry.',
      })}
      ${renderField({
        kind: 'input',
        id: 'gal-field-error',
        name: 'title_error',
        label: 'Entry title (Error)',
        value: '',
        required: true,
        error: 'Enter a title to save this entry.',
      })}
      ${renderField({
        kind: 'select',
        id: 'gal-field-select',
        name: 'role_profile_specimen',
        label: 'Role profile (Select)',
        value: 'case-study',
        options: [
          { value: 'case-study', label: 'Case Study — Architecture & Trade-offs' },
          { value: 'decision', label: 'Decision Record — Context & Consequences' },
          { value: 'build-note', label: 'Build Note — Implementation & Benchmarks' },
        ],
      })}
      ${renderField({
        kind: 'checkbox',
        id: 'gal-field-checkbox',
        name: 'hindsight_specimen',
        label: 'Mark as retrospective hindsight note (Checkbox)',
        checked: true,
      })}
      ${renderField({
        kind: 'radio',
        id: 'gal-field-radio',
        name: 'precision_specimen',
        label: 'Exact day precision (Radio)',
        value: 'exact',
        checked: true,
      })}
      ${renderField({
        kind: 'textarea',
        id: 'gal-field-reading',
        name: 'body_reading',
        label: 'Entry body (Reading face at public measure, min 6 rows, auto-grows)',
        value: 'The writing surface uses the public serif reading face at 16/24 and reading measure.\nIt starts at a minimum of 6 rows and grows automatically with content so text is never clipped at 1280 px or 320 px.',
        rows: 6,
        className: 'lp-writing-surface-field',
      })}
    </div>
    <div class="lp-card-section" data-specimen-group="status-ok">
      <h3>StatusLine Specimen A — Success with Live Undo Countdown</h3>
      ${renderStatusLine({
        id: 'gal-status-ok',
        tone: 'ok',
        message: 'Entry unlist complete.',
        undoLabel: 'Undo',
        undoSeconds: 8,
      })}
    </div>
    <div class="lp-card-section" data-specimen-group="status-error">
      <h3>StatusLine Specimen B — Validation Error (Single Active Message)</h3>
      ${renderStatusLine({
        id: 'gal-status-err',
        tone: 'danger',
        message: 'Enter a title to save this entry.',
      })}
    </div>
    ${renderDisclosure({
      id: 'gal-disclosure-closed',
      summary: 'Revision history (Closed Disclosure specimen)',
      summaryMeta: '3 revisions',
      open: false,
      bodyHtml: '<p>Revision snapshots are listed here when expanded.</p>',
    })}
    ${renderDisclosure({
      id: 'gal-disclosure',
      summary: 'Details',
      summaryMeta: '14 Nov 2026 · Exact date · Case Study',
      open: true,
      bodyHtml: renderDetailsFields('gal-details', 'draft'),
    })}
  </div>

  <div class="lp-preview-main-col">
    <h2>Whole-Page Notices, Open Menu, EmptyState &amp; Open Dialog (D-FOUND-2, D-FOUND-6)</h2>
    <div data-specimen-group="notice-info">
      <h3>Page Notice Specimen A — Offline Info</h3>
      ${renderPageNotice({
        id: 'gal-notice-info',
        tone: 'info',
        message: 'Working offline — changes are queued locally until connection returns.',
        dismissible: true,
      })}
    </div>
    <div data-specimen-group="notice-warn">
      <h3>Page Notice Specimen B — Session Warning with Link-Style Action</h3>
      ${renderPageNotice({
        id: 'gal-notice-warn',
        tone: 'warn',
        message: 'Your admin session expires in 5 minutes.',
        actionLabel: 'Extend session',
        actionId: 'gal-notice-extend',
        dismissible: true,
      })}
    </div>
    <div data-specimen-group="menu-open">
      <h3>Open Menu Specimen (Items + Separated Danger Item Last)</h3>
      ${renderMenu({
        id: 'gal-menu',
        triggerLabel: 'More actions',
        open: true,
        items: [
          { id: 'gal-menu-copy', label: 'Copy preview link' },
          { id: 'gal-menu-unlist', label: 'Unlist entry' },
          { id: 'gal-menu-delete', label: 'Delete entry…', danger: true },
        ],
      })}
    </div>
    <div data-specimen-group="empty-state">
      <h3>EmptyState Specimen</h3>
      ${renderEmptyState({
        id: 'gal-empty-state',
        title: 'No entries match this filter',
        body: 'Clear the active tag filter or start a new draft.',
        actionHtml: renderButton({ label: 'Clear filter', variant: 'primary' }),
      })}
    </div>
    <div data-specimen-group="dialog-open">
      <h3>Open Dialog Specimen (16 px Overlay Radius, Raised Elevation, Focus Trap &amp; Esc Close)</h3>
      ${renderDialog({
        id: 'gal-dialog-specimen',
        title: 'Delete entry permanently?',
        open: true,
        className: 'lp-modal-inline-stage',
        bodyHtml: '<p>This entry will be removed from your portfolio. You can undo within 8 seconds.</p>',
        footerHtml: `${renderButton({ id: 'gal-dialog-cancel', label: 'Cancel', variant: 'secondary' })}${renderButton({ id: 'gal-dialog-confirm', label: 'Delete entry', variant: 'danger', className: 'lp-btn-danger-confirm' })}`,
      })}
    </div>
  </div>

  ${renderDrawer({
    id: 'gal-drawer-specimen',
    title: 'Publish readiness check',
    open: false,
    bodyHtml: '<p>No personal identifiers or secrets found.</p>',
  })}
</section>`;

  const renderFullEditorSpecimen = (opts: {
    state: 'draft' | 'error' | 'unlisted' | 'public';
    heading: string;
    badgeLabel: string;
    badgeTone: 'neutral' | 'warn' | 'ok';
    titleId: string;
    titleValue: string;
    titleError?: string;
    bodyValue: string;
    statusTone: 'info' | 'ok' | 'danger';
    statusMsg: string;
    undoLabel?: string;
    undoSeconds?: number;
    primaryLabel: string;
  }) => `<div class="lp-editor-canvas">
    <div class="lp-dialog-header">
      <strong>${opts.heading}</strong>
      ${renderBadge({ label: opts.badgeLabel, tone: opts.badgeTone })}
    </div>
    <div class="lp-editor-action-bar">
      <div class="lp-gallery-row">
        ${renderButton({ label: 'Save', variant: 'secondary', size: 'sm' })}
        ${renderButton({ label: opts.primaryLabel, variant: 'primary', size: 'sm' })}
      </div>
      ${renderIconButton({ ariaLabel: 'More entry actions', icon: 'more-horizontal', iconSize: 16, variant: 'quiet' })}
    </div>
    <div class="lp-status-line-slot">
      ${renderStatusLine({
        id: `preview-${opts.state}-status`,
        tone: opts.statusTone,
        message: opts.statusMsg,
        undoLabel: opts.undoLabel,
        undoSeconds: opts.undoSeconds,
      })}
    </div>
    ${renderField({
      kind: 'input',
      id: opts.titleId,
      name: `${opts.state}_title`,
      label: 'Title',
      value: opts.titleValue,
      required: true,
      error: opts.titleError,
    })}
    ${renderField({
      kind: 'textarea',
      id: `preview-${opts.state}-body`,
      name: `${opts.state}_body`,
      label: 'Body',
      value: opts.bodyValue,
      rows: 6,
      className: 'lp-writing-surface-field',
    })}
    ${renderDisclosure({
      id: `preview-${opts.state}-details`,
      summary: 'Details',
      summaryMeta: '14 Nov 2026 · Exact date · Case Study',
      open: false,
      bodyHtml: renderDetailsFields(`preview-${opts.state}`, opts.state === 'error' ? 'draft' : opts.state),
    })}
  </div>`;

  const states: Array<{
    state: 'empty' | 'first-run' | 'draft' | 'error' | 'unlisted' | 'public';
    count: string;
    listRowsHtml: string;
    mainHtml: string;
  }> = [
    {
      state: 'empty',
      count: '0',
      listRowsHtml: renderEntryListRows('empty', []),
      mainHtml: renderEmptyState({
        id: 'preview-empty-card',
        title: 'No entry selected',
        body: 'Choose an entry from the list or start a new draft.',
        actionHtml: renderButton({ label: 'Start a draft', variant: 'primary' }),
      }),
    },
    {
      state: 'first-run',
      count: '0',
      listRowsHtml: renderEntryListRows('first-run', []),
      mainHtml: renderEmptyState({
        id: 'preview-first-run-card',
        title: 'Write your first entry',
        body: 'Capture engineering decisions, trade-offs, and lessons learned while they are fresh.',
        guideSteps: [
          { title: 'Draft in private', body: 'Every entry starts as a private draft saved to your workspace.' },
          { title: 'Scan before publishing', body: 'Run the built-in privacy check before making an entry public.' },
        ],
        actionHtml: renderButton({ label: 'Start your first draft', variant: 'primary' }),
      }),
    },
    {
      state: 'draft',
      count: '1',
      listRowsHtml: renderEntryListRows('draft', [
        { title: 'Deterministic SQLite migrations', badge: 'Draft', tone: 'neutral', active: true },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'draft',
        heading: 'Draft Entry',
        badgeLabel: 'Draft',
        badgeTone: 'neutral',
        titleId: 'preview-draft-title',
        titleValue: 'Deterministic SQLite migrations',
        bodyValue: 'We replaced ad-hoc schema patches with a linear migration journal verified in CI.',
        statusTone: 'info',
        statusMsg: 'Draft saved just now.',
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'error',
      count: '1',
      listRowsHtml: renderEntryListRows('error', [
        { title: 'Untitled entry', badge: 'Draft', tone: 'neutral', active: true },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'error',
        heading: 'Untitled Entry',
        badgeLabel: 'Draft',
        badgeTone: 'neutral',
        titleId: 'preview-error-title',
        titleValue: '',
        titleError: 'Enter a title to save this entry.',
        bodyValue: 'Notes on bounding queue retry backoff under downstream saturation.',
        statusTone: 'danger',
        statusMsg: 'Enter a title to save this entry.',
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'unlisted',
      count: '2',
      listRowsHtml: renderEntryListRows('unlisted', [
        { title: 'Zero-downtime queue consumer', badge: 'Unlisted', tone: 'warn', active: true },
        { title: 'Deterministic SQLite migrations', badge: 'Draft', tone: 'neutral' },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'unlisted',
        heading: 'Shared via link',
        badgeLabel: 'Unlisted',
        badgeTone: 'warn',
        titleId: 'preview-unlisted-title',
        titleValue: 'Zero-downtime queue consumer',
        bodyValue: 'Draining in-flight leases cleanly before rotating worker processes.',
        statusTone: 'ok',
        statusMsg: 'Unlisted link active.',
        undoLabel: 'Undo',
        undoSeconds: 8,
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'public',
      count: '2',
      listRowsHtml: renderEntryListRows('public', [
        { title: 'Designing resilient webhook retries', badge: 'Public', tone: 'ok', active: true },
        { title: 'Zero-downtime queue consumer', badge: 'Unlisted', tone: 'warn' },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'public',
        heading: 'Published on portfolio',
        badgeLabel: 'Public',
        badgeTone: 'ok',
        titleId: 'preview-public-title',
        titleValue: 'Designing resilient webhook retries',
        bodyValue: 'Idempotency keys and dead-letter replay controls kept delivery above 99.98%.',
        statusTone: 'ok',
        statusMsg: 'Published to public timeline.',
        primaryLabel: 'Update public entry',
      }),
    },
  ];

  const layoutPreviewHtml = `<section id="foundations-layout-preview" class="lp-gallery" aria-label="Workspace state alignment preview">
  <h2>Single Admin Grid — 6-State Column Alignment (D-FOUND-3, D-FOUND-6)</h2>
  ${states
    .map(
      (s) => `<div class="lp-admin-split-preview" data-preview-state="${s.state}">
    <aside class="lp-preview-list-col" data-state-list="${s.state}" aria-label="Entries list (${s.state})">
      <div class="lp-preview-list-header">
        <strong>Entries</strong>
        ${renderBadge({ label: s.count, tone: 'neutral' })}
      </div>
      ${s.listRowsHtml}
    </aside>
    <div class="lp-preview-main-col" data-state-main="${s.state}">
      ${s.mainHtml}
    </div>
  </div>`
    )
    .join('')}
</section>`;

  const clientScript = `<script>
(function () {
  // 1. Auto-grow textareas without clipping text
  function autoGrow(el) {
    el.style.overflowY = 'hidden';
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = (el.scrollHeight + 4) + 'px';
    }
  }
  document.querySelectorAll('textarea[data-lp-autogrow]').forEach(function (ta) {
    autoGrow(ta);
    ta.addEventListener('input', function () { autoGrow(ta); });
  });

  // 2. Dialog focus-trap & Escape close
  var dialog = document.getElementById('gal-dialog-specimen');
  if (dialog) {
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.setAttribute('hidden', '');
        return;
      }
      if (e.key === 'Tab') {
        var focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled])'));
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    dialog.querySelectorAll('[data-lp-dialog-close], #gal-dialog-cancel').forEach(function (btn) {
      btn.addEventListener('click', function () { dialog.setAttribute('hidden', ''); });
    });
  }

  // 3. Open Menu keyboard navigation (ArrowDown, ArrowUp, Home, End, Escape)
  var menu = document.getElementById('gal-menu-popover');
  var menuTrigger = document.getElementById('gal-menu-trigger');
  if (menu) {
    menu.addEventListener('keydown', function (e) {
      var items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      var idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        menu.setAttribute('hidden', '');
        if (menuTrigger) {
          menuTrigger.setAttribute('aria-expanded', 'false');
          menuTrigger.focus();
        }
      }
    });
  }

  // 4. Live Undo countdown timer
  document.querySelectorAll('[data-lp-status-undo]').forEach(function (btn) {
    var secs = parseInt(btn.getAttribute('data-undo-seconds') || '8', 10);
    var label = btn.getAttribute('data-undo-label') || 'Undo';
    var timer = setInterval(function () {
      if (secs <= 1) {
        clearInterval(timer);
        return;
      }
      secs -= 1;
      btn.setAttribute('data-undo-seconds', String(secs));
      btn.textContent = label + ' (' + secs + 's)';
    }, 1000);
  });
})();
</script>`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design Foundations Gallery — Living Portfolio</title>
  <style>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body>
  ${renderIconSprite()}
  ${headerHtml}
  <main id="foundations-main" class="lp-foundations-page" data-foundations-scope="true">
    <header>
      <h1>Design Foundations Gallery</h1>
      <p>Authoritative specimen and interactive state reference for D-FOUND-1 through D-FOUND-6.</p>
    </header>
    ${specimensHtml}
    ${componentsHtml}
    ${layoutPreviewHtml}
  </main>
  ${clientScript}
</body>
</html>`;
}

export function renderFoundationsTokensSection(): string {
  return `<section id="gallery-foundations-tokens" class="lp-gallery-section" data-component="FoundationsTokens">
    ${renderSectionHeader({ title: 'Foundations: Design Token Tiers' })}
    ${renderText({ variant: 'description', text: 'Single-source three-tier tokens (Primitive, Semantic Light/Dark, Component) from packages/design-tokens/tokens.json.' })}
    <div class="lp-list">
      ${renderItem({
        id: 'gallery-tokens-colors',
        title: 'Semantic Colours (Light / Dark)',
        subtitle: `surface-l0: ${SEMANTIC_LIGHT_VALUES['--lp-color-surface-l0']} / ${SEMANTIC_DARK_VALUES['--lp-color-surface-l0']} · text-1: ${SEMANTIC_LIGHT_VALUES['--lp-color-text-1']} / ${SEMANTIC_DARK_VALUES['--lp-color-text-1']} · accent: ${SEMANTIC_LIGHT_VALUES['--lp-color-accent-default']} / ${SEMANTIC_DARK_VALUES['--lp-color-accent-default']}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-space',
        title: 'Space Scale',
        subtitle: Object.entries(PRIMITIVE_VALUES)
          .filter(([k]) => k.startsWith('--lp-prim-space-'))
          .map(([k, v]) => `${k.replace('--lp-prim-space-', '')}: ${v}`)
          .join(' · '),
      })}
      ${renderItem({
        id: 'gallery-tokens-type',
        title: 'Typography Roles (7 + control-label)',
        subtitle: Object.entries(TYPE_ROLES)
          .map(([role, spec]) => `${role}: ${spec.size}/${spec.weight} (${spec.lineHeight})`)
          .join(' · '),
      })}
      ${renderItem({
        id: 'gallery-tokens-radii',
        title: 'Radii & Elevations',
        subtitle: `r1: ${COMPONENT_TOKEN_VALUES['--lp-radius-r1']} · r2: ${COMPONENT_TOKEN_VALUES['--lp-radius-r2']} · e0: ${SEMANTIC_LIGHT_VALUES['--lp-elevation-e0']} · e1: ${SEMANTIC_LIGHT_VALUES['--lp-elevation-e1']} · e2: ${SEMANTIC_LIGHT_VALUES['--lp-elevation-e2']}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-motion',
        title: 'Motion Durations',
        subtitle: `fast: ${PRIMITIVE_VALUES['--lp-prim-motion-duration-fast']} · item: ${PRIMITIVE_VALUES['--lp-prim-motion-duration-item']} · base: ${PRIMITIVE_VALUES['--lp-prim-motion-duration-base']} · slow: ${PRIMITIVE_VALUES['--lp-prim-motion-duration-slow']}`,
      })}
    </div>
  </section>`;
}
