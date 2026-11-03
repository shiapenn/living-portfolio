import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

describe('WP-10.5: Import Planner Budgets, Resumable Jobs, Core Connectors & Notifications (Finding M9 / Fix 21, §4, §13.6, §14)', () => {
  let repo: InMemoryPortfolioRepository;
  let app: ReturnType<typeof createApp>['app'];
  let adminToken: string;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    const created = createApp(repo, { bootstrapAdminToken: 'test-admin-wp10-5' });
    app = created.app;
    adminToken = created.adminToken;
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
  });

  it('1. POST /api/import/plan enforces configured budgets and provides document preview (§13.6, Fix 21)', async () => {
    const documents = [
      {
        id: 'doc-arch',
        title: 'Architecture Overview',
        text: '# Architecture\n\n' + 'System description with extensive context. '.repeat(500), // ~25k chars, ~6.2k tokens
      },
      {
        id: 'doc-interview',
        title: 'Keynote Interview Audio',
        text: 'Summary notes from the technical talk.',
        audioDurationSeconds: 3600, // 60 minutes of audio
      },
    ];

    // Request plan with custom configured budgets (tight 2,000 token/day budget, 1,200 audio seconds/day)
    const res = await app.request('/api/import/plan', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        documents,
        config: {
          dailyTokenBudget: 2000,
          dailyAudioSecondsBudget: 1200,
          costPerMillionTokensUsd: 0.25,
          costPerAudioMinuteUsd: 0.015,
        },
      }),
    });

    expect(res.status).toBe(200);
    const plan = await res.json();

    expect(plan.documentCount).toBe(2);
    expect(plan.configuredBudget.dailyTokenBudget).toBe(2000);
    expect(plan.configuredBudget.dailyAudioSecondsBudget).toBe(1200);

    // Audio is 3600s / 1200s/day = 3 days; tokens are ~6.3k / 2k = 4 days
    expect(plan.daysWithinFree).toBeGreaterThanOrEqual(3);
    expect(plan.freePlanEstimate).toContain('within free limits');
    expect(plan.paidFastCostUsd).toBeGreaterThan(0);
    expect(plan.paidFastEstimate).toContain('Finish in minutes for ~$');

    // Document structured preview
    expect(plan.documentsPreview).toHaveLength(2);
    expect(plan.documentsPreview[0].id).toBe('doc-arch');
    expect(plan.documentsPreview[0].title).toBe('Architecture Overview');
    expect(plan.documentsPreview[0].wordCount).toBeGreaterThan(100);
    expect(plan.documentsPreview[1].audioDurationSeconds).toBe(3600);
  });

  it('2. Resumable import jobs checkpoint per document and survive interruptions (§13.6, Fix 21)', async () => {
    const items = [
      {
        id: 'item-1',
        title: 'Part 1: Genesis',
        slug: 'project-genesis',
        body_md: '# Genesis\n\nInitial startup notes and early architecture.',
        temporal_level: 'exact' as const,
        valid_from: '2023-01-10T00:00:00Z',
      },
      {
        id: 'item-2',
        title: 'Part 2: Scaling',
        slug: 'project-scaling',
        body_md: '# Scaling\n\nDatabase migration and shard topology.',
        temporal_level: 'exact' as const,
        valid_from: '2023-08-15T00:00:00Z',
      },
      {
        id: 'item-3',
        title: 'Part 3: Postmortem',
        slug: 'project-postmortem',
        body_md: '# Postmortem\n\nNetwork partition root-cause analysis.',
        temporal_level: 'exact' as const,
        valid_from: '2024-03-20T00:00:00Z',
      },
    ];

    // 1. Create a job without autoStart
    const createRes = await app.request('/api/import/jobs', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ items, autoStart: false }),
    });
    expect(createRes.status).toBe(201);
    const { job: initialJob } = await createRes.json();
    expect(initialJob.status).toBe('pending');
    expect(initialJob.total_documents).toBe(3);
    expect(initialJob.checkpoints).toHaveLength(0);

    // 2. Simulate manual partial checkpoint (e.g. item-1 was processed before a crash)
    const { entry: entry1, revision: rev1 } = await repo.createEntry(
      { slug: items[0].slug, title: items[0].title, visibility: 'private' },
      { body: items[0].body_md, written_at: items[0].valid_from }
    );
    await repo.updateImportJob(initialJob.id, {
      processed_count: 1,
      checkpoints: [
        {
          documentId: 'item-1',
          importedAt: new Date().toISOString(),
          entryId: entry1.id,
          revisionId: rev1.id,
          status: 'imported',
        },
      ],
      status: 'paused',
    });

    // 3. Inspect job status
    const statusRes = await app.request(`/api/import/jobs/${initialJob.id}`, {
      headers: authHeaders,
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.progress.processed).toBe(1);
    expect(statusData.progress.total).toBe(3);
    expect(statusData.remainingCount).toBe(2);

    // 4. Resume the job
    const resumeRes = await app.request(`/api/import/jobs/${initialJob.id}/resume`, {
      method: 'POST',
      headers: authHeaders,
    });
    expect(resumeRes.status).toBe(200);
    const resumeData = await resumeRes.json();
    expect(resumeData.resumed).toBe(true);
    expect(resumeData.resumedDocumentsCount).toBe(2);
    expect(resumeData.job.status).toBe('completed');
    expect(resumeData.job.processed_count).toBe(3);
    expect(resumeData.job.checkpoints).toHaveLength(3);

    // 5. Verify all three entries exist at L0 in the repository
    const entryCheck1 = await repo.getEntryBySlug('project-genesis');
    const entryCheck2 = await repo.getEntryBySlug('project-scaling');
    const entryCheck3 = await repo.getEntryBySlug('project-postmortem');
    expect(entryCheck1).toBeDefined();
    expect(entryCheck2).toBeDefined();
    expect(entryCheck3).toBeDefined();
  });

  it('3. Core source connectors expose declared permissions and crawl imported assets (§14, Fix 21)', async () => {
    // 1. List connectors
    const listRes = await app.request('/api/import/connectors', { headers: authHeaders });
    expect(listRes.status).toBe(200);
    const { connectors } = await listRes.json();
    expect(connectors).toHaveLength(3);

    const ghMeta = connectors.find((c: any) => c.id === 'github');
    expect(ghMeta).toBeDefined();
    expect(ghMeta.permissions.networkHosts).toContain('api.github.com');
    expect(ghMeta.permissions.dataClasses).toContain('public');

    const fileMeta = connectors.find((c: any) => c.id === 'file-drop');
    expect(fileMeta).toBeDefined();
    expect(fileMeta.permissions.dataClasses).toContain('sensitive');

    // 2. Crawl GitHub connector
    const ghCrawlRes = await app.request('/api/import/connectors/github/crawl', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        repo: 'org/repo',
        items: [
          {
            sha: 'commit-999',
            message: 'chore: configure replication\n\nSetup active-passive mirror',
            date: '2026-03-01T12:00:00Z',
          },
        ],
      }),
    });
    expect(ghCrawlRes.status).toBe(200);
    const ghData = await ghCrawlRes.json();
    expect(ghData.count).toBe(1);
    expect(ghData.assets[0].externalId).toBe('commit-999');
    expect(ghData.assets[0].temporalLevel).toBe('exact');

    // 3. Crawl File Drop connector
    const fileCrawlRes = await app.request('/api/import/connectors/file-drop/crawl', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        files: [
          {
            name: 'design-doc.md',
            content: '# Design Doc\n\nHigh-level topology notes.',
            modifiedAt: '2025-06-15T10:00:00Z',
            dataClass: 'private',
          },
        ],
      }),
    });
    expect(fileCrawlRes.status).toBe(200);
    const fileData = await fileCrawlRes.json();
    expect(fileData.count).toBe(1);
    expect(fileData.assets[0].title).toBe('design doc');
    expect(fileData.assets[0].facets?.data_class).toBe('private');
  });

  it('4. Concrete notification adapters send and test delivery across channels (§13.9, §14, Fix 21)', async () => {
    // 1. Unconfigured test returns honest 501 SIMULATED(M1) for backward compatibility
    const simRes = await app.request('/api/settings/notifications/test', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    expect(simRes.status).toBe(501);
    const simBody = await simRes.json();
    expect(simBody.code).toBe('SIMULATED');
    expect(simBody.finding).toBe('M1');

    // 2. Live test of ntfy adapter
    const ntfyRes = await app.request('/api/settings/notifications/test?live=true', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ channel: 'ntfy', topic: 'portfolio-live-test' }),
    });
    expect(ntfyRes.status).toBe(200);
    const ntfyBody = await ntfyRes.json();
    expect(ntfyBody.channel).toBe('ntfy');
    expect(ntfyBody.ok).toBe(true);

    // 3. Live test of webhook adapter
    const hookRes = await app.request('/api/settings/notifications/test?live=true', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ channel: 'webhook', url: 'https://webhook.site/live-test' }),
    });
    expect(hookRes.status).toBe(200);
    const hookBody = await hookRes.json();
    expect(hookBody.channel).toBe('webhook');
    expect(hookBody.ok).toBe(true);

    // 4. Live test of telegram adapter
    const tgRes = await app.request('/api/settings/notifications/test?live=true', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ channel: 'telegram', botToken: 'test-bot-token', chatId: '123456' }),
    });
    expect(tgRes.status).toBe(200);
    const tgBody = await tgRes.json();
    expect(tgBody.channel).toBe('telegram');
    expect(tgBody.ok).toBe(true);

    // 5. Live test of email adapter
    const emailRes = await app.request('/api/settings/notifications/test?live=true', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ channel: 'email', to: 'admin@portfolio.org' }),
    });
    expect(emailRes.status).toBe(200);
    const emailBody = await emailRes.json();
    expect(emailBody.channel).toBe('email');
    expect(emailBody.ok).toBe(true);
  });
});
