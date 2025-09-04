/**
 * @file ListGlobalParties.schema.ts
 * @summary Schema for listing Global Parties (contacts)
 * @description Zod schemas for validating Global Party listing requests.
 * Provides type-safe validation for HTTP query parameters.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Query parameters schema for listing Global Parties.
 */
export const ListGlobalPartiesQuery = z.object({
  search: z.string().max(100, "Search term too long").optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .max(10, "Too many tags")
    .optional(),
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }).optional(),
  source: z.enum(["manual", "import", "api"], {
    errorMap: () => ({ message: "Source must be manual, import, or api" }),
  }).optional(),
  status: z.enum(["active", "inactive", "deleted"], {
    errorMap: () => ({ message: "Status must be active, inactive, or deleted" }),
  }).optional(),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional(),
  cursor: z.string().optional(),
});

/**
 * @description Type for ListGlobalParties query parameters.
 */
export type ListGlobalPartiesQuery = z.infer<typeof ListGlobalPartiesQuery>;


