/**
 * @file DocumentsQueriesPort.ts
 * @summary Port for document query operations
 * @description Defines the interface for read-only operations on documents.
 * This port provides methods to retrieve document data without modifying it.
 * Used by application services to query document information.
 */

import type { EnvelopeId, DocumentId } from "../../../domain/value-objects/Ids";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";
import type { Document } from "../../../domain/entities/Document";

/**
 * Query parameters for listing documents by envelope
 */
export interface ListDocumentsQuery {
  /** The envelope ID to filter documents by */
  envelopeId: EnvelopeId;
  /** Maximum number of documents to return (optional) */
  limit?: number;
  /** Pagination cursor for getting the next page of results (optional) */
  cursor?: string;
}

/**
 * Result of listing documents with pagination support
 */
export interface ListDocumentsResult {
  /** Array of document data */
  items: Document[];
  /** Cursor for the next page of results (optional) */
  nextCursor?: string;
}

/**
 * Port interface for document query operations
 * 
 * This port defines the contract for read-only operations on documents.
 * Implementations should provide efficient data retrieval without side effects.
 */
export interface DocumentsQueriesPort {
  /**
   * Retrieves a single document by its ID
   * @param documentId - The unique identifier of the document
   * @returns Promise resolving to document data or null if not found
   */
  getById(documentId: DocumentId): Promise<Document | null>;

  /**
   * Lists documents for a specific envelope with pagination support
   * @param query - Query parameters including envelope ID and pagination options
   * @returns Promise resolving to paginated list of documents
   */
  listByEnvelope(query: ListDocumentsQuery): Promise<ListDocumentsResult>;

  /**
   * Lists all locks for a document
   * @param documentId - The unique identifier of the document
   * @returns Promise resolving to array of document locks
   */
  listLocks(documentId: DocumentId): Promise<DocumentLock[]>;
}
