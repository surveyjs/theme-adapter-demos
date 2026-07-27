/**
 * @adapter/schemas — single source of truth for SurveyJS V3 across all adapter demos.
 *
 * Renderer-agnostic: depends on `survey-core` only. Apps consume these exports
 * and never copy or redefine schemas.
 */

// Types
export type {
  SurveyJSON,
  SurveyData,
  SurveyMode,
  SchemaDefinition,
} from "./types";

// Schemas
export { checkoutJson, checkoutSchema } from "./schemas/checkout";
export { insuranceClaimJson, insuranceClaimSchema } from "./schemas/insurance-claim";
export { medicalFormJson, medicalFormSchema } from "./schemas/medical-form";
export { allQuestionsJson, allQuestionsSchema } from "./schemas/all-questions";

// Seed data
export {
  insuranceClaimSeed,
  type ClaimRecord,
} from "./data/insurance-claim-seed";
export { medicalFormSample } from "./data/medical-form-seed";
export { checkoutSample } from "./data/checkout-seed";

// Model factory
export {
  createSurveyModel,
  type CreateSurveyModelOptions,
  type SchemaInput,
} from "./model/createSurveyModel";

// Information architecture (routes + nav)
export {
  navItems,
  routes,
  getNavItem,
  themedPath,
  themeFromPathname,
  pagePathFromPathname,
  isActiveRoute,
  type NavItem,
  type NavId,
} from "./ia/navigation";

// Shared content (renderer-agnostic copy reused across apps)
export {
  formatKB,
  buildFormMetricsRows,
  FORM_METRICS_SUMMARY,
  FORM_METRICS_SURVEYJS_LABEL,
  FORM_METRICS_CAPTION,
  type FormMetricsRow,
  type FormMetricsInput,
} from "./content/form-metrics";

import { checkoutSchema } from "./schemas/checkout";
import { insuranceClaimSchema } from "./schemas/insurance-claim";
import { medicalFormSchema } from "./schemas/medical-form";
import { allQuestionsSchema } from "./schemas/all-questions";
import type { SchemaDefinition } from "./types";

/** Registry of all schemas keyed by id, for lookups from app routes. */
export const schemaRegistry: Record<string, SchemaDefinition> = {
  [checkoutSchema.id]: checkoutSchema,
  [insuranceClaimSchema.id]: insuranceClaimSchema,
  [medicalFormSchema.id]: medicalFormSchema,
  [allQuestionsSchema.id]: allQuestionsSchema,
};

/** All schemas as an array (e.g. for a landing page gallery). */
export const allSchemas: readonly SchemaDefinition[] = [
  checkoutSchema,
  insuranceClaimSchema,
  medicalFormSchema,
  allQuestionsSchema,
];
