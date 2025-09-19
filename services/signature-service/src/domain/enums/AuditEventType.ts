/**
 * @fileoverview AuditEventType enum - Defines all possible audit event types
 * @summary Enumerates the types of audit events for compliance tracking
 * @description The AuditEventType enum defines all possible types of audit events
 * that can be recorded for legal compliance and audit trail purposes.
 */

/**
 * Audit event type enumeration
 * 
 * Defines all possible types of audit events that can be recorded
 * for compliance, tracking, and audit trail purposes.
 */
export enum AuditEventType {
  // Envelope events
  ENVELOPE_CREATED = 'ENVELOPE_CREATED',
  ENVELOPE_UPDATED = 'ENVELOPE_UPDATED',
  ENVELOPE_SENT = 'ENVELOPE_SENT',
  ENVELOPE_COMPLETED = 'ENVELOPE_COMPLETED',
  ENVELOPE_CANCELLED = 'ENVELOPE_CANCELLED',
  ENVELOPE_EXPIRED = 'ENVELOPE_EXPIRED',
  ENVELOPE_DECLINED = 'ENVELOPE_DECLINED',
  ENVELOPE_DELETED = 'ENVELOPE_DELETED',
  ENVELOPE_STATUS_CHANGED = 'ENVELOPE_STATUS_CHANGED',

  // Signer events
  SIGNER_ADDED = 'SIGNER_ADDED',
  SIGNER_REMOVED = 'SIGNER_REMOVED',
  SIGNER_INVITED = 'SIGNER_INVITED',
  SIGNER_REMINDER_SENT = 'SIGNER_REMINDER_SENT',
  SIGNER_SIGNED = 'SIGNER_SIGNED',
  SIGNER_DECLINED = 'SIGNER_DECLINED',

    // Signature events
    SIGNATURE_CREATED = 'SIGNATURE_CREATED',
    SIGNATURE_FAILED = 'SIGNATURE_FAILED',
    SIGNATURE_VALIDATED = 'SIGNATURE_VALIDATED',
    SIGNATURE_STATUS_UPDATED = 'SIGNATURE_STATUS_UPDATED',

  // Consent and access events
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  DOCUMENT_ACCESSED = 'DOCUMENT_ACCESSED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  LINK_SHARED = 'LINK_SHARED',
  INVITATION_ISSUED = 'INVITATION_ISSUED',
  INVITATION_TOKEN_USED = 'INVITATION_TOKEN_USED'
}
