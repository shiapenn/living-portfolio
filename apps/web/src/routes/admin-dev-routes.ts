import type { Hono } from 'hono';
import type { WebDataClient } from '../renderer.js';
import { renderPrimitivesGalleryPage } from '../primitives/gallery.js';
import { renderFoundationsGalleryPage } from '../primitives/foundations-gallery.js';
import { renderReferenceEditorPage, type ReferenceEditorEntry } from '../pages/admin/entries/editor.js';
import { renderComponentGalleryPage } from '../pages/admin/gallery.js';
import { renderFixturePatternPage } from '../pages/admin/fixture.js';
import { renderCensusCanaryPage } from '../pages/admin/gallery-canary.js';

export interface AdminDevRoutesDeps {
  client: WebDataClient;
  siteName: string;
  checkSession: (cookieHeader?: string) => Promise<{ authenticated: boolean; setupRequired?: boolean }>;
}

export function registerAdminDevRoutes(app: Hono, { client, siteName, checkSession }: AdminDevRoutesDeps): void {
  if (process.env.NODE_ENV === 'production') return;

  app.get('/admin/dev/primitives', (c) => c.html(renderPrimitivesGalleryPage()));
  app.get('/admin/dev/foundations', (c) => {
    const theme = c.req.query('theme') === 'dark' ? 'dark' : 'light';
    return c.html(renderFoundationsGalleryPage(theme));
  });
  app.get('/admin/_gallery', (c) => {
    const theme = c.req.query('theme') === 'dark' ? 'dark' : 'light';
    const outline = c.req.query('outline') === '1';
    return c.html(renderComponentGalleryPage({ theme, outline }));
  });
  app.get('/admin/_fixture', (c) => c.html(renderFixturePatternPage()));
  app.get('/admin/_canary', (c) => {
    const theme = c.req.query('theme') === 'dark' ? 'dark' : 'light';
    const suite = c.req.query('suite');
    return c.html(renderCensusCanaryPage({ theme, suite }));
  });

  const handleReferenceEditor = async (c: any, selectedId?: string) => {
    const session = await checkSession(c.req.header('cookie'));
    if (session.setupRequired) return c.redirect('/admin/setup');
    if (!session.authenticated) return c.redirect('/admin/login');
    const fixture = c.req.query('fixture');
    const themeParam = c.req.query('theme') === 'dark' ? 'dark' : c.req.query('theme') === 'light' ? 'light' : undefined;
    const baseDraft: ReferenceEditorEntry = {
      id: 'fixture-draft',
      slug: 'deterministic-sqlite-migrations',
      title: 'Deterministic SQLite migrations',
      body: 'We replaced ad-hoc schema patches with a linear migration journal verified in CI.',
      visibility: 'draft',
      date: '2026-11-14',
      temporalConfidence: 'exact',
      profile: 'case-study',
    };
    const secondDraft: ReferenceEditorEntry = {
      id: 'fixture-second',
      slug: 'zero-downtime-queue-consumer',
      title: 'Zero-downtime queue consumer',
      body: 'Draining in-flight leases cleanly before rotating worker processes.',
      visibility: 'draft',
      date: '2026-11-12',
      temporalConfidence: 'exact',
      profile: 'decision',
    };
    if (fixture === 'first-run' || fixture === 'empty') {
      return c.html(
        renderReferenceEditorPage({
          entries: [],
          siteName,
          showWalkthrough: fixture === 'first-run',
          initialTheme: themeParam,
        })
      );
    }
    if (fixture === 'new-draft') {
      return c.html(
        renderReferenceEditorPage({
          entries: [{ ...baseDraft, id: 'fixture-new', slug: 'new-entry', title: '', body: '' }],
          selectedId: 'fixture-new',
          siteName,
          initialTheme: themeParam,
        })
      );
    }
    if (fixture === 'draft') {
      return c.html(
        renderReferenceEditorPage({
          entries: [baseDraft],
          selectedId: baseDraft.id,
          siteName,
          statusMessage: 'Draft saved just now.',
          statusTone: 'info',
          initialTheme: themeParam,
        })
      );
    }
    if (fixture === 'error') {
      return c.html(
        renderReferenceEditorPage({
          entries: [{ ...baseDraft, title: '' }],
          selectedId: baseDraft.id,
          siteName,
          titleError: 'Add a title.',
          statusMessage: 'Enter a title to save this entry.',
          statusTone: 'danger',
          initialTheme: themeParam,
        })
      );
    }
    if (fixture === 'unlisted') {
      const unlistedEntry: ReferenceEditorEntry = {
        ...baseDraft,
        id: 'fixture-unlisted',
        slug: 'zero-downtime-queue-consumer',
        title: 'Zero-downtime queue consumer',
        body: 'Draining in-flight leases cleanly before rotating worker processes.',
        visibility: 'unlisted',
      };
      return c.html(
        renderReferenceEditorPage({
          entries: [unlistedEntry, secondDraft],
          selectedId: unlistedEntry.id,
          siteName,
          statusMessage: 'Entry is now unlisted.',
          statusTone: 'ok',
          initialTheme: themeParam,
        })
      );
    }
    if (fixture === 'public') {
      const publicEntry: ReferenceEditorEntry = {
        ...baseDraft,
        id: 'fixture-public',
        slug: 'designing-resilient-webhook-retries',
        title: 'Designing resilient webhook retries',
        body: 'Idempotency keys and dead-letter replay controls kept delivery above 99.98%.',
        visibility: 'public',
      };
      return c.html(
        renderReferenceEditorPage({
          entries: [publicEntry, { ...secondDraft, visibility: 'unlisted' }],
          selectedId: publicEntry.id,
          siteName,
          statusMessage: 'Entry is now public.',
          statusTone: 'ok',
          initialTheme: themeParam,
        })
      );
    }
    const listRes = await (client.entries?.list() || client.listEntries().then((entries) => ({ entries })));
    const rawEntries = (listRes as any)?.entries ?? [];
    const mapped: ReferenceEditorEntry[] = rawEntries.map((e: any) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      body: e.body ?? '',
      visibility: e.visibility === 'public' ? 'public' : e.visibility === 'unlisted' ? 'unlisted' : 'draft',
      date: e.created_at ?? new Date().toISOString().slice(0, 10),
      temporalConfidence: e.temporal_confidence ?? 'exact',
      profile: e.profile ?? 'freeform',
    }));
    return c.html(
      renderReferenceEditorPage({
        entries: mapped,
        selectedId: selectedId ?? mapped[0]?.id,
        siteName,
        showWalkthrough: mapped.length === 0,
        initialTheme: themeParam,
      })
    );
  };

  app.get('/admin/entries/editor', (c) => handleReferenceEditor(c));
}
