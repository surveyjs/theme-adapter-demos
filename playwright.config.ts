import { defineConfig, devices } from "@playwright/test";
import { baseUrl, selectedApps } from "./screenshot-tests/apps.config";

/**
 * Visual regression across the three demo apps.
 *
 * One project per app. Themes and color modes are walked at runtime by the
 * `forEachTheme` fixture (support/test.ts), which also builds the baseline
 * name, so specs stay classic per-page tests.
 *
 * `E2E_APPS` (set via cross-env in the npm scripts) picks which apps run, so
 * only their production servers get started.
 *
 * Baselines: `screenshot-tests/screenshots/<app>/<theme>-[dark-]<name>.png`
 * (no theme prefix for mui, which has no `[theme]` route).
 */
const apps = selectedApps();

export default defineConfig({
  testDir: "./screenshot-tests",
  snapshotPathTemplate: "screenshot-tests/screenshots/{projectName}/{arg}{ext}",
  outputDir: "./test-results",

  // Tests that walk the theme matrix raise this themselves via forEachTheme.
  timeout: 120_000,
  expect: {
    timeout: 30_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      threshold: 0.02,
    },
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "screenshot-tests/.report", open: "never" }]],

  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    trace: "retain-on-failure",
  },

  projects: apps.map((app) => ({
    name: app.id,
    metadata: { appId: app.id },
    use: { baseURL: baseUrl(app) },
  })),

  webServer: apps.map((app) => ({
    command: `npm run start --workspace ${app.workspace}`,
    url: baseUrl(app),
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  })),
});
