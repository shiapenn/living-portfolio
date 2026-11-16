import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection } from '../../primitives/index.js';
import { renderProviderRow, renderStatusLine } from '../../components/index.js';
import { WIZARD_STRINGS } from '../../strings.js';
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
  summary: 'Configured AI models and fallback behaviour when providers are offline.',
  icon: 'layers',
  order: 2,
  route: '/admin/settings/providers',
  version: 1,
  defaults: {
    degradationMode: 'normal',
  },
  schema: ProvidersConfigSchema,
  status: (_cfg, ctx) => {
    const enabledCount = (ctx?.providers ?? []).filter((p) => p.enabled).length;
    return enabledCount > 0 ? `${enabledCount} active` : 'Local ONNX active';
  },
  render: (cfg, ctx) => {
    const liveProviders = ctx.providers ?? [];
    const degradationMode =
      typeof ctx.settings?.degradation_mode === 'string'
        ? ctx.settings.degradation_mode
        : cfg.degradationMode;

    const liveByName = new Map(
      liveProviders.map((p) => [toProviderId(p.name || p.id || ''), p]),
    );

    const providerRows = WIZARD_STRINGS.step3.providersTable.rows
      .map((row) => {
        const id = toProviderId(row.name);
        const live = liveByName.get(id);
        const isEnabled = live ? Boolean(live.enabled) : row.isLocal;
        const statusText = live
          ? live.enabled
            ? 'Enabled'
            : 'Disabled'
          : row.status;
        return renderProviderRow({
          id,
          name: row.name,
          model: live?.model || row.model,
          classes: row.classes,
          status: statusText,
          tone: isEnabled ? 'ok' : 'neutral',
          isLocal: row.isLocal,
          mode: 'item',
          editable: !row.isLocal,
          hasKey: Boolean(live?.enabled),
        });
      })
      .join('');

    return `
      <form id="settings-module-form" data-settings-module="providers" class="lp-stack-lg">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          title: 'Configured providers',
          description: 'Local ONNX runs on this server. External provider API keys are write-only and never echoed.',
          fieldsHtml: `<div class="lp-list lp-stack-sm">${providerRows}</div>`,
        })}

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
