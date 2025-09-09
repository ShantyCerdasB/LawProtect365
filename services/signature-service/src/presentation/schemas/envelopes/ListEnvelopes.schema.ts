/**
 * @file ListEnvelopes.schema.ts
 * @summary Request/response schemas for listing envelopes
 * @description Defines Zod schemas for envelope listing operations
 */

import { z } from "@lawprotect/shared-ts";
import { 
  TenantOnlyParams, 
  FullEnvelopeFields, 
  PAGINATION_LIMITS 
} from "./common";

/**
 * @description Path parameters schema for listing envelopes
 */
export const ListEnvelopesParams = TenantOnlyParams;
export type ListEnvelopesParams = z.infer<typeof ListEnvelopesParams>;

/**
 * @description Query parameters schema for listing envelopes
 */
export const ListEnvelopesQuery = z.object({
  limit: z.coerce.number().min(PAGINATION_LIMITS.MIN_LIMIT).max(PAGINATION_LIMITS.MAX_LIMIT).default(PAGINATION_LIMITS.DEFAULT_LIMIT),
  cursor: z.string().optional(),
});

export type ListEnvelopesQuery = z.infer<typeof ListEnvelopesQuery>;

/**
 * @description Response schema for envelope list
 */
export const ListEnvelopesResponse = z.object({
  items: z.array(FullEnvelopeFields.extend({
    partiesCount: z.number(),
    documentsCount: z.number(),
  })),
  nextCursor: z.string().optional(),
});

export type ListEnvelopesResponse = z.infer<typeof ListEnvelopesResponse>;






