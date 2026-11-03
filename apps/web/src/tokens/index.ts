/**
 * §12 UI Design System — Multi-Tier Design Tokens Architecture
 * (Findings 20261020-UI-02, 20261020-UI-03, 20261020-UI-07, 20261020-UI-10)
 *
 * Tier 1: Primitives (raw palettes, scales, breakpoints, motion)
 * Tier 2: Semantics (theme-switched surfaces, text, borders, roles, status, elevation, z-index)
 * Tier 3: Components (component-specific dimensions, radii, heights, widths)
 */

export const PRIMITIVE_TOKENS = `
  /* === Tier 1: Primitives === */

  /* Neutral palette */
  --n-0: #FFFFFF;
  --n-50: #F3F5F4;
  --n-200: #CBD3D8;
  --n-500: #6B7B88;
  --n-600: #4B5A66;
  --n-900: #14202A;

  /* Dark neutral palette */
  --nd-900: #0F1A22;
  --nd-800: #16232D;
  --nd-700: #2A3946;
  --nd-500: #7E8F9C;
  --nd-300: #A3B2BD;
  --nd-100: #E6ECEF;

  /* Accent and roles (Spec §12.3) */
  --indigo-600: #3A4FD0;
  --indigo-300: #9AA8FF;
  --blue-600: #2F5FA8;
  --blue-300: #8DB4EA;
  --slate-500: #5A5F6B;
  --slate-300: #B4B9C4;
  --amber-700: #9A6A00;
  --amber-400: #E2B34A;
  --amber-800: #8A5A00;
  --amber-300: #F5C451;
  --violet-700: #5B3FA0;
  --violet-300: #B9A4EE;
  --green-700: #1F7A5A;
  --green-300: #6FCBA3;
  --rose-700: #A13A6B;
  --rose-300: #EE9CC2;
  --red-700: #B42318;
  --red-400: #F97066;

  /* Spacing Scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-18: 72px;

  /* Typographic Scale (1.2 ratio scale: 14/16/18/21/25/30/36/44) */
  --font-size-1: 14px;
  --font-size-2: 16px;
  --font-size-3: 18px;
  --font-size-4: 21px;
  --font-size-5: 25px;
  --font-size-6: 30px;
  --font-size-7: 36px;
  --font-size-8: 44px;

  /* Radii scale */
  --radius-2: 2px;
  --radius-6: 6px;
  --radius-12: 12px;

  /* Motion tokens */
  --duration-fast: 120ms;
  --duration-base: 160ms;
  --duration-slow: 240ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Breakpoint tokens (Spec §12.5) */
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
`;

export const SEMANTIC_TOKENS_LIGHT = `
  /* === Tier 2: Semantic Tokens (Light Default) === */
  --surface-page: #F3F5F4;
  --surface-raised: #FFFFFF;
  --surface-overlay: #FFFFFF;
  --text: #14202A;
  --text-muted: #4B5A66;
  --text-on-accent: #FFFFFF;
  --rule: #CBD3D8;
  --border-control: #6B7B88; /* 3:1 contrast against surface for interactive boundaries (Spec 12.3) */
  --accent: #3A4FD0;
  --focus-ring: #3A4FD0;

  /* Semantic roles */
  --role-goal: #2F5FA8;
  --role-approach: #5A5F6B;
  --role-friction: #9A6A00;
  --role-decision: #5B3FA0;
  --role-outcome: #1F7A5A;
  --role-lesson: #A13A6B;
  --role-neutral: #5A5F6B;

  /* Status */
  --status-warn: #8A5A00;
  --status-error: #B42318;
  --status-ok: #1F7A5A;

  /* Future & Provisional */
  --state-future-text: #4B5A66;
  --state-provisional-border: #4B5A66;

  /* Elevation & z-index */
  --shadow-overlay: 0 8px 24px rgba(20, 32, 42, 0.16);
  --z-base: 0;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-toast: 300;

  /* Layout dimensions */
  --size-layout-max: 1180px;
  --layout-max: 1180px; /* Aliased for backwards compatibility */
  --measure-reading: 68ch;
  --rail-width: 320px;
  --size-target-min: 44px;

  /* Typography semantic mappings */
  --text-body-size: var(--font-size-3);
  --text-body-leading: 1.65;
  --text-ui-size: var(--font-size-2);
`;

export const SEMANTIC_TOKENS_DARK = `
  /* === Tier 2: Semantic Tokens (Dark Theme) === */
  --surface-page: #0F1A22;
  --surface-raised: #16232D;
  --surface-overlay: #16232D;
  --text: #E6ECEF;
  --text-muted: #A3B2BD;
  --text-on-accent: #0F1A22;
  --rule: #2A3946;
  --border-control: #7E8F9C; /* 3:1 contrast against dark surface */
  --accent: #9AA8FF;
  --focus-ring: #9AA8FF;

  /* Semantic roles */
  --role-goal: #8DB4EA;
  --role-approach: #B4B9C4;
  --role-friction: #E2B34A;
  --role-decision: #B9A4EE;
  --role-outcome: #6FCBA3;
  --role-lesson: #EE9CC2;
  --role-neutral: #B4B9C4;

  /* Status */
  --status-warn: #F5C451;
  --status-error: #F97066;
  --status-ok: #6FCBA3;

  /* Future & Provisional */
  --state-future-text: #A3B2BD;
  --state-provisional-border: #A3B2BD;

  /* Elevation */
  --shadow-overlay: 0 8px 24px rgba(0, 0, 0, 0.45);
`;

export const COMPONENT_TOKENS = `
  /* === Tier 3: Component Tokens === */
  --button-height-md: var(--size-target-min);
  --button-height-sm: 32px;
  --button-bg: var(--accent);
  --button-fg: var(--text-on-accent);
  --button-radius: var(--radius-6);
  --chip-radius: var(--radius-2);
  --chip-border: var(--border-control);
  --field-border: var(--border-control);
  --field-radius: var(--radius-6);
  --role-section-rule-width: 3px;
  --banner-rule-width: 4px;
  --strata-band-min: 44px;
  --strata-band-max: 120px;
  --admin-nav-width: 240px;
  --admin-inspector-width: 340px;
  --editor-min-height: 60vh;
`;

export const FONTS_CSS = `
  /* §12.4 Self-Hosted Font Declarations & Fallbacks (20261020-UI-03) */
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
    --font-reading: 'Literata', Georgia, 'Times New Roman', serif;
    --font-ui: 'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-code: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
`;

export const THEME_CSS = `
${FONTS_CSS}

:root {
  ${PRIMITIVE_TOKENS}
  ${SEMANTIC_TOKENS_LIGHT}
  ${COMPONENT_TOKENS}
}

/* Unified Dark Theme (UI-02: declared once, avoids drift) */
:root[data-theme="dark"],
:root:not([data-theme="light"]) {
  @media (prefers-color-scheme: dark) {
    ${SEMANTIC_TOKENS_DARK}
  }
}

:root[data-theme="dark"] {
  ${SEMANTIC_TOKENS_DARK}
}

/* High Contrast Theme (Spec §12.3) */
@media (prefers-contrast: more) {
  :root {
    --rule: #4B5A66;
    --border-control: #14202A;
    --text-muted: #14202A;
  }
}

:root[data-contrast="more"] {
  --rule: #4B5A66;
  --border-control: #14202A;
  --text-muted: #14202A;
}
`;
