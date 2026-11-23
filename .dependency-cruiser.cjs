/**
 * Dependency Cruiser configuration (WP-16.M D-M1)
 * Enforces:
 * 1. Downward-only tier imports: tokens -> primitives -> components -> patterns -> templates -> pages.
 * 2. Zero circular dependencies across design packages and apps.
 * 3. Mutual isolation: packages/ui-admin and packages/ui-public may never import each other.
 * 4. Both language packages may import packages/ui-core and packages/design-tokens.
 * 5. Apps import packages only through public entry points (never deep-importing packages/* /src/*).
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-admin-importing-public',
      severity: 'error',
      comment: 'D-M1: packages/ui-admin may never import packages/ui-public.',
      from: { path: '^(packages/ui-admin|apps/web/src/pages/admin|apps/web/src/layouts/admin-shell)' },
      to: { path: '^(packages/ui-public|apps/web/src/pages/public|apps/web/src/layouts/public-shell)' },
    },
    {
      name: 'no-public-importing-admin',
      severity: 'error',
      comment: 'D-M1: packages/ui-public may never import packages/ui-admin.',
      from: { path: '^(packages/ui-public|apps/web/src/pages/public|apps/web/src/layouts/public-shell)' },
      to: { path: '^(packages/ui-admin|apps/web/src/pages/admin|apps/web/src/layouts/admin-shell)' },
    },
    {
      name: 'no-core-importing-languages',
      severity: 'error',
      comment: 'D-M1: packages/ui-core may never import ui-admin or ui-public.',
      from: { path: '^packages/ui-core' },
      to: { path: '^packages/ui-(admin|public)' },
    },
    {
      name: 'no-tokens-importing-ui',
      severity: 'error',
      comment: 'D-M1: packages/design-tokens is the lowest tier and may not import ui packages.',
      from: { path: '^packages/design-tokens' },
      to: { path: '^packages/ui-' },
    },
    {
      name: 'apps-import-packages-via-public-entrypoint',
      severity: 'error',
      comment: 'D-M1: apps must import packages only through public entry points.',
      from: { path: '^apps/' },
      to: { path: '^packages/[^/]+/src/' },
    },
    {
      name: 'downward-only-primitives',
      severity: 'error',
      comment: 'D-M1: primitives may not import components, patterns, templates, or pages.',
      from: { path: '/primitives/' },
      to: { path: '/(components|patterns|templates|pages)/' },
    },
    {
      name: 'downward-only-components',
      severity: 'error',
      comment: 'D-M1: components may not import patterns, templates, or pages.',
      from: { path: '/components/' },
      to: { path: '/(patterns|templates|pages)/' },
    },
    {
      name: 'downward-only-patterns',
      severity: 'error',
      comment: 'D-M1: patterns may not import templates or pages.',
      from: { path: '/patterns/' },
      to: { path: '/(templates|pages)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
