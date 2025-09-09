/**
 * @file GetParty.schema.ts
 * @summary Schema for getting a specific Party
 * @description Zod schemas for validating Party retrieval requests.
 * Provides type-safe validation for HTTP request path parameters.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for getting a specific party.
 */
export const GetPartyParams = z.object({
  tenantId: z.string().min(1, "Tenant ID is required").max(255, "Tenant ID too long"),
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
  partyId: z.string().min(1, "Party ID is required").max(255, "Party ID too long"),
});

/**
 * @description Type for GetParty path parameters.
 */
export type GetPartyParams = z.infer<typeof GetPartyParams>;






