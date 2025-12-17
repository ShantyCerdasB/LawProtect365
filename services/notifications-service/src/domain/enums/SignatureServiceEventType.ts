/**
 * @fileoverview SignatureServiceEventType - Enum for signature service event types
 * @summary Defines all signature service event types for type-safe event processing
 * @description Provides type-safe event type constants for signature service events
 * to avoid hardcoded strings and enable compile-time checking.
 */

/**
 * Event types emitted by signature-service
 */
export enum SignatureServiceEventType {
  ENVELOPE_INVITATION = 'ENVELOPE_INVITATION',
  DOCUMENT_VIEW_INVITATION = 'DOCUMENT_VIEW_INVITATION',
  SIGNER_DECLINED = 'SIGNER_DECLINED',
  ENVELOPE_CANCELLED = 'ENVELOPE_CANCELLED',
  REMINDER_NOTIFICATION = 'REMINDER_NOTIFICATION'
}

