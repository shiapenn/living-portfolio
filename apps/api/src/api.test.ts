import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from './app.js';

describe('Living Portfolio API Integration Tests', () => {
  let app: any;

  beforeEach(() => {
    const instance = createApp();
    app = instance.app;
  });

  it('GET /healthz returns healthy system status', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
    expect(body.version).toBe('0.1.0');
  });

  it('POST /api/entries creates entry, revision, chunks, and redaction warnings', async () => {
    const res = await app.request('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'high-concurrency-postgres',
        title: 'High Concurrency PostgreSQL Advisory Locks',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: `# The Goal\n\nWe needed to synchronize workers across our distributed cluster.\n\n# The Decision\n\nWe decided to use Postgres advisory locks instead of Redis.\n\n# What Happened\n\nIt reduced p99 latency by 40%.`,
        temporal_level: 'exact',
        valid_from: '2024-03-01T00:00:00Z',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.slug).toBe('high-concurrency-postgres');
    expect(body.spansCount).toBeGreaterThan(0);
    expect(Array.isArray(body.redactionWarnings)).toBe(true);
  });

  it('GET /api/entries/:slug computes structure level and gap questions', async () => {
    // 1. Create entry
    await app.request('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'distributed-locks',
        title: 'Distributed Locks in Practice',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: `We investigated distributed locking for our fleet.`,
        temporal_level: 'estimated',
      }),
    });

    // 2. Fetch entry
    const res = await app.request('/api/entries/distributed-locks');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.entry.slug).toBe('distributed-locks');
    expect(body.structureLevel).toBe('L0');
    expect(body.levelDetails.label).toBe('L0 Text');
    expect(body.gapQuestions.length).toBeGreaterThan(0);
  });

  it('POST /api/ask handles lookup and advisory queries with citations', async () => {
    // 1. Ingest published entry
    await app.request('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'cache-stampede-solution',
        title: 'Mitigating Cache Stampedes',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: `We solved cache stampedes using probabilistic early expiration algorithms with Redis and Node.js. It worked reliably under 50k requests per second.`,
        temporal_level: 'exact',
        valid_from: '2023-05-01T00:00:00Z',
      }),
    });

    // 2. Ask question
    const res = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What did you use to solve cache stampedes?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('tier1');
    expect(body.citations.length).toBeGreaterThan(0);
    expect(body.aiDisclosure).toContain('Automated answer');
  });

  it('GET /api/timeline returns Strata Timeline layers and as_of filtering', async () => {
    // Ingest historical entry
    await app.request('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'early-days-2020',
        title: 'Early Days Architecture',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: `Architecture decisions in 2020.`,
        temporal_level: 'exact',
        valid_from: '2020-04-15T00:00:00Z',
      }),
    });

    // Ingest newer entry
    await app.request('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'modern-era-2025',
        title: 'Modern Architecture',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
        body_md: `Architecture decisions in 2025.`,
        temporal_level: 'exact',
        valid_from: '2025-08-01T00:00:00Z',
      }),
    });

    const res = await app.request('/api/timeline?as_of=2021-01-01T00:00:00Z');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.strataBuckets.length).toBeGreaterThan(0);
    expect(body.timeTravelView).not.toBeNull();
    expect(body.timeTravelView.visibleEntries.some((e: any) => e.slug === 'early-days-2020')).toBe(true);
    expect(body.timeTravelView.futureExcludedCount).toBeGreaterThan(0);
  });
});
