import type { Hono } from 'hono';
import type { RuntimeSettingsState } from './settings.js';

/**
 * Modular WP-17 settings routes (keeps apps/api/src/routes/settings.ts within its shrinking-only line cap).
 */
export function registerWp17SettingsRoutes(router: Hono, state: RuntimeSettingsState): void {
  // Visibility & crawler policy (WP-17.3, UX-42)
  router.patch('/visibility', async (c) => {
    const body = await c.req.json();
    if (typeof body.allowSearchIndexing === 'boolean') state.allowSearchIndexing = body.allowSearchIndexing;
    if (typeof body.blockAiCrawlers === 'boolean') state.blockAiCrawlers = body.blockAiCrawlers;
    if (typeof body.federationEnabled === 'boolean') state.federationEnabled = body.federationEnabled;
    return c.json({
      updated: true,
      visibility: {
        allowSearchIndexing: state.allowSearchIndexing ?? true,
        blockAiCrawlers: state.blockAiCrawlers ?? false,
        federationEnabled: state.federationEnabled ?? false,
        rssEnabled: true,
        sitemapEnabled: true,
      },
    });
  });
}
