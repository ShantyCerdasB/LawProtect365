/**
 * @file DocumentsValidationService.ts
 * @summary Validation service for Documents operations
 * @description Handles validation of Documents command inputs and business rules
 */

import type { 
  CreateDocumentCommand,
  UploadDocumentCommand,
  UpdateDocumentCommand,
  UpdateDocumentBinaryCommand
} from "../../ports/documents/DocumentsCommandsPort";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";
import type { DocumentId, EnvelopeId } from "../../../domain/value-objects/Ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/EnvelopeStatus";
import type { DocumentStatus } from "../../../domain/value-objects/DocumentStatus";
import { badRequest } from "../../../shared/errors";
import { ErrorCodes } from "@lawprotect/shared-ts";
import { FILE_SIZE_LIMITS } from "../../../domain/values/enums";
import { 
  assertSupportedContentType, 
  assertDocumentSizeLimit,
  assertDocumentMutable,
  assertDocumentBelongsToEnvelope,
  assertEnvelopeDraftForDocumentModification,
  assertDocumentLockDeletable
} from "../../../domain/rules/Documents.rules";

/**
 * @description Service interface for Documents validation operations
 */
export interface DocumentsValidationService {
  /**
   * Validates a create document command
   * @param command - The create document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateCreateDocument(command: CreateDocumentCommand): void;

  /**
   * Validates an upload document command
   * @param command - The upload document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUploadDocument(command: UploadDocumentCommand): void;

  /**
   * Validates an update document command
   * @param command - The update document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUpdateDocument(command: UpdateDocumentCommand): void;

  /**
   * Validates an update document binary command
   * @param command - The update document binary command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUpdateDocumentBinary(command: UpdateDocumentBinaryCommand): void;

  /**
   * Validates a document lock
   * @param lock - The document lock to validate
   * @throws {BadRequestError} When validation fails
   */
  validateDocumentLock(lock: DocumentLock): void;

  /**
   * Validates document status transition
   * @param from - Current document status
   * @param to - Target document status
   * @throws {ConflictError} When transition is not allowed
   */
  validateDocumentStatusTransition(from: DocumentStatus, to: DocumentStatus): void;

  /**
   * Validates document is mutable
   * @param document - Document to validate
   * @throws {ConflictError} When document is not mutable
   */
  validateDocumentMutable(document: { status: DocumentStatus; documentId: DocumentId }): void;

  /**
   * Validates document belongs to envelope
   * @param document - Document to validate
   * @param envelopeId - Expected envelope ID
   * @throws {BadRequestError} When document doesn't belong to envelope
   */
  validateDocumentBelongsToEnvelope(document: { envelopeId: EnvelopeId; documentId: DocumentId }, envelopeId: EnvelopeId): void;

  /**
   * Validates envelope is in draft for document modification
   * @param envelope - Envelope to validate
   * @throws {ConflictError} When envelope is not in draft
   */
  validateEnvelopeDraftForDocumentModification(envelope: { status: EnvelopeStatus; envelopeId: EnvelopeId }): void;

  /**
   * Validates document lock can be deleted by user
   * @param lock - Document lock to validate
   * @param ownerId - User ID attempting to delete
   * @throws {BadRequestError} When lock cannot be deleted
   */
  validateDocumentLockDeletable(lock: { lockId: string; ownerId: string; expiresAt: string }, ownerId: string): void;
}

/**
 * @description Default implementation of DocumentsValidationService
 */
export class DefaultDocumentsValidationService implements DocumentsValidationService {
  /**
   * @summary Validates common document binary fields
   * @description Helper method to validate content type, size, digest, page count, and actor context
   */
  private validateDocumentBinaryFields(command: { 
    contentType: string; 
    size: number; 
    digest?: string; 
    pageCount?: number; 
    actor?: { userId?: any } 
  }): void {
    // Validate content type using domain rules
    assertSupportedContentType(command.contentType);
    
    // Validate file size using domain rules
    assertDocumentSizeLimit(command.size, FILE_SIZE_LIMITS.PDF);
    
    // Validate digest
    if (!command.digest || command.digest.length !== 64) {
      throw badRequest(
        "Document digest must be a valid SHA-256 hash (64 characters)",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "digest", value: command.digest, expectedLength: 64 }
      );
    }
    
    // Validate page count if provided
    if (command.pageCount !== undefined && command.pageCount <= 0) {
      throw badRequest(
        "Page count must be greater than 0",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "pageCount", value: command.pageCount }
      );
    }
    
    // Validate actor context
    if (!command.actor?.userId) {
      throw badRequest(
        "Actor context with userId is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "actor", value: command.actor }
      );
    }
  }
  /**
   * Validates a create document command
   * @param command - The create document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateCreateDocument(command: CreateDocumentCommand): void {
    // Validate required fields
    if (!command.name || command.name.trim().length === 0) {
      throw badRequest(
        "Document name is required and cannot be empty",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "name", value: command.name }
      );
    }

    if (command.name.length > 255) {
      throw badRequest(
        "Document name cannot exceed 255 characters",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "name", length: command.name.length, maxLength: 255 }
      );
    }

    // Validate binary fields using helper
    this.validateDocumentBinaryFields(command);
  }

  /**
   * Validates an upload document command
   * @param command - The upload document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUploadDocument(command: UploadDocumentCommand): void {
    // Reuse create document validation
    this.validateCreateDocument(command as CreateDocumentCommand);
  }

  /**
   * Validates an update document command
   * @param command - The update document command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUpdateDocument(command: UpdateDocumentCommand): void {
    // Validate document ID
    if (!command.documentId) {
      throw badRequest(
        "Document ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "documentId", value: command.documentId }
      );
    }

    // Validate name if provided
    if (command.name !== undefined) {
      if (command.name.trim().length === 0) {
        throw badRequest(
          "Document name cannot be empty",
          ErrorCodes.COMMON_BAD_REQUEST,
          { field: "name", value: command.name }
        );
      }

      if (command.name.length > 255) {
        throw badRequest(
          "Document name cannot exceed 255 characters",
          ErrorCodes.COMMON_BAD_REQUEST,
          { field: "name", length: command.name.length, maxLength: 255 }
        );
      }
    }

    // Validate actor context
    if (!command.actor?.userId) {
      throw badRequest(
        "Actor context with userId is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "actor", value: command.actor }
      );
    }
  }

  /**
   * Validates an update document binary command
   * @param command - The update document binary command to validate
   * @throws {BadRequestError} When validation fails
   */
  validateUpdateDocumentBinary(command: UpdateDocumentBinaryCommand): void {
    // Validate document ID
    if (!command.documentId) {
      throw badRequest(
        "Document ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "documentId", value: command.documentId }
      );
    }

    // Validate binary fields using helper
    this.validateDocumentBinaryFields(command);
  }

  /**
   * Validates a document lock
   * @param lock - The document lock to validate
   * @throws {BadRequestError} When validation fails
   */
  validateDocumentLock(lock: DocumentLock): void {
    if (!lock.documentId || lock.documentId.trim().length === 0) {
      throw badRequest(
        "Document ID is required for document lock",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "documentId", value: lock.documentId }
      );
    }

    if (!lock.ownerId || lock.ownerId.trim().length === 0) {
      throw badRequest(
        "Owner ID is required for document lock",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "ownerId", value: lock.ownerId }
      );
    }

    if (!lock.expiresAt) {
      throw badRequest(
        "Expiration time is required for document lock",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "expiresAt", value: lock.expiresAt }
      );
    }

    // Validate expiration time is in the future
    const expiresAt = new Date(lock.expiresAt);
    const now = new Date();
    if (expiresAt <= now) {
      throw badRequest(
        "Document lock expiration time must be in the future",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "expiresAt", value: lock.expiresAt, currentTime: now.toISOString() }
      );
    }
  }

  /**
   * Validates document status transition
   * @param from - Current document status
   * @param to - Target document status
   * @throws {ConflictError} When transition is not allowed
   */
  validateDocumentStatusTransition(from: DocumentStatus, to: DocumentStatus): void {
    // Import the rule function dynamically to avoid circular dependencies
    const { assertDocumentStatusTransition } = require("../../../domain/rules/Documents.rules");
    assertDocumentStatusTransition(from, to);
  }

  /**
   * Validates document is mutable
   * @param document - Document to validate
   * @throws {ConflictError} When document is not mutable
   */
  validateDocumentMutable(document: { status: DocumentStatus; documentId: DocumentId }): void {
    assertDocumentMutable(document);
  }

  /**
   * Validates document belongs to envelope
   * @param document - Document to validate
   * @param envelopeId - Expected envelope ID
   * @throws {BadRequestError} When document doesn't belong to envelope
   */
  validateDocumentBelongsToEnvelope(document: { envelopeId: EnvelopeId; documentId: DocumentId }, envelopeId: EnvelopeId): void {
    assertDocumentBelongsToEnvelope(document, envelopeId);
  }

  /**
   * Validates envelope is in draft for document modification
   * @param envelope - Envelope to validate
   * @throws {ConflictError} When envelope is not in draft
   */
  validateEnvelopeDraftForDocumentModification(envelope: { status: EnvelopeStatus; envelopeId: EnvelopeId }): void {
    assertEnvelopeDraftForDocumentModification(envelope);
  }

  /**
   * Validates document lock can be deleted by user
   * @param lock - Document lock to validate
   * @param ownerId - User ID attempting to delete
   * @throws {BadRequestError} When lock cannot be deleted
   */
  validateDocumentLockDeletable(lock: { lockId: string; ownerId: string; expiresAt: string }, ownerId: string): void {
    assertDocumentLockDeletable(lock, ownerId);
  }
}
