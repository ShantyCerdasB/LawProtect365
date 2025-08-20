/**
 * @file ListEnvelopeDocuments.schema.ts
 * @summary Response schema for listing documents within an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/** Item in an envelope document listing. */
export const EnvelopeDocumentItem = z.object({
  id: z.string(),
  name: z.string(),
  contentType: z.string(),
  createdAt: z.string().datetime(),
});
export type EnvelopeDocumentItem = z.infer<typeof EnvelopeDocumentItem>;

/** Response containing a list of envelope documents. */
export const ListEnvelopeDocumentsResponse = z.object({
  items: z.array(EnvelopeDocumentItem),
});
export type ListEnvelopeDocumentsResponse = z.infer<typeof ListEnvelopeDocumentsResponse>;
