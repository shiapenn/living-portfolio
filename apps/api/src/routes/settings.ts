import { Hono } from 'hono';

export function createSettingsRoutes() {
  const router = new Hono();

  // Get current settings
  router.get('/', (c) => {
    return c.json({
      preset: 'free-cloud',
      hosting: {
        static: 'direct-upload',
        origin: 'single-host',
        tunnel: 'cloudflared',
        admin_hostname: 'admin.example.com',
        api_hostname: 'api.example.com',
      },
      models: {
        embeddings: {
          chain: [{ provider: 'local-onnx', model: 'bge-small-en-v1.5' }],
        },
        extraction: {
          chain: [
            { provider: 'groq', model: 'llama-3.3-70b-versatile', data_classes: ['public', 'unpublished', 'private'] },
            { provider: 'gemini', model: 'gemini-1.5-flash', data_classes: ['public'] },
          ],
        },
        synthesis: {
          chain: [
            { provider: 'groq', model: 'llama-3.3-70b-versatile', data_classes: ['public'] },
            { provider: 'gemini', model: 'gemini-1.5-flash', data_classes: ['public'] },
          ],
        },
      },
      budgets: {
        visitor_share: 0.6,
        background_reserve: 0.3,
        soft_threshold: 0.8,
        hard_threshold: 1.0,
        fallback: 'extractive',
        per_visitor: { questions_per_hour: 10, bot_challenge: true },
      },
      notifications: {
        channel: 'ntfy',
        topic: 'living-portfolio-alerts',
        testStatus: 'verified',
      },
      backups: {
        schedule: '03:30',
        destinations: ['object-storage'],
        encrypt: 'age',
        retention: { daily: 7, weekly: 4, monthly: 6 },
        lastRestoreTest: 'passed',
      },
    });
  });

  // Test notification channel
  router.post('/notifications/test', async (c) => {
    const { channel, target } = await c.req.json();
    // Simulate sending test ping
    return c.json({ success: true, message: `Test alert sent to ${channel} (${target || 'default'})` });
  });

  return router;
}
