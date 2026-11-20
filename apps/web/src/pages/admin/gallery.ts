import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import {
  renderActionBar,
  renderButton,
  renderChoiceGroup,
  renderField,
  renderFormSection,
  renderIcon,
  renderIconButton,
  renderItem,
  renderOverlay,
  renderPageHeader,
  renderStepper,
  renderTabs,
} from '../../primitives/index.js';

export interface GalleryOptions {
  theme?: 'light' | 'dark';
  nonce?: string;
  suite?: string;
  outline?: boolean;
}

/**
 * Dev/test-only Component Contract Gallery (/admin/_gallery, D-COMP #15).
 * Renders every D-COMP primitive in every applicable state at 1280px and 320px.
 */
export function renderComponentGalleryPage(options: GalleryOptions = {}): string {
  const requiredIcons = [
    'grid',
    'user',
    'bold',
    'italic',
    'heading',
    'link',
    'list',
    'quote',
    'code',
    'source',
    'clock',
    'layers',
    'more',
    'search',
    'chevron-down',
    'chevron-left',
    'check',
    'close',
  ] as const;

  const bodyHtml = `
    <div id="dcomp-gallery" class="lp-gallery-root${options.outline ? ' lp-outline-mode' : ''}">
      <section id="gallery-icons" class="lp-gallery-section" data-component="Icon">
        <h2>Icons</h2>
        <div class="lp-gallery-row">
          ${requiredIcons
            .map(
              (name) =>
                `<span class="lp-gallery-icon-sample" data-icon-sample="${name}">${renderIconButton({
                  ariaLabel: name,
                  icon: name,
                  iconSize: 20,
                  variant: 'quiet',
                })}<span>${name}</span></span>`
            )
            .join('')}
        </div>
      </section>

      <section id="gallery-buttons" class="lp-gallery-section" data-component="Button">
        <h2>Buttons</h2>
        <div class="lp-gallery-row">
          ${renderButton({ label: 'Primary', variant: 'primary' })}
          ${renderButton({ label: 'Secondary', variant: 'secondary' })}
          ${renderButton({ label: 'Quiet', variant: 'quiet' })}
          ${renderButton({ label: 'Hover', variant: 'secondary', className: 'is-hover' })}
          ${renderButton({ label: 'Pressed', variant: 'secondary', dataAttrs: { pressed: 'true' } })}
          ${renderButton({ label: 'Disabled', variant: 'secondary', disabled: true, disabledReason: 'Unavailable in this state' })}
          ${renderButton({ label: 'Saving…', variant: 'primary', loading: true })}
        </div>
      </section>

      <section id="gallery-page-header" class="lp-gallery-section" data-component="PageHeader">
        <h2>PageHeader</h2>
        ${renderPageHeader({
          id: 'gallery-ph-sample',
          backHref: '/admin',
          backLabel: 'Back to Today',
          title: 'Page header title',
          description: 'One-line description below the 24 px title.',
          actionHtml: renderButton({ label: 'New item', variant: 'primary' }),
        })}
      </section>

      <section id="gallery-item" class="lp-gallery-section" data-component="Item">
        <h2>Item</h2>
        <p class="lp-description">Parent: List container (.lp-list) · Children: Title, StatusLabel + Chevron, Subtitle, Body/Segments, Meta, ActionBar.</p>
        <div class="lp-list">
        ${renderItem({
          id: 'gallery-item-link',
          href: '#gallery-item',
          leadingIcon: 'file-text',
          title: 'Clickable item without actions',
          subtitle: 'Subtitle · Scope',
          body: 'Plain-text body excerpt.',
          meta: '16 Nov 2026 · 14:30',
          statusLabel: 'Active',
          statusTone: 'ok',
        })}
        ${renderItem({
          id: 'gallery-item-selected',
          href: '#gallery-item',
          title: 'Selected item state',
          subtitle: 'Selected row',
          statusLabel: 'Pending',
          statusTone: 'warn',
          selected: true,
        })}
        ${renderItem({
          id: 'gallery-item-actions',
          title: 'Item with segments and actions',
          subtitle: 'Scope: Public answers',
          segments: [
            { heading: 'Rule', body: 'Always state the date of evidence.' },
            { heading: 'Source quote', body: 'Reviewed during Q3 audit.' },
          ],
          meta: '16 Nov 2026 · 15:00',
          statusLabel: 'Waiting',
          statusTone: 'warn',
          actions: {
            primary: { label: 'Confirm', variant: 'primary' },
            secondary: { label: 'Dismiss', variant: 'secondary' },
          },
        })}
        </div>
      </section>

      <section id="gallery-action-bar" class="lp-gallery-section" data-component="ActionBar">
        <h2>ActionBar</h2>
        ${renderActionBar({
          id: 'gallery-ab-sample',
          primary: { label: 'Save changes', variant: 'primary' },
          secondary: { label: 'Cancel', variant: 'secondary' },
          textAction: { label: 'Reset defaults', variant: 'quiet' },
        })}
      </section>

      <section id="gallery-choice" class="lp-gallery-section" data-component="Choice">
        <h2>Choice</h2>
        ${renderChoiceGroup({
          id: 'gallery-choice-btn-single',
          name: 'gallery-btn-single',
          legend: 'Button variant (single)',
          mode: 'single',
          variant: 'button',
          options: [
            { value: 'a', label: 'Default option' },
            { value: 'b', label: 'Selected option', checked: true },
            { value: 'c', label: 'Disabled option', disabled: true },
          ],
        })}
        ${renderChoiceGroup({
          id: 'gallery-choice-btn-multi',
          name: 'gallery-btn-multi',
          legend: 'Button variant (multiple)',
          mode: 'multiple',
          variant: 'button',
          options: [
            { value: 'm1', label: 'Unchecked' },
            { value: 'm2', label: 'Checked', checked: true },
          ],
        })}
        ${renderChoiceGroup({
          id: 'gallery-choice-card',
          name: 'gallery-card-multi',
          legend: 'Card variant (multiple, error state)',
          mode: 'multiple',
          variant: 'card',
          error: 'Select at least one option.',
          options: [
            { value: 'c1', label: 'Selected card option', description: 'One-line description of this setting.', checked: true },
            { value: 'c2', label: 'Long card title that wraps up to two lines before truncating with an ellipsis and exposing a tooltip', description: 'Secondary option.' },
            { value: 'c3', label: 'Disabled card option', description: 'Unavailable.', disabled: true },
          ],
        })}
      </section>

      <section id="gallery-tabs-stepper" class="lp-gallery-section" data-component="TabsStepper">
        <h2>Tabs &amp; Stepper</h2>
        <p class="lp-description">Parent: Page or Section · Children: Tablist (max 4, or Select when >=5), Stepper (Step N of M + 2px bar).</p>
        <div class="lp-stack lp-gap-related">
        ${renderTabs({
          id: 'gallery-tabs-3',
          ariaLabel: 'Peer views',
          tabs: [
            { id: 'pending', label: 'Pending', active: true },
            { id: 'active', label: 'Active' },
            { id: 'archived', label: 'Archived' },
          ],
        })}
        ${renderTabs({
          id: 'gallery-tabs-5',
          ariaLabel: 'Five views (Select)',
          tabs: [
            { id: 't1', label: 'One', active: true },
            { id: 't2', label: 'Two' },
            { id: 't3', label: 'Three' },
            { id: 't4', label: 'Four' },
            { id: 't5', label: 'Five' },
          ],
        })}
        </div>
        ${renderStepper({
          id: 'gallery-stepper-sample',
          currentStep: 2,
          totalSteps: 6,
          stepTitle: 'Hosting',
        })}
      </section>

      <section id="gallery-overlay" class="lp-gallery-section" data-component="Overlay">
        <h2>Overlay</h2>
        <p>Unified actions popover/sheet, full-screen panel, and modal dialog.</p>
        ${renderOverlay({
          id: 'gallery-overlay-dialog',
          kind: 'dialog',
          title: 'Confirm action',
          bodyHtml: '<p>Dialog body content.</p>',
          footerHtml: renderActionBar({
            primary: { label: 'Confirm', variant: 'primary' },
            secondary: { label: 'Cancel', variant: 'secondary' },
          }),
          open: false,
        })}
      </section>

      <section id="gallery-form-section" class="lp-gallery-section" data-component="FormSection">
        <h2>FormSection</h2>
        ${renderFormSection({
          id: 'gallery-fs-sample',
          title: 'Section heading',
          description: 'Optional one-line description under the heading.',
          fieldsHtml: [
            renderField({ id: 'gallery-f1', name: 'f1', label: 'Text field', kind: 'input', value: 'Sample' }),
            renderField({ id: 'gallery-f2', name: 'f2', label: 'Error field', kind: 'input', value: '', error: 'Enter a value.' }),
          ].join(''),
          actionBarHtml: renderActionBar({
            primary: { label: 'Save', variant: 'primary' },
            secondary: { label: 'Cancel', variant: 'secondary' },
          }),
        })}
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
