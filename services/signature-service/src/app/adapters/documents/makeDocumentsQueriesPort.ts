/**
 * @file makeDocumentsQueriesPort.ts
 * @summary Adapter: DocumentsRepository → DocumentsQueriesPort
 * @description Creates and configures the DocumentsQueriesPort implementation,
 * adapting between the app service layer and the documents repository.
 */

import type { DocumentsQueriesPort, ListDocumentsQuery, ListDocumentsResult } from "../../ports/documents/DocumentsQueriesPort";
import type { DocumentId } from "../../../domain/value-objects/Ids";
import type { DocumentLock } from "@/domain/value-objects/DocumentLock";
import type { Document } from "@/domain/entities/Document";
import type { DocumentsRepository } from "@/shared/contracts/repositories/documents/DocumentsRepository";

/**
 * Creates a DocumentsQueriesPort implementation
 * @param documentsRepo - The documents repository for data access
 * @returns Configured DocumentsQueriesPort implementation
 */
export const makeDocumentsQueriesPort = (documentsRepo: DocumentsRepository): DocumentsQueriesPort => ({
  /**
   * Retrieves a single document by its ID
   * @param documentId - The unique identifier of the document
   * @returns Promise resolving to document data or null if not found
   */
  async getById(documentId: DocumentId): Promise<Document | null> {
    return await documentsRepo.getById(documentId);
  },

  /**
   * Lists documents for a specific envelope with pagination support
   * @param query - Query parameters including envelope ID and pagination options
   * @returns Promise resolving to paginated list of documents
   */
  async listByEnvelope(query: ListDocumentsQuery): Promise<ListDocumentsResult> {
    const result = await documentsRepo.listByEnvelope({
      envelopeId: query.envelopeId,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      items: result.items,
      nextCursor: result.nextCursor,
    };
  },

  /**
   * Lists all locks for a document
   * @param documentId - The unique identifier of the document
   * @returns Promise resolving to array of document locks
   */
  async listLocks(documentId: DocumentId): Promise<DocumentLock[]> {
    const document = await documentsRepo.getById(documentId);
    if (!document) {
      return [];
    }

    const locks = document.metadata?.locks;
    return Array.isArray(locks) ? locks : [];
  },
});