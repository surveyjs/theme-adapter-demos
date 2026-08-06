import type { SchemaDefinition, SurveyJSON } from "../types";

/**
 * All-questions gallery — one of every SurveyJS V3 question type, laid out
 * exactly like the Creator toolbox: one page per toolbox category, in the
 * toolbox's category order, each page holding that category's questions in the
 * toolbox's order within the category.
 *
 * Page `name`/`title` mirror the toolbox category titles verbatim (from
 * survey-creator-core's `toolboxCategories`); membership/order mirror its
 * `defaultCategories`. This is the widest the adapter ever gets exercised — a
 * deliberate fidelity catalog, not a real form.
 *
 * Renderer-agnostic, like every schema here: these are plain `survey-core`
 * question types. No survey-creator-core import — the table above is encoded by
 * hand so the shipped package keeps its survey-core-only runtime dependency.
 */
export const allQuestionsJson: SurveyJSON = {
  title: "All Questions Gallery",
  description:
    "One of every SurveyJS V3 question type, grouped into pages that mirror the Creator toolbox categories one-for-one.",
  showQuestionNumbers: "off",
  widthMode: "responsive",
  showTOC: true,
  questionErrorLocation: "bottom",
  pages: [
    // 1 — choice → "Choice Questions"
    {
      name: "Choice Questions",
      title: "Choice Questions",
      elements: [
        {
          type: "radiogroup",
          name: "q_radiogroup",
          title: "Radio Button Group",
          choices: ["Espresso", "Cappuccino", "Latte", "Americano"],
        },
        {
          type: "rating",
          name: "q_rating",
          title: "Rating Scale",
          rateMax: 5,
          rateType: "stars",
        },
        {
          type: "slider",
          name: "q_slider",
          title: "Slider",
          min: 0,
          max: 100,
          step: 5,
        },
        {
          type: "checkbox",
          name: "q_checkbox",
          title: "Checkboxes",
          choices: ["Wi-Fi", "Breakfast", "Parking", "Pool"],
        },
        {
          type: "dropdown",
          name: "q_dropdown",
          title: "Dropdown",
          choices: ["United States", "Canada", "Mexico", "Brazil"],
        },
        {
          type: "tagbox",
          name: "q_tagbox",
          title: "Multi-Select Dropdown",
          choices: ["TypeScript", "JavaScript", "Python", "Rust", "Go"],
        },
        {
          type: "boolean",
          name: "q_boolean",
          title: "Yes/No (Boolean)",
          labelTrue: "Yes",
          labelFalse: "No",
        },
        {
          type: "file",
          name: "q_file",
          title: "File Upload",
          storeDataAsText: true,
          allowMultiple: true,
          maxSize: 10485760,
        },
        {
          type: "imagepicker",
          name: "q_imagepicker",
          title: "Image Picker",
          showLabel: true,
          choices: [
            {
              value: "lion",
              text: "Lion",
              imageLink:
                "https://surveyjs.io/Content/Images/examples/image-picker/lion.jpg",
            },
            {
              value: "giraffe",
              text: "Giraffe",
              imageLink:
                "https://surveyjs.io/Content/Images/examples/image-picker/giraffe.jpg",
            },
            {
              value: "panda",
              text: "Panda",
              imageLink:
                "https://surveyjs.io/Content/Images/examples/image-picker/panda.jpg",
            },
          ],
        },
        {
          type: "ranking",
          name: "q_ranking",
          title: "Ranking",
          choices: ["Quality", "Price", "Speed", "Support"],
        },
      ],
    },
    // 2 — text → "Text Input Questions"
    {
      name: "Text Input Questions",
      title: "Text Input Questions",
      elements: [
        {
          type: "text",
          name: "q_text",
          title: "Single-Line Input (phone mask)",
          inputType: "tel",
          maskType: "pattern",
          maskSettings: { pattern: "+1 (999) 999-9999" },
        },
        {
          type: "comment",
          name: "q_comment",
          title: "Long Text (multi-line)",
          rows: 4,
        },
        {
          type: "multipletext",
          name: "q_multipletext",
          title: "Multiple Text Boxes",
          itemTitleWidth: "100px",
          items: [
            { name: "city", title: "City" },
            { name: "state", title: "State" },
            { name: "zip", title: "ZIP code" },
          ],
        },
      ],
    },
    // 3 — containers → "Containers"
    {
      name: "Containers",
      title: "Containers",
      elements: [
        {
          type: "panel",
          name: "q_panel",
          title: "Panel",
          elements: [
            { type: "text", name: "panel_firstName", title: "First name" },
            {
              type: "text",
              name: "panel_lastName",
              title: "Last name",
              startWithNewLine: false,
            },
          ],
        },
        {
          type: "paneldynamic",
          name: "q_paneldynamic",
          title: "Dynamic Panel",
          panelCount: 2,
          minPanelCount: 1,
          panelAddText: "Add another",
          templateTitle: "Contact #{panelIndex}",
          templateElements: [
            { type: "text", name: "dp_name", title: "Name" },
            {
              type: "text",
              name: "dp_email",
              title: "Email",
              inputType: "email",
              startWithNewLine: false,
            },
          ],
        },
      ],
    },
    // 4 — matrix → "Matrix Questions"
    {
      name: "Matrix Questions",
      title: "Matrix Questions",
      elements: [
        {
          type: "matrix",
          name: "q_matrix",
          title: "Single-Select Matrix",
          columns: [
            { value: 1, text: "Poor" },
            { value: 2, text: "Fair" },
            { value: 3, text: "Good" },
            { value: 4, text: "Excellent" },
          ],
          rows: [
            { value: "checkin", text: "Check-in experience" },
            { value: "cleanliness", text: "Cleanliness" },
            { value: "value", text: "Value for money" },
          ],
        },
        {
          type: "matrixdropdown",
          name: "q_matrixdropdown",
          title: "Multi-Select Matrix",
          columns: [
            {
              name: "satisfaction",
              title: "Satisfaction",
              cellType: "rating",
              rateMax: 5,
            },
            {
              name: "recommend",
              title: "Would recommend?",
              cellType: "boolean",
            },
            {
              name: "comment",
              title: "Comment",
              cellType: "comment",
            },
          ],
          rows: [
            { value: "support", text: "Support" },
            { value: "billing", text: "Billing" },
          ],
        },
        {
          type: "matrixdynamic",
          name: "q_matrixdynamic",
          title: "Dynamic Matrix",
          rowCount: 2,
          addRowText: "Add line item",
          columns: [
            { name: "item", title: "Item", cellType: "text" },
            {
              name: "qty",
              title: "Qty",
              cellType: "text",
              inputType: "number",
            },
            {
              name: "priority",
              title: "Priority",
              cellType: "dropdown",
              choices: ["Low", "Medium", "High"],
            },
          ],
        },
      ],
    },
    // 5 — misc → "Misc"
    {
      name: "Misc",
      title: "Misc",
      elements: [
        {
          type: "html",
          name: "q_html",
          html:
            "<div class='sd-html-demo'><h4>HTML</h4><p>Arbitrary markup rendered inline — <strong>bold</strong>, <em>italic</em>, and a <a href='https://surveyjs.io' target='_blank' rel='noreferrer'>link</a>.</p></div>",
        },
        {
          type: "expression",
          name: "q_expression",
          title: "Expression (read-only computed value)",
          expression: "iif({q_slider} notempty, {q_slider}, 0) * 2",
          displayStyle: "decimal",
        },
        {
          type: "image",
          name: "q_image",
          title: "Image",
          imageLink:
            "https://surveyjs.io/Content/Images/examples/image-picker/panda.jpg",
          imageHeight: 200,
          imageWidth: 300,
        },
        {
          type: "signaturepad",
          name: "q_signaturepad",
          title: "Signature Pad",
        },
      ],
    },
  ],
};

export const allQuestionsSchema: SchemaDefinition = {
  id: "all-questions",
  title: "All Questions Gallery",
  description:
    "Every SurveyJS V3 question type, grouped into TOC pages that mirror the Creator toolbox categories — the broadest adapter-fidelity sweep.",
  json: allQuestionsJson,
};
