/**
 * @file UploadDocument.schema.ts
 * @summary Zod schema for document upload requests
 * @description Defines validation schema for document upload operations
 */

import { z } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES } from "@/domain/values/enums";

/**
 * @description Request body schema for document upload
 */
export const UploadDocumentBody = z.object({
  /** Document name */
  name: z.string().min(1).max(255),
  
  /** Document content type */
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  
  /** Document size in bytes */
  size: z.number().int().positive(),
  
  /** SHA-256 hash digest of the document */
  digest: z.string().length(64),
  
  /** Optional number of pages in the document */
  pageCount: z.number().int().positive().optional(),
});

export type UploadDocumentBody = z.infer<typeof UploadDocumentBody>;
