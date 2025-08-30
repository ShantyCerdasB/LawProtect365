/**
 * @file CompleteEvidence.schema.ts
 * @summary Zod schema for complete evidence validation
 * @description Defines validation rules for POST /uploads/evidence/complete endpoint
 */

import { z } from "zod";

/**
 * @description Multipart part schema
 */
export const MultipartPartSchema = z.object({
  /** Part number */
  partNumber: z.number().int().positive(),
  /** ETag returned by S3 */
  etag: z.string().min(1),
});

/**
 * @description Request body for completing evidence upload
 */
export const CompleteEvidenceBodySchema = z.object({
  /** Upload session identifier */
  uploadId: z.string().min(1),
  /** S3 bucket name */
  bucket: z.string().min(1),
  /** S3 object key */
  key: z.string().min(1),
  /** Array of completed parts */
  parts: z.array(MultipartPartSchema).min(1),
  /** Optional object reference */
  objectRef: z.string().optional(),
});

/**
 * @description Type for request body
 */
export type CompleteEvidenceBody = z.infer<typeof CompleteEvidenceBodySchema>;

/**
 * @description Type for multipart part
 */
export type MultipartPart = z.infer<typeof MultipartPartSchema>;
