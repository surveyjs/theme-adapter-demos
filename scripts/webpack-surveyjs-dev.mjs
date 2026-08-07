/**
 * Local SurveyJS resolution for the demo apps.
 *
 * The root package.json pins the survey-* packages to the published `next`
 * dist-tag, so by default `next build` / `next start` consume the npm packages.
 * `next dev` aliases survey-* imports to the local V3 `build/` folders when
 * those checkouts are present. `next build` does the same when `SURVEYJS_LIBV3`
 * is set (shell or repo-root `.env` / `.env.local`), so production builds can
 * target your working copy without package.json edits.
 *
 * Local build location: the parent folder of this repo by default (the folder
 * that holds the `survey-library` and `survey-creator` checkouts). Override it
 * with the SURVEYJS_LIBV3 env var (absolute, or relative to the repo root).
 * Loaded here directly, since Next only reads per-app .env and Turbo's strict
 * env mode strips undeclared vars before they reach the task process.
 *
 * The checkouts are optional: a plain clone has none, so `next dev` falls back
 * to the published packages. A HALF-built local setup is not a fallback case —
 * some builds present and others missing throws, as does any missing build once
 * SURVEYJS_LIBV3 has explicitly opted in.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const LIB_NAMES = [
  "survey-core",
  "survey-react-ui",
  "survey-creator-core",
  "survey-creator-react",
];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Load KEY=VALUE lines from repo-root .env files into process.env without
 * clobbering vars already set (an explicit shell value always wins).
 * `.env.local` (per-machine, git-ignored) takes precedence over `.env`.
 */
function loadRootDotenv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key in process.env) continue;
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadRootDotenv();

/** True when SURVEYJS_LIBV3 is set (shell or repo-root .env / .env.local). */
export const hasSurveyJsLibV3 = Boolean(process.env.SURVEYJS_LIBV3);

const base = hasSurveyJsLibV3
  ? resolve(repoRoot, process.env.SURVEYJS_LIBV3)
  : resolve(repoRoot, "..");

/**
 * The local V3 build folder each survey-* import is aliased to. Exported so
 * asset scripts (e.g. apps/shadcn/scripts/copy-survey-adapters.mjs) pull from
 * the exact same place webpack does.
 */
export const BUILD_DIRS = {
  "survey-core": resolve(base, "survey-library/packages/survey-core/build"),
  "survey-react-ui": resolve(base, "survey-library/packages/survey-react-ui/build"),
  "survey-creator-core": resolve(base, "survey-creator/packages/survey-creator-core/build"),
  "survey-creator-react": resolve(base, "survey-creator/packages/survey-creator-react/build"),
};

// Watch node_modules only for our linked survey-* builds. `@adapter/schemas`
// needs no exception: webpack resolves the workspace link to its realpath under
// packages/, which is outside node_modules and therefore watched normally.
const IGNORE_NODE_MODULES_EXCEPT_LINKED =
  /[\\/]node_modules[\\/](?!(survey-core|survey-react-ui|survey-creator-core|survey-creator-react)([\\/]|$))/;

/** Build dirs from BUILD_DIRS that don't exist on disk. */
function missingSurveyBuilds() {
  return LIB_NAMES.filter((name) => !existsSync(BUILD_DIRS[name]));
}

/**
 * True when no local V3 build exists at all — a plain clone with no sibling
 * survey-library / survey-creator checkouts. Only meaningful without an
 * explicit SURVEYJS_LIBV3, which opts in and therefore must resolve.
 */
function noLocalSurveyBuilds() {
  return missingSurveyBuilds().length === LIB_NAMES.length;
}

/**
 * Whether survey-* resolve to the local V3 builds. Exported so asset scripts
 * (e.g. apps/*​/scripts/copy-survey-adapters.mjs) copy CSS from the same place
 * webpack takes the JS from — the two must never disagree.
 */
export const useLocalSurveyBuilds = hasSurveyJsLibV3 || !noLocalSurveyBuilds();

/**
 * Alias survey-* to the local builds when `next dev` is running, or when
 * `SURVEYJS_LIBV3` is set (so `next build` can target the same working copy).
 * No-op for production builds without the env var — those use the published
 * npm packages, as does any run with no local checkouts at all.
 *
 * A partially built local setup throws rather than silently falling back to
 * npm, so a broken checkout fails loudly instead of shipping mixed versions.
 * @param {import('webpack').Configuration} config
 * @param {{ dev: boolean }} ctx
 */
export function applyLocalSurveyJs(config, { dev }) {
  if (!dev && !hasSurveyJsLibV3) return config;
  if (!useLocalSurveyBuilds) return config;

  const missing = missingSurveyBuilds();
  if (missing.length > 0) {
    throw new Error(
      `[surveyjs-dev] Local SurveyJS builds not found for: ${missing.join(", ")}.\n` +
        `Expected under base "${base}" (override with SURVEYJS_LIBV3). Missing paths:\n` +
        missing.map((name) => `  - ${BUILD_DIRS[name]}`).join("\n") +
        `\nBuild the survey-library / survey-creator checkouts, or unset ` +
        `SURVEYJS_LIBV3 / comment it out in .env to use the published npm packages.`
    );
  }

  // Redirect every survey-* import — bare package plus CSS/themes/i18n
  // subpaths — to the local build folder.
  config.resolve.alias = { ...config.resolve.alias };
  for (const name of LIB_NAMES) config.resolve.alias[name] = BUILD_DIRS[name];

  // The external builds ship no node_modules of their own, so bare peer
  // imports inside them (react, react-dom, …) must resolve against THIS
  // workspace's single hoisted copy. Adding these dirs as resolve roots keeps
  // one React instance without hard-aliasing `react` (which would break the
  // App Router's `react-server` conditional exports).
  //
  // Order matters. Webpack treats an absolute entry as "look only here" and the
  // relative "node_modules" as "walk up the ancestors, Node-style", trying them
  // in array order. Listing the roots FIRST makes the hoisted copy win over the
  // nested one npm deliberately installed for a version conflict — e.g.
  // prop-types would get react-is 19 instead of the 16 it declares. Keep them
  // LAST so they only serve the external builds, which have no ancestors here.
  config.resolve.modules = [
    ...(config.resolve.modules ?? ["node_modules"]),
    resolve(config.context ?? repoRoot, "node_modules"),
    resolve(repoRoot, "node_modules"),
  ];

  // Hot-reload edits made in the local builds (dev), and avoid stale caches
  // when switching between local and npm resolution. The aliased builds live
  // outside node_modules, so webpack's managed/immutable-path defaults for
  // node_modules do not apply to them and are left alone.
  config.cache = false;
  config.watchOptions = {
    ...config.watchOptions,
    ignored: IGNORE_NODE_MODULES_EXCEPT_LINKED,
  };

  return config;
}
