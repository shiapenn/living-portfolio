import { z } from '@living-portfolio/core';
import { renderActionBar, renderChoiceGroup, renderFormSection, renderItem, renderList } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const VisibilityConfigSchema = z.object({
  allowSearchIndexing: z.boolean().default(true),
  blockAiCrawlers: z.boolean().default(false),
  federationEnabled: z.boolean().default(false),
});

export type VisibilityConfig = z.infer<typeof VisibilityConfigSchema>;

export const visibilityModule: SettingsModuleManifest<VisibilityConfig> = {
  id: 'visibility',
  title: 'Visibility',
  summary: 'Search indexing and crawler policy',
  icon: 'external-link',
  order: 6,
  route: '/admin/settings/visibility',
  version: 1,
  defaults: {
    allowSearchIndexing: true,
    blockAiCrawlers: false,
    federationEnabled: false,
  },
  schema: VisibilityConfigSchema,
  status: (cfg, ctx) => {
    const raw = ctx?.settings || {};
    const vis = (raw.visibility && typeof raw.visibility === 'object' ? raw.visibility : raw) as Record<string, unknown>;
    const allow = typeof vis.allowSearchIndexing === 'boolean' ? vis.allowSearchIndexing : cfg.allowSearchIndexing;
    return allow ? 'Public' : 'Hidden';
  },
  render: (cfg, ctx) => {
    const raw = ctx.settings || {};
    const vis = (raw.visibility && typeof raw.visibility === 'object' ? raw.visibility : raw) as Record<string, unknown>;
    const allowSearch = typeof vis.allowSearchIndexing === 'boolean' ? vis.allowSearchIndexing : cfg.allowSearchIndexing;
    const blockAi = typeof vis.blockAiCrawlers === 'boolean' ? vis.blockAiCrawlers : cfg.blockAiCrawlers;
    const federation = typeof vis.federationEnabled === 'boolean' ? vis.federationEnabled : cfg.federationEnabled;

    const feedsListHtml = renderList({
      id: 'visibility-feeds-list',
      variant: 'plain',
      itemsHtml: `
        ${renderItem({
          id: 'vis-rss-item',
          title: 'RSS feed',
          subtitle: 'Syndication feed for published entries',
          statusLabel: 'Active',
          statusTone: 'ok',
        })}
        ${renderItem({
          id: 'vis-sitemap-item',
          title: 'Sitemap',
          subtitle: 'Public index for search engines',
          statusLabel: 'Active',
          statusTone: 'ok',
        })}
        ${renderItem({
          id: 'vis-robots-item',
          title: 'Crawler policy',
          subtitle: 'Private and admin routes stay blocked',
          statusLabel: allowSearch ? 'Active' : 'Paused',
          statusTone: allowSearch ? 'ok' : 'warn',
        })}
      `,
    });

    return `
      <form id="settings-module-form" data-settings-module="visibility" class="lp-stack lp-gap-section">
        ${renderFormSection({
          title: 'Search and crawlers',
          description: 'Changes update crawler rules immediately.',
          fieldsHtml: renderChoiceGroup({
            name: 'visibility-crawler-options',
            mode: 'multiple',
            variant: 'card',
            options: [
              {
                id: 'setting-vis-search',
                value: 'allowSearchIndexing',
                label: 'Allow search engines to index public pages',
                checked: allowSearch,
              },
              {
                id: 'setting-vis-ai-crawlers',
                value: 'blockAiCrawlers',
                label: 'Block AI training crawlers',
                checked: blockAi,
              },
              {
                id: 'setting-vis-federation',
                value: 'federationEnabled',
                label: 'Advertise federation manifest',
                checked: federation,
              },
            ],
          }),
        })}

        ${renderFormSection({
          title: 'Discovery feeds',
          fieldsHtml: feedsListHtml,
        })}

        <div class="lp-stack lp-gap-related">
          ${renderActionBar({
            pageLevel: true,
            primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
          })}
          <div id="settings-status-banner" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>
        </div>
      </form>
    `;
  },
};
