import { renderAdminShell } from '../../layouts/admin-shell.js';
import {
  renderActionBar,
  renderChoiceGroup,
  renderField,
  renderFormSection,
  renderItem,
  renderLevel,
  renderPageHeader,
  renderSectionHeader,
  renderSegmentedControl,
  renderStack,
  renderStepper,
  renderTabs,
  renderTag,
} from '../../primitives/index.js';
import { renderProviderFlow } from '../../patterns/provider-flow.js';

/**
 * Pattern-only fixture page (/admin/_fixture, dev/test only).
 * Built solely from patterns and primitives with zero custom CSS (D-FINAL #6).
 */
export function renderFixturePatternPage(): string {
  const header = renderPageHeader({
    id: 'fixture-header',
    title: 'Pattern Fixture',
    description: 'Verifies all primitives and patterns compose without custom page CSS.',
  });

  const tabs = renderTabs({
    id: 'fixture-tabs',
    ariaLabel: 'Fixture views',
    tabs: [
      { id: 'tab-a', label: 'All', href: '#all', active: true },
      { id: 'tab-b', label: 'Active', href: '#active', active: false },
    ],
  });

  const seg = renderSegmentedControl({
    id: 'fixture-segmented',
    ariaLabel: 'View mode',
    options: [
      { value: 'edit', label: 'Edit', id: 'fixture-seg-edit' },
      { value: 'settings', label: 'Settings', id: 'fixture-seg-settings' },
    ],
    selectedValue: 'edit',
  });

  const level = renderLevel({
    id: 'fixture-level',
    current: 'Tagged',
    nextStep: 'Add a claim to reach Claimed.',
  });

  const tags = renderStack({
    gap: 'tight',
    childrenHtml: `<div class="lp-row lp-gap-8 lp-row-wrap">${renderTag({
      label: 'Systems',
      category: 'Topic',
    })}${renderTag({ label: 'Scale', category: 'Outcome' })}</div>`,
  });

  const items = renderStack({
    gap: 'tight',
    childrenHtml:
      renderSectionHeader({ title: 'Items' }) +
      `<div class="lp-item-list">${renderItem({
        title: 'First item row',
        subtitle: 'Work',
        statusLabel: 'Draft',
        statusTone: 'neutral',
        showChevron: true,
        href: '/admin/entries',
      })}${renderItem({
        title: 'Second item row',
        subtitle: 'Writing',
        body: 'Plain body sentence inside an item.',
        statusLabel: 'Public',
        statusTone: 'ok',
        actions: {
          secondary: { label: 'Review', variant: 'secondary', type: 'button' },
        },
      })}</div>`,
  });

  const form = renderFormSection({
    id: 'fixture-form',
    title: 'Settings fields',
    description: 'Vertical fields only.',
    fieldsHtml:
      renderField({
        kind: 'input',
        id: 'fixture-input',
        name: 'fixtureInput',
        label: 'Title',
        value: 'Sample title',
        help: 'One line of help text.',
      }) +
      renderField({
        kind: 'select',
        id: 'fixture-select',
        name: 'fixtureSelect',
        label: 'Category',
        value: 'work',
        options: [
          { value: 'work', label: 'Work' },
          { value: 'writing', label: 'Writing' },
        ],
      }) +
      renderChoiceGroup({
        id: 'fixture-choice',
        name: 'fixtureChoice',
        mode: 'single',
        variant: 'card',
        options: [
          { value: 'a', label: 'Option A', description: 'First choice card.', checked: true },
          { value: 'b', label: 'Option B', description: 'Second choice card.' },
        ],
      }) +
      renderActionBar({
        primary: { label: 'Save', variant: 'primary', type: 'button' },
        secondary: { label: 'Cancel', variant: 'secondary', type: 'button' },
      }),
  });

  const wizard = renderProviderFlow({
    step: 1,
    selectedProvider: 'local',
  });

  const stepper = renderStepper({
    currentStep: 1,
    totalSteps: 3,
    stepTitle: 'Add material',
  });

  const body = renderStack({
    gap: 'group',
    childrenHtml:
      header +
      renderStack({
        gap: 'related',
        childrenHtml: `${tabs}${seg}${level}${tags}${items}${form}${stepper}${wizard}`,
      }),
  });

  return renderAdminShell('Pattern Fixture', '/admin/_fixture', body);
}
