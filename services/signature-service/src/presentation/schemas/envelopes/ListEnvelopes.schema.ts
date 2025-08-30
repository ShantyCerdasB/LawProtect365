/**
 * @file ListEnvelopes.schema.ts
 * @description Query and response schemas for listing envelopes with pagination support.
 * Defines Zod schemas for envelope listing operations including query parameters and response formatting.
 */

/**
 * @file ListEnvelopes.schema.ts
 * @summary Query and response schemas for listing envelopes.
 */

import { z } from "@lawprotect/shared-ts";
import { ListEnvelopesQuery } from "../common/query";

/**
 * @description Response item schema for envelope listing.
 * Defines the structure of individual envelope items in list responses.
 */
export const EnvelopeListItem = z.object({
  /** Envelope identifier */
  id: z.string(),
  /** Envelope name/title */
  name: z.string(),
  /** Envelope status */
  status: z.string(),
  /** Creation timestamp (ISO datetime string) */
  createdAt: z.string().datetime(),
});
export type EnvelopeListItem = z.infer<typeof EnvelopeListItem>;

/**
 * @description Response payload schema containing a list of envelopes.
 * Includes pagination cursor for subsequent requests.
 */
export const ListEnvelopesResponse = z.object({
  /** Array of envelope items */
  items: z.array(EnvelopeListItem),
  /** Pagination cursor for next page (null if no more results) */
  nextCursor: z.string().nullable(),
});
export type ListEnvelopesResponse = z.infer<typeof ListEnvelopesResponse>;

/** @description Query parameters schema for listing envelopes */
export { ListEnvelopesQuery };
