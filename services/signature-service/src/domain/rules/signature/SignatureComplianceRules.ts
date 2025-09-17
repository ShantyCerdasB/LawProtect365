/**
 * @fileoverview SignatureComplianceRules - Compliance rules for signature operations
 * @summary Contains compliance validation for signature legal validity, algorithm compliance, and retention policies
 * @description This file contains compliance rules specific to the Signature entity, including
 * validation for legal validity, algorithm compliance, certificate compliance, retention policies,
 * access logging, and tamper evidence requirements.
 */

import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { SigningAlgorithm } from '@/domain/enums/SigningAlgorithm';
import { 
  signatureFailed, 
  signatureNotFound,
  signatureInvalid,
  complianceViolation,
  documentIntegrityViolation
} from '@/signature-errors';
import { 
  validateAlgorithmCompliance,
  validateAlgorithmSecurityLevel,
  SecurityLevel,
  ComplianceLevel,
  validateSignatureIpAddress,
  validateSignatureUserAgent,
  diffMs,
  RetentionUnit,
  retentionUnitToMs,
  BUSINESS_TIME_PERIODS
} from '@lawprotect/shared-ts';

/**
 * Signature compliance operation types
 */
export enum SignatureComplianceOperation {
  VALIDATE = 'VALIDATE',
  AUDIT = 'AUDIT',
  RETAIN = 'RETAIN',
  ACCESS = 'ACCESS',
  REPORT = 'REPORT'
}

/**
 * Validates signature legal validity
 */
export function validateSignatureLegalValidity(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for legal validity validation');
  }

  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Only signed signatures can be legally valid');
  }

  // Validate signature timestamp is within legal bounds
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const age = diffMs(now, signatureTime);
  
  if (age > BUSINESS_TIME_PERIODS.MAX_SIGNATURE_LEGAL_AGE_MS) {
    throw signatureInvalid('Signature is too old for legal validity');
  }
}

/**
 * Validates signature algorithm compliance
 */
export function validateSignatureAlgorithmCompliance(
  signature: Signature,
  config: { 
    allowedAlgorithms: SigningAlgorithm[]; 
    minSecurityLevel: SecurityLevel;
    complianceLevel: ComplianceLevel
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for algorithm compliance validation');
  }

  const algorithm = signature.getAlgorithm();

  if (!algorithm) {
    throw complianceViolation('Signing algorithm is required for compliance');
  }

  // Validate algorithm is in allowed list
  if (!config.allowedAlgorithms.includes(algorithm as SigningAlgorithm)) {
    throw complianceViolation(`Algorithm ${algorithm} is not compliant with current policy`);
  }

  // Validate algorithm meets minimum security level using shared utilities
  try {
    validateAlgorithmSecurityLevel(algorithm as SigningAlgorithm, config.minSecurityLevel);
  } catch (error) {
    if (error instanceof Error) {
      throw complianceViolation(error.message);
    }
    throw error;
  }

  // Validate algorithm meets compliance level requirements
  try {
    validateAlgorithmCompliance(algorithm as SigningAlgorithm, config.complianceLevel);
  } catch (error) {
    if (error instanceof Error) {
      throw complianceViolation(error.message);
    }
    throw error;
  }
}


/**
 * Validates signature retention policy
 */
export function validateSignatureRetentionPolicy(
  signature: Signature,
  config: { 
    retentionPeriod: number; 
    retentionUnit: RetentionUnit;
    archiveRequired: boolean;
    deleteAfterRetention: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for retention policy validation');
  }

  const signatureTime = signature.getTimestamp();
  const now = new Date();
  
  // Calculate retention period in milliseconds using shared utility
  const retentionMs = retentionUnitToMs(config.retentionUnit, config.retentionPeriod);

  const age = diffMs(now, signatureTime);
  
  // Check if signature is within retention period
  if (age > retentionMs) {
    if (config.deleteAfterRetention) {
      throw complianceViolation('Signature has exceeded retention period and should be deleted');
    } else if (config.archiveRequired) {
      throw complianceViolation('Signature has exceeded retention period and should be archived');
    }
  }
}

/**
 * Validates signature access logging
 */
export function validateSignatureAccessLogging(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for access logging validation');
  }

  const metadata = signature.getMetadata();

  // Validate required access logging fields
  if (!signature.getTimestamp()) {
    throw complianceViolation('Signature timestamp is required for access logging');
  }

  if (!signature.getId()) {
    throw complianceViolation('Signature ID is required for access logging');
  }

  if (!signature.getEnvelopeId()) {
    throw complianceViolation('Envelope ID is required for access logging');
  }

  if (!signature.getSignerId()) {
    throw complianceViolation('Signer ID is required for access logging');
  }

  // Validate IP address is logged if present using shared utilities
  if (metadata.ipAddress) {
    try {
      validateSignatureIpAddress(metadata.ipAddress);
    } catch (error) {
      if (error instanceof Error) {
        throw complianceViolation(`Invalid IP address format in access log: ${error.message}`);
      }
      throw error;
    }
  }

  // Validate user agent is logged if present using shared utilities
  if (metadata.userAgent) {
    try {
      validateSignatureUserAgent(metadata.userAgent, 500);
    } catch (error) {
      if (error instanceof Error) {
        throw complianceViolation(`Invalid user agent format in access log: ${error.message}`);
      }
      throw error;
    }
  }
}

/**
 * Validates signature tamper evidence
 */
export function validateSignatureTamperEvidence(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for tamper evidence validation');
  }

  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Only signed signatures can have tamper evidence validated');
  }

  // Validate signature has required tamper evidence fields
  if (!signature.getDocumentHash()) {
    throw documentIntegrityViolation('Document hash is required for tamper evidence');
  }

  if (!signature.getSignatureHash()) {
    throw documentIntegrityViolation('Signature hash is required for tamper evidence');
  }

  if (!signature.getTimestamp()) {
    throw documentIntegrityViolation('Signature timestamp is required for tamper evidence');
  }

  // Use entity's built-in validation which already includes hash, timestamp, and integrity validation
  if (!signature.validateIntegrity()) {
    throw signatureInvalid('Signature integrity validation failed, possible tampering');
  }
}

/**
 * Validates signature compliance for audit
 */
export function validateSignatureComplianceForAudit(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for compliance audit');
  }

  // Validate all compliance requirements
  validateSignatureLegalValidity(signature);
  validateSignatureAccessLogging(signature);
  validateSignatureTamperEvidence(signature);
  
  // Validate signature has required audit information
  const auditSummary = signature.getAuditSummary();
  
  if (!auditSummary.id || !auditSummary.envelopeId || !auditSummary.signerId) {
    throw complianceViolation('Signature is missing required audit information');
  }

  if (!auditSummary.timestamp || !auditSummary.status || !auditSummary.algorithm) {
    throw complianceViolation('Signature is missing required audit metadata');
  }
}

/**
 * Validates signature compliance for reporting
 */
export function validateSignatureComplianceForReporting(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for compliance reporting');
  }

  // Validate signature has all required fields for reporting
  const auditSummary = signature.getAuditSummary();
  
  const requiredFields = [
    'id', 'envelopeId', 'signerId', 'timestamp', 'status', 
    'algorithm', 'kmsKeyId', 'documentHash', 'signatureHash', 's3Key'
  ];

  for (const field of requiredFields) {
    if (!(auditSummary as any)[field]) {
      throw complianceViolation(`Signature is missing required field ${field} for reporting`);
    }
  }

  // Validate signature status is appropriate for reporting
  if (signature.getStatus() === SignatureStatus.FAILED) {
    throw signatureFailed('Failed signatures cannot be included in compliance reports');
  }
}

/**
 * Validates all signature compliance rules
 */
export function validateSignatureComplianceRules(
  signature: Signature,
  operation: SignatureComplianceOperation,
  config: {
    allowedAlgorithms: SigningAlgorithm[];
    minSecurityLevel: SecurityLevel;
    complianceLevel: ComplianceLevel;
    retentionPeriod: number;
    retentionUnit: RetentionUnit;
    archiveRequired: boolean;
    deleteAfterRetention: boolean;
  }
): void {
  switch (operation) {
    case SignatureComplianceOperation.VALIDATE:
      validateSignatureLegalValidity(signature);
      validateSignatureAlgorithmCompliance(signature, config);
      validateSignatureRetentionPolicy(signature, config);
      validateSignatureAccessLogging(signature);
      validateSignatureTamperEvidence(signature);
      break;

    case SignatureComplianceOperation.AUDIT:
      validateSignatureComplianceForAudit(signature);
      break;

    case SignatureComplianceOperation.RETAIN:
      validateSignatureRetentionPolicy(signature, config);
      break;

    case SignatureComplianceOperation.ACCESS:
      validateSignatureAccessLogging(signature);
      break;

    case SignatureComplianceOperation.REPORT:
      validateSignatureComplianceForReporting(signature);
      break;

    default:
      throw complianceViolation(`Unknown signature compliance operation: ${operation}`);
  }
}




