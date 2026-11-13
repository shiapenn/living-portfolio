import { renderLayout } from '../layouts/public-shell.js';
import {
  renderButton,
  renderIconButton,
  renderChip,
  renderBadge,
  renderStatusDot,
  renderSwitch,
  renderField,
} from './index.js';
import {
  renderPageNotice,
  renderStatusLine,
  renderDialog,
  renderDrawer,
  renderDisclosure,
  renderTabs,
  renderTable,
  renderEmptyState,
} from '../components/index.js';

/**
 * Renders the development-only primitives gallery for visual and accessibility verification.
 */
export function renderPrimitivesGalleryPage(): string {
  const content = `<section class="lp-gallery">
  <header class="lp-gallery-header">
    <h1>Primitives Gallery</h1>
    <p class="lp-gallery-subtitle">Shared UI building blocks for visual and accessibility verification.</p>
  </header>

  <section class="lp-gallery-section" aria-labelledby="gal-buttons">
    <h2 id="gal-buttons">Buttons &amp; Icon Buttons</h2>
    <div class="lp-gallery-row">
      ${renderButton({ id: 'gallery-btn-primary', label: 'Primary action', variant: 'primary' })}
      ${renderButton({ id: 'gallery-btn-secondary', label: 'Secondary action', variant: 'secondary' })}
      ${renderButton({ id: 'gallery-btn-danger', label: 'Delete entry', variant: 'danger' })}
      ${renderButton({ id: 'gallery-btn-quiet', label: 'Quiet action', variant: 'quiet' })}
      ${renderButton({ id: 'gallery-btn-disabled', label: 'Disabled', variant: 'secondary', disabled: true })}
      ${renderButton({ id: 'gallery-btn-loading', label: 'Saving…', variant: 'primary', loading: true })}
      ${renderIconButton({ id: 'gallery-icon-btn', ariaLabel: 'Close panel', icon: '×', variant: 'secondary' })}
    </div>
  </section>

  <section class="lp-gallery-section" aria-labelledby="gal-chips">
    <h2 id="gal-chips">Chips, Badges &amp; Status Dots</h2>
    <div class="lp-gallery-row">
      ${renderChip({ id: 'gallery-chip-confirmed', label: 'Confirmed tag', state: 'confirmed' })}
      ${renderChip({ id: 'gallery-chip-suggested', label: 'Suggested tag', state: 'suggested', interactive: true })}
      ${renderBadge({ id: 'gallery-badge-ok', label: 'Public', tone: 'ok' })}
      ${renderBadge({ id: 'gallery-badge-warn', label: 'Unlisted', tone: 'warn' })}
      ${renderBadge({ id: 'gallery-badge-danger', label: 'Error', tone: 'danger' })}
      ${renderStatusDot({ id: 'gallery-status-dot', label: 'Site healthy', tone: 'ok' })}
    </div>
  </section>

  <section class="lp-gallery-section" aria-labelledby="gal-switches">
    <h2 id="gal-switches">Switches</h2>
    <div class="lp-gallery-stack">
      ${renderSwitch({ id: 'gallery-switch-on', label: 'Automatic answers enabled', checked: true, description: 'Visitors receive answers from published entries.' })}
      ${renderSwitch({ id: 'gallery-switch-off', label: 'Strict citation mode', checked: false })}
    </div>
  </section>

  <section class="lp-gallery-section" aria-labelledby="gal-fields">
    <h2 id="gal-fields">Form Fields</h2>
    <div class="lp-gallery-stack">
      ${renderField({ kind: 'input', id: 'gallery-field-title', name: 'title', label: 'Entry title', value: 'Migration notes', help: 'Shown as the main heading.' })}
      ${renderField({ kind: 'input', id: 'gallery-field-error', name: 'slug', label: 'Entry slug', value: '', error: 'Enter a URL slug before saving.' })}
      ${renderField({ kind: 'textarea', id: 'gallery-field-body', name: 'body', label: 'Body', value: 'Plain text or Markdown.' })}
      ${renderField({ kind: 'select', id: 'gallery-field-vis', name: 'visibility', label: 'Visibility', value: 'unlisted', options: [{ value: 'draft', label: 'Draft' }, { value: 'unlisted', label: 'Unlisted' }, { value: 'public', label: 'Public' }] })}
      ${renderField({ kind: 'checkbox', id: 'gallery-field-check', name: 'confirm', label: 'I confirm this contains no private details', checked: false })}
      ${renderField({ kind: 'radio', id: 'gallery-field-radio', name: 'mode', label: 'Decision note', value: 'decision', checked: true })}
    </div>
  </section>

  <section class="lp-gallery-section" aria-labelledby="gal-feedback">
    <h2 id="gal-feedback">Feedback &amp; Containers (WP-15.3)</h2>
    <div class="lp-gallery-stack">
      ${renderPageNotice({ id: 'gallery-page-notice', tone: 'warn', message: 'Persistent notice: backups are not configured yet.', dismissible: true })}
      <div class="lp-gallery-row">
        ${renderButton({ id: 'gallery-trigger-status', label: 'Trigger status', variant: 'secondary' })}
        ${renderButton({ id: 'gallery-open-dialog', label: 'Open dialog', variant: 'secondary' })}
        ${renderButton({ id: 'gallery-open-drawer', label: 'Open drawer', variant: 'secondary' })}
      </div>
      ${renderStatusLine({ id: 'gallery-status-line', message: '' })}
      ${renderDisclosure({ id: 'gallery-disclosure', summary: 'Details', summaryMeta: 'Unlisted · 13 Nov 2026 · Exact', bodyHtml: '<p>Slug, visibility, and date settings.</p>' })}
      ${renderTabs({
        id: 'gallery-tabs',
        ariaLabel: 'Gallery sample tabs',
        tabs: [
          { id: 'one', label: 'Overview', panelHtml: '<p>Overview panel content.</p>', active: true },
          { id: 'two', label: 'History', panelHtml: '<p>History panel content.</p>' },
        ],
      })}
      ${renderTable({
        id: 'gallery-table',
        caption: 'Sample entries',
        columns: [
          { key: 'title', label: 'Title' },
          { key: 'state', label: 'State' },
        ],
        rows: [
          { title: 'Architecture Decision Record', state: 'Public' },
          { title: 'Draft Notes', state: 'Draft' },
        ],
      })}
      ${renderEmptyState({
        id: 'gallery-empty',
        title: 'No items yet',
        body: 'Create your first item to populate this list.',
        actionHtml: renderButton({ id: 'gallery-empty-cta', label: 'Create item', variant: 'primary' }),
      })}
    </div>
  </section>
</section>
${renderDialog({
  id: 'gallery-dialog',
  title: 'Confirm action',
  bodyHtml: '<p>Are you sure you want to continue?</p>',
  footerHtml: `${renderButton({ id: 'gallery-dialog-cancel', label: 'Cancel', variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } })} ${renderButton({ id: 'gallery-dialog-confirm', label: 'Confirm', variant: 'primary' })}`,
})}
${renderDrawer({
  id: 'gallery-drawer',
  title: 'Structure panel',
  bodyHtml: '<p>Drawer content stays contained until dismissed.</p>',
  position: 'right',
})}`;

  return renderLayout('Primitives Gallery', '/admin/dev/primitives', content, {
    clientScript: '/assets/client/gallery.js',
  });
}
