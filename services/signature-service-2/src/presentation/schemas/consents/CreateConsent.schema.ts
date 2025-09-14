/**
 * @file CreateConsent.schema.ts
 * @summary Validation schemas for creating consents
 * @description Zod schemas for POST /envelopes/:envelopeId/consents endpoint
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeIdValidationSchema as EnvelopeIdSchema, PartyIdValidationSchema as PartyIdSchema } from "@/domain/value-objects/ids";
import { ConsentTypeValidationSchema } from "@/domain/value-objects/consent";

/** Path: /envelopes/:envelopeId/consents */
export const CreateConsentPath = z.object({ 
  envelopeId: EnvelopeIdSchema 
});

/** Body */
export const CreateConsentBody = z.object({
  partyId: PartyIdSchema,
  consentType: ConsentTypeValidationSchema,
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().optional(),
  idempotencyKey: z.string().optional(),
  ttlSeconds: z.number().int().positive().max(3600).optional()});

/** Response */
export const CreateConsentResponse = z.object({
  id: z.string(),
  envelopeId: z.string(),
  partyId: z.string(),
  type: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional()});

export type CreateConsentPathType = z.infer<typeof CreateConsentPath>;
export type CreateConsentBodyType = z.infer<typeof CreateConsentBody>;
export type CreateConsentResponseType = z.infer<typeof CreateConsentResponse>;

