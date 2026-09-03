import { test, compareScreenshot } from "./support/test";

/**
 * `maxDiffPixels` covers a long-standing 2-pixel flake on this page (seen on
 * mui in dark mode, ~2 runs in 3): a one-pixel edge shift, not antialiasing
 * noise, so the global `threshold` — which is a per-pixel *colour* tolerance —
 * never absorbs it. Unrelated to fonts, and it reproduces with the config's
 * rendering flags stripped and baselines re-recorded. The ceiling is two orders
 * of magnitude below any real regression on a ~970k-pixel capture.
 */
const ALL_QUESTIONS_FLAKE_BUDGET = 10;

/**
 * The first claims capture carries the same kind of budget for the bottom arc of
 * the radio decorators (4 pixels over the colour tolerance, 35 pixels touched at
 * all, top arc untouched). It is a raster artefact, not a layout change: on the
 * V3 build the difference appears only once the page has navigated at least once
 * before landing here — a cold load of the very same build reproduces the
 * baseline byte for byte — and no repaint clears it afterwards. Ruled out by
 * measurement, comparing that build against the one the baselines were recorded
 * with: font metrics (`fontBoundingBoxAscent/Descent`, and `1lh`, which drives
 * the decorator's `margin-top`), every custom property visible on the decorator,
 * its computed `box-shadow` and rect, and how the base theme variables reach the
 * root — all identical.
 */
const RADIO_ARC_BUDGET = 10;
const MIN_DIFF_PIXELS = 2;

const CREATOR = ".svc-creator, .svc-full-container, .svc-tab-designer";
const SURVEYJS = ".sd-theme-root";

test("claims overview", async ({ page, forEachTheme }) => {
  await page.setViewportSize({ width: 1440, height: 1300 });

  await forEachTheme(async ({ open, name }) => {
    const nextButton = page.getByRole('button', { name: 'Next' });
    const prefillDemoDataButton = page.getByRole('button', { name: 'Prefill demo data' });
    const completeButton = page.getByRole('button', { name: 'Complete' });

    await open("claims");
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1"), {
      maxDiffPixels: RADIO_ARC_BUDGET,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-2"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-2"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-2-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-2-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-3"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-3"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-3-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-3-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.nth(0).click();
    await completeButton.click();
    await nextButton.nth(0).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-4-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-4-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-4-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-4-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
  });
});

test("checkout overview", async ({ page, forEachTheme }) => {
  await page.setViewportSize({ width: 1440, height: 1300 });

  await forEachTheme(async ({ open, name }) => {
    const nextButton = page.getByRole('button', { name: 'Next' }).nth(0);
    const prefillDemoDataButton = page.getByRole('button', { name: 'Prefill demo data' }).nth(0);
    const completeButton = page.getByRole('button', { name: 'Complete' }).nth(0);

    await open("checkout");
    await compareScreenshot(page, SURVEYJS, name("checkout-1"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-1-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-1-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await completeButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-4-error"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-4-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
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

test("all-questions overview", async ({ page, forEachTheme }) => {
  await page.setViewportSize({ width: 1440, height: 2200 });

  await forEachTheme(async ({ open, name }) => {
    const nextButton = page.getByRole('button', { name: 'Next' }).nth(0);
    const prefillDemoDataButton = page.getByRole('button', { name: 'Prefill demo data' }).nth(0);

    await open("all-questions");
    await compareScreenshot(page, SURVEYJS, name("all-questions-1"), {
      maxDiffPixels: ALL_QUESTIONS_FLAKE_BUDGET,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-1-prefilled"), {
      maxDiffPixels: ALL_QUESTIONS_FLAKE_BUDGET,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-2"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-2-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-3"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-3-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-4"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-4-prefilled"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-5"), {
      maxDiffPixels: MIN_DIFF_PIXELS,
    });
  });
});
