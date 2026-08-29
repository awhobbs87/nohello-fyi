import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/ui',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:8124',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec serve build --listen 8124 --no-clipboard',
    url: 'http://localhost:8124',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
