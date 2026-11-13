import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page } from "@playwright/test";

/**
 * One capture. The file name (without `.json`) is the baseline basename; the
 * file itself is the survey pasted into the Creator JSON Editor. Drop another
 * `screenshot-tests/cases/<id>.json` in to add a case — the spec picks up
 * every file in that folder.
 */
export type Case = {
  id: string;
  json: unknown;
};

const CASES_DIR = resolve(process.cwd(), "screenshot-tests/cases");

/**
 * How many dynamic-panel entries the preview should render collapsed.
 * Read off the survey JSON (`panelsState: "collapsed"` plus `panelCount`) so a
 * new file opts into the check by its contents. Template elements are skipped:
 * they are not on the page while their parent entry is collapsed.
 */
export function expectedCollapsedPanels(json: unknown): number {
  if (!json || typeof json !== "object") return 0;
  const pages = (json as { pages?: unknown[] }).pages ?? [];
  let count = 0;

  const visitElements = (elements: unknown): void => {
    if (!Array.isArray(elements)) return;
    for (const element of elements) {
      if (!element || typeof element !== "object") continue;
      const record = element as Record<string, unknown>;
      if (record.type === "paneldynamic" && record.panelsState === "collapsed") {
        count += typeof record.panelCount === "number" ? record.panelCount : 0;
      }
      if (record.type === "panel") visitElements(record.elements);
    }
  };

  for (const page of pages) {
    if (page && typeof page === "object") {
      visitElements((page as { elements?: unknown }).elements);
    }
  }
  return count;
}

export function loadCases(): Case[] {
  return readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      id: file.slice(0, -".json".length),
      json: JSON.parse(readFileSync(resolve(CASES_DIR, file), "utf8")) as unknown,
    }));
}

/**
 * Replace the survey through the JSON Editor tab, then open Preview.
 *
 * The text goes in through Ace's own `setValue`, which fires the session
 * `change` the editor plugin listens to, so leaving the tab applies it the
 * same way a pasted edit does (`isAutoSave` is off — nothing applies until
 * the tab deactivates). Assigning `creator.JSON` from outside would skip that.
 */
export async function openCreatorPreview(page: Page, json: unknown): Promise<void> {
  await page.getByRole("tab", { name: "JSON Editor" }).click();
  const host = page.locator(".svc-json-editor-tab__ace-editor");
  await host.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const el = document.querySelector(".svc-json-editor-tab__ace-editor");
    const ace = (window as unknown as { ace?: { edit: (node: Element) => { getValue: () => string } } }).ace;
    return !!el && !!ace && ace.edit(el).getValue().trim().length > 0;
  });

  const text = JSON.stringify(json, null, 2);
  await host.evaluate((el, value) => {
    const ace = (window as unknown as {
      ace: { edit: (node: Element) => { setValue: (text: string, cursor: number) => void; getValue: () => string } };
    }).ace;
    const editor = ace.edit(el);
    editor.setValue(value, -1);
    if (editor.getValue() !== value) {
      throw new Error("JSON Editor did not accept the pasted survey");
    }
  }, text);

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.locator(".svc-test-tab__content .sd-root-modern")).toBeVisible();
}
