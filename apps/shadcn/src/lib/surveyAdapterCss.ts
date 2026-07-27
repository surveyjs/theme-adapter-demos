/**
 * SurveyJS adapter + host override stylesheet URLs for a visual style.
 * Linked statically from `[theme]/layout` — no runtime <link> swapping.
 */
import type { VisualStyleId } from "./styles";

export const SURVEY_OVERRIDES_SHARED_HREF = "/survey-overrides/shadcn.css";

export function surveyAdapterHref(style: VisualStyleId): string {
  return `/survey-adapters/${style}.css`;
}

export function surveyOverridesHref(style: VisualStyleId): string {
  return `/survey-overrides/${style}.css`;
}
