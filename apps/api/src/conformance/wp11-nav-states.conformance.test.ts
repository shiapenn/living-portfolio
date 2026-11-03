import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { createApp } from '../app.js';
import { mountBundledWeb } from '../adapter/bundled-web.js';
import { createWebApp, renderNotFoundPage, renderBuildVenturePage, renderHomePage, renderWorkOrWritingPage, renderEntryDetailPage } from '@living-portfolio/web';

describe('WP-11.2 Conformance: Navigation Redesign & System States (20261020-UX-13, 20261020-UX-14, 20261020-CP-05)', () => {
  function createTestWeb(repo: InMemoryPortfolioRepository) {
    const { app: webApp } = createWebApp({ client: repo as any });
    return webApp;
  }

  it('[UX-13] primary navigation has exactly 5 links in Spec order without admin link, and secondary links are in footer', async () => {
    const repo = new InMemoryPortfolioRepository();
    const app = createTestWeb(repo);

    const res = await app.request('/work');
    expect(res.status).toBe(200);
    const html = await res.text();

    // 1. Verify Primary Navigation nav bar
    expect(html).toContain('aria-label="Primary navigation"');
    // Primary links in Spec order: Work, Writing, Build, Timeline, Ask
    const navRegex = /<nav class="site-nav"[^>]*>[\s\S]*?<div class="nav-links">([\s\S]*?)<\/div>/;
    const match = html.match(navRegex);
    expect(match).toBeTruthy();
    const navContent = match![1];

    expect(navContent).toContain('href="/work"');
    expect(navContent).toContain('href="/writing"');
    expect(navContent).toContain('href="/build"');
    expect(navContent).toContain('href="/timeline"');
    expect(navContent).toContain('href="/ask"');
    expect(navContent).toContain('id="theme-toggle"');

    // Admin link must NOT appear in primary navigation for anonymous visitors
    expect(navContent).not.toContain('href="/admin"');

    // Exactly 5 <a> links in nav-links
    const anchorMatches = navContent.match(/<a [^>]+>/g) || [];
    expect(anchorMatches.length).toBe(5);

    // 2. Secondary links are in the footer
    expect(html).toContain('aria-label="Secondary navigation"');
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/now"');
    expect(html).toContain('href="/uses"');
    expect(html).toContain('href="/book"');
    expect(html).toContain('href="/rss.xml"');
  });

  it('[UX-13] sets aria-current="page" on the active section and brand link', async () => {
    const repo = new InMemoryPortfolioRepository();
    const app = createTestWeb(repo);

    // Root / sets aria-current="page" on brand link
    const homeRes = await app.request('/');
    expect(homeRes.status).toBe(200);
    const homeHtml = await homeRes.text();
    expect(homeHtml).toContain('class="site-brand" aria-current="page"');

    // /work sets aria-current="page" on Work link
    const workRes = await app.request('/work');
    const workHtml = await workRes.text();
    expect(workHtml).toContain('<a href="/work" aria-current="page">Work</a>');

    // /writing sets aria-current="page" on Writing link
    const writingRes = await app.request('/writing');
    const writingHtml = await writingRes.text();
    expect(writingHtml).toContain('<a href="/writing" aria-current="page">Writing</a>');

    // /build sets aria-current="page" on Build link
    const buildRes = await app.request('/build');
    const buildHtml = await buildRes.text();
    expect(buildHtml).toContain('<a href="/build" aria-current="page">Build</a>');

    // /timeline sets aria-current="page" on Timeline link
    const timelineRes = await app.request('/timeline');
    const timelineHtml = await timelineRes.text();
    expect(timelineHtml).toContain('<a href="/timeline" aria-current="page">Timeline</a>');

    // /ask sets aria-current="page" on Ask link
    const askRes = await app.request('/ask');
    const askHtml = await askRes.text();
    expect(askHtml).toContain('<a href="/ask" aria-current="page">Ask</a>');
  });

  it('[UX-13] /build/:slug resolves venture overview and attached dev-logs without 404', async () => {
    const repo = new InMemoryPortfolioRepository();
    const venture = await repo.createVenture({
      id: 'vnt-conformance-1',
      slug: 'strata-core',
      name: 'Strata Core Engine',
      description: 'Distributed knowledge engine with temporal revisions',
      status: 'active',
      facets: [{ facet: 'ecosystem', value: 'TypeScript' }],
    });

    await repo.createEntry(
      {
        slug: 'strata-core-v1',
        title: 'Strata Core v1 Release',
        profile: 'project',
        visibility: 'public',
        venture_id: venture.id,
      },
      {
        body: 'Launch details for Strata Core',
        summary: 'Summary of strata core',
      }
    );

    const app = createTestWeb(repo);

    // 1. Existing venture slug -> 200 with venture details and dev-logs
    const res = await app.request('/build/strata-core');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Strata Core Engine');
    expect(html).toContain('Status: <strong>active</strong>');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Attached Dev-Logs &amp; Decisions (1)');
    expect(html).toContain('strata-core-v1');
    expect(html).toContain('<a href="/build" aria-current="page">Build</a>');

    // 2. Attached dev-log entry slug on /build/:slug -> 200 with Build section highlighted
    const entryRes = await app.request('/build/strata-core-v1');
    expect(entryRes.status).toBe(200);
    const entryHtml = await entryRes.text();
    expect(entryHtml).toContain('Strata Core v1 Release');
    expect(entryHtml).toContain('<a href="/build" aria-current="page">Build</a>');

    // 3. Unknown slug -> 404 Not Found page
    const missingRes = await app.request('/build/non-existent-venture-slug');
    expect(missingRes.status).toBe(404);
    const missingHtml = await missingRes.text();
    expect(missingHtml).toContain('Venture or build project &quot;non-existent-venture-slug&quot; not found');
  });

  it('[UX-13] deduplicates /writing & /work with 301 redirect for structured profiles', async () => {
    const repo = new InMemoryPortfolioRepository();
    // 1. Structured entry (project profile)
    await repo.createEntry(
      {
        slug: 'infra-distributed-db',
        title: 'Distributed DB Implementation',
        profile: 'project',
        visibility: 'public',
      },
      {
        body: 'Body of structured project',
        summary: 'Summary of project',
      }
    );

    // 2. Freeform entry (essay / article)
    await repo.createEntry(
      {
        slug: 'reflections-on-engineering',
        title: 'Reflections on Engineering',
        profile: 'freeform',
        visibility: 'public',
      },
      {
        body: 'Body of freeform article',
        summary: 'Summary of essay',
      }
    );

    const app = createTestWeb(repo);

    // Accessing structured project via /writing/:slug should redirect 301 to /work/:slug
    const redirectRes = await app.request('/writing/infra-distributed-db');
    expect(redirectRes.status).toBe(301);
    expect(redirectRes.headers.get('Location')).toBe('/work/infra-distributed-db');

    // Query parameters like as_of must be preserved across redirect
    const asOfRes = await app.request('/writing/infra-distributed-db?as_of=2026-07-01');
    expect(asOfRes.status).toBe(301);
    expect(asOfRes.headers.get('Location')).toBe('/work/infra-distributed-db?as_of=2026-07-01');

    // Accessing freeform article via /writing/:slug should return 200 directly
    const freeformRes = await app.request('/writing/reflections-on-engineering');
    expect(freeformRes.status).toBe(200);
    const freeformHtml = await freeformRes.text();
    expect(freeformHtml).toContain('Reflections on Engineering');
    expect(freeformHtml).toContain('<a href="/writing" aria-current="page">Writing</a>');
  });

  it('[UX-13] supports all four outcome filters on /work and highlights the active chip', async () => {
    const repo = new InMemoryPortfolioRepository();
    await repo.createEntry(
      {
        slug: 'worked-entry',
        title: 'Successful Venture',
        profile: 'project',
        outcome: 'worked',
        visibility: 'public',
      },
      {
        body: 'Worked out well',
      }
    );
    await repo.createEntry(
      {
        slug: 'partly-entry',
        title: 'Partial Win',
        profile: 'project',
        outcome: 'partly',
        visibility: 'public',
      },
      {
        body: 'Partly worked',
      }
    );
    await repo.createEntry(
      {
        slug: 'failed-entry',
        title: 'Failed Experiment',
        profile: 'project',
        outcome: 'failed',
        visibility: 'public',
      },
      {
        body: 'Failed postmortem',
      }
    );
    await repo.createEntry(
      {
        slug: 'unresolved-entry',
        title: 'Ongoing Initiative',
        profile: 'project',
        outcome: 'unresolved',
        visibility: 'public',
      },
      {
        body: 'Still running',
      }
    );

    const app = createTestWeb(repo);

    const outcomes = ['worked', 'partly', 'failed', 'unresolved'] as const;
    for (const outcome of outcomes) {
      const res = await app.request(`/work?outcome=${outcome}`);
      expect(res.status).toBe(200);
      const html = await res.text();
      // Ensure the active filter has the active class
      expect(html).toContain(`href="/work?outcome=${outcome}" class="chip active"`);
    }
  });

  it('[UX-14 & CP-05] renders complete system states (empty states and 404 not found page) with actionable CTAs', async () => {
    const repo = new InMemoryPortfolioRepository();
    const app = createTestWeb(repo);

    // 1. Empty Home state
    const homeRes = await app.request('/');
    expect(homeRes.status).toBe(200);
    const homeHtml = await homeRes.text();
    expect(homeHtml).toContain('class="empty-state"');
    expect(homeHtml).toContain('No entries published yet');
    expect(homeHtml).toContain('Ask about my work');

    // 2. Empty Build state
    const buildRes = await app.request('/build');
    expect(buildRes.status).toBe(200);
    const buildHtml = await buildRes.text();
    expect(buildHtml).toContain('class="empty-state"');
    expect(buildHtml).toContain('No ventures or products listed yet');
    expect(buildHtml).toContain('Explore Technical Work');

    // 3. Empty filtered Work state with "Reset all filters" CTA
    const workRes = await app.request('/work?outcome=failed');
    expect(workRes.status).toBe(200);
    const workHtml = await workRes.text();
    expect(workHtml).toContain('class="empty-state"');
    expect(workHtml).toContain('No entries match the selected filters');
    expect(workHtml).toContain('Reset all filters');
    expect(workHtml).toContain('href="/work"');

    // 4. Custom 404 page for unknown routes
    const notFoundRes = await app.request('/this-route-does-not-exist');
    expect(notFoundRes.status).toBe(404);
    const notFoundHtml = await notFoundRes.text();
    expect(notFoundHtml).toContain('404');
    expect(notFoundHtml).toContain('Page Not Found');
    expect(notFoundHtml).toContain('Explore Work');
    expect(notFoundHtml).toContain('Browse Writing');
    expect(notFoundHtml).toContain('View Timeline');
    expect(notFoundHtml).toContain('Ask Questions');
    expect(notFoundHtml).toContain('name="q"');
  });

  it('[UX-14 & CP-05] renders outcome-oriented CTAs across entry detail and home', async () => {
    const repo = new InMemoryPortfolioRepository();
    await repo.createEntry(
      {
        slug: 'project-titan',
        title: 'Project Titan Architecture',
        profile: 'project',
        visibility: 'public',
      },
      {
        body: 'Detailed system architecture document',
      }
    );

    const app = createTestWeb(repo);

    // 1. Home page renders "Ask about my work"
    const homeRes = await app.request('/');
    const homeHtml = await homeRes.text();
    expect(homeHtml).toContain('Ask about my work');

    // 2. Entry detail renders "Ask about this project"
    const entryRes = await app.request('/work/project-titan');
    expect(entryRes.status).toBe(200);
    const entryHtml = await entryRes.text();
    expect(entryHtml).toContain('Ask about this project');
  });
});
