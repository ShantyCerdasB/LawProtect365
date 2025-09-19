/**
 * @fileoverview SignerStatus.ts - Defines all possible states for a signer
 * @summary Enumerates the states of an individual signer in the signing process
 * @description The SignerStatus enum defines all possible states a signer can be in
 * during the signing process, from invitation to completion or decline.
 */

/**
 * Signer status enumeration
 * 
 * Defines all possible states for an individual signer in the signing process.
 * States represent the signer's participation and completion status.
 */
export enum SignerStatus {
  /**
   * Signer has been invited but hasn't responded yet
   * - Invitation sent
   * - Waiting for signer to access and consent
   * - Can still be removed from envelope (if envelope is in DRAFT)
   */
  PENDING = 'PENDING',

  /**
   * Signer has successfully signed the document
   * - Consent was given
   * - Signature was applied
   * - Cannot be removed from envelope
   * - Final state for successful completion
   */
  SIGNED = 'SIGNED',

  /**
   * Signer has declined to sign the document
   * - Signer explicitly declined
   * - May include decline reason
   * - Cannot be removed from envelope
   * - Final state for declined signer
   */
  DECLINED = 'DECLINED'
}

/**
 * Valid status transitions for signers
 */
export const SIGNER_STATUS_TRANSITIONS: Record<SignerStatus, SignerStatus[]> = {
  [SignerStatus.PENDING]: [
    SignerStatus.SIGNED,
    SignerStatus.DECLINED
  ],
  [SignerStatus.SIGNED]: [],
  [SignerStatus.DECLINED]: []
};

/**
 * Checks if a signer status transition is valid
 */
export function isValidSignerStatusTransition(from: SignerStatus, to: SignerStatus): boolean {
  return SIGNER_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Gets all valid next statuses for a given signer status
 */
export function getValidNextSignerStatuses(currentStatus: SignerStatus): SignerStatus[] {
  return SIGNER_STATUS_TRANSITIONS[currentStatus];
}
