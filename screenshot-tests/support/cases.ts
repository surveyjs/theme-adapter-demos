import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

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
      ace: { edit: (node: Element) => { setValue: (text: string, cursor: number) => void } };
    }).ace;
    ace.edit(el).setValue(value, -1);
  }, text);

  await page.getByRole("tab", { name: "Preview" }).click();
  await page.locator(".svc-test-tab__content .sd-root-modern").waitFor({ state: "visible" });

  // Applying the JSON sets the creator's state to "modified", which shows a
  // "Modified" toast over the preview for `settings.notifications.lifetime`
  // (2 s). The baselines were captured after it had gone.
  const toast = page.locator(".svc-notifier--shown", { hasText: "Modified" });
  await toast.waitFor({ state: "visible" });
  await toast.waitFor({ state: "hidden" });
}

/**
 * Matrix tables scroll inside `.sd-table-wrapper`. Wait until overflow exists,
 * then park the thumb in the middle so sticky edges and the scroller chrome
 * show up in the baseline. Throws if the scroll did not stick — silent no-ops
 * produced left-aligned baselines that looked scrolled-ready but weren't.
 */
export async function scrollTableWrapperToMiddle(page: Page): Promise<void> {
  const wrapper = page.locator(".svc-test-tab__content .sd-table-wrapper").first();
  await wrapper.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const el = document.querySelector(
      ".svc-test-tab__content .sd-table-wrapper"
    ) as HTMLElement | null;
    return !!el && el.scrollWidth - el.clientWidth > 1;
  });
  const result = await wrapper.evaluate((el) => {
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = max / 2;
    return { max, left: el.scrollLeft };
  });
  if (result.max <= 1 || result.left < result.max / 4) {
    throw new Error(
      `scrollTableWrapperToMiddle failed: scrollLeft=${result.left}, max=${result.max}`
    );
  }
}
