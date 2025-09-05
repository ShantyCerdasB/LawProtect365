// file: src/schemas/signing/PresignUpload.schema.ts
/**
 * @file PresignUpload.schema.ts
 * @summary Request/response schemas for pre-signed upload URLs.
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeId } from "../common/path";

/** Body payload requesting a pre-signed upload URL. */
export const PresignUploadBody = z.object({
  envelopeId: EnvelopeId,
  filename: z.string().min(1),
  contentType: z.string().min(1),
});
export type PresignUploadBody = z.infer<typeof PresignUploadBody>;

/** Response payload containing pre-signed upload details. */
export const PresignUploadResponse = z.object({
  uploadUrl: z.string().url(),
  objectKey: z.string(),
  expiresAt: z.string().datetime(),
});
export type PresignUploadResponse = z.infer<typeof PresignUploadResponse>;
