/**
 * @file PatchEnvelope.schema.ts
 * @summary Request schema for updating an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for partially updating an envelope. */
export const PatchEnvelopeBody = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "sent", "in_progress", "completed", "canceled", "declined"]).optional(),
});
export type PatchEnvelopeBody = z.infer<typeof PatchEnvelopeBody>;
