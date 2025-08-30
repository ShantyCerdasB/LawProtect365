/**
 * @file PresignEvidence.schema.ts
 * @summary Zod schema for presign evidence validation
 * @description Defines validation rules for POST /uploads/evidence/presign endpoint
 */

import { z } from "zod";

/**
 * @description Request body for presigning evidence upload
 */
export const PresignEvidenceBodySchema = z.object({
  /** Content type of the file */
  contentType: z.string().min(1),
  /** Estimated file size in bytes */
  sizeBytes: z.number().int().positive(),
  /** Optional number of parts for multipart upload */
  parts: z.number().int().positive().optional(),
  /** Optional SHA256 hash for integrity */
  sha256: z.string().optional(),
});

/**
 * @description Type for request body
 */
export type PresignEvidenceBody = z.infer<typeof PresignEvidenceBodySchema>;

