/**
 * Installs shadcn/ui registry components and writes the style-switching glue.
 *
 * Run manually via `npm run install:ui` (not hooked to npm postinstall — the
 * shadcn CLI rewrites node_modules and breaks workspace installs).
 *
 *   node scripts/install-ui.mjs             → full install (CLI + glue)
 *   node scripts/install-ui.mjs --glue-only → regenerate glue from existing files
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
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const UI = join(ROOT, "src/components/ui");
const CONFIGS_DIR = join(here, "ui-configs");
const ROOT_CONFIG = join(ROOT, "components.json");

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

function shadcnAdd(components, path) {
  const pathArg = path ? ` --path ${path}` : "";
  execSync(
    `npx --yes shadcn@latest add ${components.join(" ")}${pathArg} --overwrite --yes --silent`,
    { cwd: ROOT, stdio: "inherit" },
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
    writeFileSync(join(styleDir, file), content);
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
}

function stylesInstalled() {
  const marker = join(UI, "styles", styleIds()[0], "button.tsx");
  return existsSync(marker);
}

if (glueOnly) {
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
  generateGlue();
}

console.log("Done.");
