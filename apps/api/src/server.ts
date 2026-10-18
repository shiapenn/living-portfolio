import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = parseInt(process.env.PORT || '3000', 10);
const { app } = createApp();

console.log(`Starting The Living Portfolio API on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✓ Living Portfolio API listening on http://localhost:${info.port}`);
});
