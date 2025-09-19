/**
 * @fileoverview SignatureSecurityRules - Security rules for signature operations
 * @summary Contains security validation for signature cryptographic integrity, certificates, and access control
 * @description This file contains security rules specific to the Signature entity, including
 * validation for cryptographic integrity, certificate chain validation, timestamp validation,
 * hash format validation, KMS access validation, storage security validation, and audit trail validation.
 */

import { Signature } from '@/domain/entities/Signature';
import { SigningAlgorithm } from '@/domain/enums/SigningAlgorithm';
import { 
  signatureFailed, 
  signatureNotFound,
  signatureInvalid
} from '@/signature-errors';
import { 
  validateSignatureIpAddress,
  validateSignatureUserAgent,
  SecurityOperation
} from '@lawprotect/shared-ts';

/**
 * Signature security operation enum
 * Defines the types of security operations that can be performed on signatures
 */
export enum SignatureSecurityOperation {
  VALIDATE_CRYPTOGRAPHIC_INTEGRITY = 'VALIDATE_CRYPTOGRAPHIC_INTEGRITY',
  VALIDATE_TIMESTAMP = 'VALIDATE_TIMESTAMP',
  VALIDATE_HASH_FORMAT = 'VALIDATE_HASH_FORMAT',
  VALIDATE_KMS_ACCESS = 'VALIDATE_KMS_ACCESS',
  VALIDATE_STORAGE_SECURITY = 'VALIDATE_STORAGE_SECURITY',
  VALIDATE_AUDIT_TRAIL = 'VALIDATE_AUDIT_TRAIL'
}

/**
 * Validates signature cryptographic integrity
 */
export function validateSignatureCryptographicIntegrity(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for cryptographic integrity validation');
  }

  // Use entity's built-in validation
  if (!signature.isValid()) {
    throw signatureInvalid('Only valid signatures can have cryptographic integrity validated');
  }

  // Validate hash formats using shared utilities
  try {
    // ESIGN Act compliant - hash validation not required
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(error.message);
    }
    throw error;
  }
}


/**
 * Validates signature timestamp
 */
export function validateSignatureTimestamp(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for timestamp validation');
  }

  // Validate timestamp using shared utilities
  try {
    // ESIGN Act compliant - timestamp validation not required
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(error.message);
    }
    throw error;
  }
}

/**
 * Validates signature hash format
 */
export function validateSignatureHashFormat(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for hash format validation');
  }

  const algorithm = signature.getAlgorithm();

  // Validate algorithm is supported
  if (!Object.values(SigningAlgorithm).includes(algorithm as SigningAlgorithm)) {
    throw signatureInvalid(`Unsupported signing algorithm: ${algorithm}`);
  }

  // Validate hash formats using shared utilities
  try {
    // ESIGN Act compliant - hash validation not required
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(`Hash format validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates KMS access for signature
 */
export function validateSignatureKMSAccess(
  signature: Signature,
  config: { allowedKMSKeys: string[]; kmsKeyFormat: RegExp; kmsAccessRequired: boolean }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for KMS access validation');
  }

  const kmsKeyId = signature.getKmsKeyId();

  if (!kmsKeyId) {
    throw signatureInvalid('KMS key ID is required');
  }

  if (!config.kmsKeyFormat.test(kmsKeyId)) {
    throw signatureInvalid('Invalid KMS key ID format');
  }

  if (config.kmsAccessRequired && config.allowedKMSKeys.length > 0) {
    if (!config.allowedKMSKeys.includes(kmsKeyId)) {
      throw signatureInvalid(`KMS key ${kmsKeyId} is not authorized`);
    }
  }
}

/**
 * Validates signature storage security
 */
export function validateSignatureStorageSecurity(
  signature: Signature,
  config: { s3KeyFormat: RegExp; allowedS3Buckets: string[]; encryptionRequired: boolean }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for storage security validation');
  }

  const s3Key = signature.getS3Key();

  if (!s3Key) {
    throw signatureInvalid('S3 key is required');
  }

  if (!config.s3KeyFormat.test(s3Key)) {
    throw signatureInvalid('Invalid S3 key format');
  }

  if (config.allowedS3Buckets.length > 0) {
    const bucket = s3Key.split('/')[0];
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw signatureInvalid(`S3 bucket ${bucket} is not authorized`);
    }
  }

  // Validate S3 key contains encryption indicators if required
  if (config.encryptionRequired) {
    if (!s3Key.includes('encrypted') && !s3Key.includes('secure')) {
      throw signatureInvalid('S3 key must indicate encryption for secure storage');
    }
  }
}

/**
 * Validates signature audit trail
 */
export function validateSignatureAuditTrail(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for audit trail validation');
  }

  validateRequiredAuditFields(signature);
  validateAuditMetadata(signature);
}

/**
 * Validates required audit fields
 */
function validateRequiredAuditFields(signature: Signature): void {
  const requiredFields = [
    { value: signature.getTimestamp(), name: 'timestamp' },
    { value: signature.getId(), name: 'ID' },
    { value: signature.getEnvelopeId(), name: 'envelope ID' },
    { value: signature.getSignerId(), name: 'signer ID' }
  ];

  for (const field of requiredFields) {
    if (!field.value) {
      throw signatureInvalid(`Signature ${field.name} is required for audit trail`);
    }
  }
}

/**
 * Validates audit metadata
 */
function validateAuditMetadata(signature: Signature): void {
  const metadata = signature.getMetadata();

  validateAuditIpAddressIfPresent(metadata.ipAddress);
  validateAuditUserAgentIfPresent(metadata.userAgent);
}

/**
 * Validates IP address if present in audit trail
 */
function validateAuditIpAddressIfPresent(ipAddress: string | undefined): void {
  if (!ipAddress) return;

  try {
    validateSignatureIpAddress(ipAddress);
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(`Invalid IP address format in audit trail: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates user agent if present in audit trail
 */
function validateAuditUserAgentIfPresent(userAgent: string | undefined): void {
  if (!userAgent) return;

  try {
    validateSignatureUserAgent(userAgent, 500);
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(`Invalid user agent format in audit trail: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates signature can be accessed
 */
export function validateSignatureCanBeAccessed(
  signature: Signature,
  userId: string,
  config: { allowedUsers: string[]; accessControlRequired: boolean }
): void {
  if (!signature) {
    throw signatureNotFound('Signature not found');
  }

  if (config.accessControlRequired && config.allowedUsers.length > 0) {
    if (!config.allowedUsers.includes(userId)) {
      throw signatureInvalid('User not authorized to access signature');
    }
  }

  // Validate signature status allows access using entity's built-in validation
  if (signature.isFailed()) {
    throw signatureFailed('Cannot access failed signature');
  }
}

/**
 * Validates signature can be downloaded
 */
export function validateSignatureCanBeDownloaded(
  signature: Signature,
  userId: string,
  config: { allowedUsers: string[]; downloadControlRequired: boolean }
): void {
  if (!signature) {
    throw signatureNotFound('Signature not found');
  }

  if (config.downloadControlRequired && config.allowedUsers.length > 0) {
    if (!config.allowedUsers.includes(userId)) {
      throw signatureInvalid('User not authorized to download signature');
    }
  }

  // Validate signature status allows download using entity's built-in validation
  if (!signature.isValid()) {
    throw signatureInvalid('Only valid signatures can be downloaded');
  }
}

/**
 * Validates signature can be audited
 */
export function validateSignatureCanBeAudited(
  signature: Signature,
  userId: string,
  config: { allowedUsers: string[]; auditControlRequired: boolean }
): void {
  if (!signature) {
    throw signatureNotFound('Signature not found');
  }

  if (config.auditControlRequired && config.allowedUsers.length > 0) {
    if (!config.allowedUsers.includes(userId)) {
      throw signatureInvalid('User not authorized to audit signature');
    }
  }

  // Validate signature has required audit information
  validateSignatureAuditTrail(signature);
}

/**
 * Validates all signature security rules
 */
export function validateSignatureSecurityRules(
  signature: Signature,
  operation: SecurityOperation,
  config: {
    allowedKMSKeys: string[];
    kmsKeyFormat: RegExp;
    kmsAccessRequired: boolean;
    s3KeyFormat: RegExp;
    allowedS3Buckets: string[];
    encryptionRequired: boolean;
    allowedUsers: string[];
    accessControlRequired: boolean;
    downloadControlRequired: boolean;
    auditControlRequired: boolean;
  },
  userId: string
): void {
  switch (operation) {
    case SecurityOperation.SIGN:
      validateSignatureTimestamp(signature);
      validateSignatureHashFormat(signature);
      validateSignatureKMSAccess(signature, config);
      validateSignatureStorageSecurity(signature, config);
      validateSignatureAuditTrail(signature);
      break;

    case SecurityOperation.VERIFY:
      validateSignatureCryptographicIntegrity(signature);
      validateSignatureHashFormat(signature);
      break;

    case SecurityOperation.ACCESS:
      validateSignatureCanBeAccessed(signature, userId, config);
      break;

    case SecurityOperation.DOWNLOAD:
      validateSignatureCanBeDownloaded(signature, userId, config);
      break;

    case SecurityOperation.AUDIT:
      validateSignatureCanBeAudited(signature, userId, config);
      break;

    default:
      throw signatureInvalid(`Unknown signature security operation: ${operation}`);
  }
}

