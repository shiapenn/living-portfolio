import { InMemoryPortfolioRepository, seedDemoPortfolio, type IPortfolioRepository } from '@living-portfolio/db';

/**
 * Synthetic Demo Portfolio Seed (`examples/seed-demo.ts`, OSR-04 §3.3 rule 7).
 * Runs ONLY by explicit command (`pnpm seed:demo`) or when `SEED_DEMO=true` in non-production environments.
 */
export async function runExampleDemoSeed(repo?: IPortfolioRepository): Promise<IPortfolioRepository> {
  if (process.env.DEPLOYMENT_CLASS === 'production') {
    throw new Error('[OSR-04] Refusing to seed synthetic demo data when DEPLOYMENT_CLASS=production.');
  }
  const targetRepo = repo ?? new InMemoryPortfolioRepository();
  await seedDemoPortfolio(targetRepo);
  return targetRepo;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExampleDemoSeed()
    .then(async (repo) => {
      const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
      console.log(`✓ Seeded ${entries.length} synthetic demo entries via examples/seed-demo.ts.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
