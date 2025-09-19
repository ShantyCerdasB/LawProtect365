/**
 * @fileoverview SignatureValidationRules - Validation rules for signature operations
 * @summary Contains validation logic for signature creation, validation, and KMS operations
 * @description This file contains validation rules specific to signature operations,
 * including request validation, field validation, and business rule validation.
 */

import { KmsCreateSignatureRequest } from '../../types/signature/KmsCreateSignatureRequest';
import { ValidateSignatureRequest } from '../../types/signature/ValidateSignatureRequest';
import { BadRequestError, ErrorCodes, validateSignatureHash, validateSignatureTimestamp, validateS3Key, NonEmptyStringSchema } from '@lawprotect/shared-ts';

/**
 * Validates KMS create signature request
 * 
 * This function validates all required fields and business rules
 * for creating a digital signature via KMS.
 * 
 * @param request - The KMS create signature request to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateKmsCreateSignatureRequest(request: KmsCreateSignatureRequest): void {
  // Validate required IDs
  validateRequiredId('Signature ID', request.signatureId);
  validateRequiredId('Signer ID', request.signerId);
  validateRequiredId('Envelope ID', request.envelopeId);

  // Validate document hash using shared utilities
  try {
    NonEmptyStringSchema.parse(request.documentHash);
    validateSignatureHash(request.documentHash, request.algorithm);
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Document hash validation failed:', error);
      throw new BadRequestError(`Invalid document hash: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    console.warn('Document hash validation failed with unknown error:', error);
    throw error;
  }

  // Validate algorithm using shared utilities
  try {
    NonEmptyStringSchema.parse(request.algorithm);
  } catch (error) {
    console.warn('Algorithm validation failed:', error);
    throw new BadRequestError('Signing algorithm is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate KMS key ID using shared utilities
  try {
    NonEmptyStringSchema.parse(request.kmsKeyId);
  } catch (error) {
    console.warn('KMS key ID validation failed:', error);
    throw new BadRequestError('KMS key ID is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate S3 keys using shared utilities
  try {
    validateS3Key(request.inputKey);
    validateS3Key(request.outputKey);
  } catch (error) {
    if (error instanceof Error) {
      console.warn('S3 key validation failed:', error);
      throw new BadRequestError(`Invalid S3 key: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    console.warn('S3 key validation failed with unknown error:', error);
    throw error;
  }

  // Validate S3 key strategy (overwrite)
  if (request.inputKey !== request.outputKey) {
    throw new BadRequestError(
      'Output key must equal input key for PDF overwrite strategy',
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }
}

/**
 * Validates signature validation request
 * 
 * This function validates all required fields for signature validation.
 * 
 * @param request - The signature validation request to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateSignatureValidationRequest(request: ValidateSignatureRequest): void {
  // Validate required IDs
  validateRequiredId('Signature ID', request.signatureId);

  // Validate document hash using shared utilities
  try {
    NonEmptyStringSchema.parse(request.documentHash);
    validateSignatureHash(request.documentHash, request.algorithm);
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Document hash validation failed:', error);
      throw new BadRequestError(`Invalid document hash: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    console.warn('Document hash validation failed with unknown error:', error);
    throw error;
  }

  // Validate signature data using shared utilities
  try {
    NonEmptyStringSchema.parse(request.signature);
  } catch (error) {
    console.warn('Signature validation failed:', error);
    throw new BadRequestError('Signature is required', ErrorCodes.COMMON_BAD_REQUEST);
  }

  // Validate algorithm using shared utilities
  try {
    NonEmptyStringSchema.parse(request.algorithm);
  } catch (error) {
    console.warn('Algorithm validation failed:', error);
    throw new BadRequestError('Signing algorithm is required', ErrorCodes.COMMON_BAD_REQUEST);
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

/**
 * Validates signature timestamp
 * 
 * @param timestamp - Timestamp to validate
 * @param maxAgeHours - Maximum age in hours (default: 24)
 * @throws {BadRequestError} When timestamp is invalid
 */
export function validateSignatureTimestampRule(timestamp: Date, maxAgeHours: number = 24): void {
  try {
    validateSignatureTimestamp(timestamp, maxAgeHours);
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Signature timestamp validation failed:', error);
      throw new BadRequestError(`Invalid signature timestamp: ${error.message}`, ErrorCodes.COMMON_BAD_REQUEST);
    }
    console.warn('Signature timestamp validation failed with unknown error:', error);
    throw error;
  }
}