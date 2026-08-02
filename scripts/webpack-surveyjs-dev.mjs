/**
 * Local SurveyJS resolution for the demo apps.
 *
 * The root package.json pins the survey-* packages to the published `next`
 * dist-tag, so by default `next build` / `next start` consume the npm packages.
 * `next dev` always aliases survey-* imports to the local V3 `build/` folders.
 * `next build` does the same when `SURVEYJS_LIBV3` is set (shell or repo-root
 * `.env` / `.env.local`), so production builds can target your working copy
 * without package.json edits.
 *
 * Local build location: the parent folder of this repo by default (the folder
 * that holds the `survey-library` and `survey-creator` checkouts). Override it
 * with the SURVEYJS_LIBV3 env var (absolute, or relative to the repo root).
 * Loaded here directly, since Next only reads per-app .env and Turbo's strict
 * env mode strips undeclared vars before they reach the task process.
 * When local resolution is active, missing builds throw instead of quietly
 * falling back to the npm packages.
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

// Watch node_modules only for our linked survey-* builds + @adapter/schemas.
const IGNORE_NODE_MODULES_EXCEPT_LINKED =
  /[\\/]node_modules[\\/](?!(survey-core|survey-react-ui|survey-creator-core|survey-creator-react)([\\/]|$)|@adapter[\\/]schemas([\\/]|$))/;

/** Build dirs from BUILD_DIRS that don't exist on disk. */
function missingSurveyBuilds() {
  return LIB_NAMES.filter((name) => !existsSync(BUILD_DIRS[name]));
}

/**
 * Alias survey-* to the local builds when `next dev` is running, or when
 * `SURVEYJS_LIBV3` is set (so `next build` can target the same working copy).
 * No-op for production builds without the env var — those use the published
 * npm packages.
 *
 * When local resolution is active, missing builds throw rather than silently
 * falling back to npm, so a broken local setup fails loudly.
 * @param {import('webpack').Configuration} config
 * @param {{ dev: boolean }} ctx
 */
export function applyLocalSurveyJs(config, { dev }) {
  if (!dev && !hasSurveyJsLibV3) return config;

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
  config.resolve.modules = [
    resolve(config.context ?? repoRoot, "node_modules"),
    resolve(repoRoot, "node_modules"),
    ...(config.resolve.modules ?? ["node_modules"]),
  ];

  // Hot-reload edits made in the local builds (dev), and avoid stale caches
  // when switching between local and npm resolution.
  config.cache = false;
  config.snapshot = { ...config.snapshot, immutablePaths: [], managedPaths: [] };
  config.watchOptions = {
    ...config.watchOptions,
    followSymlinks: true,
    ignored: IGNORE_NODE_MODULES_EXCEPT_LINKED,
  };

  return config;
}
