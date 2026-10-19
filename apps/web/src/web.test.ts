import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import {
  renderAdminWorkspacePage,
  renderAskPage,
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
});
