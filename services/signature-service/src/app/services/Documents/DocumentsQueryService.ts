/**
 * @file DocumentsQueryService.ts
 * @summary Query service for Documents operations
 * @description Wrapper service for Documents query operations
 */

import type { 
  DocumentsQueriesPort,
  ListDocumentsQuery,
  ListDocumentsResult
} from "../../ports/documents/DocumentsQueriesPort";
import type { DocumentId } from "@/domain/value-objects/ids";
import type { Document } from "../../../domain/entities/Document";
import type { DocumentLock } from "@lawprotect/shared-ts";

/**
 * @description Service interface for Documents query operations
 */
export interface DocumentsQueryService {
  /**
   * Gets a document by ID
   * @param documentId - The document ID
   * @returns Promise resolving to document or null
   */
  getById(documentId: DocumentId): Promise<Document | null>;

  /**
   * Lists documents by envelope
   * @param query - The envelope documents query
   * @returns Promise resolving to documents list
   */
  listByEnvelope(query: ListDocumentsQuery): Promise<ListDocumentsResult>;

  /**
   * Lists all locks for a document
   * @param documentId - The document ID
   * @returns Promise resolving to array of document locks
   */
  listLocks(documentId: DocumentId): Promise<DocumentLock[]>;
}

/**
 * @description Default implementation of DocumentsQueryService
 */
export class DefaultDocumentsQueryService implements DocumentsQueryService {
  constructor(private readonly queriesPort: DocumentsQueriesPort) {}

  async getById(documentId: DocumentId): Promise<Document | null> {
    return this.queriesPort.getById(documentId);
  }

  async listByEnvelope(query: ListDocumentsQuery): Promise<ListDocumentsResult> {
    return this.queriesPort.listByEnvelope(query);
  }

  async listLocks(documentId: DocumentId): Promise<DocumentLock[]> {
    return this.queriesPort.listLocks(documentId);
  }
}






