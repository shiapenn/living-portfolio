/**
 * Owner-facing strings catalogue for the Reference Editor Page (D-HELP, D-FEEDBACK, D-EDITOR).
 * Contains plain owner-facing words only — zero internal levels, pipeline terms, HTTP codes, or finding IDs.
 */

export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const EDITOR_STRINGS = {
  pageTitle: 'Entries — Editor',
  nav: {
    today: 'Today',
    entries: 'Entries',
    inbox: 'Inbox',
    settings: 'Settings',
    signOut: 'Sign out',
    themeToggle: 'Switch theme',
  },
  sidebar: {
    heading: 'Entries',
    newEntry: 'New entry',
    emptyList: 'No entries yet.',
  },
  emptyState: {
    title: 'Write your first entry',
    body: 'Start a draft to record a decision, project update, or engineering note.',
    action: 'Start a draft',
  },
  walkthrough: {
    heading: 'Getting started',
    dismiss: 'Dismiss guide',
    steps: [
      { title: '1. Write a draft', body: 'Add a clear title and your notes in the writing area.' },
      { title: '2. Review details', body: 'Open Details to check the web address, date, and visibility.' },
      { title: '3. Publish safely', body: 'Use Publish to scan for private details before sharing.' },
    ],
  },
  fields: {
    titleLabel: 'Title',
    titlePlaceholder: 'Give this entry a clear title',
    titleHelp: 'Shown at the top of the entry and in entry lists.',
    bodyLabel: 'Body',
    bodyPlaceholder: 'Write your notes in plain text or Markdown…',
    bodyHelp: 'Supports headings, lists, links, and code blocks.',
    slugLabel: 'Web address slug',
    slugHelp: 'Used in the link after /work/ or /writing/.',
    profileLabel: 'Entry type',
    profileHelp: 'Choose the structure that fits this entry.',
    visibilityLabel: 'Visibility',
    visibilityHelp: 'Draft stays private, Unlisted opens by link only, Public appears on your site.',
    dateLabel: 'Date',
    dateHelp: 'The date shown to visitors.',
    temporalLabel: 'Date precision',
    temporalHelp: 'Choose Exact when you know the day, or Estimated/Range for older notes.',
  },
  actions: {
    saveDraft: 'Save draft',
    saveChanges: 'Save changes',
    publishEllipsis: 'Publish…',
    makePublicEllipsis: 'Make public…',
    visibilityMenu: 'Visibility',
    moreMenu: 'More',
    makePrivate: 'Make private',
    history: 'History',
    deleteEntry: 'Delete',
    structure: 'Structure',
    undo: 'Undo',
  },
  details: {
    summary: 'Details',
  },
  publishDialog: {
    title: 'Publish entry',
    step1Title: '1. Private-details check',
    step1Scanning: 'Checking for sensitive or private details…',
    step1Clean: 'No private details found.',
    step1Matched: 'Possible private details found. Review or mask them before publishing.',
    step2NdaTitle: '2. Confidentiality confirmation',
    step2NdaLabel: 'I confirm this entry does not share confidential or client-restricted information.',
    step2CleanTitle: '2. Choose visibility',
    step3CleanTitle: '3. What happens next',
    step3NdaTitle: '3. Choose visibility',
    step4NdaTitle: '4. What happens next',
    nextSummary: 'Your entry will appear on your public site and can be cited in visitor answers.',
    confirmPublish: 'Publish now',
    cancel: 'Cancel',
  },
  structureDrawer: {
    title: 'Structure',
    intro: 'Organise how this entry connects to your portfolio themes and evidence.',
    tabs: {
      summary: 'Summary',
      context: 'Context',
      evidence: 'Evidence',
    },
    summaryText: 'Add clear goals, decisions, and outcomes in your writing so visitors can follow your reasoning.',
    contextText: 'Link this entry to the projects or topics it belongs to.',
    evidenceText: 'Attach supporting notes or links that back up key claims.',
  },
  feedback: {
    savedDraft: 'Saved draft.',
    savedChanges: 'Saved changes.',
    published: 'Entry is now public.',
    madePrivate: 'Moved to Private.',
    deleted: 'Entry deleted.',
    restored: 'Restored previous state.',
    errorTitleRequired: 'Enter a title before saving.',
    errorSaveFailed: 'Could not save this entry. Check the highlighted fields and try again.',
    errorPublishBlocked: 'Confirm the confidentiality check before publishing.',
  },
} as const;
