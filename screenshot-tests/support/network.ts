import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page, Route } from "@playwright/test";

// The pages load webfonts (the Bootswatch `@import`s of Google Fonts) and the
// all-questions images from the internet. Served from fixtures instead, so a
// run never depends on what those servers return that day. Everything else
// that would leave localhost is aborted and fails the test (`assertNoExternalRequests`).

const FIXTURES = resolve(__dirname, "..", "fixtures");
const FONTS = resolve(FIXTURES, "fonts");
const IMAGES = resolve(FIXTURES, "images");
// A RegExp, not a predicate: Playwright matches a RegExp in the browser layer,
// whereas a function makes every request (all of Next's localhost chunks
// included) wait for a round trip to the test worker.
const EXTERNAL = /^https?:\/\/(?!(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/)/;
const SURVEYJS_IMAGES = "https://surveyjs.io/Content/Images/";

// Written by fixtures/fetch-fonts.mjs: the full stylesheet URL from each theme
// file (Google's CSS differs per query, so no prefix match), and every font
// file those stylesheets reference.
type FontManifest = { css: Record<string, string>; files: Record<string, string> };
const manifest: FontManifest = JSON.parse(readFileSync(resolve(FONTS, "manifest.json"), "utf8"));

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

type Fixture = { path: string; contentType: string };

function fixtureFor(url: string): Fixture | undefined {
  if (manifest.css[url]) return { path: resolve(FONTS, manifest.css[url]), contentType: "text/css; charset=utf-8" };
  if (manifest.files[url]) return { path: resolve(FONTS, manifest.files[url]), contentType: "font/woff2" };
  if (url.startsWith(SURVEYJS_IMAGES)) {
    // https://surveyjs.io/Content/Images/examples/x.jpg -> fixtures/images/examples/x.jpg
    const relative = decodeURIComponent(new URL(url).pathname.slice("/Content/Images/".length));
    const contentType = IMAGE_TYPES[relative.split(".").pop()?.toLowerCase() ?? ""];
    if (contentType) return { path: resolve(IMAGES, relative), contentType };
  }
  return undefined;
}

const bodies = new Map<string, Buffer>();
const blocked = new WeakMap<Page, Set<string>>();

async function serve(page: Page, route: Route): Promise<void> {
  const url = route.request().url();
  const fixture = fixtureFor(url);
  if (!fixture || !existsSync(fixture.path)) {
    blocked.get(page)?.add(url);
    await route.abort("blockedbyclient");
    return;
  }
  let body = bodies.get(fixture.path);
  if (!body) {
    body = readFileSync(fixture.path);
    bodies.set(fixture.path, body);
  }
  await route.fulfill({
    status: 200,
    contentType: fixture.contentType,
    // Webfonts are fetched in CORS mode: without this header the face fails to load.
    headers: { "access-control-allow-origin": "*" },
    body,
  });
}

// Note that a route disables the HTTP cache for the whole page, localhost
// included: every navigation fetches everything again.
export async function routeExternalRequests(page: Page): Promise<void> {
  blocked.set(page, new Set());
  await page.route(EXTERNAL, (route) => serve(page, route));
}

export function assertNoExternalRequests(page: Page): void {
  const urls = [...(blocked.get(page) ?? [])];
  if (urls.length === 0) return;
  throw new Error(
    `Requests left localhost with no fixture and were aborted:\n  ${urls.join("\n  ")}\n` +
      "Webfonts: re-run screenshot-tests/fixtures/fetch-fonts.mjs. Images under " +
      `${SURVEYJS_IMAGES}: save them byte for byte under screenshot-tests/fixtures/images/.`
  );
}
