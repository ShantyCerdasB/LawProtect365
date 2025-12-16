/**
 * @fileoverview Documents Hooks Interfaces - Interfaces for documents hooks
 * @summary Type definitions for documents hook return types and parameters
 * @description
 * Defines interfaces for documents-related hooks to keep hook files clean
 * and improve code organization.
 */

/**
 * @description Result of email check.
 */
export interface EmailCheckResult {
  /**
   * @description Whether the email belongs to a registered user.
   */
  exists: boolean;
  /**
   * @description User ID if user exists.
   */
  userId?: string;
}

