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
  /** Input information from Documents Service */
  inputs: z.object({
    /** Whether the envelope has inputs */
    hasInputs: z.boolean(),
    /** Total number of inputs */
    inputCount: z.number().int().min(0)
  })
});

export type FinaliseEnvelopeBody = z.infer<typeof FinaliseEnvelopeBody>;

