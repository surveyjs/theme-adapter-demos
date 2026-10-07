import { Serializer } from "survey-core";

/**
 * Default description and error placement for every survey.
 *
 * Questions keep `descriptionLocation` / `errorLocation` at `"default"`, so they
 * inherit these survey values unless a question, panel, or page overrides them.
 * Set through Serializer (not per-schema JSON) so Creator and `new Model()`
 * pick them up the same way.
 */
Serializer.findProperty("survey", "questionDescriptionLocation").defaultValue = "underInput";
Serializer.findProperty("survey", "questionErrorLocation").defaultValue = "bottom";
