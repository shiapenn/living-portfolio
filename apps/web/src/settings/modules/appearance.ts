import { z } from '@living-portfolio/core';
import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  THEME_CANVAS,
  contrastRatio,
  type ThemePackV2,
} from '@living-portfolio/ui-core';
import { renderActionBar, renderChoiceGroup, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderStatusLine, renderTable } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';
import { renderAppearanceV2Script } from './appearance-script.js';

export const AppearanceConfigSchema = z.object({
  packId: z.enum(['quiet-default', 'editorial-slate', 'warm-ink', 'high-contrast', 'builtin-light', 'builtin-dark']).default('quiet-default'),
  accentSeed: z.string().default(DEFAULT_ADMIN_THEME_PACK.accent.light),
});

export type AppearanceConfig = z.infer<typeof AppearanceConfigSchema>;

export const appearanceModule: SettingsModuleManifest<AppearanceConfig> = {
  id: 'appearance',
  title: 'Appearance',
  summary: 'Theme packs, accent, and typography',
  icon: 'sun',
  order: 3,
  route: '/admin/settings/appearance',
  version: 2,
  defaults: {
    packId: 'quiet-default',
    accentSeed: DEFAULT_ADMIN_THEME_PACK.accent.light,
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
        light: themeObj.lightTokens?.['--accent'] || cfg.accentSeed || DEFAULT_ADMIN_THEME_PACK.accent.light,
        dark: themeObj.darkTokens?.['--accent'] || DEFAULT_ADMIN_THEME_PACK.accent.dark,
      },
    };
    const publicPack: ThemePackV2 = v2.public || DEFAULT_PUBLIC_THEME_PACK;

    const previewHref = `/assets/css/theme-preview.css?pack=${encodeURIComponent(adminPack.packId)}&seed=${encodeURIComponent(adminPack.accent.light)}&density=${encodeURIComponent(adminPack.density)}&radius=${encodeURIComponent(adminPack.radiusScale)}&font=${encodeURIComponent(adminPack.fontFamily)}`;
    const pubLightCanvas = contrastRatio(publicPack.accent.light, THEME_CANVAS.light).toFixed(2);
    const pubLightLabel = contrastRatio(THEME_CANVAS.light, publicPack.accent.light).toFixed(2);
    const pubDarkCanvas = contrastRatio(publicPack.accent.dark, THEME_CANVAS.dark).toFixed(2);
    const pubDarkLabel = contrastRatio(THEME_CANVAS.dark, publicPack.accent.dark).toFixed(2);

    const publicContrastTableHtml = renderTable({
      id: 'appearance-public-contrast-table',
      caption: 'Public contrast pairs',
      columns: [
        { key: 'pair', label: 'Colour pair' },
        { key: 'ratio', label: 'Ratio' },
        { key: 'result', label: 'WCAG AA' },
      ],
      rows: [
        { pair: 'Light accent on canvas', ratio: `${pubLightCanvas}:1`, result: Number(pubLightCanvas) >= 4.5 ? 'Pass' : 'Fail' },
        { pair: 'Label on light accent', ratio: `${pubLightLabel}:1`, result: Number(pubLightLabel) >= 4.5 ? 'Pass' : 'Fail' },
        { pair: 'Dark accent on canvas', ratio: `${pubDarkCanvas}:1`, result: Number(pubDarkCanvas) >= 4.5 ? 'Pass' : 'Fail' },
        { pair: 'Label on dark accent', ratio: `${pubDarkLabel}:1`, result: Number(pubDarkLabel) >= 4.5 ? 'Pass' : 'Fail' },
      ],
    });

    const composedPreviewHtml = `
      <div id="appearance-live-preview" class="lp-stack lp-gap-related">
        ${renderChoiceGroup({
          name: 'preview-choice-sample',
          mode: 'multiple',
          variant: 'card',
          options: [{ id: 'preview-choice-1', value: 'yes', label: 'Sample toggle option', checked: true }],
        })}
        ${renderText({ variant: 'body', text: 'Sample workspace — accent, radius, density, and font update live.' })}
      </div>
    `;

    return `
      <form id="settings-module-form" data-settings-module="appearance" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'appearance-scope-section',
          title: 'Scope and pack',
          fieldsHtml: `
            ${renderField({
              kind: 'select',
              id: 'setting-appearance-scope',
              name: 'scope',
              label: 'Target scope',
              value: 'admin',
              options: [
                { value: 'admin', label: 'Admin workspace' },
                { value: 'public', label: 'Public site' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-pack',
              name: 'packId',
              label: 'Theme pack',
              value: adminPack.packId,
              options: Object.values(BUILTIN_THEME_PACKS_V2).map((p) => ({
                value: p.packId,
                label: p.name,
              })),
            })}
          `,
        })}

        ${renderFormSection({
          id: 'appearance-customisation-section',
          title: 'Tokens',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-theme-accent-seed',
              name: 'accentSeed',
              label: 'Accent seed',
              inputType: 'text',
              value: adminPack.accent.light,
              help: 'Hex format (#RRGGBB). Light and dark ramps derive automatically.',
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-density',
              name: 'density',
              label: 'Density',
              value: adminPack.density,
              options: [
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
                { value: 'spacious', label: 'Spacious' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-radius',
              name: 'radiusScale',
              label: 'Corner radius',
              value: adminPack.radiusScale,
              options: [
                { value: 'default', label: 'Default' },
                { value: 'sharp', label: 'Sharp' },
                { value: 'soft', label: 'Soft' },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-theme-font',
              name: 'fontFamily',
              label: 'Font family',
              value: adminPack.fontFamily,
              options: [
                { value: 'system', label: 'System UI' },
                { value: 'atkinson', label: 'Atkinson Hyperlegible Next' },
                { value: 'literata', label: 'Literata' },
              ],
            })}
            ${renderText({ id: 'theme-conformance-box', variant: 'caption', text: 'Contrast verified.' })}
            <div id="appearance-aa-error" data-c="Notice" class="lp-notice lp-notice-danger lp-is-hidden"></div>
          `,
        })}

        ${renderFormSection({
          id: 'appearance-admin-preview-section',
          title: 'Live preview',
          fieldsHtml: composedPreviewHtml,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'preview-secondary-btn', label: 'Sample action', variant: 'secondary', type: 'button', size: 'sm' },
            textAction: { id: 'preview-text-btn', label: 'Sample link', variant: 'text', type: 'button', size: 'sm' },
          }),
        })}

        <div id="appearance-public-contrast-section" class="lp-is-hidden">
          ${renderFormSection({
            title: 'Public contrast table',
            description: 'Public site styling applies in a future release.',
            fieldsHtml: publicContrastTableHtml,
          })}
        </div>

        ${renderFormSection({
          id: 'appearance-portability-section',
          title: 'Import and export',
          fieldsHtml: renderField({
            kind: 'textarea',
            id: 'setting-theme-import-json',
            name: 'importJson',
            label: 'Theme pack JSON',
            rows: 5,
            help: 'Arbitrary CSS properties are rejected.',
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
      <link id="appearance-preview-link" rel="stylesheet" href="${previewHref}" />
      ${renderAppearanceV2Script(adminPack, publicPack)}
    `;
  },
};
