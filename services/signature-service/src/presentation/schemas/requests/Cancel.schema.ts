/**
 * @file Cancel.schema.ts
 * @summary Request schema for canceling an envelope.
 * @description Defines the request body structure for canceling an envelope with an optional reason.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for canceling an envelope.
 * Contains an optional reason for the cancellation.
 */
export const CancelEnvelopeBody = z.object({
  /** Optional reason for canceling the envelope. */
  reason: z.string().max(1000, "Reason must be 1000 characters or less").optional(),
});

export type CancelEnvelopeBody = z.infer<typeof CancelEnvelopeBody>;







