/**
 * @fileoverview S3StorageRules - Domain rules for S3 storage validation
 * @summary Provides validation rules for S3 storage operations
 * @description This module contains domain rules for validating S3 storage operations
 * including document storage, key validation, and compliance requirements.
 */

import { 
  S3Key,
  s3BucketNotAllowed, 
  s3KeyPrefixViolation, 
  s3FileExtensionNotAllowed, 
  s3KeyLengthExceeded, 
  s3KeyLengthBelowMinimum, 
  s3KeyCharactersInvalid 
} from '@lawprotect/shared-ts';

/**
 * Validates S3 storage configuration for document storage operations
 * @param s3Key - The S3 key to validate
 * @param config - Configuration object containing validation rules
 * @param config.allowedS3Buckets - Array of allowed S3 bucket names
 * @param config.documentKeyPrefix - Optional prefix that the S3 key must start with
 * @param config.allowedExtensions - Optional array of allowed file extensions
 * @throws BadRequestError when validation fails
 */
export function validateS3StorageForDocument(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    documentKeyPrefix?: string;
    allowedExtensions?: string[];
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw s3BucketNotAllowed(bucket, { context: 'document storage' });
    }
  }

  if (config.documentKeyPrefix) {
    if (!s3Key.getValue().startsWith(config.documentKeyPrefix)) {
      throw s3KeyPrefixViolation(config.documentKeyPrefix, { context: 'document storage' });
    }
  }

  if (config.allowedExtensions && config.allowedExtensions.length > 0) {
    const extension = s3Key.getExtension().toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      throw s3FileExtensionNotAllowed(extension, config.allowedExtensions, { context: 'document storage' });
    }
  }
}

/**
 * Extracts bucket name from S3 key
 * @param s3Key - The S3 key string to extract bucket from
 * @returns The bucket name or empty string if not found
 */
function extractBucketFromKey(s3Key: string): string {
  const parts = s3Key.split('/');
  return parts[0] || '';
}

/**
 * Validates general S3 storage configuration with comprehensive rules
 * @param s3Key - The S3 key to validate
 * @param config - Configuration object containing validation rules
 * @param config.allowedS3Buckets - Array of allowed S3 bucket names
 * @param config.maxKeyLength - Optional maximum key length
 * @param config.minKeyLength - Optional minimum key length
 * @param config.allowedCharacters - Optional regex pattern for allowed characters
 * @throws BadRequestError when validation fails
 */
export function validateS3StorageGeneral(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    maxKeyLength?: number;
    minKeyLength?: number;
    allowedCharacters?: RegExp;
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw s3BucketNotAllowed(bucket, { context: 'general storage' });
    }
  }

  const keyLength = s3Key.getValue().length;
  if (config.maxKeyLength && keyLength > config.maxKeyLength) {
    throw s3KeyLengthExceeded(keyLength, config.maxKeyLength, { context: 'general storage' });
  }

  if (config.minKeyLength && keyLength < config.minKeyLength) {
    throw s3KeyLengthBelowMinimum(keyLength, config.minKeyLength, { context: 'general storage' });
  }

  if (config.allowedCharacters && !config.allowedCharacters.test(s3Key.getValue())) {
    throw s3KeyCharactersInvalid({ context: 'general storage' });
  }
}