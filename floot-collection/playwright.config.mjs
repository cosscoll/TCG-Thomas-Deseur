import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// This runs against the local, fictional collection preview ONLY.
// It never authenticates to Floot, consumes a booster or writes an inventory.
export default defineConfig({
  testDir: fileURLToPath(new URL('../e2e/', import.meta.url)),
  testMatch: ['binder-demo.spec.mjs', 'binder-accessibility.spec.mjs', 'collection-161.spec.mjs', 'collection-161-a11y.spec.mjs', 'tri-177.spec.mjs', 'verification-photos.spec.mjs', 'collection-validee.spec.mjs', 'beta.spec.mjs', 'audit-visuels.spec.mjs', 'planches.spec.mjs', 'avancement.spec.mjs', 'kit-visuels.spec.mjs', 'public-accessibility.spec.mjs', 'prototype-booster.spec.mjs'],
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'line',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    command: 'python3 -m http.server 8000 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8000/floot-collection/demo.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
