/**
 * @file DeleteEnvelope.schema.ts
 * @summary Request/response schemas for deleting an envelope
 * @description Defines Zod schemas for envelope deletion operations
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeWithIdParams, EnvelopeIdField } from "./common";

/**
 * @description Path parameters schema for deleting an envelope
 */
export const DeleteEnvelopeParams = EnvelopeWithIdParams;
export type DeleteEnvelopeParams = z.infer<typeof DeleteEnvelopeParams>;

/**
 * @description Response schema for envelope deletion
 */
export const DeleteEnvelopeResponse = z.object({
  deleted: z.boolean(),
  envelopeId: EnvelopeIdField,
});

export type DeleteEnvelopeResponse = z.infer<typeof DeleteEnvelopeResponse>;






