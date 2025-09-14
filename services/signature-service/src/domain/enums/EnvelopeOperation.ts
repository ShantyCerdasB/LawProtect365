/**
 * @fileoverview EnvelopeOperation enum - Defines all possible operations on envelopes
 * @summary Enumerates the business operations that can be performed on envelopes
 * @description The EnvelopeOperation enum defines all possible business operations
 * that can be performed on envelopes, used for validation and business rules.
 */

/**
 * Envelope operation enumeration
 * 
 * Defines all possible business operations that can be performed on envelopes.
 * These operations are used for validation and business rule enforcement.
 */
export enum EnvelopeOperation {
  /**
   * Create a new envelope
   * - Can only be performed when envelope is in DRAFT status
   */
  CREATE = 'CREATE',

  /**
   * Update an existing envelope
   * - Can only be performed when envelope is in DRAFT or DECLINED status
   */
  UPDATE = 'UPDATE',

  /**
   * Send envelope for signing
   * - Can only be performed when envelope is in DRAFT status
   */
  SEND = 'SEND',

  /**
   * Sign the envelope
   * - Can be performed when envelope is in SENT, IN_PROGRESS, or READY_FOR_SIGNATURE status
   */
  SIGN = 'SIGN',

  /**
   * Complete the envelope
   * - Can only be performed when envelope is in READY_FOR_SIGNATURE status
   */
  COMPLETE = 'COMPLETE',

  /**
   * Expire the envelope
   * - Can be performed from any status except COMPLETED
   */
  EXPIRE = 'EXPIRE',

  /**
   * Decline the envelope
   * - Can be performed from any status except COMPLETED
   */
  DECLINE = 'DECLINE',

  /**
   * Cancel the envelope
   * - Can be performed from any status except COMPLETED
   */
  CANCEL = 'CANCEL',

  /**
   * Add a signer to the envelope
   * - Can only be performed when envelope is in DRAFT status
   */
  ADD_SIGNER = 'ADD_SIGNER',

  /**
   * Remove a signer from the envelope
   * - Can only be performed when envelope is in DRAFT status
   */
  REMOVE_SIGNER = 'REMOVE_SIGNER'
}

/**
 * Valid operations for each envelope status
 */
export const ENVELOPE_OPERATION_PERMISSIONS: Record<string, EnvelopeOperation[]> = {
  [EnvelopeOperation.CREATE]: [EnvelopeOperation.CREATE],
  [EnvelopeOperation.UPDATE]: [EnvelopeOperation.UPDATE, EnvelopeOperation.ADD_SIGNER, EnvelopeOperation.REMOVE_SIGNER],
  [EnvelopeOperation.SEND]: [EnvelopeOperation.SEND],
  [EnvelopeOperation.SIGN]: [EnvelopeOperation.SIGN],
  [EnvelopeOperation.COMPLETE]: [EnvelopeOperation.COMPLETE],
  [EnvelopeOperation.EXPIRE]: [EnvelopeOperation.EXPIRE],
  [EnvelopeOperation.DECLINE]: [EnvelopeOperation.DECLINE],
  [EnvelopeOperation.CANCEL]: [EnvelopeOperation.CANCEL],
  [EnvelopeOperation.ADD_SIGNER]: [EnvelopeOperation.ADD_SIGNER],
  [EnvelopeOperation.REMOVE_SIGNER]: [EnvelopeOperation.REMOVE_SIGNER]
};

/**
 * Checks if an operation is valid for a given envelope status
 */
export function isValidEnvelopeOperation(status: string, operation: EnvelopeOperation): boolean {
  const validOperations = ENVELOPE_OPERATION_PERMISSIONS[status] || [];
  return validOperations.includes(operation);
}

/**
 * Gets all valid operations for a given envelope status
 */
export function getValidEnvelopeOperations(status: string): EnvelopeOperation[] {
  return ENVELOPE_OPERATION_PERMISSIONS[status] || [];
}

/**
 * Gets the display name for an envelope operation
 */
export function getEnvelopeOperationDisplayName(operation: EnvelopeOperation): string {
  switch (operation) {
    case EnvelopeOperation.CREATE:
      return 'Create Envelope';
    case EnvelopeOperation.UPDATE:
      return 'Update Envelope';
    case EnvelopeOperation.SEND:
      return 'Send for Signing';
    case EnvelopeOperation.SIGN:
      return 'Sign Document';
    case EnvelopeOperation.COMPLETE:
      return 'Complete Envelope';
    case EnvelopeOperation.EXPIRE:
      return 'Expire Envelope';
    case EnvelopeOperation.DECLINE:
      return 'Decline Envelope';
    case EnvelopeOperation.CANCEL:
      return 'Cancel Envelope';
    case EnvelopeOperation.ADD_SIGNER:
      return 'Add Signer';
    case EnvelopeOperation.REMOVE_SIGNER:
      return 'Remove Signer';
    default:
      return 'Unknown Operation';
  }
}
