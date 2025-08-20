/**
 * @file ListEnvelopes.schema.ts
 * @summary Query and response schemas for listing envelopes.
 */

import { z } from "@lawprotect/shared-ts";
import { ListEnvelopesQuery } from "../common/query";

/** Response item for envelope listing. */
export const EnvelopeListItem = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  createdAt: z.string().datetime(),
});
export type EnvelopeListItem = z.infer<typeof EnvelopeListItem>;

/** Response payload containing a list of envelopes. */
export const ListEnvelopesResponse = z.object({
  items: z.array(EnvelopeListItem),
  nextCursor: z.string().nullable(),
});
export type ListEnvelopesResponse = z.infer<typeof ListEnvelopesResponse>;

/** Query params for listing envelopes. */
export { ListEnvelopesQuery };
