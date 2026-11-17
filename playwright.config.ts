import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { APPS, appTag, baseUrl, selectedApps } from "./screenshot-tests/apps.config";

/**
 * Visual regression across the three demo apps.
 *
 * One project per app. `testEachTheme` (support/test.ts) registers one test
 * per page × color mode × theme, and builds the baseline name. Tests are
 * collected before the project is known, so every selected app's cells are
 * registered in every project, each under its app's tag (`@bootstrap`), and
 * each project's `grepInvert` drops the other apps' tags.
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

  // Per test, so per cell. Builder cells raise it via testEachTheme.
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
    trace: "off",
    launchOptions: {
      // `--disable-lcd-text` pins text to grayscale antialiasing. Chromium
      // otherwise switches between grayscale and subpixel depending on
      // compositing state (a freshly opened popup renders grayscale until its
      // layer is released ~1-2s later), which made survey-creator's screenshot
      // tests flaky — this mirrors their config. Baselines must be re-recorded
      // once with both flags; after that, removing either invalidates them.
      args: ["--disable-lcd-text", "--lang=en-US"],
      // Bootstrap's `default` theme and shadcn/ui have no webfont: `system-ui`
      // resolves through fontconfig to DejaVu Sans, and the baselines were
      // recorded with its ExtraLight face (fonts-dejavu-extra), which
      // `font-weight: 300` (`.lead`) picks. Runners with only fonts-dejavu-core
      // draw that text at 400. Adding the bundled files to fontconfig keeps
      // them *system* fonts — served as a webfont instead, Chromium renders the
      // same files with different hinting and every text baseline shifts.
      env: { ...process.env, FONTCONFIG_FILE: resolve(__dirname, "screenshot-tests/fonts/fonts.conf") },
    },
  },

  projects: apps.map((app) => ({
    name: app.id,
    metadata: { appId: app.id },
    // `grepInvert` rather than `grep`: a test without an app tag still runs in
    // every project instead of in none. `(?!\S)` rather than `\b`, so that
    // `@bootstrap` would not also drop a future `@bootstrap-5`.
    grepInvert: APPS.filter((other) => other.id !== app.id).map(
      (other) => new RegExp(`${appTag(other.id)}(?!\\S)`)
    ),
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
