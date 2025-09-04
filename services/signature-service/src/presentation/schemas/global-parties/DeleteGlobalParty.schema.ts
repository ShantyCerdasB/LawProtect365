/**
 * @file DeleteGlobalParty.schema.ts
 * @summary Schema for deleting Global Parties (contacts)
 * @description Zod schemas for validating Global Party deletion requests.
 * Provides type-safe validation for HTTP path parameters.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Path parameters schema for deleting a Global Party.
 */
export const DeleteGlobalPartyParams = z.object({
  partyId: z.string().min(1, "Party ID is required").max(255, "Party ID too long"),
});

/**
 * @description Type for DeleteGlobalParty path parameters.
 */
export type DeleteGlobalPartyParams = z.infer<typeof DeleteGlobalPartyParams>;

