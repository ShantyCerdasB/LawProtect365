/**
 * @file DelegateConsent.schema.ts
 * @summary Validation schemas for delegating consents
 * @description Zod schemas for POST /envelopes/:envelopeId/consents/:consentId/delegate endpoint
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeIdValidationSchema as EnvelopeIdSchema, ConsentIdValidationSchema as ConsentIdSchema } from "../../../shared/validations/schemas/common";

/** Path: /envelopes/:envelopeId/consents/:consentId/delegate */
export const DelegateConsentPath = z.object({ 
  envelopeId: EnvelopeIdSchema,
  consentId: ConsentIdSchema
});

/** Body */
export const DelegateConsentBody = z.object({
  delegateEmail: z.string().email(),
  delegateName: z.string().min(1),
  reason: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  ttlSeconds: z.number().int().positive().max(3600).optional(),
});

/** Response */
export const DelegateConsentResponse = z.object({
  delegationId: z.string(),
  consentId: z.string(),
  delegateEmail: z.string(),
  delegateName: z.string(),
  reason: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});

export type DelegateConsentPathType = z.infer<typeof DelegateConsentPath>;
export type DelegateConsentBodyType = z.infer<typeof DelegateConsentBody>;
export type DelegateConsentResponseType = z.infer<typeof DelegateConsentResponse>;




