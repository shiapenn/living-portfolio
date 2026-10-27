import { serve } from '@hono/node-server';
import { loadConfig } from '@living-portfolio/config';
import { seedDemoPortfolio } from '@living-portfolio/db';
import {
  renderAdminImportPage,
  renderAdminWorkspacePage,
  renderAskPage,
  renderBuildPage,
  renderEntryDetailPage,
  renderHomePage,
  renderStaticPage,
  renderTimelinePage,
  renderWorkOrWritingPage,
} from '@living-portfolio/web';
import { createApp } from './app.js';

const config = loadConfig();
const port = config.PORT;
const { app, repo, auth } = createApp();

if (config.SEED_DEMO) {
  await seedDemoPortfolio(repo);
}

// Mount Strata Public Site & 3-Pane Admin Workspace UI routes
app.get('/home', async (c) => c.html(await renderHomePage(repo)));
app.get('/work', async (c) => c.html(await renderWorkOrWritingPage(repo, 'work', c.req.query('outcome'))));
app.get('/work/:slug', async (c) => {
  const res = await renderEntryDetailPage(repo, c.req.param('slug'), c.req.query('view'));
  return c.html(res.html, res.status as any);
});
app.get('/writing', async (c) => c.html(await renderWorkOrWritingPage(repo, 'writing')));
app.get('/writing/:slug', async (c) => {
  const res = await renderEntryDetailPage(repo, c.req.param('slug'), 'article');
  return c.html(res.html, res.status as any);
});
app.get('/build', async (c) => c.html(await renderBuildPage(repo)));
app.get('/timeline', async (c) => c.html(await renderTimelinePage(repo, c.req.query('as_of'))));
app.get('/ask', async (c) => c.html(await renderAskPage(c.req.query('q'), c.req.query('scope'))));
app.get('/now', (c) => c.html(renderStaticPage('now')));
app.get('/about', (c) => c.html(renderStaticPage('about')));
app.get('/uses', (c) => c.html(renderStaticPage('uses')));
app.get('/book', (c) => c.html(renderStaticPage('book', c.req.query('q'))));
app.get('/admin', auth.requireAdminMiddleware(), async (c) => c.html(await renderAdminWorkspacePage(repo)));
app.get('/admin/import', auth.requireAdminMiddleware(), async (c) => c.html(await renderAdminImportPage(repo)));

console.log(`Starting The Living Portfolio Server (Web + Admin + API) on port ${port}...`);

serve(
  {
    fetch: async (req: Request, env: unknown) => {
      const url = new URL(req.url);
      if (url.pathname === '/' && (req.headers.get('accept') || '').includes('text/html')) {
        const html = await renderHomePage(repo);
        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return app.fetch(req, env as any);
    },
    port,
  },
  (info) => {
    console.log(`✓ Living Portfolio listening on http://localhost:${info.port}`);
  }
);
