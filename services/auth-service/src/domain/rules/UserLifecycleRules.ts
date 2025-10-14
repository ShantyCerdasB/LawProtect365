/**
 * @fileoverview UserLifecycleRules - Domain rules for user lifecycle management
 * @summary Validates user lifecycle business rules and state transitions
 * @description This domain rule encapsulates all business validation logic for user lifecycle,
 * ensuring proper state transitions and business rule compliance.
 */

import { UserAccountStatus } from '../enums/UserAccountStatus';
import { UserRole } from '../enums/UserRole';
import { 
  invalidUserStateTransition,
  userLifecycleViolation,
  insufficientPermissions
} from '../../auth-errors';

/**
 * UserLifecycleRules - Domain rule for user lifecycle validation
 * 
 * Encapsulates business validation logic for user lifecycle including:
 * - State transition validation
 * - Lifecycle compliance checking
 * - Business rule enforcement
 */
export class UserLifecycleRules {
  /**
   * Validates if a user status transition is allowed
   * @param currentStatus - Current user status
   * @param newStatus - New user status
   * @param actorRole - Role of the user making the change
   * @throws invalidUserStateTransition when transition is not allowed
   */
  static validateStatusTransition(
    currentStatus: UserAccountStatus,
    newStatus: UserAccountStatus,
    actorRole: UserRole
  ): void {
    // Define allowed transitions
    const allowedTransitions = {
      [UserAccountStatus.PENDING_VERIFICATION]: [
        UserAccountStatus.ACTIVE,
        UserAccountStatus.INACTIVE,
        UserAccountStatus.DELETED
      ],
      [UserAccountStatus.INACTIVE]: [
        UserAccountStatus.ACTIVE,
        UserAccountStatus.DELETED
      ],
      [UserAccountStatus.ACTIVE]: [
        UserAccountStatus.INACTIVE,
        UserAccountStatus.SUSPENDED,
        UserAccountStatus.DELETED
      ],
      [UserAccountStatus.SUSPENDED]: [
        UserAccountStatus.ACTIVE,
        UserAccountStatus.DELETED
      ],
      [UserAccountStatus.DELETED]: [] // No transitions from DELETED
    };

    const allowed = (allowedTransitions as Record<UserAccountStatus, UserAccountStatus[]>)[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw invalidUserStateTransition(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }

    // Validate actor permissions
    UserLifecycleRules.validateActorPermissions(currentStatus, newStatus, actorRole);
  }

  /**
   * Validates actor permissions for status changes
   * @param currentStatus - Current user status
   * @param newStatus - New user status
   * @param actorRole - Role of the user making the change
   * @throws insufficientPermissions when actor lacks permission
   */
  private static validateActorPermissions(
    _currentStatus: UserAccountStatus, // Currently not used but kept for future extensibility
    newStatus: UserAccountStatus,
    actorRole: UserRole
  ): void {
    // Only ADMIN and SUPER_ADMIN can change user status
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actorRole)) {
      throw insufficientPermissions(
        'Only ADMIN and SUPER_ADMIN can change user status'
      );
    }

    // Only SUPER_ADMIN can delete users
    if (newStatus === UserAccountStatus.DELETED && actorRole !== UserRole.SUPER_ADMIN) {
      throw insufficientPermissions(
        'Only SUPER_ADMIN can delete users'
      );
    }
  }

  /**
   * Validates user creation requirements
   * @param email - User email
   * @param firstName - User first name
   * @param lastName - User last name
   * @param initialRole - Initial user role
   * @throws userLifecycleViolation when creation requirements are not met
   */
  static validateUserCreation(
    email: string,
    firstName: string,
    lastName: string,
    initialRole: UserRole
  ): void {
    if (!email || email.trim().length === 0) {
      throw userLifecycleViolation('Email is required for user creation');
    }

    if (!firstName || firstName.trim().length === 0) {
      throw userLifecycleViolation('First name is required for user creation');
    }

    if (!lastName || lastName.trim().length === 0) {
      throw userLifecycleViolation('Last name is required for user creation');
    }

    if (!initialRole) {
      throw userLifecycleViolation('Initial role is required for user creation');
    }
  }

  /**
   * Validates user deletion requirements
   * @param userStatus - Current user status
   * @param userRoles - Current user roles
   * @param actorRole - Role of the user making the deletion
   * @throws userLifecycleViolation when deletion is not allowed
   */
  static validateUserDeletion(
    userStatus: UserAccountStatus,
    userRoles: UserRole[],
    actorRole: UserRole
  ): void {
    // Cannot delete already deleted users
    if (userStatus === UserAccountStatus.DELETED) {
      throw userLifecycleViolation('User is already deleted');
    }

    // Only SUPER_ADMIN can delete users
    if (actorRole !== UserRole.SUPER_ADMIN) {
      throw insufficientPermissions('Only SUPER_ADMIN can delete users');
    }

    // Cannot delete SUPER_ADMIN users
    if (userRoles.includes(UserRole.SUPER_ADMIN)) {
      throw userLifecycleViolation('Cannot delete SUPER_ADMIN users');
    }
  }

  /**
   * Validates user suspension requirements
   * @param userStatus - Current user status
   * @param userRoles - Current user roles
   * @param actorRole - Role of the user making the suspension
   * @throws userLifecycleViolation when suspension is not allowed
   */
  static validateUserSuspension(
    userStatus: UserAccountStatus,
    userRoles: UserRole[],
    actorRole: UserRole
  ): void {
    // Cannot suspend already suspended users
    if (userStatus === UserAccountStatus.SUSPENDED) {
      throw userLifecycleViolation('User is already suspended');
    }

    // Cannot suspend deleted users
    if (userStatus === UserAccountStatus.DELETED) {
      throw userLifecycleViolation('Cannot suspend deleted users');
    }

    // Only ADMIN and SUPER_ADMIN can suspend users
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actorRole)) {
      throw insufficientPermissions('Only ADMIN and SUPER_ADMIN can suspend users');
    }

    // Cannot suspend SUPER_ADMIN users
    if (userRoles.includes(UserRole.SUPER_ADMIN)) {
      throw userLifecycleViolation('Cannot suspend SUPER_ADMIN users');
    }
  }

  /**
   * Gets the initial status for a new user
   * @param requiresVerification - Whether email verification is required
   * @returns Initial user status
   */
  static getInitialUserStatus(requiresVerification: boolean = true): UserAccountStatus {
    return requiresVerification 
      ? UserAccountStatus.PENDING_VERIFICATION 
      : UserAccountStatus.ACTIVE;
  }

  /**
   * Checks if a user can be activated
   * @param currentStatus - Current user status
   * @returns True if user can be activated
   */
  static canActivateUser(currentStatus: UserAccountStatus): boolean {
    return currentStatus === UserAccountStatus.PENDING_VERIFICATION;
  }

  /**
   * Checks if a user can be suspended
   * @param currentStatus - Current user status
   * @returns True if user can be suspended
   */
  static canSuspendUser(currentStatus: UserAccountStatus): boolean {
    return currentStatus === UserAccountStatus.ACTIVE;
  }

  /**
   * Checks if a user can be deleted
   * @param currentStatus - Current user status
   * @returns True if user can be deleted
   */
  static canDeleteUser(currentStatus: UserAccountStatus): boolean {
    return currentStatus !== UserAccountStatus.DELETED;
  }
}
