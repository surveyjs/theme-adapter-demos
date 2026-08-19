import { test, compareScreenshot } from "./support/test";

const CREATOR = ".svc-creator, .svc-full-container, .svc-tab-designer";
const SURVEYJS = ".sd-theme-root";

test("claims overview", async ({ page, forEachTheme }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });

  await forEachTheme(async ({ open, name }) => {
    const nextButton = page.getByRole('button', { name: 'Next' });
    const prefillDemoDataButton = page.getByRole('button', { name: 'Prefill demo data' });
    const completeButton = page.getByRole('button', { name: 'Complete' });

    await open("claims");
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1"));

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1-error"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1-error"));

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-1-prefilled"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-1-prefilled"));

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-2"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-2")); 

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-2-prefilled"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-2-prefilled"));

    await nextButton.nth(0).click();
    await nextButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-3"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-3"));

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-3-prefilled"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-3-prefilled"));

    await nextButton.nth(0).click();
    await completeButton.click();
    await nextButton.nth(0).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-4-error"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-4-error"));

    await prefillDemoDataButton.nth(0).click();
    await prefillDemoDataButton.nth(1).click();
    await compareScreenshot(page, SURVEYJS, name("claims-surveyjs-4-prefilled"));
    await compareScreenshot(page, ".native-controls", name("claims-native-controls-4-prefilled"));
  });
});

test("checkout overview", async ({ page, forEachTheme }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });

  await forEachTheme(async ({ open, name }) => {
    const nextButton = page.getByRole('button', { name: 'Next' }).nth(0);
    const prefillDemoDataButton = page.getByRole('button', { name: 'Prefill demo data' }).nth(0);
    const completeButton = page.getByRole('button', { name: 'Complete' }).nth(0);

    await open("checkout");
    await compareScreenshot(page, SURVEYJS, name("checkout-1"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-1-error"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-1-prefilled"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2-error"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-2-prefilled"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3-error"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-3-prefilled"));

    await nextButton.click();
    await completeButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-4-error"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("checkout-4-prefilled"));
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
    await compareScreenshot(page, SURVEYJS, name("all-questions-2"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-2-prefilled"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-3"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-3-prefilled"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-4"));

    await prefillDemoDataButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-4-prefilled"));

    await nextButton.click();
    await compareScreenshot(page, SURVEYJS, name("all-questions-5"));
  });
});
