/**
 * @file Decline.schema.ts
 * @summary Request schema for declining an envelope.
 * @description Defines the request body structure for declining an envelope with an optional reason.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for declining an envelope.
 * Contains an optional reason for the decline.
 */
export const DeclineEnvelopeBody = z.object({
  /** Optional reason for declining the envelope. */
  reason: z.string().max(1000, "Reason must be 1000 characters or less").optional()});

export type DeclineEnvelopeBody = z.infer<typeof DeclineEnvelopeBody>;

