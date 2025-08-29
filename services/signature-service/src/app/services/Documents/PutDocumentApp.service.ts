/**
 * @file PutDocumentApp.service.ts
 * @summary Application service for updating document binary
 * @description Orchestrates document binary update operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";
import type { S3ObjectRef } from "@/domain/value-objects/S3ObjectRef";
import type { HashDigestString } from "@/domain/value-objects/HashDigest";
import type { FileSize } from "@/domain/value-objects/FileSize";
import type { ContentType } from "@/domain/value-objects/ContentType";
import { documentNotFound, badRequest } from "@/errors";

/**
 * Actor context for audit and attribution purposes
 */
export interface ActorContext {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  locale?: string;
}

/**
 * Input parameters for updating document binary
 */
export interface PutDocumentAppInput {
  documentId: DocumentId;
  contentType: ContentType;
  size: FileSize;
  digest: HashDigestString;
  s3Ref: S3ObjectRef;
  pageCount?: number;
  actor?: ActorContext;
}

/**
 * Output result for document binary update
 */
export interface PutDocumentAppResult {
  documentId: string;
  updatedAt: string;
}

/**
 * Dependencies required by the PutDocument app service
 */
export interface PutDocumentAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Updates document binary with proper validation
 * @param input - The input parameters containing document binary update data
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to updated document data
 * @throws {AppError} When validation fails or document update fails
 */
export const putDocumentApp = async (
  input: PutDocumentAppInput,
  deps: PutDocumentAppDependencies
): Promise<PutDocumentAppResult> => {
  // Validate that the document exists
  const document = await deps.documentsCommands.getById(input.documentId);
  if (!document) {
    throw documentNotFound({ documentId: input.documentId });
  }

  // Validate content type
  if (!input.contentType.startsWith('application/pdf') && !input.contentType.startsWith('image/')) {
    throw badRequest(`Unsupported content type: ${input.contentType}`, "INPUT_TYPE_NOT_ALLOWED");
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (input.size > maxSize) {
    throw badRequest(`File size ${input.size} exceeds maximum allowed size of ${maxSize} bytes`, "INPUT_TYPE_NOT_ALLOWED");
  }

  // Validate digest format (should be SHA-256)
  if (!input.digest.match(/^[A-Fa-f0-9]{64}$/)) {
    throw badRequest(`Invalid SHA-256 digest format: ${input.digest}`, "INPUT_TYPE_NOT_ALLOWED");
  }

  // Update the document with new binary information
  const updated = await deps.documentsCommands.updateBinary({
    documentId: input.documentId,
    contentType: input.contentType,
    size: input.size,
    digest: input.digest,
    s3Ref: input.s3Ref,
    pageCount: input.pageCount,
  });

  return { 
    documentId: (updated.documentId as unknown as string),
    updatedAt: updated.updatedAt
  };
};
