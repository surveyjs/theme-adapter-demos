// Downloads the Google Fonts the Bootswatch themes `@import`, so the screenshot
// tests can serve them from disk (support/network.ts) instead of the internet.
//
//   node screenshot-tests/fixtures/fetch-fonts.mjs
//
// Re-run it after a Bootswatch update (a theme's `@import` URL changes, and
// the tests then fail listing the URL they had no fixture for) and commit the
// result. New font bytes can move the bootstrap baselines: re-record them on CI.
//
// Google picks the font format and the `unicode-range` subsets by User-Agent,
// so the CSS is requested with the one the tests run with (`Desktop Chrome`
// from @playwright/test, as in playwright.config.ts).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { devices } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "fonts");
const bootstrapApp = resolve(here, "..", "..", "apps", "bootstrap");
const requireFromApp = createRequire(resolve(bootstrapApp, "package.json"));
const userAgent = devices["Desktop Chrome"].userAgent;

// The stylesheets the app serves are the `sources` of copy-themes.mjs. That
// script copies files when imported, so its list is read as text.
const copyThemes = readFileSync(resolve(bootstrapApp, "scripts", "copy-themes.mjs"), "utf8");
const themeFiles = [...copyThemes.matchAll(/^\s*([\w-]+):\s*"([^"]+\.css)"/gm)].map(
  ([, id, spec]) => ({ id, path: requireFromApp.resolve(spec) })
);
if (themeFiles.length === 0) throw new Error("fetch-fonts: no theme list found in copy-themes.mjs");

async function download(url) {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`fetch-fonts: ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

// "family=Nunito+Sans:wght@200;300" -> "nunito-sans"
function cssFileName(cssUrl, taken) {
  const family = new URL(cssUrl).searchParams.get("family") ?? "font";
  const base = family.split(":")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let name = `${base}.css`;
  for (let i = 2; taken.has(name); i += 1) name = `${base}-${i}.css`;
  taken.add(name);
  return name;
}

const manifest = { userAgent, css: {}, files: {} };
const cssNames = new Set();
let total = 0;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(resolve(outDir, "css"), { recursive: true });

for (const { id, path } of themeFiles) {
  const sheet = readFileSync(path, "utf8");
  const cssUrls = [...sheet.matchAll(/@import url\(["']?(https:\/\/fonts\.googleapis\.com\/[^"')]+)["']?\)/g)].map(
    (m) => new URL(m[1]).href
  );
  if (cssUrls.length === 0) console.log(`fetch-fonts: ${id}: no webfont`);

  for (const cssUrl of cssUrls) {
    if (manifest.css[cssUrl]) {
      console.log(`fetch-fonts: ${id}: ${cssUrl} (shared)`);
      continue;
    }
    const css = await download(cssUrl);
    const cssName = cssFileName(cssUrl, cssNames);
    writeFileSync(resolve(outDir, "css", cssName), css);
    manifest.css[cssUrl] = `css/${cssName}`;
    total += css.length;

    const fontUrls = [...css.toString("utf8").matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(
      (m) => new URL(m[1]).href
    );
    for (const fontUrl of new Set(fontUrls)) {
      if (manifest.files[fontUrl]) continue;
      const font = await download(fontUrl);
      // https://fonts.gstatic.com/s/nunito/v32/x.woff2 -> files/nunito/v32/x.woff2
      const file = `files/${new URL(fontUrl).pathname.replace(/^\/s\//, "")}`;
      mkdirSync(dirname(resolve(outDir, file)), { recursive: true });
      writeFileSync(resolve(outDir, file), font);
      manifest.files[fontUrl] = file;
      total += font.length;
    }
    console.log(`fetch-fonts: ${id}: ${cssUrl} -> ${cssName}, ${new Set(fontUrls).size} files`);
  }
}

writeFileSync(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `fetch-fonts: ${Object.keys(manifest.css).length} stylesheets, ${Object.keys(manifest.files).length} font files, ` +
    `${(total / 1024).toFixed(0)} KiB -> ${outDir}`
);
