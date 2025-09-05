/**
 * @file AttachEnvelopeDocument.schema.ts
 * @summary Request schema for attaching a document to an envelope.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for attaching a document. */
export const AttachEnvelopeDocumentBody = z.object({
  documentId: UuidV4,
  name: z.string().min(1).max(255),
  contentType: z.string().min(1),
});
export type AttachEnvelopeDocumentBody = z.infer<typeof AttachEnvelopeDocumentBody>;
