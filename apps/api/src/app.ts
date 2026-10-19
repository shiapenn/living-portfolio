import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider } from '@living-portfolio/ai';
import { DEFAULT_STRATA_THEME } from '@living-portfolio/core';
import { createHealthRoutes } from './routes/health.js';
import { createEntriesRoutes } from './routes/entries.js';
import { createStructureRoutes } from './routes/structure.js';
import { createAskRoutes } from './routes/ask.js';
import { createTimelineRoutes } from './routes/timeline.js';
import { createInboxRoutes } from './routes/inbox.js';
import { createCalibrationRoutes } from './routes/calibration.js';
import { createAuditRoutes } from './routes/audit.js';
import { createImportRoutes } from './routes/import.js';
import { createSettingsRoutes, type RuntimeSettingsState } from './routes/settings.js';

export function createApp(customRepo?: InMemoryPortfolioRepository) {
  const app = new Hono();
  const repo = customRepo ?? new InMemoryPortfolioRepository();
  const governor = new BudgetGovernor();
  const mockProvider = new MockModelProvider();

  const runtimeState: RuntimeSettingsState = {
    automatedAnsweringEnabled: true,
    calibrationFrozen: false,
    simulatedDegradationMode: 'normal',
    tier1_floor: 0.82,
    tier2_floor: 0.55,
    facet_known_threshold: 0.9,
    setupWizardCompleted: true,
    theme: structuredClone(DEFAULT_STRATA_THEME),
  };

  // Global middleware
  app.use('*', logger());
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Mount routes
  app.route('/healthz', createHealthRoutes(async () => true));
  app.route('/api/entries', createEntriesRoutes(repo));
  app.route('/api/structure', createStructureRoutes(repo));
  app.route('/api/ask', createAskRoutes({
    repo,
    governor,
    providers: [mockProvider],
    tier1Floor: 0.82,
    tier2Floor: 0.55,
    getRuntimeSettings: () => runtimeState,
  }));
  app.route('/api/timeline', createTimelineRoutes(repo));
  app.route('/api/inbox', createInboxRoutes(repo));
  app.route('/api/calibration', createCalibrationRoutes(repo));
  app.route('/api/audit', createAuditRoutes(repo));
  app.route('/api/import', createImportRoutes(repo));
  app.route('/api/settings', createSettingsRoutes(repo, runtimeState));

  // Seed demo portfolio on demand
  app.post('/api/seed', async (c) => {
    await seedDemoPortfolio(repo);
    const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
    return c.json({ seeded: true, entriesCount: entries.length });
  });

  // Federation manifest (§17)
  app.get('/.well-known/living-portfolio.json', async (c) => {
    const publicEntries = await repo.listEntries({ visibility: ['public'] });
    return c.json({
      schema_version: 'qrxp_v1.0.0',
      owner: {
        name: 'Alex Rivera',
        statement: 'Distributed systems engineer & design technologist building time-aware software.',
      },
      domains: ['Database Infrastructure', 'Knowledge Systems', 'Design Systems & Accessibility'],
      public_entries_count: publicEntries.length,
      verified_credentials: [
        { type: 'github_gpg_commits', verified: true },
        { type: 'domain_dns_txt', verified: true },
      ],
      discoverable: false, // opt-in only per §17
    });
  });

  // RSS Feed (§5.1)
  app.get('/rss.xml', async (c) => {
    const entries = await repo.listEntries({ visibility: ['public'] });
    const items = entries
      .map(
        (e) =>
          `    <item>\n      <title>${e.title}</title>\n      <link>https://portfolio.example.com/writing/${e.slug}</link>\n      <pubDate>${new Date(e.created_at).toUTCString()}</pubDate>\n    </item>`
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>The Living Portfolio</title>\n    <link>https://portfolio.example.com</link>\n    <description>Time-aware personal portfolio and engineering log</description>\n${items}\n  </channel>\n</rss>`;
    return c.text(xml, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
  });

  // Sitemap XML (§5.1)
  app.get('/sitemap.xml', async (c) => {
    const entries = await repo.listEntries({ visibility: ['public'] });
    const urls = entries
      .map((e) => `  <url><loc>https://portfolio.example.com/work/${e.slug}</loc></url>`)
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://portfolio.example.com/</loc></url>\n  <url><loc>https://portfolio.example.com/work</loc></url>\n  <url><loc>https://portfolio.example.com/writing</loc></url>\n  <url><loc>https://portfolio.example.com/build</loc></url>\n  <url><loc>https://portfolio.example.com/timeline</loc></url>\n  <url><loc>https://portfolio.example.com/ask</loc></url>\n${urls}\n</urlset>`;
    return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
  });

  // Root welcome
  app.get('/', (c) => {
    return c.json({
      name: 'The Living Portfolio API',
      version: '0.1.0',
      status: 'online',
      schema_version: 'qrxp_v1.0.0',
      docs: '/healthz',
    });
  });

  return { app, repo, governor, mockProvider, runtimeState };
}
