import { z } from '@living-portfolio/core';
import { renderActionBar, renderChoiceGroup, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
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
  summary: 'Search indexing, robots.txt crawler policy, feeds, and federation.',
  icon: 'external-link',
  order: 6,
  route: '/admin/settings/visibility',
  version: 1,
  explain: {
    what: 'Controls how search engines, AI crawlers, RSS readers, and sitemaps discover your public pages.',
    when: 'Review when taking your site public or changing whether automated crawlers may index your work.',
    how: 'Choose indexing and crawler preferences below. Admin, API, and private escalation routes are always disallowed.',
    impact: 'Updates /robots.txt immediately; search engines pick up changes on their next crawl.',
  },
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
    const explain = visibilityModule.explain!;

    const feedsListHtml = renderList({
      id: 'visibility-feeds-list',
      variant: 'plain',
      itemsHtml: `
        ${renderItem({
          id: 'vis-rss-item',
          title: 'RSS feed',
          subtitle: 'Published entries at /rss.xml',
          statusLabel: 'Active',
          statusTone: 'ok',
        })}
        ${renderItem({
          id: 'vis-sitemap-item',
          title: 'Sitemap',
          subtitle: 'Public index at /sitemap.xml',
          statusLabel: 'Active',
          statusTone: 'ok',
        })}
        ${renderItem({
          id: 'vis-robots-item',
          title: 'Robots policy',
          subtitle: 'Always disallows /admin, /api, and /ask/status at /robots.txt',
          statusLabel: allowSearch ? 'Active' : 'Paused',
          statusTone: allowSearch ? 'ok' : 'warn',
        })}
      `,
    });

    return `
      <form id="settings-module-form" data-settings-module="visibility" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'visibility-explain-section',
          title: 'How discovery works',
          fieldsHtml: `
            ${renderText({ variant: 'description', text: `What it does: ${explain.what}` })}
            ${renderText({ variant: 'description', text: `Impact: ${explain.impact}` })}
          `,
        })}

        ${renderFormSection({
          title: 'Search and crawler policy',
          description: 'Generated automatically at /robots.txt. Private and admin paths are always blocked.',
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
                label: 'Block AI training crawlers in robots.txt',
                checked: blockAi,
              },
              {
                id: 'setting-vis-federation',
                value: 'federationEnabled',
                label: 'Advertise optional federation manifest',
                checked: federation,
              },
            ],
          }),
        })}

        ${renderFormSection({
          title: 'Discovery endpoints',
          fieldsHtml: feedsListHtml,
        })}

        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
        })}
      </form>
    `;
  },
};
