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
    // Otherwise the runner's machine leaks into the baselines. Note `locale`
    // alone is not enough for the native date input's placeholder
    // (`mm/dd/yyyy` vs `dd.mm.yyyy`) — that follows Chromium's *UI* language,
    // which only `--lang` below sets.
    locale: "en-US",
    timezoneId: "UTC",
    trace: "retain-on-failure",
    launchOptions: {
      // `--disable-lcd-text` pins text to grayscale antialiasing. Chromium
      // otherwise switches between grayscale and subpixel depending on
      // compositing state (a freshly opened popup renders grayscale until its
      // layer is released ~1-2s later), which made survey-creator's screenshot
      // tests flaky — this mirrors their config. Baselines must be re-recorded
      // once with both flags; after that, removing either invalidates them.
      args: ["--disable-lcd-text", "--lang=en-US"],
    },
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
