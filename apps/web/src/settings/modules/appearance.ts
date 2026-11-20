import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';
import { BUILTIN_THEME_PACKS } from '../theme-packs.js';

export const AppearanceConfigSchema = z.object({
  packId: z.enum(['builtin-light', 'builtin-dark']).default('builtin-light'),
  lightAccent: z.string().default(BUILTIN_THEME_PACKS.light.tokens['--accent']),
  darkAccent: z.string().default(BUILTIN_THEME_PACKS.dark.tokens['--accent']),
});

export type AppearanceConfig = z.infer<typeof AppearanceConfigSchema>;

export const appearanceModule: SettingsModuleManifest<AppearanceConfig> = {
  id: 'appearance',
  title: 'Appearance',
  summary: 'Theme pack and accent colours for admin and public pages.',
  icon: 'sun',
  order: 3,
  route: '/admin/settings/appearance',
  version: 1,
  defaults: {
    packId: 'builtin-light',
    lightAccent: BUILTIN_THEME_PACKS.light.tokens['--accent'],
    darkAccent: BUILTIN_THEME_PACKS.dark.tokens['--accent'],
  },
  schema: AppearanceConfigSchema,
  status: (cfg) => (cfg.packId === 'builtin-dark' ? 'Dark pack' : 'Light pack'),
  render: (cfg, ctx) => {
    const themeObj = (ctx.settings?.theme as any) || {};
    const lightAccent = themeObj.lightTokens?.['--accent'] || cfg.lightAccent;
    const darkAccent = themeObj.darkTokens?.['--accent'] || cfg.darkAccent;

    return `
      <form id="settings-module-form" data-settings-module="appearance" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Theme pack</h2>
          ${renderField({
            kind: 'select',
            id: 'setting-theme-pack',
            name: 'packId',
            label: 'Default theme pack',
            value: cfg.packId,
            help: 'Built-in light and dark token packs with verified contrast.',
            options: [
              { value: 'builtin-light', label: 'Light (built-in)' },
              { value: 'builtin-dark', label: 'Dark (built-in)' },
            ],
          })}
        </section>

        ${renderFormSection({
          title: 'Accent colours',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-theme-light-accent',
              name: 'lightAccent',
              label: 'Light theme accent',
              inputType: 'text',
              value: lightAccent,
              help: 'Hex colour used for primary buttons and links in light mode.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-theme-dark-accent',
              name: 'darkAccent',
              label: 'Dark theme accent',
              inputType: 'text',
              value: darkAccent,
              help: 'Hex colour used for primary buttons and links in dark mode.',
            })}
            <div id="theme-conformance-box" class="lp-help-text"></div>
          `,
        })}
        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
        })}
      </form>
    `;
  },
};
