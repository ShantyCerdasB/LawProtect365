/**
 * @file SigningConsentWithToken.schema.ts
 * @summary Signing Consent with Token request schemas
 * @description Zod schemas for signing consent requests using invitation tokens
 */

import { z } from "zod";
import { EnvelopeIdSchema, PartyIdSchema } from "@/domain/value-objects/ids";

/**
 * @summary Path parameters for signing consent with token request
 */
export const SigningConsentWithTokenPath = z.object({
  /** The envelope ID */
  id: EnvelopeIdSchema
});

/**
 * @summary Body schema for signing consent with token request
 */
export const SigningConsentWithTokenBody = z.object({
  /** The signer/party ID */
  signerId: PartyIdSchema,
  /** The invitation token for authentication */
  token: z.string().min(1, "Token is required"),
  /** Whether consent was given */
  consentGiven: z.boolean(),
  /** The consent text that was shown */
  consentText: z.string().min(1, "Consent text is required")
});

/**
 * @summary Complete schema for signing consent with token endpoint
 */
export const SigningConsentWithTokenSchema = {
  path: SigningConsentWithTokenPath,
  body: SigningConsentWithTokenBody
};
