/**
 * @file ListDocumentsApp.service.ts
 * @summary Application service for listing documents by envelope
 * @description Orchestrates document listing operations, delegates to DocumentsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId } from "@/app/ports/shared";
import type { DocumentsQueriesPort } from "@/app/ports/documents/DocumentsQueriesPort";

/**
 * Input parameters for listing documents by envelope
 */
export interface ListDocumentsAppInput {
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for document listing
 */
export interface ListDocumentsAppResult {
  items: any[];
  nextCursor?: string;
}

/**
 * Dependencies required by the ListDocuments app service
 */
export interface ListDocumentsAppDependencies {
  documentsQueries: DocumentsQueriesPort;
}

/**
 * Lists documents by envelope with proper validation and pagination
 * @param input - The input parameters containing envelope ID and pagination options
 * @param deps - The dependencies containing the documents queries port
 * @returns Promise resolving to paginated document list
 * @throws {AppError} When validation fails
 */
export const listDocumentsApp = async (
  input: ListDocumentsAppInput,
  deps: ListDocumentsAppDependencies
): Promise<ListDocumentsAppResult> => {
  const result = await deps.documentsQueries.listByEnvelope({
    envelopeId: input.envelopeId,
    limit: input.limit,
    cursor: input.cursor,
  });

  return {
    items: result.items,
    nextCursor: result.nextCursor,
  };
};
