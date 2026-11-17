import { test, compareScreenshot } from "./support/test";
import { loadCases, openCreatorPreview } from "./support/cases";

/**
 * Adapter cases, one JSON file per case (`screenshot-tests/cases`).
 *
 * Each case opens the builder, replaces the survey in the JSON Editor, and
 * screenshots the survey rendered on the Creator Preview tab — the surface the
 * adapters actually style, without the designer toolbox and property grid.
 */
const PREVIEW_SURVEY = ".svc-test-tab__content .sd-root-modern";

const cases = loadCases();

for (const entry of cases) {
  test(entry.id, async ({ page, forEachTheme, waitForStableUI }) => {
    await forEachTheme(
      async ({ open, name }) => {
        await open("builder");
        await page.locator(".svc-creator").first().waitFor({ state: "visible", timeout: 60_000 });
        await openCreatorPreview(page, entry.json);
        await waitForStableUI(2_500);
        await compareScreenshot(page, PREVIEW_SURVEY, name(entry.id));
      },
      { timeoutPerTheme: 120_000 }
    );
  });
}
