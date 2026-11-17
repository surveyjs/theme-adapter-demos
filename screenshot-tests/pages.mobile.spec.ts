import { testEachTheme, compareScreenshot } from "./support/test";

const ALL_QUESTIONS_FLAKE_BUDGET = 10;
/** The radio-decorator arc artefact, same capture as desktop — see pages.spec.ts. */
const RADIO_ARC_BUDGET = 10;
const MIN_DIFF_PIXELS = 2;

const CREATOR = ".svc-creator, .svc-full-container, .svc-tab-designer";
const SURVEYJS = ".sd-theme-root";

testEachTheme("mobile claims", async ({ page, open, name }) => {
  await page.setViewportSize({ width: 400, height: 2000 });

  await open("claims");
  await compareScreenshot(page, SURVEYJS, name("mobile-claims-surveyjs-1"), {
    maxDiffPixels: RADIO_ARC_BUDGET,
  });
  await compareScreenshot(page, ".native-controls", name("mobile-claims-native-controls-1"), {
    maxDiffPixels: MIN_DIFF_PIXELS,
  });
});

testEachTheme("mobile checkout", async ({ page, open, name }) => {
  await page.setViewportSize({ width: 400, height: 2000 });

  await open("checkout");
  await compareScreenshot(page, SURVEYJS, name("mobile-checkout-1"), {
    maxDiffPixels: MIN_DIFF_PIXELS,
  });
});

testEachTheme("mobile records", async ({ page, open, name }) => {
  await page.setViewportSize({ width: 400, height: 2000 });

  await open("records");
  await compareScreenshot(page, ".records-page", name("mobile-records-1"));
});

testEachTheme("mobile builder", async ({ page, waitForStableUI, open, name }) => {
  await page.setViewportSize({ width: 400, height: 900 });

  await open("builder");
  await page.locator(CREATOR).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForStableUI(2_500);
  await compareScreenshot(page, ".svc-creator", name("mobile-builder-designer"));
}, { timeout: 150_000 });

testEachTheme("mobile all-questions", async ({ page, open, name }) => {
  await page.setViewportSize({ width: 400, height: 2000 });

  await open("all-questions");

  const previousButton = page.getByRole('button', { name: 'Previous' }).nth(0);
  const nextButton = page.getByRole('button', { name: 'Next' }).nth(0);
  await nextButton.click();
  await previousButton.click();

  await compareScreenshot(page, SURVEYJS, name("mobile-all-questions-1"), {
    maxDiffPixels: ALL_QUESTIONS_FLAKE_BUDGET,
  });
});
