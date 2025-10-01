/**
 * @fileoverview Error Factories - Factory functions for creating common errors
 * @summary Convenient factory functions for creating standardized errors
 * @description This module provides factory functions that create common error instances
 * with appropriate default messages and error codes, following the established patterns
 * for error handling across the platform.
 */

import { BadRequestError } from "./errors.js";
import { ErrorCodes } from "./codes.js";

/**
 * Creates a pagination limit required error
 * @param details - Optional additional details about the error
 * @returns BadRequestError with pagination limit required code
 */
export const paginationLimitRequired = (details?: unknown) =>
  new BadRequestError(
    "Pagination limit is required",
    ErrorCodes.PAGINATION_LIMIT_REQUIRED,
    details
  );

// ============================================================================
// S3 STORAGE ERROR FACTORIES
// ============================================================================

/**
 * Creates a BadRequestError for when S3 bucket is not allowed
 * @param bucket - The bucket name that was rejected
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 bucket not allowed code
 */
export const s3BucketNotAllowed = (bucket: string, details?: unknown) =>
  new BadRequestError(
    `S3 bucket ${bucket} is not allowed`,
    ErrorCodes.S3_BUCKET_NOT_ALLOWED,
    details
  );

/**
 * Creates a BadRequestError for invalid S3 key format
 * @param key - The invalid S3 key
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 key invalid format code
 */
export const s3KeyInvalidFormat = (key: string, details?: unknown) =>
  new BadRequestError(
    `Invalid S3 key format: ${key}`,
    ErrorCodes.S3_KEY_INVALID_FORMAT,
    details
  );

/**
 * Creates a BadRequestError for S3 key prefix violation
 * @param prefix - The required prefix
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 key prefix violation code
 */
export const s3KeyPrefixViolation = (prefix: string, details?: unknown) =>
  new BadRequestError(
    `S3 key must start with prefix: ${prefix}`,
    ErrorCodes.S3_KEY_PREFIX_VIOLATION,
    details
  );

/**
 * Creates a BadRequestError for file extension not allowed
 * @param extension - The rejected file extension
 * @param allowedExtensions - Array of allowed extensions
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 file extension not allowed code
 */
export const s3FileExtensionNotAllowed = (extension: string, allowedExtensions: string[], details?: unknown) =>
  new BadRequestError(
    `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    ErrorCodes.S3_FILE_EXTENSION_NOT_ALLOWED,
    details
  );

/**
 * Creates a BadRequestError for S3 key length violation
 * @param keyLength - The actual key length
 * @param maxLength - The maximum allowed length
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 key length violation code
 */
export const s3KeyLengthExceeded = (keyLength: number, maxLength: number, details?: unknown) =>
  new BadRequestError(
    `S3 key length ${keyLength} exceeds maximum allowed length of ${maxLength}`,
    ErrorCodes.S3_KEY_LENGTH_VIOLATION,
    details
  );

/**
 * Creates a BadRequestError for S3 key length below minimum
 * @param keyLength - The actual key length
 * @param minLength - The minimum required length
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 key length violation code
 */
export const s3KeyLengthBelowMinimum = (keyLength: number, minLength: number, details?: unknown) =>
  new BadRequestError(
    `S3 key length ${keyLength} is below minimum required length of ${minLength}`,
    ErrorCodes.S3_KEY_LENGTH_VIOLATION,
    details
  );

/**
 * Creates a BadRequestError for invalid characters in S3 key
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 key characters invalid code
 */
export const s3KeyCharactersInvalid = (details?: unknown) =>
  new BadRequestError(
    'S3 key contains invalid characters',
    ErrorCodes.S3_KEY_CHARACTERS_INVALID,
    details
  );

/**
 * Creates a BadRequestError for invalid S3 operation
 * @param operation - The invalid operation
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 operation invalid code
 */
export const s3OperationInvalid = (operation: string, details?: unknown) =>
  new BadRequestError(
    `Invalid S3 operation: ${operation}`,
    ErrorCodes.S3_OPERATION_INVALID,
    details
  );

/**
 * Creates a BadRequestError for invalid S3 expiration time
 * @param expiresIn - The invalid expiration time
 * @param minExpiration - The minimum allowed expiration time
 * @param maxExpiration - The maximum allowed expiration time
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 expiration time invalid code
 */
export const s3ExpirationTimeInvalid = (expiresIn: number, minExpiration: number, maxExpiration: number, details?: unknown) =>
  new BadRequestError(
    `Expiration time ${expiresIn} must be between ${minExpiration} and ${maxExpiration} seconds`,
    ErrorCodes.S3_EXPIRATION_TIME_INVALID,
    details
  );

/**
 * Creates a BadRequestError for S3 request validation failure
 * @param message - The validation error message
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 request validation failed code
 */
export const s3RequestValidationFailed = (message: string, details?: unknown) =>
  new BadRequestError(
    message,
    ErrorCodes.S3_REQUEST_VALIDATION_FAILED,
    details
  );

/**
 * Creates a BadRequestError for missing document content
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 document content required code
 */
export const s3DocumentContentRequired = (details?: unknown) =>
  new BadRequestError(
    'Document content is required',
    ErrorCodes.S3_DOCUMENT_CONTENT_REQUIRED,
    details
  );

/**
 * Creates a BadRequestError for invalid content type
 * @param contentType - The invalid content type
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 content type invalid code
 */
export const s3ContentTypeInvalid = (contentType: string, details?: unknown) =>
  new BadRequestError(
    `Invalid content type: ${contentType}`,
    ErrorCodes.S3_CONTENT_TYPE_INVALID,
    details
  );

/**
 * Creates a BadRequestError for file size exceeded
 * @param fileSize - The actual file size
 * @param maxSize - The maximum allowed size
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 file size exceeded code
 */
export const s3FileSizeExceeded = (fileSize: number, maxSize: number, details?: unknown) =>
  new BadRequestError(
    `File size ${fileSize} exceeds maximum allowed size of ${maxSize} bytes`,
    ErrorCodes.S3_FILE_SIZE_EXCEEDED,
    details
  );

/**
 * Creates a BadRequestError for missing document key
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 document key required code
 */
export const s3DocumentKeyRequired = (details?: unknown) =>
  new BadRequestError(
    'Document key is required',
    ErrorCodes.S3_DOCUMENT_KEY_REQUIRED,
    details
  );

/**
 * Creates a BadRequestError for missing envelope ID
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 envelope ID required code
 */
export const s3EnvelopeIdRequired = (details?: unknown) =>
  new BadRequestError(
    'Envelope ID is required',
    ErrorCodes.S3_ENVELOPE_ID_REQUIRED,
    details
  );

/**
 * Creates a BadRequestError for missing signer ID
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 signer ID required code
 */
export const s3SignerIdRequired = (details?: unknown) =>
  new BadRequestError(
    'Signer ID is required',
    ErrorCodes.S3_SIGNER_ID_REQUIRED,
    details
  );

/**
 * Creates a BadRequestError for metadata size mismatch
 * @param metadataSize - The size in metadata
 * @param actualSize - The actual content size
 * @param details - Optional additional details about the error
 * @returns BadRequestError with S3 metadata size mismatch code
 */
export const s3MetadataSizeMismatch = (metadataSize: number, actualSize: number, details?: unknown) =>
  new BadRequestError(
    `File size in metadata (${metadataSize}) does not match actual content size (${actualSize})`,
    ErrorCodes.S3_METADATA_SIZE_MISMATCH,
    details
  );