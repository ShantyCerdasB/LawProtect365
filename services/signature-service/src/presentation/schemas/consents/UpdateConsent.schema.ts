/**
 * @file UpdateConsent.schema.ts
 * @summary Validation schemas for updating consents
 * @description Zod schemas for PATCH /envelopes/:envelopeId/consents/:consentId endpoint
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeIdValidationSchema as EnvelopeIdSchema, ConsentIdValidationSchema as ConsentIdSchema } from "../../../shared/validations/schemas/common";
import { ConsentStatusValidationSchema } from "../../../shared/validations/schemas/consent";

/** Path: /envelopes/:envelopeId/consents/:consentId */
export const UpdateConsentPath = z.object({ 
  envelopeId: EnvelopeIdSchema,
  consentId: ConsentIdSchema
});

/** Body */
export const UpdateConsentBody = z.object({
  status: ConsentStatusValidationSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().optional(),
  idempotencyKey: z.string().optional(),
  ttlSeconds: z.number().int().positive().max(3600).optional(),
});

/** Response */
export const UpdateConsentResponse = z.object({
  id: z.string(),
  envelopeId: z.string(),
  partyId: z.string(),
  type: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateConsentPathType = z.infer<typeof UpdateConsentPath>;
export type UpdateConsentBodyType = z.infer<typeof UpdateConsentBody>;
export type UpdateConsentResponseType = z.infer<typeof UpdateConsentResponse>;
