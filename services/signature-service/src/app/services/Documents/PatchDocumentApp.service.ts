/**
 * @file PatchDocumentApp.service.ts
 * @summary Application service for updating documents
 * @description Orchestrates document update operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";

/**
 * Input parameters for updating a document
 */
export interface PatchDocumentAppInput {
  documentId: DocumentId;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Output result for document update
 */
export interface PatchDocumentAppResult {
  documentId: string;
  updatedAt: string;
}

/**
 * Dependencies required by the PatchDocument app service
 */
export interface PatchDocumentAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Updates a document with proper validation
 * @param input - The input parameters containing document update data
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to updated document data
 * @throws {AppError} When validation fails or document update fails
 */
export const patchDocumentApp = async (
  input: PatchDocumentAppInput,
  deps: PatchDocumentAppDependencies
): Promise<PatchDocumentAppResult> => {
  const updated = await deps.documentsCommands.update({
    documentId: input.documentId,
    name: input.name,
    metadata: input.metadata,
  });

  return { 
    documentId: (updated.documentId as unknown as string),
    updatedAt: updated.updatedAt
  };
};
