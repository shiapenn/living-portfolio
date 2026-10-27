import { serve } from '@hono/node-server';
import { loadConfig } from '@living-portfolio/config';
import { seedDemoPortfolio } from '@living-portfolio/db';
import { createApp } from './app.js';

const config = loadConfig();
const port = config.PORT;
const { app, repo } = createApp();

if (config.SEED_DEMO) {
  await seedDemoPortfolio(repo);
}

console.log(`Starting The Living Portfolio Server (Web + Admin + API) on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✓ Living Portfolio listening on http://localhost:${info.port}`);
  }
);
