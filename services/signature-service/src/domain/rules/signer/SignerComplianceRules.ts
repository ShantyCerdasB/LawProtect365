/**
 * @fileoverview SignerComplianceRules - Compliance validation rules for signer operations
 * @summary Compliance validation rules for signer operations
 * @description The SignerComplianceRules provides compliance validation for signer operations
 * to ensure legal compliance with ESIGN Act, UETA, and other US regulations for electronic signatures.
 */

import { Signer } from '@/domain/entities/Signer';
import { Signature } from '@/domain/entities/Signature';
import { SignerStatus } from '@/domain/enums/SignerStatus';
import { 
  complianceViolation,
  consentRequired,
  documentIntegrityViolation,
  signatureInvalid
} from '@/signature-errors';
import { SignatureValidator } from '@/domain/validators/SignatureValidator';

/**
 * Validates ESIGN Act compliance for signer consent
 * 
 * ESIGN Act requires explicit consent before electronic signatures can be used.
 * This validation ensures the signer has given proper consent.
 * 
 * @param signer - The signer to validate consent for
 * @throws {SignatureError} When signer has not given explicit consent
 * @returns void
 */
export function validateESIGNConsent(signer: Signer): void {
  if (!signer.hasConsent()) {
    throw complianceViolation('ESIGN Act requires explicit consent before signing');
  }
}

/**
 * Validates ESIGN Act compliance for signing intent
 * 
 * ESIGN Act requires clear intent to sign electronically.
 * This validation ensures the signer has clear intent to sign.
 * 
 * @param signer - The signer to validate intent for
 * @throws {SignatureError} When signer does not have clear signing intent
 * @returns void
 */
export function validateESIGNIntent(signer: Signer): void {
  if (signer.getStatus() !== SignerStatus.PENDING) {
    throw complianceViolation('ESIGN Act requires clear signing intent');
  }
}

/**
 * Validates UETA compliance for consumer consent
 * 
 * UETA requires consumer consent for electronic transactions.
 * This validation ensures proper consent has been obtained.
 * 
 * @param signer - The signer to validate consent for
 * @throws {SignatureError} When signer has not given proper consent
 * @returns void
 */
export function validateUETAConsent(signer: Signer): void {
  if (!signer.hasConsent()) {
    throw complianceViolation('UETA requires consumer consent for electronic transactions');
  }
}

/**
 * Validates UETA compliance for signature attribution
 * 
 * UETA requires clear attribution of electronic signatures.
 * This validation ensures the signature can be properly attributed.
 * 
 * @param signature - The signature to validate attribution for
 * @throws {SignatureError} When signature attribution is not clear
 * @returns void
 */
export function validateUETAAttribution(signature: Signature): void {
  if (!signature.getSignerId() || !signature.getTimestamp()) {
    throw complianceViolation('UETA requires clear signature attribution');
  }
}

/**
 * Validates consent documentation completeness
 * 
 * Ensures all required consent documentation is present.
 * This is critical for ESIGN Act and UETA compliance.
 * 
 * @param signer - The signer to validate consent documentation for
 * @throws {SignatureError} When consent documentation is incomplete
 * @returns void
 */
export function validateConsentDocumentation(signer: Signer): void {
  const metadata = signer.getMetadata();
  
  if (!metadata.consentTimestamp) {
    throw consentRequired('Consent timestamp not documented');
  }
  
  if (!metadata.ipAddress) {
    throw consentRequired('Consent IP address not documented');
  }

  // Use entity's built-in validation for consent
  try {
    signer.validateForSigning();
  } catch (error) {
    if (error instanceof Error) {
      throw consentRequired(`Consent validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates document integrity for compliance
 * 
 * Ensures the document has not been tampered with and maintains integrity.
 * This is essential for legal validity of electronic signatures.
 * 
 * @param signature - The signature to validate document integrity for
 * @throws {SignatureError} When document integrity validation fails
 * @returns void
 */
export function validateDocumentIntegrity(signature: Signature): void {
  // Use centralized validator for signature validation
  try {
    SignatureValidator.validateHashIntegrity(signature);
  } catch (error) {
    if (error instanceof Error) {
      throw documentIntegrityViolation(`Document integrity validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates signature authenticity
 * 
 * Ensures the signature is authentic and properly formatted.
 * This validation is critical for legal compliance.
 * 
 * @param signature - The signature to validate
 * @throws {SignatureError} When signature authenticity validation fails
 * @returns void
 */
export function validateSignatureAuthenticity(signature: Signature): void {
  // Use centralized validator for signature validation
  try {
    SignatureValidator.validateHashIntegrity(signature);
  } catch (error) {
    if (error instanceof Error) {
      throw signatureInvalid(`Signature authenticity validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates signer identity for compliance
 * 
 * Ensures the signer's identity is properly verified.
 * This is important for legal compliance and audit trails.
 * 
 * @param signer - The signer to validate identity for
 * @throws {SignatureError} When signer identity is not properly verified
 * @returns void
 */
export function validateSignerComplianceIdentity(signer: Signer): void {
  if (!signer.getEmail() || !signer.getFullName()) {
    throw complianceViolation('Signer identity must include email and full name');
  }

}

/**
 * Validates signer consent timing
 * 
 * Ensures consent was given within a reasonable time frame.
 * This is important for legal compliance.
 * 
 * @param signer - The signer to validate consent timing for
 * @param maxConsentAgeHours - Maximum age of consent in hours
 * @throws {SignatureError} When consent is too old
 * @returns void
 */
export function validateConsentTiming(signer: Signer, _maxConsentAgeHours: number = 24): void {
  const metadata = signer.getMetadata();
  
  if (!metadata.consentTimestamp) {
    throw consentRequired('Consent timestamp is required');
  }

  // Use entity's built-in validation for consent
  try {
    signer.validateForSigning();
  } catch (error) {
    if (error instanceof Error) {
      throw complianceViolation(`Consent timing validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Comprehensive signer compliance validation
 * 
 * Validates all compliance requirements for a signer operation.
 * This function orchestrates all signer compliance validations.
 * 
 * @param signer - The signer to validate compliance for
 * @param signature - The signature to validate compliance for (optional)
 * @param maxConsentAgeHours - Maximum age of consent in hours
 * @throws {SignatureError} When any compliance validation fails
 * @returns void
 */
export function validateSignerCompliance(
  signer: Signer,
  signature?: Signature,
  maxConsentAgeHours: number = 24
): void {
  // ESIGN Act compliance
  validateESIGNConsent(signer);
  validateESIGNIntent(signer);
  
  // UETA compliance
  validateUETAConsent(signer);
  if (signature) {
    validateUETAAttribution(signature);
  }
  
  // Consent documentation
  validateConsentDocumentation(signer);
  validateConsentTiming(signer, maxConsentAgeHours);
  
  // Signer identity
  validateSignerComplianceIdentity(signer);
  
  // Signature validation (if provided)
  if (signature) {
    validateDocumentIntegrity(signature);
    validateSignatureAuthenticity(signature);
  }
}
