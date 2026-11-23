#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const TOKENS_PATH = resolve(__dirname, 'tokens.json');
const PACKS_DIR = resolve(__dirname, 'packs');

export function loadPack(name) {
  return JSON.parse(readFileSync(resolve(PACKS_DIR, `${name}.json`), 'utf8'));
}

export function loadTokens() {
  return loadPack('admin');
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
    if (path[0] === 'proximity') {
      const tier = path.slice(1).join('.');
      const val = tokens.proximity?.[tier];
      if (val === undefined) {
        throw new Error(`Unresolved proximity tier reference: ${full}`);
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
    if (path[0] === 'primitive' || path[0] === 'proximity') {
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
  const adminAccentLight = tokens.accentMapping?.light ?? {};
  for (const [k, v] of Object.entries(tokens.semantic.light)) {
    const cssName = semanticToCssVar(k);
    const resolved = resolveRef(v, tokens, 'light');
    semanticLightResolved[cssName] = resolved;
    semanticLightVars[cssName] = adminAccentLight[k]
      ? `var(--lp-core-accent-${adminAccentLight[k]}, ${resolved})`
      : resolveForCss(v, tokens, 'light');
  }

  const semanticDarkVars = {};
  const semanticDarkResolved = {};
  const adminAccentDark = tokens.accentMapping?.dark ?? {};
  for (const [k, v] of Object.entries(tokens.semantic.dark)) {
    const cssName = semanticToCssVar(k);
    const resolved = resolveRef(v, tokens, 'dark');
    semanticDarkResolved[cssName] = resolved;
    semanticDarkVars[cssName] = adminAccentDark[k]
      ? `var(--lp-core-accent-${adminAccentDark[k]}, ${resolved})`
      : resolveForCss(v, tokens, 'dark');
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

  const publicPack = loadPack('public');
  const corePack = loadPack('core');

  const pubLightVars = {};
  const pubLightCssVars = {};
  const pubDarkVars = {};
  const pubDarkCssVars = {};
  const pubAccentLight = publicPack.accentMapping?.light ?? {};
  const pubAccentDark = publicPack.accentMapping?.dark ?? {};
  for (const [k, v] of Object.entries(publicPack.semantic.light)) {
    const cssName = `--pub-${k.replace(/\./g, '-')}`;
    const resolved = resolveRef(v, publicPack, 'light');
    pubLightVars[cssName] = resolved;
    pubLightCssVars[cssName] = pubAccentLight[k]
      ? `var(--lp-core-accent-${pubAccentLight[k]}, ${resolved})`
      : resolved;
  }
  for (const [k, v] of Object.entries(publicPack.semantic.dark)) {
    const cssName = `--pub-${k.replace(/\./g, '-')}`;
    const resolved = resolveRef(v, publicPack, 'dark');
    pubDarkVars[cssName] = resolved;
    pubDarkCssVars[cssName] = pubAccentDark[k]
      ? `var(--lp-core-accent-${pubAccentDark[k]}, ${resolved})`
      : resolved;
  }
  const pubCompVars = {};
  for (const [k, v] of Object.entries(publicPack.component)) {
    pubCompVars[`--pub-${k.replace(/\./g, '-')}`] = resolveRef(v, publicPack, 'light');
  }

  const publicCssOut = `/* AUTO-GENERATED FROM packages/design-tokens/packs/public.json — DO NOT EDIT BY HAND */
:root[data-lang="public"],
:root {
${fmtBlock(pubLightCssVars)}
${fmtBlock(pubCompVars)}
}

:root[data-theme="dark"][data-lang="public"],
:root[data-theme="dark"] {
${fmtBlock(pubDarkCssVars)}
}
`;

  const coreCssOut = `/* AUTO-GENERATED FROM packages/design-tokens/packs/core.json — DO NOT EDIT BY HAND */
:root {
${Object.entries(corePack.primitive.zIndex).map(([k, v]) => `  --lp-core-z-${k}: ${v};`).join('\n')}
}
`;

  const proximityResolved = {};
  for (const [tier, ref] of Object.entries(tokens.proximity ?? {})) {
    proximityResolved[tier] = parseFloat(resolveRef(ref, tokens, 'light'));
  }

  const tsOut = `/* AUTO-GENERATED FROM packages/design-tokens/packs/*.json — DO NOT EDIT BY HAND */

export const TOKEN_VERSION = ${JSON.stringify(tokens.version)} as const;

export const CORE_ACCENT_CONTRACT = ${JSON.stringify(corePack.accent ?? null, null, 2)} as const;

export const BREAKPOINTS = ${JSON.stringify(tokens.breakpoints, null, 2)} as const;

export const PROXIMITY_TIERS = ${JSON.stringify(proximityResolved, null, 2)} as const;

export const SNAP_TABLE = ${JSON.stringify(tokens.snapTable ?? [], null, 2)} as const;

export const PACK_RULES = ${JSON.stringify({ core: corePack.rules, admin: tokens.rules, public: publicPack.rules }, null, 2)} as const;

export const RELATIONS = ${JSON.stringify(relationsResolved, null, 2)} as const;

export const TYPE_ROLES = ${JSON.stringify(typeRolesResolved, null, 2)} as const;

export const COMPONENT_TOKEN_VALUES = ${JSON.stringify(componentResolved, null, 2)} as const;

export const RESPONSIVE_TOKEN_VALUES = ${JSON.stringify(responsiveResolved, null, 2)} as const;

export const SEMANTIC_LIGHT_VALUES = ${JSON.stringify(semanticLightResolved, null, 2)} as const;

export const SEMANTIC_DARK_VALUES = ${JSON.stringify(semanticDarkResolved, null, 2)} as const;

export const PRIMITIVE_VALUES = ${JSON.stringify(primitiveVars, null, 2)} as const;

export const LIGHT_PACK_TOKENS = ${JSON.stringify(lightPack, null, 2)} as const;

export const DARK_PACK_TOKENS = ${JSON.stringify(darkPack, null, 2)} as const;

export const PUBLIC_LIGHT_VALUES = ${JSON.stringify(pubLightVars, null, 2)} as const;

export const PUBLIC_DARK_VALUES = ${JSON.stringify(pubDarkVars, null, 2)} as const;

export const PUBLIC_COMPONENT_VALUES = ${JSON.stringify(pubCompVars, null, 2)} as const;

export const TOKEN_TIERS = ${JSON.stringify(allDefinedTokens, null, 2)} as const;

export const THEME_CSS = ${JSON.stringify(cssOut)};

export const PUBLIC_THEME_CSS = ${JSON.stringify(publicCssOut)};

export const CORE_THEME_CSS = ${JSON.stringify(coreCssOut)};
`;

  const corePrimCount = Object.values(corePack.primitive).reduce((acc, o) => acc + Object.keys(o).length, 0);
  const pubPrimCount = Object.values(publicPack.primitive).reduce((acc, o) => acc + Object.keys(o).length, 0);

  const mdOut = `# Design Tokens Reference (Generated)

| Pack | Source | Prefix | Version | Primitive | Semantic | Component | Reference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| \`core\` | \`packages/design-tokens/packs/core.json\` | \`--${corePack.prefix}-*\` | \`${corePack.version}\` | ${corePrimCount} | 0 | 0 | [tokens-core.md](tokens-core.md) |
| \`admin\` | \`packages/design-tokens/packs/admin.json\` | \`--${tokens.prefix}-*\` | \`${tokens.version}\` | ${Object.keys(primitiveVars).length} | ${Object.keys(semanticLightVars).length} | ${Object.keys(componentVars).length} | [tokens-admin.md](tokens-admin.md) |
| \`public\` | \`packages/design-tokens/packs/public.json\` | \`--${publicPack.prefix}-*\` | \`${publicPack.version}\` | ${pubPrimCount} | ${Object.keys(pubLightVars).length} | ${Object.keys(pubCompVars).length} | [tokens-public.md](tokens-public.md) |
`;

  const coreRows = [];
  for (const [cat, entries] of Object.entries(corePack.primitive)) {
    for (const [k, v] of Object.entries(entries)) {
      coreRows.push(`| \`${cat}.${k}\` | \`${v}\` |`);
    }
  }
  const mdCoreOut = `# Core Pack Tokens (Generated)

| Metadata | Value |
| --- | --- |
| Source | \`packages/design-tokens/packs/core.json\` |
| Prefix | \`--${corePack.prefix}-*\` |
| Version | \`${corePack.version}\` |
| Accent Seed (Light) | \`${corePack.accent?.seed?.light ?? ''}\` |
| Accent Seed (Dark) | \`${corePack.accent?.seed?.dark ?? ''}\` |

## Breakpoints

| Token | Value |
| --- | --- |
${Object.entries(corePack.breakpoints.viewport)
  .map(([k, v]) => `| \`breakpoints.viewport.${k}\` | \`${v}px\` |`)
  .join('\n')}
| \`breakpoints.container.compact\` | \`${corePack.breakpoints.container.compact}px\` |

## Primitives

| Token | Value |
| --- | --- |
${coreRows.join('\n')}
`;

  const mdAdminOut = `# Admin Pack Tokens (Generated)

| Metadata | Value |
| --- | --- |
| Source | \`packages/design-tokens/packs/admin.json\` |
| Naming | \`${tokens.naming}\` |
| Version | \`${tokens.version}\` |
| Primitive | ${Object.keys(primitiveVars).length} |
| Semantic (per theme) | ${Object.keys(semanticLightVars).length} |
| Component | ${Object.keys(componentVars).length} |
| Responsive | ${Object.values(responsiveVars).reduce((acc, o) => acc + Object.keys(o).length, 0)} |

## Breakpoints

| Token | Value |
| --- | --- |
${Object.entries(tokens.breakpoints.viewport)
  .map(([k, v]) => `| \`breakpoints.viewport.${k}\` | \`${v}px\` |`)
  .join('\n')}
| \`breakpoints.container.compact\` | \`${tokens.breakpoints.container.compact}px\` |

## Spacing Relations

| Relation | Token | Value |
| --- | --- | --- |
${Object.entries(relationsResolved)
  .map(([k, v]) => `| \`${k}\` | \`--lp-space-stack-${k}\` | \`${v}px\` |`)
  .join('\n')}

## Typography Roles

| Role | Size | Weight | Line Height | Color Token |
| --- | --- | --- | --- | --- |
${Object.entries(typeRolesResolved)
  .map(([r, s]) => `| \`${r}\` | \`${s.size}px\` | \`${s.weight}\` | \`${s.lineHeight}px\` | \`${s.colorToken}\` |`)
  .join('\n')}

## Semantic Tokens (Theme-Switched)

| Token | Light | Dark |
| --- | --- | --- |
${Object.keys(semanticLightVars)
  .map((k) => `| \`${k}\` | \`${semanticLightResolved[k]}\` | \`${semanticDarkResolved[k]}\` |`)
  .join('\n')}

## Component Tokens

| Token | Value |
| --- | --- |
${Object.entries(componentResolved)
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
  .join('\n')}

## Documented Aliases

| Token | Alias Of | Reason |
| --- | --- | --- |
${Object.entries(tokens.governance?.aliases ?? {})
  .map(([k, a]) => `| \`${k}\` | \`${a.aliasOf}\` | ${a.reason} |`)
  .join('\n')}
`;

  const mdPublicOut = `# Public Pack Tokens (Generated)

| Metadata | Value |
| --- | --- |
| Source | \`packages/design-tokens/packs/public.json\` |
| Naming | \`${publicPack.naming}\` |
| Version | \`${publicPack.version}\` |
| Primitive | ${pubPrimCount} |
| Semantic (per theme) | ${Object.keys(pubLightVars).length} |
| Component | ${Object.keys(pubCompVars).length} |

## Semantic Tokens (Theme-Switched)

| Token | Light | Dark |
| --- | --- | --- |
${Object.keys(pubLightVars)
  .map((k) => `| \`${k}\` | \`${pubLightVars[k]}\` | \`${pubDarkVars[k]}\` |`)
  .join('\n')}

## Component Tokens

| Token | Value |
| --- | --- |
${Object.entries(pubCompVars)
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
  .join('\n')}

## Documented Aliases

| Token | Alias Of | Reason |
| --- | --- | --- |
${Object.entries(publicPack.governance?.aliases ?? {})
  .map(([k, a]) => `| \`${k}\` | \`${a.aliasOf}\` | ${a.reason} |`)
  .join('\n')}
`;

  return { tsOut, cssOut, publicCssOut, coreCssOut, mdOut, mdCoreOut, mdAdminOut, mdPublicOut };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { tsOut, cssOut, publicCssOut, coreCssOut, mdOut, mdCoreOut, mdAdminOut, mdPublicOut } = generateOutputs();
  mkdirSync(resolve(__dirname, 'src'), { recursive: true });
  mkdirSync(resolve(REPO_ROOT, 'docs/design'), { recursive: true });
  writeFileSync(resolve(__dirname, 'src/generated.ts'), tsOut, 'utf8');
  writeFileSync(resolve(__dirname, 'src/tokens.css'), cssOut, 'utf8');
  writeFileSync(resolve(__dirname, 'src/public.css'), publicCssOut, 'utf8');
  writeFileSync(resolve(__dirname, 'src/core.css'), coreCssOut, 'utf8');
  writeFileSync(resolve(REPO_ROOT, 'docs/design/tokens.md'), mdOut, 'utf8');
  writeFileSync(resolve(REPO_ROOT, 'docs/design/tokens-core.md'), mdCoreOut, 'utf8');
  writeFileSync(resolve(REPO_ROOT, 'docs/design/tokens-admin.md'), mdAdminOut, 'utf8');
  writeFileSync(resolve(REPO_ROOT, 'docs/design/tokens-public.md'), mdPublicOut, 'utf8');
  // Keep tokens.json mirrored to packs/admin.json for backward compatibility
  writeFileSync(TOKENS_PATH, readFileSync(resolve(PACKS_DIR, 'admin.json'), 'utf8'), 'utf8');
  console.log('Generated design tokens -> src/generated.ts, src/tokens.css, src/public.css, src/core.css, docs/design/tokens*.md');
}
