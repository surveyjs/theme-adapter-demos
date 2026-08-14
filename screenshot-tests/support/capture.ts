import { expect, type Locator, type Page } from "@playwright/test";
import type { ColorMode } from "../apps.config";

/**
 * Deterministic conditions for screenshots: fixed light-mode storage, no
 * animations, no Next dev chrome, fonts loaded, network quiet.
 *
 * The font part is the fiddly one — see `waitForFonts`. Bootswatch reaches its
 * Google font through an `@import` *inside* the theme stylesheet, so the
 * `@font-face` rules land a whole network hop after the theme itself, and
 * `&display=swap` paints the fallback meanwhile. Capturing in that window bakes
 * fallback metrics into the baseline with the real glyphs drawn on top.
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

/** Budget for the `@import` chain that pulls a theme's font sheet. */
const FONT_IMPORT_TIMEOUT_MS = 15_000;

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

/**
 * Switch the page to `mode`, app-agnostically.
 *
 * Every demo labels its toggle with the mode it switches *to*, so the button
 * only exists while the page is in the opposite mode — finding none means we
 * are already there. Needed after every navigation: `preparePage` re-seeds
 * light defaults into storage on each load.
 */
export async function ensureColorMode(page: Page, mode: ColorMode): Promise<void> {
  const toggle = page.getByRole("button", { name: `Switch to ${mode} mode` });
  if ((await toggle.count()) === 0) return;

  await toggle.first().click();
  await waitForStableUI(page);
}

/**
 * Block until every webfont the page declares has really loaded.
 *
 * Two steps, because they close different gaps:
 *
 *  A. Wait out pending `@import`s. `CSSImportRule.styleSheet` is null until the
 *     imported sheet has been fetched and parsed, and until then a Bootswatch
 *     theme has contributed no `@font-face` at all — `document.fonts` is empty
 *     and step B would sail through on nothing.
 *  B. Start every declared face and await it, as survey-creator does in
 *     `e2e/helper.ts`. Note `document.fonts.status` is deliberately unused: it
 *     reads "loaded" whenever no load is *currently* in flight, so it is
 *     trivially true in the gap before a lazily-used weight has even started.
 *     Upstream shipped that check and then reverted it (commit e1171a9af).
 *
 * A font that never arrives times out here, which fails the test — better than
 * quietly recording a fallback-font baseline.
 */
export async function waitForFonts(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const hasPendingImport = (sheet: CSSStyleSheet): boolean => {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          // Cross-origin sheet (the Google Fonts one) — opaque to CSSOM, and it
          // declares faces directly rather than importing further sheets.
          return false;
        }
        for (let i = 0; i < rules.length; i += 1) {
          const rule = rules.item(i);
          if (!(rule instanceof CSSImportRule)) continue;
          if (!rule.styleSheet || hasPendingImport(rule.styleSheet)) return true;
        }
        return false;
      };

      const sheets = document.styleSheets;
      for (let i = 0; i < sheets.length; i += 1) {
        if (hasPendingImport(sheets.item(i)!)) return false;
      }
      return true;
    },
    undefined,
    { timeout: FONT_IMPORT_TIMEOUT_MS, polling: 250 }
  );

  await page.evaluate(async () => {
    const pending: Array<Promise<unknown>> = [];
    // Per-face catch: `unicode-range` subsets can fail one at a time.
    document.fonts.forEach((face) => pending.push(face.load().catch(() => undefined)));
    await Promise.all(pending);
    await document.fonts.ready;
  });
}

/** Network quiet, fonts loaded, then a short pause for the final repaint. */
export async function waitForStableUI(
  page: Page,
  ms: number = DEFAULT_STABLE_UI_MS
): Promise<void> {
  await page.waitForLoadState("networkidle");
  await waitForFonts(page);
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

  // Last line of defence: specs call this directly after arbitrary interactions,
  // which can pull in a weight nothing had needed until now.
  await waitForFonts(page);

  if (locator) {
    const element = locator.filter({ visible: true });
    await expect.soft(element.nth(0)).toBeVisible();
    await expect.soft(element.nth(0)).toHaveScreenshot(screenshotName, pwOptions);
  } else {
    await expect.soft(page).toHaveScreenshot(screenshotName, pwOptions);
  }
}
