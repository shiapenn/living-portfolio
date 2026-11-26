import {
  ADMIN_CSS_FILENAME,
  ADMIN_EDITOR_CSS_FILENAME,
  ADMIN_GALLERY_CSS_FILENAME,
} from '@living-portfolio/ui-admin';
import { CORE_CSS_FILENAME, DEFAULT_ACCENT_CSS_FILENAME } from '@living-portfolio/ui-core';
import {
  COMPONENT_TOKEN_VALUES,
  PACK_RULES,
  PRIMITIVE_VALUES,
  PROXIMITY_TIERS,
  PUBLIC_LIGHT_VALUES,
  PUBLIC_DARK_VALUES,
  RELATIONS,
  SEMANTIC_DARK_VALUES,
  SEMANTIC_LIGHT_VALUES,
  TYPE_ROLES,
} from '../tokens/index.js';
import { LUCIDE_ICON_NAMES, renderIcon, renderIconSprite } from './icons.js';
import { renderButton, renderIconButton } from './button.js';
import { renderBadge, renderChip, renderStatusDot } from './chip.js';
import { renderField } from './field.js';
import { renderItem, renderList } from './item.js';
import { renderSectionHeader } from './section-header.js';
import { renderText } from './text.js';
import { renderSwitch } from './switch.js';
import { renderPageNotice, renderStatusLine } from '../components/feedback.js';
import {
  renderDialog,
  renderDisclosure,
  renderDrawer,
  renderEmptyState,
  renderMenu,
} from '../components/containers.js';

export { LUCIDE_ICON_NAMES, renderIcon, renderIconSprite } from './icons.js';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function computeHexContrastRatio(fgHex: string, bgHex: string): string {
  const l1 = relativeLuminance(hexToRgb(fgHex));
  const l2 = relativeLuminance(hexToRgb(bgHex));
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return `${ratio.toFixed(1)}:1`;
}

const ROLE_PALETTES = {
  light: {
    surface: SEMANTIC_LIGHT_VALUES['--lp-color-surface-page'],
    text: SEMANTIC_LIGHT_VALUES['--lp-color-text-1'],
    borderControl: SEMANTIC_LIGHT_VALUES['--lp-color-border-control'],
    focusRing: SEMANTIC_LIGHT_VALUES['--lp-color-accent-focus-ring'],
    roles: {
      action: { label: 'Action Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-action-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-action-bg'] },
      neutral: { label: 'Neutral Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-neutral-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-neutral-bg'] },
      success: { label: 'Success Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-success-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-success-bg'] },
      warning: { label: 'Warning Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-warning-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-warning-bg'] },
      danger: { label: 'Danger Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-danger-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-danger-bg'] },
      info: { label: 'Info Role (fg on bg)', fg: SEMANTIC_LIGHT_VALUES['--lp-color-role-info-fg'], bg: SEMANTIC_LIGHT_VALUES['--lp-color-role-info-bg'] },
    },
  },
  dark: {
    surface: SEMANTIC_DARK_VALUES['--lp-color-surface-l1'],
    text: SEMANTIC_DARK_VALUES['--lp-color-text-1'],
    borderControl: SEMANTIC_DARK_VALUES['--lp-color-border-control'],
    focusRing: SEMANTIC_DARK_VALUES['--lp-color-accent-focus-ring'],
    roles: {
      action: { label: 'Action Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-action-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-action-bg'] },
      neutral: { label: 'Neutral Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-neutral-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-neutral-bg'] },
      success: { label: 'Success Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-success-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-success-bg'] },
      warning: { label: 'Warning Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-warning-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-warning-bg'] },
      danger: { label: 'Danger Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-danger-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-danger-bg'] },
      info: { label: 'Info Role (fg on bg)', fg: SEMANTIC_DARK_VALUES['--lp-color-role-info-fg'], bg: SEMANTIC_DARK_VALUES['--lp-color-role-info-bg'] },
    },
  },
} as const;

import { renderFoundationsComponentsSection } from './foundations-gallery-components.js';
import { renderFoundationsPreviewSection } from './foundations-gallery-preview.js';

export function renderFoundationsGalleryPage(theme: 'light' | 'dark' = 'light'): string {
  const palette = ROLE_PALETTES[theme];
  const themeToggleIcon = theme === 'light' ? 'moon' : 'sun';
  const themeToggleLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  const headerHtml = `<header class="lp-admin-header" role="banner">
  <span class="lp-admin-header-brand">Living Portfolio Admin</span>
  <nav class="lp-admin-header-nav" aria-label="Admin navigation">
    <a href="/admin" class="lp-admin-header-link" aria-current="page">Entries</a>
    <a href="/admin/import" class="lp-admin-header-link">Import</a>
    <a href="/admin/settings" class="lp-admin-header-link">Settings</a>
    <a href="/home" class="lp-admin-header-link">View public site</a>
  </nav>
  <div class="lp-admin-header-actions">
    ${renderIconButton({
      id: 'foundations-theme-toggle',
      ariaLabel: themeToggleLabel,
      title: themeToggleLabel,
      icon: themeToggleIcon,
      iconSize: 20,
      variant: 'secondary',
    })}
    ${renderButton({
      id: 'foundations-signout-btn',
      label: 'Sign out',
      variant: 'quiet',
      size: 'sm',
      className: 'lp-admin-header-desktop-only',
    })}
    ${renderIconButton({
      id: 'foundations-menu-btn',
      ariaLabel: 'Open workspace menu',
      title: 'Open workspace menu',
      icon: 'menu',
      iconSize: 20,
      variant: 'secondary',
      className: 'lp-admin-header-mobile-only',
    })}
  </div>
</header>`;

  const roleSwatchesHtml = (
    Object.entries(palette.roles) as Array<
      [keyof typeof palette.roles, { label: string; fg: string; bg: string }]
    >
  )
    .map(([roleKey, role]) => {
      const ratio = computeHexContrastRatio(role.fg, role.bg);
      return `<div class="lp-specimen-swatch lp-specimen-swatch-${roleKey}" data-contrast-role="${roleKey}">
        <span>${role.label}</span>
        <strong data-contrast-value="${roleKey}">${ratio}</strong>
      </div>`;
    })
    .join('');

  const surfaceTextRatio = computeHexContrastRatio(palette.text, palette.surface);
  const borderRatio = computeHexContrastRatio(palette.borderControl, palette.surface);
  const focusRatio = computeHexContrastRatio(palette.focusRing, palette.surface);

  const spacingSteps = [4, 8, 12, 16, 24, 32, 48, 64] as const;
  const spacingBarsHtml = spacingSteps
    .map(
      (px) => `<div class="lp-spacing-bar-row" data-spacing-specimen="${px}">
      <span class="lp-type-caption">${px}px</span>
      <span class="lp-spacing-bar lp-spacing-bar-${px}" aria-hidden="true"></span>
    </div>`
    )
    .join('');

  const iconInventoryHtml = LUCIDE_ICON_NAMES.map(
    (iconName) => `<span class="lp-icon-inventory-item" data-icon-specimen="${iconName}">
      ${renderIcon({ name: iconName, size: 16 })}
      <span>${iconName}</span>
    </span>`
  ).join('');

  const specimensHtml = `<section id="foundations-specimens" class="lp-foundations-grid" aria-label="Design foundation specimens">
  <div class="lp-card">
    <h2>Shape, Radii, Elevation &amp; Borders (D-FOUND-2)</h2>
    <div class="lp-gallery-row">
      ${renderButton({ label: `Control ${COMPONENT_TOKEN_VALUES['--lp-radius-control']}`, variant: 'secondary', size: 'sm' })}
      <span id="specimen-radius-container" class="lp-specimen-box-container">Container ${COMPONENT_TOKEN_VALUES['--lp-radius-container']} (Flat)</span>
      <span id="specimen-radius-overlay" class="lp-specimen-box-overlay">Overlay ${COMPONENT_TOKEN_VALUES['--lp-radius-overlay']} (Raised)</span>
      ${renderBadge({ label: `Pill ${COMPONENT_TOKEN_VALUES['--lp-radius-full']} (borderless)`, tone: 'action' })}
      ${renderChip({ label: `Chip ${COMPONENT_TOKEN_VALUES['--lp-radius-chip']} (hairline border)`, interactive: true, selected: true })}
    </div>
    <div class="lp-card-section">
      <h3>Surface &amp; Border Tokens</h3>
      <div class="lp-specimen-surface-row">
        <span class="lp-specimen-surface-chip lp-surface-chip-page">--surface-page</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-raised">--surface-raised + --border-subtle</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-subtle">--surface-subtle</span>
        <span class="lp-specimen-surface-chip lp-surface-chip-control-border">--border-control (&ge; 3:1)</span>
      </div>
    </div>
    <div class="lp-card-section">
      <h3>Icon Sizes (16 / 20 / 24 px) &amp; Sprite Inventory (D-FOUND-1)</h3>
      <div class="lp-gallery-row">
        <span>${COMPONENT_TOKEN_VALUES['--lp-size-icon-sm']} ${renderIcon({ name: 'info', size: 16 })}</span>
        <span>${COMPONENT_TOKEN_VALUES['--lp-size-icon-md']} ${renderIcon({ name: 'moon', size: 20 })}</span>
        <span>${COMPONENT_TOKEN_VALUES['--lp-size-icon-lg']} ${renderIcon({ name: 'layers', size: 24 })}</span>
      </div>
      <div id="foundations-icon-inventory" class="lp-icon-inventory-grid">
        ${iconInventoryHtml}
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Type Scale &amp; Spacing Bars (D-FOUND-3, D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      <span class="lp-type-page-title">Page Title — 28/36 Semibold (600)</span>
      <span class="lp-type-title">Section Title — 20/28 Semibold (600)</span>
      <span class="lp-type-body">Body — 16/24 Regular (400)</span>
      <span class="lp-type-body-sm">Body Small / Label — 14/20 Medium (500)</span>
      <span class="lp-type-caption">Caption — 12/16 Regular (400)</span>
    </div>
    <div class="lp-card-section">
      <h3>4 px Spacing Scale Bars</h3>
      <div id="foundations-spacing-bars" class="lp-gallery-stack">
        ${spacingBarsHtml}
      </div>
    </div>
  </div>

  <div class="lp-card">
    <h2>Colour Roles &amp; Computed Contrast Ratios (D-FOUND-4)</h2>
    <div class="lp-gallery-stack">
      ${roleSwatchesHtml}
      <div id="contrast-probe-control" class="lp-contrast-probe" data-contrast-role="surface-text">
        <div>Surface Text Contrast: <strong id="contrast-probe-text-val">${surfaceTextRatio}</strong></div>
        <div>Control Boundary (--border-control): <strong id="contrast-probe-border-val">${borderRatio}</strong></div>
        <div>Focus Ring (--focus-ring): <strong id="contrast-probe-focus-val">${focusRatio}</strong></div>
      </div>
    </div>
  </div>
</section>`;

  const componentsHtml = renderFoundationsComponentsSection(themeToggleIcon, themeToggleLabel);
  const { layoutPreviewHtml, clientScript } = renderFoundationsPreviewSection();
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design Foundations Gallery — Living Portfolio</title>
  <link rel="stylesheet" href="/assets/css/${CORE_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${ADMIN_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${ADMIN_EDITOR_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${ADMIN_GALLERY_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${DEFAULT_ACCENT_CSS_FILENAME}" />
</head>
<body>
  ${renderIconSprite()}
  ${headerHtml}
  <main id="foundations-main" class="lp-foundations-page" data-foundations-scope="true">
    <header>
      <h1>Design Foundations Gallery</h1>
      <p>Authoritative specimen and interactive state reference for D-FOUND-1 through D-FOUND-6.</p>
    </header>
    ${specimensHtml}
    ${componentsHtml}
    ${layoutPreviewHtml}
  </main>
  ${clientScript}
</body>
</html>`;
}

export function renderFoundationsTokensSection(): string {
  const spaceSummary = PACK_RULES.admin.spaceAllowed
    .map((px) => `${px} (${px / PACK_RULES.admin.spaceBase}x)`)
    .join(' · ');

  const proximitySummary = Object.entries(PROXIMITY_TIERS)
    .map(([level, px]) => `p${level}: ${px}`)
    .join(' < ');

  const relationsSummary = Object.entries(RELATIONS)
    .slice(0, 8)
    .map(([rel, px]) => `${rel}: ${px}`)
    .join(' · ');

  const lightContrast = computeHexContrastRatio(
    SEMANTIC_LIGHT_VALUES['--lp-color-text-1'],
    SEMANTIC_LIGHT_VALUES['--lp-color-surface-l0']
  );
  const darkContrast = computeHexContrastRatio(
    SEMANTIC_DARK_VALUES['--lp-color-text-1'],
    SEMANTIC_DARK_VALUES['--lp-color-surface-l0']
  );
  const pubLightContrast = computeHexContrastRatio(
    PUBLIC_LIGHT_VALUES['--pub-color-text-primary'],
    PUBLIC_LIGHT_VALUES['--pub-color-surface-canvas']
  );
  const pubDarkContrast = computeHexContrastRatio(
    PUBLIC_DARK_VALUES['--pub-color-text-primary'],
    PUBLIC_DARK_VALUES['--pub-color-surface-canvas']
  );

  return `<section id="gallery-type-specimen" class="lp-gallery-section" data-component="TypeSpecimen">
    ${renderSectionHeader({ title: 'Type Specimen (B3 — 8 Admin Roles)' })}
    <div data-c="Text" class="lp-stack lp-gap-related">
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">page-title · 24 / 700 / text-1</span><div class="lp-page-title">Settings</div></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">section-title · 18 / 600 / text-1</span><div class="lp-section-title">Answering thresholds</div></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">item-title · 16 / 500 / text-1</span><div class="lp-item-title">Advisory locks in PostgreSQL</div></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">label · 14 / 500 / text-2</span><label class="lp-field-label">Direct answer threshold</label></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">body · 14 / 400 / text-1</span><p class="lp-body">Answers quote directly from your published entries.</p></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">secondary · 12 / 500 / text-2</span><p class="lp-description">Controls when questions escalate to Inbox.</p></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">meta/helper · 12 / 400 / text-3</span><p class="lp-field-help">Recommended 0.82. Higher sends more questions to Inbox.</p></div>
      <div class="lp-stack lp-gap-tight"><span class="lp-caption">mono · 12 / 400 / text-1</span><code class="lp-credential-single">JBSW Y3DP EHPK 3PXP</code></div>
    </div>
  </section>
  <section id="gallery-foundations-tokens" class="lp-gallery-section" data-component="FoundationsTokens">
    ${renderSectionHeader({ title: 'Foundations: Design Tokens (Admin & Public Packs)' })}
    ${renderText({ variant: 'description', text: 'Generated directly from packages/design-tokens/packs/*.json (D-M2 scale rules, proximity tiers, contrast ratios).' })}
    ${renderList({
      id: 'gallery-tokens-list',
      variant: 'plain',
      itemsHtml: `${renderItem({
        id: 'gallery-tokens-colors',
        title: 'Admin Semantic Colours (Light / Dark + Contrast)',
        subtitle: `surface-l0: ${SEMANTIC_LIGHT_VALUES['--lp-color-surface-l0']} / ${SEMANTIC_DARK_VALUES['--lp-color-surface-l0']} · text-1: ${SEMANTIC_LIGHT_VALUES['--lp-color-text-1']} (${lightContrast}) / ${SEMANTIC_DARK_VALUES['--lp-color-text-1']} (${darkContrast}) · accent: ${SEMANTIC_LIGHT_VALUES['--lp-color-accent-default']} / ${SEMANTIC_DARK_VALUES['--lp-color-accent-default']}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-space',
        title: `Admin Space Scale (base ${PACK_RULES.admin.spaceBase}px)`,
        subtitle: spaceSummary,
      })}
      ${renderItem({
        id: 'gallery-tokens-proximity',
        title: 'Admin Proximity Levels & Relations',
        subtitle: `${proximitySummary} | ${relationsSummary}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-type',
        title: 'Admin Typography Roles (7 + control-label)',
        subtitle: Object.entries(TYPE_ROLES)
          .map(([role, spec]) => `${role}: ${spec.size}/${spec.weight} (${spec.lineHeight})`)
          .join(' · '),
      })}
      ${renderItem({
        id: 'gallery-tokens-radii',
        title: 'Admin Radii, Borders & Elevations',
        subtitle: `r1: ${COMPONENT_TOKEN_VALUES['--lp-radius-r1']} · r2: ${COMPONENT_TOKEN_VALUES['--lp-radius-r2']} · borders: ${PACK_RULES.admin.borderAllowed.join('/')} · e0: ${COMPONENT_TOKEN_VALUES['--lp-elevation-e0']} · e1: ${COMPONENT_TOKEN_VALUES['--lp-elevation-e1-offset-y']}/${COMPONENT_TOKEN_VALUES['--lp-elevation-e1-blur']} · e2: ${COMPONENT_TOKEN_VALUES['--lp-elevation-e2-offset-y']}/${COMPONENT_TOKEN_VALUES['--lp-elevation-e2-blur']}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-motion',
        title: 'Admin Motion Durations & Easings',
        subtitle: `fast: ${COMPONENT_TOKEN_VALUES['--lp-motion-duration-fast']} · base: ${COMPONENT_TOKEN_VALUES['--lp-motion-duration-base']} · slow: ${COMPONENT_TOKEN_VALUES['--lp-motion-duration-slow']} · pulse: ${COMPONENT_TOKEN_VALUES['--lp-motion-duration-pulse']} · easings: ${PACK_RULES.admin.motionEasingsAllowed.join(', ')}`,
      })}
      ${renderItem({
        id: 'gallery-tokens-public-pack',
        title: 'Public Pack Summary (Fluid Type + Light/Dark Moods)',
        subtitle: `ratio ${PACK_RULES.public.typeScale.ratio} · max space ${PACK_RULES.public.spaceMax} · light ${PUBLIC_LIGHT_VALUES['--pub-color-text-primary']} on ${PUBLIC_LIGHT_VALUES['--pub-color-surface-canvas']} (${pubLightContrast}) · dark ${PUBLIC_DARK_VALUES['--pub-color-text-primary']} on ${PUBLIC_DARK_VALUES['--pub-color-surface-canvas']} (${pubDarkContrast})`,
      })}`,
    })}
  </section>`;
}

