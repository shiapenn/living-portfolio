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

import { renderDetailsFields } from './foundations-gallery-preview.js';

export function renderFoundationsComponentsSection(
  themeToggleIcon: 'moon' | 'sun',
  themeToggleLabel: string
): string {
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

  return componentsHtml;
}
