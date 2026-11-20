import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderItem } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const ProvidersConfigSchema = z.object({
  degradationMode: z.enum(['normal', 'force_extractive', 'force_unavailable']).default('normal'),
});

export type ProvidersConfig = z.infer<typeof ProvidersConfigSchema>;

function toProviderId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const providersModule: SettingsModuleManifest<ProvidersConfig> = {
  id: 'providers',
  title: 'Providers',
  summary: 'The local search model runs on this server. Configure your answering model and fallback behaviour.',
  icon: 'layers',
  order: 2,
  route: '/admin/settings/providers',
  version: 1,
  defaults: {
    degradationMode: 'normal',
  },
  schema: ProvidersConfigSchema,
  status: (_cfg, ctx) => {
    const active = (ctx?.providers ?? []).find((p) => p.enabled && p.id !== 'local') ?? (ctx?.settings?.activeProvider as any);
    return active && active.enabled ? `${active.name || active.label || active.id}` : 'Local only';
  },
  render: (cfg, ctx) => {
    const liveProviders = ctx.providers ?? [];
    const degradationMode =
      typeof ctx.settings?.degradation_mode === 'string'
        ? ctx.settings.degradation_mode
        : cfg.degradationMode;

    const savedProvider = ctx.settings?.activeProvider as any;
    const active =
      liveProviders.find((p) => p.enabled && p.id !== 'local') ??
      (savedProvider && savedProvider.enabled && savedProvider.id !== 'local' ? savedProvider : undefined);
    const answeringItemHtml = `<div class="lp-list">
      ${renderItem({
        id: 'provider-role-answering',
        title: 'Answering model',
        subtitle: active ? `${active.name || active.id}${active.model ? ` · ${active.model}` : ''}` : undefined,
        statusLabel: active ? 'Connected' : 'Local only, quotes from your entries',
        statusTone: active ? 'ok' : 'neutral',
        actions: {
          secondary: {
            id: 'btn-change-provider',
            label: 'Change',
            href: '/admin/settings/providers/change',
            variant: 'secondary',
            size: 'sm',
          },
        },
        attributes: 'data-role-id="answering"',
      })}
    </div>`;

    return `
      <form id="settings-module-form" data-settings-module="providers" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}
        ${answeringItemHtml}

        ${renderFormSection({
          title: 'Fallback behaviour',
          fieldsHtml: renderField({
            kind: 'select',
            id: 'setting-degradation-mode',
            name: 'degradationMode',
            label: 'Answer fallback mode',
            value: degradationMode,
            help: 'Controls how answers behave if an external AI provider is unreachable.',
            options: [
              { value: 'normal', label: 'Automatic (use configured providers)' },
              { value: 'force_extractive', label: 'Direct quotes only (skip AI synthesis)' },
              { value: 'force_unavailable', label: 'Queue all questions to Inbox' },
            ],
          }),
        })}
        ${renderActionBar({
          pageLevel: true,
          primary: {
            id: 'btn-save-settings-module',
            label: 'Save',
            variant: 'primary',
            type: 'button',
          },
        })}
      </form>
    `;
  },
};
