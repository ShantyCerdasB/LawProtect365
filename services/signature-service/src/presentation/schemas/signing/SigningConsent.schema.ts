/**
 * @file SigningConsent.schema.ts
 * @summary Signing Consent request schemas
 * @description Zod schemas for signing consent requests
 */

import { z } from "zod";
import { EnvelopeIdSchema, PartyIdSchema } from "@/domain/value-objects/ids";

/**
 * @description Body schema for signing consent request
 */
export const SigningConsentBody = z.object({
  /** The signer/party ID */
  signerId: PartyIdSchema,
  /** Whether consent was given */
  consentGiven: z.boolean(),
  /** The consent text that was shown */
  consentText: z.string().min(1),
});

/**
 * @description Path schema for signing consent request
 */
export const SigningConsentParams = z.object({
  /** The envelope ID */
  id: EnvelopeIdSchema,
});






