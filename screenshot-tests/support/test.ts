import { test as base, expect } from "@playwright/test";
import {
  baseUrl,
  getApp,
  routeFor,
  themeMatrix,
  type PageId,
} from "../apps.config";
import {
  compareScreenshot,
  openRoute,
  preparePage,
  waitForStableUI as waitForStableUIOnPage,
  type CompareScreenshotOptions,
} from "./capture";

/** Time budget granted per theme when a test walks the whole matrix. */
const DEFAULT_THEME_TIMEOUT_MS = 45_000;

/** One iteration of the theme matrix. */
export type ThemeRun = {
  /** Theme slug, or null for apps without a `[theme]` route (mui). */
  theme: string | null;
  /** Open a demo route in this theme and wait until it settles. */
  open: (pageId: PageId) => Promise<void>;
  /** Baseline name for this theme: "claims-1" → "flatly-claims-1.png". */
  name: (basename: string) => string;
};

type DemoFixtures = {
  /** App id from the current Playwright project (`bootstrap` / `shadcn` / `mui`). */
  appId: string;
  /**
   * Run `body` once per theme of the current app, each as its own reporter step.
   * Raises the test timeout to `timeoutPerTheme` × number of themes.
   */
  forEachTheme: (
    body: (run: ThemeRun) => Promise<void>,
    options?: { timeoutPerTheme?: number }
  ) => Promise<void>;
  /** Wait for network/fonts after an interaction. */
  waitForStableUI: (ms?: number) => Promise<void>;
};

function readAppId(testInfo: { project: { metadata?: Record<string, unknown> } }): string {
  const appId = testInfo.project.metadata?.appId;
  if (typeof appId !== "string" || !appId) {
    throw new Error(
      "Project is missing metadata.appId — each Playwright project must set { appId }."
    );
  }
  return appId;
}

/**
 * Classic Playwright `test` extended with demo helpers.
 * The app comes from the Playwright project, the themes from apps.config —
 * specs never build the matrix themselves.
 */
export const test = base.extend<DemoFixtures>({
  appId: async ({}, use, testInfo) => {
    await use(readAppId(testInfo));
  },

  forEachTheme: async ({ page, appId }, use, testInfo) => {
    // Must precede the first navigation — the apps read storage pre-paint.
    await preparePage(page);

    const app = getApp(appId);
    const themes = themeMatrix(app);

    await use(async (body, options = {}) => {
      const perTheme = options.timeoutPerTheme ?? DEFAULT_THEME_TIMEOUT_MS;
      testInfo.setTimeout(themes.length * perTheme);

      for (const theme of themes) {
        await base.step(theme ?? "default", async () => {
          await body({
            theme,
            open: (pageId) =>
              openRoute(page, `${baseUrl(app)}${routeFor(theme, pageId)}`),
            name: (basename) =>
              theme ? `${theme}-${basename}.png` : `${basename}.png`,
          });
        });
      }
    });
  },

  waitForStableUI: async ({ page }, use) => {
    await use(async (ms) => {
      await waitForStableUIOnPage(page, ms);
    });
  },
});

export { expect, compareScreenshot };
export type { CompareScreenshotOptions };
