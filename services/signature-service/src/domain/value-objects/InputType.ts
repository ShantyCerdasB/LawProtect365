import { z } from "@lawprotect/shared-ts";

/**
 * Supported input types for signing flows.
 */
export const InputTypeSchema = z.enum([
  "signature",
  "initials",
  "text",
  "checkbox",
  "date",
]);

export type InputType = z.infer<typeof InputTypeSchema>;
