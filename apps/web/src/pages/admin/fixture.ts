import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
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
  renderSubsection,
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
        segments: [
          { heading: 'From your reply', body: 'Quoted answer passage.' },
          { heading: 'Rule', body: 'Always verify with primary evidence.' },
        ],
        statusLabel: 'Public',
        statusTone: 'ok',
        actions: {
          secondary: { label: 'Review', variant: 'secondary', type: 'button' },
        },
      })}</div>`,
  });

  const sub1 = renderSubsection({
    title: 'First subsection',
    intro: 'Intro for first subsection.',
    bodyHtml: renderField({ id: 'fix-sub-a', name: 'fixSubA', label: 'Sub field', kind: 'input' }),
  });
  const sub2 = renderSubsection({
    title: 'Second subsection',
    intro: 'Intro for second subsection.',
    bodyHtml: renderField({ id: 'fix-sub-b', name: 'fixSubB', label: 'Sub field B', kind: 'input' }),
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

  const extraSection = renderFormSection({
    id: 'fixture-subsections',
    title: 'Subsections',
    description: 'Nested subsections inside a FormSection.',
    fieldsHtml: renderStack({ gap: 'group', childrenHtml: `${sub1}${sub2}` }),
  });

  const pageAction = renderActionBar({
    pageLevel: true,
    primary: { label: 'Save all', variant: 'primary', type: 'button' },
  });

  const body = renderPageTemplate({
    title: 'Pattern Fixture',
    description: 'Verifies all primitives and patterns compose without custom page CSS.',
    bodyHtml: renderStack({
      gap: 'group',
      childrenHtml:
        renderStack({
          gap: 'related',
          childrenHtml: `${tabs}${seg}${level}${tags}${items}${stepper}${wizard}`,
        }) +
        renderStack({
          gap: 'section',
          childrenHtml: `${form}${extraSection}${pageAction}`,
        }),
    }),
  });

  return renderAdminShell('Pattern Fixture', '/admin/_fixture', body);
}
