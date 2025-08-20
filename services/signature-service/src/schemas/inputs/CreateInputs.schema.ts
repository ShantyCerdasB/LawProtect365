/**
 * @file CreateInputs.schema.ts
 * @summary Request schema for creating inputs inside a document/envelope.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for creating input fields. */
export const CreateInputsBody = z.object({
  documentId: UuidV4,
  inputs: z.array(
    z.object({
      type: z.enum(["signature", "initials", "text", "date"]),
      page: z.number().int().positive(),
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().positive(),
      height: z.number().positive(),
      required: z.boolean().default(true),
    })
  ),
});
export type CreateInputsBody = z.infer<typeof CreateInputsBody>;
