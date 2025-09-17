/**
 * @fileoverview SignatureStatus enum - Defines all possible states for a signature
 * @summary Enumerates the states of a cryptographic signature process
 * @description The SignatureStatus enum defines all possible states a signature can be in
 * during the cryptographic signing process, from initiation to completion or failure.
 */

/**
 * Signature status enumeration
 * 
 * Defines all possible states for a cryptographic signature during the signing process.
 * States represent the technical status of the signature creation and validation.
 */
export enum SignatureStatus {
  /**
   * Signature is being processed
   * - Signing request has been initiated
   * - Cryptographic process is in progress
   * - Waiting for KMS response or validation
   */
  PENDING = 'PENDING',

  /**
   * Signature has been successfully created and validated
   * - Cryptographic signature is complete
   * - Document has been signed and stored
   * - Signature is legally valid
   * - Final state for successful signature
   */
  SIGNED = 'SIGNED',

  /**
   * Signature creation failed
   * - Cryptographic process failed
   * - KMS error or validation failure
   * - Document was not signed
   * - Final state for failed signature
   */
  FAILED = 'FAILED'
}

/**
 * Valid status transitions for signatures
 */
export const SIGNATURE_STATUS_TRANSITIONS: Record<SignatureStatus, SignatureStatus[]> = {
  [SignatureStatus.PENDING]: [
    SignatureStatus.SIGNED,
    SignatureStatus.FAILED
  ],
  [SignatureStatus.SIGNED]: [],
  [SignatureStatus.FAILED]: []
};

/**
 * Checks if a signature status transition is valid
 */
export function isValidSignatureStatusTransition(from: SignatureStatus, to: SignatureStatus): boolean {
  return SIGNATURE_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Gets all valid next statuses for a given signature status
 */
export function getValidNextSignatureStatuses(currentStatus: SignatureStatus): SignatureStatus[] {
  return SIGNATURE_STATUS_TRANSITIONS[currentStatus];
}
