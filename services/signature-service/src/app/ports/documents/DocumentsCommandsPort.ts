/**
 * @file DocumentsCommandsPort.ts
 * @description Port for document command operations defining write operations on documents.
 * Provides methods to create, update, and delete documents with proper business rule validation.
 */

import type { TenantId, EnvelopeId, DocumentId } from "../shared";
import type { S3ObjectRef } from "../../../domain/value-objects/S3ObjectRef";
import type { HashDigestString } from "../../../domain/value-objects/HashDigest";
import type { FileSize } from "../../../domain/value-objects/FileSize";
import type { ContentType } from "../../../domain/value-objects/ContentType";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";

/**
 * @description Context information about the actor performing an operation.
 * Used for audit trails and authorization purposes.
 */
export interface ActorContext {
  /** User ID of the actor (optional) */
  userId?: string;
  /** Email address of the actor (optional) */
  email?: string;
  /** IP address of the actor (optional) */
  ip?: string;
  /** User agent string of the actor (optional) */
  userAgent?: string;
  /** Locale preference of the actor (optional) */
  locale?: string;
}

/**
 * @description Command for creating a new document within an envelope.
 */
export interface CreateDocumentCommand {
  /** The tenant ID that owns the document */
  tenantId: TenantId;
  /** The envelope ID the document belongs to */
  envelopeId: EnvelopeId;
  /** The name of the document */
  name: string;
  /** The MIME type of the document */
  contentType: ContentType;
  /** The size of the document in bytes */
  size: FileSize;
  /** The SHA-256 hash digest of the document */
  digest: HashDigestString;
  /** The S3 storage reference */
  s3Ref: S3ObjectRef;
  /** Optional number of pages in the document */
  pageCount?: number;
  /** Context information about the actor creating the document (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of creating a new document.
 */
export interface CreateDocumentResult {
  /** The unique identifier of the created document */
  documentId: DocumentId;
  /** ISO timestamp when the document was created */
  createdAt: string;
}

/**
 * @description Command for updating document metadata.
 */
export interface UpdateDocumentCommand {
  /** The document ID to update */
  documentId: DocumentId;
  /** Optional new name for the document */
  name?: string;
  /** Optional metadata to update */
  metadata?: Record<string, unknown>;
}

/**
 * @description Command for updating document binary and metadata.
 */
export interface UpdateDocumentBinaryCommand {
  /** The document ID to update */
  documentId: DocumentId;
  /** The MIME type of the document */
  contentType: ContentType;
  /** The size of the document in bytes */
  size: FileSize;
  /** The SHA-256 hash digest of the document */
  digest: HashDigestString;
  /** The S3 storage reference */
  s3Ref: S3ObjectRef;
  /** Optional number of pages in the document */
  pageCount?: number;
}

/**
 * @description Result of updating a document.
 */
export interface UpdateDocumentResult {
  /** The document ID that was updated */
  documentId: DocumentId;
  /** ISO timestamp when the document was updated */
  updatedAt: string;
}

/**
 * @description Port interface for document command operations.
 * 
 * This port defines the contract for write operations on documents.
 * Implementations should handle data persistence and business rule validation.
 */
export interface DocumentsCommandsPort {
  /**
   * @description Creates a new document within an envelope.
   *
   * @param {CreateDocumentCommand} command - The document creation command with required data
   * @returns {Promise<CreateDocumentResult>} Promise resolving to creation result with document ID and timestamp
   */
  create(command: CreateDocumentCommand): Promise<CreateDocumentResult>;

  /**
   * @description Updates an existing document with partial data.
   *
   * @param {UpdateDocumentCommand} command - The document update command
   * @returns {Promise<UpdateDocumentResult>} Promise resolving to update result with document ID and timestamp
   */
  update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult>;

  /**
   * @description Updates an existing document's binary and metadata.
   *
   * @param {UpdateDocumentBinaryCommand} command - The document binary update command
   * @returns {Promise<UpdateDocumentResult>} Promise resolving to update result with document ID and timestamp
   */
  updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult>;

  /**
   * @description Deletes a document.
   *
   * @param {DocumentId} documentId - The unique identifier of the document to delete
   * @returns {Promise<void>} Promise resolving when deletion is complete
   */
  delete(documentId: DocumentId): Promise<void>;

  /**
   * @description Gets a document by ID.
   *
   * @param {DocumentId} documentId - The unique identifier of the document
   * @returns {Promise<any>} Promise resolving to the document or null if not found
   */
  getById(documentId: DocumentId): Promise<any>;

  /**
   * @description Creates a document lock.
   *
   * @param {DocumentLock} lock - The document lock to create
   * @returns {Promise<void>} Promise resolving when lock creation is complete
   */
  createLock(lock: DocumentLock): Promise<void>;

  /**
   * @description Lists all locks for a document.
   *
   * @param {DocumentId} documentId - The unique identifier of the document
   * @returns {Promise<DocumentLock[]>} Promise resolving to array of document locks
   */
  listLocks(documentId: DocumentId): Promise<DocumentLock[]>;
}
