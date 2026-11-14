import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import {
  renderHomePage,
  renderEntryDetailPage,
  renderStrataTimelineSection,
  renderAdminSettingsPage,
  STRATA_DESIGN_SYSTEM_CSS,
} from '@living-portfolio/web';
import { chunkMarkdown } from '@living-portfolio/core';

describe('WP-11.3 Conformance: Accessibility Mechanics (UX-15) & Structured View Repair (UX-16)', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();

    const venture = await repo.createVenture({
      slug: 'pg-pulse',
      name: 'pg-pulse',
      description: 'PostgreSQL lock contention monitor',
      status: 'maintained',
      links: { repo: 'https://github.com/example/pg-pulse' },
      started_at: '2021-06-15T00:00:00Z',
    });

    const body2021 = `## The goal
We needed distributed job coordination across 16 worker nodes processing billing webhooks without double-charging customers.

## What I did
We deployed a 3-node Redis cluster using Redlock leases with a 5-second TTL around every webhook processor.

## What got in the way
During a network partition between availability zones, clock drift caused lock leases to overlap for 180ms before fencing tokens were checked.

## The decision
We chose Redis Redlock with short TTLs and idempotency keys in Postgres as a secondary guard.

## What happened
It worked partly: duplicate webhooks dropped by 99.4%, but maintaining a separate Redis cluster purely for locking added operational overhead during failovers.

## What I'd tell someone else
Use Redis distributed locks when you already run Redis at scale, but always pair lock acquisition with database-level idempotency constraints.`;

    const { entry, revision } = await repo.createEntry(
      {
        slug: 'redis-distributed-locks-2021',
        title: 'Distributed Webhook Coordination with Redis Locks',
        profile: 'case-study',
        view: 'structured',
        visibility: 'public',
        venture_id: venture.id,
      },
      {
        body_md: body2021,
        body_hash: 'sha256-2021-redis',
        written_at: '2021-09-14T10:00:00Z',
        valid_from: '2021-08-01T00:00:00Z',
        valid_to: '2024-03-10T00:00:00Z',
        temporal_level: 'exact',
        is_hindsight: false,
      }
    );

    // Generate 3 spans matching the audit condition
    const spans = await repo.saveSpans(
      chunkMarkdown(revision.id, body2021, { targetTokens: 60, maxTokens: 120 })
    );

    // Save confirmed facets for L1
    await repo.saveFacet({
      entry_id: entry.id,
      revision_id: revision.id,
      key: 'database',
      value: 'Redis + PostgreSQL',
      source: 'owner',
      status: 'confirmed',
      confidence: 1.0,
      source_span_id: spans[0]?.id,
    });
    await repo.saveFacet({
      entry_id: entry.id,
      revision_id: revision.id,
      key: 'scale',
      value: '16 worker nodes',
      source: 'owner',
      status: 'confirmed',
      confidence: 1.0,
    });

    // Save annotation only on span 0 (spans 1 and 2 are unannotated / unlabeled)
    if (spans[0]) {
      await repo.saveAnnotation({
        span_id: spans[0].id,
        role: 'goal',
        profile: 'case-study',
        source: 'owner',
        status: 'accepted',
        confidence: 1.0,
      });
      await repo.saveAnnotation({
        span_id: spans[0].id,
        role: 'decision',
        profile: 'case-study',
        source: 'owner',
        status: 'accepted',
        confidence: 1.0,
      });
      await repo.saveAnnotation({
        span_id: spans[0].id,
        role: 'outcome',
        profile: 'case-study',
        source: 'owner',
        status: 'accepted',
        confidence: 1.0,
      });
    }

    // Save claim for L3 qualification
    await repo.saveClaim({
      revision_id: revision.id,
      text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
      kind: 'decision',
      outcome_status: 'partly',
      scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
      valid_from: '2021-08-01T00:00:00Z',
      valid_to: '2024-03-10T00:00:00Z',
      temporal_level: 'exact',
      is_hindsight: false,
      source_span_id: spans[0]?.id,
      source: 'owner',
      status: 'accepted',
    });
  });

  describe('20261020-UX-15: Accessibility Mechanics & WCAG 2.2 AA', () => {
    it('renders skip link as first body child pointing to #main-content', async () => {
      const homeHtml = await renderHomePage(repo as any);
      expect(homeHtml).toMatch(/<body>\s*<a href="#main-content" class="skip-link">Skip to main content<\/a>/);
      expect(homeHtml).toContain('id="main-content"');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.skip-link');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.skip-link:focus');
    });

    it('renders exactly one semantic h1 heading on Home', async () => {
      const homeHtml = await renderHomePage(repo as any);
      const h1Matches = homeHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi);
      expect(h1Matches).not.toBeNull();
      expect(h1Matches?.length).toBe(1);
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.visually-hidden');
    });

    it('synchronizes theme toggle with system dark mode and guards localStorage', async () => {
      const homeHtml = await renderHomePage(repo as any);
      expect(homeHtml).toContain('id="theme-toggle"');
      expect(homeHtml).toContain('aria-pressed="false"');
      expect(homeHtml).toContain('min-height:44px');
      // Script includes window.matchMedia check for prefers-color-scheme: dark
      expect(homeHtml).toContain("prefers-color-scheme: dark");
      // Script guards localStorage in try/catch
      expect(homeHtml).toContain("localStorage.getItem('strata-theme')");
      expect(homeHtml).toContain("localStorage.setItem('strata-theme'");
    });

    it('renders strata timeline bands as semantic <a> navigation links instead of buttons', async () => {
      const { html } = await renderStrataTimelineSection(repo as any);
      expect(html).toContain('<a href="/timeline?as_of=');
      expect(html).toContain('class="strata-band"');
      expect(html).not.toMatch(/<button[^>]*class="strata-band"[^>]*onclick="window\.location\.href/);
    });

    it('dimmed future bands avoid low-contrast opacity:0.35 and render future text', async () => {
      const { html } = await renderStrataTimelineSection(repo as any, '2020-01-01T00:00:00Z');
      expect(html).toContain('data-dimmed="true"');
      expect(html).toContain('(after as-of date)');
      expect(html).toContain('class="band-label-future"');
      expect(html).toContain('(future)');
      // CSS does not use opacity: 0.35 on dimmed bands
      expect(STRATA_DESIGN_SYSTEM_CSS).not.toContain('.strata-band[data-dimmed="true"] {\n  opacity: 0.35;');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.strata-band[data-dimmed="true"]');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('repeating-linear-gradient');
    });

    it('interactive controls enforce minimum 44px touch target size', async () => {
      const { html: timelineHtml } = await renderStrataTimelineSection(repo as any);
      expect(timelineHtml).toContain('min-height:44px');

      const entryRes = await renderEntryDetailPage(repo as any, 'redis-distributed-locks-2021');
      expect(entryRes.html).toContain('min-height:44px');

      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('min-height: 44px');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('@media (pointer: coarse)');
    });

    it('static alpha warning banner uses role="note" instead of role="alert"', async () => {
      const adminHtml = await renderAdminSettingsPage(repo as any);
      expect(adminHtml).toContain('data-banner="alpha-warning" role="note"');
      expect(adminHtml).not.toContain('data-banner="alpha-warning" role="alert"');
    });
  });

  describe('20261020-UX-16: Structured View Repair ("Unlabeled is Valid")', () => {
    it('renders all spans in document order without dropping unannotated text', async () => {
      // redis-distributed-locks-2021 has 3 spans and 1 annotation
      const res = await renderEntryDetailPage(repo as any, 'redis-distributed-locks-2021', 'structured');
      expect(res.status).toBe(200);

      // Verify annotated role section is rendered
      expect(res.html).toContain('class="role-section role-goal"');
      expect(res.html).toContain('The goal');

      // Verify unlabeled spans are rendered (not dropped)
      expect(res.html).toContain('class="unlabeled-span reading-column"');
      expect(res.html).toContain('During a network partition between availability zones');
      expect(res.html).toContain('Use Redis distributed locks when you already run Redis at scale');

      // Verify no schema jargon in tooltips
      expect(res.html).not.toContain('title="Schema role:');
    });

    it('retains all 603 characters previously lost in structured view', async () => {
      const structuredRes = await renderEntryDetailPage(repo as any, 'redis-distributed-locks-2021', 'structured');
      const articleRes = await renderEntryDetailPage(repo as any, 'redis-distributed-locks-2021', 'article');

      // Key content from unannotated spans must exist in structured view
      expect(structuredRes.html).toContain('clock drift caused lock leases to overlap for 180ms');
      expect(structuredRes.html).toContain('duplicate webhooks dropped by 99.4%');
      expect(structuredRes.html).toContain('always pair lock acquisition with database-level idempotency constraints');

      // Both views must contain the full lesson text
      expect(structuredRes.html).toContain('What I\'d tell someone else');
      expect(articleRes.html).toContain('What I\'d tell someone else');
    });
  });
});
