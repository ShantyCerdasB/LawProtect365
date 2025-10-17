/**
 * @fileoverview User entity - Core domain entity representing a user
 * @summary Manages user lifecycle, authentication, and profile information
 * @description The User entity encapsulates all business logic related to user management,
 * including authentication state, profile information, and user lifecycle operations.
 */

import { Email } from '@lawprotect/shared-ts';
import { UserAccountStatus, UserRole } from '../enums';
import { UserId } from '../value-objects/UserId';
import { CognitoSub } from '../value-objects/CognitoSub';

/**
 * User entity representing a system user
 * 
 * Manages user authentication, profile information, and lifecycle state.
 * Serves as the aggregate root for user-related operations.
 */
export class User {
  constructor(
    private readonly id: UserId,
    private readonly cognitoSub: CognitoSub,
    private readonly email: Email,
    private firstName: string,            // ← from DB: givenName
    private lastName: string,             // ← from DB: lastName
    private status: UserAccountStatus,
    private readonly role: UserRole,      // SINGLE ROLE
    private mfaEnabled: boolean,
    private lastLoginAt: Date | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a User from persistence data
   * @param data - Prisma User data
   * @returns User instance
   */
  static fromPersistence(data: any): User {
    return new User(
      UserId.fromString(data.id),
      CognitoSub.fromString(data.cognitoSub),
      Email.fromString(data.email),
      data.givenName ?? '',              // ← from DB: givenName
      data.lastName ?? '',                // ← from DB: lastName
      data.status as UserAccountStatus,
      data.role as UserRole,              // SINGLE ROLE
      Boolean(data.mfaEnabled),
      data.lastLoginAt ?? undefined,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Gets the user unique identifier
   * @returns The user ID value object
   */
  getId(): UserId {
    return this.id;
  }

  /**
   * Gets the Cognito subject identifier
   * @returns The Cognito sub value object
   */
  getCognitoSub(): CognitoSub {
    return this.cognitoSub;
  }

  /**
   * Gets the user email
   * @returns The user email value object
   */
  getEmail(): Email {
    return this.email;
  }

  /**
   * Gets the user first name
   * @returns The user first name
   */
  getFirstName(): string {
    return this.firstName;
  }

  /**
   * Gets the user last name
   * @returns The user last name
   */
  getLastName(): string {
    return this.lastName;
  }

  /**
   * Gets the user full name
   * @returns The user full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Gets the current user status
   * @returns The current user status
   */
  getStatus(): UserAccountStatus {
    return this.status;
  }

  /**
   * Gets the user role
   * @returns The user role
   */
  getRole(): UserRole {
    return this.role;
  }

  /**
   * Gets the user roles (compatibility method)
   * @returns Array with single user role
   */
  getRoles(): UserRole[] {
    return [this.role];
  }

  /**
   * Checks if user has a specific role
   * @param role - Role to check
   * @returns True if user has the role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Checks if user has any of the specified roles
   * @param roles - Roles to check
   * @returns True if user has any of the roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  /**
   * Gets the MFA enabled status
   * @returns True if MFA is enabled
   */
  isMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  /**
   * Gets the last login timestamp
   * @returns The last login timestamp or undefined if never logged in
   */
  getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  /**
   * Gets the creation timestamp
   * @returns The creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   * @returns The last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Checks if user is active
   * @returns True if user status is ACTIVE
   */
  isActive(): boolean {
    return this.status === UserAccountStatus.ACTIVE;
  }

  /**
   * Checks if user is suspended
   * @returns True if user status is SUSPENDED
   */
  isSuspended(): boolean {
    return this.status === UserAccountStatus.SUSPENDED;
  }

  /**
   * Checks if user is deleted
   * @returns True if user status is DELETED
   */
  isDeleted(): boolean {
    return this.status === UserAccountStatus.DELETED;
  }

  /**
   * Checks if user is pending verification
   * @returns True if user status is PENDING_VERIFICATION
   */
  isPendingVerification(): boolean {
    return this.status === UserAccountStatus.PENDING_VERIFICATION;
  }

  /**
   * Updates user status
   * @param newStatus - New user status
   * @param reason - Reason for status change
   * @param suspendedUntil - Suspension end date (for SUSPENDED status)
   */
  updateStatus(newStatus: UserAccountStatus, reason?: string, suspendedUntil?: Date): void {
    this.status = newStatus;
    (this as any).updatedAt = new Date();
    
    if (reason) {
      (this as any).deactivationReason = reason;
    }
    
    if (suspendedUntil) {
      (this as any).suspendedUntil = suspendedUntil;
    }
    
    if (newStatus === UserAccountStatus.DELETED) {
      (this as any).deletedAt = new Date();
    }
  }

  /**
   * Updates user role
   * @param newRole - New user role
   */
  updateRole(newRole: UserRole): void {
    (this as any).role = newRole;
    (this as any).updatedAt = new Date();
  }

  /**
   * Updates last login timestamp
   */
  updateLastLogin(): void {
    (this as any).lastLoginAt = new Date();
    (this as any).updatedAt = new Date();
  }

  /**
   * Updates MFA enabled status
   * @param enabled - MFA enabled status
   */
  updateMfaEnabled(enabled: boolean): void {
    (this as any).mfaEnabled = enabled;
    (this as any).updatedAt = new Date();
  }

  /**
   * Updates user profile information
   * @param firstName - New first name
   * @param lastName - New last name
   */
  updateProfile(firstName: string, lastName: string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.updatedAt = new Date();
  }

  /**
   * Marks user as pending verification (KYC)
   */
  markPendingVerification(): void {
    this.status = UserAccountStatus.PENDING_VERIFICATION;
    this.updatedAt = new Date();
  }

  /**
   * Approves KYC verification
   */
  approveKyc(): void {
    this.status = UserAccountStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Rejects KYC verification
   */
  rejectKyc(): void {
    this.status = UserAccountStatus.INACTIVE;
    this.updatedAt = new Date();
  }
}
