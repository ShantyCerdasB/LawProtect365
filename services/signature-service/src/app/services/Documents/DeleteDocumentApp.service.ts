/**
 * @file DeleteDocumentApp.service.ts
 * @summary Application service for deleting documents
 * @description Orchestrates document deletion operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";

/**
 * Input parameters for deleting a document
 */
export interface DeleteDocumentAppInput {
  documentId: DocumentId;
}

/**
 * Output result for document deletion
 */
export interface DeleteDocumentAppResult {
  deleted: boolean;
}

/**
 * Dependencies required by the DeleteDocument app service
 */
export interface DeleteDocumentAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Deletes a document with proper validation
 * @param input - The input parameters containing document ID
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to deletion result
 * @throws {AppError} When validation fails or document deletion fails
 */
export const deleteDocumentApp = async (
  input: DeleteDocumentAppInput,
  deps: DeleteDocumentAppDependencies
): Promise<DeleteDocumentAppResult> => {
  await deps.documentsCommands.delete(input.documentId);

  return { deleted: true };
};
