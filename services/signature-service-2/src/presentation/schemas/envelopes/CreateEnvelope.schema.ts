/**
 * @file CreateEnvelope.schema.ts
 * @summary Request/response schemas for creating an envelope.
 * @description Defines Zod schemas for envelope creation payload validation and response formatting.
 */

import { z } from "@lawprotect/shared-ts";
import { 
  EnvelopeNameFields, 
  EnvelopeIdField, 
  CreatedAtField 
} from "./common";

/**
 * @description Path parameters schema for creating an envelope
 */
export const CreateEnvelopeParams = z.object({});

/**
 * @description Path parameters type for creating an envelope
 */
export type CreateEnvelopeParamsType = z.infer<typeof CreateEnvelopeParams>;

/**
 * @description Body payload schema for creating an envelope.
 * Validates the required fields for envelope creation including name, description, and owner.
 */
export const CreateEnvelopeBody = EnvelopeNameFields.extend({
  /** Owner email address */
  ownerEmail: z.string().email()});
export type CreateEnvelopeBody = z.infer<typeof CreateEnvelopeBody>;

/**
 * @description Response payload schema for a newly created envelope.
 * Defines the structure of the response returned after successful envelope creation.
 */
export const CreateEnvelopeResponse = z.object({
  /** Created envelope identifier */
  id: EnvelopeIdField,
  /** Creation timestamp */
  createdAt: CreatedAtField});
export type CreateEnvelopeResponse = z.infer<typeof CreateEnvelopeResponse>;

