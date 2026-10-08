import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node', testTimeout: 15000, hookTimeout: 120000,
    globalSetup: process.argv.some(arg => /tests[\\/]?(integration|contracts)/.test(arg)) ? ['./tests/helpers/http-server.ts'] : [],
  },
});
