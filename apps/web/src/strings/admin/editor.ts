/**
 * Owner-facing strings catalogue for the Reference Editor Page (D-HELP, D-FEEDBACK, D-EDITOR, D-FOUND-6).
 * Plain owner-facing words only: no internal levels, pipeline terms, HTTP codes or finding IDs.
 * Copy never points "above" or "below" (D-FOUND-6).
 */

import { formatCount } from '../formatters.js';

export { formatCount };

export const EDITOR_STRINGS = {
  pageTitle: 'Entries',
  brand: 'Living Portfolio Admin',
  nav: {
    label: 'Admin navigation',
    entries: 'Entries',
    import: 'Import',
    settings: 'Settings',
    publicSite: 'View public site',
    signOut: 'Sign out',
    menu: 'Open workspace menu',
    toDark: 'Switch to dark theme',
    toLight: 'Switch to light theme',
  },
  sidebar: {
    heading: 'Entries',
    newEntry: 'New entry',
    untitled: 'Untitled entry',
  },
  states: { draft: 'Draft', unlisted: 'Unlisted', public: 'Public' },
  emptyState: {
    title: 'No entry selected',
    body: 'Choose an entry from the list or start a new draft.',
    action: 'Start a draft',
  },
  firstRun: {
    title: 'Write your first entry',
    body: 'Capture decisions, trade-offs and lessons while they are fresh.',
    action: 'Start your first draft',
    dismiss: 'Hide getting-started guide',
    steps: [
      { title: 'Draft in private', body: 'Every entry starts as a private draft.' },
      { title: 'Check before sharing', body: 'Publish runs a private-details check for you.' },
      { title: 'Choose who sees it', body: 'Keep it unlisted for a link, or make it public.' },
    ],
  },
  fields: {
    titleLabel: 'Title',
    titlePlaceholder: 'Give this entry a clear title',
    titleError: 'Add a title.',
    bodyLabel: 'Body',
    bodyPlaceholder: 'Write in plain text or Markdown…',
    slugLabel: 'URL slug',
    profileLabel: 'Role profile',
    dateLabel: 'Entry date',
    temporalLabel: 'Temporal confidence',
  },
  profiles: [
    { value: 'case-study', label: 'Case Study' },
    { value: 'decision', label: 'Decision Record' },
    { value: 'build-note', label: 'Build Note' },
    { value: 'freeform', label: 'Freeform Essay' },
  ],
  profileShort: {
    'case-study': 'Case Study',
    decision: 'Decision Record',
    'build-note': 'Build Note',
    freeform: 'Freeform Essay',
  } as Record<string, string>,
  temporal: [
    { value: 'exact', label: 'Exact date (day precision)' },
    { value: 'estimated', label: 'Estimated month or quarter' },
    { value: 'range', label: 'Date range (start to end)' },
  ],
  temporalShort: { exact: 'Exact date', estimated: 'Estimated', range: 'Date range' } as Record<string, string>,
  actions: {
    saveDraft: 'Save draft',
    saveChanges: 'Save changes',
    saving: 'Saving…',
    publish: 'Publish…',
    visibility: 'Visibility',
    more: 'More entry actions',
    history: 'History',
    deleteEntry: 'Delete entry…',
    structure: 'Structure',
    undo: 'Undo',
  },
  visibilityMenu: {
    public: 'Public — listed on your site',
    unlisted: 'Unlisted — anyone with the link',
    draft: 'Private — only you',
  },
  details: { summary: 'Details' },
  publishDialog: {
    title: 'Publish entry',
    checkTitle: 'Private-details check',
    checking: 'Checking for private details…',
    clean: 'No private details found.',
    matched: 'Possible private details found. Review them, then confirm to continue.',
    ndaTitle: 'Confidentiality confirmation',
    ndaLabel: 'I confirm this entry shares no confidential or client-restricted information.',
    nextTitle: 'What happens next',
    nextSummary: 'The entry appears on your public site and can be quoted in visitor answers.',
    confirm: 'Publish now',
    cancel: 'Cancel',
    blocked: 'Tick the confidentiality confirmation to publish.',
  },
  deleteDialog: {
    title: 'Delete this entry?',
    body: 'The entry is removed from your workspace and your site. You can undo for 8 seconds.',
    confirm: 'Delete entry',
    cancel: 'Cancel',
  },
  historyDrawer: {
    title: 'History',
    empty: 'No saved versions in this session yet.',
    savedAt: 'Saved version',
  },
  structureDrawer: {
    title: 'Structure',
    intro: 'Connect this entry to your themes and evidence.',
    tabs: { summary: 'Summary', context: 'Context', evidence: 'Evidence' },
    summaryText: 'State the goal, the decision and the outcome so visitors can follow your reasoning.',
    contextText: 'Link this entry to the projects or topics it belongs to.',
    evidenceText: 'Attach notes or links that back up key claims.',
  },
  feedback: {
    savedDraft: 'Draft saved.',
    savedChanges: 'Changes saved.',
    noChangesToSave: 'No changes to save.',
    published: 'Entry is now public.',
    unlisted: 'Entry is now unlisted.',
    madePrivate: 'Entry is now private.',
    deleted: 'Entry deleted.',
    restored: 'Restored.',
    errorTitleRequired: 'Enter a title to save this entry.',
    saveFailed: 'Could not save this entry. Try again.',
  },
} as const;
