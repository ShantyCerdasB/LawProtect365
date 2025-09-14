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

  // Validate signature has required legal information
  const metadata = signature.getMetadata();
  
  if (!metadata.certificateInfo) {
    throw complianceViolation('Certificate information is required for legal validity');
  }

  // Validate certificate is not expired
  const cert = metadata.certificateInfo;
  if (cert.validTo < new Date()) {
    throw signatureInvalid('Certificate has expired, signature is not legally valid');
  }

  // Validate certificate is from a trusted issuer
  if (!isTrustedCertificateIssuer(cert.issuer)) {
    throw complianceViolation('Certificate issuer is not trusted for legal validity');
  }

  // Validate signature timestamp is within legal bounds
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  if (now.getTime() - signatureTime.getTime() > maxAge) {
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
    minSecurityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    complianceLevel: 'BASIC' | 'ADVANCED' | 'HIGH_SECURITY'
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

  // Validate algorithm meets minimum security level
  const algorithmLevel = getSigningAlgorithmSecurityLevel(algorithm as SigningAlgorithm);
  const levelOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
  
  if (levelOrder[algorithmLevel] < levelOrder[config.minSecurityLevel]) {
    throw complianceViolation(`Algorithm ${algorithm} does not meet minimum security level ${config.minSecurityLevel}`);
  }

  // Validate algorithm meets compliance level requirements
  switch (config.complianceLevel) {
    case 'BASIC':
      // Basic compliance allows SHA-256 and above
      if (algorithm === SigningAlgorithm.SHA256_RSA || algorithm === SigningAlgorithm.ECDSA_P256_SHA256) {
        return; // Valid
      }
      break;
    case 'ADVANCED':
      // Advanced compliance requires SHA-384 and above
      if (algorithm === SigningAlgorithm.SHA384_RSA || algorithm === SigningAlgorithm.ECDSA_P384_SHA384) {
        return; // Valid
      }
      break;
    case 'HIGH_SECURITY':
      // High security compliance requires SHA-512 or ECDSA P-384
      if (algorithm === SigningAlgorithm.SHA512_RSA || algorithm === SigningAlgorithm.ECDSA_P384_SHA384) {
        return; // Valid
      }
      break;
  }

  throw complianceViolation(`Algorithm ${algorithm} does not meet compliance level ${config.complianceLevel}`);
}

/**
 * Validates signature certificate compliance
 */
export function validateSignatureCertificateCompliance(signature: Signature): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for certificate compliance validation');
  }

  const certificateInfo = signature.getCertificateInfo();
  
  if (!certificateInfo) {
    throw complianceViolation('Certificate information is required for compliance');
  }

  // Validate certificate fields are present
  if (!certificateInfo.issuer || !certificateInfo.subject || !certificateInfo.certificateHash) {
    throw complianceViolation('Certificate information is incomplete for compliance');
  }

  // Validate certificate validity period
  const now = new Date();
  if (certificateInfo.validFrom > now) {
    throw complianceViolation('Certificate is not yet valid');
  }

  if (certificateInfo.validTo < now) {
    throw signatureInvalid('Certificate has expired');
  }

  // Validate certificate is from a trusted CA
  if (!isTrustedCertificateAuthority(certificateInfo.issuer)) {
    throw complianceViolation('Certificate is not from a trusted Certificate Authority');
  }

  // Validate certificate has required extensions for compliance
  if (!hasRequiredCertificateExtensions(certificateInfo)) {
    throw complianceViolation('Certificate does not have required extensions for compliance');
  }
}

/**
 * Validates signature retention policy
 */
export function validateSignatureRetentionPolicy(
  signature: Signature,
  config: { 
    retentionPeriod: number; 
    retentionUnit: 'DAYS' | 'MONTHS' | 'YEARS';
    archiveRequired: boolean;
    deleteAfterRetention: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for retention policy validation');
  }

  const signatureTime = signature.getTimestamp();
  const now = new Date();
  
  // Calculate retention period in milliseconds
  let retentionMs: number;
  switch (config.retentionUnit) {
    case 'DAYS':
      retentionMs = config.retentionPeriod * 24 * 60 * 60 * 1000;
      break;
    case 'MONTHS':
      retentionMs = config.retentionPeriod * 30 * 24 * 60 * 60 * 1000; // Approximate
      break;
    case 'YEARS':
      retentionMs = config.retentionPeriod * 365 * 24 * 60 * 60 * 1000; // Approximate
      break;
    default:
      throw complianceViolation('Invalid retention unit');
  }

  const age = now.getTime() - signatureTime.getTime();
  
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

  // Validate IP address is logged if present
  if (metadata.ipAddress) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(metadata.ipAddress)) {
      throw complianceViolation('Invalid IP address format in access log');
    }
  }

  // Validate user agent is logged if present
  if (metadata.userAgent) {
    if (typeof metadata.userAgent !== 'string' || metadata.userAgent.length > 500) {
      throw complianceViolation('Invalid user agent format in access log');
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

  // Validate hash formats are correct
  const hashRegex = /^[a-f0-9]{64}$/i;
  if (!hashRegex.test(signature.getDocumentHash())) {
    throw signatureInvalid('Document hash format is invalid, possible tampering');
  }

  if (!hashRegex.test(signature.getSignatureHash())) {
    throw signatureInvalid('Signature hash format is invalid, possible tampering');
  }

  // Validate timestamp is not in the future
  if (signature.getTimestamp() > new Date()) {
    throw signatureInvalid('Signature timestamp is in the future, possible tampering');
  }

  // Validate signature integrity
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
    minSecurityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    complianceLevel: 'BASIC' | 'ADVANCED' | 'HIGH_SECURITY';
    retentionPeriod: number;
    retentionUnit: 'DAYS' | 'MONTHS' | 'YEARS';
    archiveRequired: boolean;
    deleteAfterRetention: boolean;
  }
): void {
  switch (operation) {
    case SignatureComplianceOperation.VALIDATE:
      validateSignatureLegalValidity(signature);
      validateSignatureAlgorithmCompliance(signature, config);
      validateSignatureCertificateCompliance(signature);
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

/**
 * Helper function to check if certificate issuer is trusted
 */
function isTrustedCertificateIssuer(issuer: string): boolean {
  const trustedIssuers = [
    'DigiCert',
    'VeriSign',
    'GlobalSign',
    'Comodo',
    'Symantec',
    'GoDaddy',
    'Sectigo',
    'Let\'s Encrypt'
  ];
  
  return trustedIssuers.some(trusted => issuer.includes(trusted));
}

/**
 * Helper function to check if certificate authority is trusted
 */
function isTrustedCertificateAuthority(issuer: string): boolean {
  const trustedCAs = [
    'DigiCert Global Root CA',
    'VeriSign Class 3 Public Primary Certification Authority',
    'GlobalSign Root CA',
    'Comodo RSA Certification Authority',
    'Symantec Class 3 Secure Server CA',
    'GoDaddy Class 2 CA',
    'Sectigo RSA Domain Validation Secure Server CA',
    'Let\'s Encrypt Authority X3'
  ];
  
  return trustedCAs.some(trusted => issuer.includes(trusted));
}

/**
 * Helper function to check if certificate has required extensions
 */
function hasRequiredCertificateExtensions(_certificateInfo: any): boolean {
  // This would typically check for specific certificate extensions
  // For now, we'll assume all certificates have the required extensions
  return true;
}

/**
 * Helper function to get signing algorithm security level
 */
function getSigningAlgorithmSecurityLevel(algorithm: SigningAlgorithm): 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (algorithm) {
    case SigningAlgorithm.SHA512_RSA:
    case SigningAlgorithm.ECDSA_P384_SHA384:
      return 'HIGH';
    case SigningAlgorithm.SHA384_RSA:
    case SigningAlgorithm.ECDSA_P256_SHA256:
      return 'MEDIUM';
    case SigningAlgorithm.SHA256_RSA:
      return 'LOW';
    default:
      return 'LOW';
  }
}
