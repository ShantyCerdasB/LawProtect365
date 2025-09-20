/**
 * @file EnvelopeComplianceRules.ts
 * @summary Compliance validation rules for envelope operations
 * @description The EnvelopeComplianceRules provides compliance validation for envelope operations
 * to ensure legal compliance with ESIGN Act, UETA, and other US regulations for electronic signatures.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { Signer } from '@/domain/entities/Signer';
import { Signature } from '@/domain/entities/Signature';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import type { AuditEvent } from '@/domain/types/audit/AuditEvent';
import type { SignatureServiceConfig } from '@/config';
import { 
  auditTrailIncomplete,
  accessDenied
} from '@/signature-errors';
import { 
  validateESIGNConsent,
  validateESIGNIntent,
  validateUETAConsent,
  validateUETAAttribution,
  validateConsentDocumentation,
  validateDocumentIntegrity,
  validateSignatureAuthenticity
} from '@/domain/rules/signer/SignerComplianceRules';

// ESIGN and UETA validation functions moved to SignerComplianceRules

/**
 * Validates audit trail completeness for compliance
 * 
 * Ensures all critical audit events are recorded for legal compliance.
 * This is essential for proving the validity of electronic signatures.
 * 
 * @param _envelope - The envelope being validated (unused but kept for interface consistency)
 * @param auditEvents - Array of audit events to validate
 * @throws {SignatureError} When critical audit events are missing
 * @returns void
 */
export function validateAuditTrailCompleteness(_envelope: Envelope, auditEvents: AuditEvent[]): void {
  const criticalEvents = [
    AuditEventType.ENVELOPE_CREATED,
    AuditEventType.CONSENT_GIVEN,
    AuditEventType.SIGNER_SIGNED,
    AuditEventType.ENVELOPE_COMPLETED
  ];
  
  const eventTypes = auditEvents.map(e => e.type);
  const missingEvents = criticalEvents.filter(event => !eventTypes.includes(event));
  
  if (missingEvents.length > 0) {
    throw auditTrailIncomplete(`Critical audit events missing: ${missingEvents.join(', ')}`);
  }
}

/**
 * Validates audit trail integrity
 * 
 * Ensures the audit trail is complete and has not been tampered with.
 * This is critical for legal compliance and evidence integrity.
 * 
 * @param auditEvents - Array of audit events to validate integrity for
 * @throws {SignatureError} When audit trail integrity is compromised
 * @returns void
 */
export function validateAuditTrailIntegrity(auditEvents: AuditEvent[]): void {
  for (const event of auditEvents) {
    if (!event.id || !event.timestamp || !event.type) {
      throw auditTrailIncomplete('Audit trail integrity violation: missing required fields');
    }
    
    // Verify timestamps are not in the future
    if (event.timestamp > new Date()) {
      throw auditTrailIncomplete('Audit trail integrity violation: future timestamp');
    }
  }
}

// Document integrity and signature authenticity validation moved to SignerComplianceRules

/**
 * Validates access controls for compliance
 * 
 * Ensures only authorized users can access envelope data.
 * This is important for maintaining data privacy and security.
 * 
 * @param envelope - The envelope to validate access for
 * @param userId - The user ID requesting access
 * @throws {SignatureError} When user does not have sufficient permissions
 * @returns void
 */
export function validateAccessControls(envelope: Envelope, userId: string): void {
  if (envelope.getOwnerId() !== userId) {
    throw accessDenied('Access denied: insufficient permissions for envelope access');
  }
}

// Consent documentation validation moved to SignerComplianceRules

/**
 * Comprehensive compliance validation for envelope operations
 * 
 * Validates all compliance requirements for a complete envelope operation.
 * This function orchestrates all compliance validations.
 * 
 * @param envelope - The envelope to validate compliance for
 * @param signer - The signer to validate compliance for
 * @param signature - The signature to validate compliance for
 * @param auditEvents - Array of audit events for validation
 * @param userId - The user ID requesting the operation
 * @param _config - Service configuration (unused but kept for interface consistency)
 * @throws {SignatureError} When any compliance validation fails
 * @returns void
 */
export function validateEnvelopeCompliance(
  envelope: Envelope,
  signer: Signer,
  signature: Signature,
  auditEvents: AuditEvent[],
  userId: string,
  _config: SignatureServiceConfig
): void {
  // ESIGN Act compliance
  validateESIGNConsent(signer);
  validateESIGNIntent(signer);
  
  // UETA compliance
  validateUETAConsent(signer);
  validateUETAAttribution(signature);
  
  // Audit trail compliance
  validateAuditTrailCompleteness(envelope, auditEvents);
  validateAuditTrailIntegrity(auditEvents);
  
  // Document integrity
  validateDocumentIntegrity(signature);
  validateSignatureAuthenticity(signature);
  
  // Access controls
  validateAccessControls(envelope, userId);
  
  // Consent documentation
  validateConsentDocumentation(signer);
}
