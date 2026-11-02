import { serve } from '@hono/node-server';
import { loadConfig } from '@living-portfolio/config';
import { createWebApp } from './app.js';

const config = loadConfig();
const port = Number(process.env.WEB_PORT || 3001);
const apiBaseUrl = process.env.PUBLIC_API_BASE_URL || `http://localhost:${config.PORT}/api/v1`;

const { app } = createWebApp({ apiBaseUrl });

console.log(`Starting The Living Portfolio Web App on port ${port} (API: ${apiBaseUrl})...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✓ Living Portfolio Web listening on http://localhost:${info.port}`);
  }
);
