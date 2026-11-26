import { renderSectionHeader } from './section-header.js';
import { renderStatusDot } from './chip.js';
import { renderPageNotice } from '../components/feedback.js';

/**
 * Renders the D7(c) / WP-17.15 interactive State Matrix gallery section
 * plus the V3/V6 Ladder Specimen and K35 2x close-up targets.
 */
export function renderStateMatrixSection(): string {
  const ladderTile = (swatchClass: string, title: string, meta: string) =>
    `<div class="lp-gallery-ladder-tile"><div class="lp-gallery-ladder-swatch ${swatchClass}"></div><span class="lp-body">${title}</span><span class="lp-caption">${meta}</span></div>`;

  return `<section id="gallery-state-matrix" class="lp-gallery-section" data-component="StateMatrix">
    ${renderSectionHeader({ title: 'State Matrix (D7 / V1–V8 — Interactive Controls)' })}
    <div data-c="Text" class="lp-state-matrix-grid">
      <div id="gallery-state-buttons" class="lp-stack lp-gap-tight" data-state-group="Button">
        <span data-purpose="label" class="lp-caption">Button (primary / secondary / text / destructive × default / hover / focus-visible / active / disabled / busy)</span>
        <div class="lp-state-matrix-row">
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm">Default</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm lp-state-hover">Hover</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm lp-state-focus">Focus</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm lp-state-active">Active</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm" disabled>Disabled</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-primary lp-btn-sm" aria-busy="true">Saving…</button>
        </div>
        <div class="lp-state-matrix-row">
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm">Default</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm lp-state-hover">Hover</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm lp-state-focus">Focus</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm lp-state-active">Active</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm" disabled>Disabled</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm" aria-busy="true">Checking…</button>
        </div>
        <div class="lp-state-matrix-row">
          <button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-sm">Default</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-sm lp-state-hover">Hover</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-sm lp-state-focus">Focus</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-sm lp-state-active">Active</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-text lp-btn-sm" disabled>Disabled</button>
          <button type="button" data-c="Button" class="lp-btn lp-btn-danger lp-btn-sm">Destructive</button>
        </div>
      </div>
      <div class="lp-stack lp-gap-tight" data-state-group="Link">
        <span data-purpose="label" class="lp-caption">Link (inline underlined / action no-underline × default / focus)</span>
        <div class="lp-state-matrix-row">
          <a href="#gallery-state-matrix" class="lp-item-link">Inline citation link</a>
          <a href="#gallery-state-matrix" class="lp-item-link lp-state-focus">Inline focused</a>
          <a href="#gallery-state-matrix" class="lp-back-link">Action link</a>
          <a href="#gallery-state-matrix" class="lp-back-link lp-state-focus">Action focused</a>
        </div>
      </div>
      <div id="gallery-state-choice" class="lp-stack lp-gap-tight" data-state-group="Choice">
        <span data-purpose="label" class="lp-caption">Choice (default / hover / selected / focus / disabled)</span>
        <div class="lp-state-matrix-row">
          <div class="lp-choice"><span class="lp-choice-card-title">Default</span></div>
          <div class="lp-choice lp-state-hover"><span class="lp-choice-card-title">Hover</span></div>
          <div class="lp-choice is-selected"><span class="lp-choice-card-title">Selected</span></div>
          <div class="lp-choice lp-state-focus"><span class="lp-choice-card-title">Focus</span></div>
          <div class="lp-choice is-disabled"><span class="lp-choice-card-title">Disabled</span></div>
        </div>
      </div>
      <div id="gallery-state-field" class="lp-stack lp-gap-tight" data-state-group="Field">
        <span data-purpose="label" class="lp-caption">Field (default / focus / invalid / disabled)</span>
        <div class="lp-state-matrix-row">
          <input type="text" class="lp-input" value="Default value" aria-label="Default field" />
          <input type="text" class="lp-input lp-state-focus" value="Focused value" aria-label="Focused field" />
          <input type="text" class="lp-input" value="Invalid value" aria-invalid="true" aria-label="Invalid field" />
          <input type="text" class="lp-input" value="Disabled value" disabled aria-label="Disabled field" />
        </div>
      </div>
      <div id="gallery-state-tabs" class="lp-stack lp-gap-tight" data-state-group="Tab">
        <span data-purpose="label" class="lp-caption">Tab (default / hover / selected / focus — V2 weight-stable 500, 0-radius bar, inset focus ring)</span>
        <div class="lp-tabs" role="tablist" aria-label="State matrix tabs">
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab">Default</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab lp-state-hover">Hover</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="true" class="lp-tab lp-tab-active">Selected</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab lp-state-focus">Focus</a>
        </div>
      </div>
      <div id="gallery-state-items" class="lp-stack lp-gap-tight" data-state-group="Item">
        <span data-purpose="label" class="lp-caption">Item (default / hover / focus / pressed — V1 0-radius ::after hairlines, V8 inset container surface)</span>
        <div class="lp-list lp-list-interactive" data-c="List" data-variant="interactive">
          <div class="lp-item" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Default item</span></div></div>
          <div class="lp-item lp-state-hover" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Hover item</span></div></div>
          <div class="lp-item lp-state-focus" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Focused item</span></div></div>
          <div class="lp-item lp-state-active" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Pressed item</span></div></div>
        </div>
      </div>
      <div id="gallery-closeups-status" class="lp-stack lp-gap-tight" data-state-group="StatusLabel">
        <span data-purpose="label" class="lp-caption">StatusLabel (V6 OKLCH ramps — step 600 light / 400 dark; Pending uses warning ramp)</span>
        <div class="lp-state-matrix-row">
          ${renderStatusDot({ label: 'Active', tone: 'ok' })}
          ${renderStatusDot({ label: 'Pending', tone: 'warn' })}
          ${renderStatusDot({ label: 'Error', tone: 'danger' })}
          ${renderStatusDot({ label: 'Info', tone: 'info' })}
          ${renderStatusDot({ label: 'Neutral', tone: 'neutral' })}
        </div>
      </div>
      <div id="gallery-closeups-notice" class="lp-stack lp-gap-tight" data-state-group="Notice">
        <span data-purpose="label" class="lp-caption">Notice (V6 OKLCH ramp tints and borders)</span>
        <div class="lp-stack lp-gap-tight">
          ${renderPageNotice({ tone: 'info', message: 'Informational notice using info ramp.' })}
          ${renderPageNotice({ tone: 'ok', message: 'Success notice using success ramp.' })}
          ${renderPageNotice({ tone: 'warn', message: 'Warning notice using warning ramp.' })}
          ${renderPageNotice({ tone: 'danger', message: 'Danger notice using danger ramp.' })}
        </div>
      </div>
    </div>
  </section>
  <section id="gallery-ladder-specimen" class="lp-gallery-section" data-component="LadderSpecimen">
    ${renderSectionHeader({ title: 'Token Ladders Specimen (V3 & V6)' })}
    <div class="lp-stack lp-gap-related">
      <div class="lp-stack lp-gap-tight">
        <span data-purpose="label" class="lp-caption">Surface ladder</span>
        <div class="lp-gallery-ladder-grid">
          ${ladderTile('lp-gallery-swatch-canvas', 'Canvas', '--lp-color-surface-canvas')}
          ${ladderTile('lp-gallery-swatch-raised', 'Raised', '--lp-color-surface-raised')}
          ${ladderTile('lp-gallery-swatch-sunken', 'Sunken', '--lp-color-surface-sunken')}
          ${ladderTile('lp-gallery-swatch-overlay', 'Overlay', '--lp-color-surface-overlay')}
        </div>
      </div>
      <div class="lp-stack lp-gap-tight">
        <span data-purpose="label" class="lp-caption">Border ladder (hairline ~1.5:1, control 3.0–3.5:1, strong >=3:1)</span>
        <div class="lp-gallery-ladder-grid">
          ${ladderTile('lp-gallery-swatch-border-hairline', 'Hairline', '--lp-color-border-hairline')}
          ${ladderTile('lp-gallery-swatch-border-control', 'Control', '--lp-color-border-control')}
          ${ladderTile('lp-gallery-swatch-border-strong', 'Strong / Focus', '--lp-color-border-strong')}
        </div>
      </div>
      <div class="lp-stack lp-gap-tight">
        <span data-purpose="label" class="lp-caption">Fill ladder (neutral-tint-1/2/3, accent-tint-1/2)</span>
        <div class="lp-gallery-ladder-grid">
          ${ladderTile('lp-gallery-swatch-tint-1', 'Neutral tint 1 (rest)', '--lp-color-fill-neutral-tint-1')}
          ${ladderTile('lp-gallery-swatch-tint-2', 'Neutral tint 2 (hover)', '--lp-color-fill-neutral-tint-2')}
          ${ladderTile('lp-gallery-swatch-tint-3', 'Neutral tint 3 (active)', '--lp-color-fill-neutral-tint-3')}
          ${ladderTile('lp-gallery-swatch-accent-1', 'Accent tint 1 (selected)', '--lp-color-fill-accent-tint-1')}
          ${ladderTile('lp-gallery-swatch-accent-2', 'Accent tint 2 (sel hover)', '--lp-color-fill-accent-tint-2')}
        </div>
      </div>
      <div class="lp-stack lp-gap-tight">
        <span data-purpose="label" class="lp-caption">Elevation & Radius ladders</span>
        <div class="lp-gallery-ladder-grid">
          ${ladderTile('lp-gallery-swatch-e0', 'Elevation 0 (flat)', '--lp-elevation-e0')}
          ${ladderTile('lp-gallery-swatch-e1', 'Elevation 1 (popover)', '--lp-elevation-e1')}
          ${ladderTile('lp-gallery-swatch-e2', 'Elevation 2 (dialog)', '--lp-elevation-e2')}
          ${ladderTile('lp-gallery-swatch-r-ctrl', 'Radius control (8)', '--lp-radius-control')}
          ${ladderTile('lp-gallery-swatch-r-cont', 'Radius container (12)', '--lp-radius-container')}
          ${ladderTile('lp-gallery-swatch-r-pill', 'Radius pill (999)', '--lp-radius-full')}
        </div>
      </div>
      <div class="lp-stack lp-gap-tight">
        <span data-purpose="label" class="lp-caption">Status colour family (V6 OKLCH ramps)</span>
        <div class="lp-gallery-ladder-grid">
          ${ladderTile('lp-gallery-swatch-status-ok', 'Success', '--lp-color-status-success')}
          ${ladderTile('lp-gallery-swatch-status-warn', 'Warning / Pending', '--lp-color-status-warning')}
          ${ladderTile('lp-gallery-swatch-status-danger', 'Danger', '--lp-color-status-danger')}
          ${ladderTile('lp-gallery-swatch-status-info', 'Info', '--lp-color-status-info')}
          ${ladderTile('lp-gallery-swatch-status-neutral', 'Neutral', '--lp-color-status-neutral')}
        </div>
      </div>
    </div>
  </section>`;
}
