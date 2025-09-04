/**
 * @file ListGlobalParties.schema.ts
 * @summary List Global Parties validation schema
 * @description Zod schema for validating Global Parties listing data
 */

import { z } from "@lawprotect/shared-ts";
import { PARTY_ROLES, GLOBAL_PARTY_STATUSES, PARTY_SOURCES } from "../../../../domain/values/enums";


/**
 * @description Schema for listing Global Parties
 */
export const ListGlobalPartiesSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  role: z.enum(PARTY_ROLES, { message: "Invalid party role" }).optional(),
  source: z.enum(PARTY_SOURCES, { message: "Invalid party source" }).optional(),
  status: z.enum(GLOBAL_PARTY_STATUSES, { message: "Invalid party status" }).optional(),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  cursor: z.string().optional(),
});

/**
 * @description Type inference from schema
 */
export type ListGlobalPartiesSchemaType = z.infer<typeof ListGlobalPartiesSchema>;
