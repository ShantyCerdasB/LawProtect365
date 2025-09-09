/**
 * @file GetEnvelope.schema.ts
 * @summary Request/response schemas for getting an envelope by ID
 * @description Defines Zod schemas for envelope retrieval operations
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeWithIdParams, FullEnvelopeFields } from "./common";

/**
 * @description Path parameters schema for getting an envelope
 */
export const GetEnvelopeParams = EnvelopeWithIdParams;
export type GetEnvelopeParams = z.infer<typeof GetEnvelopeParams>;

/**
 * @description Response schema for envelope data
 */
export const GetEnvelopeResponse = FullEnvelopeFields.extend({
  parties: z.array(z.string()),
  documents: z.array(z.string()),
});

export type GetEnvelopeResponse = z.infer<typeof GetEnvelopeResponse>;






