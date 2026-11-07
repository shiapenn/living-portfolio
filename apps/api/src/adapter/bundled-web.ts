import type { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  createWebApp,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSettingsPage,
  renderAdminSetupPage,
  renderAdminWorkspacePage,
  renderNotFoundPage,
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
      if (runtimeState?.setupWizardCompleted || (auth.isSetupCompleted() && !auth.isAdminAuthenticated(c).authenticated)) {
        return c.redirect('/admin/login', 302);
      }
      return c.html(renderAdminSetupPage());
    });
    app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));
    app.get('/admin', auth.requireAdminMiddleware(), async (c) => {
      const cookieHeader = c.req.header('cookie') || '';
      const sessionMatch = cookieHeader.match(/(?:^|;\s*)lp_session=([a-f0-9]+)/);
      const session = sessionMatch ? (auth as any).sessions?.get(sessionMatch[1]) : null;
      return c.html(
        await renderAdminWorkspacePage(repo, {
          settingsState: runtimeState,
          legacyRecoveryUsed: Boolean(session?.legacyRecoveryUsed),
        })
      );
    });
    app.get('/admin/import', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminImportPage(repo))
    );
    app.get('/admin/settings', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminSettingsPage(repo, runtimeState))
    );
  }

  const checkSession = auth
    ? async (cookieHeader?: string) => {
        const dummyContext = {
          req: {
            method: 'GET',
            header: (name: string) => (name.toLowerCase() === 'cookie' ? cookieHeader || '' : undefined),
          },
        } as any;
        const check = auth.isAdminAuthenticated(dummyContext);
        return {
          authenticated: check.authenticated,
          setupRequired: runtimeState?.setupWizardCompleted ? false : !auth.isSetupCompleted(),
        };
      }
    : undefined;

  // Mount the public web application routes
  const { app: webApp } = createWebApp({ client: repo as any, checkSession });
  app.route('/', webApp);

  app.notFound((c) => {
    const path = c.req.path;
    if (path.startsWith('/api/')) {
      return c.json({ error: 'Not Found', path }, 404);
    }
    return c.html(renderNotFoundPage('Page not found', path), 404);
  });
}
