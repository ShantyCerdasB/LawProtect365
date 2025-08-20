/**
 * @file CreateEnvelope.schema.ts
 * @summary Request/response schemas for creating an envelope.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for creating an envelope. */
export const CreateEnvelopeBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  ownerId: UuidV4,
});
export type CreateEnvelopeBody = z.infer<typeof CreateEnvelopeBody>;

/** Response payload for a newly created envelope. */
export const CreateEnvelopeResponse = z.object({
  id: UuidV4,
  createdAt: z.string().datetime(),
});
export type CreateEnvelopeResponse = z.infer<typeof CreateEnvelopeResponse>;
