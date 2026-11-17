import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createTestClient } from './test-client.js';
import {
  createWebApp,
  parseAsOfDate,
  renderAdminEntriesPage,
  renderAdminImportPage,
  renderAdminLoginPage,
  renderAdminSettingsPage,
  renderAdminSetupPage,
  renderAskPage,
  renderAskStatusPage,
  renderBookPage,
  renderBuildPage,
  renderEntryDetailPage,
  renderHomePage,
  renderTimelinePage,
  renderWorkOrWritingPage,
  renderMarkdown,
  sanitizeHtml,
  renderInlineMarkdown,
  PRIMITIVE_TOKENS,
  SEMANTIC_TOKENS_LIGHT,
  SEMANTIC_TOKENS_DARK,
  COMPONENT_TOKENS,
  renderField,
  renderButton,
  renderChip,
  renderEntryRow,
  renderEntryArticleWithSlots,
  renderEntryStructuredWithSlots,
  renderVentureWithSlots,
  renderHomeWithSlots,
  renderTimelineWithSlots,
  renderLayout,
  renderStrataTimelineSection,
  formatMonthYear,
  formatEntryDateLine,
  formatPlural,
  formatIcu,
  formatActionableError,
  STRINGS_EN,
} from './index.js';

describe('Strata Public Site & Admin Workspace Renderer (§5, §12, §18.1)', () => {
  let repo: any;

  beforeEach(() => {
    repo = createTestClient();
  });

  it('renders Home page with Strata Timeline, owner statement, and entries readable without JS (§1, §12.6)', async () => {
    const html = await renderHomePage(repo);
    expect(html).toContain('Strata timeline');
    expect(html).toContain('Advisory Locks, Revisited: Dropping Redis for Postgres 15');
    expect(html).toContain('--surface-page: #FFFFFF');
    expect(html).toContain('--surface-page: #0F1A22');
    // Private entry must never appear on public home page
    expect(html).not.toContain('Private NDA Architecture Notes');
  });

  it('renders Later-Thinking banner on superseded 2021 entry and hides unconfirmed machine facets on public view (§5.3, §10.7)', async () => {
    const res2021 = await renderEntryDetailPage(repo, 'redis-distributed-locks-2021');
    expect(res2021.status).toBe(200);
    expect(res2021.html).toContain('Later thinking: superseded in');
    expect(res2021.html).toContain('Advisory Locks, Revisited');

    const res2024 = await renderEntryDetailPage(repo, 'advisory-locks-revisited');
    expect(res2024.status).toBe(200);
    // Confirmed facets appear on public page
    expect(res2024.html).toContain('PostgreSQL 15, PgBouncer, TypeScript');
    // Unconfirmed machine-suggested facet ("under 50 ms") must NOT be shown as a public fact (§5.3)
    expect(res2024.html).not.toContain('latency_budget');
    // Verified evidence badge is rendered
    expect(res2024.html).toContain('PR #482, verified GPG signature');
  });

  it('returns 404 for private entries on public routes (§3.11)', async () => {
    const resPrivate = await renderEntryDetailPage(repo, 'private-nda-architecture-notes');
    expect(resPrivate.status).toBe(404);
  });

  it('renders Time-Travel view excluding future and hindsight entries (§3.9, §6.1)', async () => {
    const html2022 = await renderTimelinePage(repo, '2022-06-01T00:00:00Z');
    expect(html2022).toContain('Viewing as of 2022-06');
    expect(html2022).toContain('Distributed Webhook Coordination with Redis Locks');
    // 2026 hindsight retrospective about 2022 must be excluded when viewing as of 2022
    expect(html2022).not.toContain('Why Our 2022 Microservice Split Was Premature');
  });

  it('renders Work, Build Ventures, Ask, and Reference Admin Entries Editor (§5.1, §12.6, WP-15.4)', async () => {
    const workHtml = await renderWorkOrWritingPage(repo, 'work');
    expect(workHtml).toContain('>Work</h1>');

    const buildHtml = await renderBuildPage(repo);
    expect(buildHtml).toContain('Strata Engine');
    expect(buildHtml).toContain('pg-pulse');

    const askHtml = await renderAskPage('What did you use to replace Redis?');
    expect(askHtml).toContain('aria-live="polite"');

    const adminHtml = await renderAdminEntriesPage(repo, { isNew: true });
    expect(adminHtml).toContain('id="ref-entry-list"');
    expect(adminHtml).toContain('id="ref-main"');
    expect(adminHtml).toContain('id="ref-field-title"');
    expect(adminHtml).toContain('id="ref-field-body"');
    expect(adminHtml).toContain('id="ref-btn-save"');
    expect(adminHtml).toContain('id="ref-switch-settings"');
  });

  it('renders Structure Drawer with 3 tabs, ARIA attributes, and interactive controls (20261020-UX-06, WP-15.4)', async () => {
    const adminHtml = await renderAdminEntriesPage(repo, { isNew: true });
    // Drawer & tablist
    expect(adminHtml).toContain('id="ref-structure-drawer"');
    expect(adminHtml).toContain('role="tablist"');
    expect(adminHtml).toContain('id="ref-structure-tabs-tab-summary"');
    expect(adminHtml).toContain('id="ref-structure-tabs-tab-context"');
    expect(adminHtml).toContain('id="ref-structure-tabs-tab-evidence"');

    // Panels
    expect(adminHtml).toContain('id="ref-structure-tabs-panel-summary"');
    expect(adminHtml).toContain('id="ref-structure-tabs-panel-context"');
    expect(adminHtml).toContain('id="ref-structure-tabs-panel-evidence"');
  });

  it('renders unified Reference Editor with entry fields, Structure guidance, and action controls (20261020-UX-07, WP-15.4)', async () => {
    const adminHtml = await renderAdminEntriesPage(repo, { isNew: true });
    expect(adminHtml).toContain('id="ref-btn-new-entry"');
    expect(adminHtml).toContain('id="ref-field-title"');
    expect(adminHtml).toContain('id="ref-field-body"');
    expect(adminHtml).toContain('id="ref-btn-save"');
    expect(adminHtml).toContain('State the goal, the decision and the outcome so visitors can follow your reasoning.');
  });

  it('renders Import & Triage page with 3-step planner and J K A R D S keyboard controls (20261020-UX-07)', async () => {
    const importHtml = await renderAdminImportPage(repo);
    expect(importHtml).toContain('Import &amp; Triage');
    expect(importHtml).toContain('id="import-stepper"');
    expect(importHtml).toContain('Step 1 of 3 · Add material');
    expect(importHtml).toContain('Markdown or text');

    // Add & Plan controls
    expect(importHtml).toContain('id="import-paste-area"');
    expect(importHtml).toContain('id="btn-generate-plan"');
    expect(importHtml).toContain('id="plan-free-est"');
    expect(importHtml).toContain('id="plan-paid-est"');

    // Triage controls and keyboard legend
    expect(importHtml).toContain('triage-keys-legend');
    expect(importHtml).toContain('>J<');
    expect(importHtml).toContain('>K<');
    expect(importHtml).toContain('>A<');
    expect(importHtml).toContain('>R<');
    expect(importHtml).toContain('>D<');
    expect(importHtml).toContain('>S<');

    expect(importHtml).toContain('id="btn-key-prev"');
    expect(importHtml).toContain('id="btn-key-next"');
    expect(importHtml).toContain('id="btn-key-accept"');
    expect(importHtml).toContain('id="btn-key-reassign"');
    expect(importHtml).toContain('id="btn-key-date"');
    expect(importHtml).toContain('id="btn-key-skip"');
    expect(importHtml).toContain('id="btn-commit-batch"');
  });

  it('renders Visitor Ask states with scope chip and robust error handling (20261020-CP-04, UX-10)', async () => {
    const askHtml = await renderAskPage('What did you use?', 'advisory-locks-revisited');
    expect(askHtml).toContain('id="btn-ask-submit"');
    expect(askHtml).toContain('id="scope-chip-container"');
    expect(askHtml).toContain('Scope: <strong>advisory-locks-revisited</strong>');
    expect(askHtml).toContain('id="btn-clear-scope"');

    // Script includes handling for needs_context and rate_limited
    expect(askHtml).toContain('needs_context');
    expect(askHtml).toContain('rate_limited');
    expect(askHtml).toContain("Can\\'t reach the server");
    expect(askHtml).not.toContain('Origin unreachable');
  });

  it('renders skip link and home h1 heading for accessibility (20261020-UX-15)', async () => {
    const homeHtml = await renderHomePage(repo);
    expect(homeHtml).toContain('<a href="#main-content" class="skip-link">Skip to main content</a>');
    expect(homeHtml).toContain('<h1 class="visually-hidden">');
  });

  it('renders Booking page with prefilled topic and facets without alert() (20261020-UX-11)', () => {
    const html = renderBookPage('How did you scale postgres?', 'architecture, databases');
    expect(html).toContain('Book a conversation');
    expect(html).toContain('id="booking-form"');
    expect(html).toContain('id="book-topic"');
    expect(html).toContain('value="How did you scale postgres?"');
    expect(html).toContain('id="book-facets"');
    expect(html).toContain('value="architecture, databases"');
    expect(html).toContain('id="book-name"');
    expect(html).toContain('id="book-contact"');
    expect(html).toContain('id="book-time"');
    expect(html).toContain('id="book-notes"');
    expect(html).toContain('id="btn-submit-booking"');
    expect(html).toContain('id="booking-confirmation"');
    // Ensure alert() dead end is completely eliminated (§12.6, 20261020-UX-11)
    expect(html).not.toContain("alert('Booking requested");
    expect(html).not.toContain('alert(');
  });

  it('renders Ask Status page for pending, approved, and rejected states (20261020-UX-08)', async () => {
    // 1. Invalid / unknown token
    const invalidHtml = await renderAskStatusPage(repo, 'non-existent-token');
    expect(invalidHtml).toContain('Receipt Status Not Found');

    // 2. Pending state
    const pendingEscalation = {
      question: 'Can you consult on advisory locks?',
      draft: 'Draft reply pending review.',
      query_class: 'advisory' as const,
      status: 'pending' as const,
      status_token: 'valid-test-token-1',
      visitor_contact: 'visitor@example.com',
      due_at: new Date(Date.now() + 86400000).toISOString(),
    };
    await repo.saveEscalation(pendingEscalation);

    const pendingHtml = await renderAskStatusPage(repo, 'valid-test-token-1');
    expect(pendingHtml).toContain('Escalation Receipt');
    expect(pendingHtml).toContain('Pending Review');
    expect(pendingHtml).toContain('Can you consult on advisory locks?');
    expect(pendingHtml).toContain('Pending Owner Review');
    expect(pendingHtml).toContain('Draft Under Review (Private to Visitor)');
    expect(pendingHtml).toContain('Draft reply pending review.');
    expect(pendingHtml).toContain('visitor@example.com');
    expect(pendingHtml).toContain('id="contact-form"');

    // 3. Approved state
    const approvedEscalation = {
      question: 'What is your advisory lock strategy?',
      draft: 'Initial draft',
      final: 'Here is the verified production architecture for advisory locks.',
      query_class: 'lookup' as const,
      status: 'approved' as const,
      status_token: 'valid-test-token-2',
    };
    await repo.saveEscalation(approvedEscalation);

    const approvedHtml = await renderAskStatusPage(repo, 'valid-test-token-2');
    expect(approvedHtml).toContain('Approved by Owner');
    expect(approvedHtml).toContain("Owner's Verified Reply");
    expect(approvedHtml).toContain('Here is the verified production architecture for advisory locks.');

    // 4. Rejected state
    const rejectedEscalation = {
      question: 'What is your internal salary?',
      draft: 'No draft.',
      query_class: 'advisory' as const,
      status: 'rejected' as const,
      status_token: 'valid-test-token-3',
      rejection_reason: 'Outside portfolio scope and confidentiality guidelines.',
    };
    await repo.saveEscalation(rejectedEscalation);

    const rejectedHtml = await renderAskStatusPage(repo, 'valid-test-token-3');
    expect(rejectedHtml).toContain('Declined');
    expect(rejectedHtml).toContain('Outside portfolio scope and confidentiality guidelines.');
  });

  describe('Time-Travel Correctness & Navigation Links (20261020-UX-12 / WP-4.3)', () => {
    it('parseAsOfDate handles valid dates, invalid strings, and empty input', () => {
      expect(parseAsOfDate(undefined)).toBeNull();
      expect(parseAsOfDate('')).toBeNull();
      expect(parseAsOfDate('   ')).toBeNull();

      const valid = parseAsOfDate('2024-03-15');
      expect(valid).not.toBeNull();
      expect(valid!.valid).toBe(true);
      expect(valid!.raw).toBe('2024-03-15');
      expect(valid!.date.toISOString().slice(0, 10)).toBe('2024-03-15');

      const invalid = parseAsOfDate('garbage-date');
      expect(invalid).not.toBeNull();
      expect(invalid!.valid).toBe(false);
      expect(invalid!.raw).toBe('garbage-date');
    });

    it('defaults strata timeline date input to today and includes recent entries up to today', async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const htmlDefault = await renderTimelinePage(repo);
      expect(htmlDefault).toContain(`value="${todayIso}"`);

      // Applying today's date should include recent entries up to today
      const htmlToday = await renderTimelinePage(repo, todayIso);
      expect(htmlToday).toContain('entries as of');
      expect(htmlToday).toContain('Advisory Locks, Revisited: Dropping Redis for Postgres 15');
      expect(htmlToday).toContain('Local CPU Embeddings with ONNX Runtime on Arm64');
    });

    it('dynamically computes month-end dates and renders keyboard navigation listener', async () => {
      const html = await renderTimelinePage(repo);
      // Keyboard script present
      expect(html).toContain("addEventListener('keydown'");
      expect(html).toContain('ArrowRight');
      expect(html).toContain('ArrowLeft');
      expect(html).toContain('PageUp');
      expect(html).toContain('PageDown');

      // Month end dynamic check: 2024-03 has 31 days, not hardcoded 28
      expect(html).toContain('2024-03-31T23:59:59Z');
      expect(html).not.toContain('2024-03-28T23:59:59Z');
    });

    it('gracefully handles invalid as_of parameter with alert banner instead of crashing', async () => {
      const html = await renderTimelinePage(repo, 'invalid-date-string');
      expect(html).toContain('Invalid as-of date ("invalid-date-string")');
      expect(html).toContain('Showing records as of present');
      // Public entries are still shown as of present
      expect(html).toContain('Advisory Locks, Revisited: Dropping Redis for Postgres 15');
    });

    it('renders informative empty state when all entries are filtered out', async () => {
      // 2019 date is before any entries existed
      const html = await renderTimelinePage(repo, '2019-01-01');
      expect(html).toContain('No records active as of this date');
      expect(html).toContain('All published entries were recorded after this point in time');
      expect(html).toContain('Reset to present');
      expect(html).not.toContain('class="entry-list"');
    });

    it('carries as_of parameter across timeline, work, entry detail, and ask links', async () => {
      const asOf = '2022-06-01T00:00:00Z';
      const encodedAsOf = encodeURIComponent(asOf);

      // 1. Timeline list and text list links carry ?as_of=
      const timelineHtml = await renderTimelinePage(repo, asOf);
      expect(timelineHtml).toContain(`/work/redis-distributed-locks-2021?as_of=${encodedAsOf}`);

      // 2. Work page carries as_of in entry links and outcome filters
      const workHtml = await renderWorkOrWritingPage(repo, 'work', undefined, asOf);
      expect(workHtml).toContain(`Viewing as of 2022-06-01`);
      expect(workHtml).toContain(`/work/redis-distributed-locks-2021?as_of=${encodedAsOf}`);
      expect(workHtml).toContain(`/work?as_of=${encodedAsOf}`);
      expect(workHtml).toContain(`/work?outcome=worked&as_of=${encodedAsOf}`);

      // 3. Entry detail carries as_of in sticky banner, switch view, and scoped ask form
      const entryRes = await renderEntryDetailPage(repo, 'redis-distributed-locks-2021', undefined, asOf);
      expect(entryRes.status).toBe(200);
      expect(entryRes.html).toContain('Viewing as of 2022-06-01');
      expect(entryRes.html).toContain(`<input type="hidden" name="as_of" value="${asOf}"`);
      expect(entryRes.html).toContain(`/timeline?as_of=${encodedAsOf}`);

      // 4. Ask page prefills facet-asof, opens details, and renders time-travel banner
      const askHtml = await renderAskPage('How do locks work?', 'redis-distributed-locks-2021', asOf);
      expect(askHtml).toContain('Time-travel query active:');
      expect(askHtml).toContain('2022-06-01');
      expect(askHtml).toContain('id="facet-asof" type="date" class="ask-input" style="width:100%;padding:6px" value="2022-06-01"');
      expect(askHtml).toContain('<details style="margin-top:16px" open>');
    });

    it('serves historical revision active as of query date on entry detail page', async () => {
      // Create an entry with two revisions: v1 in 2022, v2 in 2024
      const created = await repo.createEntry(
        {
          slug: 'multi-rev-entry',
          title: 'Multi Revision Entry',
          profile: 'case_study',
          view: 'article',
          visibility: 'public',
        },
        {
          body_md: 'Initial version 1 from 2022.',
          body_hash: 'hash-v1',
          written_at: '2022-01-10T10:00:00Z',
          valid_from: '2022-01-10T10:00:00Z',
          temporal_level: 'exact',
          is_hindsight: false,
        }
      );

      await repo.createRevision(created.entry.id, {
        body_md: 'Updated version 2 from 2024 with later hindsight.',
        body_hash: 'hash-v2',
        written_at: '2024-05-20T10:00:00Z',
        valid_from: '2024-05-20T10:00:00Z',
        temporal_level: 'exact',
        is_hindsight: false,
      });

      // Query present day
      const resPresent = await renderEntryDetailPage(repo, 'multi-rev-entry');
      expect(resPresent.html).toContain('Updated version 2 from 2024 with later hindsight.');
      expect(resPresent.html).not.toContain('Initial version 1 from 2022.');

      // Query as of 2023 (should see v1)
      const res2023 = await renderEntryDetailPage(repo, 'multi-rev-entry', undefined, '2023-01-01');
      expect(res2023.html).toContain('Initial version 1 from 2022.');
      expect(res2023.html).not.toContain('Updated version 2 from 2024 with later hindsight.');
      expect(res2023.html).toContain('(historical revision)');
    });
  });

  describe('WP-5.1: Admin Operations, Calibration, Scoped Constraints & Settings Screen (20261020-UX-09)', () => {
    it('4. Admin settings index and modules render plain-language List rows and single-column forms', async () => {
      const html = await renderAdminSettingsPage(repo);

      expect(html).toContain('Settings');
      expect(html).toContain('/admin/settings/answering');
      expect(html).toContain('/admin/settings/providers');
      expect(html).toContain('/admin/settings/appearance');
      expect(html).toContain('/admin/settings/notifications');
      expect(html).toContain('/admin/settings/backups');
      expect(html).toContain('Not set up');
      expect(html).not.toContain('not_configured');
      const bodyOnly = html.split('</head>')[1] ?? html;
      expect(bodyOnly).not.toContain('Tier 1');
    });
  });

  describe('WP-5.2: First-Run 6-Step Setup Wizard, Login Throttling & Lockdown (20261020-UX-01)', () => {
    it('1. renderAdminSetupPage renders all 6 wizard steps, progress indicator, and walkthrough card', () => {
      const html = renderAdminSetupPage();

      // Stepper header and progress bar (D-LAYOUT #6)
      expect(html).toContain('Step 1 of 6 · Account');
      expect(html).toContain('id="wizard-progress-fill"');
      expect(html).not.toContain('id="step-lbl-1"');

      // Step 1: Owner Account Setup
      expect(html).toContain('id="wizard-step-1"');
      expect(html).toContain('id="setup-username"');
      expect(html).toContain('id="setup-password"');
      expect(html).toContain('id="setup-totp-secret"');
      expect(html).toContain('id="btn-continue-step2"');

      // Step 2: Hosting Option & Preset
      expect(html).toContain('id="wizard-step-2"');
      expect(html).toContain('value="hobbyist-docker"');
      expect(html).toContain('value="private-local"');
      expect(html).toContain('value="reliable-low-cost"');
      expect(html).toContain('id="setup-origin-url"');

      // Step 3: Model Providers & Privacy Router
      expect(html).toContain('id="wizard-step-3"');
      expect(html).toContain('Local ONNX');
      expect(html).toContain('OpenAI Compatible');
      expect(html).toContain('Anthropic');
      expect(html).toContain('Ollama');
      expect(html).toContain('Privacy Boundary:');

      // Step 4: Notifications & Alerts
      expect(html).toContain('id="wizard-step-4"');
      expect(html).toContain('id="setup-notification-channel"');
      expect(html).toContain('id="setup-notification-target"');
      expect(html).toContain('id="btn-setup-test-alert"');
      expect(html).toContain('id="setup-alert-result"');

      // Step 5: Encrypted Backup Destination
      expect(html).toContain('id="wizard-step-5"');
      expect(html).toContain('id="setup-backup-dest"');
      expect(html).toContain('id="setup-age-key"');
      expect(html).toContain('id="btn-setup-test-drill"');
      expect(html).toContain('id="setup-drill-result"');

      // Step 6: Theme Selection & First-Run Walkthrough
      expect(html).toContain('id="wizard-step-6"');
      expect(html).toContain('Editorial Classic');
      expect(html).toContain('Modern Monospace');
      expect(html).toContain('Minimalist Sans');
      expect(html).toContain('Worked Example: Case Study Profile');
      expect(html).toContain('Now try one of yours — create your first case study or launch the Import Planner');
      expect(html).toContain('id="btn-setup-finish-login"');
      expect(html).toContain('id="btn-setup-launch-import"');
    });

    it('2. renderAdminLoginPage renders credentials form and handles 429 throttling message', () => {
      const html = renderAdminLoginPage();
      expect(html).toContain('id="login-username"');
      expect(html).toContain('id="login-password"');
      expect(html).toContain('id="login-totp"');
      expect(html).toContain('id="login-error"');
      expect(html).toContain('res.status === 429');
      expect(html).toContain('Too many failed login attempts');
      expect(html).toContain('sanitizeNext');
    });
  });

  describe('WP-5.3: Sub-Route Mounting in createApp & Multi-Pass Redaction Drawer (Fix F1, 20261020-UX-03)', () => {
    it('1. renderAdminEntriesPage renders pre-publish redaction check dialog and action controls (§4.3, 20261020-UX-03, WP-15.4)', async () => {
      const repo = createTestClient();
      const html = await renderAdminEntriesPage(repo, { isNew: true });

      // Publish dialog with pre-publish redaction scan status & confirm controls
      expect(html).toContain('id="ref-publish-dialog"');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('id="ref-publish-dialog-title"');
      expect(html).toContain('id="ref-publish-dialog-status"');
      expect(html).toContain('id="ref-publish-confirm"');
    });
  });

  describe('createWebApp HTTP Route Decoupling (OSR-13, §4.2)', () => {
    it('serves public routes, admin pages, RSS feed, and sitemap over HTTP fetch without DB imports', async () => {
      const { app } = createWebApp({ client: repo as any });

      const homeRes = await app.fetch(new Request('http://localhost/'));
      expect(homeRes.status).toBe(200);
      const homeHtml = await homeRes.text();
      expect(homeHtml).toContain('Strata timeline');

      const workRes = await app.fetch(new Request('http://localhost/work'));
      expect(workRes.status).toBe(200);

      const entryRes = await app.fetch(new Request('http://localhost/work/advisory-locks-revisited'));
      expect(entryRes.status).toBe(200);

      const timelineRes = await app.fetch(new Request('http://localhost/timeline'));
      expect(timelineRes.status).toBe(200);

      const rssRes = await app.fetch(new Request('http://localhost/rss.xml'));
      expect(rssRes.status).toBe(200);
      expect(rssRes.headers.get('content-type')).toContain('application/rss+xml');

      const sitemapRes = await app.fetch(new Request('http://localhost/sitemap.xml'));
      expect(sitemapRes.status).toBe(200);
      expect(sitemapRes.headers.get('content-type')).toContain('application/xml');

      const adminRes = await app.fetch(new Request('http://localhost/admin/login'));
      expect(adminRes.status).toBe(200);
    });
  });

  describe('WP-11.4: Full Markdown Engine, Design Tokens & Responsive Multi-Pane Layout', () => {
    it('1. Markdown Engine parses CommonMark/GFM with demotion, fenced code, tables, and sanitization (F4, 20261020-UI-01)', () => {
      const markdown = `
# Main Header
Introductory text with **bold** and *italic* and \`inline code\`.

## Section Two
A list of items:
- Item one
- Item two with [safe link](/work/test)

### Subsection Three
\`\`\`typescript
const x: number = 42;
console.log(x);
\`\`\`

> A notable insight from production.

| Metric | Redis Redlock | Postgres 15 |
|---|---|---|
| Contention | High | Zero |
| Latency P99 | 62ms | 20ms |

<script>alert('xss')</script>
<a href="javascript:steal()">bad link</a>
      `;

      const rendered = renderMarkdown(markdown);

      // Heading demotion: # demotes to <h2>, ## to <h3>, ### to <h4>
      expect(rendered).toContain('<h2>Main Header</h2>');
      expect(rendered).toContain('<h3>Section Two</h3>');
      expect(rendered).toContain('<h4>Subsection Three</h4>');
      expect(rendered).not.toContain('<h1>Main Header</h1>');

      // Inline styles and safe links
      expect(rendered).toContain('<strong>bold</strong>');
      expect(rendered).toContain('<em>italic</em>');
      expect(rendered).toContain('<code class="inline-code">inline code</code>');
      expect(rendered).toContain('<a href="/work/test">safe link</a>');

      // Fenced code block with language class
      expect(rendered).toContain('<pre class="code-block language-typescript"><code class="language-typescript">const x: number = 42;\nconsole.log(x);</code></pre>');

      // Blockquote
      expect(rendered).toContain('<blockquote class="reading-quote"><p>A notable insight from production.</p></blockquote>');

      // Table
      expect(rendered).toContain('<table class="data-table">');
      expect(rendered).toContain('<th>Metric</th>');
      expect(rendered).toContain('<th>Redis Redlock</th>');
      expect(rendered).toContain('<td>High</td>');

      // Security sanitization: strip executable script tags and escape raw tags
      expect(rendered).not.toContain('<script>');
      expect(rendered).toContain('&lt;script&gt;');
      expect(rendered).not.toContain('href="javascript:steal()"');
    });

    it('2. Multi-tier design tokens define D-MIN primitives, semantics, scale, and layout-max (20261020-UI-02, D-MIN)', () => {
      // D-MIN 8 Scale {12, 14, 16, 24}
      expect(PRIMITIVE_TOKENS).toContain('--type-caption-size: 12px;');
      expect(PRIMITIVE_TOKENS).toContain('--type-body-sm-size: 14px;');
      expect(PRIMITIVE_TOKENS).toContain('--type-body-size: 16px;');
      expect(PRIMITIVE_TOKENS).toContain('--type-page-title-size: 24px;');
      expect(PRIMITIVE_TOKENS).toContain('--radius-control: 4px;');
      expect(PRIMITIVE_TOKENS).toContain('--radius-overlay: 8px;');

      // Breakpoints
      expect(PRIMITIVE_TOKENS).toContain('--bp-sm: 480px;');
      expect(PRIMITIVE_TOKENS).toContain('--bp-md: 768px;');
      expect(PRIMITIVE_TOKENS).toContain('--bp-lg: 1024px;');
      expect(PRIMITIVE_TOKENS).toContain('--bp-xl: 1280px;');

      // Semantic tokens
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--surface-page: #FFFFFF;');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--surface-raised: #FFFFFF;');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--border-control: #6B7B88;');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--layout-max: 1180px;');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--size-layout-max: 1180px;');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--measure-reading: 68ch;');

      // Dark semantic tokens
      expect(SEMANTIC_TOKENS_DARK).toContain('--surface-page: #0F1A22;');
      expect(SEMANTIC_TOKENS_DARK).toContain('--surface-raised: #16232D;');

      // Component tokens
      expect(COMPONENT_TOKENS).toContain('--admin-nav-width: 240px;');
      expect(COMPONENT_TOKENS).toContain('--admin-inspector-width: 340px;');
      expect(COMPONENT_TOKENS).toContain('--editor-min-height: 60vh;');
    });

    it('3. Component layer: Field, Button, Chip, and EntryRow abstractions (20261020-UI-04, D-MIN)', () => {
      // Field abstraction
      const fieldHtml = renderField({
        kind: 'input',
        id: 'user-email',
        name: 'email',
        inputType: 'email',
        label: 'Email address',
        help: 'We will send your escalation receipt here',
        error: 'Please enter a valid email address',
        required: true,
      });
      expect(fieldHtml).toContain('for="user-email"');
      expect(fieldHtml).toContain('id="user-email-help"');
      expect(fieldHtml).toContain('id="user-email-error"');
      expect(fieldHtml).toContain('role="alert"');
      expect(fieldHtml).toContain('Email address');

      // Button abstraction
      const btnPrimary = renderButton({ label: 'Save Draft', variant: 'primary' });
      expect(btnPrimary).toContain('class="lp-btn lp-btn-primary lp-btn-md"');

      const btnSecondary = renderButton({ label: 'View Profile', variant: 'secondary' });
      expect(btnSecondary).toContain('class="lp-btn lp-btn-secondary lp-btn-md"');

      const btnLoading = renderButton({ label: 'Publishing...', loading: true, disabled: true });
      expect(btnLoading).toContain('aria-busy="true"');
      expect(btnLoading).toContain('disabled');

      // Chip abstraction
      const chipFilter = renderChip({ label: 'Worked', interactive: true, selected: true });
      expect(chipFilter).toContain('lp-chip lp-chip-confirmed lp-chip-selected');

      const chipProvisional = renderChip({ label: 'Suggested Role', state: 'suggested' });
      expect(chipProvisional).toContain('lp-chip-suggested');

      // Unified EntryRow
      const entryRow = renderEntryRow({
        id: 'e1',
        title: 'Unified Design Token Pipeline',
        slug: 'token-pipeline',
        profile: 'case-study',
        valid_from: '2026-10-15',
        outcome: 'worked',
      }, {
        basePath: '/work',
        level: 'L2',
        summary: 'A multi-tier design token architecture for living-portfolio.',
      });
      expect(entryRow).toContain('class="entry-row"');
      expect(entryRow).toContain('href="/work/token-pipeline"');
      expect(entryRow).toContain('Unified Design Token Pipeline');
      expect(entryRow).toContain('Structured');
      expect(entryRow).toContain('A multi-tier design token architecture for living-portfolio.');
    });

    it('4. Admin entries page renders editor workspace with status line and editor controls (20261020-UI-01, 20261020-UI-06, WP-15.4)', async () => {
      const html = await renderAdminEntriesPage(repo, { isNew: true });
      expect(html).toContain('id="ref-main"');
      expect(html).toContain('id="ref-status-line"');
      expect(html).toContain('id="ref-field-title"');
      expect(html).toContain('id="ref-field-body"');
      expect(html).toContain('id="ref-btn-save"');
      expect(html).toContain('id="ref-switch-settings"');
    });

    it('5. Slot layout composers fulfill core slot contracts and renderLayout supports nonces (20261020-UI-10)', () => {
      const articleHtml = renderEntryArticleWithSlots({
        header: '<h1>Article Title</h1>',
        contextStrip: '<div>Context badges</div>',
        body: '<p>Article body</p>',
        marginRail: '<div>Margin rail notes</div>',
      });
      expect(articleHtml).toContain('class="entry-article-view"');
      expect(articleHtml).toContain('class="entry-margin-rail"');

      // Nonce support in layout
      const layoutWithNonce = renderLayout('Test Page', '/test', '<p>Hello</p><script>console.log("hi")</script>', {
        nonce: 'rAnd0mN0nc3',
      });
      expect(layoutWithNonce).toContain('<style nonce="rAnd0mN0nc3">');
      expect(layoutWithNonce).toContain('<script nonce="rAnd0mN0nc3">');
    });
  });

  describe('WP-12.1: Strata Timeline Visual Overhaul & Typography Craft (20261020-UI-05, UI-08, UI-09)', () => {
    it('1. Overhauls Strata timeline into continuous time axis with empty month hairlines and profile glyphs (20261020-UI-05)', async () => {
      const { html, visibleSlugs } = await renderStrataTimelineSection(repo);

      // Continuous axis renders empty months as hairlines
      expect(html).toContain('class="strata-band strata-band-empty"');
      expect(html).toContain('class="band-empty-hairline"');
      expect(html).toContain('data-count="0"');

      // Profile glyphs and pattern data attributes on active bands
      expect(html).toContain('data-profile="case-study"');
      expect(html).toContain('data-profile="design-project"');
      expect(html).toContain('class="band-glyphs"');
      expect(html).toContain('■'); // Case study glyph
      expect(html).toContain('▲'); // Design project glyph

      // Legend promises and defines all three glyphs and venture notch
      expect(html).toContain('■</span> Case study');
      expect(html).toContain('◆</span> Decision record');
      expect(html).toContain('▲</span> Design project');
      expect(html).toContain('class="band-venture-notch"');
    });

    it('2. Scales band heights non-linearly (square-root) and renders as-of cursor with slider semantics (20261020-UI-05)', async () => {
      // Scrub to a historical date
      const { html } = await renderStrataTimelineSection(repo, '2024-03-15T00:00:00Z');

      // As-of slider cursor is rendered with handle
      expect(html).toContain('id="strata-cursor"');
      expect(html).toContain('role="slider"');
      expect(html).toContain('aria-label="As of date cursor"');
      expect(html).toContain('aria-valuetext="2024-03-15"');
      expect(html).toContain('Viewing as of 2024-03');

      // Band height matches square-root formula Math.min(120, Math.round(52 + Math.sqrt(count) * 28))
      // e.g. for count=1: 80px
      expect(html).toMatch(/style="height:(?:80|92|100|120|44)px"/);
    });

    it('3. Applies active role styling (.role-marker, .role-goal to .role-lesson) without inline border styles (20261020-UI-08)', async () => {
      const res = await renderEntryDetailPage(repo, 'advisory-locks-revisited', 'structured');
      expect(res.status).toBe(200);

      // Role section classes and marker classes applied
      expect(res.html).toContain('class="role-section role-goal"');
      expect(res.html).toContain('class="role-marker role-goal"');

      // No inline border-left styles overriding CSS classes
      expect(res.html).not.toMatch(/style="[^"]*border-left:\s*3px solid var\(--role-/);
    });

    it('4. Renders claim items text-first without card grid boxes (20261020-UI-08)', async () => {
      const res = await renderEntryDetailPage(repo, 'advisory-locks-revisited');
      expect(res.status).toBe(200);

      // Text-first claim items
      expect(res.html).toContain('class="claim-item"');
      expect(res.html).toContain('class="claim-meta"');
      expect(res.html).toContain('class="claim-text"');

      // No inline box styles with card borders
      expect(res.html).not.toMatch(/style="margin-bottom:8px;padding:8px;border:1px solid var\(--rule\);background:var\(--surface-raised\)"/);
    });

    it('5. Typography craft: tabular numerals, text-wrap tuning, and differentiation date glyph (20261020-UI-09)', async () => {
      const res = await renderEntryDetailPage(repo, 'advisory-locks-revisited');
      expect(res.status).toBe(200);

      // Tabular numerals applied to entry date line
      expect(res.html).toContain('class="entry-date-line tabular-nums"');

      // Two-layer strata date glyph differentiation device
      expect(res.html).toContain('class="strata-date-glyph');
      expect(res.html).toContain('class="strata-glyph-layer happened-layer"');
      expect(res.html).toContain('class="strata-glyph-layer written-layer');

      // Hindsight entry has shifted layer
      const resHindsight = await renderEntryDetailPage(repo, 'premature-microservices-retrospective');
      expect(resHindsight.html).toContain('is-hindsight');
      expect(resHindsight.html).toContain('written-layer shifted');
    });
  });

  describe('WP-12.2: Actionable Error Messages & String Architecture (20261020-CP-04, CP-06, CP-07)', () => {
    it('1. Formats Month Year and entry date lines according to Spec §12.6 (20261020-CP-06)', () => {
      expect(formatMonthYear('2024-03-12T00:00:00Z')).toBe('March 2024');
      expect(formatEntryDateLine('2024-03-12', '2026-09-01', true)).toBe(
        'Happened March 2024. Written September 2026, looking back.'
      );
      expect(formatEntryDateLine('2026-10-19', '2026-10-19', false)).toBe('Written October 2026.');
    });

    it('2. Intl-backed pluralization and ICU templating (20261020-CP-06)', () => {
      expect(formatPlural(1, 'entry', 'entries')).toBe('1 entry');
      expect(formatPlural(4, 'entry', 'entries')).toBe('4 entries');
      expect(
        formatIcu('{count, plural, one {# entry} other {# entries}} active', { count: 3 })
      ).toBe('3 entries active');
    });

    it('3. Three-part actionable error formatting (20261020-CP-04)', () => {
      const err = formatActionableError({
        action: "Can't reach the server",
        reason: "Answers aren't available right now",
        recovery: 'Try again in a minute, or book a conversation.',
      });
      expect(err).toBe(
        "Can't reach the server. Answers aren't available right now. Try again in a minute, or book a conversation."
      );
    });

    it('4. Ask page renders invalid_query branch with actionable card (20261020-CP-04, CP-07)', async () => {
      const askHtml = await renderAskPage();
      expect(askHtml).toContain('data.tier === \'invalid_query\'');
      expect(askHtml).toContain('Type a question to ask. It can be up to 1000 characters.');
      expect(askHtml).toContain('role="alert"');
      expect(askHtml).toContain('tierLabels');
      expect(askHtml).toContain('invalid_query: "Type a question to ask"');
    });

    it('5. Entry row renders per-entry lang attribute when set (20261020-CP-06)', () => {
      const rowHtml = renderEntryRow({
        slug: 'mon-article',
        title: 'Mon Article',
        profile: 'case-study',
        lang: 'fr',
        valid_from: '2024-03-01T00:00:00Z',
      });
      expect(rowHtml).toContain('lang="fr"');
      expect(rowHtml).toContain('March 2024');
    });
  });

  describe('WP-13.5: Wizard Wording, States & Zero-Vendor Scan (UX-29, UX-33, CP-14, CP-15)', () => {
    it('1. Setup markup has zero hardcoded vendor, model, or sample worked-example names (CP-15)', () => {
      const rendererSource = readFileSync(new URL('./pages/admin/setup.ts', import.meta.url), 'utf8');
      const setupFnMatch = rendererSource.match(/export function renderAdminSetupPage\(\)[\s\S]*?return render(?:Layout|AuthShell|AdminShell)/);
      expect(setupFnMatch).toBeTruthy();
      const setupMarkup = setupFnMatch![0];

      expect(setupMarkup).not.toContain('OpenAI');
      expect(setupMarkup).not.toContain('Anthropic');
      expect(setupMarkup).not.toContain('Ollama');
      expect(setupMarkup).not.toContain('bge-small-en-v1.5');
      expect(setupMarkup).not.toContain('gpt-4o-mini');
      expect(setupMarkup).not.toContain('claude-3-5-sonnet');
      expect(setupMarkup).not.toContain('llama3.3');
      expect(setupMarkup).not.toContain('Scaling payment reconciliation');
      expect(setupMarkup).not.toContain('idempotent bisimulation');
    });

    it('2. Exactly one primary action (.btn-primary) per wizard step (UX-29)', () => {
      const html = renderAdminSetupPage();
      for (let step = 1; step <= 6; step++) {
        const stepMatch = html.match(new RegExp(`<div id="wizard-step-${step}"[\\s\\S]*?(?=<div id="wizard-step-${step + 1}"|</div>\\s*<script>)`));
        expect(stepMatch).toBeTruthy();
        const stepHtml = stepMatch![0];
        const primaryMatches = stepHtml.match(/class="[^"]*btn-primary[^"]*"/g) || [];
        expect(primaryMatches.length).toBe(1);
      }
    });

    it('3. Hosting options reflect §6.8 plain-language descriptions without jargon (CP-14)', () => {
      const html = renderAdminSetupPage();
      expect(html).toContain('Everything runs in one Docker stack you control. The simplest setup.');
      expect(html).toContain('AI runs on your own machine and nothing is sent to outside services.');
      expect(html).toContain('Needs less hardware and gives better written answers.');
    });
  });

  describe('WP-13.6: Login and Sign-Out (UX-31, UX-41)', () => {
    it('1. Login screen renders 6-digit TOTP explainer and recovery code toggle (UX-31)', () => {
      const html = renderAdminLoginPage();
      expect(html).toContain('id="login-code-label"');
      expect(html).toContain('6-Digit Authenticator Code');
      expect(html).toContain('id="login-code-help"');
      expect(html).toContain('Enter the 6-digit verification code from your authenticator app');
      expect(html).toContain('id="btn-toggle-recovery"');
      expect(html).toContain('Lost your authenticator device? Sign in with a recovery code');
    });

    it('2. Layout includes Sign out button on admin pages but not public or login pages (UX-41)', () => {
      const adminHtml = renderLayout('Admin', '/admin', '<div>Admin content</div>');
      expect(adminHtml).toContain('id="btn-admin-logout"');
      expect(adminHtml).toContain('Sign out');

      const loginHtml = renderLayout('Login', '/admin/login', '<div>Login content</div>');
      expect(loginHtml).not.toContain('id="btn-admin-logout"');

      const setupHtml = renderLayout('Setup', '/admin/setup', '<div>Setup content</div>');
      expect(setupHtml).not.toContain('id="btn-admin-logout"');

      const publicHtml = renderLayout('Home', '/', '<div>Home content</div>');
      expect(publicHtml).not.toContain('id="btn-admin-logout"');
    });
  });

  describe('WP-13.7: Standalone Admin Guard & Deployment Truth (UX-05, UX-32)', () => {
    it('1. Unauthenticated requests to /admin in standalone mode redirect to /admin/login (UX-05)', async () => {
      const { app } = createWebApp({
        client: repo as any,
        checkSession: async () => ({ authenticated: false, setupRequired: false }),
      });

      const res = await app.fetch(new Request('http://localhost/admin'));
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/admin/login');

      const settingsRes = await app.fetch(new Request('http://localhost/admin/settings'));
      expect(settingsRes.status).toBe(302);
      expect(settingsRes.headers.get('location')).toBe('/admin/login');

      const importRes = await app.fetch(new Request('http://localhost/admin/import'));
      expect(importRes.status).toBe(302);
      expect(importRes.headers.get('location')).toBe('/admin/login');
    });

    it('2. Authenticated requests to /admin in standalone mode render 200 OK (UX-05)', async () => {
      const { app } = createWebApp({
        client: repo as any,
        checkSession: async () => ({ authenticated: true, setupRequired: false }),
      });

      const res = await app.fetch(new Request('http://localhost/admin'));
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('id="main-content"');
      expect(text).toContain('Today');
      expect(text).toContain('Entries');
    });

    it('3. /admin/setup redirects to /admin/login when setup already completed and unauthenticated (UX-05)', async () => {
      const { app } = createWebApp({
        client: repo as any,
        checkSession: async () => ({ authenticated: false, setupRequired: false }),
      });

      const res = await app.fetch(new Request('http://localhost/admin/setup'));
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/admin/login');
    });

    it('4. /admin/setup renders 200 OK when setup is required (UX-05)', async () => {
      const { app } = createWebApp({
        client: repo as any,
        checkSession: async () => ({ authenticated: false, setupRequired: true }),
      });

      const res = await app.fetch(new Request('http://localhost/admin/setup'));
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('Create Owner Account');
    });
  });

  describe('WP-13.8: Recovery-Code Sign-In & Normalisation (UX-31)', () => {
    it('1. Login code input has no truncating maxlength attribute (UX-31)', () => {
      const html = renderAdminLoginPage();
      expect(html).toContain('id="login-totp"');
      expect(html).not.toMatch(/id="login-totp"[^>]*maxlength/);
    });

    it('2. Script contains paste rejection for multi-line lists and specific recovery error copy (UX-31)', () => {
      const html = renderAdminLoginPage();
      expect(html).toContain('Enter one code at a time');
      expect(html).toContain("That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once.");
    });
  });
});
