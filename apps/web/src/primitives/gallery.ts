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
</section>`;

  return renderLayout('Primitives Gallery', '/admin/dev/primitives', content);
}
