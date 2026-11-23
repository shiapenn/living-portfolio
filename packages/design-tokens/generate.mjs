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

/**
 * Recursively resolve {primitive.*}, {semantic.*}, and {component.*} references to concrete values.
 * Throws an error on any unresolved {…} reference (D-L5 unresolved alias guard).
 */
export function resolveRef(ref, tokens, mode = 'light', depth = 0) {
  if (typeof ref !== 'string') return ref;
  if (depth > 12) {
    throw new Error(`Circular token reference detected while resolving "${ref}"`);
  }
  const resolved = ref.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (full, pathStr) => {
    const path = pathStr.split('.');
    if (path[0] === 'primitive') {
      const [, cat, ...rest] = path;
      const val = tokens.primitive?.[cat]?.[rest.join('.')];
      if (val === undefined) {
        throw new Error(`Unresolved primitive token reference: ${full}`);
      }
      return resolveRef(val, tokens, mode, depth + 1);
    }
    if (path[0] === 'semantic') {
      const semKey = path.slice(1).join('.');
      const val = tokens.semantic?.[mode]?.[semKey];
      if (val === undefined) {
        throw new Error(`Unresolved semantic token reference: ${full} (mode=${mode})`);
      }
      return resolveRef(val, tokens, mode, depth + 1);
    }
    if (path[0] === 'component') {
      const compKey = path.slice(1).join('.');
      const val = tokens.component?.[compKey];
      if (val === undefined) {
        throw new Error(`Unresolved component token reference: ${full}`);
      }
      return resolveRef(val, tokens, mode, depth + 1);
    }
    throw new Error(`Unknown token tier in reference: ${full}`);
  });
  if (/\{[^}]+\}/.test(resolved)) {
    throw new Error(`Unresolved token reference remaining in "${resolved}"`);
  }
  return resolved;
}

/**
 * Resolve token value for shipped CSS (D-L5 performance):
 * - Primitive references ({primitive.*}) are resolved directly at build time (no --lp-prim-* emitted).
 * - Non-theme component references ({component.*}) are resolved at build time, except structured elevation offsets.
 * - Theme-switched semantic references ({semantic.*}) emit var(--lp-*) so light/dark theme switching works at runtime.
 */
function resolveForCss(ref, tokens, mode = 'light', preserveComponentVars = false) {
  if (typeof ref !== 'string') return ref;
  const out = ref.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (full, pathStr) => {
    const path = pathStr.split('.');
    if (path[0] === 'primitive') {
      return resolveRef(full, tokens, mode);
    }
    if (path[0] === 'component') {
      const compKey = path.slice(1).join('.');
      if (preserveComponentVars || compKey.startsWith('elevation.')) {
        return `var(${componentToCssVar(compKey)})`;
      }
      return resolveRef(full, tokens, mode);
    }
    if (path[0] === 'semantic') {
      const semKey = path.slice(1).join('.');
      return `var(${semanticToCssVar(semKey)})`;
    }
    throw new Error(`Unresolved token reference: ${full}`);
  });
  if (/\{[^}]+\}/.test(out)) {
    throw new Error(`Unresolved token reference in CSS output: ${out}`);
  }
  return out;
}

export function generateOutputs() {
  const tokens = loadTokens();

  const primitiveVars = {};
  for (const [cat, entries] of Object.entries(tokens.primitive)) {
    for (const [k, v] of Object.entries(entries)) {
      primitiveVars[primitiveToCssVar(cat, k)] = resolveRef(v, tokens, 'light');
    }
  }

  const semanticLightVars = {};
  const semanticLightResolved = {};
  for (const [k, v] of Object.entries(tokens.semantic.light)) {
    const cssName = semanticToCssVar(k);
    semanticLightVars[cssName] = resolveForCss(v, tokens, 'light');
    semanticLightResolved[cssName] = resolveRef(v, tokens, 'light');
  }

  const semanticDarkVars = {};
  const semanticDarkResolved = {};
  for (const [k, v] of Object.entries(tokens.semantic.dark)) {
    const cssName = semanticToCssVar(k);
    semanticDarkVars[cssName] = resolveForCss(v, tokens, 'dark');
    semanticDarkResolved[cssName] = resolveRef(v, tokens, 'dark');
  }

  // Component-derived surface aliases for backwards compatibility in SEMANTIC_*_VALUES
  semanticLightResolved['--lp-color-surface-page'] = semanticLightResolved['--lp-color-surface-l0'];
  semanticLightResolved['--lp-color-surface-raised'] = semanticLightResolved['--lp-color-surface-l0'];
  semanticLightResolved['--lp-color-surface-input'] = semanticLightResolved['--lp-color-surface-l0'];
  semanticLightResolved['--lp-color-surface-overlay'] = semanticLightResolved['--lp-color-surface-l1'];
  semanticLightResolved['--lp-color-surface-subtle'] = semanticLightResolved['--lp-color-surface-l1'];

  semanticDarkResolved['--lp-color-surface-page'] = semanticDarkResolved['--lp-color-surface-l0'];
  semanticDarkResolved['--lp-color-surface-raised'] = semanticDarkResolved['--lp-color-surface-l1'];
  semanticDarkResolved['--lp-color-surface-input'] = semanticDarkResolved['--lp-color-surface-l1'];
  semanticDarkResolved['--lp-color-surface-overlay'] = semanticDarkResolved['--lp-color-surface-l1'];
  semanticDarkResolved['--lp-color-surface-subtle'] = semanticDarkResolved['--lp-color-surface-l1'];

  const componentVars = {};
  const componentResolved = {};
  for (const [k, v] of Object.entries(tokens.component)) {
    const cssName = componentToCssVar(k);
    componentVars[cssName] = resolveForCss(v, tokens, 'light');
    componentResolved[cssName] = resolveRef(v, tokens, 'light');
  }

  const responsiveVars = {};
  const responsiveResolved = {};
  for (const [bpKey, entries] of Object.entries(tokens.responsive ?? {})) {
    responsiveVars[bpKey] = {};
    responsiveResolved[bpKey] = {};
    for (const [k, v] of Object.entries(entries)) {
      const cssName = componentToCssVar(k);
      responsiveVars[bpKey][cssName] = resolveForCss(v, tokens, 'light');
      responsiveResolved[bpKey][cssName] = resolveRef(v, tokens, 'light');
    }
  }

  const relationsResolved = {};
  for (const [k, v] of Object.entries(tokens.relations)) {
    const res = resolveRef(v, tokens, 'light');
    relationsResolved[k] = typeof res === 'string' && res.endsWith('px') ? parseFloat(res) : res;
  }

  const typeRolesResolved = {};
  for (const [role, spec] of Object.entries(tokens.typographyRoles)) {
    typeRolesResolved[role] = {
      family: resolveRef(spec.family, tokens, 'light'),
      size: parseFloat(resolveRef(spec.size, tokens, 'light')),
      weight: Number(resolveRef(spec.weight, tokens, 'light')),
      lineHeight: parseFloat(resolveRef(spec.lineHeight, tokens, 'light')),
      letterSpacing: resolveRef(spec.letterSpacing, tokens, 'light'),
      colorToken: semanticToCssVar(spec.color.slice(1, -1).split('.').slice(1).join('.')),
    };
  }

  // Shorthand aliases for runtime theme pack overrides and component CSS
  const legacyAliasesLight = `
  color-scheme: light;
  --lp-color-surface-raised: var(--lp-color-surface-l0);
  --lp-color-surface-input: var(--lp-color-surface-l0);
  --surface-l0: var(--lp-color-surface-l0);
  --surface-l1: var(--lp-color-surface-l1);
  --surface-l2: var(--lp-color-surface-l2);
  --surface-page: var(--lp-color-surface-page);
  --surface-raised: var(--lp-color-surface-raised);
  --surface-overlay: var(--lp-color-surface-overlay);
  --surface-subtle: var(--lp-color-surface-subtle);
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
  --layout-max: var(--lp-size-layout-max);
  --vv-bottom: 0px;`.trim();

  const fmtBlock = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

  const bpSm = tokens.breakpoints.viewport.sm;
  const bpMd = tokens.breakpoints.viewport.md;

  const darkOverrides = {
    ...semanticDarkVars,
    '--lp-color-surface-raised': 'var(--lp-color-surface-l1)',
    '--lp-color-surface-input': 'var(--lp-color-surface-l1)',
  };

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
  /* Tier 2: Semantic (Light Default, primitives resolved at build) */
${fmtBlock(semanticLightVars)}

  /* Tier 3: Component, Spacing (stack, inline, inset) & Typography Tokens */
${fmtBlock(componentVars)}

  /* Shorthand Aliases */
  ${legacyAliasesLight}
}

:root[data-theme="dark"],
:root:not([data-theme="light"]) {
  @media (prefers-color-scheme: dark) {
    color-scheme: dark;
${fmtBlock(darkOverrides).replace(/^  /gm, '    ')}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
${fmtBlock(darkOverrides)}
}

@media (min-width: ${bpSm}px) {
  :root {
${fmtBlock(responsiveVars.sm ?? {}).replace(/^  /gm, '    ')}
  }
}

@media (min-width: ${bpMd}px) {
  :root {
${fmtBlock(responsiveVars.md ?? {}).replace(/^  /gm, '    ')}
  }
}

@media (prefers-contrast: more) {
  :root {
    --rule: ${tokens.primitive.color['neutral-600']};
    --border-control: ${tokens.primitive.color['neutral-900']};
    --text-muted: ${tokens.primitive.color['neutral-900']};
  }
}

:root[data-contrast="more"] {
  --rule: ${tokens.primitive.color['neutral-600']};
  --border-control: ${tokens.primitive.color['neutral-900']};
  --text-muted: ${tokens.primitive.color['neutral-900']};
}

:root[data-theme="dark"][data-contrast="more"] {
  --rule: ${tokens.primitive.color['hc-dark-rule']};
  --border-control: ${tokens.primitive.color['hc-dark-border']};
  --text-muted: ${tokens.primitive.color['hc-dark-text']};
}

@media (prefers-contrast: more) {
  :root[data-theme="dark"] {
    --rule: ${tokens.primitive.color['hc-dark-rule']};
    --border-control: ${tokens.primitive.color['hc-dark-border']};
    --text-muted: ${tokens.primitive.color['hc-dark-text']};
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
    component: Object.keys(componentVars),
    responsive: responsiveResolved,
  };

  const tsOut = `/* AUTO-GENERATED FROM packages/design-tokens/tokens.json — DO NOT EDIT BY HAND */

export const TOKEN_VERSION = ${JSON.stringify(tokens.version)} as const;

export const BREAKPOINTS = ${JSON.stringify(tokens.breakpoints, null, 2)} as const;

export const RELATIONS = ${JSON.stringify(relationsResolved, null, 2)} as const;

export const TYPE_ROLES = ${JSON.stringify(typeRolesResolved, null, 2)} as const;

export const COMPONENT_TOKEN_VALUES = ${JSON.stringify(componentResolved, null, 2)} as const;

export const RESPONSIVE_TOKEN_VALUES = ${JSON.stringify(responsiveResolved, null, 2)} as const;

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
> **Version:** \`${tokens.version}\`

## Architecture (D-L4 & D-L5)

### 1. Three-Tier Hierarchy
- **Tier 1 — Primitive (\`primitive.*\`)**: Raw scales (\`color\`, \`space 0..64\`, \`size\`, \`radius\`, \`border\`, \`font\`, \`motion\`, \`zIndex\`, \`opacity\`, \`elevation\`). Never emitted as \`--lp-prim-*\` custom properties into shipped CSS and never referenced directly by component CSS.
- **Tier 2 — Semantic (\`semantic.light.*\`, \`semantic.dark.*\`)**: Theme-switched roles (\`color.surface.l0..l2\`, \`color.surface.control*\`, \`color.surface.scrim\`, \`color.text.1..3\`, \`color.border.*\`, \`color.accent.*\`, \`color.role.*\`, \`color.passage.*\`, \`elevation.e0..e2\`, \`opacity.disabled\`). Emitted as CSS custom properties on \`:root\` and switched in \`:root[data-theme="dark"]\` / \`@media (prefers-color-scheme: dark)\`.
- **Tier 3 — Component & Spacing Taxonomy (\`component.*\`, \`responsive.*\`)**:
  - **Stack relations (\`--lp-space-stack-<relation>\`)**: Vertical gaps between stacked elements (monotonic proximity: \`label-to-control (8px) < field-to-field (16px) < subsection-to-subsection (24px) < section-to-section (40px)\`).
  - **Inline relations (\`--lp-space-inline-<relation>\`)**: Horizontal gaps between inline peers (\`segment: 4px\`, \`dot-text: 6px\`, \`icon-text: 8px\`, \`button-button: 8px\`, \`tag-tag: 8px\`).
  - **Insets (\`--lp-space-inset-<container>\`)**: Internal container padding (\`page-gutter: 16px -> 24px @ 768px\`, \`panel: 12px\`, \`dialog: 24px\`, \`item-x: 8px\`, \`item-y: 12px\`, \`control-x: 12px\`, \`tag-x: 8px\`, \`tag-y: 2px\`, \`track: 4px\`).
  - **Sizes, Radii, Borders, Z-Index, Motion, Typography**: Semantic component dimensions (\`--lp-size-*\`), radii (\`--lp-radius-r1\`, \`--lp-radius-r2\`, plus semantic aliases), named z-index layers (\`base\`, \`raised\`, \`sticky\`, \`overlay\`, \`popover\`, \`modal\`, \`toast\`, \`skip\`), motion tokens, and font tokens.

### 2. Rules & Guards
1. **No numeral-named tokens**: Component and semantic token names may not be a bare number (e.g. \`--lp-size-14\`, \`--lp-space-8\`, \`--lp-z-10\` are forbidden).
2. **No reserved list / arithmetic closure**: Every token emitted into \`tokens.css\` must be used (\`defined = used\`, \`0\` unused). Any unused or unresolved token fails \`scripts/verify-ui-guards\`.
3. **Single-token responsive switching**: Responsive tokens (\`--lp-size-control-height\`, \`--lp-space-inset-page-gutter\`) keep one token name whose value switches at the \`breakpoints\` media query.
4. **Build-time primitive resolution**: Non-theme primitive references resolve at build time in \`generate.mjs\` so shipped CSS carries zero \`--lp-prim-*\` declarations.

### 3. How to Add a Token
1. Check if an existing semantic, relation (\`space.stack.*\`, \`space.inline.*\`, \`space.inset.*\`), or component token already expresses the role.
2. Add the raw value to \`primitive\` in \`packages/design-tokens/tokens.json\` if not already on the scale.
3. Add the semantic or component token referencing \`{primitive.*}\` (or \`{semantic.*}\` / \`{component.*}\`).
4. Run \`node packages/design-tokens/generate.mjs\` and verify \`./scripts/verify-ui-guards\` and \`pnpm --filter @living-portfolio/design-tokens test\`.

### 4. How to Choose a Token (Decision List)
1. **Vertical gap between stacked blocks, fields, headings, or lists?** -> Use \`--lp-space-stack-<relation>\` (\`label-to-control\`, \`field-to-field\`, \`heading-to-list-plain\`, \`heading-to-list-interactive\`, \`control-to-list\`, \`subsection-to-subsection\`, \`section-to-section\`, \`header-to-content\`).
2. **Horizontal gap between inline icon, text, dot, tag, or button peers?** -> Use \`--lp-space-inline-<relation>\` (\`icon-text\`, \`button-button\`, \`dot-text\`, \`tag-tag\`, \`segment\`).
3. **Internal padding of a page, panel, dialog, item, control, or tag?** -> Use \`--lp-space-inset-<container>\` (\`page-gutter\`, \`panel\`, \`dialog\`, \`item-x\`, \`item-y\`, \`control-x\`, \`tag-x\`, \`tag-y\`, \`track\`).
4. **Surface background?** -> Use \`--lp-color-surface-l0\` (page canvas), \`--lp-color-surface-l1\` (bars, panels, overlays), \`--lp-color-surface-l2\` (resting controls/chips), \`--lp-color-surface-control-hover|active|selected\`, or \`--lp-color-surface-scrim\` (modal/sheet backdrop).
5. **Text or icon colour?** -> Use \`--lp-color-text-1\` (primary), \`--lp-color-text-2\` (secondary/description/caption), \`--lp-color-text-3\` (placeholder/disabled), or \`--lp-color-role-<tone>-fg\`.
6. **Border or divider?** -> Use \`--lp-border-hairline\` with \`--lp-color-border-subtle\` (dividers), \`--lp-color-border-control\` (inputs/buttons), or \`--lp-color-border-overlay\` (panels/popovers/dialogs).
7. **Corner radius?** -> Use \`--lp-radius-r1\` / \`--lp-radius-chip\` (\`4px\`), \`--lp-radius-r2\` / \`--lp-radius-control|container|overlay|card\` (\`8px\`), or \`--lp-radius-full\` (\`9999px\` circular dots/radios).
8. **Stacking layer (\`z-index\`)?** -> Use a named layer only: \`--lp-z-base\` (\`0\`), \`--lp-z-raised\` (\`1\`), \`--lp-z-sticky\` (\`100\`), \`--lp-z-overlay\` (\`200\`), \`--lp-z-popover\` (\`300\`), \`--lp-z-modal\` (\`400\`), \`--lp-z-toast\` (\`500\`), \`--lp-z-skip\` (\`1000\`).

## Summary

- Primitive scale entries (build-time resolved, not emitted to CSS): **${Object.keys(primitiveVars).length}**
- Semantic tokens (per theme): **${Object.keys(semanticLightVars).length}**
- Component, spacing (\`stack\`, \`inline\`, \`inset\`) & typography tokens: **${Object.keys(componentVars).length}**
- Responsive breakpoint overrides: **${Object.values(responsiveVars).reduce((acc, o) => acc + Object.keys(o).length, 0)}**

## Breakpoints

| Token | Value | Usage |
| --- | --- | --- |
| \`breakpoints.viewport.sm\` | \`${tokens.breakpoints.viewport.sm}px\` | Mobile-to-desktop control height (\`44px\` -> \`40px\`), Item grid |
| \`breakpoints.viewport.md\` | \`${tokens.breakpoints.viewport.md}px\` | Page gutter (\`16px\` -> \`24px\`), push-panel vs overlay |
| \`breakpoints.viewport.lg\` | \`${tokens.breakpoints.viewport.lg}px\` | Wide desktop split layout (\`1024px\`) |
| \`breakpoints.viewport.xl\` | \`${tokens.breakpoints.viewport.xl}px\` | 3-pane desktop layout (\`1280px\`) |
| \`breakpoints.container.compact\` | \`${tokens.breakpoints.container.compact}px\` | Container query threshold (\`< 400px\`) |

## D-FINAL & D-L4 Spacing Relations

| Relation | Stack Token | Value |
| --- | --- | --- |
${Object.entries(relationsResolved)
  .map(([k, v]) => `| \`${k}\` | \`--lp-space-stack-${k}\` | \`${v}px\` |`)
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
${Object.keys(semanticLightVars)
  .map((k) => `| \`${k}\` | \`${semanticLightResolved[k]}\` | \`${semanticDarkResolved[k]}\` |`)
  .join('\n')}

## Tier 3: Component & Spacing Taxonomy Tokens

| Token | Value |
| --- | --- |
${Object.entries(componentResolved)
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
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
