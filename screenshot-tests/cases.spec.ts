import { testEachTheme, compareScreenshot, waitForSettledLayout } from "./support/test";
import {
  loadCases,
  openCreatorPreview,
  scrollTableWrapperToMiddle,
} from "./support/cases";

/**
 * Adapter cases, one JSON file per case (`screenshot-tests/cases`).
 *
 * Each case opens the builder, replaces the survey in the JSON Editor, and
 * screenshots the survey rendered on the Creator Preview tab — the surface the
 * adapters actually style, without the designer toolbox and property grid.
 */
const PREVIEW_SURVEY = ".svc-test-tab__content .sd-root-modern";

/** Cases that need a scrolled matrix before capture. */
const SCROLL_TABLE_CASES = new Set(["matrixdynamic-detail-scroll"]);

const cases = loadCases();

for (const entry of cases) {
  testEachTheme(entry.id, async ({ page, open, name }) => {
    await open("builder");
    await page.locator(".svc-creator").first().waitFor({ state: "visible", timeout: 60_000 });
    await openCreatorPreview(page, entry.json);
    // Settle first: scrolling before fonts/layout finish is wiped by the remount.
    await waitForSettledLayout(page);
    if (SCROLL_TABLE_CASES.has(entry.id)) {
      await scrollTableWrapperToMiddle(page);
    }
    await compareScreenshot(page, PREVIEW_SURVEY, name(entry.id));
  });
}
