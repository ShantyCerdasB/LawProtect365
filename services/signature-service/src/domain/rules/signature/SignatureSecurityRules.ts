/**
 * @fileoverview SignatureSecurityRules - Security rules for signature operations
 * @summary Contains security validation for signature cryptographic integrity, certificates, and access control
 * @description This file contains security rules specific to the Signature entity, including
 * validation for cryptographic integrity, certificate chain validation, timestamp validation,
 * hash format validation, KMS access validation, storage security validation, and audit trail validation.
 */

import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { SigningAlgorithm } from '@/domain/enums/SigningAlgorithm';
import { 
  signatureFailed, 
  signatureNotFound,
  signatureInvalid
} from '@/signature-errors';

/**
 * Signature security operation types
 */
export enum SignatureSecurityOperation {
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
  ACCESS = 'ACCESS',
  DOWNLOAD = 'DOWNLOAD',
  AUDIT = 'AUDIT'
}

/**
 * Validates signature cryptographic integrity
 */
export function validateSignatureCryptographicIntegrity(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for cryptographic integrity validation');
  }

  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Only signed signatures can have cryptographic integrity validated');
  }

  // Validate hash formats
  const hashRegex = /^[a-f0-9]{64}$/i;
  if (!hashRegex.test(signature.getDocumentHash())) {
    throw signatureInvalid('Document hash format is invalid');
  }

  if (!hashRegex.test(signature.getSignatureHash())) {
    throw signatureInvalid('Signature hash format is invalid');
  }

  // Validate hash lengths (SHA-256 = 64 chars, SHA-384 = 96 chars, SHA-512 = 128 chars)
  const algorithm = signature.getAlgorithm();
  const expectedHashLength = getExpectedHashLength(algorithm);
  
  if (signature.getDocumentHash().length !== expectedHashLength) {
    throw signatureInvalid('Document hash length does not match algorithm');
  }

  if (signature.getSignatureHash().length !== expectedHashLength) {
    throw signatureInvalid('Signature hash length does not match algorithm');
  }
}

/**
 * Validates signature certificate chain
 */
export function validateSignatureCertificateChain(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for certificate validation');
  }

  const certificateInfo = signature.getCertificateInfo();
  
  if (!certificateInfo) {
    throw signatureInvalid('Certificate information is required for signature validation');
  }

  // Validate certificate fields
  if (!certificateInfo.issuer || typeof certificateInfo.issuer !== 'string') {
    throw signatureInvalid('Certificate issuer is required');
  }

  if (!certificateInfo.subject || typeof certificateInfo.subject !== 'string') {
    throw signatureInvalid('Certificate subject is required');
  }

  if (!certificateInfo.validFrom || !(certificateInfo.validFrom instanceof Date)) {
    throw signatureInvalid('Certificate valid from date is required');
  }

  if (!certificateInfo.validTo || !(certificateInfo.validTo instanceof Date)) {
    throw signatureInvalid('Certificate valid to date is required');
  }

  if (!certificateInfo.certificateHash || typeof certificateInfo.certificateHash !== 'string') {
    throw signatureInvalid('Certificate fingerprint is required');
  }

  // Validate certificate validity period
  const now = new Date();
  if (certificateInfo.validFrom > now) {
    throw signatureInvalid('Certificate is not yet valid');
  }

  if (certificateInfo.validTo < now) {
    throw signatureInvalid('Certificate has expired');
  }

  // Validate fingerprint format (SHA-1 = 40 chars, SHA-256 = 64 chars)
  const fingerprintRegex = /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i;
  if (!fingerprintRegex.test(certificateInfo.certificateHash)) {
    throw signatureInvalid('Invalid certificate fingerprint format');
  }
}

/**
 * Validates signature timestamp
 */
export function validateSignatureTimestamp(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for timestamp validation');
  }

  const timestamp = signature.getTimestamp();
  const now = new Date();

  // Validate timestamp is not in the future
  if (timestamp > now) {
    throw signatureInvalid('Signature timestamp cannot be in the future');
  }

  // Validate timestamp is not too old (configurable)
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (now.getTime() - timestamp.getTime() > maxAge) {
    throw signatureInvalid('Signature timestamp is too old');
  }

  // Validate timestamp precision (should be within reasonable bounds)
  const minTimestamp = new Date('2020-01-01');
  if (timestamp < minTimestamp) {
    throw signatureInvalid('Signature timestamp is too old');
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
  const documentHash = signature.getDocumentHash();
  const signatureHash = signature.getSignatureHash();

  // Validate algorithm is supported
  if (!Object.values(SigningAlgorithm).includes(algorithm as SigningAlgorithm)) {
    throw signatureInvalid(`Unsupported signing algorithm: ${algorithm}`);
  }

  // Validate hash format based on algorithm
  const expectedLength = getExpectedHashLength(algorithm);
  const hashRegex = new RegExp(`^[a-f0-9]{${expectedLength}}$`, 'i');

  if (!hashRegex.test(documentHash)) {
    throw signatureInvalid(`Document hash format is invalid for algorithm ${algorithm}`);
  }

  if (!hashRegex.test(signatureHash)) {
    throw signatureInvalid(`Signature hash format is invalid for algorithm ${algorithm}`);
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

  const metadata = signature.getMetadata();

  // Validate required audit fields
  if (!signature.getTimestamp()) {
    throw signatureInvalid('Signature timestamp is required for audit trail');
  }

  if (!signature.getId()) {
    throw signatureInvalid('Signature ID is required for audit trail');
  }

  if (!signature.getEnvelopeId()) {
    throw signatureInvalid('Envelope ID is required for audit trail');
  }

  if (!signature.getSignerId()) {
    throw signatureInvalid('Signer ID is required for audit trail');
  }

  // Validate IP address if present
  if (metadata.ipAddress) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(metadata.ipAddress)) {
      throw signatureInvalid('Invalid IP address format in audit trail');
    }
  }

  // Validate user agent if present
  if (metadata.userAgent) {
    if (typeof metadata.userAgent !== 'string' || metadata.userAgent.length > 500) {
      throw signatureInvalid('Invalid user agent format in audit trail');
    }
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

  // Validate signature status allows access
  if (signature.getStatus() === SignatureStatus.FAILED) {
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

  // Validate signature status allows download
  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Only signed signatures can be downloaded');
  }

  if (!signature.isValid()) {
    throw signatureInvalid('Invalid signatures cannot be downloaded');
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
  operation: SignatureSecurityOperation,
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
    case SignatureSecurityOperation.SIGN:
      validateSignatureCryptographicIntegrity(signature);
      validateSignatureCertificateChain(signature);
      validateSignatureTimestamp(signature);
      validateSignatureHashFormat(signature);
      validateSignatureKMSAccess(signature, config);
      validateSignatureStorageSecurity(signature, config);
      validateSignatureAuditTrail(signature);
      break;

    case SignatureSecurityOperation.VERIFY:
      validateSignatureCryptographicIntegrity(signature);
      validateSignatureCertificateChain(signature);
      validateSignatureHashFormat(signature);
      break;

    case SignatureSecurityOperation.ACCESS:
      validateSignatureCanBeAccessed(signature, userId, config);
      break;

    case SignatureSecurityOperation.DOWNLOAD:
      validateSignatureCanBeDownloaded(signature, userId, config);
      break;

    case SignatureSecurityOperation.AUDIT:
      validateSignatureCanBeAudited(signature, userId, config);
      break;

    default:
      throw signatureInvalid(`Unknown signature security operation: ${operation}`);
  }
}

/**
 * Helper function to get expected hash length for algorithm
 */
function getExpectedHashLength(algorithm: string): number {
  switch (algorithm) {
    case SigningAlgorithm.SHA256_RSA:
    case SigningAlgorithm.ECDSA_P256_SHA256:
      return 64; // SHA-256
    case SigningAlgorithm.SHA384_RSA:
    case SigningAlgorithm.ECDSA_P384_SHA384:
      return 96; // SHA-384
    case SigningAlgorithm.SHA512_RSA:
      return 128; // SHA-512
    default:
      return 64; // Default to SHA-256
  }
}
