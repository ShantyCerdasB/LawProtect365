/**
 * @file GetGlobalParty.schema.ts
 * @summary Get Global Party validation schema
 * @description Zod schema for validating Global Party retrieval data
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Schema for getting a Global Party
 */
export const GetGlobalPartySchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * @description Type inference from schema
 */
export type GetGlobalPartySchemaType = z.infer<typeof GetGlobalPartySchema>;

