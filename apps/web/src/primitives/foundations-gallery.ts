import { STRATA_DESIGN_SYSTEM_CSS } from '../styles.js';
import { renderIcon, renderIconSprite } from './icons.js';
import { renderButton, renderIconButton } from './button.js';
import { renderBadge, renderChip, renderStatusDot } from './chip.js';
import { renderField } from './field.js';
import { renderSwitch } from './switch.js';
import { renderPageNotice, renderStatusLine } from '../components/feedback.js';
import {
  renderDialog,
  renderDisclosure,
  renderDrawer,
  renderEmptyState,
  renderMenu,
} from '../components/containers.js';

export { renderIcon, renderIconSprite } from './icons.js';

export function renderFoundationsGalleryPage(theme: 'light' | 'dark' = 'light'): string {
  const headerHtml = `<header class="lp-admin-header" role="banner">
  <span class="lp-admin-header-brand">Living Portfolio Admin</span>
  <div class="lp-admin-header-actions">
    ${renderIconButton({
      id: 'foundations-theme-toggle',
      ariaLabel: 'Switch colour theme',
      title: 'Switch colour theme',
      icon: 'sun-moon',
      iconSize: 20,
      variant: 'secondary',
    })}
    ${renderIconButton({
      id: 'foundations-menu-btn',
      ariaLabel: 'Open workspace menu',
      title: 'Open workspace menu',
      icon: 'menu',
      iconSize: 20,
      variant: 'secondary',
    })}
  </div>
</header>`;

  const specimensHtml = `<section id="foundations-specimens" class="lp-foundations-grid" aria-label="Design foundation specimens">
  <div class="lp-card">
    <h2>Shape &amp; Radii (D-FOUND-2)</h2>
    <div class="lp-gallery-row">
      ${renderButton({ label: 'Control 8px', variant: 'secondary', size: 'sm' })}
      ${renderBadge({ label: 'Pill 999px (Borderless)', tone: 'action' })}
      ${renderChip({ label: 'Chip 999px (1px Border)', interactive: true, selected: true })}
    </div>
    <div class="lp-card-section">
      <h3>Icon Sizes: 16 / 20 / 24 px (D-FOUND-1)</h3>
      <div class="lp-gallery-row">
        <span>16px ${renderIcon({ name: 'info', size: 16 })}</span>
        <span>20px ${renderIcon({ name: 'sun-moon', size: 20 })}</span>
        <span>24px ${renderIcon({ name: 'layers', size: 24 })}</span>
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Type Scale &amp; Spacing (D-FOUND-3, D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      <span class="lp-type-page-title">Page Title — 28/36 Semibold (600)</span>
      <span class="lp-type-title">Section Title — 20/28 Semibold (600)</span>
      <span class="lp-type-body">Body — 16/24 Regular (400)</span>
      <span class="lp-type-body-sm">Body Small / Label — 14/20 Medium (500)</span>
      <span class="lp-type-caption">Caption — 12/16 Regular (400)</span>
      <span class="lp-type-body-sm">Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 px</span>
    </div>
  </div>

  <div class="lp-card">
    <h2>Colour Roles &amp; Contrast Probes (D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      <div class="lp-specimen-swatch lp-specimen-swatch-action" data-contrast-role="action">
        <span>Action Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div class="lp-specimen-swatch lp-specimen-swatch-neutral" data-contrast-role="neutral">
        <span>Neutral Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div class="lp-specimen-swatch lp-specimen-swatch-success" data-contrast-role="success">
        <span>Success Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div class="lp-specimen-swatch lp-specimen-swatch-warning" data-contrast-role="warning">
        <span>Warning Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div class="lp-specimen-swatch lp-specimen-swatch-danger" data-contrast-role="danger">
        <span>Danger Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div class="lp-specimen-swatch lp-specimen-swatch-info" data-contrast-role="info">
        <span>Info Role (fg on bg &ge; 4.5:1)</span>
        <span>AA Pass</span>
      </div>
      <div id="contrast-probe-control" class="lp-contrast-probe" data-contrast-role="surface-text">
        Control Boundary &amp; Focus Ring Probe (&ge; 3.0:1)
      </div>
    </div>
  </div>
</section>`;

  const componentsHtml = `<section id="foundations-components" class="lp-gallery" aria-label="Component states gallery">
  <div class="lp-card">
    <h2>Buttons &amp; Icon Buttons — All Interactive States (D-FOUND-1, D-FOUND-2, D-FOUND-5)</h2>
    <div class="lp-gallery-row">
      ${renderButton({ id: 'gal-btn-default', label: 'Primary Default', variant: 'primary' })}
      ${renderButton({ id: 'gal-btn-hover', label: 'Primary Hover', variant: 'primary', className: 'is-hover' })}
      ${renderButton({ id: 'gal-btn-focus', label: 'Primary Focus', variant: 'primary', className: 'is-focus-visible' })}
      ${renderButton({ id: 'gal-btn-active', label: 'Primary Active', variant: 'primary', className: 'is-active' })}
      ${renderButton({ id: 'gal-btn-loading', label: 'Saving…', variant: 'primary', loading: true, disabledReason: 'Save in progress' })}
      ${renderButton({ id: 'gal-btn-disabled', label: 'Publish', variant: 'primary', disabled: true, disabledReason: 'Run privacy scan before publishing' })}
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
      <div class="lp-gallery-row">
        ${renderIconButton({ id: 'gal-ibtn-ghost', ariaLabel: 'Dismiss item', icon: 'x', iconSize: 16, variant: 'quiet' })}
        ${renderIconButton({ id: 'gal-ibtn-ghost-hover', ariaLabel: 'More actions', icon: 'more-horizontal', iconSize: 16, variant: 'quiet', className: 'is-hover' })}
        ${renderIconButton({ id: 'gal-ibtn-ghost-focus', ariaLabel: 'Copy link', icon: 'copy', iconSize: 16, variant: 'quiet', className: 'is-focus-visible' })}
        ${renderIconButton({ id: 'gal-ibtn-outlined', ariaLabel: 'Toggle theme', icon: 'sun-moon', iconSize: 20, variant: 'secondary' })}
        ${renderIconButton({ id: 'gal-ibtn-disabled', ariaLabel: 'Copy preview link', icon: 'copy', iconSize: 16, variant: 'quiet', disabled: true, disabledReason: 'Save entry first to generate link' })}
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
    <h2>Fields, Writing Surface, StatusLine &amp; Hairline Disclosure (D-FOUND-4, D-FOUND-6)</h2>
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
        error: 'Enter a title before saving this entry.',
      })}
      ${renderField({
        kind: 'textarea',
        id: 'gal-field-reading',
        name: 'body_reading',
        label: 'Entry body (Reading face at public measure)',
        value: 'The writing surface uses the public serif reading face so line breaks and rhythm match what readers see.',
        rows: 3,
        className: 'lp-writing-surface-field',
      })}
      ${renderStatusLine({
        id: 'gal-status-ok',
        tone: 'ok',
        message: 'Entry unlist complete.',
        undoLabel: 'Undo',
        undoSeconds: 8,
      })}
      ${renderStatusLine({
        id: 'gal-status-err',
        tone: 'danger',
        message: 'Could not save entry — fix the highlighted field below.',
      })}
    </div>
    ${renderDisclosure({
      id: 'gal-disclosure',
      summary: 'Details',
      summaryMeta: '14 Nov 2026 · Exact · 2 tags',
      open: true,
      bodyHtml: '<p>Sections inside a card use a 1px hairline divider and a 16px rotating chevron, never a nested bordered box.</p>',
    })}
  </div>

  <div class="lp-gallery-stack">
    <h2>Whole-Page Notices, Menu, EmptyState &amp; Overlays (D-FOUND-6)</h2>
    ${renderPageNotice({
      id: 'gal-notice-info',
      tone: 'info',
      message: 'Working offline — changes are queued locally until connection returns.',
      dismissible: true,
    })}
    ${renderPageNotice({
      id: 'gal-notice-warn',
      tone: 'warn',
      message: 'Your admin session expires in 5 minutes.',
      actionHtml: renderButton({ label: 'Extend session', variant: 'secondary', size: 'sm' }),
      dismissible: true,
    })}
    ${renderMenu({
      id: 'gal-menu',
      triggerLabel: 'Workspace actions',
      open: false,
      items: [
        { id: 'gal-menu-export', label: 'Export Markdown' },
        { id: 'gal-menu-delete', label: 'Delete entry…', danger: true },
      ],
    })}
    ${renderEmptyState({
      id: 'gal-empty-state',
      title: 'No entries match this filter',
      body: 'Clear the active tag filter or start a new draft.',
      actionHtml: renderButton({ label: 'Clear filter', variant: 'primary' }),
    })}
  </div>

  ${renderDialog({
    id: 'gal-dialog-specimen',
    title: 'Delete entry permanently?',
    open: false,
    bodyHtml: '<p>This entry will be removed from your portfolio. You can undo within 8 seconds.</p>',
    footerHtml: `${renderButton({ label: 'Cancel', variant: 'secondary' })}${renderButton({ label: 'Delete entry', variant: 'danger', className: 'lp-btn-danger-confirm' })}`,
  })}
  ${renderDrawer({
    id: 'gal-drawer-specimen',
    title: 'Publish readiness check',
    open: false,
    bodyHtml: '<p>No personal identifiers or secrets found.</p>',
  })}
</section>`;

  const states: Array<{
    state: 'empty' | 'first-run' | 'draft' | 'error' | 'unlisted' | 'public';
    count: string;
    mainHtml: string;
  }> = [
    {
      state: 'empty',
      count: '0',
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
      mainHtml: `<div class="lp-editor-canvas">
        <div class="lp-dialog-header">
          <strong>Draft Entry</strong>
          ${renderBadge({ label: 'Draft', tone: 'neutral' })}
        </div>
        ${renderField({ kind: 'input', id: 'preview-draft-title', name: 'draft_title', label: 'Title', value: 'Deterministic SQLite migrations' })}
        ${renderStatusLine({ id: 'preview-draft-status', tone: 'info', message: 'Draft saved just now.' })}
      </div>`,
    },
    {
      state: 'error',
      count: '1',
      mainHtml: `<div class="lp-editor-canvas">
        <div class="lp-dialog-header">
          <strong>Untitled Entry</strong>
          ${renderBadge({ label: 'Draft', tone: 'neutral' })}
        </div>
        ${renderField({
          kind: 'input',
          id: 'preview-error-title',
          name: 'error_title',
          label: 'Title',
          value: '',
          required: true,
          error: 'Enter a title before saving this entry.',
        })}
        ${renderStatusLine({
          id: 'preview-error-status',
          tone: 'danger',
          message: 'Save failed — enter a title in the highlighted field above.',
        })}
      </div>`,
    },
    {
      state: 'unlisted',
      count: '2',
      mainHtml: `<div class="lp-editor-canvas">
        <div class="lp-dialog-header">
          <strong>Shared via link</strong>
          ${renderBadge({ label: 'Unlisted', tone: 'warn' })}
        </div>
        ${renderField({ kind: 'input', id: 'preview-unlisted-title', name: 'unlisted_title', label: 'Title', value: 'Zero-downtime queue consumer' })}
        ${renderStatusLine({ id: 'preview-unlisted-status', tone: 'ok', message: 'Unlisted link active.', undoLabel: 'Undo', undoSeconds: 8 })}
      </div>`,
    },
    {
      state: 'public',
      count: '2',
      mainHtml: `<div class="lp-editor-canvas">
        <div class="lp-dialog-header">
          <strong>Published on portfolio</strong>
          ${renderBadge({ label: 'Public', tone: 'ok' })}
        </div>
        ${renderField({ kind: 'input', id: 'preview-public-title', name: 'public_title', label: 'Title', value: 'Designing resilient webhook retries' })}
        ${renderStatusLine({ id: 'preview-public-status', tone: 'ok', message: 'Published to public timeline.' })}
      </div>`,
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
    </aside>
    <div class="lp-preview-main-col" data-state-main="${s.state}">
      ${s.mainHtml}
    </div>
  </div>`
    )
    .join('')}
</section>`;

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
</body>
</html>`;
}
