/**
 * @fileoverview UserService - Core user business logic service
 * @summary Orchestrates user lifecycle and profile management
 * @description Handles user creation, updates, OAuth linking, and business rules
 * for the PostAuthentication trigger and general user management.
 */

import { UserRepository } from '../repositories/UserRepository';
import { OAuthAccountRepository } from '../repositories/OAuthAccountRepository';
import { UserPersonalInfoRepository } from '../repositories/UserPersonalInfoRepository';
import { UserRole, UserAccountStatus } from '../domain/enums';
import { User } from '../domain/entities/User';
import { UserId } from '../domain/value-objects/UserId';
import { Email } from '@lawprotect/shared-ts';
import { userCreationFailed, userUpdateFailed, userNotFound } from '../auth-errors/factories';
import { UserLifecycleRules } from '../domain/rules/UserLifecycleRules';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { UpsertOnPostAuthInput, UpsertOnPostAuthResult } from '../types/UserServiceTypes';
import { UserPersonalInfo } from '../domain/entities/UserPersonalInfo';
import { PatchMeRequest, PatchMeResponse } from '../domain/schemas/PatchMeSchema';
import { uuid } from '@lawprotect/shared-ts';

/**
 * Service for user business logic orchestration
 * 
 * Handles user lifecycle, OAuth linking, and business rules.
 */
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly userPersonalInfoRepository: UserPersonalInfoRepository
  ) {}

  /**
   * Upserts user on PostAuthentication trigger
   * @param input - User data from Cognito
   * @returns Upsert result with user, creation status, and MFA change status
   */
  async upsertOnPostAuth(input: UpsertOnPostAuthInput): Promise<UpsertOnPostAuthResult> {
    const existing = await this.userRepository.findByCognitoSub(input.cognitoSub);

    if (!existing) {
      // Create new user
      const role = input.intendedRole ?? UserRole.UNASSIGNED;
      const status = this.determineUserStatus(role);

      // Create User entity using fromPersistence
      const userData = {
        id: UserId.generate(),
        cognitoSub: input.cognitoSub,
        email: input.email ? Email.fromString(input.email) : undefined,
        givenName: input.givenName,
        lastName: input.familyName,
        role,
        status,
        mfaEnabled: input.mfaEnabled,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = User.fromPersistence(userData);
      const createdUser = await this.userRepository.create(user).catch(err => { 
        throw userCreationFailed({ cause: err.message }); 
      });

      return { user: createdUser, created: true, mfaChanged: false };
    }

    // Update existing user
    const mfaChanged = existing.isMfaEnabled() !== input.mfaEnabled;

    // Update user properties
    existing.updateProfile(
      input.givenName ?? existing.getFirstName(),
      input.familyName ?? existing.getLastName()
    );
    
    // Update MFA and last login separately
    existing.updateMfaEnabled(input.mfaEnabled);
    existing.updateLastLogin();

    const updated = await this.userRepository.update(existing.getId(), existing).catch(err => { 
      throw userUpdateFailed({ cause: err.message }); 
    });

    return { user: updated, created: false, mfaChanged };
  }

  /**
   * Links OAuth provider identities to user
   * @param userId - User ID to link identities to
   * @param identities - Array of provider identities
   */
  async linkProviderIdentities(
    userId: string, 
    identities: Array<{ provider: OAuthProvider; providerAccountId: string }>
  ): Promise<void> {
    if (!identities?.length) return;

    await Promise.all(
      identities.map(identity =>
        this.oauthAccountRepository.upsert(
          userId,
          identity.provider,
          identity.providerAccountId
        )
      )
    );
  }

  /**
   * Finds user by Cognito sub for PreAuthentication validation
   * @param cognitoSub - Cognito user sub
   * @returns User entity or null if not found
   */
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    return await this.userRepository.findByCognitoSub(cognitoSub);
  }

  /**
   * Registers user on PostConfirmation trigger
   * @param input - User registration input
   * @returns Registration result with user and creation status
   */
  async registerOnConfirmation(input: {
    cognitoSub: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    phoneNumber?: string;
    locale?: string;
    role: UserRole;
    status: UserAccountStatus;
  }): Promise<{ user: User; created: boolean }> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByCognitoSub(input.cognitoSub);
      
      if (existingUser) {
        // User exists, update if needed (idempotent)
        const updatedUser = await this.updateExistingUser(existingUser, input);
        return { user: updatedUser, created: false };
      }
      
      // Create new user
      const newUser = await this.createNewUser(input);
      return { user: newUser, created: true };
      
    } catch (error) {
      throw userCreationFailed({
        cause: `Failed to register user on confirmation: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Updates existing user if needed
   * @param existingUser - Existing user entity
   * @param input - Update input
   * @returns Updated user entity
   */
  private async updateExistingUser(
    existingUser: User,
    input: {
      email?: string;
      givenName?: string;
      familyName?: string;
      phoneNumber?: string;
      locale?: string;
    }
  ): Promise<User> {
    // Only update soft fields, don't change role/status if already set
    const updates: Record<string, unknown> = {};
    
    if (input.email && input.email !== existingUser.getEmail()?.toString()) {
      // Update email if different and allowed
      updates.email = input.email;
    }
    
    if (input.givenName && input.givenName !== existingUser.getFirstName()) {
      updates.givenName = input.givenName;
    }
    
    if (input.familyName && input.familyName !== existingUser.getLastName()) {
      updates.lastName = input.familyName;
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      return await this.userRepository.update(existingUser.getId(), updates);
    }
    
    return existingUser;
  }

  /**
   * Creates new user
   * @param input - User creation input
   * @returns Created user entity
   */
  private async createNewUser(input: {
    cognitoSub: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    phoneNumber?: string;
    locale?: string;
    role: UserRole;
    status: UserAccountStatus;
  }): Promise<User> {
    const userData = {
      cognitoSub: input.cognitoSub,
      email: input.email ? new Email(input.email) : undefined,
      givenName: input.givenName || '',
      lastName: input.familyName || '',
      role: input.role,
      status: input.status,
      mfaEnabled: false,
      lastLoginAt: undefined
    };
    
    const user = User.fromPersistence(userData);
    return await this.userRepository.create(user);
  }

  /**
   * Determines user status based on role
   * @param role - User role
   * @returns Appropriate user status
   */
  private determineUserStatus(role: UserRole): UserAccountStatus {
    switch (role) {
      case UserRole.UNASSIGNED:
        return UserAccountStatus.ACTIVE;
      case UserRole.LAWYER:
        return UserAccountStatus.PENDING_VERIFICATION;
      default:
        return UserAccountStatus.ACTIVE;
    }
  }

  /**
   * Gets user personal information
   * @param userId - The user ID
   * @returns UserPersonalInfo or null
   */
  async getPersonalInfo(userId: UserId): Promise<any | null> {
    return await this.userPersonalInfoRepository.findByUserId(userId);
  }

  /**
   * Updates user personal information
   * @param userId - The user ID
   * @param personalInfo - Personal info updates
   * @returns Updated UserPersonalInfo
   */
  async updatePersonalInfo(userId: UserId, personalInfo: {
    phone?: string | null;
    locale?: string | null;
    timeZone?: string | null;
  }): Promise<any> {
    const existing = await this.userPersonalInfoRepository.findByUserId(userId);
    
    if (existing) {
      const updated = existing.update(personalInfo);
      return await this.userPersonalInfoRepository.update(updated.getId(), updated);
    } else {
      // Create new personal info
      const newPersonalInfo = new UserPersonalInfo(
        this.generateId(),
        userId,
        personalInfo.phone || null,
        personalInfo.locale || null,
        personalInfo.timeZone || null,
        new Date(),
        new Date()
      );
      return await this.userPersonalInfoRepository.create(newPersonalInfo);
    }
  }

  /**
   * Changes user status with business rules validation
   * @param userId - User ID to change status for
   * @param newStatus - New status
   * @param reason - Reason for status change
   * @param suspendedUntil - Suspension end date (for SUSPENDED status)
   * @param _actorId - ID of the admin making the change
   * @returns Updated user entity
   */
  async changeUserStatus(
    userId: UserId,
    newStatus: UserAccountStatus,
    _actorId: UserId,
    reason?: string,
    suspendedUntil?: Date
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw userNotFound({ userId: userId.toString() });
    }

    // Validate status transition
    UserLifecycleRules.validateTransition(user.getStatus(), newStatus);
    UserLifecycleRules.validatePendingVerificationTransition(user, newStatus);

    // Update user with additional fields
    user.updateStatus(newStatus, reason, suspendedUntil);
    return await this.userRepository.update(userId, user);
  }

  /**
   * Changes user role
   * @param userId - User ID to change role for
   * @param newRole - New role to assign
   * @returns Updated user entity
   * @throws userNotFound if user doesn't exist
   * @throws userUpdateFailed if update fails
   */
  async changeUserRole(
    userId: UserId,
    newRole: UserRole
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw userNotFound({ userId: userId.toString() });
    }

    // Update user role
    user.updateRole(newRole);
    
    // Update timestamp
    (user as any).updatedAt = new Date();

    return await this.userRepository.update(userId, user);
  }

  /**
   * Updates user profile information
   * @param userId - User ID
   * @param request - Profile update request
   * @returns Updated user profile response
   * @throws userNotFound if user doesn't exist
   * @throws userUpdateFailed if update fails
   */
  async updateUserProfile(
    userId: UserId,
    request: PatchMeRequest
  ): Promise<PatchMeResponse> {
    try {
      const user = await this.validateUserExists(userId);
      const currentPersonalInfo = await this.userPersonalInfoRepository.findByUserId(userId);
      
      const changes = this.detectChanges(user, currentPersonalInfo, request);
      
      if (!changes.hasChanges) {
        return this.buildProfileResponse(user, currentPersonalInfo, false);
      }

      const { updatedUser, updatedPersonalInfo } = await this.applyChanges(userId, user, changes);
      
      return this.buildProfileResponse(updatedUser, updatedPersonalInfo, true);
    } catch (error) {
      throw userUpdateFailed({
        userId: userId.toString(),
        operation: 'updateUserProfile',
        cause: error
      });
    }
  }

  /**
   * Validates that user exists and is not deleted
   * @param userId - User ID to validate
   * @returns User entity
   * @throws userNotFound if user doesn't exist or is deleted
   */
  private async validateUserExists(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw userNotFound({ userId: userId.toString() });
    }
    if (user.getStatus() === UserAccountStatus.DELETED) {
      throw userNotFound({ userId: userId.toString() });
    }
    return user;
  }

  /**
   * Detects what fields have actually changed
   * @param user - Current user entity
   * @param currentPersonalInfo - Current personal info entity
   * @param request - Update request
   * @returns Changes object with user and personal info changes
   */
  private detectChanges(
    user: User,
    currentPersonalInfo: UserPersonalInfo | null,
    request: PatchMeRequest
  ): {
    hasChanges: boolean;
    userChanges: any;
    personalInfoChanges: any;
  } {
    const userChanges = this.detectUserChanges(user, request);
    const personalInfoChanges = this.detectPersonalInfoChanges(currentPersonalInfo, request);
    
    return {
      hasChanges: Object.keys(userChanges).length > 0 || Object.keys(personalInfoChanges).length > 0,
      userChanges,
      personalInfoChanges
    };
  }

  /**
   * Detects changes in user fields
   * @param user - Current user entity
   * @param request - Update request
   * @returns User field changes
   */
  private detectUserChanges(user: User, request: PatchMeRequest): any {
    const changes: any = {};
    
    if (request.name !== undefined && request.name !== user.getFullName()) {
      changes.name = request.name;
    }
    if (request.givenName !== undefined && request.givenName !== user.getFirstName()) {
      changes.givenName = request.givenName;
    }
    if (request.lastName !== undefined && request.lastName !== user.getLastName()) {
      changes.lastName = request.lastName;
    }
    
    return changes;
  }

  /**
   * Detects changes in personal info fields
   * @param currentPersonalInfo - Current personal info entity
   * @param request - Update request
   * @returns Personal info field changes
   */
  private detectPersonalInfoChanges(
    currentPersonalInfo: UserPersonalInfo | null,
    request: PatchMeRequest
  ): any {
    if (!request.personalInfo) return {};
    
    const changes: any = {};
    
    if (request.personalInfo.phone !== undefined) {
      const currentPhone = currentPersonalInfo?.getPhone() || null;
      if (request.personalInfo.phone !== currentPhone) {
        changes.phone = request.personalInfo.phone;
      }
    }
    
    if (request.personalInfo.locale !== undefined) {
      const currentLocale = currentPersonalInfo?.getLocale() || null;
      if (request.personalInfo.locale !== currentLocale) {
        changes.locale = request.personalInfo.locale;
      }
    }
    
    if (request.personalInfo.timeZone !== undefined) {
      const currentTimeZone = currentPersonalInfo?.getTimeZone() || null;
      if (request.personalInfo.timeZone !== currentTimeZone) {
        changes.timeZone = request.personalInfo.timeZone;
      }
    }
    
    return changes;
  }

  /**
   * Applies changes to user and personal info
   * @param userId - User ID
   * @param user - Current user entity
   * @param changes - Changes to apply
   * @returns Updated user and personal info entities
   */
  private async applyChanges(
    userId: UserId,
    user: User,
    changes: {
      hasChanges: boolean;
      userChanges: any;
      personalInfoChanges: any;
    }
  ): Promise<{
    updatedUser: User;
    updatedPersonalInfo: UserPersonalInfo | null;
  }> {
    let updatedUser = user;
    let updatedPersonalInfo = await this.userPersonalInfoRepository.findByUserId(userId);
    
    if (Object.keys(changes.userChanges).length > 0) {
      updatedUser = await this.userRepository.updateProfile(userId, changes.userChanges);
    }
    
    if (Object.keys(changes.personalInfoChanges).length > 0) {
      updatedPersonalInfo = await this.userPersonalInfoRepository.upsertByUserId(
        userId,
        changes.personalInfoChanges
      );
    }
    
    return { updatedUser, updatedPersonalInfo };
  }

  /**
   * Builds profile response from user and personal info
   * @param user - User entity
   * @param personalInfo - Personal info entity or null
   * @param changed - Whether changes were made
   * @returns Profile response
   */
  private buildProfileResponse(
    user: User,
    personalInfo: UserPersonalInfo | null,
    changed: boolean
  ): PatchMeResponse {
    return {
      id: user.getId().toString(),
      email: user.getEmail().toString(),
      name: user.getFullName(),
      givenName: user.getFirstName(),
      lastName: user.getLastName(),
      personalInfo: {
        phone: personalInfo?.getPhone() || null,
        locale: personalInfo?.getLocale() || null,
        timeZone: personalInfo?.getTimeZone() || null
      },
      meta: {
        updatedAt: new Date().toISOString(),
        changed
      }
    };
  }

  private generateId(): string {
    return uuid();
  }
}
