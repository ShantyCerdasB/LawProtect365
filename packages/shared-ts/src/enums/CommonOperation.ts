/**
 * @fileoverview CommonOperation enum - Defines common operations across microservices
 * @summary Enumerates common operations that are used across multiple microservices
 * @description The CommonOperation enum defines common operations that are shared
 * across multiple microservices for consistency and reusability.
 */

/**
 * Common operation enumeration
 * 
 * Defines common operations that are used across multiple microservices.
 * These operations represent basic CRUD and business operations that are
 * commonly needed in various contexts.
 */
export enum CommonOperation {
  /**
   * Create a new entity
   * - Used for creating new records, documents, or resources
   */
  CREATE = 'CREATE',

  /**
   * Read/Retrieve an entity
   * - Used for fetching, viewing, or accessing existing data
   */
  READ = 'READ',

  /**
   * Update an existing entity
   * - Used for modifying existing records or data
   */
  UPDATE = 'UPDATE',

  /**
   * Delete an entity
   * - Used for removing records or data
   */
  DELETE = 'DELETE',

  /**
   * Validate an entity
   * - Used for validation, verification, or compliance checks
   */
  VALIDATE = 'VALIDATE',

  /**
   * Sign an entity
   * - Used for digital signatures, approvals, or confirmations
   */
  SIGN = 'SIGN',

  /**
   * Verify an entity
   * - Used for verification, authentication, or integrity checks
   */
  VERIFY = 'VERIFY',

  /**
   * Access an entity
   * - Used for access control, permissions, or authorization
   */
  ACCESS = 'ACCESS',

  /**
   * Download an entity
   * - Used for downloading files, documents, or data
   */
  DOWNLOAD = 'DOWNLOAD',

  /**
   * Audit an entity
   * - Used for audit trails, logging, or compliance reporting
   */
  AUDIT = 'AUDIT',

  /**
   * Report on an entity
   * - Used for generating reports, analytics, or summaries
   */
  REPORT = 'REPORT',

  /**
   * Retain an entity
   * - Used for retention policies, archiving, or data lifecycle
   */
  RETAIN = 'RETAIN'
}

/**
 * Security-related operations
 */
export enum SecurityOperation {
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
  ACCESS = 'ACCESS',
  DOWNLOAD = 'DOWNLOAD',
  AUDIT = 'AUDIT'
}

/**
 * Compliance-related operations
 */
export enum ComplianceOperation {
  VALIDATE = 'VALIDATE',
  AUDIT = 'AUDIT',
  RETAIN = 'RETAIN',
  ACCESS = 'ACCESS',
  REPORT = 'REPORT'
}

/**
 * Workflow-related operations
 */
export enum WorkflowOperation {
  INVITE = 'INVITE',
  CONSENT = 'CONSENT',
  SIGN = 'SIGN',
  DECLINE = 'DECLINE'
}
