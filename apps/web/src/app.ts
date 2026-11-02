import { Hono } from 'hono';
import { loadConfig } from '@living-portfolio/config';
import {
  createLivingPortfolioClient,
  type LivingPortfolioClient,
} from '@living-portfolio/client';
import {
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSettingsPage,
  renderAdminSetupPage,
  renderAdminWorkspacePage,
  renderAskPage,
  renderAskStatusPage,
  renderBookPage,
  renderBuildPage,
  renderEntryDetailPage,
  renderHomePage,
  renderStaticPage,
  renderTimelinePage,
  renderWorkOrWritingPage,
  adaptDataSource,
  type WebDataClient,
} from './renderer.js';

export interface WebAppOptions {
  client?: LivingPortfolioClient | WebDataClient;
  apiBaseUrl?: string;
}

/**
 * Creates the Strata Public Site and Admin Web Application (apps/web).
 * Decoupled from database / repository layer, communicating strictly via @living-portfolio/client.
 */
export function createWebApp(options?: WebAppOptions) {
  const app = new Hono();
  const cfg = loadConfig();
  const primarySiteOrigin = cfg.SITE_ORIGIN.split(',')[0].trim();

  const defaultPort = process.env.API_PORT || '3000';
  const defaultHost = process.env.API_HOST || 'localhost';
  const fallbackBaseUrl = `http://${defaultHost}:${defaultPort}/api/v1`;

  const client: WebDataClient = adaptDataSource(
    options?.client ??
    createLivingPortfolioClient({
      baseUrl: options?.apiBaseUrl ?? process.env.PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
    })
  );

  // Liveness / health endpoint for load balancers & container health checks
  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'web' }));

  // Admin UI routes
  app.get('/admin/setup', (c) => c.html(renderAdminSetupPage()));
  app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));
  app.get('/admin', async (c) => c.html(await renderAdminWorkspacePage(client)));
  app.get('/admin/import', async (c) => c.html(await renderAdminImportPage(client)));
  app.get('/admin/settings', async (c) => c.html(await renderAdminSettingsPage(client)));

  // Public visitor booking & escalation status routes
  app.get('/book', (c) => c.html(renderBookPage(c.req.query('q'), c.req.query('facets'))));
  app.get('/ask/status/:token', async (c) => c.html(await renderAskStatusPage(client, c.req.param('token'))));

  // Strata Public Site & Content Routes
  app.get('/home', async (c) => c.html(await renderHomePage(client)));
  app.get('/work', async (c) =>
    c.html(await renderWorkOrWritingPage(client, 'work', c.req.query('outcome'), c.req.query('as_of')))
  );
  app.get('/work/:slug', async (c) => {
    const res = await renderEntryDetailPage(client, c.req.param('slug'), c.req.query('view'), c.req.query('as_of'));
    return c.html(res.html, res.status as any);
  });
  app.get('/writing', async (c) =>
    c.html(await renderWorkOrWritingPage(client, 'writing', undefined, c.req.query('as_of')))
  );
  app.get('/writing/:slug', async (c) => {
    const res = await renderEntryDetailPage(client, c.req.param('slug'), 'article', c.req.query('as_of'));
    return c.html(res.html, res.status as any);
  });
  app.get('/build', async (c) => c.html(await renderBuildPage(client)));
  app.get('/timeline', async (c) => c.html(await renderTimelinePage(client, c.req.query('as_of'))));
  app.get('/ask', async (c) => c.html(await renderAskPage(c.req.query('q'), c.req.query('scope'), c.req.query('as_of'))));
  app.get('/now', (c) => c.html(renderStaticPage('now')));
  app.get('/about', (c) => c.html(renderStaticPage('about')));
  app.get('/uses', (c) => c.html(renderStaticPage('uses')));

  // RSS Feed (§5.1)
  app.get('/rss.xml', async (c) => {
    const res = await (client.entries?.list({ visibility: 'public' }) || client.listEntries({ visibility: ['public'] }).then((entries) => ({ entries })));
    const entries = res.entries || [];
    const items = entries
      .map(
        (e: any) =>
          `    <item>\n      <title>${e.title}</title>\n      <link>${primarySiteOrigin}/writing/${e.slug}</link>\n      <pubDate>${new Date(e.created_at).toUTCString()}</pubDate>\n    </item>`
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${cfg.PUBLIC_SITE_NAME}</title>\n    <link>${primarySiteOrigin}</link>\n    <description>Time-aware personal portfolio and engineering log</description>\n${items}\n  </channel>\n</rss>`;
    return c.text(xml, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
  });

  // Sitemap XML (§5.1)
  app.get('/sitemap.xml', async (c) => {
    const res = await (client.entries?.list({ visibility: 'public' }) || client.listEntries({ visibility: ['public'] }).then((entries) => ({ entries })));
    const entries = res.entries || [];
    const urls = entries
      .map((e: any) => `  <url><loc>${primarySiteOrigin}/work/${e.slug}</loc></url>`)
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${primarySiteOrigin}/</loc></url>\n  <url><loc>${primarySiteOrigin}/work</loc></url>\n  <url><loc>${primarySiteOrigin}/writing</loc></url>\n  <url><loc>${primarySiteOrigin}/build</loc></url>\n  <url><loc>${primarySiteOrigin}/timeline</loc></url>\n  <url><loc>${primarySiteOrigin}/ask</loc></url>\n${urls}\n</urlset>`;
    return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
  });

  // Root welcome with content negotiation support
  app.get('/', async (c, next) => {
    const accept = c.req.header('accept') || '';
    if (accept.includes('application/json')) {
      return next ? next() : c.json({ name: `${cfg.PUBLIC_SITE_NAME} Web`, status: 'online' });
    }
    return c.html(await renderHomePage(client));
  });

  return { app, client };
}
