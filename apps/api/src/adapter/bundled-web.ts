import type { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  createWebApp,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSettingsPage,
  renderAdminSetupPage,
  renderAdminWorkspacePage,
} from '@living-portfolio/web';
import type { AuthManager } from '../auth/security.js';

/**
 * Optional single-process convenience adapter (Spec §4.3, OSR-13).
 * Mounts the web renderer and admin UI onto the API Hono application when explicitly requested.
 * Never mounted by default in createApp().
 */
export function mountBundledWeb(
  app: Hono,
  repo: IPortfolioRepository,
  runtimeState?: any,
  auth?: AuthManager
) {
  // Admin UI routes with authentication
  if (auth) {
    app.get('/admin/setup', (c) => {
      if (auth.isSetupCompleted()) {
        return c.redirect('/admin/login', 302);
      }
      return c.html(renderAdminSetupPage());
    });
    app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));
    app.get('/admin', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminWorkspacePage(repo, runtimeState))
    );
    app.get('/admin/import', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminImportPage(repo))
    );
    app.get('/admin/settings', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminSettingsPage(repo, runtimeState))
    );
  }

  // Mount the public web application routes
  const { app: webApp } = createWebApp({ client: repo as any });
  app.route('/', webApp);
}
