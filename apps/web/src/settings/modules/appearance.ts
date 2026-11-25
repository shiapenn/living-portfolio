import { z } from '@living-portfolio/core';
import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  type ThemePackV2,
} from '@living-portfolio/ui-core';
import { renderActionBar, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';
import { renderAppearanceV2Script } from './appearance-script.js';

export const AppearanceConfigSchema = z.object({
  packId: z.enum(['quiet-default', 'editorial-slate', 'warm-ink', 'high-contrast', 'builtin-light', 'builtin-dark']).default('quiet-default'),
  lightAccent: z.string().default(DEFAULT_ADMIN_THEME_PACK.accent.light),
  darkAccent: z.string().default(DEFAULT_ADMIN_THEME_PACK.accent.dark),
});

export type AppearanceConfig = z.infer<typeof AppearanceConfigSchema>;

export const appearanceModule: SettingsModuleManifest<AppearanceConfig> = {
  id: 'appearance',
  title: 'Appearance',
  summary: 'Theme packs, constrained tokens, and WCAG AA contrast checks for admin and public scopes.',
  explain: {
    what: 'Choose a verified theme pack or customise accent seeds, density, corner radius, and self-hosted fonts for admin and public scopes.',
    when: 'Whenever you want to adjust contrast, density, or accent colour without writing arbitrary CSS.',
    how: 'All packs and overrides are validated against WCAG AA contrast (4.5:1 text, 3:1 controls) before saving.',
    impact: 'Admin scope applies immediately via a cacheable theme.<hash>.css file; public scope is stored and validated for WP-19/WP-20.1.',
  },
  icon: 'sun',
  order: 3,
  route: '/admin/settings/appearance',
  version: 2,
  defaults: {
    packId: 'quiet-default',
    lightAccent: DEFAULT_ADMIN_THEME_PACK.accent.light,
    darkAccent: DEFAULT_ADMIN_THEME_PACK.accent.dark,
  },
  schema: AppearanceConfigSchema,
  status: (_cfg, ctx) => {
    const v2 = (ctx?.settings?.appearanceV2 as { admin?: ThemePackV2 } | undefined)?.admin;
    return v2?.name || 'Quiet default';
  },
  render: (cfg, ctx) => {
    const v2 = (ctx.settings?.appearanceV2 as { admin?: ThemePackV2; public?: ThemePackV2 } | undefined) || {};
    const themeObj = (ctx.settings?.theme as any) || {};
    const adminPack: ThemePackV2 = v2.admin || {
      ...DEFAULT_ADMIN_THEME_PACK,
      accent: {
        light: themeObj.lightTokens?.['--accent'] || cfg.lightAccent || DEFAULT_ADMIN_THEME_PACK.accent.light,
        dark: themeObj.darkTokens?.['--accent'] || cfg.darkAccent || DEFAULT_ADMIN_THEME_PACK.accent.dark,
      },
    };
    const publicPack: ThemePackV2 = v2.public || DEFAULT_PUBLIC_THEME_PACK;

    return `
      <form id="settings-module-form" data-settings-module="appearance" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'appearance-scope-section',
          title: 'Scope and theme pack',
          description: 'Admin scope applies immediately via theme.<hash>.css. Public scope is stored and validated for WP-19/WP-20.1.',
          fieldsHtml: `
            ${renderField({
              kind: 'select',
              id: 'setting-appearance-scope',
              name: 'scope',
              label: 'Target scope',
              value: 'admin',
              options: [
                { value: 'admin', label: 'Admin workspace (applies live)' },
                { value: 'public', label: 'Public site (stored for WP-19/WP-20.1)' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-pack',
              name: 'packId',
              label: 'Theme pack',
              value: adminPack.packId,
              help: 'Selectable packs verified against WCAG AA contrast (4.5:1 text, 3:1 controls).',
              options: Object.values(BUILTIN_THEME_PACKS_V2).map((p) => ({
                value: p.packId,
                label: p.name,
              })),
            })}
          `,
        })}

        ${renderFormSection({
          id: 'appearance-customisation-section',
          title: 'Constrained customisation',
          description: 'Only approved token tiers can be customised. Any colour failing WCAG AA contrast is rejected.',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-theme-light-accent',
              name: 'lightAccent',
              label: 'Light theme accent',
              inputType: 'text',
              value: adminPack.accent.light,
              help: 'Hex colour (#RRGGBB) used for primary buttons and links in light mode.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-theme-dark-accent',
              name: 'darkAccent',
              label: 'Dark theme accent',
              inputType: 'text',
              value: adminPack.accent.dark,
              help: 'Hex colour (#RRGGBB) used for primary buttons and links in dark mode.',
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-density',
              name: 'density',
              label: 'Density (proximity table)',
              value: adminPack.density,
              options: [
                { value: 'comfortable', label: 'Comfortable (default)' },
                { value: 'compact', label: 'Compact' },
                { value: 'spacious', label: 'Spacious' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-radius',
              name: 'radiusScale',
              label: 'Corner radius scale',
              value: adminPack.radiusScale,
              options: [
                { value: 'default', label: 'Default (4 / 8 / 12 px)' },
                { value: 'sharp', label: 'Sharp (2 / 4 / 6 px)' },
                { value: 'soft', label: 'Soft (6 / 10 / 16 px)' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-font',
              name: 'fontFamily',
              label: 'Self-hosted font family',
              value: adminPack.fontFamily,
              options: [
                { value: 'system', label: 'System UI (default)' },
                { value: 'atkinson', label: 'Atkinson Hyperlegible Next' },
                { value: 'literata', label: 'Literata' },
              ],
            })}
            ${renderText({ id: 'appearance-live-preview', variant: 'caption', text: 'Live preview ready.' })}
            ${renderText({ id: 'theme-conformance-box', variant: 'caption', text: 'WCAG AA contrast checks active.' })}
          `,
        })}

        ${renderFormSection({
          id: 'appearance-portability-section',
          title: 'Import and export theme pack',
          description: 'Share or back up a typed JSON theme pack. Unknown properties and arbitrary CSS are rejected.',
          fieldsHtml: renderField({
            kind: 'textarea',
            id: 'setting-theme-import-json',
            name: 'importJson',
            label: 'Theme pack JSON',
            rows: 5,
            placeholder: '{"version":2,"id":"custom","name":"Custom","packId":"quiet-default",...}',
          }),
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-import-theme-pack', label: 'Import pack', variant: 'secondary', type: 'button', size: 'sm' },
            textAction: { id: 'btn-export-theme-pack', label: 'Export pack', variant: 'text', type: 'button', size: 'sm' },
          }),
        })}

        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
        })}
      </form>
      ${renderAppearanceV2Script(adminPack, publicPack)}
    `;
  },
};
