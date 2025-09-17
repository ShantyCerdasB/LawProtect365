/**
 * @fileoverview SignerOperation enum - Defines all possible operations on signers
 * @summary Enumerates the business operations that can be performed on signers
 * @description The SignerOperation enum defines all possible business operations
 * that can be performed on signers, used for validation and business rules.
 */

/**
 * Signer operation enumeration
 * 
 * Defines all possible business operations that can be performed on signers.
 * These operations are used for validation and business rule enforcement.
 */
export enum SignerOperation {
  /**
   * Create a new signer
   * - Can only be performed when envelope is in DRAFT status
   */
  CREATE = 'CREATE',

  /**
   * Update an existing signer
   * - Can only be performed when envelope is in DRAFT status
   */
  UPDATE = 'UPDATE',

  /**
   * Remove a signer from the envelope
   * - Can only be performed when envelope is in DRAFT status
   */
  REMOVE = 'REMOVE',

  /**
   * Invite a signer to sign
   * - Can be performed when envelope is in SENT status
   */
  INVITE = 'INVITE',

  /**
   * Give consent to sign
   * - Can be performed when signer has been invited
   */
  CONSENT = 'CONSENT',

  /**
   * Sign the document
   * - Can be performed when signer has given consent
   */
  SIGN = 'SIGN',

  /**
   * Decline to sign
   * - Can be performed when signer has been invited
   */
  DECLINE = 'DECLINE'
}

/**
 * Signer workflow operation types
 * 
 * Extends basic SignerOperation with workflow-specific operations
 */
export enum SignerWorkflowOperation {
  INVITE = 'INVITE',
  CONSENT = 'CONSENT',
  SIGN = 'SIGN',
  DECLINE = 'DECLINE'
}

/**
 * Valid operations for each signer status
 */
export const SIGNER_OPERATION_PERMISSIONS: Record<string, SignerOperation[]> = {
  [SignerOperation.CREATE]: [SignerOperation.CREATE],
  [SignerOperation.UPDATE]: [SignerOperation.UPDATE, SignerOperation.REMOVE],
  [SignerOperation.REMOVE]: [SignerOperation.REMOVE],
  [SignerOperation.INVITE]: [SignerOperation.INVITE],
  [SignerOperation.CONSENT]: [SignerOperation.CONSENT],
  [SignerOperation.SIGN]: [SignerOperation.SIGN],
  [SignerOperation.DECLINE]: [SignerOperation.DECLINE]
};

/**
 * Checks if an operation is valid for a given signer status
 */
export function isValidSignerOperation(status: string, operation: SignerOperation): boolean {
  const validOperations = SIGNER_OPERATION_PERMISSIONS[status] || [];
  return validOperations.includes(operation);
}

/**
 * Gets all valid operations for a given signer status
 */
export function getValidSignerOperations(status: string): SignerOperation[] {
  return SIGNER_OPERATION_PERMISSIONS[status] || [];
}

/**
 * Gets the display name for a signer operation
 */
export function getSignerOperationDisplayName(operation: SignerOperation): string {
  switch (operation) {
    case SignerOperation.CREATE:
      return 'Create Signer';
    case SignerOperation.UPDATE:
      return 'Update Signer';
    case SignerOperation.REMOVE:
      return 'Remove Signer';
    case SignerOperation.INVITE:
      return 'Invite Signer';
    case SignerOperation.CONSENT:
      return 'Give Consent';
    case SignerOperation.SIGN:
      return 'Sign Document';
    case SignerOperation.DECLINE:
      return 'Decline to Sign';
    default:
      return 'Unknown Operation';
  }
}
