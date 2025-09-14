/**
 * @file FinaliseEnvelope.schema.ts
 * @summary Request schema for finalizing an envelope after completion.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for finalizing an envelope. */
export const FinaliseEnvelopeBody = z.object({
  message: z.string().max(500).optional()});
export type FinaliseEnvelopeBody = z.infer<typeof FinaliseEnvelopeBody>;

