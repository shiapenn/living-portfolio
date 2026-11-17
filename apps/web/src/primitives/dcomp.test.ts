import { describe, it, expect } from 'vitest';
import {
  DCOMP_ICON_NAMES,
  renderActionBar,
  renderChoiceGroup,
  renderFormSection,
  renderIcon,
  renderIconButton,
  renderIconSprite,
  renderItem,
  renderOverlay,
  renderPageHeader,
  renderStepper,
  renderTabs,
} from './index.js';

describe('WP-16.C C1 D-COMP Primitives', () => {
  it('renders all 18 required D-COMP icons, keeps source distinct from code, and throws on unknown icon id in non-prod', () => {
    const sprite = renderIconSprite();
    for (const name of DCOMP_ICON_NAMES) {
      expect(sprite).toContain(`id="lp-icon-${name}"`);
      const btn = renderIconButton({ ariaLabel: name, icon: name, iconSize: 20 });
      expect(btn).toContain(`href="#lp-icon-${name}"`);
      expect(btn).toContain(`data-icon-name="${name}"`);
    }
    const codeSvg = renderIcon('code', 16);
    const sourceSvg = renderIcon('source', 16);
    expect(codeSvg).not.toEqual(sourceSvg);

    expect(() => renderIcon('nonexistent-icon' as any, 16)).toThrow(/Unknown icon id/);
    expect(() => renderIconButton({ ariaLabel: 'bad', icon: 'nonexistent-icon' })).toThrow(/Unknown icon id/);
  });

  it('renders PageHeader with optional back link, 24px title slot, description, and action', () => {
    const html = renderPageHeader({
      title: 'Answering',
      description: 'Configure automated answering.',
      backHref: '/admin',
      backLabel: 'Today',
      actionHtml: '<button type="button" class="lp-btn lp-btn-primary">Save</button>',
    });
    expect(html).toContain('lp-back-link');
    expect(html).toContain('#lp-icon-chevron-left');
    expect(html).toContain('<h1 class="lp-page-header-title">Answering</h1>');
    expect(html).toContain('lp-page-description');
    expect(html).toContain('lp-page-header-action');
  });

  it('renders Item as clickable link when no actions, and as div with ActionBar when actions exist', () => {
    const linkItem = renderItem({
      href: '/admin/entries/1',
      title: 'Entry title',
      subtitle: 'Work · Case study',
      statusLabel: 'Public',
      statusTone: 'ok',
      showChevron: true,
    });
    expect(linkItem.startsWith('<a ')).toBe(true);
    expect(linkItem).toContain('lp-item-chevron');

    const actionItem = renderItem({
      href: '/admin/audit',
      title: 'Always include source date.',
      subtitle: 'Scope: Public',
      segments: [{ heading: 'Source quote', body: 'Quote text' }],
      actions: {
        primary: { label: 'Confirm' },
        secondary: { label: 'Discard' },
      },
    });
    expect(actionItem.startsWith('<div ')).toBe(true);
    expect(actionItem).toContain('lp-action-bar');
  });

  it('renders ActionBar in primary -> secondary -> text order', () => {
    const html = renderActionBar({
      primary: { label: 'Save' },
      secondary: { label: 'Cancel' },
      textAction: { label: 'Reset' },
    });
    const pIdx = html.indexOf('Save');
    const sIdx = html.indexOf('Cancel');
    const tIdx = html.indexOf('Reset');
    expect(pIdx).toBeLessThan(sIdx);
    expect(sIdx).toBeLessThan(tIdx);
  });

  it('renders Choice button and card variants with visually hidden native input', () => {
    const card = renderChoiceGroup({
      name: 'hosting',
      mode: 'single',
      variant: 'card',
      options: [
        { value: 'local', label: 'Local', description: 'Run locally', checked: true },
        { value: 'cloud', label: 'Cloud', description: 'Managed' },
      ],
    });
    expect(card).toContain('role="radiogroup"');
    expect(card).toContain('class="lp-choice-input"');
    expect(card).toContain('lp-choice-card-title');
    expect(card).toContain('is-selected');
  });

  it('renders Tabs as tablist for <=4 tabs and Select for >=5 tabs, plus Stepper', () => {
    const tabs3 = renderTabs({
      ariaLabel: 'Filter',
      tabs: [
        { id: 'a', label: 'Pending', active: true },
        { id: 'b', label: 'Active' },
      ],
    });
    expect(tabs3).toContain('role="tablist"');

    const tabs5 = renderTabs({
      ariaLabel: 'Many',
      tabs: [
        { id: '1', label: 'One', active: true },
        { id: '2', label: 'Two' },
        { id: '3', label: 'Three' },
        { id: '4', label: 'Four' },
        { id: '5', label: 'Five' },
      ],
    });
    expect(tabs5).toContain('<select');
    expect(tabs5).not.toContain('role="tablist"');

    const stepper = renderStepper({ currentStep: 2, totalSteps: 6, stepTitle: 'Hosting' });
    expect(stepper).toContain('Step 2 of 6 · Hosting');
    expect(stepper).toContain('lp-stepper-track');
  });

  it('renders Overlay and FormSection', () => {
    const ov = renderOverlay({ id: 'ov', kind: 'dialog', title: 'Delete', bodyHtml: '<p>Sure?</p>' });
    expect(ov).toContain('role="dialog"');
    expect(ov).toContain('data-overlay-kind="dialog"');
    expect(ov).toContain('#lp-icon-close');

    const fs = renderFormSection({
      title: 'Identity',
      description: 'Public name',
      fieldsHtml: '<div class="lp-field">Field</div>',
      actionBarHtml: renderActionBar({ primary: { label: 'Save' } }),
    });
    expect(fs).toContain('lp-form-section-title');
    expect(fs).toContain('lp-form-section-desc');
    expect(fs).toContain('lp-action-bar');
  });
});
