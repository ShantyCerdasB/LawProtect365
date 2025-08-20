/**
 * @file PatchInput.schema.ts
 * @summary Request schema for patching input metadata.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for updating an input field. */
export const PatchInputBody = z.object({
  required: z.boolean().optional(),
  assignedTo: z.string().uuid().optional(),
});
export type PatchInputBody = z.infer<typeof PatchInputBody>;
