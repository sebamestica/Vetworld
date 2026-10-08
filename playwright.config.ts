import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 15000 }, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] },
  },
  webServer: { command: 'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100/api/v1/health', timeout: 60000, reuseExistingServer: false, env: { NEXT_TELEMETRY_DISABLED: '1' } },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1050 } } },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
