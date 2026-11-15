import type { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  createWebApp,
  renderAdminEntriesPage,
  renderDedicatedEditorPage,
  renderAdminEntriesListPage,
  renderAdminDashboardPage,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSectionPage,
  renderAdminSettingsPage,
  renderAdminSetupPage,
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
        await renderAdminEntriesPage(repo, {
          selectedId: c.req.query('entry') || undefined,
          isNew: c.req.query('new') === '1',
          legacyRecoveryUsed: Boolean(session?.legacyRecoveryUsed),
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      );
    });
    app.get('/admin/today', auth.requireAdminMiddleware(), async (c) => {
      const inboxItems = typeof (repo as any).listInboxItems === 'function' ? await (repo as any).listInboxItems() : [];
      const pendingInboxCount = Array.isArray(inboxItems) ? inboxItems.filter((i: any) => i.status === 'pending').length : 0;
      return c.html(
        await renderAdminDashboardPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          checklistDismissed: Boolean(runtimeState?.dashboardChecklistDismissed),
          pendingInboxCount,
        })
      );
    });
    app.get('/admin/entries', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminEntriesListPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/entries/new', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderDedicatedEditorPage(repo, {
        isNew: true,
        answeringEnabled: runtimeState?.automatedAnsweringEnabled,
      });
      return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
    });
    app.get('/admin/entries/:id', auth.requireAdminMiddleware(), async (c, next) => {
      const id = c.req.param('id');
      if (id === 'editor') {
        if (process.env.NODE_ENV === 'production') {
          return c.notFound();
        }
        return next();
      }
      const html = await renderDedicatedEditorPage(repo, {
        selectedId: id,
        answeringEnabled: runtimeState?.automatedAnsweringEnabled,
      });
      return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
    });
    app.get('/admin/import', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminImportPage(repo))
    );
    app.get('/admin/settings', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminSettingsPage(repo, runtimeState))
    );
    const adminSectionRoutes = [
      '/admin/entries/:id/history',
      '/admin/quick-log',
      '/quick-log',
      '/admin/pages',
      '/admin/inbox',
      '/admin/inbox/:id',
      '/admin/bookings',
      '/admin/audit',
      '/admin/calibration',
      '/admin/structure',
      '/admin/routing',
      '/admin/theme',
      '/admin/settings/:section',
    ];
    for (const routePath of adminSectionRoutes) {
      app.get(routePath, auth.requireAdminMiddleware(), async (c) =>
        c.html(renderAdminSectionPage(c.req.path))
      );
    }
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
