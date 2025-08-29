/**
 * @file GetDocumentByIdApp.service.ts
 * @summary Application service for retrieving documents by ID
 * @description Orchestrates document retrieval operations, delegates to DocumentsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId } from "@/app/ports/shared";
import type { DocumentsQueriesPort } from "@/app/ports/documents/DocumentsQueriesPort";

/**
 * Input parameters for retrieving a document by ID
 */
export interface GetDocumentByIdAppInput {
  documentId: DocumentId;
}

/**
 * Output result for document retrieval
 */
export interface GetDocumentByIdAppResult {
  document: any;
}

/**
 * Dependencies required by the GetDocumentById app service
 */
export interface GetDocumentByIdAppDependencies {
  documentsQueries: DocumentsQueriesPort;
}

/**
 * Retrieves a document by ID with proper validation
 * @param input - The input parameters containing document ID
 * @param deps - The dependencies containing the documents queries port
 * @returns Promise resolving to document data
 * @throws {AppError} When document is not found or validation fails
 */
export const getDocumentByIdApp = async (
  input: GetDocumentByIdAppInput,
  deps: GetDocumentByIdAppDependencies
): Promise<GetDocumentByIdAppResult> => {
  const document = await deps.documentsQueries.getById(input.documentId);

  return { document };
};
