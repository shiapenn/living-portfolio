import { renderSectionHeader } from './section-header.js';

/**
 * Renders the D7(c) interactive State Matrix gallery section
 * (Button, Link, Choice, Field, Tab, Item across default/hover/focus/active/disabled/busy).
 */
export function renderStateMatrixSection(): string {
  return `<section id="gallery-state-matrix" class="lp-gallery-section" data-component="StateMatrix">
    ${renderSectionHeader({ title: 'State Matrix (D7 — Interactive Controls)' })}
    <div class="lp-state-matrix-grid">
      <div class="lp-stack lp-gap-tight" data-state-group="Button">
        <span data-purpose="label" class="lp-caption">Button (primary / secondary / text × default / hover / focus-visible / active / disabled / busy)</span>
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
      <div class="lp-stack lp-gap-tight" data-state-group="Choice">
        <span data-purpose="label" class="lp-caption">Choice (default / hover / selected / focus / disabled)</span>
        <div class="lp-state-matrix-row">
          <div class="lp-choice"><span class="lp-choice-card-title">Default</span></div>
          <div class="lp-choice lp-state-hover"><span class="lp-choice-card-title">Hover</span></div>
          <div class="lp-choice is-selected"><span class="lp-choice-card-title">Selected</span></div>
          <div class="lp-choice lp-state-focus"><span class="lp-choice-card-title">Focus</span></div>
          <div class="lp-choice is-disabled"><span class="lp-choice-card-title">Disabled</span></div>
        </div>
      </div>
      <div class="lp-stack lp-gap-tight" data-state-group="Field">
        <span data-purpose="label" class="lp-caption">Field (default / focus / invalid / disabled)</span>
        <div class="lp-state-matrix-row">
          <input type="text" class="lp-input" value="Default value" aria-label="Default field" />
          <input type="text" class="lp-input lp-state-focus" value="Focused value" aria-label="Focused field" />
          <input type="text" class="lp-input" value="Invalid value" aria-invalid="true" aria-label="Invalid field" />
          <input type="text" class="lp-input" value="Disabled value" disabled aria-label="Disabled field" />
        </div>
      </div>
      <div class="lp-stack lp-gap-tight" data-state-group="Tab">
        <span data-purpose="label" class="lp-caption">Tab (default / hover / selected / focus)</span>
        <div class="lp-tabs" role="tablist" aria-label="State matrix tabs">
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab">Default</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab lp-state-hover">Hover</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="true" class="lp-tab lp-tab-active">Selected</a>
          <a href="#gallery-state-matrix" role="tab" aria-selected="false" class="lp-tab lp-state-focus">Focus</a>
        </div>
      </div>
      <div class="lp-stack lp-gap-tight" data-state-group="Item">
        <span data-purpose="label" class="lp-caption">Item (default / hover / focus / pressed)</span>
        <div class="lp-list lp-list-interactive" data-c="List" data-variant="interactive">
          <div class="lp-item" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Default item</span></div></div>
          <div class="lp-item lp-state-hover" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Hover item</span></div></div>
          <div class="lp-item lp-state-focus" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Focused item</span></div></div>
          <div class="lp-item lp-state-active" data-c="Item"><div data-purpose="title" class="lp-item-title"><span>Pressed item</span></div></div>
        </div>
      </div>
    </div>
  </section>`;
}
