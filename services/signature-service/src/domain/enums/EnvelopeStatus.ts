/**
 * @fileoverview EnvelopeStatus enum - Defines all possible states for an envelope
 * @summary Enumerates the lifecycle states of a document signing envelope
 * @description The EnvelopeStatus enum defines all possible states an envelope can be in
 * during its lifecycle, from creation to completion or failure states.
 */

/**
 * Envelope status enumeration
 * 
 * Defines all possible states for a document signing envelope throughout its lifecycle.
 * States follow a specific order and have business rules for valid transitions.
 */
export enum EnvelopeStatus {
  /**
   * Envelope is being created and configured
   * - Can add/remove signers
   * - Can modify metadata
   * - Cannot be sent for signing
   */
  DRAFT = 'DRAFT',

  /**
   * Envelope has been sent for signing
   * - Invitations have been sent to signers
   * - Cannot modify signers or metadata
   * - Waiting for first signature
   */
  SENT = 'SENT',

  /**
   * Envelope is in progress with some signatures completed
   * - Some signers have signed
   * - Others are still pending
   * - Cannot modify signers or metadata
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * Waiting for the owner to sign
   * - All invited signers have signed
   * - Owner needs to sign to complete
   */
  READY_FOR_SIGNATURE = 'READY_FOR_SIGNATURE',

  /**
   * All signers have completed signing
   * - Envelope is fully signed
   * - Cannot be modified
   * - Final state
   */
  COMPLETED = 'COMPLETED',

  /**
   * Envelope has expired
   * - Expiration date has passed
   * - Cannot be signed
   * - Cannot be modified
   */
  EXPIRED = 'EXPIRED',

  /**
   * At least one signer has declined
   * - Cannot be completed
   * - Owner can modify and resend
   */
  DECLINED = 'DECLINED'
}

/**
 * Valid status transitions for envelopes
 */
export const ENVELOPE_STATUS_TRANSITIONS: Record<EnvelopeStatus, EnvelopeStatus[]> = {
  [EnvelopeStatus.DRAFT]: [
    EnvelopeStatus.SENT,
    EnvelopeStatus.EXPIRED
  ],
  [EnvelopeStatus.SENT]: [
    EnvelopeStatus.IN_PROGRESS,
    EnvelopeStatus.READY_FOR_SIGNATURE,
    EnvelopeStatus.COMPLETED,
    EnvelopeStatus.EXPIRED,
    EnvelopeStatus.DECLINED
  ],
  [EnvelopeStatus.IN_PROGRESS]: [
    EnvelopeStatus.READY_FOR_SIGNATURE,
    EnvelopeStatus.COMPLETED,
    EnvelopeStatus.EXPIRED,
    EnvelopeStatus.DECLINED
  ],
  [EnvelopeStatus.READY_FOR_SIGNATURE]: [
    EnvelopeStatus.COMPLETED,
    EnvelopeStatus.EXPIRED
  ],
  [EnvelopeStatus.COMPLETED]: [],
  [EnvelopeStatus.EXPIRED]: [],
  [EnvelopeStatus.DECLINED]: [
    EnvelopeStatus.DRAFT
  ]
};

/**
 * Checks if a status transition is valid
 */
export function isValidEnvelopeStatusTransition(from: EnvelopeStatus, to: EnvelopeStatus): boolean {
  return ENVELOPE_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Gets all valid next statuses for a given status
 */
export function getValidNextStatuses(currentStatus: EnvelopeStatus): EnvelopeStatus[] {
  return ENVELOPE_STATUS_TRANSITIONS[currentStatus];
}
