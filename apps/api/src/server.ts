import { serve } from '@hono/node-server';
import { loadConfig } from '@living-portfolio/config';
import { seedDemoPortfolio } from '@living-portfolio/db';
import { createApp } from './app.js';
import { mountBundledWeb } from './adapter/bundled-web.js';

const config = loadConfig();
const port = config.PORT;
const bundledWeb = process.env.ENABLE_BUNDLED_WEB === 'true';

const { app, repo } = createApp(undefined, {
  bundledWeb,
  bundledWebAdapter: bundledWeb ? mountBundledWeb : undefined,
});

if (config.SEED_DEMO) {
  await seedDemoPortfolio(repo);
}

console.log(
  `Starting The Living Portfolio Server (${bundledWeb ? 'Web + Admin + API [bundled]' : 'Pure API /api/v1'}) on port ${port}...`
);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✓ Living Portfolio listening on http://localhost:${info.port}`);
  }
);
