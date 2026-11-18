import { expect, type Locator, type Page, type Request } from "@playwright/test";
import type { ColorMode } from "../apps.config";
import { routeExternalRequests } from "./network";

/**
 * Deterministic conditions for screenshots: fixed light-mode storage, no
 * animations, no Next dev chrome, no internet, fonts loaded, layout settled.
 * Every wait is for a state, not for time: see `waitForRouteReady`.
 *
 * The font part is the fiddly one — see `waitForFonts`. Bootswatch reaches its
 * Google font through an `@import` *inside* the theme stylesheet, so the
 * `@font-face` rules land a whole network hop after the theme itself, and
 * `&display=swap` paints the fallback meanwhile. Capturing in that window bakes
 * fallback metrics into the baseline with the real glyphs drawn on top. The
 * Google stylesheets and font files themselves come from
 * `screenshot-tests/fixtures/fonts/` (support/network.ts), so every run renders
 * the same bytes.
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

/**
 * Test-only paint tweaks, not app content: hide the Next dev overlay, and drop
 * the native textarea resize grip so its corner pixels stay stable.
 */
const HIDE_DEV_CHROME = `
  nextjs-portal { display: none !important; }
  [data-nextjs-toast], #__next-build-watcher { display: none !important; }
  textarea { resize: none !important; }
`;

/** Budget for the `@import` chain that pulls a theme's font sheet. */
const FONT_IMPORT_TIMEOUT_MS = 15_000;

/** `waitForSettledLayout`: frames without a change, and how long to wait for them, and for requests. */
const SETTLE_FRAMES = 2;
const SETTLE_TIMEOUT_MS = 10_000;

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

type SurveyGlobal = { settings: { animationEnabled: boolean; animation: { respectReducedMotion: boolean } } };

/**
 * Init script, so it must stay self-contained. The apps publish survey-core's
 * `settings` as `window.Survey` at module load (`lib/survey-ssr-environment`);
 * the setter switches animation off right then, before any model or Creator is
 * constructed and reads it.
 */
function disableSurveyAnimation(): void {
  let survey: SurveyGlobal | undefined;
  Object.defineProperty(window, "Survey", {
    configurable: true,
    get: () => survey,
    set: (value: SurveyGlobal) => {
      value.settings.animationEnabled = false;
      value.settings.animation.respectReducedMotion = false;
      survey = value;
    },
  });
}

type PendingLoadsGlobal = { __pwPendingLoads: number };

/**
 * Init script, so it must stay self-contained. Counts the fetches (until their
 * response arrives) and the `<script src>` loads (until the script has run) in
 * the page, for `waitForSettledLayout`: unlike Playwright's request events, the
 * count is in step with the frames the page paints. Next's prefetch is a fetch
 * whose response then inserts the chunk scripts.
 */
function trackPendingLoads(): void {
  const global = window as unknown as PendingLoadsGlobal;
  global.__pwPendingLoads = 0;
  const settle = (): void => {
    global.__pwPendingLoads -= 1;
  };

  const fetch = window.fetch;
  window.fetch = function (...args: Parameters<typeof window.fetch>) {
    global.__pwPendingLoads += 1;
    const response = fetch.apply(this, args);
    response.then(settle, settle);
    return response;
  };

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        // `noModule` scripts are never fetched, so they never fire `load`.
        if (!(node instanceof HTMLScriptElement) || !node.src || node.noModule) return;
        global.__pwPendingLoads += 1;
        node.addEventListener("load", settle, { once: true });
        node.addEventListener("error", settle, { once: true });
      });
    }
  }).observe(document, { childList: true, subtree: true });
}

/**
 * Must run before the first navigation — the apps read storage pre-paint, and
 * the first page already requests webfonts and images.
 */
export async function preparePage(page: Page): Promise<void> {
  trackRequests(page);
  await routeExternalRequests(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(disableSurveyAnimation);
  await page.addInitScript(trackPendingLoads);
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

/**
 * Navigate and wait until the route is ready to capture and to click: see
 * `waitForRouteReady`.
 */
export async function openRoute(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
}

/**
 * Ready means: hydrated, styled, fonts and images loaded, layout settled.
 *
 * No `networkidle`: it waits for 500 ms without a request on every call.
 * `waitForSettledLayout` waits for the requests in flight instead.
 *
 * Hydrated and effects run: React tags every node it hydrates or renders with
 * `__reactProps$…`, but already during the render phase, before it commits and
 * runs effects. So the check also waits for what only effects add: shadcn and
 * mui render the mode toggle after mount (`ensureColorMode` needs it), and every
 * survey route adds the "Prefill demo data" navigation item in an effect
 * (`SurveyForm`, `AllQuestionsGallery`). Bootstrap renders its toggle on the
 * server, so on bootstrap the survey item is the only post-effect signal.
 */
export async function waitForRouteReady(page: Page): Promise<void> {
  await page.waitForFunction(
    ({ toggle, content, prefill }) => {
      const isHydrated = (el: Element | null): boolean =>
        !!el && Object.keys(el).some((key) => key.startsWith("__reactProps$"));
      const isVisible = (el: Element | null): boolean =>
        !!el && el.getClientRects().length > 0;

      const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
      for (const link of links) if (!link.sheet) return false;
      for (const img of document.images) if (!img.complete) return false;

      const root = document.querySelector(content);
      if (!(isHydrated(document.querySelector(toggle)) && isVisible(root) && isHydrated(root))) return false;
      if (!root!.matches(".sd-root-modern")) return true;
      const buttons = root!.querySelectorAll<HTMLElement>('button, input[type="button"]');
      return [...buttons].some((b) => (b instanceof HTMLInputElement ? b.value : b.textContent)?.trim() === prefill);
    },
    { toggle: MODE_TOGGLE, content: ROUTE_CONTENT, prefill: PREFILL_ACTION },
    { polling: "raf" }
  );
  await waitForFonts(page);
  await waitForSettledLayout(page);
}

/**
 * Every demo labels its toggle with the mode it switches *to*: "Switch to dark
 * mode" in light mode. No tag: mui's toggle is a `<div role="button">` Chip.
 */
const MODE_TOGGLE = '[aria-label^="Switch to "][aria-label$=" mode"]';

/**
 * What each route renders: a survey, the creator (client-only), or the records
 * table. A survey inside the creator or a records form comes later in document
 * order than its container, so `querySelector` returns the route's own root.
 */
const ROUTE_CONTENT = ".sd-root-modern, .svc-creator, .records-page";

const PREFILL_ACTION = "Prefill demo data";

/**
 * Switch the page to `mode`, app-agnostically.
 *
 * Every demo labels its toggle with the mode it switches *to*, so the button
 * only exists while the page is in the opposite mode — finding none means we
 * are already there. Needed after every navigation: `preparePage` re-seeds
 * light defaults into storage on each load. `openRoute` has already waited for
 * the toggle to render.
 */
export async function ensureColorMode(
  page: Page,
  mode: ColorMode,
  { tooltip }: { tooltip: boolean }
): Promise<void> {
  const toggle = page.getByRole("button", { name: `Switch to ${mode} mode` });
  if ((await toggle.count()) === 0) return;

  await toggle.first().click();

  const other: ColorMode = mode === "dark" ? "light" : "dark";
  await expect(page.getByRole("button", { name: `Switch to ${other} mode` })).toBeVisible();
  if (tooltip) {
    // The mouse stays on the toggle, so mui's Tooltip opens after its 100 ms
    // hover delay, and grows in. Its bottom edge overlaps the top of the mobile
    // and builder captures, and the baselines show it fully open.
    const popup = page.getByRole("tooltip", { name: `Switch to ${other} mode` });
    await expect(popup).toBeVisible();
    // Polled, not `animation.finished`: a re-render cancels and restarts the
    // grow transition, and `finished` then rejects.
    await page.waitForFunction(
      (el) => el.getAnimations({ subtree: true }).length === 0,
      await popup.elementHandle(),
      { polling: "raf" }
    );
  }
  // What each app's stylesheets key the mode on: `data-bs-theme` (bootstrap),
  // a class on <html> (next-themes in shadcn, mui's `colorSchemeSelector`).
  await page.waitForFunction(
    (target) => {
      const html = document.documentElement;
      return html.getAttribute("data-bs-theme") === target || html.classList.contains(target);
    },
    mode,
    { polling: "raf" }
  );
  await waitForFonts(page);
  await waitForSettledLayout(page);
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
 * A face that fails to load (`status === "error"`: a missing fixture file, a
 * CORS or decode error) throws here naming every such face, and an `@import`
 * that never arrives times out in step A. Both fail the test, which beats
 * quietly comparing a fallback-font render.
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

  const failed = await page.evaluate(async () => {
    const failures: Array<string> = [];
    const pending: Array<Promise<unknown>> = [];
    // Per-face catch: `unicode-range` subsets fail one at a time, and every
    // failure should be in the message, not only the first.
    document.fonts.forEach((face) =>
      pending.push(
        face.load().catch(() => {
          failures.push(
            `"${face.family}" weight ${face.weight} style ${face.style} unicode-range ${face.unicodeRange}`
          );
        })
      )
    );
    await Promise.all(pending);
    await document.fonts.ready;
    return failures;
  });
  if (failed.length > 0) {
    throw new Error(`Webfonts failed to load (status "error"):\n  ${failed.join("\n  ")}`);
  }
}

/**
 * After `open("builder")`: the creator mounts client-side, renders the toolbox
 * and the designer surface, then fits its toolbars to the width.
 */
export async function waitForCreatorReady(page: Page): Promise<void> {
  // The creator's mobile view renders no toolbox.
  await page.locator(".svc-toolbox__item, .svc-creator--mobile").first().waitFor({ state: "attached" });
  await page.locator(".svc-question__content").first().waitFor({ state: "visible" });
  await waitForSettledLayout(page);
}

/**
 * Block until no request is in flight and the DOM and the page size then stay
 * the same for `SETTLE_FRAMES` consecutive frames.
 *
 * What it waits out:
 *  - React re-renders after effects (the survey's "Prefill demo data" item, the
 *    mode toggle's label).
 *  - The toolbar responsiveness of the survey and the creator: a
 *    ResizeObserver schedules a `requestAnimationFrame` that fits the items and
 *    re-renders, sometimes in more than one pass. Each pass mutates the DOM, so
 *    a frame without mutations after one means the pass is done.
 *  - Next's prefetch of the other routes. On desktop the nav links to the
 *    builder, and loading its chunk runs survey-creator's icon registration,
 *    which replaces seven survey icons in the shared `SvgRegistry`
 *    (chevronleft/right-16x16, editsmall-16x16, plus/minus-32x32, more-16x16,
 *    error-24x24). It can land after the page is otherwise ready (checkout:
 *    50–100 ms later). The old 500 ms `networkidle` always let it land first,
 *    so the baselines have the creator's versions wherever those icons show.
 *
 * Font loads and image decodes change layout without a mutation:
 * `waitForFonts` and the image check in `waitForRouteReady` cover those.
 *
 * Not `toHaveScreenshot`'s own stability loop: two identical frames of a
 * half-rendered creator still match each other.
 */
export async function waitForSettledLayout(page: Page): Promise<void> {
  // Request events reach the test process a little after the browser starts a
  // request, so check again after the frames. The frames themselves also wait
  // for the page's own count of fetches and scripts (`trackPendingLoads`).
  do {
    await requestsDone(page);
    await quietFrames(page);
  } while (pendingRequests(page).length > 0);
}

async function quietFrames(page: Page): Promise<void> {
  const result = await page.evaluate(
    ({ frames, timeout }) =>
      new Promise<{ settled: boolean; pendingLoads: number }>((resolve) => {
        const pendingLoads = (): number =>
          (window as unknown as { __pwPendingLoads?: number }).__pwPendingLoads ?? 0;
        let mutated = false;
        const observer = new MutationObserver(() => {
          mutated = true;
        });
        // <head> left out: Next's prefetching adds tags there that paint nothing.
        observer.observe(document.documentElement, { attributes: true });
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
        const size = (): string => {
          const root = document.documentElement;
          return `${root.scrollWidth}x${root.scrollHeight}`;
        };

        const start = performance.now();
        let lastSize = size();
        let quiet = 0;
        const tick = (): void => {
          const currentSize = size();
          quiet = !mutated && currentSize === lastSize && pendingLoads() === 0 ? quiet + 1 : 0;
          mutated = false;
          lastSize = currentSize;
          if (quiet >= frames || performance.now() - start > timeout) {
            observer.disconnect();
            resolve({ settled: quiet >= frames, pendingLoads: pendingLoads() });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { frames: SETTLE_FRAMES, timeout: SETTLE_TIMEOUT_MS }
  );
  if (!result.settled) {
    throw new Error(
      `No ${SETTLE_FRAMES} quiet frames in a row for ${SETTLE_TIMEOUT_MS} ms ` +
        `(fetches or scripts still loading: ${result.pendingLoads}).`
    );
  }
}

const inFlight = new WeakMap<Page, Set<Request>>();

function trackRequests(page: Page): void {
  const pending = new Set<Request>();
  inFlight.set(page, pending);
  page.on("request", (request) => pending.add(request));
  page.on("requestfinished", (request) => pending.delete(request));
  page.on("requestfailed", (request) => pending.delete(request));
}

function pendingRequests(page: Page): Array<Request> {
  return [...(inFlight.get(page) ?? [])];
}

async function requestsDone(page: Page): Promise<void> {
  if (pendingRequests(page).length === 0) return;
  let onSettled = (): void => undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      new Promise<void>((resolve) => {
        // Registered after `trackRequests`' own listeners, so the request is
        // already out of the set when this runs.
        onSettled = () => {
          if (pendingRequests(page).length === 0) resolve();
        };
        page.on("requestfinished", onSettled);
        page.on("requestfailed", onSettled);
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const urls = pendingRequests(page).map((request) => request.url());
          reject(new Error(`Requests still in flight after ${SETTLE_TIMEOUT_MS} ms:\n  ${urls.join("\n  ")}`));
        }, SETTLE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    page.off("requestfinished", onSettled);
    page.off("requestfailed", onSettled);
  }
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
