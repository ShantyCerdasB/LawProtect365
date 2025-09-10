/**
 * @file SendEnvelope.schema.ts
 * @summary Request schema for sending an envelope to recipients.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for sending an envelope. */
export const SendEnvelopeBody = z.object({
  message: z.string().max(2000).optional(),
  subject: z.string().max(255).optional()});
export type SendEnvelopeBody = z.infer<typeof SendEnvelopeBody>;

