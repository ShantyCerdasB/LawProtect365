/**
 * @fileoverview S3ValidationRules - Validation rules for S3 operations
 * @summary Provides validation functions for S3 document operations
 * @description This module contains validation rules for S3 operations including
 * document storage, retrieval, and presigned URL generation using domain rules.
 */

import { 
  S3Key, 
  ContentType, 
  S3Operation,
  s3RequestValidationFailed,
  s3EnvelopeIdRequired,
  s3SignerIdRequired,
  s3DocumentContentRequired,
  s3ContentTypeInvalid,
  s3FileSizeExceeded,
  s3MetadataSizeMismatch,
  s3DocumentKeyRequired,
  s3KeyInvalidFormat,
  s3OperationInvalid,
  s3ExpirationTimeInvalid
} from '@lawprotect/shared-ts';
import { StoreDocumentRequest } from '../../types/s3/StoreDocumentRequest';
import { RetrieveDocumentRequest } from '../../types/s3/RetrieveDocumentRequest';
import { GeneratePresignedUrlRequest } from '../../types/s3/GeneratePresignedUrlRequest';
import { validateS3StorageForDocument, validateS3StorageGeneral } from './S3StorageRules';

/**
 * Validates a store document request for S3 storage operations
 * @param request - The store document request to validate
 * @throws BadRequestError when validation fails
 */
export function validateStoreDocumentRequest(request: StoreDocumentRequest): void {
  if (!request) {
    throw s3RequestValidationFailed('Store document request is required');
  }

  if (!request.envelopeId) {
    throw s3EnvelopeIdRequired();
  }

  if (!request.signerId) {
    throw s3SignerIdRequired();
  }

  if (!request.documentContent || request.documentContent.length === 0) {
    throw s3DocumentContentRequired();
  }

  if (!request.contentType) {
    throw s3RequestValidationFailed('Content type is required');
  }

  try {
    ContentType.fromString(request.contentType.getValue());
  } catch (error) {
    throw s3ContentTypeInvalid(
      request.contentType.getValue(), 
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  const maxFileSize = 50 * 1024 * 1024;
  if (request.documentContent.length > maxFileSize) {
    throw s3FileSizeExceeded(request.documentContent.length, maxFileSize);
  }

  if (request.metadata) {
    if (request.metadata.fileSize && request.metadata.fileSize !== request.documentContent.length) {
      throw s3MetadataSizeMismatch(request.metadata.fileSize, request.documentContent.length);
    }
  }
}

/**
 * Validates a retrieve document request for S3 document retrieval operations
 * @param request - The retrieve document request to validate
 * @throws BadRequestError when validation fails
 */
export function validateRetrieveDocumentRequest(request: RetrieveDocumentRequest): void {
  if (!request) {
    throw s3RequestValidationFailed('Retrieve document request is required');
  }

  if (!request.documentKey) {
    throw s3DocumentKeyRequired();
  }

  if (!request.envelopeId) {
    throw s3EnvelopeIdRequired();
  }

  if (!request.signerId) {
    throw s3SignerIdRequired();
  }

  try {
    S3Key.fromString(request.documentKey.getValue());
  } catch (error) {
    throw s3KeyInvalidFormat(
      request.documentKey.getValue(),
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  validateS3StorageForDocument(request.documentKey, {
    allowedS3Buckets: [],
    documentKeyPrefix: 'envelopes/',
    allowedExtensions: ['pdf']
  });
}

/**
 * Validates a generate presigned URL request for S3 presigned URL generation
 * @param request - The generate presigned URL request to validate
 * @param config - Service configuration for validation
 * @param config.maxExpirationTime - Maximum allowed expiration time in seconds
 * @param config.minExpirationTime - Minimum allowed expiration time in seconds
 * @throws BadRequestError when validation fails
 */
export function validateGeneratePresignedUrlRequest(
  request: GeneratePresignedUrlRequest, 
  config: { maxExpirationTime?: number; minExpirationTime?: number }
): void {
  if (!request) {
    throw s3RequestValidationFailed('Generate presigned URL request is required');
  }

  if (!request.documentKey) {
    throw s3DocumentKeyRequired();
  }

  if (!request.operation) {
    throw s3RequestValidationFailed('S3 operation is required');
  }

  if (!request.envelopeId) {
    throw s3EnvelopeIdRequired();
  }

  if (!request.signerId) {
    throw s3SignerIdRequired();
  }

  try {
    S3Key.fromString(request.documentKey.getValue());
  } catch (error) {
    throw s3KeyInvalidFormat(
      request.documentKey.getValue(),
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  try {
    S3Operation.fromString(request.operation.getValue());
  } catch (error) {
    throw s3OperationInvalid(
      request.operation.getValue(),
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  if (request.expiresIn !== undefined) {
    const minExpiration = config.minExpirationTime || 300;
    const maxExpiration = config.maxExpirationTime || 3600;

    if (request.expiresIn < minExpiration || request.expiresIn > maxExpiration) {
      throw s3ExpirationTimeInvalid(request.expiresIn, minExpiration, maxExpiration);
    }
  }

  validateS3StorageGeneral(request.documentKey, {
    allowedS3Buckets: [],
    maxKeyLength: 1024,
    minKeyLength: 1
  });
}