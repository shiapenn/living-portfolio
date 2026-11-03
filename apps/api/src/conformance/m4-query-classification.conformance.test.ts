import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import { MockModelProvider } from '@living-portfolio/ai';
import { createApp } from '../app.js';

describe('M4 Query Classification, About Path & Needs-Context Conformance (§10.3, §12.6, Finding M4, Fix 4, Fix 15)', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);
  });

  it('classifies queries using model provider and adheres to §10.3 strict advisory default for ambiguous cases', async () => {
    const provider = new MockModelProvider('test-provider', 'Mock Classifier Provider');
    const { app } = createApp(repo, { providers: [provider] });

    // 1. Factual lookup query
    const lookupRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you use for webhook locks in 2021?',
      }),
    });
    expect(lookupRes.status).toBe(200);
    const lookupBody = await lookupRes.json();
    expect(lookupBody.queryClass).toBe('lookup');
    expect(lookupBody.tier).toBe('tier1');

    // 2. Author/Site about query
    const aboutRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Who are you and what do you work on?',
      }),
    });
    expect(aboutRes.status).toBe(200);
    const aboutBody = await aboutRes.json();
    expect(aboutBody.queryClass).toBe('about');
    expect(aboutBody.tier).toBe('tier1');

    // 3. Ambiguous query defaults strictly to advisory (§10.3)
    const ambiguousRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Database locking strategies',
      }),
    });
    expect(ambiguousRes.status).toBe(200);
    const ambiguousBody = await ambiguousRes.json();
    expect(ambiguousBody.queryClass).toBe('advisory');
  });

  it('answers About path queries from About page records and settings with /about citation (§10.3)', async () => {
    const provider = new MockModelProvider('about-provider', 'About Provider');
    const { app } = createApp(repo, { providers: [provider] });

    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Tell me about your background and verified credentials.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.queryClass).toBe('about');
    expect(body.tier).toBe('tier1');
    expect(body.citations.length).toBeGreaterThan(0);
    expect(body.citations[0].url).toBe('/about');
    expect(body.citations[0].title).toContain('About');
    expect(body.answer).toBeDefined();
    expect(body.disclosure).toContain('About Provider');

    // Test About path extractive degradation when no model provider is available
    const unconfiguredApp = createApp(repo, { providers: [] });
    const extRes = await unconfiguredApp.app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Who are you?',
      }),
    });

    expect(extRes.status).toBe(200);
    const extBody = await extRes.json();
    expect(extBody.queryClass).toBe('about');
    expect(extBody.tier).toBe('tier1');
    expect(extBody.degradationStep).toBe('extractive');
    expect(extBody.citations[0].url).toBe('/about');
    expect(extBody.disclosure).toContain('excerpts');
  });

  it('returns needs_context state with missing hard facets on first-time advisory queries (§10.5, §12.6, G6)', async () => {
    const provider = new MockModelProvider('adv-provider', 'Advisory Provider');
    const { app } = createApp(repo, { providers: [provider] });

    // Advisory query without visitor facets
    const res = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should I use Redis or PostgreSQL for distributed locking?',
        facets: {},
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('needs_context');
    expect(body.queryClass).toBe('advisory');
    expect(Array.isArray(body.missingFacets)).toBe(true);
    expect(body.missingFacets.length).toBeGreaterThan(0);
    expect(body.answer).toContain('architecture or environment');
  });

  it('allows visitor to supply context or skip needs_context without repeated prompts (§6.1, §10.3, §12.6)', async () => {
    const provider = new MockModelProvider('adv-provider', 'Advisory Provider');
    const { app } = createApp(repo, { providers: [provider] });

    // 1. Visitor answers with required facet (e.g., database: PostgreSQL)
    const suppliedRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should I use Redis or PostgreSQL for distributed locking?',
        facets: { database: 'PostgreSQL', stack: 'Go' },
      }),
    });

    expect(suppliedRes.status).toBe(200);
    const suppliedBody = await suppliedRes.json();
    expect(suppliedBody.tier).not.toBe('needs_context');
    expect(suppliedBody.queryClass).toBe('advisory');

    // 2. Visitor explicitly skips facet entry via context_asked: true
    const skipRes = await app.request('/api/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should I use Redis or PostgreSQL for distributed locking?',
        facets: {},
        context_asked: true,
      }),
    });

    expect(skipRes.status).toBe(200);
    const skipBody = await skipRes.json();
    // When skipped, missing facets remain unknown, so it never loops back to needs_context
    expect(skipBody.tier).not.toBe('needs_context');
    expect(skipBody.queryClass).toBe('advisory');
  });
});
