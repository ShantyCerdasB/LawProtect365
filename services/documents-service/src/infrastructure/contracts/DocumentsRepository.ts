/**
 * @file DocumentsRepository.ts
 * @summary Repository contract for Document entities
 * @description Defines the interface for Document repository operations using branded types
 * 
 * This module defines the contract for document persistence operations, providing
 * both unique identifier-based and composite key-based operations for single-table
 * design patterns. It supports CRUD operations, existence checks, and pagination.
 */

import type { Document } from "@/domain/entities/Document";
import type { DocumentId, EnvelopeId } from "@/domain/value-objects/index";

/**
 * Composite key for Document entities in single-table design
 */
export interface DocumentKey {
  /** Associated envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Document identifier */
  readonly documentId: DocumentId;
}

/**
 * Repository contract for Document entities
 * Provides CRUD operations and specific queries for Document management
 */
export interface DocumentsRepository {
  /**
   * Retrieves a Document by its unique identifier using GSI
   * @param documentId - The Document identifier
   * @returns Promise resolving to the Document or null if not found
   */
  getById(documentId: DocumentId): Promise<Document | null>;

  /**
   * Retrieves a Document by envelope and document identifiers (envelope-scoped)
   * @param documentKey - The Document composite key (envelopeId + documentId)
   * @returns Promise resolving to the Document or null if not found
   */
  getByKey(documentKey: DocumentKey): Promise<Document | null>;

  /**
   * Lists documents by envelope with pagination support
   * @param params - Query parameters including envelopeId, limit, and cursor
   * @returns Promise resolving to paginated list of documents
   */
  listByEnvelope(params: {
    envelopeId: EnvelopeId;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: Document[]; nextCursor?: string }>;

  /**
   * Creates a new Document
   * @param document - The Document entity to create
   * @returns Promise resolving to the created Document
   */
  create(document: Document): Promise<Document>;

  /**
   * Updates an existing Document by unique identifier
   * @param documentId - The Document identifier to update
   * @param patch - Partial fields to update
   * @returns Promise resolving to the updated Document
   */
  update(documentId: DocumentId, patch: Partial<Document>): Promise<Document>;

  /**
   * Updates an existing Document by composite key (envelope-scoped)
   * @param documentKey - The Document composite key to update
   * @param patch - Partial fields to update
   * @returns Promise resolving to the updated Document
   */
  updateByKey(documentKey: DocumentKey, patch: Partial<Document>): Promise<Document>;

  /**
   * Deletes a Document by unique identifier
   * @param documentId - The Document identifier to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(documentId: DocumentId): Promise<void>;

  /**
   * Deletes a Document by composite key (envelope-scoped)
   * @param documentKey - The Document composite key to delete
   * @returns Promise resolving when deletion is complete
   */
  deleteByKey(documentKey: DocumentKey): Promise<void>;

  /**
   * Checks if a Document exists by unique identifier
   * @param documentId - The Document identifier to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  exists(documentId: DocumentId): Promise<boolean>;

  /**
   * Checks if a Document exists by composite key
   * @param documentKey - The Document composite key to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  existsByKey(documentKey: DocumentKey): Promise<boolean>;
}
