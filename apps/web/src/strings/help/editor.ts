import type { HelpCatalogue } from './schema.js';

export const EDITOR_HELP = {
  visibility: {
    id: 'editor.visibility',
    title: 'Entry visibility',
    what: 'Controls who can read this entry and whether visitor answers can quote it.',
    when: 'Choose Private while drafting, Unlisted for a shareable link, or Public to list it on your site.',
    how: 'Use Publish… on a draft, or change visibility from the Visibility menu on a published entry.',
    impact: 'Public entries appear on your portfolio and feed visitor answers; Private entries stay visible only to you.',
    options: [
      {
        value: 'draft',
        label: 'Private',
        bestFor: 'Work in progress and private notes.',
        tradeOff: 'Hidden from visitors and excluded from visitor answers.',
      },
      {
        value: 'unlisted',
        label: 'Unlisted',
        bestFor: 'Sharing a direct link with specific reviewers.',
        tradeOff: 'Anyone with the link can read it, but it stays off your public index.',
      },
      {
        value: 'public',
        label: 'Public',
        bestFor: 'Finished writing you want featured on your site.',
        tradeOff: 'Listed publicly and quotable in visitor answers after a private-details check.',
      },
    ],
  },
  roleProfile: {
    id: 'editor.roleProfile',
    title: 'Role profile',
    what: 'Describes the shape of the entry so visitors know what kind of piece they are reading.',
    when: 'Pick the profile that best matches how you wrote the entry.',
    how: 'Select a profile in Details before or after saving.',
    impact: 'Helps readers scan your work by case study, decision record, build note, or essay.',
    options: [
      {
        value: 'case-study',
        label: 'Case Study',
        bestFor: 'Projects with a clear goal, intervention, and outcome.',
        tradeOff: 'Works best when you include measurable results or concrete context.',
      },
      {
        value: 'decision',
        label: 'Decision Record',
        bestFor: 'Architectural or product choices and why you made them.',
        tradeOff: 'Focuses on alternatives and trade-offs rather than narrative flow.',
      },
      {
        value: 'build-note',
        label: 'Build Note',
        bestFor: 'Short technical logs, experiments, or implementation notes.',
        tradeOff: 'Less formal than a full case study.',
      },
      {
        value: 'freeform',
        label: 'Freeform Essay',
        bestFor: 'Reflections, essays, and broader perspective pieces.',
        tradeOff: 'No fixed sections; relies on clear headings and prose.',
      },
    ],
  },
  temporalConfidence: {
    id: 'editor.temporalConfidence',
    title: 'Temporal confidence',
    what: 'Records how exact the entry date is.',
    when: 'Use Exact date when you know the day, or Estimated / Date range for older recollections.',
    how: 'Choose the precision level in Details next to Entry date.',
    impact: 'Prevents timelines from overstating precision on older work.',
    options: [
      {
        value: 'exact',
        label: 'Exact date',
        bestFor: 'Recent work or dated milestones.',
        tradeOff: 'Displays the exact date you enter.',
      },
      {
        value: 'estimated',
        label: 'Estimated',
        bestFor: 'Work where only the month or quarter is certain.',
        tradeOff: 'Signals to readers that the day is approximate.',
      },
      {
        value: 'range',
        label: 'Date range',
        bestFor: 'Multi-month efforts or ongoing roles.',
        tradeOff: 'Represents a span rather than a single day.',
      },
    ],
  },
  privateDetailsCheck: {
    id: 'editor.privateDetailsCheck',
    title: 'Private-details check',
    what: 'Scans your entry for emails, tokens, internal hosts, or sensitive client details before publishing.',
    when: 'Runs automatically whenever you open Publish… or switch an entry to Public.',
    how: 'Review any highlighted matches and confirm confidentiality before clicking Publish now.',
    impact: 'Reduces the risk of accidentally publishing confidential or personal data.',
  },
  urlSlug: {
    id: 'editor.urlSlug',
    title: 'URL slug',
    what: 'The short web address segment used for this entry.',
    when: 'Leave blank to generate one from the title, or enter a custom slug in Details.',
    how: 'Use lowercase letters, numbers, and hyphens.',
    impact: 'Changing a published slug changes its web address.',
  },
} as const satisfies HelpCatalogue;
