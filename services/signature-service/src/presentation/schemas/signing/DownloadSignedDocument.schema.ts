/**
 * @file DownloadSignedDocument.schema.ts
 * @summary Request/response schemas for downloading signed documents.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for downloading a signed document. */
export const DownloadSignedDocumentBody = z.object({
  envelopeId: UuidV4,
});
export type DownloadSignedDocumentBody = z.infer<typeof DownloadSignedDocumentBody>;

/** Response schema for the download URL. */
export const DownloadSignedDocumentResponse = z.object({
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  filename: z.string(),
  contentType: z.string(),
  fileSize: z.number().positive().optional(),
});
export type DownloadSignedDocumentResponse = z.infer<typeof DownloadSignedDocumentResponse>;






