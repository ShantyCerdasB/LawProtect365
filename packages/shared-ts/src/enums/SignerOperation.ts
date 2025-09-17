/**
 * @fileoverview SignerOperation enum - Defines signer operation types
 * @summary Enumerates signer operation types for business validation
 * @description The SignerOperation enum defines all possible operations
 * that can be performed on a signer in the signature service.
 */

/**
 * Signer operation enumeration
 * 
 * Defines all possible operations that can be performed on a signer.
 * Used for business validation and workflow management.
 */
export enum SignerOperation {
  /**
   * Add signer to envelope
   * - Add a new signer to an envelope
   * - Validate email uniqueness and limits
   */
  ADD = 'ADD',

  /**
   * Remove signer from envelope
   * - Remove an existing signer from an envelope
   * - Validate signer can be removed (not signed/declined)
   */
  REMOVE = 'REMOVE',

  /**
   * Sign document
   * - Signer signs the document
   * - Validate signer can sign (has consent, not already signed)
   */
  SIGN = 'SIGN',

  /**
   * Decline to sign
   * - Signer declines to sign the document
   * - Validate signer can decline (not already signed/declined)
   */
  DECLINE = 'DECLINE'
}

/**
 * Valid signer operations for different signer statuses
 */
export const VALID_SIGNER_OPERATIONS: Record<string, SignerOperation[]> = {
  'PENDING': [SignerOperation.SIGN, SignerOperation.DECLINE, SignerOperation.REMOVE],
  'SIGNED': [],
  'DECLINED': []
};

/**
 * Checks if an operation is valid for a signer status
 * @param status - The current signer status
 * @param operation - The operation to validate
 * @returns True if the operation is valid for the status
 */
export function isValidSignerOperation(status: string, operation: SignerOperation): boolean {
  const validOperations = VALID_SIGNER_OPERATIONS[status] || [];
  return validOperations.includes(operation);
}
