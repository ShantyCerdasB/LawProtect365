/**
 * @file DeleteParty.schema.ts
 * @summary Zod schemas for the DeleteParty endpoint
 * @description Zod schemas for validating Party deletion requests.
 * Provides type-safe validation for HTTP request path parameters.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for deleting a party.
 */
export const DeletePartyParams = z.object({
  tenantId: z.string().min(1, "Tenant ID is required").max(255, "Tenant ID too long"),
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
  partyId: z.string().min(1, "Party ID is required").max(255, "Party ID too long"),
});

/**
 * @description Type for DeleteParty path parameters.
 */
export type DeletePartyParams = z.infer<typeof DeletePartyParams>;



