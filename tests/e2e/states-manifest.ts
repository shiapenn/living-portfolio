/**
 * D-FINAL #1 & D-G #1 Single STATES Manifest
 * Shared by both the D-FINAL/D-G census suites and contact-sheet capture.
 * Every state x 2 themes (light, dark) x 3 viewports (320, 1280, 1920).
 */

export const THEMES = ['light', 'dark'] as const;
export type ThemeMode = (typeof THEMES)[number];

export const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
] as const;

export type ViewportSpec = (typeof VIEWPORTS)[number];

export type StateKind = 'page' | 'auth' | 'overlay' | 'editor-view' | 'flow';

export interface StateMarker {
  routePattern?: string;
  text?: string;
  selector?: string;
}

export interface StateDefinition {
  id: string;
  kind: StateKind;
  route: string;
  /** Optional setup step/interaction identifier handled by the navigator helper. */
  action?: string;
  fullPage?: boolean;
  /** D-G #1: Required visible marker verified before capture and census measurement. */
  marker: StateMarker;
  /** True if this state is introduced in F1/F2/F3 and may not yet exist at F0. */
  pendingUntil?: 'F1' | 'F2' | 'F3';
}

export const STATES: readonly StateDefinition[] = [
  // Core admin pages
  { id: 'today', kind: 'page', route: '/admin', fullPage: true, marker: { routePattern: '/admin', text: 'Today', selector: 'h1' } },
  { id: 'today-empty', kind: 'page', route: '/admin', action: 'today-empty', fullPage: true, marker: { routePattern: '/admin', text: 'Today', selector: 'h1' } },
  { id: 'entries-list', kind: 'page', route: '/admin/entries', fullPage: true, marker: { routePattern: '/admin/entries', text: 'Entries', selector: 'h1' } },
  { id: 'entries-list-empty', kind: 'page', route: '/admin/entries?q=__nonexistent_dfinal__', fullPage: true, marker: { routePattern: '/admin/entries', text: 'Entries', selector: 'h1' } },
  { id: 'entries-new', kind: 'editor-view', route: '/admin/entries/new', fullPage: true, marker: { routePattern: '/admin/entries/new', selector: '#ref-field-title' } },
  { id: 'entries-detail', kind: 'editor-view', route: '/admin/entries/:id', fullPage: true, marker: { routePattern: '/admin/entries/', selector: '#ref-writing-view' } },
  { id: 'editor-settings', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-settings', fullPage: true, marker: { routePattern: '/admin/entries/', text: 'Visibility', selector: '#ref-settings-view' } },
  { id: 'editor-tag-add', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-tag-add', fullPage: true, marker: { routePattern: '/admin/entries/', text: 'Tags', selector: '#ref-facets-list' } },
  { id: 'editor-role-suggested', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-suggested', fullPage: true, marker: { routePattern: '/admin/entries/', text: 'Suggested roles', selector: '#ref-spans-list' } },
  { id: 'editor-role-accepted', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-accepted', fullPage: true, marker: { routePattern: '/admin/entries/', text: 'Suggested roles', selector: '#ref-spans-list' } },
  { id: 'editor-role-ignored', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-ignored', fullPage: true, marker: { routePattern: '/admin/entries/', text: 'Suggested roles', selector: '#ref-spans-list' } },
  { id: 'history', kind: 'page', route: '/admin/entries/:id/history', fullPage: true, marker: { routePattern: '/history', text: 'History', selector: 'h1' } },
  { id: 'inbox', kind: 'page', route: '/admin/inbox', fullPage: true, marker: { routePattern: '/admin/inbox', text: 'Inbox', selector: 'h1' } },
  { id: 'inbox-detail', kind: 'page', route: '/admin/inbox/:id', fullPage: true, marker: { routePattern: '/admin/inbox/', selector: 'h1' } },
  { id: 'answer-rules', kind: 'page', route: '/admin/audit', fullPage: true, marker: { routePattern: '/admin/audit', text: 'Audit', selector: 'h1' } },
  { id: 'audit-contradictions', kind: 'page', route: '/admin/audit?status=contradictions', fullPage: true, marker: { routePattern: '/admin/audit', text: 'Audit', selector: '#audit-conflicts-section' } },
  { id: 'calibration', kind: 'page', route: '/admin/calibration', fullPage: true, marker: { routePattern: '/admin/calibration', text: 'Calibration', selector: 'h1' } },
  { id: 'structure', kind: 'page', route: '/admin/structure', fullPage: true, marker: { routePattern: '/admin/structure', text: 'Structure', selector: 'h1' } },
  { id: 'bookings', kind: 'page', route: '/admin/bookings', fullPage: true, marker: { routePattern: '/admin/bookings', text: 'Bookings', selector: 'h1' } },
  { id: 'ventures', kind: 'page', route: '/admin/ventures', fullPage: true, marker: { routePattern: '/admin/ventures', text: 'Ventures', selector: 'h1' } },
  { id: 'pages', kind: 'page', route: '/admin/pages', fullPage: true, marker: { routePattern: '/admin/pages', text: 'Pages', selector: 'h1' } },
  { id: 'import', kind: 'page', route: '/admin/import', fullPage: true, marker: { routePattern: '/admin/import', text: 'Import', selector: 'h1' } },
  { id: 'status', kind: 'page', route: '/admin/status', fullPage: true, marker: { routePattern: '/admin/status', text: 'Status', selector: 'h1' } },

  // Settings modules & Providers change flow (D-PROV)
  { id: 'settings-answering', kind: 'page', route: '/admin/settings/answering', fullPage: true, marker: { routePattern: '/admin/settings/answering', text: 'Answering', selector: 'h1' } },
  { id: 'settings-providers', kind: 'page', route: '/admin/settings/providers', fullPage: true, marker: { routePattern: '/admin/settings/providers', text: 'Providers', selector: 'h1' } },
  { id: 'providers-change-step-1', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-1', fullPage: true, marker: { routePattern: '/admin/settings/providers/change', text: 'Step 1 of', selector: 'h1' }, pendingUntil: 'F3' },
  { id: 'providers-change-step-2', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-2', fullPage: true, marker: { routePattern: '/admin/settings/providers/change', text: 'Step 2 of', selector: 'h1' }, pendingUntil: 'F3' },
  { id: 'providers-change-step-3', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-3', fullPage: true, marker: { routePattern: '/admin/settings/providers/change', text: 'Step 3 of', selector: 'h1' }, pendingUntil: 'F3' },
  { id: 'settings-appearance', kind: 'page', route: '/admin/settings/appearance', fullPage: true, marker: { routePattern: '/admin/settings/appearance', text: 'Appearance', selector: 'h1' } },
  { id: 'settings-notifications', kind: 'page', route: '/admin/settings/notifications', fullPage: true, marker: { routePattern: '/admin/settings/notifications', text: 'Notifications', selector: 'h1' } },
  { id: 'settings-backups', kind: 'page', route: '/admin/settings/backups', fullPage: true, marker: { routePattern: '/admin/settings/backups', text: 'Backups', selector: 'h1' } },
  { id: 'settings-visibility', kind: 'page', route: '/admin/settings/visibility', fullPage: true, marker: { routePattern: '/admin/settings/visibility', text: 'Visibility', selector: 'h1' } },
  { id: 'settings-account', kind: 'page', route: '/admin/settings/account', fullPage: true, marker: { routePattern: '/admin/settings/account', text: 'Account', selector: 'h1' } },
  { id: 'settings-home', kind: 'page', route: '/admin/settings/home', fullPage: true, marker: { routePattern: '/admin/settings/home', text: 'Home', selector: 'h1' } },

  // Auth & Setup (steps 1 to 6)
  { id: 'login', kind: 'auth', route: '/admin/login', fullPage: true, marker: { routePattern: '/admin/login', text: 'Sign in', selector: 'h1' } },
  { id: 'login-recovery', kind: 'auth', route: '/admin/login', action: 'login-recovery', fullPage: true, marker: { routePattern: '/admin/login', text: 'Recovery', selector: 'h1' } },
  { id: 'login-error', kind: 'auth', route: '/admin/login', action: 'login-error', fullPage: true, marker: { routePattern: '/admin/login', text: 'Sign in', selector: 'h1' } },
  { id: 'setup-step-1', kind: 'auth', route: '/admin/setup?step=1', action: 'setup-step-1', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 1 of 6', selector: '#wizard-step-1' } },
  { id: 'setup-step-2', kind: 'auth', route: '/admin/setup?step=2', action: 'setup-step-2', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 2 of 6', selector: '#wizard-step-2' } },
  { id: 'setup-step-3', kind: 'auth', route: '/admin/setup?step=3', action: 'setup-step-3', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 3 of 6', selector: '#wizard-step-3' } },
  { id: 'setup-step-4', kind: 'auth', route: '/admin/setup?step=4', action: 'setup-step-4', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 4 of 6', selector: '#wizard-step-4' } },
  { id: 'setup-step-5', kind: 'auth', route: '/admin/setup?step=5', action: 'setup-step-5', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 5 of 6', selector: '#wizard-step-5' } },
  { id: 'setup-step-6', kind: 'auth', route: '/admin/setup?step=6', action: 'setup-step-6', fullPage: true, marker: { routePattern: '/admin/setup', text: 'Step 6 of 6', selector: '#wizard-step-6' } },

  // Overlays
  { id: 'overlay-launcher', kind: 'overlay', route: '/admin', action: 'open-launcher', fullPage: false, marker: { selector: '#lp-launcher-panel' } },
  { id: 'overlay-account', kind: 'overlay', route: '/admin', action: 'open-account', fullPage: false, marker: { selector: '#lp-account-menu' } },
  { id: 'overlay-entries-panel', kind: 'overlay', route: '/admin/entries/:id', action: 'open-entries-panel', fullPage: false, marker: { selector: '#ref-entries-drawer' } },
  { id: 'overlay-delete-dialog', kind: 'overlay', route: '/admin/entries/:id', action: 'open-delete-dialog', fullPage: false, marker: { selector: '#ref-delete-dialog' } },
  { id: 'overlay-publish-dialog', kind: 'overlay', route: '/admin/entries/new', action: 'open-publish-dialog', fullPage: false, marker: { selector: '#ref-publish-dialog' } },
  { id: 'overlay-slash-menu', kind: 'overlay', route: '/admin/entries/new', action: 'open-slash-menu', fullPage: false, marker: { selector: '#ref-slash-menu' } },

  // Gallery & Pattern-only fixture page
  { id: 'gallery', kind: 'page', route: '/admin/_gallery', fullPage: true, marker: { routePattern: '/admin/_gallery', text: 'Gallery', selector: 'h1' } },
  { id: 'fixture-pattern', kind: 'page', route: '/admin/_fixture', fullPage: true, marker: { routePattern: '/admin/_fixture', selector: 'h1' }, pendingUntil: 'F1' },
];

export function activeStates(): readonly StateDefinition[] {
  const raw = process.env.CENSUS_STATES?.trim();
  if (!raw || raw.toUpperCase() === 'ALL') return STATES;
  const allow = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const filtered = STATES.filter((s) => allow.has(s.id));
  return filtered.length > 0 ? filtered : STATES;
}

export function sheetFileName(stateId: string, width: number, theme: ThemeMode): string {
  return `${stateId}-${width}px-${theme}.png`;
}

export function expectedSheetFiles(): string[] {
  const files: string[] = [];
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const state of STATES) {
        files.push(sheetFileName(state.id, vp.width, theme));
      }
    }
  }
  return files;
}
