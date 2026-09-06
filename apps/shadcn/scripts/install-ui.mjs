/**
 * Installs shadcn/ui registry components and writes the style-switching glue.
 *
 *   node scripts/install-ui.mjs             → full install (CLI + glue)
 *   node scripts/install-ui.mjs --glue-only → regenerate glue from existing files
 *   node scripts/install-ui.mjs --if-stale  → full install only if the registry moved
 *
 * --if-stale runs on postinstall: it hashes every registry item the install would
 * request (plus the pinned CLI version) and compares that against registry.lock.json.
 * It never writes. When the hash moves it prints one line asking for an explicit
 * `npm run install:ui`, because reinstalling from a postinstall would delete ~150
 * committed files and — since the CLI installs registry dependencies with
 * `npm install` — restart the very workspace install that spawned it. Missing style
 * folders are the one case it still installs on its own.
 *
 * Per-style shadcn configs live in scripts/ui-configs/<id>/components.json (committed).
 * Per-style registry components live in src/components/ui/styles/<id>/ (committed).
 * Chrome-only new-york components (button, sheet, dialog, dropdown-menu, badge)
 * live in src/components/ui/. Wiped and reinstalled on every `install:ui` run.
 * Dispatchers and stepper.tsx stay in git (glue only).
 *
 * Palette (base color) and accent (theme) are NOT baked into installed components.
 * Every style config keeps baseColor: "neutral" + cssVariables: true so controls
 * read var(--primary), var(--background), … at runtime. Switching is handled in
 * globals.css via data-shadcn-base-color and data-shadcn-theme on <html>.
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  unlinkSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const UI = join(ROOT, "src/components/ui");
const CONFIGS_DIR = join(here, "ui-configs");
const ROOT_CONFIG = join(ROOT, "components.json");
const LOCK = join(here, "registry.lock.json");

/** Pinned: a shadcn release must not silently move the fingerprint or the output. */
const CLI_VERSION = "4.16.2";
const CLI = `shadcn@${CLI_VERSION}`;

/**
 * `shadcn add` installs registry dependencies with `npm install`, which inside a
 * workspace re-runs the root install and this postinstall. The guard makes that
 * nested pass a no-op instead of an infinite reinstall loop.
 */
const REENTRY = "SHADCN_INSTALL_UI_ACTIVE";

/** Tailwind-v4 registry items import the `cn` npm package; we keep the local helper. */
const CN_IMPORT = 'from "cn"';
const LOCAL_CN_IMPORT = 'from "@/lib/utils"';

/** Rewritten by the CLI's dependency install; restored so the repo sees no churn. */
const MANIFESTS = [
  join(ROOT, "package.json"),
  join(ROOT, "../../package.json"),
  join(ROOT, "../../package-lock.json"),
];

/** Read-only mirror of what the CLI fetches — used for staleness checks, never to install. */
const REGISTRY = "https://ui.shadcn.com/r/styles";

/** Installed per visual style; internal-only deps (separator, input-group) included. */
const STYLE_COMPONENTS = [
  "alert",
  "button",
  "button-group",
  "card",
  "checkbox",
  "combobox",
  "field",
  "input",
  "input-group",
  "label",
  "radio-group",
  "separator",
  "switch",
  "table",
  "textarea",
];

/** Radix presets — combobox is not published for these styles in the shadcn registry. */
const RADIX_STYLES = new Set(["default", "new-york"]);
const COMBOBOX_FALLBACK_STYLE = "base-nova";

const CHROME_COMPONENTS = ["button", "sheet", "dialog", "dropdown-menu", "badge"];

/** Chrome components are always new-york, matching scripts/ui-configs/chrome. */
const CHROME_STYLE = "new-york";

/**
 * On a Tailwind v4 project the CLI silently serves the v4 payload for the new-york
 * style, so that is the item to hash — /r/styles/new-york/… is the v3 one nothing
 * installs. Every other style id is passed through as written.
 */
function registryStyle(styleId) {
  return styleId === "new-york" ? "new-york-v4" : styleId;
}

/** Components that get a runtime style dispatcher at src/components/ui/<name>.tsx */
const DISPATCH_COMPONENTS = [
  "alert",
  "button-group",
  "card",
  "checkbox",
  "combobox",
  "field",
  "input",
  "label",
  "radio-group",
  "switch",
  "table",
  "textarea",
];

const glueOnly = process.argv.includes("--glue-only");
const ifStale = process.argv.includes("--if-stale");

if (process.env[REENTRY]) {
  console.log("install-ui: nested npm install — nothing to do.");
  process.exit(0);
}

function styleIds() {
  return readdirSync(CONFIGS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "chrome")
    .map((d) => d.name)
    .sort();
}

function componentsForStyle(styleId) {
  if (RADIX_STYLES.has(styleId)) {
    return STYLE_COMPONENTS.filter((c) => c !== "combobox");
  }
  return STYLE_COMPONENTS;
}

function slug(id) {
  return id.replace(/-/g, "_");
}

function compVar(comp, styleId) {
  return `${comp.replace(/-/g, "_")}_${slug(styleId)}`;
}

function withConfig(configName, fn) {
  const original = readFileSync(ROOT_CONFIG, "utf8");
  writeFileSync(
    ROOT_CONFIG,
    readFileSync(join(CONFIGS_DIR, configName, "components.json"), "utf8"),
  );
  try {
    fn();
  } finally {
    writeFileSync(ROOT_CONFIG, original);
  }
}

function withPreservedManifests(fn) {
  const saved = MANIFESTS.filter(existsSync).map((f) => [
    f,
    readFileSync(f, "utf8"),
  ]);
  try {
    fn();
  } finally {
    for (const [file, content] of saved) {
      if (readFileSync(file, "utf8") !== content) writeFileSync(file, content);
    }
  }
}

function shadcnAdd(components, path) {
  const pathArg = path ? ` --path ${path}` : "";
  execSync(
    `npx --yes ${CLI} add ${components.join(" ")}${pathArg} --overwrite --yes --silent`,
    { cwd: ROOT, stdio: "inherit", env: { ...process.env, [REENTRY]: "1" } },
  );
}

function rewriteStyleImports(styleDir) {
  const styleId = basename(styleDir);
  for (const file of readdirSync(styleDir).filter((f) => f.endsWith(".tsx"))) {
    let content = readFileSync(join(styleDir, file), "utf8");
    for (const comp of STYLE_COMPONENTS) {
      content = content.replaceAll(`@/components/ui/${comp}`, `./${comp}`);
      // shadcn CLI with --path emits style-scoped paths, e.g.
      // @/components/ui/styles/base-lyra/button instead of @/components/ui/button.
      content = content.replaceAll(
        `@/components/ui/styles/${styleId}/${comp}`,
        `./${comp}`,
      );
    }
    content = content.replaceAll(CN_IMPORT, LOCAL_CN_IMPORT);
    writeFileSync(join(styleDir, file), content);
  }
}

function rewriteChromeImports() {
  for (const comp of CHROME_COMPONENTS) {
    const file = join(UI, `${comp}.tsx`);
    const content = readFileSync(file, "utf8");
    const next = content.replaceAll(CN_IMPORT, LOCAL_CN_IMPORT);
    if (next !== content) writeFileSync(file, next);
  }
}

function parseExports(filePath) {
  const content = readFileSync(filePath, "utf8");
  const matches = [...content.matchAll(/export\s*\{([^}]+)\}/g)];
  if (matches.length === 0) return [];
  return matches[matches.length - 1][1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split(/\s+as\s+/)[0].trim());
}

function parseAllExports(comp) {
  const names = new Set();
  for (const id of styleIds()) {
    const file = join(UI, "styles", id, `${comp}.tsx`);
    if (existsSync(file)) {
      for (const name of parseExports(file)) names.add(name);
    }
  }
  return [...names];
}

function classifyExport(name) {
  if (name.startsWith("use")) return "hook";
  if (/^[A-Z]/.test(name)) return "component";
  return "constant";
}

function comboboxStyleId(styleId) {
  return RADIX_STYLES.has(styleId) ? COMBOBOX_FALLBACK_STYLE : styleId;
}

function generateNamedDispatcher(comp, exportName) {
  const ids = styleIds();
  writeFileSync(
    join(UI, `${comp}.tsx`),
    `"use client";

// GLUE (not a shadcn component): renders the active visual style's CLI-generated
// <${exportName}> from styles/<id>/. Re-run \`npm run install:ui\` to regenerate.
import * as React from "react";
import { useStyle } from "@/components/StyleProvider";
import type { VisualStyleId } from "@/lib/styles";
${ids.map((id) => `import { ${exportName} as ${compVar(comp, id)} } from "./styles/${id}/${comp}";`).join("\n")}

const IMPLS: Record<VisualStyleId, React.ComponentType<any>> = {
${ids.map((id) => `  "${id}": ${compVar(comp, id)},`).join("\n")}
};

export function ${exportName}(props: React.ComponentProps<"input">) {
  const { style } = useStyle();
  const Impl = (IMPLS[style] ?? ${compVar(comp, ids[0])}) as React.ComponentType<
    React.ComponentProps<"input">
  >;
  return <Impl {...props} />;
}
`,
  );
}

function generateStyledButtonDispatcher() {
  const ids = styleIds();
  writeFileSync(
    join(UI, "styled-button.tsx"),
    `"use client";

// GLUE: per-style <Button> for the comparison column (StyledButton). base-* buttons
// are @base-ui/react (no asChild) — chrome keeps the Radix <Button> from ./button.
import * as React from "react";
import { useStyle } from "@/components/StyleProvider";
import type { VisualStyleId } from "@/lib/styles";
${ids.map((id) => `import { Button as ${compVar("button", id)} } from "./styles/${id}/button";`).join("\n")}

const BUTTONS: Record<VisualStyleId, React.ComponentType<any>> = {
${ids.map((id) => `  "${id}": ${compVar("button", id)},`).join("\n")}
};

type Props = React.ComponentProps<"button"> & { variant?: string; size?: string };

export function StyledButton(props: Props) {
  const { style } = useStyle();
  const Impl = (BUTTONS[style] ?? ${compVar("button", ids[0])}) as React.ComponentType<Props>;
  return <Impl {...props} />;
}
`,
  );
}

function generateModuleDispatcher(comp) {
  const ids = styleIds();
  const isCombobox = comp === "combobox";
  const sampleId = isCombobox ? COMBOBOX_FALLBACK_STYLE : ids[0];
  const sample = join(UI, "styles", sampleId, `${comp}.tsx`);
  if (!existsSync(sample)) {
    console.warn(`  skip dispatcher for ${comp}: ${sample} not found`);
    return;
  }

  const exports = parseAllExports(comp);
  const fallbackMod = compVar(comp, COMBOBOX_FALLBACK_STYLE);
  const importIds = isCombobox
    ? [...new Set(ids.map(comboboxStyleId))]
    : ids;

  writeFileSync(
    join(UI, `${comp}.tsx`),
    `"use client";

// GLUE: auto-generated by scripts/install-ui.mjs — do not edit.
${isCombobox ? `// default/new-york have no registry combobox; they reuse ${COMBOBOX_FALLBACK_STYLE} at runtime.\n` : ""}import * as React from "react";
import { useStyle } from "@/components/StyleProvider";
${importIds.map((id) => `import * as ${compVar(comp, id)} from "./styles/${id}/${comp}";`).join("\n")}

const MODULES = {
${ids.map((id) => `  "${id}": ${compVar(comp, isCombobox ? comboboxStyleId(id) : id)},`).join("\n")}
} as const;

${exports
  .map((name) => {
    const kind = classifyExport(name);
    if (kind === "hook") {
      return `export function ${name}() {
  const { style } = useStyle();
  const Mod = MODULES[style] ?? MODULES.default;
  return (Mod.${name} ?? ${fallbackMod}.${name})();
}`;
    }
    if (kind === "component") {
      return `export function ${name}(props: any) {
  const { style } = useStyle();
  const Mod = MODULES[style] ?? MODULES.default;
  const Comp = (Mod as any).${name} ?? (${fallbackMod} as any).${name};
  return <Comp {...props} />;
}`;
    }
    return `export { ${name} } from "./styles/${COMBOBOX_FALLBACK_STYLE}/${comp}";`;
  })
  .join("\n\n")}
`,
  );
}

function generateGlue() {
  console.log("Writing style-switching glue…");
  generateNamedDispatcher("input", "Input");
  generateStyledButtonDispatcher();
  for (const comp of DISPATCH_COMPONENTS) {
    if (comp === "input") continue;
    generateModuleDispatcher(comp);
  }
}

function cleanRegistry() {
  console.log("Cleaning registry components…");
  const stylesDir = join(UI, "styles");
  if (existsSync(stylesDir)) {
    for (const entry of readdirSync(stylesDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        rmSync(join(stylesDir, entry.name), { recursive: true, force: true });
      }
    }
  } else {
    mkdirSync(stylesDir, { recursive: true });
  }
  for (const comp of CHROME_COMPONENTS) {
    const file = join(UI, `${comp}.tsx`);
    if (existsSync(file)) unlinkSync(file);
  }
}

function installRegistry() {
  cleanRegistry();

  withPreservedManifests(() => {
    console.log("Installing per-style shadcn components…");
    for (const id of styleIds()) {
      console.log(`  ${id}`);
      const styleDir = join(UI, "styles", id);
      withConfig(id, () =>
        shadcnAdd(componentsForStyle(id), `src/components/ui/styles/${id}`),
      );
      rewriteStyleImports(styleDir);
    }

    for (const radixId of RADIX_STYLES) {
      const stray = join(UI, "styles", radixId, "combobox.tsx");
      if (existsSync(stray)) unlinkSync(stray);
    }

    console.log("Installing chrome components…");
    withConfig("chrome", () => shadcnAdd(CHROME_COMPONENTS));
    rewriteChromeImports();
  });

  validateInstalled();
}

/** True when `@/x` names a file under src/ — the alias every components.json sets. */
function resolvesInApp(spec) {
  const base = join(ROOT, "src", spec.slice(2));
  return ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].some((ext) =>
    existsSync(base + ext),
  );
}

/** Everything the app or the workspace root declares, hoisted into one set. */
function declaredPackages() {
  const names = new Set();
  for (const manifest of MANIFESTS.filter((f) => f.endsWith("package.json"))) {
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    for (const field of ["dependencies", "devDependencies"]) {
      for (const name of Object.keys(pkg[field] ?? {})) names.add(name);
    }
  }
  return names;
}

function packageName(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * The CLI installs registry dependencies itself and withPreservedManifests undoes
 * that, so anything the registry pulled in — the `cn` package the Tailwind-v4 items
 * import, say — has to be mapped by the rewrites above or the app stops building.
 * Same for @/ paths upstream authored against its own repo. Fail here, naming them,
 * instead of at `next build` half an hour later.
 */
function validateInstalled() {
  const declared = declaredPackages();
  const dirs = [UI, ...styleIds().map((id) => join(UI, "styles", id))];
  const bad = [];
  for (const dir of dirs.filter(existsSync)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      const full = join(dir, file);
      for (const [, spec] of readFileSync(full, "utf8").matchAll(
        /from "([^"]+)"/g,
      )) {
        if (spec.startsWith(".")) continue;
        const ok = spec.startsWith("@/")
          ? resolvesInApp(spec)
          : declared.has(packageName(spec));
        if (!ok) bad.push(`${full}: ${spec}`);
      }
    }
  }
  if (bad.length) {
    throw new Error(
      `Registry output imports what this app does not have:\n  ${bad.join("\n  ")}\n` +
        "Map them in the rewrites above, or declare them in package.json.",
    );
  }
}

function sha(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** Every registry item `installRegistry` would request, sorted for a stable hash. */
function registryUrls() {
  const urls = [];
  for (const id of styleIds()) {
    for (const comp of componentsForStyle(id)) {
      urls.push(`${REGISTRY}/${registryStyle(id)}/${comp}.json`);
    }
  }
  for (const comp of CHROME_COMPONENTS) {
    urls.push(`${REGISTRY}/${registryStyle(CHROME_STYLE)}/${comp}.json`);
  }
  return urls.sort();
}

/**
 * Hash of the upstream surface: every requested item plus the pinned CLI version that
 * transforms it. Transitive registry dependencies are covered only when they are
 * themselves in STYLE_COMPONENTS — an upstream change to a dep outside that list
 * slips through until the next explicit `npm run install:ui`.
 */
async function registryFingerprint() {
  const parts = await Promise.all(
    registryUrls().map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return `${url} ${sha(await res.text())}`;
    }),
  );
  parts.push(`shadcn ${CLI_VERSION}`);
  return sha(parts.join("\n"));
}

function writeLock(fingerprint) {
  writeFileSync(
    LOCK,
    `${JSON.stringify({ fingerprint }, null, 2)}\n`,
  );
}

function readLock() {
  if (!existsSync(LOCK)) return null;
  try {
    return JSON.parse(readFileSync(LOCK, "utf8")).fingerprint ?? null;
  } catch {
    return null;
  }
}

async function installIfStale() {
  let current = null;
  try {
    current = await registryFingerprint();
  } catch (err) {
    // Offline or the registry is down: never fail `npm i` over a freshness check.
    console.warn(`Skipping shadcn freshness check — ${err.message}`);
  }

  // Nothing installed locally — a postinstall is the only chance to get components.
  if (!stylesInstalled()) {
    console.log("Per-style shadcn components missing — running full install…");
    installRegistry();
    if (current) writeLock(current);
    generateGlue();
    return;
  }

  if (!current) return;

  const locked = readLock();
  if (locked === current) {
    console.log(`shadcn registry unchanged (${current}).`);
    return;
  }

  // Reinstalling here would delete ~150 committed files behind the user's back and
  // re-enter this very install through the CLI's dependency install. Ask instead.
  console.warn(
    `shadcn registry moved: ${locked ?? "no lock"} → ${current}. ` +
      "Run `npm run install:ui` to adopt it — files left untouched.",
  );
}

function stylesInstalled() {
  const marker = join(UI, "styles", styleIds()[0], "button.tsx");
  return existsSync(marker);
}

if (ifStale) {
  await installIfStale();
} else if (glueOnly) {
  if (!stylesInstalled()) {
    console.log("Per-style shadcn components missing — running full install…");
    installRegistry();
  } else {
    for (const id of styleIds()) {
      rewriteStyleImports(join(UI, "styles", id));
    }
  }
  generateGlue();
} else {
  installRegistry();
  writeLock(await registryFingerprint());
  generateGlue();
}

console.log("Done.");
