/**
 * String catalogue for the Admin Today Dashboard (WP-16.2, D-UI-1..D-UI-6, CP-13).
 */
export const DASHBOARD_STRINGS = {
  pageTitle: 'Today',
  heading: 'Today',
  lead: 'What needs your attention.',
  explanation: {
    what: 'Today surfaces pending visitor questions, unpublished drafts, build errors, and backup reminders in one queue.',
    when: 'Check this view at the start of a writing session or after publishing.',
    how: 'Follow an item link to review or resolve it; dismiss the getting-started checklist once your workspace is configured.',
    impact: 'Keeps public answers verified, backups current, and drafts moving without cluttering the editor.',
  },
  attention: {
    heading: 'Needs attention',
    empty: 'Everything is caught up. No pending questions, drafts, or system alerts.',
    questionsDueLabel: (count: number) =>
      `${count} visitor ${count === 1 ? 'question' : 'questions'} waiting for review`,
    questionsDueAction: 'Review Inbox',
    draftsLabel: (count: number) =>
      `${count} unpublished ${count === 1 ? 'draft' : 'drafts'} in workspace`,
    draftsAction: 'Open Editor',
    buildFailureLabel: 'Last static site build failed — review build settings or retry publish.',
    buildFailureAction: 'Check Settings',
    backupOverdueLabel: 'Backup verification is overdue — run an encrypted backup drill.',
    backupOverdueAction: 'Run Backup Drill',
  },
  checklist: {
    heading: 'Getting started checklist',
    dismissLabel: 'Dismiss checklist',
    steps: [
      { id: 'step-entry', label: 'Write or import your first portfolio entry', href: '/admin' },
      { id: 'step-routing', label: 'Review automated answering thresholds', href: '/admin/settings' },
      { id: 'step-backup', label: 'Verify encrypted backup destination', href: '/admin/settings' },
    ],
  },
} as const;
