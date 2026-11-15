/**
 * String catalogue for the Admin Entries List Page (WP-16.3, D-UI-1..D-UI-6, UX-12).
 */
export const ENTRIES_LIST_STRINGS = {
  pageTitle: 'Entries',
  heading: 'Entries',
  lead: 'Browse, filter, and manage your portfolio entries across drafts, unlisted, and public records.',
  newEntryLabel: 'New entry',
  filters: {
    stateLabel: 'State',
    stateAll: 'All states',
    stateDraft: 'Draft',
    stateUnlisted: 'Unlisted',
    statePublic: 'Public',
    typeLabel: 'Type',
    typeAll: 'All types',
    typeWork: 'Work',
    typeNote: 'Note',
    typeVenture: 'Venture',
    searchLabel: 'Search',
    searchPlaceholder: 'Search title or slug…',
    searchSubmit: 'Filter',
  },
  states: {
    loading: 'Loading entries…',
    error: 'Could not load entries. Please try again.',
    offline: 'Offline — showing last loaded entries. Changes require an internet connection.',
    emptyTitle: 'No matching entries',
    emptyBody: 'Adjust your filters or create a new entry to get started.',
  },
  rowActions: {
    menuLabel: 'Entry actions',
    edit: 'Edit',
    addContext: 'Add context',
    unpublish: 'Unpublish',
    del: 'Delete',
  },
  deleteDialog: {
    title: 'Delete entry permanently',
    warning: 'This permanently removes the entry, its revisions, claims, and evidence. Type DELETE to confirm.',
    inputLabel: 'Confirmation word',
    confirmLabel: 'Delete permanently',
    cancelLabel: 'Cancel',
  },
  pagination: {
    prev: 'Previous',
    next: 'Next',
    summary: (page: number, totalPages: number, total: number) =>
      `Page ${page} of ${totalPages} (${total} total)`,
  },
} as const;
