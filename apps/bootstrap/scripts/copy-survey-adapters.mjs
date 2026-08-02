/**
 * Copies the per-theme Bootstrap SurveyJS adapter bundles the theme switcher
 * swaps between into `public/survey-adapters/<id>.css`, so they can be loaded as
 * plain <link> hrefs and set before paint by the no-flash inline script.
 *
 * Why a copy and not a webpack `import()`: the active theme is only known on the
 * client (localStorage), so the adapter has to be reachable at a STABLE URL that
 * a render-blocking <link> in <head> can point at. Loading it through webpack
 * meant the bundle could not arrive until after hydration — the survey painted
 * with stock survey-core V3 styling and then re-skinned. Mirrors the shadcn
 * app's scripts/copy-survey-adapters.mjs (and this app's scripts/copy-themes.mjs).
 *
 * Run automatically via the `predev` / `prebuild` npm scripts. Pass `--dev`, or
 * set `SURVEYJS_LIBV3` (shell / repo-root `.env`), to source the bundles from
 * the local V3 build (what webpack aliases survey-* to). Otherwise they come
 * from the published `survey-core` package. Pass `--watch` (local only) to keep
 * re-copying as you edit the adapters in the library checkout.
 */
import { createRequire } from "node:module";
import { mkdirSync, copyFileSync, existsSync, watch } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_DIRS,
  hasSurveyJsLibV3,
} from "../../../scripts/webpack-surveyjs-dev.mjs";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "public", "survey-adapters");

const useLocal = process.argv.includes("--dev") || hasSurveyJsLibV3;
const watchMode = useLocal && process.argv.includes("--watch");

// Keep in sync with `colorThemes` in src/lib/themes.ts (a .mjs script can't
// import the TS module). Each id has a matching `bootstrap-<id>` adapter bundle.
const themeIds = [
  "default",
  "zephyr",
  "cosmo",
  "morph",
  "flatly",
  "darkly",
  "lux",
  "litera",
];

/**
 * Root of the installed `survey-core`. Found by walking up from its main entry:
 * the package's `exports` map gates `./package.json` and rewrites unknown
 * subpaths to `.js`, so neither can be require.resolve'd directly.
 */
function surveyCoreRoot() {
  let dir = dirname(require.resolve("survey-core"));
  while (!existsSync(resolve(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("[survey-adapters] Cannot locate the survey-core package root.");
    dir = parent;
  }
  return dir;
}

// When local, source from the V3 build — exactly what the webpack alias points
// survey-* imports at. Otherwise take the published package.
const sourceDir = resolve(
  useLocal ? BUILD_DIRS["survey-core"] : surveyCoreRoot(),
  "themes/adapters"
);

/** Absolute path to a theme's adapter bundle; missing files throw. */
function sourceFor(id) {
  const from = resolve(sourceDir, `bootstrap-${id}.min.css`);
  if (!existsSync(from)) {
    throw new Error(
      `[survey-adapters] No Bootstrap adapter for "${id}".\n` +
        `Expected: ${from}\n` +
        (useLocal
          ? `Build the survey-library checkout (or unset SURVEYJS_LIBV3).`
          : `The installed survey-core ships no per-theme Bootstrap adapters — the ` +
            `app's adapter <link>s cannot resolve. Install a survey-core that includes them.`)
    );
  }
  return from;
}

function copyAll() {
  mkdirSync(outDir, { recursive: true });
  for (const id of themeIds) {
    copyFileSync(sourceFor(id), resolve(outDir, `${id}.css`));
  }
  console.log(`survey-adapters: ${themeIds.length} bundles <- ${sourceDir}`);
}

copyAll();

if (watchMode) {
  let queued = false;
  watch(sourceDir, (_event, file) => {
    if (!file?.startsWith("bootstrap-") || !file.endsWith(".min.css")) return;
    // The library build rewrites all files in a burst; coalesce into one copy.
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      try {
        copyAll();
      } catch (err) {
        console.error(`survey-adapters: ${err.message}`);
      }
    }, 100);
  });
  console.log(`survey-adapters: watching ${sourceDir}`);
}
