/**
 * @fileoverview Signature Enums - Enumerations for signature module
 * @summary Centralized enums for signature-related types
 * @description
 * Defines all enumerations used in the signature module to avoid string literals
 * and ensure type safety across the application.
 */

/**
 * @description Document origin types for envelopes.
 */
export enum DocumentOriginType {
  /**
   * @description Document uploaded by user.
   */
  UPLOAD = 'UPLOAD',
  /**
   * @description Document from template.
   */
  TEMPLATE = 'TEMPLATE',
  /**
   * @description Document generated programmatically.
   */
  GENERATED = 'GENERATED',
}

/**
 * @description Signing order types for envelopes.
 */
export enum SigningOrderType {
  /**
   * @description Owner/creator signs first, then invitees.
   */
  OWNER_FIRST = 'OWNER_FIRST',
  /**
   * @description Invitees sign first, then owner/creator.
   */
  INVITEES_FIRST = 'INVITEES_FIRST',
}

/**
 * @description Wizard step types.
 */
export enum WizardStep {
  /**
   * @description Upload document step.
   */
  UPLOAD = 'upload',
  /**
   * @description Add signers step.
   */
  SIGNERS = 'signers',
  /**
   * @description Configure envelope step.
   */
  CONFIGURE = 'configure',
  /**
   * @description Review and confirm step.
   */
  REVIEW = 'review',
}

/**
 * @description Envelope status types.
 */
export enum EnvelopeStatus {
  /**
   * @description Envelope is in draft state.
   */
  DRAFT = 'DRAFT',
  /**
   * @description Envelope has been sent.
   */
  SENT = 'SENT',
  /**
   * @description Envelope is completed (all signers signed).
   */
  COMPLETED = 'COMPLETED',
  /**
   * @description Envelope has been cancelled.
   */
  CANCELLED = 'CANCELLED',
  /**
   * @description Envelope has been declined.
   */
  DECLINED = 'DECLINED',
}

/**
 * @description Signer status types.
 */
export enum SignerStatus {
  /**
   * @description Signer is pending (not yet signed).
   */
  PENDING = 'PENDING',
  /**
   * @description Signer has signed.
   */
  SIGNED = 'SIGNED',
  /**
   * @description Signer has declined.
   */
  DECLINED = 'DECLINED',
}

