import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import {
  MockModelProvider,
  type ModelProvider,
  type CompletionRequest,
  type CompletionResponse,
} from '@living-portfolio/ai';
import { createApp } from '../app.js';

describe('M3 Conformance: Pre-delivery verification entailment judge, assertion stripping, citedScopes, and reconstruction labeling (§10.6, §10.8, Fix 14)', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);
  });

  it('1. Strips ungrounded assertions from synthesized answer before delivery (§10.6, M3)', async () => {
    // Model synthesizes one entailed statement and one fabricated cost reduction claim
    const partialHallucinatingProvider: ModelProvider = {
      id: 'mock-synthesis-stripper',
      name: 'Mock Synthesizer',
      isLocal: true,
      dataPolicy: { trainsOnInputs: false, retentionDays: 0, humanReview: false, zeroRetentionOption: true },
      limits: () => ({ rpm: 1000, tpm: 100000, dailyRequests: 10000, dailyTokens: 1000000 }),
      async listModels() { return ['mock']; },
      async complete(_req: CompletionRequest): Promise<CompletionResponse> {
        return {
          text: 'We replaced Redis Redlock with transaction-scoped PostgreSQL advisory locks. The migration reduced cloud operational costs by $200,000 per month.',
          usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
        };
      },
    };

    const { app } = createApp(repo, { providers: [partialHallucinatingProvider] });
    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How did you coordinate webhooks and what replaced Redis Redlock?',
        facets: { database: 'PostgreSQL' },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.tier).toBe('tier1');
    expect(body.verificationPassed).toBe(true);
    // Grounded assertion is preserved
    expect(body.answer).toContain('PostgreSQL');
    // Ungrounded assertion ($200,000) was stripped
    expect(body.answer).not.toContain('$200,000');
    expect(body.strippedAssertions).toBeDefined();
    expect(body.strippedAssertions.length).toBeGreaterThanOrEqual(1);
    expect(body.strippedAssertions[0]).toContain('$200,000');
  });

  it('2. Downgrades completely ungrounded or fabricated answer to extractive excerpts (§10.6, M3)', async () => {
    const completelyFabricatingProvider: ModelProvider = {
      id: 'mock-fabricator',
      name: 'Mock Fabricator',
      isLocal: true,
      dataPolicy: { trainsOnInputs: false, retentionDays: 0, humanReview: false, zeroRetentionOption: true },
      limits: () => ({ rpm: 1000, tpm: 100000, dailyRequests: 10000, dailyTokens: 1000000 }),
      async listModels() { return ['mock']; },
      async complete(_req: CompletionRequest): Promise<CompletionResponse> {
        return {
          text: 'We implemented Elasticsearch clusters with Pinecone vector indices across 10 regions.',
          usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
        };
      },
    };

    const { app } = createApp(repo, { providers: [completelyFabricatingProvider] });
    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you migrate to?',
        facets: {},
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    // Downgraded to extractive excerpts because verification failed
    expect(body.tier).toBe('extractive');
    expect(body.answer).toContain('synthesis verification downgraded');
    expect(body.answer).toContain('PostgreSQL');
    expect(body.answer).not.toContain('Elasticsearch');
  });

  it('3. Wires citedScopes into API responses and matches against visitor facets (§10.6, M3)', async () => {
    const provider = new MockModelProvider('grounded-mock');
    const { app } = createApp(repo, { providers: [provider] });

    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you migrate to and how did it perform?',
        facets: { database: 'PostgreSQL' },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.citedScopes).toBeDefined();
    expect(Array.isArray(body.citedScopes)).toBe(true);
    expect(body.citedScopes.length).toBeGreaterThanOrEqual(1);
    expect(body.citedScopes[0]).toMatchObject({
      database: 'PostgreSQL',
    });
  });

  it('4. Attaches explicit reconstruction labeling for time-travel queries and fallback degradation (§10.6, §10.8, M3)', async () => {
    const provider = new MockModelProvider('grounded-mock');
    const { app } = createApp(repo, { providers: [provider] });

    // 1. Time-travel query attaches reconstruction label
    const timeTravelRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How did you coordinate webhooks with Redis locks?',
        as_of_date: '2021-10-01T00:00:00Z',
      }),
    });

    expect(timeTravelRes.status).toBe(200);
    const ttBody = await timeTravelRes.json();
    expect(ttBody.isReconstruction).toBe(true);
    expect(ttBody.reconstructionNotice).toContain('Reconstructed from historical records as of 2021-10-01');

    // 2. Extractive degradation under simulated mode also labels reconstruction when as_of_date is set
    const { app: extractiveApp } = createApp(repo, {
      providers: [],
    });
    const extRes = await extractiveApp.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How did you coordinate webhooks with Redis locks?',
        as_of_date: '2021-10-01T00:00:00Z',
      }),
    });

    expect(extRes.status).toBe(200);
    const extBody = await extRes.json();
    expect(extBody.tier).toBe('extractive');
    expect(extBody.isReconstruction).toBe(true);
    expect(extBody.reconstructionNotice).toContain('Reconstructed from historical records');
  });
});
