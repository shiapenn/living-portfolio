import type { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { DEFAULT_ACCENT_CSS_FILENAME, resolveAdminThemeCssAsset } from '@living-portfolio/ui-core';
import {
  createWebApp,
  renderAdminEntriesPage,
  renderDedicatedEditorPage,
  renderEntryHistoryPage,
  renderAdminInboxPage,
  renderAdminAuditRulesPage,
  renderAdminCalibrationPage,
  renderAdminStructurePage,
  renderAdminBookingsPage,
  renderAdminBookingDetailPage,
  renderAdminVenturesPage,
  renderAdminPagesEditorPage,
  renderAdminEntriesListPage,
  renderAdminDashboardPage,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSectionPage,
  renderAdminSettingsPage,
  renderAdminSettingsModulePage,
  renderAdminSetupPage,
  renderAdminStatusPage,
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
  // C4: Apply saved admin Appearance v2 theme.<hash>.css across ALL /admin/* HTML routes
  app.use('/admin/*', async (c, next) => {
    await next();
    const ct = c.res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return;
    const activeFile = resolveAdminThemeCssAsset(runtimeState?.appearanceV2?.admin).filename;
    if (activeFile === DEFAULT_ACCENT_CSS_FILENAME) return;
    const html = await c.res.text();
    const updated = html.replace(`/assets/css/${DEFAULT_ACCENT_CSS_FILENAME}`, `/assets/css/${activeFile}`);
    const headers = new Headers(c.res.headers);
    headers.delete('content-length');
    c.res = new Response(updated, { status: c.res.status, headers });
  });

  // Admin UI routes with authentication
  if (auth) {
    app.get('/admin/setup', (c) => {
      if (runtimeState?.setupWizardCompleted || (auth.isSetupCompleted() && !auth.isAdminAuthenticated(c).authenticated)) {
        return c.redirect('/admin/login', 302);
      }
      return c.html(renderAdminSetupPage());
    });
    app.get('/admin/login', (c) => c.html(renderAdminLoginPage()));
    const renderTodayHandler = async (c: any) => {
      const cookieHeader = c.req.header('cookie') || '';
      const sessionMatch = cookieHeader.match(/(?:^|;\s*)lp_session=([a-f0-9]+)/);
      const session = sessionMatch ? (auth as any).sessions?.get(sessionMatch[1]) : null;
      const inboxItems = typeof (repo as any).listInboxItems === 'function' ? await (repo as any).listInboxItems() : [];
      const pendingInboxCount = Array.isArray(inboxItems) ? inboxItems.filter((i: any) => i.status === 'pending').length : 0;
      return renderAdminDashboardPage(repo, {
        answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        checklistDismissed: Boolean(runtimeState?.dashboardChecklistDismissed),
        pendingInboxCount,
        legacyRecoveryUsed: Boolean(session?.legacyRecoveryUsed),
      });
    };
    app.get('/admin', auth.requireAdminMiddleware(), async (c) => c.html(await renderTodayHandler(c)));
    app.get('/admin/today', auth.requireAdminMiddleware(), async (c) => c.html(await renderTodayHandler(c)));
    app.get('/admin/entries', auth.requireAdminMiddleware(), async (c) => {
      const rawPage = Number(c.req.query('page') || 1);
      const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
      return c.html(
        await renderAdminEntriesListPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          page,
        })
      );
    });
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
    app.get('/admin/entries/:id/history', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderEntryHistoryPage(repo, c.req.param('id') ?? '', {
        answeringEnabled: runtimeState?.automatedAnsweringEnabled,
      });
      return html ? c.html(html) : c.html(renderNotFoundPage(), 404);
    });
    app.get('/admin/inbox', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminInboxPage(repo, {
          status: c.req.query('status'),
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/inbox/:id', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminInboxPage(repo, {
          selectedId: c.req.param('id'),
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/audit', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminAuditRulesPage(repo, {
          status: c.req.query('status'),
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/calibration', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminCalibrationPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          initialSettings: runtimeState,
        })
      )
    );
    app.get('/admin/structure', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminStructurePage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          initialSettings: runtimeState,
        })
      )
    );
    app.get('/admin/bookings', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminBookingsPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/bookings/:id', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderAdminBookingDetailPage(repo, c.req.param('id') || '', {
        answeringEnabled: runtimeState?.automatedAnsweringEnabled,
      });
      if (!html) return c.text('Booking not found', 404);
      return c.html(html);
    });
    app.get('/admin/ventures', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminVenturesPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
        })
      )
    );
    app.get('/admin/pages', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminPagesEditorPage(repo, {
          section: c.req.query('section'),
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          initialSettings: runtimeState,
        })
      )
    );
    app.get('/admin/import', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminImportPage(repo))
    );
    app.get('/admin/status', auth.requireAdminMiddleware(), async (c) =>
      c.html(
        await renderAdminStatusPage(repo, {
          answeringEnabled: runtimeState?.automatedAnsweringEnabled,
          initialSettings: runtimeState,
        })
      )
    );
    app.get('/admin/settings', auth.requireAdminMiddleware(), async (c) =>
      c.html(await renderAdminSettingsPage(repo, runtimeState))
    );
    app.get('/admin/routing', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderAdminSettingsModulePage(repo, 'answering', runtimeState);
      if (html) return c.html(html);
      return c.html(renderAdminSectionPage(c.req.path));
    });
    app.get('/admin/account', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderAdminSettingsModulePage(repo, 'account', runtimeState);
      if (html) return c.html(html);
      return c.html(renderAdminSectionPage(c.req.path));
    });
    app.get('/admin/theme', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderAdminSettingsModulePage(repo, 'appearance', runtimeState);
      if (html) return c.html(html);
      return c.html(renderAdminSectionPage(c.req.path));
    });
    app.get('/admin/settings/:id', auth.requireAdminMiddleware(), async (c) => {
      const html = await renderAdminSettingsModulePage(repo, c.req.param('id') || '', runtimeState);
      if (html) return c.html(html);
      return c.html(renderAdminSectionPage(c.req.path));
    });
    const adminSectionRoutes = [
      '/admin/quick-log',
      '/quick-log',
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
  const { app: webApp } = createWebApp({
    client: repo as any,
    checkSession,
    getSettings: () => (runtimeState as unknown as Record<string, unknown>) ?? {},
  });
  app.route('/', webApp);

  app.notFound((c) => {
    const path = c.req.path;
    if (path.startsWith('/api/')) {
      return c.json({ error: 'Not Found', path }, 404);
    }
    return c.html(renderNotFoundPage('Page not found', path), 404);
  });
}
