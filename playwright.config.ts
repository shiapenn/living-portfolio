import { defineConfig, devices } from '@playwright/test';

process.env.NO_PROXY = '127.0.0.1,localhost';
process.env.no_proxy = '127.0.0.1,localhost';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'PORT=3100 ENABLE_BUNDLED_WEB=true SEED_DEMO=true SITE_ORIGIN=http://127.0.0.1:3100 ADMIN_ORIGIN=http://127.0.0.1:3100 pnpm --filter @living-portfolio/api exec tsx src/server.ts',
    url: 'http://127.0.0.1:3100/healthz',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      PORT: '3100',
      ENABLE_BUNDLED_WEB: 'true',
      SEED_DEMO: 'true',
      SITE_ORIGIN: 'http://127.0.0.1:3100',
      ADMIN_ORIGIN: 'http://127.0.0.1:3100',
      NO_PROXY: '127.0.0.1,localhost',
      no_proxy: '127.0.0.1,localhost',
    },
  },
});
