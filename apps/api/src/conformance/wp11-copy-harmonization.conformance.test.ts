import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { createWebApp } from '@living-portfolio/web';

describe('WP-11.5 Conformance: Copy Harmonization & Spec-Jargon Removal (20261020-CP-01, 20261020-CP-02, 20261020-CP-03)', () => {
  function createTestWeb(repo: InMemoryPortfolioRepository) {
    const { app: webApp } = createWebApp({ client: repo as any });
    return webApp;
  }

  it('[CP-01] Cross-route naming harmonization: headings, outcome chips, and action verbs', async () => {
    const repo = new InMemoryPortfolioRepository();

    // Populate sample entries with different outcomes and public visibility
    await repo.createEntry(
      {
        slug: 'case-worked',
        title: 'Project Alpha',
        type: 'case-study',
        profile: 'case-study',
        visibility: 'public',
        date: '2026-01-01',
        layer: 2,
        confidence: 'high',
        outcome: 'worked',
      },
      {
        summary: 'Successful project outcome',
        body: 'Project worked successfully.',
      }
    );

    await repo.createEntry(
      {
        slug: 'case-partly',
        title: 'Project Beta',
        type: 'case-study',
        profile: 'case-study',
        visibility: 'public',
        date: '2026-02-01',
        layer: 2,
        confidence: 'medium',
        outcome: 'partly',
      },
      {
        summary: 'Partly successful project',
        body: 'Some goals met, some missed.',
      }
    );

    await repo.createEntry(
      {
        slug: 'case-failed',
        title: 'Project Gamma',
        type: 'case-study',
        profile: 'case-study',
        visibility: 'public',
        date: '2026-03-01',
        layer: 2,
        confidence: 'low',
        outcome: 'failed',
      },
      {
        summary: 'Failed project experiment',
        body: 'Did not work as expected.',
      }
    );

    await repo.createEntry(
      {
        slug: 'case-unresolved',
        title: 'Project Delta',
        type: 'case-study',
        profile: 'case-study',
        visibility: 'public',
        date: '2026-04-01',
        layer: 2,
        confidence: 'medium',
        outcome: 'unresolved',
      },
      {
        summary: 'Ongoing project',
        body: 'Work still in flight.',
      }
    );

    const app = createTestWeb(repo);

    // 1. Headings match navigation
    const workRes = await app.request('/work');
    const workHtml = await workRes.text();
    expect(workHtml).toContain('>Work</h1>');

    const buildRes = await app.request('/build');
    const buildHtml = await buildRes.text();
    expect(buildHtml).toContain('>Build</h1>');

    const timelineRes = await app.request('/timeline');
    const timelineHtml = await timelineRes.text();
    expect(timelineHtml).toContain('>Timeline</h1>');
    expect(timelineHtml).toContain('entries as of');
    expect(timelineHtml).not.toContain('Time-Travel Knowledge Graph');
    expect(timelineHtml).not.toContain('Viewing as of');

    const askRes = await app.request('/ask');
    const askHtml = await askRes.text();
    expect(askHtml).toContain('>Ask about my work</h1>');

    const bookRes = await app.request('/book');
    const bookHtml = await bookRes.text();
    expect(bookHtml).toContain('>Book a conversation</h1>');
    expect(bookHtml).not.toContain('Book office hours');

    // 2. Standardized outcome chips
    expect(workHtml).toContain('>Worked</a>');
    expect(workHtml).toContain('>Partly worked</a>');
    expect(workHtml).toContain(">Didn't work</a>");
    expect(workHtml).toContain('>Unresolved</a>');
    // Ensure retired labels are absent
    expect(workHtml).not.toContain('Worked partly');
    expect(workHtml).not.toContain("What didn't work (Failed)");

    // 3. Entry action verbs: Ask button and entry-scoped ask rail
    const entryRes = await app.request('/work/case-worked');
    const entryHtml = await entryRes.text();
    expect(entryHtml).toContain('Ask about this entry');
    expect(entryHtml).toContain('<button type="submit" class="btn" style="width:100%">Ask</button>');
  });

  it('[CP-02] Removal of spec & schema jargon: no section numbers, data-role attributes, neutral structured chips', async () => {
    const repo = new InMemoryPortfolioRepository();

    const { entry, revision } = await repo.createEntry(
      {
        slug: 'structured-spec-test',
        title: 'Structured Testing',
        profile: 'case-study',
        view: 'structured',
        visibility: 'public',
      },
      {
        body_md: '## The goal\nAchieve high reliability.\n\n## The decision\nAdopt strict typing.\n\n## The outcome\nBugs reduced by 80%.',
        written_at: '2026-05-01T00:00:00Z',
        valid_from: '2026-05-01T00:00:00Z',
      }
    );

    const spans = await repo.saveSpans([
      { revision_id: revision.id, ordinal: 0, text: 'Achieve high reliability.' },
      { revision_id: revision.id, ordinal: 1, text: 'Adopt strict typing.' },
      { revision_id: revision.id, ordinal: 2, text: 'Bugs reduced by 80%.' },
    ]);

    await repo.saveFacet({
      entry_id: entry.id,
      revision_id: revision.id,
      key: 'scope',
      value: 'full-stack',
      source: 'owner',
      status: 'confirmed',
      confidence: 1.0,
    });

    await repo.saveAnnotation({
      span_id: spans[0]!.id,
      role: 'goal',
      profile: 'case-study',
      source: 'owner',
      status: 'accepted',
      confidence: 1.0,
    });
    await repo.saveAnnotation({
      span_id: spans[1]!.id,
      role: 'decision',
      profile: 'case-study',
      source: 'owner',
      status: 'accepted',
      confidence: 1.0,
    });
    await repo.saveAnnotation({
      span_id: spans[2]!.id,
      role: 'outcome',
      profile: 'case-study',
      source: 'owner',
      status: 'accepted',
      confidence: 1.0,
    });

    const app = createTestWeb(repo);

    // 1. Zero section numbers (§...) in public and admin routes
    const routesToTest = [
      '/work',
      '/build',
      '/timeline',
      '/ask',
      '/book',
      '/about',
      '/now',
      '/uses',
      '/admin',
      '/admin/setup',
      '/admin/login',
      '/admin/import',
    ];
    for (const route of routesToTest) {
      const res = await app.request(route);
      const html = await res.text();
      expect(html, `Route ${route} should not leak section numbers (§...)`).not.toContain('(§');
    }

    // 2. Structured entry view: no "Structure: L2" or schema codes, shows "Structured" chip
    const entryRes = await app.request('/work/structured-spec-test');
    const entryHtml = await entryRes.text();
    expect(entryHtml).not.toContain('Structure: L2');
    expect(entryHtml).not.toContain('Structure: L1');
    expect(entryHtml).not.toContain('Structure: L0');
    expect(entryHtml).toContain('<span class="chip">Structured</span>');

    // 3. data-role attribute present on structured sections
    expect(entryHtml).toContain('data-role="goal"');
    expect(entryHtml).toContain('data-role="decision"');
    expect(entryHtml).toContain('data-role="outcome"');

    // 4. View switcher canonical naming in both views
    expect(entryHtml).toContain('data-action="view-switch"');
    expect(entryHtml).toContain('Read as one article');

    const articleRes = await app.request('/work/structured-spec-test?view=article');
    const articleHtml = await articleRes.text();
    expect(articleHtml).toContain('data-action="view-switch"');
    expect(articleHtml).toContain('Read by section');

    // 5. Ask page prompt facets have no "(hard constraint)"
    const askRes = await app.request('/ask');
    const askHtml = await askRes.text();
    expect(askHtml).not.toContain('(hard constraint)');
  });

  it('[CP-03] Zero hard-coded owner/sample content in UI templates (/now, /about, /uses)', async () => {
    const repo = new InMemoryPortfolioRepository();
    const app = createTestWeb(repo);

    // 1. /now: neutral empty fallback
    const nowRes = await app.request('/now');
    const nowHtml = await nowRes.text();
    expect(nowHtml).toContain("What I'm focused on now");
    expect(nowHtml).toContain('Nothing here yet.');
    expect(nowHtml).not.toContain('Building a personal engine for high-agency work');
    expect(nowHtml).not.toContain('Ship living-portfolio v0.1');

    // 2. /about: no unconditional verified badges without proof
    const aboutRes = await app.request('/about');
    const aboutHtml = await aboutRes.text();
    expect(aboutHtml).toContain('Verified credentials');
    expect(aboutHtml).toContain('Nothing has been verified yet.');
    expect(aboutHtml).not.toContain('GitHub @shiapeng');
    expect(aboutHtml).not.toContain('keybase:shiapeng');
    expect(aboutHtml).not.toContain('(§6.1)');

    // 3. /uses: neutral instance stack information
    const usesRes = await app.request('/uses');
    const usesHtml = await usesRes.text();
    expect(usesHtml).toContain('Tools &amp; Stack');
    expect(usesHtml).toContain('Instance stack information.');
    expect(usesHtml).not.toContain('M3 Max MacBook Pro 16"');
    expect(usesHtml).not.toContain('Helix + Neovim');
  });
});
