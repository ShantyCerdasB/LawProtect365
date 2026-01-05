/**
 * @fileoverview Event Names Enum - Centralized event name constants
 * @summary Enum containing all integration event names to avoid hardcoded strings
 * @description Provides type-safe event names for integration events emitted by the signature service
 */

/**
 * Integration event names for signature service
 */
export enum EventNames {
  ENVELOPE_INVITATION = 'ENVELOPE_INVITATION',
  DOCUMENT_VIEW_INVITATION = 'DOCUMENT_VIEW_INVITATION',
  SIGNER_DECLINED = 'SIGNER_DECLINED',
  ENVELOPE_CANCELLED = 'ENVELOPE_CANCELLED',
  REMINDER_NOTIFICATION = 'REMINDER_NOTIFICATION',
  DOCUMENT_SIGNED = 'DOCUMENT_SIGNED'
}
