/**
 * @file CancelEnvelope.schema.ts
 * @summary Request schema for canceling an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for canceling an envelope. */
export const CancelEnvelopeBody = z.object({
  reason: z.string().max(500).optional(),
});
export type CancelEnvelopeBody = z.infer<typeof CancelEnvelopeBody>;






