import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { renderButton, renderField, renderStatusDot } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const ProvidersConfigSchema = z.object({
  degradationMode: z.enum(['normal', 'force_extractive', 'force_unavailable']).default('normal'),
});

export type ProvidersConfig = z.infer<typeof ProvidersConfigSchema>;

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
    return enabledCount > 0 ? `${enabledCount} active` : 'Extractive only';
  },
  render: (cfg, ctx) => {
    const providers = ctx.providers ?? [];
    const degradationMode =
      typeof ctx.settings?.degradation_mode === 'string'
        ? ctx.settings.degradation_mode
        : cfg.degradationMode;

    const providerRows = providers.length
      ? providers
          .map((p) => {
            const label = escapeHtml(p.name || p.id || 'Provider');
            const model = escapeHtml(p.model || 'Default model');
            const statusText = p.enabled ? 'Enabled' : 'Disabled';
            const tone = p.enabled ? 'ok' : 'neutral';
            return `
              <div class="lp-list-row">
                <div class="lp-list-row-main">
                  <div class="lp-list-row-primary">${label}</div>
                  <div class="lp-list-row-secondary">${model}</div>
                </div>
                <div class="lp-list-row-trailing">
                  ${renderStatusDot({ label: statusText, tone })}
                </div>
              </div>
            `;
          })
          .join('')
      : `<p class="lp-help-text">No external providers configured. Visitor questions use direct quotes from your entries.</p>`;

    return `
      <form id="settings-module-form" data-settings-module="providers" class="lp-stack-lg">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Configured providers</h2>
          <div class="lp-list">${providerRows}</div>
        </section>

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Fallback behaviour</h2>
          ${renderField({
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
          })}
        </section>

        <div>
          ${renderButton({ id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' })}
        </div>
      </form>
    `;
  },
};
