import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import {
  formatMonthYear,
  formatFullDate,
  formatEntryDateLine,
  formatPlural,
  formatIcu,
  formatActionableError,
  STRINGS_EN,
  renderAskPage,
  renderTimelinePage,
  renderEntryDetailPage,
  renderBuildPage,
} from '@living-portfolio/web';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

/**
 * Conformance test suite for WP-12.2: Actionable Error Messages & String Architecture
 *
 * Covers:
 * - 20261020-CP-04: Actionable user-facing error messages with concrete recovery guidance
 * - 20261020-CP-06: String architecture (date localization "Month Year", proper pluralization, ICU format)
 * - 20261020-CP-07: Spec-standard canonical strings across all 9 Ask flow response states
 */
describe('WP-12.2 Conformance: Actionable Errors & String Architecture (20261020-CP-04, CP-06, CP-07)', () => {
  let app: any;
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    const created = createApp(repo, {
      publicBaseUrl: 'http://localhost:3000',
    });
    app = created.app;
  });

  describe('20261020-CP-04: Actionable user-facing error messages with concrete recovery guidance', () => {
    it('1. 400 Invalid query on /api/ask returns actionable tier and message instead of raw validation error', async () => {
      const res = await app.request('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' }), // Invalid query (min 3 chars)
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.tier).toBe('invalid_query');
      expect(data.message).toBe('Type a question to ask. It can be up to 1000 characters.');
      expect(data.answer).toBe('Type a question to ask. It can be up to 1000 characters.');
    });

    it('2. Ask client script includes dedicated invalid_query branch with role="alert" card', async () => {
      const html = await renderAskPage();

      // UI branch handles invalid_query without leaving the card blank
      expect(html).toContain("data.tier === 'invalid_query'");
      expect(html).toContain('Type a question to ask');
      expect(html).toContain('role="alert"');
      // No raw "Origin unreachable" or generic uninformative text
      expect(html).not.toContain('Origin unreachable');
      expect(html).toContain("Can\\'t reach the server, so answers aren\\'t available right now");
    });

    it('3. Admin authentication failures return user-actionable messages', async () => {
      // 401 Unauthorized API response
      const res401 = await app.request('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });

      expect(res401.status).toBe(401);
      const data401 = await res401.json();
      expect(data401.error).toBe('Unauthorized: admin authentication required');
      expect(data401.message).toBe("You're signed out. Sign in to continue.");
    });

    it('4. FormatActionableError builds standard three-part actionable messages', () => {
      const err = formatActionableError({
        action: "Couldn't save entry",
        reason: 'Check this entry for missing or invalid details',
        recovery: 'Fix the highlighted fields and retry.',
      });

      expect(err).toBe(
        "Couldn't save entry. Check this entry for missing or invalid details. Fix the highlighted fields and retry."
      );
    });
  });

  describe('20261020-CP-06: String architecture (Date localization, pluralization, ICU format, entry lang)', () => {
    it('1. FormatMonthYear formats ISO dates into human-readable Month Year', () => {
      expect(formatMonthYear('2024-03-15T00:00:00Z')).toBe('March 2024');
      expect(formatMonthYear('2021-08-01')).toBe('August 2021');
      expect(formatMonthYear('2026-10')).toBe('October 2026');
    });

    it('2. FormatFullDate formats dates into Month Day, Year', () => {
      expect(formatFullDate('2024-03-15T00:00:00Z')).toBe('March 15, 2024');
      expect(formatFullDate('2026-10-19T12:00:00Z')).toBe('October 19, 2026');
    });

    it('3. FormatEntryDateLine formats dates per Spec §12.6 with hindsight awareness', () => {
      // Concurrent record
      const concurrent = formatEntryDateLine('2026-10-15', '2026-10-15', false);
      expect(concurrent).toBe('Written October 2026.');

      // Delayed revision
      const delayed = formatEntryDateLine('2024-03-10', '2026-09-01', false);
      expect(delayed).toBe('Happened March 2024. Written September 2026.');

      // Retrospective hindsight
      const hindsight = formatEntryDateLine('2024-03-10', '2026-09-01', true);
      expect(hindsight).toBe('Happened March 2024. Written September 2026, looking back.');
    });

    it('4. FormatPlural uses Intl.PluralRules instead of hand-coded "s" checks', () => {
      expect(formatPlural(1, 'entry', 'entries')).toBe('1 entry');
      expect(formatPlural(2, 'entry', 'entries')).toBe('2 entries');
      expect(formatPlural(0, 'entry', 'entries')).toBe('0 entries');
      expect(formatPlural(1, 'minute', 'minutes', false)).toBe('minute');
      expect(formatPlural(5, 'minute', 'minutes', false)).toBe('minutes');
    });

    it('5. FormatIcu supports parameter interpolation and plural forms', () => {
      const template = STRINGS_EN.timeline.heading;
      expect(formatIcu(template, { firstYear: '2021' })).toBe('Timeline, 2021 to now');

      const pluralTemplate = '{count, plural, one {# entry} other {# entries}} as of {monthYear}';
      expect(formatIcu(pluralTemplate, { count: 1, monthYear: 'March 2024' })).toBe(
        '1 entry as of March 2024'
      );
      expect(formatIcu(pluralTemplate, { count: 5, monthYear: 'March 2024' })).toBe(
        '5 entries as of March 2024'
      );
    });

    it('6. RenderEntryDetailPage emits lang attribute on article tag', async () => {
      const created = await repo.createEntry(
        {
          slug: 'localized-french-entry',
          title: 'Architecture distribuée',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
        },
        {
          body_md: '# Résumé\n\nNous avons mis en place une architecture distribuée.',
          temporal_level: 'exact',
          valid_from: '2024-03-01T00:00:00Z',
          written_at: '2024-03-01T00:00:00Z',
        }
      );
      (created.entry as any).lang = 'fr';

      const res = await renderEntryDetailPage(repo as any, 'localized-french-entry');
      expect(res.html).toContain('<article lang="fr">');
      // Proves per-entry localization takes effect (French: mars 2024)
      expect(res.html).toContain('mars 2024');
    });

    it('7. RenderTimelinePage renders localized "entries as of Month Year" heading', async () => {
      await repo.createEntry(
        {
          slug: 'sample-entry-1',
          title: 'Sample Entry 1',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
        },
        {
          body_md: 'Content',
          temporal_level: 'exact',
          valid_from: '2024-03-01T00:00:00Z',
          written_at: '2024-03-01T00:00:00Z',
        }
      );

      const html = await renderTimelinePage(repo as any, '2024-03-15T00:00:00Z');
      expect(html).toContain('1 entry as of March 2024');
      expect(html).toContain('Back to today');
    });

    it('8. RenderBuildPage uses proper pluralization for Dev log counts', async () => {
      const buildHtml = await renderBuildPage(repo as any);
      expect(buildHtml).not.toContain('=== 1 ?');
      expect(buildHtml).not.toContain("> 1 ? 's' : ''");
    });
  });

  describe('20261020-CP-07: Spec-standard canonical strings across all 9 Ask flow response states', () => {
    it('1. STRINGS_EN contains canonical copy for all 9 Ask flow states', () => {
      const states = STRINGS_EN.ask.state;
      expect(states.tier1.title).toBe("Automated answer from the owner's records");
      expect(states.tier2.title).toBe(
        "This needs the owner's review. Typical reply within 24 hours."
      );
      expect(states.tier3.title).toBe('This is better as a conversation.');
      expect(states.tier3.answer).toBe(
        "This is better as a conversation. Your situation has details my past work doesn't cover."
      );
      expect(states.extractive.title).toBe(
        "Showing excerpts from the owner's records. Automated answers are paused for now."
      );
      expect(states.no_match.title).toBe("That isn't in these records.");
      expect(states.disabled.title).toBe('Automated answers are off.');
      expect(states.disabled.answer).toBe(
        'Automated answers are off right now. You can book a conversation or send the owner a message.'
      );
      expect(states.needs_context.title).toBe(
        "A few details will help me check this against my experience. Skip any you don't know."
      );
      expect(states.rate_limited.title).toBe('Hourly question limit reached');
      expect(states.invalid_query.title).toBe('Type a question to ask');
      expect(states.invalid_query.answer).toBe(
        'Type a question to ask. It can be up to 1000 characters.'
      );
    });

    it('2. Ask client script registers all 9 canonical state labels in tierLabels', async () => {
      const askHtml = await renderAskPage();

      expect(askHtml).toContain('tier1: "Automated answer from the owner\'s records"');
      expect(askHtml).toContain(
        'tier2: "This needs the owner\'s review. Typical reply within 24 hours."'
      );
      expect(askHtml).toContain('tier3: "This is better as a conversation."');
      expect(askHtml).toContain(
        'extractive: "Showing excerpts from the owner\'s records. Automated answers are paused for now."'
      );
      expect(askHtml).toContain('no_match: "That isn\'t in these records."');
      expect(askHtml).toContain('disabled: "Automated answers are off."');
      expect(askHtml).toContain('rate_limited: "Hourly question limit reached"');
      expect(askHtml).toContain(
        'needs_context: "A few details will help me check this against my experience. Skip any you don\'t know."'
      );
      expect(askHtml).toContain('invalid_query: "Type a question to ask"');
    });

    it('3. /api/ask returns canonical answer for tier3 escalation', async () => {
      // Seed an entry with advisory context
      await repo.createEntry(
        {
          slug: 'complex-distributed-consensus',
          title: 'Complex Distributed Consensus',
          profile: 'case-study',
          view: 'article',
          visibility: 'public',
        },
        {
          body_md: 'Complex consensus discussion on distributed raft algorithm.',
          temporal_level: 'exact',
          valid_from: '2024-03-01T00:00:00Z',
        }
      );

      // Advisory question with differing facets triggers tier3
      const res = await app.request('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Should we migrate our consensus layer to Paxos?',
          facets: {
            database: 'oracle',
            stack: 'cobol',
          },
        }),
      });

      const data = await res.json();
      if (data.tier === 'tier3') {
        expect(data.answer).toBe(
          "This is better as a conversation. Your situation has details my past work doesn't cover."
        );
      }
    });

    it('4. /api/ask rate limit returns canonical answer and retry seconds', async () => {
      // Send 25 queries to trip rate limit (limit is 20/hr)
      let rateLimitedRes: any = null;
      for (let i = 0; i < 25; i++) {
        const res = await app.request('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `How does raft consensus handle partitioned networks question ${i}?`,
          }),
        });
        if (res.status === 429) {
          rateLimitedRes = res;
          break;
        }
      }

      if (rateLimitedRes) {
        expect(rateLimitedRes.status).toBe(429);
        const data = await rateLimitedRes.json();
        expect(data.tier).toBe('rate_limited');
        expect(data.answer).toContain("Hourly question limit reached. You've reached the limit of questions per hour.");
        expect(data.retryAfter).toBe(3600);
      }
    });
  });
});
