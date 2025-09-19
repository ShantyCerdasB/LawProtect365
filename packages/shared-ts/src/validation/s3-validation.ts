/**
 * @fileoverview S3 validation utilities
 * @summary Validation functions for S3-related operations
 * @description Provides validation functions for S3 keys, content types, and other S3-specific validations.
 */

/**
 * Validates S3 key format
 * @param s3Key - The S3 key to validate
 * @returns true if valid, false otherwise
 */
export function validateS3Key(s3Key: string): boolean {
  if (!s3Key || typeof s3Key !== 'string') {
    return false;
  }

  // S3 key should not be empty and should not start with /
  if (s3Key.trim().length === 0 || s3Key.startsWith('/')) {
    return false;
  }

  // S3 key should not contain consecutive slashes
  if (s3Key.includes('//')) {
    return false;
  }

  // S3 key should not be longer than 1024 characters
  if (s3Key.length > 1024) {
    return false;
  }

  return true;
}

/**
 * Validates content type format
 * @param contentType - The content type to validate
 * @returns true if valid, false otherwise
 */
export function validateContentType(contentType: string): boolean {
  if (!contentType || typeof contentType !== 'string') {
    return false;
  }

  // Basic content type format validation (type/subtype)
  const parts = contentType.split('/');
  if (parts.length !== 2) {
    return false;
  }
  
  const [type, subtype] = parts;
  const validChars = /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-_]*$/;
  
  if (!validChars.test(type) || !validChars.test(subtype.split(';')[0])) {
    return false;
  }
  
  // Check for parameters if present
  if (subtype.includes(';')) {
    const params = subtype.split(';').slice(1);
    for (const param of params) {
      const trimmed = param.trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-_]*\s*=\s*[a-zA-Z0-9][a-zA-Z0-9!#$&\-_]*$/.test(trimmed)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validates if content type is allowed for document uploads
 * @param contentType - The content type to validate
 * @param allowedTypes - Array of allowed content types
 * @returns true if allowed, false otherwise
 */
export function validateAllowedContentType(contentType: string, allowedTypes: string[]): boolean {
  if (!validateContentType(contentType)) {
    return false;
  }

  return allowedTypes.includes(contentType);
}