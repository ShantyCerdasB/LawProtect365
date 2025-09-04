/**
 * @file DeleteGlobalParty.schema.ts
 * @summary Delete Global Party validation schema
 * @description Zod schema for validating Global Party deletion data
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Schema for deleting a Global Party
 */
export const DeleteGlobalPartySchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * @description Type inference from schema
 */
export type DeleteGlobalPartySchemaType = z.infer<typeof DeleteGlobalPartySchema>;

