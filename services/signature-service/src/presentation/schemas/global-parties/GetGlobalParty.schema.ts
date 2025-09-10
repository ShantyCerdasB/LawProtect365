/**
 * @file GetGlobalParty.schema.ts
 * @summary Schema for getting Global Party (contact) by ID
 * @description Zod schemas for validating Global Party retrieval requests.
 * Provides type-safe validation for HTTP path parameters.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Path parameters schema for getting a Global Party.
 */
export const GetGlobalPartyParams = z.object({
  globalPartyId: z.string().min(1, "Global Party ID is required").max(255, "Global Party ID too long")});

/**
 * @description Type for GetGlobalParty path parameters.
 */
export type GetGlobalPartyParams = z.infer<typeof GetGlobalPartyParams>;

