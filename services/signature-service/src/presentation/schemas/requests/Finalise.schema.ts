/**
 * @file Finalise.schema.ts
 * @summary Request schema for finalizing an envelope.
 * @description Defines the request body structure for finalizing a completed envelope.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for finalizing an envelope.
 * Contains an optional message for the finalization process.
 */
export const FinaliseEnvelopeBody = z.object({
  /** Optional message for the finalization process. */
  message: z.string().max(500, "Message must be 500 characters or less").optional(),
});

export type FinaliseEnvelopeBody = z.infer<typeof FinaliseEnvelopeBody>;







