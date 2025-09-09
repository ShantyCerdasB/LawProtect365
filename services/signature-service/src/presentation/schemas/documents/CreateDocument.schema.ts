/**
 * @file CreateDocument.schema.ts
 * @description Request and response schemas for creating documents.
 * Defines Zod schemas for document creation payload validation and response formatting.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES } from "@/domain/values/enums";

/**
 * @description Body payload schema for creating a document.
 * Validates the required fields for document creation including name, content type, size, and S3 reference.
 */
export const CreateDocumentBody = z.object({
  /** Document name (1-255 characters) */
  name: z.string().min(1).max(255),
  /** MIME type of the document */
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  /** Size of the document in bytes */
  size: z.number().int().positive(),
  /** SHA-256 hash digest of the document content */
  digest: z.string().min(1),
  /** S3 bucket name */
  bucket: z.string().min(1),
  /** S3 object key */
  key: z.string().min(1),
  /** Optional number of pages in the document */
  pageCount: z.number().int().positive().optional(),
});
export type CreateDocumentBody = z.infer<typeof CreateDocumentBody>;

/**
 * @description Response payload schema for a newly created document.
 * Defines the structure of the response returned after successful document creation.
 */
export const CreateDocumentResponse = z.object({
  /** Created document identifier (UUID v4) */
  id: UuidV4,
  /** Creation timestamp (ISO datetime string) */
  createdAt: z.string().datetime(),
});
export type CreateDocumentResponse = z.infer<typeof CreateDocumentResponse>;






