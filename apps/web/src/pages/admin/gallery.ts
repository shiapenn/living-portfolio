import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderIcon } from '../../primitives/index.js';

export interface GalleryOptions {
  theme?: 'light' | 'dark';
  nonce?: string;
}

/**
 * Dev/test-only Component Contract Gallery (/admin/_gallery, D-COMP #15).
 * Scaffolded in WP-16.C C0; populated with full primitive states in C1.
 */
export function renderComponentGalleryPage(options: GalleryOptions = {}): string {
  const bodyHtml = `
    <div id="dcomp-gallery" class="lp-gallery-root">
      <section id="gallery-icons" class="lp-gallery-section" data-component="Icon">
        <h2>Icons</h2>
        <p>Required D-COMP sprite glyphs (16 px / 20 px / 24 px).</p>
        <div class="lp-gallery-row">
          ${(['grid', 'user', 'bold', 'italic', 'heading', 'link', 'list', 'quote', 'code', 'source', 'clock', 'layers', 'more', 'search', 'chevron-down', 'chevron-left', 'check', 'close'] as const)
            .map((name) => `<span class="lp-gallery-icon-sample" data-icon-sample="${name}">${renderIcon(name as any, 20)}<span>${name}</span></span>`)
            .join('')}
        </div>
      </section>
      <section id="gallery-page-header" class="lp-gallery-section" data-component="PageHeader">
        <h2>PageHeader</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-item" class="lp-gallery-section" data-component="Item">
        <h2>Item</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-action-bar" class="lp-gallery-section" data-component="ActionBar">
        <h2>ActionBar</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-choice" class="lp-gallery-section" data-component="Choice">
        <h2>Choice</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-tabs-stepper" class="lp-gallery-section" data-component="TabsStepper">
        <h2>Tabs &amp; Stepper</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-overlay" class="lp-gallery-section" data-component="Overlay">
        <h2>Overlay</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
      <section id="gallery-form-section" class="lp-gallery-section" data-component="FormSection">
        <h2>FormSection</h2>
        <p>Scaffolded for C1 implementation.</p>
      </section>
    </div>
  `;

  const content = renderPageTemplate({
    title: 'Component Gallery',
    description: 'Contract document for D-COMP primitives and interactive states.',
    bodyHtml,
  });

  return renderAdminShell('Component Gallery', '/admin/_gallery', content, {
    initialTheme: options.theme,
    nonce: options.nonce,
  });
}

/**
 * Dev/test-only Canary Fixture (/admin/_canary, WP-16.C C0).
 * Intentionally contains one known violation for each D-COMP census check (a)-(h)
 * to prove every check catches real defects and measures > 0 elements.
 */
export function renderCensusCanaryPage(options: GalleryOptions = {}): string {
  const bodyHtml = `
    <div id="dcomp-canary" data-canary-fixture="true">
      <div id="canary-icons" data-canary="icons">
        <button type="button" class="lp-icon-btn" aria-label="Launcher" data-icon-name="grid">
          <svg class="lp-icon" width="20" height="20" aria-hidden="true"><use href="#lp-icon-x"></use></svg>
        </button>
        <div class="lp-editor-toolbar" data-canary-toolbar="true">
          <button type="button" class="lp-icon-btn" aria-label="Bold" data-format="bold">
            <svg class="lp-icon" width="20" height="20" aria-hidden="true"><use href="#lp-icon-x"></use></svg>
          </button>
          <button type="button" class="lp-icon-btn" aria-label="Italic" data-format="italic">
            <svg class="lp-icon" width="20" height="20" aria-hidden="true"><use href="#lp-icon-x"></use></svg>
          </button>
        </div>
      </div>

      <div id="canary-stacking" class="lp-page-header lp-canary-stacking" data-canary="stacking">
        <h1 class="lp-canary-small-h1">Canary Header</h1>
        <p class="lp-page-description lp-canary-zero-margin">Description beside title</p>
      </div>

      <div id="canary-overlay" class="lp-popover lp-canary-overlay" role="menu" data-open="true" data-canary="overlays">
        <button type="button" role="menuitem">Clipped item</button>
      </div>

      <div id="canary-action-bar" class="lp-action-bar lp-canary-action-bar" data-canary="actionBar">
        <button type="button" class="lp-btn lp-btn-secondary lp-canary-btn-sm">Cancel</button>
        <button type="button" class="lp-btn lp-btn-primary lp-canary-btn-md">Save</button>
      </div>

      <div id="canary-choice" class="lp-choice" data-canary="choice">
        <label><input type="checkbox" checked /> Native checkbox</label>
        <label><input type="radio" name="canary-r" checked /> Native radio</label>
      </div>

      <section id="canary-rhythm" class="lp-form-section lp-canary-rhythm" data-canary="verticalRhythm">
        <h2 class="lp-form-section-title lp-canary-zero-margin">Section Heading</h2>
        <p class="lp-form-section-desc lp-canary-zero-margin">Helper text touching heading</p>
        <input type="text" class="lp-input lp-canary-zero-margin" value="Field" />
        <div class="lp-action-bar lp-canary-zero-margin">
          <button type="button" class="lp-btn lp-btn-primary">Save</button>
        </div>
      </section>

      <header id="canary-page-header" class="lp-page-header" data-canary="pageHeader">
        <p class="lp-page-description">Description before title</p>
        <h1 class="lp-canary-small-h1">Too small title</h1>
      </header>

      <div id="canary-tabs" class="lp-tabs lp-canary-tabs" role="tablist" data-canary="tabs">
        <button type="button" role="tab" class="lp-tab lp-canary-tab">First Tab Label</button>
        <button type="button" role="tab" class="lp-tab lp-canary-tab">Second Tab Label</button>
      </div>
    </div>
  `;

  const content = renderPageTemplate({
    title: 'Census Canary',
    description: 'Intentional D-COMP violation fixtures for census self-verification.',
    bodyHtml,
  });

  return renderAdminShell('Census Canary', '/admin/_canary', content, {
    initialTheme: options.theme,
    nonce: options.nonce,
  });
}
