/**
 * @fileoverview MfaPolicyResult - Interface for MFA policy evaluation results
 * @summary Defines the structure for MFA policy evaluation results
 * @description This interface represents the result of MFA policy evaluation,
 * including requirement status, satisfaction status, and final decision.
 */

import { MfaDecision, MfaReason } from '../enums';

/**
 * MFA policy evaluation result
 */
export interface MfaPolicyResult {
  /** Whether MFA is required for this user */
  required: boolean;
  /** Whether MFA is satisfied (user has MFA enabled) */
  satisfied: boolean;
  /** Final decision: ALLOW or DENY */
  decision: MfaDecision;
  /** Reason for denial if applicable */
  reason?: MfaReason;
}
