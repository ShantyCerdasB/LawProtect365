/**
 * @file CreateDocumentApp.service.ts
 * @summary Application service for creating documents
 * @description Orchestrates document creation operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";
import type { S3ObjectRef } from "@/domain/value-objects/S3ObjectRef";
import type { HashDigestString } from "@/domain/value-objects/HashDigest";
import type { FileSize } from "@/domain/value-objects/FileSize";
import type { ContentType } from "@/domain/value-objects/ContentType";
import type { ActorContext } from "@/app/ports/shared";
/**
 * Input parameters for creating a document
 */
export interface CreateDocumentAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  name: string;
  contentType: ContentType;
  size: FileSize;
  digest: HashDigestString;
  s3Ref: S3ObjectRef;
  pageCount?: number;
  actor?: ActorContext;
}

/**
 * Output result for document creation
 */
export interface CreateDocumentAppResult {
  documentId: string;
  createdAt: string;
}

/**
 * Dependencies required by the CreateDocument app service
 */
export interface CreateDocumentAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Creates a new document with proper validation and event emission
 * @param input - The input parameters containing document creation data
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to created document data
 * @throws {AppError} When validation fails or document creation fails
 */
export const createDocumentApp = async (
  input: CreateDocumentAppInput,
  deps: CreateDocumentAppDependencies
): Promise<CreateDocumentAppResult> => {
  const created = await deps.documentsCommands.create({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    name: input.name,
    contentType: input.contentType,
    size: input.size,
    digest: input.digest,
    s3Ref: input.s3Ref,
    pageCount: input.pageCount,
    actor: input.actor,
  });

  return { 
    documentId: (created.documentId as unknown as string),
    createdAt: created.createdAt
  };
};
