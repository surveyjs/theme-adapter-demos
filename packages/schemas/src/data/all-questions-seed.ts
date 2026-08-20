import type { SurveyData } from "../types";

/**
 * Demo "prefill" data for the All Questions gallery (`allQuestionsJson`).
 *
 * Keyed by the gallery question names so it can drop straight into a live
 * SurveyModel via `survey.mergeData` — one click fills the current toolbox
 * category page so a reviewer can walk the catalog without typing. Computed
 * (`q_expression`) and display-only (`q_html`, `q_image`) questions are omitted;
 * file and signature pad stay empty (binary payloads). Renderer-agnostic:
 * depends on nothing but `SurveyData`.
 */
export const allQuestionsSample: SurveyData = {
  // Choice Questions
  q_radiogroup: "Cappuccino",
  q_rating: 4,
  q_slider: 65,
  q_checkbox: ["Wi-Fi", "Parking"],
  q_dropdown: "Canada",
  q_tagbox: ["TypeScript", "Rust"],
  q_boolean: true,
  q_imagepicker: "panda",
  q_ranking: ["Speed", "Quality", "Support", "Price"],

  // Text Input Questions
  q_text: "+1 (415) 555-0142",
  q_comment:
    "Please leave the package with the concierge if nobody is home.",
  q_multipletext: {
    city: "San Francisco",
    state: "CA",
    zip: "94105",
  },

  // Containers
  panel_firstName: "Jordan",
  panel_lastName: "Avery",
  q_paneldynamic: [
    { dp_name: "Jordan Avery", dp_email: "jordan.avery@example.com" },
    { dp_name: "Sam Rivera", dp_email: "sam.rivera@example.com" },
  ],

  // Matrix Questions
  q_matrix: {
    checkin: 4,
    cleanliness: 3,
    value: 2,
  },
  q_matrixdropdown: {
    support: {
      satisfaction: 5,
      recommend: true,
      comment: "Resolved on the first call.",
    },
    billing: {
      satisfaction: 3,
      recommend: false,
      comment: "Invoice arrived a week late.",
    },
  },
  q_matrixdynamic: [
    { item: "Replacement filter", qty: "2", priority: "High" },
    { item: "Service visit", qty: "1", priority: "Medium" },
  ],
};
