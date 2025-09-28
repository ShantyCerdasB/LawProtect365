/**
 * @fileoverview S3ValidationRules - Validation rules for S3 operations
 * @summary Provides validation functions for S3 document operations
 * @description This module contains validation rules for S3 operations including
 * document storage, retrieval, and presigned URL generation using domain rules.
 */

import { BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';
import { StoreDocumentRequest } from '../../types/s3/StoreDocumentRequest';
import { RetrieveDocumentRequest } from '../../types/s3/RetrieveDocumentRequest';
import { GeneratePresignedUrlRequest } from '../../types/s3/GeneratePresignedUrlRequest';
import { validateS3StorageForDocument, validateS3StorageGeneral } from './S3StorageRules';
import { S3Key, ContentType, S3Operation } from '@lawprotect/shared-ts';

/**
 * Validates a store document request
 * @param request - The store document request to validate
 * @throws BadRequestError when validation fails
 */
export function validateStoreDocumentRequest(request: StoreDocumentRequest): void {
  if (!request) {
    throw new BadRequestError('Store document request is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.envelopeId) {
    throw new BadRequestError('Envelope ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.signerId) {
    throw new BadRequestError('Signer ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.documentContent || request.documentContent.length === 0) {
    throw new BadRequestError('Document content is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.contentType) {
    throw new BadRequestError('Content type is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate content type
  try {
    ContentType.fromString(request.contentType.getValue());
  } catch (error) {
    throw new BadRequestError(
      `Invalid content type: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  // Validate file size limits
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  if (request.documentContent.length > maxFileSize) {
    throw new BadRequestError('Document size exceeds maximum allowed size of 50MB', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate metadata if provided
  if (request.metadata) {
    if (request.metadata.fileSize && request.metadata.fileSize !== request.documentContent.length) {
      throw new BadRequestError('File size in metadata does not match actual content size', ErrorCodes.COMMON_BAD_REQUEST);
    }
  }
}

/**
 * Validates a retrieve document request
 * @param request - The retrieve document request to validate
 * @throws BadRequestError when validation fails
 */
export function validateRetrieveDocumentRequest(request: RetrieveDocumentRequest): void {
  if (!request) {
    throw new BadRequestError('Retrieve document request is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.documentKey) {
    throw new BadRequestError('Document key is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.envelopeId) {
    throw new BadRequestError('Envelope ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.signerId) {
    throw new BadRequestError('Signer ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate S3 key format
  try {
    S3Key.fromString(request.documentKey.getValue());
  } catch (error) {
    throw new BadRequestError(
      `Invalid document key format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  // Validate S3 key using storage rules
  validateS3StorageForDocument(request.documentKey, {
    allowedS3Buckets: [], // Will be validated by service configuration
    documentKeyPrefix: 'envelopes/',
    allowedExtensions: ['pdf']
  });
}

/**
 * Validates a generate presigned URL request
 * @param request - The generate presigned URL request to validate
 * @param config - Service configuration for validation
 * @throws BadRequestError when validation fails
 */
export function validateGeneratePresignedUrlRequest(
  request: GeneratePresignedUrlRequest, 
  config: { maxExpirationTime?: number; minExpirationTime?: number }
): void {
  if (!request) {
    throw new BadRequestError('Generate presigned URL request is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.documentKey) {
    throw new BadRequestError('Document key is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.operation) {
    throw new BadRequestError('S3 operation is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.envelopeId) {
    throw new BadRequestError('Envelope ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  if (!request.signerId) {
    throw new BadRequestError('Signer ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate S3 key format
  try {
    S3Key.fromString(request.documentKey.getValue());
  } catch (error) {
    throw new BadRequestError(
      `Invalid document key format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  // Validate S3 operation
  try {
    S3Operation.fromString(request.operation.getValue());
  } catch (error) {
    throw new BadRequestError(
      `Invalid S3 operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  // Validate expiration time
  if (request.expiresIn !== undefined) {
    const minExpiration = config.minExpirationTime || 300; // 5 minutes
    const maxExpiration = config.maxExpirationTime || 3600; // 1 hour

    if (request.expiresIn < minExpiration) {
      throw new BadRequestError(`Expiration time must be at least ${minExpiration} seconds`, ErrorCodes.COMMON_BAD_REQUEST);
    }

    if (request.expiresIn > maxExpiration) {
      throw new BadRequestError(`Expiration time cannot exceed ${maxExpiration} seconds`, ErrorCodes.COMMON_BAD_REQUEST);
    }
  }

  // Validate S3 key using storage rules
  validateS3StorageGeneral(request.documentKey, {
    allowedS3Buckets: [], // Will be validated by service configuration
    maxKeyLength: 1024,
    minKeyLength: 1
  });
}
