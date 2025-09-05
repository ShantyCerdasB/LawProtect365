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
import type { DocumentId, EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";
import { badRequest, documentNotFound } from "../../../shared/errors";
import { ErrorCodes } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES, FILE_SIZE_LIMITS } from "../../../domain/values/enums";

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
}

/**
 * @description Default implementation of DocumentsValidationService
 */
export class DefaultDocumentsValidationService implements DocumentsValidationService {
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

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(command.contentType)) {
      throw badRequest(
        `Content type '${command.contentType}' is not allowed`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "contentType", value: command.contentType, allowedTypes: ALLOWED_CONTENT_TYPES }
      );
    }

    // Validate file size
    if (command.size <= 0) {
      throw badRequest(
        "Document size must be greater than 0",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "size", value: command.size }
      );
    }

    if (command.size > FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE) {
      throw badRequest(
        `Document size exceeds maximum allowed size of ${FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE} bytes`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "size", value: command.size, maxSize: FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE }
      );
    }

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
    if (!command.actor || !command.actor.userId) {
      throw badRequest(
        "Actor context with userId is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "actor", value: command.actor }
      );
    }
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
    if (!command.actor || !command.actor.userId) {
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

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(command.contentType)) {
      throw badRequest(
        `Content type '${command.contentType}' is not allowed`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "contentType", value: command.contentType, allowedTypes: ALLOWED_CONTENT_TYPES }
      );
    }

    // Validate file size
    if (command.size <= 0) {
      throw badRequest(
        "Document size must be greater than 0",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "size", value: command.size }
      );
    }

    if (command.size > FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE) {
      throw badRequest(
        `Document size exceeds maximum allowed size of ${FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE} bytes`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "size", value: command.size, maxSize: FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE }
      );
    }

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
    if (!command.actor || !command.actor.userId) {
      throw badRequest(
        "Actor context with userId is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { field: "actor", value: command.actor }
      );
    }
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
}
