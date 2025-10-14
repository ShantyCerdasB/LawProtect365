/**
 * @fileoverview UserAccessResult - Interface for user access evaluation results
 * @summary Defines the structure for user access evaluation results
 * @description This interface represents the result of user access validation,
 * including access decision, denial reasons, and error codes.
 */

import { AccessErrorCode } from '../enums/AccessErrorCode';

/**
 * User access evaluation result
 */
export interface UserAccessResult {
  /** Whether user can sign in */
  canSignIn: boolean;
  /** Reason for denial if applicable */
  denyReason?: string;
  /** Error code for denial */
  errorCode?: AccessErrorCode;
}
