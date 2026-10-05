import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SNIPCART_SMOKE_URL ?? 'http://127.0.0.1:4321';
export default defineConfig({
  testDir: './tests/snipcart',
  reporter: 'list',
  use: { baseURL, ...devices['Desktop Chrome'] },
  webServer: process.env.SNIPCART_SMOKE_URL
    ? undefined
    : {
        command: 'bun run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
      },
});
