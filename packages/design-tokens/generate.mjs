#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const TOKENS_PATH = resolve(__dirname, 'tokens.json');

export function loadTokens() {
  return JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
}

function primitiveToCssVar(cat, key) {
  if (cat === 'zIndex') return `--lp-prim-z-${key}`;
  if (cat === 'font') return `--lp-prim-font-${key}`;
  return `--lp-prim-${cat}-${key}`;
}

function semanticToCssVar(key) {
  const parts = key.split('.');
  if (parts[0] === 'elevation') return `--lp-elevation-${parts.slice(1).join('-')}`;
  if (parts[0] === 'opacity') return `--lp-opacity-${parts.slice(1).join('-')}`;
  return `--lp-${parts.join('-')}`;
}

function componentToCssVar(key) {
  const parts = key.split('.');
  return `--lp-${parts.join('-')}`;
}

function resolveRef(ref, tokens, mode = 'light') {
  if (typeof ref !== 'string' || !ref.startsWith('{') || !ref.endsWith('}')) return ref;
  const path = ref.slice(1, -1).split('.');
  if (path[0] === 'primitive') {
    const [, cat, ...rest] = path;
    return tokens.primitive?.[cat]?.[rest.join('.')] ?? ref;
  }
  if (path[0] === 'semantic') {
    const semKey = path.slice(1).join('.');
    const raw = tokens.semantic?.[mode]?.[semKey];
    return raw ? resolveRef(raw, tokens, mode) : ref;
  }
  return ref;
}

function refToVar(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('{') || !ref.endsWith('}')) return ref;
  const path = ref.slice(1, -1).split('.');
  if (path[0] === 'primitive') {
    const [, cat, ...rest] = path;
    return `var(${primitiveToCssVar(cat, rest.join('.'))})`;
  }
  if (path[0] === 'semantic') {
    return `var(${semanticToCssVar(path.slice(1).join('.'))})`;
  }
  return ref;
}

export function generateOutputs() {
  const tokens = loadTokens();

  const primitiveVars = {};
  for (const [cat, entries] of Object.entries(tokens.primitive)) {
    for (const [k, v] of Object.entries(entries)) {
      primitiveVars[primitiveToCssVar(cat, k)] = v;
    }
  }

  const semanticLightVars = {};
  const semanticLightResolved = {};
  for (const [k, v] of Object.entries(tokens.semantic.light)) {
    const cssName = semanticToCssVar(k);
    semanticLightVars[cssName] = refToVar(v);
    semanticLightResolved[cssName] = resolveRef(v, tokens, 'light');
  }

  const semanticDarkVars = {};
  const semanticDarkResolved = {};
  for (const [k, v] of Object.entries(tokens.semantic.dark)) {
    const cssName = semanticToCssVar(k);
    semanticDarkVars[cssName] = refToVar(v);
    semanticDarkResolved[cssName] = resolveRef(v, tokens, 'dark');
  }

  const componentVars = {};
  const componentResolved = {};
  for (const [k, v] of Object.entries(tokens.component)) {
    const cssName = componentToCssVar(k);
    componentVars[cssName] = refToVar(v);
    componentResolved[cssName] = resolveRef(v, tokens, 'light');
  }

  const relationVars = {};
  const relationsResolved = {};
  for (const [k, v] of Object.entries(tokens.relations)) {
    const cssName = `--lp-rel-${k}`;
    relationVars[cssName] = refToVar(v);
    const res = resolveRef(v, tokens, 'light');
    relationsResolved[k] = typeof res === 'string' && res.endsWith('px') ? parseFloat(res) : res;
  }

  const typeRoleVars = {};
  const typeRolesResolved = {};
  for (const [role, spec] of Object.entries(tokens.typographyRoles)) {
    typeRoleVars[`--lp-type-${role}-family`] = refToVar(spec.family);
    typeRoleVars[`--lp-type-${role}-size`] = refToVar(spec.size);
    typeRoleVars[`--lp-type-${role}-weight`] = refToVar(spec.weight);
    typeRoleVars[`--lp-type-${role}-line`] = refToVar(spec.lineHeight);
    typeRoleVars[`--lp-type-${role}-letter`] = refToVar(spec.letterSpacing);
    typeRoleVars[`--lp-type-${role}-color`] = refToVar(spec.color);
    typeRolesResolved[role] = {
      family: resolveRef(spec.family, tokens, 'light'),
      size: parseFloat(resolveRef(spec.size, tokens, 'light')),
      weight: Number(resolveRef(spec.weight, tokens, 'light')),
      lineHeight: parseFloat(resolveRef(spec.lineHeight, tokens, 'light')),
      letterSpacing: resolveRef(spec.letterSpacing, tokens, 'light'),
      colorToken: semanticToCssVar(spec.color.slice(1, -1).split('.').slice(1).join('.')),
    };
  }

  // Legacy semantic aliases for smooth transition & runtime theme overrides
  const legacyAliasesLight = `
  color-scheme: light;
  --surface-l0: var(--lp-color-surface-l0);
  --surface-l1: var(--lp-color-surface-l1);
  --surface-l2: var(--lp-color-surface-l2);
  --surface-page: var(--lp-color-surface-page);
  --surface-raised: var(--lp-color-surface-raised);
  --surface-overlay: var(--lp-color-surface-overlay);
  --surface-sunken: var(--lp-color-surface-sunken);
  --surface-subtle: var(--lp-color-surface-subtle);
  --surface-panel: var(--lp-color-surface-panel);
  --surface: var(--lp-color-surface-l0);
  --surface-input: var(--lp-color-surface-input);
  --surface-control: var(--lp-color-surface-control);
  --surface-control-hover: var(--lp-color-surface-control-hover);
  --surface-control-active: var(--lp-color-surface-control-active);
  --surface-control-selected: var(--lp-color-surface-control-selected);
  --text-1: var(--lp-color-text-1);
  --text-2: var(--lp-color-text-2);
  --text-3: var(--lp-color-text-3);
  --text: var(--lp-color-text-1);
  --text-muted: var(--lp-color-text-2);
  --text-on-accent: var(--lp-color-text-on-accent);
  --rule: var(--lp-color-border-subtle);
  --border-subtle: var(--lp-color-border-subtle);
  --border-control: var(--lp-color-border-control);
  --border-overlay: var(--lp-color-border-overlay);
  --accent: var(--lp-color-accent-default);
  --focus-ring: var(--lp-color-accent-focus-ring);
  --role-action-fg: var(--lp-color-role-action-fg);
  --role-action-bg: var(--lp-color-role-action-bg);
  --role-action-border: var(--lp-color-role-action-border);
  --role-neutral-fg: var(--lp-color-role-neutral-fg);
  --role-neutral-bg: var(--lp-color-role-neutral-bg);
  --role-neutral-border: var(--lp-color-role-neutral-border);
  --role-success-fg: var(--lp-color-role-success-fg);
  --role-success-bg: var(--lp-color-role-success-bg);
  --role-success-border: var(--lp-color-role-success-border);
  --role-warning-fg: var(--lp-color-role-warning-fg);
  --role-warning-bg: var(--lp-color-role-warning-bg);
  --role-warning-border: var(--lp-color-role-warning-border);
  --role-danger-fg: var(--lp-color-role-danger-fg);
  --role-danger-bg: var(--lp-color-role-danger-bg);
  --role-danger-border: var(--lp-color-role-danger-border);
  --role-info-fg: var(--lp-color-role-info-fg);
  --role-info-bg: var(--lp-color-role-info-bg);
  --role-info-border: var(--lp-color-role-info-border);
  --role-goal: var(--lp-color-role-goal);
  --role-approach: var(--lp-color-role-approach);
  --role-friction: var(--lp-color-role-friction);
  --role-challenge: var(--lp-color-role-friction);
  --role-decision: var(--lp-color-role-decision);
  --role-outcome: var(--lp-color-role-outcome);
  --role-lesson: var(--lp-color-role-lesson);
  --role-neutral: var(--lp-color-role-neutral);
  --status-warn: var(--lp-color-status-warn);
  --status-error: var(--lp-color-status-error);
  --status-ok: var(--lp-color-status-ok);
  --status-success-bg: var(--lp-color-role-success-bg);
  --status-success-fg: var(--lp-color-role-success-fg);
  --status-success-border: var(--lp-color-role-success-border);
  --status-warn-bg: var(--lp-color-role-warning-bg);
  --status-warn-fg: var(--lp-color-role-warning-fg);
  --status-warn-border: var(--lp-color-role-warning-border);
  --status-danger-bg: var(--lp-color-role-danger-bg);
  --status-danger-fg: var(--lp-color-role-danger-fg);
  --status-danger-border: var(--lp-color-role-danger-border);
  --state-future-text: var(--lp-color-text-future);
  --state-provisional-border: var(--lp-color-border-provisional);
  --shadow-e1: var(--lp-elevation-e1);
  --shadow-e1-up: var(--lp-elevation-e1-up);
  --shadow-e1-right: var(--lp-elevation-e1-right);
  --shadow-e2: var(--lp-elevation-e2);
  --shadow-overlay: var(--lp-elevation-e2);
  --backdrop: var(--lp-color-surface-backdrop);
  --z-base: var(--lp-z-base);
  --z-sticky: var(--lp-z-sticky);
  --z-overlay: var(--lp-z-overlay);
  --z-toast: var(--lp-z-toast);
  --vv-bottom: 0px;
  --space-1: var(--lp-space-4);
  --space-2: var(--lp-space-8);
  --space-3: var(--lp-space-8);
  --space-4: var(--lp-space-16);
  --space-6: var(--lp-space-24);
  --space-8: var(--lp-space-24);
  --space-12: var(--lp-space-40);
  --space-16: var(--lp-space-64);
  --space-18: var(--lp-space-64);
  --space-inline: var(--lp-space-8);
  --space-field: var(--lp-space-16);
  --space-section: var(--lp-space-40);
  --gutter: var(--lp-size-gutter);
  --gap-tight: var(--lp-space-8);
  --gap-related: var(--lp-space-16);
  --gap-group: var(--lp-space-24);
  --gap-section: var(--lp-space-40);
  --r1: var(--lp-radius-r1);
  --r2: var(--lp-radius-r2);
  --radius-control: var(--lp-radius-control);
  --radius-container: var(--lp-radius-container);
  --radius-overlay: var(--lp-radius-overlay);
  --radius-pill: var(--lp-radius-pill);
  --radius-chip: var(--lp-radius-chip);
  --radius-card: var(--lp-radius-card);
  --control-height: var(--lp-size-control-height);
  --button-height-md: var(--lp-size-control-height);
  --button-height-sm: var(--lp-size-control-height);
  --button-bg: var(--lp-color-accent-default);
  --button-fg: var(--lp-color-text-on-accent);
  --button-radius: var(--lp-radius-control);
  --chip-radius: var(--lp-radius-pill);
  --chip-border: var(--lp-color-border-control);
  --field-border: var(--lp-color-border-control);
  --field-radius: var(--lp-radius-control);
  --layout-list-col: var(--lp-size-layout-list-col);
  --layout-main-max: var(--lp-size-layout-main-max);
  --size-layout-max: var(--lp-size-layout-max);
  --layout-max: var(--lp-size-layout-max);
  --measure-reading: var(--lp-prim-size-measure-reading);
  --rail-width: var(--lp-size-layout-rail-width);
  --size-target-min: var(--lp-size-target-min);
  --admin-nav-width: var(--lp-size-admin-nav-width);
  --admin-inspector-width: var(--lp-size-admin-inspector-width);
  --strata-band-min: var(--lp-size-strata-band-min);
  --strata-band-max: var(--lp-size-strata-band-max);
  --role-section-rule-width: var(--lp-border-role-rule);
  --banner-rule-width: var(--lp-border-banner-rule);
  --editor-min-height: var(--lp-prim-size-editor-min-h);
  --duration-fast: var(--lp-prim-motion-duration-fast);
  --duration-base: var(--lp-prim-motion-duration-base);
  --duration-slow: var(--lp-prim-motion-duration-slow);
  --ease-out: var(--lp-prim-motion-easing-out);
  --font-reading: var(--lp-prim-font-family-reading);
  --font-ui: var(--lp-prim-font-family-ui);
  --font-sans: var(--lp-prim-font-family-ui);
  --font-code: var(--lp-prim-font-family-code);
  --text-body-size: var(--lp-prim-font-size-16);
  --text-body-leading: var(--lp-prim-font-line-reading);
  --text-ui-size: var(--lp-prim-font-size-14);
  --type-caption-size: var(--lp-prim-font-size-12);
  --type-caption-line: var(--lp-prim-font-line-16);
  --type-body-sm-size: var(--lp-prim-font-size-14);
  --type-body-sm-line: var(--lp-prim-font-line-20);
  --type-body-size: var(--lp-prim-font-size-16);
  --type-body-line: var(--lp-prim-font-line-24);
  --type-title-size: var(--lp-prim-font-size-16);
  --type-title-line: var(--lp-prim-font-line-24);
  --type-page-title-size: var(--lp-prim-font-size-24);
  --type-page-title-line: var(--lp-prim-font-line-32);`.trim();

  const fmtBlock = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

  const bpSm = tokens.breakpoints.viewport.sm;
  const bpMd = tokens.breakpoints.viewport.md;

  const cssOut = `/* AUTO-GENERATED FROM packages/design-tokens/tokens.json — DO NOT EDIT BY HAND */
@font-face {
  font-family: 'Literata';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: local('Literata'), local('Literata-Regular');
}
@font-face {
  font-family: 'Atkinson Hyperlegible Next';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: local('Atkinson Hyperlegible Next'), local('AtkinsonHyperlegibleNext-Regular'), local('Atkinson Hyperlegible');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: local('JetBrains Mono'), local('JetBrainsMono-Regular');
}

:root {
  /* Tier 1: Primitives */
${fmtBlock(primitiveVars)}

  /* Tier 2: Semantic (Light Default) */
${fmtBlock(semanticLightVars)}

  /* Tier 3: Component & Relation Tokens */
${fmtBlock(componentVars)}
${fmtBlock(relationVars)}
${fmtBlock(typeRoleVars)}

  /* Legacy Aliases */
${legacyAliasesLight}
}

:root[data-theme="dark"],
:root:not([data-theme="light"]) {
  @media (prefers-color-scheme: dark) {
    color-scheme: dark;
${fmtBlock(semanticDarkVars).replace(/^  /gm, '    ')}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
${fmtBlock(semanticDarkVars)}
}

@media (min-width: ${bpSm}px) {
  :root {
    --lp-size-control-height: var(--lp-size-control-height-desktop);
    --control-height: var(--lp-size-control-height-desktop);
  }
}

@media (min-width: ${bpMd}px) {
  :root {
    --lp-size-gutter: var(--lp-size-gutter-desktop);
    --gutter: var(--lp-size-gutter-desktop);
  }
}

@media (prefers-contrast: more) {
  :root {
    --rule: var(--lp-prim-color-neutral-600);
    --border-control: var(--lp-prim-color-neutral-900);
    --text-muted: var(--lp-prim-color-neutral-900);
  }
}

:root[data-contrast="more"] {
  --rule: var(--lp-prim-color-neutral-600);
  --border-control: var(--lp-prim-color-neutral-900);
  --text-muted: var(--lp-prim-color-neutral-900);
}

:root[data-theme="dark"][data-contrast="more"] {
  --rule: var(--lp-prim-color-hc-dark-rule);
  --border-control: var(--lp-prim-color-hc-dark-border);
  --text-muted: var(--lp-prim-color-hc-dark-text);
}

@media (prefers-contrast: more) {
  :root[data-theme="dark"] {
    --rule: var(--lp-prim-color-hc-dark-rule);
    --border-control: var(--lp-prim-color-hc-dark-border);
    --text-muted: var(--lp-prim-color-hc-dark-text);
  }
}

@media (forced-colors: active) {
  :root {
    --rule: CanvasText;
    --border-control: ButtonBorder;
    --border-focus: Highlight;
    --text-muted: CanvasText;
  }
  .lp-btn,
  .lp-icon-btn,
  .lp-badge,
  .lp-chip,
  .lp-notice,
  .lp-dialog,
  .lp-drawer,
  .lp-popover-menu,
  .lp-empty-state {
    border: 1px solid ButtonBorder;
  }
  .lp-btn:focus-visible,
  .lp-icon-btn:focus-visible,
  .lp-input:focus-visible,
  .lp-select:focus-visible,
  .lp-textarea:focus-visible,
  a:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
`;

  const lightPack = {
    '--surface-page': semanticLightResolved['--lp-color-surface-page'],
    '--surface': semanticLightResolved['--lp-color-surface-l0'],
    '--surface-input': semanticLightResolved['--lp-color-surface-input'],
    '--text': semanticLightResolved['--lp-color-text-1'],
    '--text-muted': semanticLightResolved['--lp-color-text-2'],
    '--border-subtle': semanticLightResolved['--lp-color-border-subtle'],
    '--border-control': semanticLightResolved['--lp-color-border-control'],
    '--accent': semanticLightResolved['--lp-color-accent-default'],
    '--text-on-accent': semanticLightResolved['--lp-color-text-on-accent'],
  };

  const darkPack = {
    '--surface-page': semanticDarkResolved['--lp-color-surface-page'],
    '--surface': semanticDarkResolved['--lp-color-surface-l0'],
    '--surface-input': semanticDarkResolved['--lp-color-surface-input'],
    '--text': semanticDarkResolved['--lp-color-text-1'],
    '--text-muted': semanticDarkResolved['--lp-color-text-2'],
    '--border-subtle': semanticDarkResolved['--lp-color-border-subtle'],
    '--border-control': semanticDarkResolved['--lp-color-border-control'],
    '--accent': semanticDarkResolved['--lp-color-accent-default'],
    '--text-on-accent': semanticDarkResolved['--lp-color-text-on-accent'],
  };

  const allDefinedTokens = {
    primitive: Object.keys(primitiveVars),
    semantic: Object.keys(semanticLightVars),
    component: [
      ...Object.keys(componentVars),
      ...Object.keys(relationVars),
      ...Object.keys(typeRoleVars),
    ],
    reserved: tokens.reserved,
  };

  const tsOut = `/* AUTO-GENERATED FROM packages/design-tokens/tokens.json — DO NOT EDIT BY HAND */

export const TOKEN_VERSION = ${JSON.stringify(tokens.version)} as const;

export const BREAKPOINTS = ${JSON.stringify(tokens.breakpoints, null, 2)} as const;

export const RELATIONS = ${JSON.stringify(relationsResolved, null, 2)} as const;

export const TYPE_ROLES = ${JSON.stringify(typeRolesResolved, null, 2)} as const;

export const COMPONENT_TOKEN_VALUES = ${JSON.stringify(componentResolved, null, 2)} as const;

export const SEMANTIC_LIGHT_VALUES = ${JSON.stringify(semanticLightResolved, null, 2)} as const;

export const SEMANTIC_DARK_VALUES = ${JSON.stringify(semanticDarkResolved, null, 2)} as const;

export const PRIMITIVE_VALUES = ${JSON.stringify(primitiveVars, null, 2)} as const;

export const LIGHT_PACK_TOKENS = ${JSON.stringify(lightPack, null, 2)} as const;

export const DARK_PACK_TOKENS = ${JSON.stringify(darkPack, null, 2)} as const;

export const TOKEN_TIERS = ${JSON.stringify(allDefinedTokens, null, 2)} as const;

export const THEME_CSS = ${JSON.stringify(cssOut)};
`;

  const mdOut = `# Design Tokens Reference (Generated)

> **Source of truth:** \`packages/design-tokens/tokens.json\` (schema: \`packages/design-tokens/tokens.schema.json\`).
> **Naming convention:** \`${tokens.naming}\`
> **Architecture:** Three tiers — **Primitive** (raw scales), **Semantic** (theme-switched roles: light & dark), **Component** (dimensions, radii, relations, typography roles).

## Summary

- Primitive tokens: **${Object.keys(primitiveVars).length}**
- Semantic tokens (per theme): **${Object.keys(semanticLightVars).length}**
- Component, relation & typography tokens: **${Object.keys(componentVars).length + Object.keys(relationVars).length + Object.keys(typeRoleVars).length}**
- Reserved tokens: **${Object.keys(tokens.reserved).length}**

## Breakpoints

| Token | Value | Usage |
| --- | --- | --- |
| \`breakpoints.viewport.sm\` | \`${tokens.breakpoints.viewport.sm}px\` | Mobile-to-desktop control height (\`44px\` -> \`40px\`), Item grid |
| \`breakpoints.viewport.md\` | \`${tokens.breakpoints.viewport.md}px\` | Gutter (\`16px\` -> \`24px\`), push-panel vs overlay |
| \`breakpoints.container.compact\` | \`${tokens.breakpoints.container.compact}px\` | Container query threshold (\`< 400px\`) |

## D-FINAL Spacing Relations

| Relation | Token | Value |
| --- | --- | --- |
${Object.entries(relationsResolved)
  .map(([k, v]) => `| \`${k}\` | \`--lp-rel-${k}\` | \`${v}px\` |`)
  .join('\n')}

## Typography Roles (7 Roles + control-label)

| Role | Size | Weight | Line Height | Color Token |
| --- | --- | --- | --- | --- |
${Object.entries(typeRolesResolved)
  .map(([r, s]) => `| \`${r}\` | \`${s.size}px\` | \`${s.weight}\` | \`${s.lineHeight}px\` | \`${s.colorToken}\` |`)
  .join('\n')}

## Tier 2: Semantic Tokens (Light vs Dark)

| Token | Light | Dark |
| --- | --- | --- |
${Object.keys(semanticLightResolved)
  .map((k) => `| \`${k}\` | \`${semanticLightResolved[k]}\` | \`${semanticDarkResolved[k]}\` |`)
  .join('\n')}

## Tier 3: Component Tokens

| Token | Value |
| --- | --- |
${Object.entries(componentResolved)
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
  .join('\n')}

## Reserved Tokens

| Token | Reason |
| --- | --- |
${Object.entries(tokens.reserved)
  .map(([k, r]) => `| \`${k}\` | ${r} |`)
  .join('\n')}
`;

  return { tsOut, cssOut, mdOut };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { tsOut, cssOut, mdOut } = generateOutputs();
  mkdirSync(resolve(__dirname, 'src'), { recursive: true });
  mkdirSync(resolve(REPO_ROOT, 'docs/design'), { recursive: true });
  writeFileSync(resolve(__dirname, 'src/generated.ts'), tsOut, 'utf8');
  writeFileSync(resolve(__dirname, 'src/tokens.css'), cssOut, 'utf8');
  writeFileSync(resolve(REPO_ROOT, 'docs/design/tokens.md'), mdOut, 'utf8');
  console.log('Generated design tokens -> src/generated.ts, src/tokens.css, docs/design/tokens.md');
}
