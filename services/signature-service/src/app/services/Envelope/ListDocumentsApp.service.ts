/**
 * @file ListDocumentsApp.service.ts
 * @summary Application service for listing documents of an envelope
 * @description Orchestrates document listing operations, delegates to DocumentsQueriesPort,
 * and handles pagination logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { DocumentsQueriesPort } from "@/app/ports/documents/DocumentsQueriesPort";
import { badRequest } from "@/shared/errors";

/**
 * Input parameters for listing documents of an envelope
 */
export interface ListDocumentsAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for listing documents
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
 * Lists documents of an envelope with forward cursor pagination
 * @param input - The input parameters containing envelope ID and pagination options
 * @param deps - The dependencies containing the documents queries port
 * @returns Promise resolving to paginated documents list
 * @throws {AppError} When query fails or validation errors occur
 */
export const listDocumentsApp = async (
  input: ListDocumentsAppInput,
  deps: ListDocumentsAppDependencies
): Promise<ListDocumentsAppResult> => {
  // Validate input parameters
  if (!input.envelopeId) {
    throw badRequest("Envelope ID is required");
  }

  const page = await deps.documentsQueries.listByEnvelope({
    envelopeId: input.envelopeId,
    limit: input.limit,
    cursor: input.cursor,
  });

  return {
    items: page.items,
    nextCursor: page.nextCursor,
  };
};
