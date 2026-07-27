import { medicalFormJson } from "@adapter/schemas";
import { BuilderCreator } from "@/components/BuilderCreator";

/**
 * Builder route — the SurveyJS V3 Creator mounted against a SHARED schema from
 * `@adapter/schemas` (the same patient-intake definition the Claims route
 * renders), so the builder edits the one source of truth rather than a copy.
 *
 * The Creator is styled purely by the existing form-level shadcn adapter: its
 * chrome consumes the same `--sjs2-*` custom properties on the same theme root,
 * so it re-themes in lockstep with both the light/dark toggle and the visual-
 * style switcher, shipping zero Creator-specific adapter CSS or component
 * overrides. See `BuilderCreator` for the layering.
 */
export default function BuilderPage() {
  return <BuilderCreator json={medicalFormJson} />;
}
