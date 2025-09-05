/**
 * @file RequestSignature.schema.ts
 * @summary Schema for requesting a signature from a party
 * @description Zod schemas for validating request signature requests
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeIdSchema, PartyIdSchema } from "../../../domain/value-objects/Ids";

/**
 * @description Request body schema for requesting a signature
 */
export const RequestSignatureBody = z.object({
  partyId: PartyIdSchema,
  message: z.string().max(1000, "Message too long").optional(),
  channel: z.enum(["email", "sms"]).optional(),
});

/**
 * @description Path parameters schema for envelope operations
 */
export const EnvelopePath = z.object({
  envelopeId: EnvelopeIdSchema,
});

/**
 * @description Type for RequestSignature request body
 */
export type RequestSignatureBody = z.infer<typeof RequestSignatureBody>;

/**
 * @description Type for envelope path parameters
 */
export type EnvelopePath = z.infer<typeof EnvelopePath>;