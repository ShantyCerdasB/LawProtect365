/**
 * @file DocumentsCommandService.ts
 * @summary Command service for Documents operations
 * @description Wrapper service for Documents command operations
 */

import type { 
  DocumentsCommandsPort,
  CreateDocumentCommand,
  CreateDocumentResult,
  UploadDocumentCommand,
  UploadDocumentResult,
  UpdateDocumentCommand,
  UpdateDocumentResult,
  UpdateDocumentBinaryCommand
} from "../../ports/documents/DocumentsCommandsPort";
import type { DocumentId } from "../../../domain/value-objects/ids";
import type { DocumentLock } from "@lawprotect/shared-ts";
import { 
  assertSupportedContentType, 
  assertDocumentSizeLimit
} from "../../../domain/rules/Documents.rules";
// Authorization validation is handled by middleware in controllers

/**
 * @description Service interface for Documents command operations
 */
export interface DocumentsCommandService {
  /**
   * Creates a new document within an envelope
   * @param command - The document creation command
   * @returns Promise resolving to creation result
   */
  create(command: CreateDocumentCommand): Promise<CreateDocumentResult>;

  /**
   * Uploads a new document (original document upload with presigned URL)
   * @param command - The document upload command
   * @returns Promise resolving to upload result with presigned URL
   */
  upload(command: UploadDocumentCommand): Promise<UploadDocumentResult>;

  /**
   * Updates an existing document with partial data
   * @param command - The document update command
   * @returns Promise resolving to update result
   */
  update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult>;

  /**
   * Updates an existing document's binary and metadata
   * @param command - The document binary update command
   * @returns Promise resolving to update result
   */
  updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult>;

  /**
   * Deletes a document
   * @param documentId - The document ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(documentId: DocumentId): Promise<void>;

  /**
   * Creates a document lock
   * @param lock - The document lock to create
   * @returns Promise resolving when lock creation is complete
   */
  createLock(lock: DocumentLock): Promise<void>;

  /**
   * Deletes a document lock
   * @param documentId - The document ID
   * @param lockId - The lock ID to delete
   * @returns Promise resolving when lock deletion is complete
   */
  deleteLock(documentId: DocumentId, lockId: string, actorUserId: string): Promise<void>;
}

/**
 * @description Default implementation of DocumentsCommandService
 */
export class DefaultDocumentsCommandService implements DocumentsCommandService {
  constructor(
    private readonly commandsPort: DocumentsCommandsPort
  ) {}

  async create(command: CreateDocumentCommand): Promise<CreateDocumentResult> {
    // Authorization validation is handled by middleware in the controller
    
    // Apply domain-specific rules
    assertSupportedContentType(command.contentType);
    assertDocumentSizeLimit(command.size);

    return this.commandsPort.create(command);
  }

  async upload(command: UploadDocumentCommand): Promise<UploadDocumentResult> {

    assertSupportedContentType(command.contentType);
    assertDocumentSizeLimit(command.size);

    return this.commandsPort.upload(command);
  }

  async update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult> {
    return this.commandsPort.update(command);
  }

  async updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult> {
    // Apply domain-specific rules
    assertSupportedContentType(command.contentType);
    assertDocumentSizeLimit(command.size);

    return this.commandsPort.updateBinary(command);
  }

  async delete(documentId: DocumentId): Promise<void> {
    return this.commandsPort.delete(documentId);
  }

  async createLock(lock: DocumentLock): Promise<void> {
    return this.commandsPort.createLock(lock);
  }

  async deleteLock(documentId: DocumentId, lockId: string, actorUserId: string): Promise<void> {
    return this.commandsPort.deleteLock(documentId, lockId, actorUserId);
  }
};
