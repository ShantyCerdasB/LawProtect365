/**
 * @fileoverview AuditEventType - Enum for audit event types
 * @summary Defines all possible audit event types for signature operations
 * @description This enum provides type-safe event types for audit trail tracking,
 * covering envelope lifecycle, signer actions, document access, and signature operations.
 */

export enum AuditEventType {
  // Envelope events
  ENVELOPE_CREATED = 'ENVELOPE_CREATED',
  ENVELOPE_SENT = 'ENVELOPE_SENT',
  ENVELOPE_COMPLETED = 'ENVELOPE_COMPLETED',
  ENVELOPE_DECLINED = 'ENVELOPE_DECLINED',
  ENVELOPE_CANCELLED = 'ENVELOPE_CANCELLED',
  ENVELOPE_EXPIRED = 'ENVELOPE_EXPIRED',
  ENVELOPE_UPDATED = 'ENVELOPE_UPDATED',
  ENVELOPE_DELETED = 'ENVELOPE_DELETED',
  
  // Signer events
  SIGNER_ADDED = 'SIGNER_ADDED',
  SIGNER_REMOVED = 'SIGNER_REMOVED',
  SIGNER_INVITED = 'SIGNER_INVITED',
  SIGNER_REMINDER_SENT = 'SIGNER_REMINDER_SENT',
  SIGNER_DECLINED = 'SIGNER_DECLINED',
  SIGNER_SIGNED = 'SIGNER_SIGNED',
  
  // Document events
  DOCUMENT_ACCESSED = 'DOCUMENT_ACCESSED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  LINK_SHARED = 'LINK_SHARED',
  
  // Signature events
  SIGNATURE_CREATED = 'SIGNATURE_CREATED',
  
  // Consent events
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  
  // Invitation events
  INVITATION_ISSUED = 'INVITATION_ISSUED',
  INVITATION_TOKEN_USED = 'INVITATION_TOKEN_USED'
}
