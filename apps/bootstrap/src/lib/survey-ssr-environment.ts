import { settings, type ISurveyEnvironment } from "survey-core";

/**
 * survey-react-ui's dropdown/tagbox `renderFilterInput` destructures
 * `settings.environment.root` without guarding for SSR. Import this module
 * before `survey-react-ui` so the stub is applied to the same survey-core
 * instance the renderer uses.
 */
// Screenshot tests hook this assignment to switch animation off before any
// model is built (screenshot-tests/support/capture.ts).
if (typeof window !== "undefined") {
  (window as unknown as { Survey: { settings: typeof settings } }).Survey = { settings };
}

if (settings.environment == null) {
  const stubElement = {} as HTMLElement;
  settings.environment = {
    root: {} as Document,
    rootElement: stubElement,
    popupMountContainer: stubElement,
    svgMountContainer: stubElement,
    stylesSheetsMountContainer: stubElement,
  } satisfies ISurveyEnvironment;
}
