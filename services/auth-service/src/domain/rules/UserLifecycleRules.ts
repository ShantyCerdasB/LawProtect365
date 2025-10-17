/**
 * @fileoverview UserLifecycleRules - Domain rules for user status transitions
 * @summary Business rules for valid user status transitions
 * @description Defines the matrix of valid status transitions and business rules
 */

import { UserAccountStatus, UserRole } from '../enums';
import { User } from '../entities/User';
import { invalidUserStateTransition } from '../../auth-errors/factories';

export class UserLifecycleRules {
  /**
   * Matrix of valid status transitions
   */
  private static readonly VALID_TRANSITIONS: Record<UserAccountStatus, UserAccountStatus[]> = {
    [UserAccountStatus.ACTIVE]: [
      UserAccountStatus.SUSPENDED,
      UserAccountStatus.INACTIVE,
      UserAccountStatus.DELETED
    ],
    [UserAccountStatus.SUSPENDED]: [
      UserAccountStatus.ACTIVE,
      UserAccountStatus.INACTIVE,
      UserAccountStatus.DELETED
    ],
    [UserAccountStatus.INACTIVE]: [
      UserAccountStatus.ACTIVE,
      UserAccountStatus.SUSPENDED,
      UserAccountStatus.DELETED
    ],
    [UserAccountStatus.PENDING_VERIFICATION]: [
      UserAccountStatus.ACTIVE,
      UserAccountStatus.DELETED
    ],
    [UserAccountStatus.DELETED]: [] // No transitions from DELETED
  };

  /**
   * Validates if a status transition is allowed
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns True if transition is valid
   */
  static isValidTransition(fromStatus: UserAccountStatus, toStatus: UserAccountStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[fromStatus];
    return validTransitions.includes(toStatus);
  }

  /**
   * Validates status transition and throws error if invalid
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @throws invalidUserStateTransition if transition is not allowed
   */
  static validateTransition(fromStatus: UserAccountStatus, toStatus: UserAccountStatus): void {
    if (!this.isValidTransition(fromStatus, toStatus)) {
      throw invalidUserStateTransition({
        fromStatus,
        toStatus,
        message: `Invalid transition from ${fromStatus} to ${toStatus}`
      });
    }
  }

  /**
   * Checks if PENDING_VERIFICATION is allowed for a role
   * @param role - User role
   * @returns True if PENDING_VERIFICATION is allowed
   */
  static isPendingVerificationAllowed(role: UserRole): boolean {
    return role === UserRole.LAWYER;
  }

  /**
   * Validates if a user can be set to PENDING_VERIFICATION
   * @param user - User entity
   * @param toStatus - Target status
   * @throws invalidUserStateTransition if not allowed
   */
  static validatePendingVerificationTransition(user: User, toStatus: UserAccountStatus): void {
    if (toStatus === UserAccountStatus.PENDING_VERIFICATION) {
      if (!this.isPendingVerificationAllowed(user.getRole())) {
        throw invalidUserStateTransition({
          role: user.getRole(),
          toStatus,
          message: 'PENDING_VERIFICATION is only allowed for LAWYER role'
        });
      }
    }
  }

  /**
   * Gets the effects required for a status change
   * @param toStatus - Target status
   * @returns Object with required Cognito actions
   */
  static getStatusEffects(toStatus: UserAccountStatus): {
    enableUser: boolean;
    disableUser: boolean;
    globalSignOut: boolean;
  } {
    switch (toStatus) {
      case UserAccountStatus.ACTIVE:
        return { enableUser: true, disableUser: false, globalSignOut: false };
      case UserAccountStatus.SUSPENDED:
        return { enableUser: false, disableUser: true, globalSignOut: true };
      case UserAccountStatus.INACTIVE:
        return { enableUser: false, disableUser: true, globalSignOut: true };
      case UserAccountStatus.DELETED:
        return { enableUser: false, disableUser: true, globalSignOut: true };
      case UserAccountStatus.PENDING_VERIFICATION:
        return { enableUser: false, disableUser: false, globalSignOut: false };
      default:
        return { enableUser: false, disableUser: false, globalSignOut: false };
    }
  }
}