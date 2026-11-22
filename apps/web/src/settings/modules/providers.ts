import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
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
    const activeValueText = active
      ? `${active.name || active.id}${active.model ? ` · ${active.model}` : ''}`
      : 'Local only';
    const activeDescText = active
      ? 'Answers use your configured external provider.'
      : 'Answers quote directly from your entries; nothing leaves this server.';
    const healthLabel = active?.healthStatus === 'Key invalid' || active?.healthStatus === 'Unreachable'
      ? active.healthStatus
      : 'Connected';
    const answeringSectionHtml = renderFormSection({
      id: 'provider-role-answering',
      title: 'Answering model',
      fieldsHtml: `<div class="lp-list" data-role-id="answering">${renderItem({
        id: 'providers-current-status',
        className: active ? 'lp-item-trailing-status' : undefined,
        title: activeValueText,
        subtitle: activeDescText,
        statusLabel: active ? healthLabel : undefined,
        statusTone: active ? (healthLabel === 'Connected' ? 'ok' : 'danger') : undefined,
        actions: {
          level: 'item',
          secondary: {
            id: 'btn-change-provider',
            label: 'Change',
            href: '/admin/settings/providers/change',
            variant: 'secondary',
            size: 'sm',
          },
        },
      })}</div>`,
    });

    return `
      <form id="settings-module-form" data-settings-module="providers" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}
        ${answeringSectionHtml}

        ${renderFormSection({
          id: 'provider-role-fallback',
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
