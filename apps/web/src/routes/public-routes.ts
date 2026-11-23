import type { Hono } from 'hono';
import {
  renderHomePage,
  renderWorkOrWritingPage,
  renderEntryDetailPage,
  renderBuildPage,
  renderBuildVenturePage,
  renderTimelinePage,
  renderAskPage,
  renderStaticPage,
  renderNotFoundPage,
  renderBookPage,
  renderAskStatusPage,
  type WebDataClient,
} from '../renderer.js';

export interface PublicRoutesDeps {
  client: WebDataClient;
  siteName: string;
  primarySiteOrigin: string;
}

export function registerPublicRoutes(app: Hono, { client, siteName, primarySiteOrigin }: PublicRoutesDeps): void {
  // Public visitor booking & escalation status routes
  app.get('/book', (c) => c.html(renderBookPage(c.req.query('q'), c.req.query('facets'))));
  app.get('/ask/status/:token', async (c) => c.html(await renderAskStatusPage(client, c.req.param('token'))));

  // Public Site & Content Routes
  app.get('/home', async (c) => c.html(await renderHomePage(client)));
  app.get('/work', async (c) =>
    c.html(await renderWorkOrWritingPage(client, 'work', c.req.query('outcome'), c.req.query('as_of')))
  );
  app.get('/work/:slug', async (c) => {
    const res = await renderEntryDetailPage(
      client,
      c.req.param('slug'),
      c.req.query('view'),
      c.req.query('as_of'),
      '/work',
      c.req.query('lang')
    );
    return c.html(res.html, res.status as any);
  });
  app.get('/writing', async (c) =>
    c.html(await renderWorkOrWritingPage(client, 'writing', undefined, c.req.query('as_of')))
  );
  app.get('/writing/:slug', async (c) => {
    const slug = c.req.param('slug');
    const res = await renderEntryDetailPage(client, slug, 'article', c.req.query('as_of'), '/writing');
    if (res.status === 200 && res.entry && res.entry.profile && res.entry.profile !== 'freeform') {
      const asOf = c.req.query('as_of');
      const target = `/work/${slug}${asOf ? `?as_of=${encodeURIComponent(asOf)}` : ''}`;
      return c.redirect(target, 301);
    }
    return c.html(res.html, res.status as any);
  });
  app.get('/build', async (c) => c.html(await renderBuildPage(client)));
  app.get('/build/:slug', async (c) => {
    const res = await renderBuildVenturePage(client, c.req.param('slug'));
    return c.html(res.html, res.status as any);
  });
  app.get('/timeline', async (c) => c.html(await renderTimelinePage(client, c.req.query('as_of'))));
  app.get('/ask', async (c) =>
    c.html(await renderAskPage(client, c.req.query('q'), c.req.query('scope') || c.req.query('entry'), c.req.query('as_of')))
  );
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
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${siteName}</title>\n    <link>${primarySiteOrigin}</link>\n    <description>Time-aware personal portfolio and engineering log</description>\n${items}\n  </channel>\n</rss>`;
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
      return next ? next() : c.json({ name: `${siteName} Web`, status: 'online' });
    }
    return c.html(await renderHomePage(client));
  });

  // 404 Not Found handler
  app.notFound((c) => c.html(renderNotFoundPage('Page not found', c.req.path), 404));
}
