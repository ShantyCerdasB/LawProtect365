/**
 * @file UploadSignedPdf.schema.ts
 * @summary Zod schema for upload signed PDF validation
 * @description Defines validation rules for POST /uploads/signed-pdf endpoint
 */

import { z } from "zod";

/**
 * @description Request body for uploading signed PDF
 */
export const UploadSignedPdfBodySchema = z.object({
  /** Content length in bytes */
  contentLength: z.number().int().positive(),
  /** Optional SHA256 hash */
  sha256: z.string().optional(),
});

/**
 * @description Type for request body
 */
export type UploadSignedPdfBody = z.infer<typeof UploadSignedPdfBodySchema>;

