import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { BudgetGovernor, MockModelProvider } from '@living-portfolio/ai';
import { createHealthRoutes } from './routes/health.js';
import { createEntriesRoutes } from './routes/entries.js';
import { createStructureRoutes } from './routes/structure.js';
import { createAskRoutes } from './routes/ask.js';
import { createTimelineRoutes } from './routes/timeline.js';
import { createInboxRoutes } from './routes/inbox.js';
import { createCalibrationRoutes } from './routes/calibration.js';
import { createAuditRoutes } from './routes/audit.js';
import { createImportRoutes } from './routes/import.js';
import { createSettingsRoutes } from './routes/settings.js';

export function createApp(customRepo?: InMemoryPortfolioRepository) {
  const app = new Hono();
  const repo = customRepo ?? new InMemoryPortfolioRepository();
  const governor = new BudgetGovernor();
  const mockProvider = new MockModelProvider();

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
  }));
  app.route('/api/timeline', createTimelineRoutes(repo));
  app.route('/api/inbox', createInboxRoutes(repo));
  app.route('/api/calibration', createCalibrationRoutes(repo));
  app.route('/api/audit', createAuditRoutes(repo));
  app.route('/api/import', createImportRoutes(repo));
  app.route('/api/settings', createSettingsRoutes());

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

  return { app, repo, governor, mockProvider };
}
