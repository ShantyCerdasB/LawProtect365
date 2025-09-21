/**
 * @fileoverview AuditEventValidationRule - Domain rule for audit event validation
 * @summary Validates audit event business rules and compliance requirements
 * @description This domain rule encapsulates all business validation logic for audit events,
 * ensuring compliance with audit trail requirements and business constraints.
 */

import { SignatureAuditEvent } from '../entities/SignatureAuditEvent';
import { auditEventCreationFailed } from '../../signature-errors';
import { isEmail } from '@lawprotect/shared-ts';

/**
 * AuditEventValidationRule - Domain rule for audit event validation
 * 
 * Encapsulates business validation logic for audit events including:
 * - Description validation
 * - Signer event business rules
 * - Compliance requirements
 */
export class AuditEventValidationRule {
  /**
   * Validates an audit event for business compliance
   * @param auditEvent - The audit event to validate
   * @throws auditEventCreationFailed if validation fails
   */
  static validateAuditEvent(auditEvent: SignatureAuditEvent): void {
    // Validate description is not empty
    if (!auditEvent.getDescription() || auditEvent.getDescription().trim().length === 0) {
      throw auditEventCreationFailed('Description is required for audit events');
    }

    // Validate business rule: signer events must have signer ID
    if (auditEvent.isSignerEvent() && !auditEvent.getSignerId()) {
      throw auditEventCreationFailed('Signer ID is required for signer events');
    }

    // Validate description length for compliance
    if (auditEvent.getDescription().length > 500) {
      throw auditEventCreationFailed('Description must be 500 characters or less for compliance');
    }
  }

  /**
   * Validates audit event creation parameters
   * @param params - Audit event creation parameters
   * @throws auditEventCreationFailed if validation fails
   */
  static validateCreationParams(params: {
    envelopeId: any;
    signerId?: any;
    eventType: any;
    description: string;
    userId?: string;
    userEmail?: string;
  }): void {
    // Validate description
    if (!params.description || params.description.trim().length === 0) {
      throw auditEventCreationFailed('Description is required for audit events');
    }

    if (params.description.length > 500) {
      throw auditEventCreationFailed('Description must be 500 characters or less for compliance');
    }

    // Validate email format if provided
    if (params.userEmail && !isEmail(params.userEmail)) {
      throw auditEventCreationFailed('Invalid email format for user email');
    }
  }
}
