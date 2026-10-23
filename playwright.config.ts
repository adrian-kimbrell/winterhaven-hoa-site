import { defineConfig, devices } from "@playwright/test";

/* Uses Playwright's bundled Chromium, not the installed Google Chrome:
   branded Chrome starts Google Updater and a crash reporter that hold
   sockets open and stop test workers from exiting.

   End-to-end tests run against a local production build on port 3000
   (the only origin Better Auth trusts locally) and the real Neon
   database. Every account and item the suite creates is tagged and
   removed in global teardown — see e2e/support/data.ts.

   Run: npm run test:e2e  (builds first)  or  npx playwright test  */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  globalTimeout: 15 * 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 3,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  outputDir: "e2e/results",
});
