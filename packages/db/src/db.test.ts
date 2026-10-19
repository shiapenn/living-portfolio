import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from './index.js';

describe('DB Package: Repository, Seed Corpus, Visibility Filter & Temporal Traversal (§3.11, §9, §10.4)', () => {
  it('seeds demo portfolio and strictly excludes private entries from visitor hybridSearch (§3.11)', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    const publicEntries = await repo.listEntries({ visibility: ['public'] });
    const allEntries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
    expect(allEntries.length).toBeGreaterThan(publicEntries.length);

    // Search for "Aurora" which only appears in the private NDA entry
    const privateSearch = await repo.hybridSearch('Aurora FPGA', {
      visibility: ['public'],
    });
    expect(privateSearch.length).toBe(0);

    // Search for "PostgreSQL advisory locks" in public entries
    const publicSearch = await repo.hybridSearch('PostgreSQL advisory locks', {
      visibility: ['public'],
    });
    expect(publicSearch.length).toBeGreaterThan(0);
  });

  it('excludes hindsight entries written in 2026 when querying as of 2023 (§3.9, §10.4)', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    const results2023 = await repo.hybridSearch('microservice split monolith', {
      visibility: ['public'],
      as_of_date: '2023-01-01T00:00:00Z',
    });
    expect(results2023.some((r) => r.entry.slug === 'premature-microservices-retrospective')).toBe(false);

    const results2026 = await repo.hybridSearch('microservice split monolith', {
      visibility: ['public'],
      as_of_date: '2026-06-01T00:00:00Z',
    });
    expect(results2026.some((r) => r.entry.slug === 'premature-microservices-retrospective')).toBe(true);
  });
});
