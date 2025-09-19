/**
 * @fileoverview SignatureBusinessRules - Business rules for signature operations
 * @summary Contains business logic validation for signature creation, status transitions, and integrity
 * @description This file contains business rules specific to the Signature entity, including
 * validation for signature creation, status transitions, integrity checks, metadata validation,
 * timing validation, algorithm validation, KMS key validation, and S3 storage validation.
 */

import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { SigningAlgorithm } from '@/domain/enums/SigningAlgorithm';
import { 
  signatureFailed, 
  signatureAlreadyExists,
  signatureNotFound,
  signatureInvalid,
  rateLimitExceeded
} from '@/signature-errors';
import { 
  validateAlgorithmSecurityLevel,
  SecurityLevel,
  SignatureOperation
} from '@lawprotect/shared-ts';

/**
 * Validates signature creation requirements
 */
export function validateSignatureCreation(
  signature: Signature,
  _config: { maxSignaturesPerEnvelope: number; maxSignaturesPerSigner: number }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for creation');
  }

  if (!signature.getId()) {
    throw signatureInvalid('Signature ID is required');
  }

  if (!signature.getEnvelopeId()) {
    throw signatureInvalid('Envelope ID is required');
  }

  if (!signature.getSignerId()) {
    throw signatureInvalid('Signer ID is required');
  }

  if (!signature.getDocumentHash()) {
    throw signatureInvalid('Document hash is required');
  }

  if (!signature.getSignatureHash()) {
    throw signatureInvalid('Signature hash is required');
  }

  if (!signature.getS3Key()) {
    throw signatureInvalid('S3 key is required');
  }

  if (!signature.getKmsKeyId()) {
    throw signatureInvalid('KMS key ID is required');
  }

  if (!signature.getAlgorithm()) {
    throw signatureInvalid('Signing algorithm is required');
  }

  if (!signature.getTimestamp()) {
    throw signatureInvalid('Signature timestamp is required');
  }
}

/**
 * Validates signature status transitions
 */
export function validateSignatureStatusTransition(
  currentStatus: SignatureStatus,
  newStatus: SignatureStatus
): void {
  const validTransitions: Record<SignatureStatus, SignatureStatus[]> = {
    [SignatureStatus.PENDING]: [SignatureStatus.SIGNED, SignatureStatus.FAILED],
    [SignatureStatus.SIGNED]: [],
    [SignatureStatus.FAILED]: []
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw signatureInvalid(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
}

/**
 * Validates signature integrity
 */
export function validateSignatureIntegrity(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for integrity validation');
  }

  // Use entity's built-in validation which already includes hash and timestamp validation
  if (!signature.validateIntegrity()) {
    throw signatureInvalid('Signature integrity validation failed');
  }
}

/**
 * Validates signature metadata
 */
export function validateSignatureMetadata(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for metadata validation');
  }

  const metadata = signature.getMetadata();
  
  if (metadata.reason && typeof metadata.reason !== 'string') {
    throw signatureInvalid('Signature reason must be a string');
  }

  if (metadata.location && typeof metadata.location !== 'string') {
    throw signatureInvalid('Signature location must be a string');
  }

  if (metadata.ipAddress && typeof metadata.ipAddress !== 'string') {
    throw signatureInvalid('IP address must be a string');
  }

  if (metadata.userAgent && typeof metadata.userAgent !== 'string') {
    throw signatureInvalid('User agent must be a string');
  }

}

/**
 * Validates signature timing
 */
export function validateSignatureTiming(
  signature: Signature,
  config: { maxSignatureAge: number; minSignatureAge: number }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for timing validation');
  }

  const age = signature.getAge();
  
  if (age > config.maxSignatureAge) {
    throw signatureInvalid('Signature is too old');
  }

  if (age < config.minSignatureAge) {
    throw signatureInvalid('Signature is too recent');
  }
}

/**
 * Validates signature algorithm
 */
export function validateSignatureAlgorithm(
  algorithm: string,
  config: { allowedAlgorithms: SigningAlgorithm[]; minSecurityLevel: SecurityLevel }
): void {
  if (!algorithm) {
    throw signatureInvalid('Signing algorithm is required');
  }

  if (!config.allowedAlgorithms.includes(algorithm as SigningAlgorithm)) {
    throw signatureInvalid(`Algorithm ${algorithm} is not allowed`);
  }

  // Validate security level if required
  if (config.minSecurityLevel) {
    try {
      validateAlgorithmSecurityLevel(algorithm as SigningAlgorithm, config.minSecurityLevel);
    } catch (error) {
      if (error instanceof Error) {
        throw signatureInvalid(error.message);
      }
      throw error;
    }
  }
}

/**
 * Validates KMS key for signature
 */
export function validateSignatureKMSKey(
  kmsKeyId: string,
  config: { allowedKMSKeys: string[]; kmsKeyFormat: RegExp }
): void {
  if (!kmsKeyId) {
    throw signatureInvalid('KMS key ID is required');
  }

  if (!config.kmsKeyFormat.test(kmsKeyId)) {
    throw signatureInvalid('Invalid KMS key ID format');
  }

  if (config.allowedKMSKeys.length > 0 && !config.allowedKMSKeys.includes(kmsKeyId)) {
    throw signatureInvalid(`KMS key ${kmsKeyId} is not allowed`);
  }
}

/**
 * Validates S3 storage for signature
 */
export function validateSignatureS3Storage(
  s3Key: string,
  config: { s3KeyFormat: RegExp; allowedS3Buckets: string[] }
): void {
  if (!s3Key) {
    throw signatureInvalid('S3 key is required');
  }

  if (!config.s3KeyFormat.test(s3Key)) {
    throw signatureInvalid('Invalid S3 key format');
  }

  // Extract bucket from S3 key if needed
  if (config.allowedS3Buckets.length > 0) {
    const bucket = s3Key.split('/')[0];
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw signatureInvalid(`S3 bucket ${bucket} is not allowed`);
    }
  }
}

/**
 * Validates signature can be created
 */
export function validateSignatureCanBeCreated(
  signature: Signature,
  existingSignatures: Signature[],
  config: { maxSignaturesPerEnvelope: number; maxSignaturesPerSigner: number }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for creation validation');
  }

  // Check envelope signature limit
  const envelopeSignatures = existingSignatures.filter(s => s.getEnvelopeId() === signature.getEnvelopeId());
  if (envelopeSignatures.length >= config.maxSignaturesPerEnvelope) {
    throw rateLimitExceeded('Maximum signatures per envelope exceeded');
  }

  // Check signer signature limit
  const signerSignatures = existingSignatures.filter(s => s.getSignerId() === signature.getSignerId());
  if (signerSignatures.length >= config.maxSignaturesPerSigner) {
    throw rateLimitExceeded('Maximum signatures per signer exceeded');
  }

  // Check for duplicate signature
  const duplicateSignature = existingSignatures.find(s => 
    s.getEnvelopeId() === signature.getEnvelopeId() && 
    s.getSignerId() === signature.getSignerId()
  );
  
  if (duplicateSignature) {
    throw signatureAlreadyExists('Signature already exists for this signer and envelope');
  }
}

/**
 * Validates signature can be updated
 */
export function validateSignatureCanBeUpdated(
  signature: Signature,
  newStatus: SignatureStatus
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for update validation');
  }

  if (signature.getStatus() === SignatureStatus.SIGNED) {
    throw signatureAlreadyExists('Cannot update a signed signature');
  }

  if (signature.getStatus() === SignatureStatus.FAILED) {
    throw signatureFailed('Cannot update a failed signature');
  }

  validateSignatureStatusTransition(signature.getStatus(), newStatus);
}

/**
 * Validates signature can be retrieved
 */
export function validateSignatureCanBeRetrieved(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature not found');
  }

  if (signature.getStatus() === SignatureStatus.FAILED) {
    throw signatureFailed('Cannot retrieve a failed signature');
  }
}

/**
 * Validates signature can be verified
 */
export function validateSignatureCanBeVerified(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature not found');
  }

  // Use entity's built-in validation
  if (!signature.isValid()) {
    throw signatureInvalid('Signature is not valid for verification');
  }
}

/**
 * Validates all signature business rules
 */
export function validateSignatureBusinessRules(
  signature: Signature,
  operation: SignatureOperation,
  config: {
    maxSignaturesPerEnvelope: number;
    maxSignaturesPerSigner: number;
    maxSignatureAge: number;
    minSignatureAge: number;
    allowedAlgorithms: SigningAlgorithm[];
    minSecurityLevel: SecurityLevel;
    allowedKMSKeys: string[];
    kmsKeyFormat: RegExp;
    s3KeyFormat: RegExp;
    allowedS3Buckets: string[];
  },
  existingSignatures: Signature[] = []
): void {
  switch (operation) {
    case SignatureOperation.CREATE:
      validateSignatureCreation(signature, config);
      validateSignatureIntegrity(signature);
      validateSignatureMetadata(signature);
      validateSignatureAlgorithm(signature.getAlgorithm(), config);
      validateSignatureKMSKey(signature.getKmsKeyId(), config);
      validateSignatureS3Storage(signature.getS3Key(), config);
      validateSignatureCanBeCreated(signature, existingSignatures, config);
      break;

    case SignatureOperation.VALIDATE:
      validateSignatureIntegrity(signature);
      validateSignatureMetadata(signature);
      validateSignatureTiming(signature, config);
      break;

    case SignatureOperation.UPDATE:
      validateSignatureCanBeUpdated(signature, signature.getStatus());
      break;

    case SignatureOperation.RETRIEVE:
      validateSignatureCanBeRetrieved(signature);
      break;

    case SignatureOperation.VERIFY:
      validateSignatureCanBeVerified(signature);
      validateSignatureIntegrity(signature);
      break;

    default:
      throw signatureInvalid(`Unknown signature operation: ${operation}`);
  }
}

