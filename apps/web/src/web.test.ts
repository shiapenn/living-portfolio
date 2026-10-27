import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import {
  renderAdminImportPage,
  renderAdminWorkspacePage,
  renderAskPage,
  renderAskStatusPage,
  renderBookPage,
  renderBuildPage,
  renderEntryDetailPage,
  renderHomePage,
  renderTimelinePage,
  renderWorkOrWritingPage,
} from './index.js';

describe('Strata Public Site & Admin Workspace Renderer (§5, §12, §18.1)', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);
  });

  it('renders Home page with Strata Timeline, owner statement, and entries readable without JS (§1, §12.6)', async () => {
    const html = await renderHomePage(repo);
    expect(html).toContain('Strata timeline');
    expect(html).toContain('Advisory Locks, Revisited: Dropping Redis for Postgres 15');
    expect(html).toContain('--surface-page: #F3F5F4');
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

  it('renders Work, Build Ventures, Ask, and 3-Pane Admin Workspace (§5.1, §12.6)', async () => {
    const workHtml = await renderWorkOrWritingPage(repo, 'work');
    expect(workHtml).toContain('Work &amp; Case Studies');

    const buildHtml = await renderBuildPage(repo);
    expect(buildHtml).toContain('Strata Engine');
    expect(buildHtml).toContain('pg-pulse');

    const askHtml = await renderAskPage('What did you use to replace Redis?');
    expect(askHtml).toContain('aria-live="polite"');

    const adminHtml = await renderAdminWorkspacePage(repo);
    expect(adminHtml).toContain('Owner Admin Workspace');
    expect(adminHtml).toContain('L0 Text');
    expect(adminHtml).toContain('L3 Claims');
    expect(adminHtml).toContain('chip-suggested');
  });

  it('renders Structure Inspector with 5 tabs, ARIA attributes, and interactive controls (20261020-UX-06)', async () => {
    const adminHtml = await renderAdminWorkspacePage(repo);
    // Tablist & tabs
    expect(adminHtml).toContain('role="tablist"');
    expect(adminHtml).toContain('id="tab-btn-structure"');
    expect(adminHtml).toContain('id="tab-btn-context"');
    expect(adminHtml).toContain('id="tab-btn-evidence"');
    expect(adminHtml).toContain('id="tab-btn-answerability"');
    expect(adminHtml).toContain('id="tab-btn-history"');

    // Panels
    expect(adminHtml).toContain('id="panel-structure"');
    expect(adminHtml).toContain('id="panel-context"');
    expect(adminHtml).toContain('id="panel-evidence"');
    expect(adminHtml).toContain('id="panel-answerability"');
    expect(adminHtml).toContain('id="panel-history"');

    // Context & Evidence interactive forms
    expect(adminHtml).toContain('id="btn-add-facet"');
    expect(adminHtml).toContain('id="btn-attach-evidence"');
    expect(adminHtml).toContain('Evidence verification confirms artifact authenticity but does not prove the narrative.');
  });

  it('renders Editor Modes with Guided Mode prompts and Quick Log capture (20261020-UX-07)', async () => {
    const adminHtml = await renderAdminWorkspacePage(repo);
    // Mode switcher buttons
    expect(adminHtml).toContain('id="mode-btn-paste"');
    expect(adminHtml).toContain('id="mode-btn-guided"');
    expect(adminHtml).toContain('id="mode-btn-quick"');

    // Guided mode panel
    expect(adminHtml).toContain('id="editor-guided-panel"');
    expect(adminHtml).toContain('id="guided-problem"');
    expect(adminHtml).toContain('id="guided-approach"');
    expect(adminHtml).toContain('id="guided-outcome"');
    expect(adminHtml).toContain('id="guided-lesson"');
    expect(adminHtml).toContain('id="guided-nothing-wrong"');
    expect(adminHtml).toContain('id="btn-guided-compile"');

    // Quick log panel
    expect(adminHtml).toContain('id="editor-quick-panel"');
    expect(adminHtml).toContain('id="quick-log-text"');
    expect(adminHtml).toContain('id="btn-submit-quick-log"');

    // First-run walkthrough card
    expect(adminHtml).toContain('id="admin-walkthrough-card"');
    expect(adminHtml).toContain('First-Run Authoring Walkthrough');
  });

  it('renders Import & Triage page with 3-step planner and J K A R D S keyboard controls (20261020-UX-07)', async () => {
    const importHtml = await renderAdminImportPage(repo);
    expect(importHtml).toContain('Import &amp; Triage');
    expect(importHtml).toContain('class="triage-stepper"');
    expect(importHtml).toContain('id="step-tab-add"');
    expect(importHtml).toContain('id="step-tab-plan"');
    expect(importHtml).toContain('id="step-tab-triage"');

    // Add & Plan controls
    expect(importHtml).toContain('id="import-paste-area"');
    expect(importHtml).toContain('id="btn-generate-plan"');
    expect(importHtml).toContain('id="plan-free-est"');
    expect(importHtml).toContain('id="plan-paid-est"');

    // Triage controls and keyboard legend
    expect(importHtml).toContain('class="triage-keys-legend"');
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
    expect(askHtml).toContain('Unable to reach server');
    expect(askHtml).not.toContain('Origin unreachable');
  });

  it('renders skip link and home h1 heading for accessibility (20261020-UX-15)', async () => {
    const homeHtml = await renderHomePage(repo);
    expect(homeHtml).toContain('<a href="#main-content" class="skip-link">Skip to main content</a>');
    expect(homeHtml).toContain('<h1 class="visually-hidden">');
  });

  it('renders Booking page with prefilled topic and facets without alert() (20261020-UX-11)', () => {
    const html = renderBookPage('How did you scale postgres?', 'architecture, databases');
    expect(html).toContain('Book a Live Conversation (Tier 3)');
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

  it('renders interactive escalation review card in admin workspace (20261020-UX-08)', async () => {
    const saved = await repo.saveEscalation({
      question: 'Do you offer fractional CTO services?',
      draft: 'Yes, on select infrastructure projects.',
      query_class: 'advisory',
      status: 'pending',
      visitor_contact: 'client@startup.example',
      due_at: new Date(Date.now() + 86400000).toISOString(),
    });

    const adminHtml = await renderAdminWorkspacePage(repo);
    expect(adminHtml).toContain('Escalation Inbox — Tier 2 Review');
    expect(adminHtml).toContain(saved.id);
    expect(adminHtml).toContain('Do you offer fractional CTO services?');
    expect(adminHtml).toContain('escalation-draft-textarea');
    expect(adminHtml).toContain('btn-approve-escalation');
    expect(adminHtml).toContain('btn-reject-escalation');
    expect(adminHtml).toContain('client@startup.example');
  });
});
