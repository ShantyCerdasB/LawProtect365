/**
 * @file SearchGlobalPartiesByEmail.schema.ts
 * @summary Schema for searching Global Parties by email
 * @description Zod schemas for validating Global Party email search requests.
 * Provides type-safe validation for HTTP query parameters.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Query parameters schema for searching Global Parties by email.
 */
export const SearchGlobalPartiesByEmailQuery = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional(),
});

/**
 * @description Type for SearchGlobalPartiesByEmail query parameters.
 */
export type SearchGlobalPartiesByEmailQuery = z.infer<typeof SearchGlobalPartiesByEmailQuery>;

