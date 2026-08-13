import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Deterministic conditions for screenshots: fixed light-mode storage, no
 * animations, no Next dev chrome, fonts loaded, network quiet.
 */

/**
 * localStorage seeded before the first paint so every run starts from the same
 * light-mode defaults, whatever the pre-paint inline scripts read. Keys and
 * values mirror the app sources:
 *  - `adapter:mode`      — MODE_STORAGE_KEY, apps/bootstrap/src/lib/themes.ts
 *  - `theme`             — next-themes default key, apps/shadcn
 *  - `shadcn-*`          — apps/shadcn/src/lib/{themes,baseColors,radii}.ts
 *  - `mui-color-scheme`  — apps/mui/src/lib/surveyOverridesCss.ts
 */
const STORAGE_DEFAULTS: Record<string, string> = {
  "adapter:mode": "light",
  theme: "light",
  "shadcn-theme": "default",
  "shadcn-base-color": "neutral",
  "shadcn-radius": "default",
  "mui-color-scheme": "light",
  "mui-color-scheme-light": "light",
};

/** The Next dev overlay/indicator renders into these and is not app content. */
const HIDE_DEV_CHROME = `
  nextjs-portal { display: none !important; }
  [data-nextjs-toast], #__next-build-watcher { display: none !important; }
`;

export const DEFAULT_STABLE_UI_MS = 600;

export type CompareScreenshotOptions = {
  animations?: "disabled" | "allow";
  caret?: "hide" | "initial";
  mask?: Array<Locator>;
  maskColor?: string;
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  omitBackground?: boolean;
  scale?: "css" | "device";
  stylePath?: string | Array<string>;
  threshold?: number;
  timeout?: number;
  fullPage?: boolean;
};

/** Must run before the first navigation — the apps read storage pre-paint. */
export async function preparePage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ({ defaults, css }: { defaults: Record<string, string>; css: string }) => {
      try {
        for (const [key, value] of Object.entries(defaults)) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        /* storage unavailable */
      }
      const inject = () => {
        if (document.getElementById("pw-hide-dev-chrome")) return;
        const style = document.createElement("style");
        style.id = "pw-hide-dev-chrome";
        style.textContent = css;
        document.head.appendChild(style);
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inject, { once: true });
      } else {
        inject();
      }
    },
    { defaults: STORAGE_DEFAULTS, css: HIDE_DEV_CHROME }
  );
}

export async function openRoute(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForStableUI(page);
}

/** Network quiet, fonts loaded, then a short pause for the final repaint. */
export async function waitForStableUI(
  page: Page,
  ms: number = DEFAULT_STABLE_UI_MS
): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

export async function compareScreenshot(
  page: Page,
  elementSelector: string | Locator | undefined,
  screenshotName: string,
  options: CompareScreenshotOptions = {}
): Promise<void> {
  const locator: Locator | undefined =
    typeof elementSelector === "string"
      ? page.locator(elementSelector)
      : elementSelector;

  const pwOptions: CompareScreenshotOptions = {
    timeout: 10_000,
    maskColor: "#000000",
    ...options,
  };

  if (locator) {
    const element = locator.filter({ visible: true });
    await expect.soft(element.nth(0)).toBeVisible();
    await expect.soft(element.nth(0)).toHaveScreenshot(screenshotName, pwOptions);
  } else {
    await expect.soft(page).toHaveScreenshot(screenshotName, pwOptions);
  }
}
