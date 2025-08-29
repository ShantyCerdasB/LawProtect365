import { z } from "@lawprotect/shared-ts";
import { INPUT_VALUES } from "../values/enums";

/**
 * Supported input types for signing flows.
 */
export const InputTypeSchema = z.enum(INPUT_VALUES);
export type InputType = z.infer<typeof InputTypeSchema>;