import { test, compareScreenshot } from "./support/test";

const CREATOR = ".svc-creator, .svc-full-container, .svc-tab-designer";
const SURVEYJS = ".sd-theme-root";

test("claims overview", async ({ page, forEachTheme }) => {
  await forEachTheme(async ({ open, name }) => {
    await open("claims");
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1"));
  });
});

test("checkout overview", async ({ page, forEachTheme }) => {
  await forEachTheme(async ({ open, name }) => {
    await open("checkout");
    await compareScreenshot(page, SURVEYJS, name("checkout-1"));
  });
});

test("records overview", async ({ page, forEachTheme }) => {
  await forEachTheme(async ({ open, name }) => {
    await open("records");
    await compareScreenshot(page, ".records-page", name("records-1"));
  });
});

test("builder designer", async ({ page, forEachTheme, waitForStableUI }) => {
  await forEachTheme(
    async ({ open, name }) => {
      await open("builder");
      await page.locator(CREATOR).first().waitFor({ state: "visible", timeout: 60_000 });
      await waitForStableUI(2_500);
      await compareScreenshot(page, ".svc-creator", name("builder-designer"));
    },
    { timeoutPerTheme: 150_000 }
  );
});

/**
 * `maxDiffPixels` covers a long-standing 2-pixel flake on this page (seen on
 * mui in dark mode, ~2 runs in 3): a one-pixel edge shift, not antialiasing
 * noise, so the global `threshold` — which is a per-pixel *colour* tolerance —
 * never absorbs it. Unrelated to fonts, and it reproduces with the config's
 * rendering flags stripped and baselines re-recorded. The ceiling is two orders
 * of magnitude below any real regression on a ~970k-pixel capture.
 */
const ALL_QUESTIONS_FLAKE_BUDGET = 10;

test("all-questions overview", async ({ page, forEachTheme }) => {
  await forEachTheme(async ({ open, name }) => {
    await open("all-questions");
    await compareScreenshot(page, SURVEYJS, name("all-questions-1"), {
      maxDiffPixels: ALL_QUESTIONS_FLAKE_BUDGET,
    });
  });
});
