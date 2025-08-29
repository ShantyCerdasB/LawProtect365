/**
 * @file PatchDocument.schema.ts
 * @description Request and response schemas for updating documents.
 * Defines Zod schemas for document update payload validation and response formatting.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload schema for updating a document.
 * Validates the optional fields for document updates including name and metadata.
 */
export const PatchDocumentBody = z.object({
  /** Optional new name for the document (1-255 characters) */
  name: z.string().min(1).max(255).optional(),
  /** Optional metadata to update */
  metadata: z.record(z.unknown()).optional(),
});
export type PatchDocumentBody = z.infer<typeof PatchDocumentBody>;

/**
 * @description Response payload schema for an updated document.
 * Defines the structure of the response returned after successful document update.
 */
export const PatchDocumentResponse = z.object({
  /** Updated document identifier */
  id: z.string().min(1),
  /** Update timestamp (ISO datetime string) */
  updatedAt: z.string().datetime(),
});
export type PatchDocumentResponse = z.infer<typeof PatchDocumentResponse>;
