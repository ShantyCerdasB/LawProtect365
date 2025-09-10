/**
 * @file DocumentsCommandsPort.ts
 * @description Port for document command operations defining write operations on documents.
 * Provides methods to create, update, delete, and upload documents with proper business rule validation.
 */

import type { EnvelopeId, DocumentId } from "../../../domain/value-objects/ids";
import type { ActorContext, DocumentLock } from "@lawprotect/shared-ts";
import type { S3ObjectRef } from "../../../domain/value-objects/storage";
import type { ContentType } from "../../../domain/value-objects/document";

/**
 * @description Command for creating a new document within an envelope.
 */
export interface CreateDocumentCommand {
  /** The envelope ID the document belongs to */
  envelopeId: EnvelopeId;
  /** The name of the document */
  name: string;
  /** The MIME type of the document */
  contentType: ContentType;
  /** The size of the document in bytes */
  size: number;
  /** The SHA-256 hash digest of the document */
  digest: string;
  /** The S3 storage reference */
  s3Ref: S3ObjectRef;
  /** Optional number of pages in the document */
  pageCount?: number;
  /** Context information about the actor creating the document */
  actor: ActorContext;
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
 * @description Command for uploading a new document (original document upload).
 */
export interface UploadDocumentCommand {
  /** The envelope ID the document belongs to */
  envelopeId: EnvelopeId;
  /** The name of the document */
  name: string;
  /** The MIME type of the document */
  contentType: ContentType;
  /** The size of the document in bytes */
  size: number;
  /** The SHA-256 hash digest of the document */
  digest: string;
  /** Optional number of pages in the document */
  pageCount?: number;
  /** Context information about the actor uploading the document */
  actor: ActorContext;
}

/**
 * @description Result of uploading a new document.
 */
export interface UploadDocumentResult {
  /** The unique identifier of the uploaded document */
  documentId: DocumentId;
  /** ISO timestamp when the document was uploaded */
  uploadedAt: string;
  /** Presigned URL for uploading the document to S3 */
  uploadUrl: string;
  /** S3 object key where the document will be stored */
  objectKey: string;
  /** Expiration time for the upload URL */
  expiresAt: string;
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
  /** Context information about the actor updating the document */
  actor: ActorContext;
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
  size: number;
  /** The SHA-256 hash digest of the document */
  digest: string;
  /** The S3 storage reference */
  s3Ref: S3ObjectRef;
  /** Optional number of pages in the document */
  pageCount?: number;
  /** Context information about the actor updating the document */
  actor: ActorContext;
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
   * @summary Creates a new document within an envelope
   * @description Creates a new document within an envelope with proper validation
   * @param command - The document creation command with required data
   * @returns Promise resolving to creation result with document ID and timestamp
   */
  create(command: CreateDocumentCommand): Promise<CreateDocumentResult>;

  /**
   * @summary Uploads a new document with presigned URL
   * @description Uploads a new document (original document upload with presigned URL)
   * @param command - The document upload command
   * @returns Promise resolving to upload result with presigned URL
   */
  upload(command: UploadDocumentCommand): Promise<UploadDocumentResult>;

  /**
   * @summary Updates an existing document with partial data
   * @description Updates an existing document with partial data
   * @param command - The document update command
   * @returns Promise resolving to update result with document ID and timestamp
   */
  update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult>;

  /**
   * @summary Updates an existing document's binary and metadata
   * @description Updates an existing document's binary and metadata
   * @param command - The document binary update command
   * @returns Promise resolving to update result with document ID and timestamp
   */
  updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult>;

  /**
   * @summary Deletes a document
   * @description Deletes a document from the repository
   * @param documentId - The unique identifier of the document to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(documentId: DocumentId): Promise<void>;

  /**
   * @summary Creates a document lock
   * @description Creates a document lock to prevent concurrent modifications
   * @param lock - The document lock to create
   * @returns Promise resolving when lock creation is complete
   */
  createLock(lock: DocumentLock): Promise<void>;

  /**
   * @summary Deletes a document lock
   * @description Deletes a document lock to allow modifications
   * @param documentId - The document ID
   * @param lockId - The lock ID to delete
   * @param actorUserId - The user ID of the actor performing the action
   * @returns Promise resolving when lock deletion is complete
   */
  deleteLock(documentId: DocumentId, lockId: string, actorUserId: string): Promise<void>;
};
