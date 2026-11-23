import { COMPONENT_TOKEN_VALUES, TYPE_ROLES } from '../../tokens/index.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import {
  renderActionBar,
  renderBackLink,
  renderButton,
  renderChoiceGroup,
  renderField,
  renderFormSection,
  renderIcon,
  renderIconButton,
  renderItem,
  renderList,
  renderOverlay,
  renderPageHeader,
  renderSectionHeader,
  renderSegmentedControl,
  renderStatusDot,
  renderStepper,
  renderSubsection,
  renderTabs,
  renderTag,
  renderText,
  STATUS_VOCABULARY,
} from '../../primitives/index.js';
import { renderPageNotice } from '../../components/index.js';
import { renderFoundationsTokensSection } from '../../primitives/foundations-gallery.js';

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
    'grid', 'user', 'bold', 'italic', 'heading', 'link', 'list', 'quote', 'code',
    'source', 'clock', 'layers', 'more', 'search', 'chevron-down', 'chevron-left', 'check', 'close',
  ] as const;

  const bodyHtml = `
    <div id="dcomp-gallery" class="lp-gallery-root${options.outline ? ' lp-outline-mode' : ''}">
      <section id="gallery-icons" class="lp-gallery-section" data-component="Icon">
        ${renderSectionHeader({ title: 'Icons' })}
        <div class="lp-gallery-row">
          ${requiredIcons
            .map(
              (name) =>
                `<span class="lp-gallery-icon-sample" data-icon-sample="${name}">${renderIconButton({
                  ariaLabel: name,
                  icon: name,
                  iconSize: 20,
                  variant: 'quiet',
                })}${renderText({ variant: 'caption', tag: 'span', text: name })}</span>`
            )
            .join('')}
        </div>
      </section>

      <section id="gallery-buttons" class="lp-gallery-section" data-component="Button">
        ${renderSectionHeader({ title: 'Buttons' })}
        <div class="lp-gallery-row">
          ${renderButton({ label: 'Primary', variant: 'primary' })}
          ${renderButton({ label: 'Secondary', variant: 'secondary' })}
          ${renderButton({ label: 'Quiet', variant: 'quiet' })}
          ${renderButton({ id: 'gallery-btn-text-danger', label: 'Delete rule', variant: 'text-danger' })}
          ${renderButton({ label: 'Hover', variant: 'secondary', className: 'is-hover' })}
          ${renderButton({ label: 'Pressed', variant: 'secondary', dataAttrs: { pressed: 'true' } })}
          ${renderButton({ label: 'Disabled', variant: 'secondary', disabled: true, disabledReason: 'Unavailable in this state' })}
          ${renderButton({ label: 'Saving…', variant: 'primary', loading: true })}
        </div>
      </section>

      <section id="gallery-page-header" class="lp-gallery-section" data-component="PageHeader">
        ${renderSectionHeader({ title: 'PageHeader' })}
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
        ${renderSectionHeader({ title: 'Item & List (plain | interactive)' })}
        ${renderText({ variant: 'description', text: 'Parent: List container (.lp-list, variants plain & interactive) · Children: Title, StatusLabel + Chevron, Subtitle, Body/Segments, Meta, ActionBar.' })}
        ${renderList({
          id: 'gallery-list-interactive',
          variant: 'interactive',
          itemsHtml: `${renderItem({
            id: 'gallery-item-link',
            href: '#gallery-item',
            leadingIcon: 'file-text',
            title: 'Clickable item without actions',
            subtitle: 'Subtitle · Scope',
            body: 'Plain-text body excerpt.',
            meta: '16 Nov 2026 · 14:30',
            statusLabel: 'Active',
            statusTone: 'ok',
            showChevron: true,
          })}${renderItem({
            id: 'gallery-item-selected',
            href: '#gallery-item',
            title: 'Selected item state',
            subtitle: 'Selected row',
            statusLabel: 'Pending',
            statusTone: 'warn',
            selected: true,
            showChevron: true,
          })}`,
        })}
        ${renderList({
          id: 'gallery-list-plain',
          variant: 'plain',
          itemsHtml: renderItem({
            id: 'gallery-item-actions',
            title: 'Item with segments and actions',
            subtitle: 'Scope: Public answers',
            segments: [
              { heading: 'Rule', body: 'Always state the date of evidence.' },
              { heading: 'Source quote', body: 'Reviewed during Q3 audit.' },
            ],
            meta: '16 Nov 2026 · 15:00',
            statusLabel: 'Pending',
            statusTone: 'warn',
            actions: {
              level: 'item',
              secondary: { label: 'Confirm', variant: 'secondary' },
              textAction: { label: 'Dismiss', variant: 'text' },
            },
          }),
        })}
      </section>

      <section id="gallery-action-bar" class="lp-gallery-section" data-component="ActionBar">
        ${renderSectionHeader({ title: 'ActionBar (page | dialog | item)' })}
        <div class="lp-stack lp-gap-section">
          <div class="lp-stack lp-gap-group">
            ${renderSectionHeader({ title: 'Level: page (full column width, stacked)', headingTag: 'h3' })}
            ${renderActionBar({
              id: 'gallery-ab-page',
              level: 'page',
              primary: { label: 'Save changes', variant: 'primary' },
              secondary: { label: 'Cancel', variant: 'secondary' },
              textAction: { label: 'Reset defaults', variant: 'text' },
            })}
          </div>
          <div class="lp-dialog-panel lp-stack lp-gap-group">
            ${renderSectionHeader({ title: 'Level: dialog (full dialog/sheet width at every viewport)', headingTag: 'h3' })}
            ${renderActionBar({
              id: 'gallery-ab-dialog',
              level: 'dialog',
              primary: { label: 'Delete entry', variant: 'danger' },
              secondary: { label: 'Cancel', variant: 'secondary' },
            })}
          </div>
          <div class="lp-stack lp-gap-group">
            ${renderSectionHeader({ title: `Level: item (compact min ${COMPONENT_TOKEN_VALUES['--lp-size-btn-item-min']} flex-wrap row at every width)`, headingTag: 'h3' })}
            ${renderActionBar({
              id: 'gallery-ab-item',
              level: 'item',
              secondary: { label: 'Accept', variant: 'secondary' },
              textAction: { label: 'Ignore', variant: 'text' },
            })}
          </div>
        </div>
      </section>

      <section id="gallery-segmented-tags-status" class="lp-gallery-section">
        ${renderSectionHeader({ title: 'Segmented, Tags, StatusLabel, Notice & Select' })}
        <div class="lp-stack lp-gap-group">
          <div>
            ${renderText({ variant: 'description', text: 'SegmentedControl (mode switches only, e.g. Edit / Settings)' })}
            ${renderSegmentedControl({
              id: 'gallery-segmented',
              ariaLabel: 'Mode switch',
              selectedValue: 'edit',
              options: [
                { value: 'edit', label: 'Edit' },
                { value: 'settings', label: 'Settings' },
              ],
            })}
          </div>
          <div class="lp-gallery-row">
            ${renderTag({ id: 'gallery-tag-static', label: 'database: Postgres' })}
            ${renderTag({ id: 'gallery-tag-removable', label: 'scale: 16 nodes', removable: true })}
          </div>
          <div class="lp-gallery-row">
            ${STATUS_VOCABULARY.map((label) =>
              renderStatusDot({
                label,
                tone: label === 'Error' || label === 'Key invalid' || label === 'Unreachable'
                  ? 'danger'
                  : label === 'Active' || label === 'Connected' || label === 'Accepted' || label === 'Latest' || label === 'Public'
                    ? 'ok'
                    : label === 'Pending' || label === 'Suggested' || label === 'Paused' || label === 'Unlisted'
                      ? 'warn'
                      : 'neutral',
              }),
            ).join('')}
          </div>
          ${renderPageNotice({ id: 'gallery-notice-sample', tone: 'warn', message: 'Warning: backup destination is not configured.' })}
          ${renderPageNotice({ id: 'gallery-notice-error', tone: 'danger', message: 'Error: provider API key check failed.' })}
          ${renderField({
            id: 'gallery-select',
            name: 'gallery-select',
            label: 'Select control',
            kind: 'select',
            value: 'case-study',
            options: [
              { value: 'case-study', label: 'Case study' },
              { value: 'note', label: 'Note' },
            ],
          })}
          ${renderBackLink({ href: '/admin', destination: 'Today' })}
          ${renderSectionHeader({ id: 'gallery-section-header-sample', title: 'SectionHeader' })}
        </div>
      </section>

      <section id="gallery-text" class="lp-gallery-section" data-component="Text">
        ${renderSectionHeader({ title: 'Text' })}
        <div id="gallery-text-sample" class="lp-stack lp-gap-related">
          ${renderText({ variant: 'body', text: `Body text role (${TYPE_ROLES.body.size}/${TYPE_ROLES.body.lineHeight}, text-1).` })}
          ${renderText({ variant: 'description', text: `Description text role (${TYPE_ROLES.description.size}/${TYPE_ROLES.description.lineHeight}, text-2).` })}
          ${renderText({ variant: 'caption', text: `Caption text role (${TYPE_ROLES.caption.size}/${TYPE_ROLES.caption.lineHeight}, text-2).` })}
          ${renderText({ variant: 'prose', text: 'Prose text role for structured multi-paragraph copy.' })}
        </div>
      </section>

      <section id="gallery-choice" class="lp-gallery-section" data-component="Choice">
        ${renderSectionHeader({ title: 'Choice' })}
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
        ${renderSectionHeader({ title: 'Tabs & Stepper' })}
        ${renderText({ variant: 'description', text: `Parent: Page or Section · Children: Tablist (max 4, or Select when >=5), Stepper (Step N of M + ${COMPONENT_TOKEN_VALUES['--lp-size-track-height']} bar).` })}
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
        ${renderSectionHeader({ title: 'Overlay (static anchored samples)' })}
        ${renderText({ variant: 'description', text: 'Popover, bottom sheet, edge-docked panel (border-right only, no shadow), and modal dialog.' })}
        <div class="lp-stack lp-gap-group">
          ${renderOverlay({
            id: 'gallery-overlay-popover',
            kind: 'actions',
            title: 'Popover / Sheet',
            bodyHtml: renderText({ variant: 'body', text: 'Compact menu actions anchored to a trigger or bottom sheet.' }),
            footerHtml: renderActionBar({
              level: 'dialog',
              secondary: { label: 'Close', variant: 'secondary' },
            }),
            open: true,
            className: 'lp-gallery-overlay-sample',
          })}
          <div class="lp-gallery-panel-sample" data-c="EdgePanel">
            ${renderSectionHeader({ title: 'Edge-docked panel', headingTag: 'h3' })}
            ${renderText({ variant: 'description', text: `Border-right ${COMPONENT_TOKEN_VALUES['--lp-border-hairline']} outline only, zero shadow.` })}
          </div>
          ${renderOverlay({
            id: 'gallery-overlay-dialog',
            kind: 'dialog',
            title: 'Confirm action',
            bodyHtml: renderText({ variant: 'body', text: 'Dialog body content.' }),
            footerHtml: renderActionBar({
              level: 'dialog',
              primary: { label: 'Confirm', variant: 'primary' },
              secondary: { label: 'Cancel', variant: 'secondary' },
            }),
            open: true,
            className: 'lp-gallery-overlay-sample',
          })}
        </div>
      </section>

      <section id="gallery-form-section" class="lp-gallery-section" data-component="FormSection">
        ${renderSectionHeader({ title: 'FormSection' })}
        ${renderFormSection({
          id: 'gallery-fs-sample',
          title: 'Section heading',
          description: 'Optional one-line description under the heading.',
          fieldsHtml: [
            renderField({ id: 'gallery-f1', name: 'f1', label: 'Text field', kind: 'input', value: 'Sample' }),
            renderField({ id: 'gallery-f2', name: 'f2', label: 'Error field', kind: 'input', value: '', error: 'Enter a value.' }),
          ].join(''),
          actionBarHtml: renderActionBar({
            level: 'page',
            primary: { label: 'Save', variant: 'primary' },
            secondary: { label: 'Cancel', variant: 'secondary' },
          }),
        })}
        ${renderSubsection({
          id: 'gallery-subsection',
          title: 'Subsection heading',
          intro: 'Optional intro inside FormSection.',
          bodyHtml: renderText({ variant: 'body', text: 'Subsection body content.' }),
        })}
      </section>

      ${renderFoundationsTokensSection()}
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



