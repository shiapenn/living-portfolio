import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';

export interface CanaryGalleryOptions {
  theme?: 'light' | 'dark';
  nonce?: string;
  suite?: string;
}

/**
 * Dev/test-only Canary Fixture (/admin/_canary, WP-16.C C0).
 * Intentionally contains one known violation for each D-COMP census check (a)-(h)
 * to prove every check catches real defects and measures > 0 elements.
 */
export function renderCensusCanaryPage(options: CanaryGalleryOptions = {}): string {
  if (options.suite === 'dsys') {
    const dsysBodyHtml = `
      <div id="dsys-canary" data-canary-fixture="dsys">
        <h2 id="canary-text-align" class="lp-canary-center" data-canary="textAlign">Centred Heading</h2>
        <div id="canary-empty-inflow" class="lp-canary-empty-tall" data-canary="emptyInFlow"></div>
        <div id="canary-upper-gap" class="lp-canary-gap-80" data-canary="upperGapBound">
          <p>Block A</p>
          <p>Block B</p>
        </div>
        <div id="canary-line-budget" data-canary="lineBudget">
          <hr />
          <div class="lp-canary-hairline">Stray hairline</div>
        </div>
        <div id="canary-actionbar-width" class="lp-action-bar" data-canary="actionBarFullWidth">
          <button type="button" class="lp-btn lp-btn-primary lp-canary-btn-narrow">Narrow Primary</button>
        </div>
        <div id="canary-item-edge" class="lp-canary-zero-pad-clip" data-canary="itemHoverAndPadding">
          <div class="lp-item">
            <div class="lp-item-title">Edge-touching item</div>
          </div>
        </div>
        <div id="canary-topbar-label" class="lp-topbar-brand" data-canary="topBarLabel">Portfolio Sandbox</div>
        <a id="canary-arrows" href="#back" data-canary="arrowsInStrings">← Back</a>
        <button id="canary-icon-btn" type="button" class="lp-icon-btn lp-canary-outlined-icon-btn" aria-label="Outlined" data-canary="iconButtonFilled">
          <svg class="lp-icon" width="20" height="20" aria-hidden="true"><use href="#lp-icon-x"></use></svg>
        </button>
        <div id="canary-editor-header" class="lp-editor-header lp-canary-wide-row" data-canary="editorHeaderFit320">
          <button type="button" class="lp-btn lp-btn-primary lp-canary-wide-btn">Overflowing Header</button>
        </div>
        <div id="canary-formatting-bar" class="lp-canary-formatting-offcenter" data-canary="formattingBarGeometry">
          <div class="lp-editor-writing-col">Writing column</div>
          <div class="lp-formatting-bar lp-canary-bar-offset">B I H</div>
        </div>
      </div>
    `;
    const content = renderPageTemplate({
      title: 'D-SYS Canary',
      description: 'Intentional D-SYS violation fixtures.',
      bodyHtml: dsysBodyHtml,
    });
    return renderAdminShell('D-SYS Canary', '/admin/_canary', content, {
      initialTheme: options.theme,
      nonce: options.nonce,
    });
  }

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
