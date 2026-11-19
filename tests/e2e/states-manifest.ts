/**
 * D-FINAL #1 Single STATES Manifest
 * Shared by both the D-FINAL census suite and contact-sheet capture.
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

export interface StateDefinition {
  id: string;
  kind: StateKind;
  route: string;
  /** Optional setup step/interaction identifier handled by the navigator helper. */
  action?: string;
  fullPage?: boolean;
  /** True if this state is introduced in F1/F2/F3 and may not yet exist at F0. */
  pendingUntil?: 'F1' | 'F2' | 'F3';
}

export const STATES: readonly StateDefinition[] = [
  // Core admin pages
  { id: 'today', kind: 'page', route: '/admin', fullPage: true },
  { id: 'today-empty', kind: 'page', route: '/admin', action: 'today-empty', fullPage: true },
  { id: 'entries-list', kind: 'page', route: '/admin/entries', fullPage: true },
  { id: 'entries-list-empty', kind: 'page', route: '/admin/entries?q=__nonexistent_dfinal__', fullPage: true },
  { id: 'entries-new', kind: 'editor-view', route: '/admin/entries/new', fullPage: true },
  { id: 'entries-detail', kind: 'editor-view', route: '/admin/entries/:id', fullPage: true },
  { id: 'editor-settings', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-settings', fullPage: true },
  { id: 'editor-tag-add', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-tag-add', fullPage: true },
  { id: 'editor-role-suggested', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-suggested', fullPage: true },
  { id: 'editor-role-accepted', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-accepted', fullPage: true },
  { id: 'editor-role-ignored', kind: 'editor-view', route: '/admin/entries/:id', action: 'editor-role-ignored', fullPage: true },
  { id: 'history', kind: 'page', route: '/admin/entries/:id/history', fullPage: true },
  { id: 'inbox', kind: 'page', route: '/admin/inbox', fullPage: true },
  { id: 'inbox-detail', kind: 'page', route: '/admin/inbox/:id', fullPage: true },
  { id: 'answer-rules', kind: 'page', route: '/admin/audit', fullPage: true },
  { id: 'import', kind: 'page', route: '/admin/import', fullPage: true },
  { id: 'status', kind: 'page', route: '/admin/status', fullPage: true },

  // Settings modules & Providers change flow (D-PROV)
  { id: 'settings-answering', kind: 'page', route: '/admin/settings/answering', fullPage: true },
  { id: 'settings-providers', kind: 'page', route: '/admin/settings/providers', fullPage: true },
  { id: 'providers-change-step-1', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-1', fullPage: true, pendingUntil: 'F3' },
  { id: 'providers-change-step-2', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-2', fullPage: true, pendingUntil: 'F3' },
  { id: 'providers-change-step-3', kind: 'flow', route: '/admin/settings/providers/change', action: 'providers-step-3', fullPage: true, pendingUntil: 'F3' },
  { id: 'settings-appearance', kind: 'page', route: '/admin/settings/appearance', fullPage: true },
  { id: 'settings-notifications', kind: 'page', route: '/admin/settings/notifications', fullPage: true },
  { id: 'settings-backups', kind: 'page', route: '/admin/settings/backups', fullPage: true },

  // Auth & Setup (steps 1 to 6)
  { id: 'login', kind: 'auth', route: '/admin/login', fullPage: true },
  { id: 'login-recovery', kind: 'auth', route: '/admin/login', action: 'login-recovery', fullPage: true },
  { id: 'login-error', kind: 'auth', route: '/admin/login', action: 'login-error', fullPage: true },
  { id: 'setup-step-1', kind: 'auth', route: '/admin/setup', action: 'setup-step-1', fullPage: true },
  { id: 'setup-step-2', kind: 'auth', route: '/admin/setup', action: 'setup-step-2', fullPage: true },
  { id: 'setup-step-3', kind: 'auth', route: '/admin/setup', action: 'setup-step-3', fullPage: true },
  { id: 'setup-step-4', kind: 'auth', route: '/admin/setup', action: 'setup-step-4', fullPage: true },
  { id: 'setup-step-5', kind: 'auth', route: '/admin/setup', action: 'setup-step-5', fullPage: true },
  { id: 'setup-step-6', kind: 'auth', route: '/admin/setup', action: 'setup-step-6', fullPage: true },

  // Overlays
  { id: 'overlay-launcher', kind: 'overlay', route: '/admin', action: 'open-launcher', fullPage: false },
  { id: 'overlay-account', kind: 'overlay', route: '/admin', action: 'open-account', fullPage: false },
  { id: 'overlay-entries-panel', kind: 'overlay', route: '/admin/entries/:id', action: 'open-entries-panel', fullPage: false },
  { id: 'overlay-delete-dialog', kind: 'overlay', route: '/admin/entries/:id', action: 'open-delete-dialog', fullPage: false },
  { id: 'overlay-publish-dialog', kind: 'overlay', route: '/admin/entries/new', action: 'open-publish-dialog', fullPage: false },
  { id: 'overlay-slash-menu', kind: 'overlay', route: '/admin/entries/new', action: 'open-slash-menu', fullPage: false },

  // Gallery & Pattern-only fixture page
  { id: 'gallery', kind: 'page', route: '/admin/_gallery', fullPage: true },
  { id: 'fixture-pattern', kind: 'page', route: '/admin/_fixture', fullPage: true, pendingUntil: 'F1' },
];

export function sheetFileName(stateId: string, width: number, theme: ThemeMode): string {
  return `${stateId}-${width}px-${theme}.png`;
}

export function expectedSheetFiles(): string[] {
  const files: string[] = [];
  for (const state of STATES) {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        files.push(sheetFileName(state.id, vp.width, theme));
      }
    }
  }
  return files;
}
