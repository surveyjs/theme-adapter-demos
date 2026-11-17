import { test as base, expect, type Page } from "@playwright/test";
import {
  appTag,
  baseUrl,
  COLOR_MODES,
  routeFor,
  selectedApps,
  themeMatrix,
  type ColorMode,
  type PageId,
} from "../apps.config";
import {
  compareScreenshot,
  ensureColorMode,
  openRoute,
  preparePage,
  waitForCreatorReady,
  waitForSettledLayout,
  type CompareScreenshotOptions,
} from "./capture";
import { assertNoExternalRequests } from "./network";

/** One cell of the theme × color-mode matrix. */
export type ThemeRun = {
  /** Theme slug, or null for apps without a `[theme]` route (mui). */
  theme: string | null;
  /** Light or dark. */
  mode: ColorMode;
  /** Open a demo route in this theme/mode and wait until it settles. */
  open: (pageId: PageId) => Promise<void>;
  /**
   * Baseline name for this cell: "claims-1" → "flatly-claims-1.png" in light,
   * "flatly-dark-claims-1.png" in dark. Light keeps its historical names.
   */
  name: (basename: string) => string;
};

export type ThemeCell = ThemeRun & { page: Page };

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
 * Classic Playwright `test` with the demo setup. Every test gets a fresh page
 * with the deterministic setup of `preparePage`, and fails at teardown if a
 * request left localhost without a fixture.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Must precede the first navigation — the apps read storage pre-paint.
    await preparePage(page);
    await use(page);
    // After the body, so a request that has no fixture fails the test even
    // when nothing on screen showed it.
    assertNoExternalRequests(page);
  },
});

// Registers one test per app × color mode × theme, titled
// `<title> › <mode> › <theme>` (mui: `<title> › <mode>`), so a retry, a shard
// or a worker handles a single cell and `-g` can pick a page, mode or theme.
// `-g` matches substrings: `-g dark` also selects bootstrap's `darkly`, use
// `-g "dark( ›|$)"` for the dark mode.
// The apps come from apps.config, so specs never build the matrix themselves.
export function testEachTheme(
  title: string,
  body: (cell: ThemeCell) => Promise<void>,
  options: { timeout?: number } = {}
): void {
  for (const app of selectedApps()) {
    // The describe keeps titles unique within a file: bootstrap and shadcn
    // both have a `default` theme.
    test.describe(app.id, { tag: appTag(app.id) }, () => {
      if (options.timeout) test.describe.configure({ timeout: options.timeout });

      for (const mode of COLOR_MODES) {
        for (const theme of themeMatrix(app)) {
          const cellTitle = [title, mode, theme].filter(Boolean).join(" › ");

          test(cellTitle, async ({ page }, testInfo) => {
            // The baseline folder is the project name: a cell that leaked into
            // another app's project would compare against the wrong baselines.
            const projectApp = readAppId(testInfo);
            if (projectApp !== app.id) {
              throw new Error(
                `Cell of app "${app.id}" ran in project "${projectApp}": check the project's grepInvert.`
              );
            }

            // Keeps `prefers-color-scheme` in step with the in-app toggle.
            await page.emulateMedia({ colorScheme: mode });

            await body({
              page,
              theme,
              mode,
              open: async (pageId) => {
                await openRoute(page, `${baseUrl(app)}${routeFor(theme, pageId)}`);
                await ensureColorMode(page, mode, { tooltip: app.modeToggleTooltip ?? false });
              },
              name: (basename) =>
                [theme, mode === "dark" ? "dark" : null, basename]
                  .filter(Boolean)
                  .join("-") + ".png",
            });
          });
        }
      }
    });
  }
}

export { expect, compareScreenshot, waitForCreatorReady, waitForSettledLayout };
export type { CompareScreenshotOptions };
