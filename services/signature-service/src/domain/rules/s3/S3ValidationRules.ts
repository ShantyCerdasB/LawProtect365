/**
 * @fileoverview S3ValidationRules - Validation rules for S3 operations
 * @summary Contains validation logic for S3 document operations
 * @description This file contains validation rules specific to S3 operations,
 * including document storage, retrieval, and presigned URL generation.
 */

import { StoreDocumentRequest } from '../../types/s3/StoreDocumentRequest';
import { RetrieveDocumentRequest } from '../../types/s3/RetrieveDocumentRequest';
import { GeneratePresignedUrlRequest } from '../../types/s3/GeneratePresignedUrlRequest';
import { BadRequestError, ErrorCodes, validateS3Key, validateContentType } from '@lawprotect/shared-ts';
import type { SignatureServiceConfig } from '../../../config/AppConfig';

/**
 * Validates store document request
 * 
 * This function validates all required fields for storing a document in S3.
 * 
 * @param request - The store document request to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateStoreDocumentRequest(request: StoreDocumentRequest): void {
  // Validate required IDs
  validateRequiredId('Envelope ID', request.envelopeId);
  validateRequiredId('Signer ID', request.signerId);

  // Validate document content
  if (!request.documentContent) {
    throw new BadRequestError('Document content is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate content type
  if (!request.contentType || request.contentType.trim().length === 0) {
    throw new BadRequestError('Content type is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate content type format using shared utilities
  try {
    validateContentType(request.contentType);
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestError(`Invalid content type: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    throw error;
  }
}

/**
 * Validates retrieve document request
 * 
 * This function validates all required fields for retrieving a document from S3.
 * 
 * @param request - The retrieve document request to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateRetrieveDocumentRequest(request: RetrieveDocumentRequest): void {
  // Validate required IDs
  validateRequiredId('Envelope ID', request.envelopeId);
  validateRequiredId('Signer ID', request.signerId);

  // Validate document key
  if (!request.documentKey || request.documentKey.trim().length === 0) {
    throw new BadRequestError('Document key is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate document key format using shared utilities
  try {
    validateS3Key(request.documentKey);
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestError(`Invalid document key: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    throw error;
  }
}

/**
 * Validates generate presigned URL request
 * 
 * This function validates all required fields for generating a presigned URL.
 * 
 * @param request - The generate presigned URL request to validate
 * @param config - The service configuration containing S3 limits
 * @throws {BadRequestError} When validation fails
 */
export function validateGeneratePresignedUrlRequest(
  request: GeneratePresignedUrlRequest, 
  config: SignatureServiceConfig
): void {
  // Validate required IDs
  validateRequiredId('Envelope ID', request.envelopeId);
  validateRequiredId('Signer ID', request.signerId);

  // Validate document key
  if (!request.documentKey || request.documentKey.trim().length === 0) {
    throw new BadRequestError('Document key is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate document key format using shared utilities
  try {
    validateS3Key(request.documentKey);
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestError(`Invalid document key: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    throw error;
  }

  // Validate operation type
  if (!request.operation || !['get', 'put'].includes(request.operation)) {
    throw new BadRequestError(
      'Operation must be either "get" or "put"',
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  // Validate expiration time using configuration
  if (request.expiresIn !== undefined) {
    const { minPresignTtlSeconds, maxPresignTtlSeconds } = config.s3;
    if (request.expiresIn < minPresignTtlSeconds || request.expiresIn > maxPresignTtlSeconds) {
      throw new BadRequestError(
        `Expires in must be between ${minPresignTtlSeconds} and ${maxPresignTtlSeconds} seconds`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }
}

/**
 * Validates required ID field
 * 
 * @param fieldName - Name of the field for error messages
 * @param value - Value to validate
 * @throws {BadRequestError} When value is invalid
 */
function validateRequiredId(fieldName: string, value: any): void {
  if (!value) {
    throw new BadRequestError(`${fieldName} is required`, ErrorCodes.COMMON_BAD_REQUEST);
  }
}

