/**
 * @fileoverview UserAccessRules - Domain rules for user access control
 * @summary Validates user account status for authentication access
 * @description This domain rule encapsulates all business validation logic for user access,
 * ensuring proper account status validation and access control policies.
 */

import { UserAccountStatus } from '../enums/UserAccountStatus';
import { AccessErrorCode } from '../enums/AccessErrorCode';
import { UserAccessResult } from '../interfaces';
import { 
  accountSuspended, 
  accountDeleted, 
  userLifecycleViolation 
} from '../../auth-errors';

/**
 * UserAccessRules - Domain rule for user access validation
 * 
 * Encapsulates business validation logic for user access including:
 * - Account status validation
 * - Access control policies
 * - Business rule enforcement
 */
export class UserAccessRules {
  /**
   * Evaluates if a user can sign in based on account status
   * @param status - User account status
   * @param allowPendingVerification - Whether to allow PENDING_VERIFICATION status
   * @returns User access evaluation result
   */
  static canSignIn(
    status: UserAccountStatus, 
    allowPendingVerification: boolean = true
  ): UserAccessResult {
    switch (status) {
      case UserAccountStatus.ACTIVE:
        return { canSignIn: true };
        
      case UserAccountStatus.PENDING_VERIFICATION:
        return {
          canSignIn: allowPendingVerification,
          denyReason: allowPendingVerification ? undefined : 'Account pending verification',
          errorCode: allowPendingVerification ? undefined : AccessErrorCode.PENDING_VERIFICATION_BLOCKED
        };
        
      case UserAccountStatus.INACTIVE:
        return {
          canSignIn: false,
          denyReason: 'Account is inactive',
          errorCode: AccessErrorCode.ACCOUNT_INACTIVE
        };
        
      case UserAccountStatus.SUSPENDED:
        return {
          canSignIn: false,
          denyReason: 'Account is suspended',
          errorCode: AccessErrorCode.ACCOUNT_SUSPENDED
        };
        
      case UserAccountStatus.DELETED:
        return {
          canSignIn: false,
          denyReason: 'Account is deleted',
          errorCode: AccessErrorCode.ACCOUNT_DELETED
        };
        
      default:
        return {
          canSignIn: false,
          denyReason: 'Unknown account status',
          errorCode: AccessErrorCode.UNKNOWN_STATUS
        };
    }
  }

  /**
   * Validates user access and throws error if denied
   * @param status - User account status
   * @param allowPendingVerification - Whether to allow PENDING_VERIFICATION status
   * @throws Appropriate error when access is denied
   */
  static validateUserAccess(
    status: UserAccountStatus, 
    allowPendingVerification: boolean = true
  ): void {
    const result = this.canSignIn(status, allowPendingVerification);
    
    if (!result.canSignIn) {
      switch (result.errorCode) {
        case AccessErrorCode.ACCOUNT_SUSPENDED:
          throw accountSuspended({
            status,
            reason: result.denyReason
          });
          
        case AccessErrorCode.ACCOUNT_DELETED:
          throw accountDeleted({
            status,
            reason: result.denyReason
          });
          
        case AccessErrorCode.PENDING_VERIFICATION_BLOCKED:
        case AccessErrorCode.ACCOUNT_INACTIVE:
        case AccessErrorCode.UNKNOWN_STATUS:
        default:
          throw userLifecycleViolation({
            status,
            reason: result.denyReason,
            errorCode: result.errorCode
          });
      }
    }
  }

  /**
   * Gets human-readable status description
   * @param status - User account status
   * @returns Human-readable description
   */
  static getStatusDescription(status: UserAccountStatus): string {
    switch (status) {
      case UserAccountStatus.ACTIVE:
        return 'Account is active and can sign in';
        
      case UserAccountStatus.PENDING_VERIFICATION:
        return 'Account is pending verification';
        
      case UserAccountStatus.INACTIVE:
        return 'Account is inactive and cannot sign in';
        
      case UserAccountStatus.SUSPENDED:
        return 'Account is suspended and cannot sign in';
        
      case UserAccountStatus.DELETED:
        return 'Account is deleted and cannot sign in';
        
      default:
        return 'Unknown account status';
    }
  }

  /**
   * Gets access control policy description
   * @param allowPendingVerification - Whether PENDING_VERIFICATION is allowed
   * @returns Policy description
   */
  static getAccessPolicyDescription(allowPendingVerification: boolean): string {
    const allowedStatuses = [
      UserAccountStatus.ACTIVE
    ];
    
    if (allowPendingVerification) {
      allowedStatuses.push(UserAccountStatus.PENDING_VERIFICATION);
    }
    
    const deniedStatuses = [
      UserAccountStatus.INACTIVE,
      UserAccountStatus.SUSPENDED,
      UserAccountStatus.DELETED
    ];
    
    return `Access Policy: ALLOW [${allowedStatuses.join(', ')}], DENY [${deniedStatuses.join(', ')}]`;
  }

  /**
   * Checks if a status transition is allowed for authentication
   * @param currentStatus - Current account status
   * @param targetStatus - Target account status
   * @returns True if transition is allowed
   */
  static isStatusTransitionAllowed(
    currentStatus: UserAccountStatus, 
    targetStatus: UserAccountStatus
  ): boolean {
    // Define allowed transitions for authentication context
    const allowedTransitions: Record<UserAccountStatus, UserAccountStatus[]> = {
      [UserAccountStatus.PENDING_VERIFICATION]: [UserAccountStatus.ACTIVE],
      [UserAccountStatus.ACTIVE]: [UserAccountStatus.INACTIVE, UserAccountStatus.SUSPENDED],
      [UserAccountStatus.INACTIVE]: [UserAccountStatus.ACTIVE],
      [UserAccountStatus.SUSPENDED]: [UserAccountStatus.ACTIVE],
      [UserAccountStatus.DELETED]: [] // No transitions from DELETED
    };
    
    const allowed = allowedTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Gets blocked statuses for authentication
   * @returns Array of statuses that block authentication
   */
  static getBlockedStatuses(): UserAccountStatus[] {
    const blocked: UserAccountStatus[] = [
      UserAccountStatus.INACTIVE,
      UserAccountStatus.SUSPENDED,
      UserAccountStatus.DELETED
    ];
    return blocked;
  }

  /**
   * Gets allowed statuses for authentication
   * @param allowPendingVerification - Whether to include PENDING_VERIFICATION
   * @returns Array of statuses that allow authentication
   */
  static getAllowedStatuses(allowPendingVerification: boolean = true): UserAccountStatus[] {
    const allowed: UserAccountStatus[] = [UserAccountStatus.ACTIVE];
    
    if (allowPendingVerification) {
      allowed.push(UserAccountStatus.PENDING_VERIFICATION);
    }
    
    return allowed;
  }
}
