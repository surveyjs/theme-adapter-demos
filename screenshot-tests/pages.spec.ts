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

test("all-questions overview", async ({ page, forEachTheme }) => {
  await forEachTheme(async ({ open, name }) => {
    await open("all-questions");
    await compareScreenshot(page, SURVEYJS, name("all-questions-1"));
  });
});
