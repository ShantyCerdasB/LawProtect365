/**
 * @fileoverview SignatureOperation enum - Defines signature operation types
 * @summary Enumerates signature operation types for business and compliance rules
 * @description The SignatureOperation enum defines all possible operations
 * that can be performed on signatures in the signature service.
 */

/**
 * Signature operation enumeration
 * 
 * Defines all possible operations that can be performed on signatures.
 * Used for business and compliance rule validation.
 */
export enum SignatureOperation {
  /**
   * Create signature
   * - Create a new signature
   * - Validate creation requirements and constraints
   */
  CREATE = 'CREATE',

  /**
   * Validate signature
   * - Validate signature integrity and compliance
   * - Check signature format and requirements
   */
  VALIDATE = 'VALIDATE',

  /**
   * Update signature
   * - Update signature status or metadata
   * - Validate update permissions and constraints
   */
  UPDATE = 'UPDATE',

  /**
   * Retrieve signature
   * - Retrieve signature data
   * - Validate access permissions
   */
  RETRIEVE = 'RETRIEVE',

  /**
   * Verify signature
   * - Verify signature authenticity and integrity
   * - Validate cryptographic properties
   */
  VERIFY = 'VERIFY'
}
