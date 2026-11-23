import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { chunkMarkdown } from '@living-portfolio/core';
import {
  renderStrataTimelineSection,
  renderEntryDetailPage,
  renderHomePage,
  renderTimelinePage,
  STRATA_DESIGN_SYSTEM_CSS,
  renderStrataDateGlyph,
  renderEntryRow,
} from '@living-portfolio/web';

describe('WP-12.1 Conformance: Strata Timeline Visual Overhaul & Typography Craft', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();

    const body1 = `## The goal
Coordinate locks without Redis.

## What I did
We used Postgres advisory locks.

## What got in the way
Connection pooling leaks in PgBouncer.

## The decision
Switched to transaction-scoped locks.

## What happened
p99 latency fell by 40%.

## What I'd tell someone else
Always use transaction-scoped locks with pooling.`;

    // 1. Case study entry (2021)
    const { entry: e1, revision: rev1 } = await repo.createEntry(
      {
        slug: 'distributed-lock-manager',
        title: 'Distributed Lock Manager with Postgres Advisory Locks',
        profile: 'case-study',
        view: 'structured',
        visibility: 'public',
      },
      {
        written_at: '2021-08-10T10:00:00Z',
        valid_from: '2021-08-01T00:00:00Z',
        body_md: body1,
      }
    );

    // Save spans and annotations
    const rawSpans = chunkMarkdown(rev1.id, body1, { targetTokens: 40, maxTokens: 80 });
    const spans = await repo.saveSpans(rawSpans);

    if (spans.length > 0) {
      await repo.saveAnnotation({
        span_id: spans[0].id,
        role: 'goal',
        profile: 'case-study',
        source: 'owner',
        status: 'accepted',
        confidence: 1.0,
      });
      if (spans[1]) {
        await repo.saveAnnotation({
          span_id: spans[1].id,
          role: 'approach',
          profile: 'case-study',
          source: 'owner',
          status: 'accepted',
          confidence: 1.0,
        });
      }
    }

    // Save facets for L1/L2 qualification
    await repo.saveFacet({
      entry_id: e1.id,
      revision_id: rev1.id,
      key: 'database',
      value: 'PostgreSQL',
      source: 'owner',
      status: 'confirmed',
      confidence: 1.0,
    });

    await repo.saveClaim({
      revision_id: rev1.id,
      text: 'Transaction-scoped advisory locks prevent connection leakages in PgBouncer.',
      kind: 'decision',
      outcome_status: 'worked',
      source: 'owner',
      status: 'accepted',
    });

    // 2. Decision record entry (2024)
    await repo.createEntry(
      {
        slug: 'stream-processing-architecture',
        title: 'Stream Processing Architecture Decision',
        profile: 'decision-record',
        view: 'article',
        visibility: 'public',
      },
      {
        written_at: '2024-03-20T10:00:00Z',
        valid_from: '2024-03-01T00:00:00Z',
        body_md: 'Evaluated Kafka vs RabbitMQ for transactional outbox dispatching.',
      }
    );

    // 3. Design project venture entry (2025)
    await repo.createEntry(
      {
        slug: 'designing-strata-timeline',
        title: 'Designing Strata Timeline: Time as Geology',
        profile: 'design-project',
        view: 'structured',
        visibility: 'public',
        venture_id: 'venture_strata_v2',
      },
      {
        written_at: '2025-07-15T12:00:00Z',
        valid_from: '2025-07-01T00:00:00Z',
        body_md: 'Strata timeline visualization with real continuous time axis.',
      }
    );
  });

  describe('20261020-UI-05: Strata Timeline Visual Overhaul (Continuous Axis, Glyphs, Non-Linear Scale, Cursor)', () => {
    it('1. Axis is continuous time: empty months are rendered as hairlines so gaps are visible', async () => {
      const { html } = await renderStrataTimelineSection(repo as any);

      // Between 2021-08 and 2024-03, months like 2021-09, 2022-01, 2023-05 must be present
      expect(html).toContain('data-ym="2021-08"');
      expect(html).toContain('data-ym="2021-09"');
      expect(html).toContain('data-ym="2022-01"');
      expect(html).toContain('data-ym="2024-03"');
      expect(html).toContain('data-ym="2025-07"');

      // Empty months render hairline and data-count="0"
      expect(html).toContain('class="strata-band strata-band-empty"');
      expect(html).toContain('class="band-empty-hairline"');
      expect(html).toContain('data-count="0"');
      expect(html).toContain('aria-label="2021-09: No entries');
    });

    it('2. Profile is encoded by visual texture attributes and glyphs (■ ◆ ▲)', async () => {
      const { html } = await renderStrataTimelineSection(repo as any);

      // Glyphs and pattern attributes
      expect(html).toContain('data-profile="case-study"');
      expect(html).toContain('data-profile="decision-record"');
      expect(html).toContain('data-profile="design-project"');

      expect(html).toContain('class="band-glyphs"');
      expect(html).toContain('■'); // Case study
      expect(html).toContain('◆'); // Decision record
      expect(html).toContain('▲'); // Design project

      // Legend defines glyphs and venture notch
      expect(html).toContain('■</span> Case study');
      expect(html).toContain('◆</span> Decision record');
      expect(html).toContain('▲</span> Design project');
      expect(html).toContain('class="band-venture-notch"');
    });

    it('3. Band heights follow square-root scaling between min and max tokens', async () => {
      const { html } = await renderStrataTimelineSection(repo as any);

      // Active months have height scaled with Math.min(120, Math.round(52 + Math.sqrt(count) * 28))
      expect(html).toContain('style="height:80px"'); // count=1 -> 52 + 28 = 80px
      // Empty months have fixed 44px touch-accessible height with hairline
      expect(html).toContain('style="height:var(--lp-size-strata-band-min)"');
    });

    it('4. As-of cursor renders slider semantics and labeled handle', async () => {
      const { html } = await renderStrataTimelineSection(repo as any, '2024-03-15T00:00:00Z');

      expect(html).toContain('id="strata-cursor"');
      expect(html).toContain('class="as-of-cursor"');
      expect(html).toContain('role="slider"');
      expect(html).toContain('aria-label="As of date cursor"');
      expect(html).toContain('aria-valuetext="2024-03-15"');
      expect(html).toContain('Viewing as of 2024-03');
    });

    it('5. Keyboard navigation script supports Left/Right by month and PageUp/PageDown by year', async () => {
      const { html } = await renderStrataTimelineSection(repo as any);

      expect(html).toContain("e.key === 'ArrowRight'");
      expect(html).toContain("e.key === 'ArrowLeft'");
      expect(html).toContain("e.key === 'PageUp'");
      expect(html).toContain("idx - 12"); // 12 months = 1 year
      expect(html).toContain("e.key === 'PageDown'");
      expect(html).toContain("idx + 12");
      expect(html).toContain("e.key === 'Enter'");
    });
  });

  describe('20261020-UI-08: Active Role Styling, Text-First Claims & Consistent Spacing', () => {
    it('1. Role classes (.role-marker, .role-goal to .role-lesson) are applied in structured view without inline border overrides', async () => {
      const res = await renderEntryDetailPage(repo as any, 'distributed-lock-manager', 'structured');
      expect(res.status).toBe(200);

      // Role section classes
      expect(res.html).toContain('class="role-section role-goal"');
      expect(res.html).toContain('class="role-section role-approach"');

      // Role marker headings
      expect(res.html).toContain('class="role-marker role-goal"');
      expect(res.html).toContain('The goal</h2>');

      // No inline border-left overrides
      expect(res.html).not.toMatch(/style="[^"]*border-left:\s*3px solid var\(--role-/);
    });

    it('2. Claim items render text-first without card grid boxes (§12.1)', async () => {
      const res = await renderEntryDetailPage(repo as any, 'distributed-lock-manager');
      expect(res.status).toBe(200);

      expect(res.html).toContain('class="claim-item"');
      expect(res.html).toContain('class="claim-meta"');
      expect(res.html).toContain('class="claim-text"');
      expect(res.html).toContain('Transaction-scoped advisory locks prevent connection leakages in PgBouncer.');

      // No inline card box styling
      expect(res.html).not.toMatch(/style="margin-bottom:8px;padding:8px;border:1px solid var\(--rule\);background:var\(--surface-raised\)"/);
    });

    it('3. Spacing rhythm uses standardized tokens across entry header, context strip, and rail', async () => {
      const res = await renderEntryDetailPage(repo as any, 'distributed-lock-manager');
      expect(res.status).toBe(200);

      // Header padding and margin tokens
      expect(res.html).toContain('margin-bottom:var(--lp-space-stack-group)');
      expect(res.html).toContain('padding-bottom:var(--lp-space-inset-section)');

      // Date line margin tokens
      expect(res.html).toContain('margin:var(--lp-space-stack-label-to-control) 0 var(--lp-space-stack-label-to-control)');

      // Rail section margins
      expect(res.html).toContain('margin-top:var(--lp-space-stack-group)');
      expect(res.html).toContain('padding-top:var(--lp-space-inset-section)');
    });
  });

  describe('20261020-UI-09: Typography Craft, Tabular Numerals, Text-Wrap, and Differentiation Device', () => {
    it('1. Tabular numerals are enforced in CSS and applied to chronological rows and timeline', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('font-variant-numeric: tabular-nums');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.tabular-nums');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.strata-band');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('.entry-meta');
    });

    it('2. Text-wrap balance is enforced on headings and pretty on body text', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('text-wrap: balance');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('text-wrap: pretty');
    });

    it('3. Optical alignment includes hanging punctuation and rail alignment', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('hanging-punctuation: first allow-end');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('::selection');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('background-color: var(--accent)');
    });

    it('4. Differentiation device renders two-layer strata date glyph beside textual dates', async () => {
      const res = await renderEntryDetailPage(repo as any, 'distributed-lock-manager');
      expect(res.status).toBe(200);

      expect(res.html).toContain('class="strata-date-glyph');
      expect(res.html).toContain('class="strata-glyph-layer happened-layer"');
      expect(res.html).toContain('class="strata-glyph-layer written-layer');

      // Standalone helper verification
      const glyph = renderStrataDateGlyph('2021-08-01', '2026-02-10', true);
      expect(glyph).toContain('is-hindsight');
      expect(glyph).toContain('written-layer shifted');

      const concurrentGlyph = renderStrataDateGlyph('2024-03-01', '2024-03-01', false);
      expect(concurrentGlyph).not.toContain('is-hindsight');
      expect(concurrentGlyph).not.toContain('shifted');
    });

    it('5. Micro-transitions answer actions and respect prefers-reduced-motion', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('transition: transform var(--lp-motion-duration-fast)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('transition: left var(--lp-motion-duration-base)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('@media (prefers-reduced-motion: reduce)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('animation-duration: var(--lp-motion-duration-instant) !important');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('transition-duration: var(--lp-motion-duration-instant) !important');
    });
  });
});
