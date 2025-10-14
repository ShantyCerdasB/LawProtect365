/**
 * @fileoverview UserService - Core user business logic service
 * @summary Orchestrates user lifecycle and profile management
 * @description Handles user creation, updates, OAuth linking, and business rules
 * for the PostAuthentication trigger and general user management.
 */

import { UserRepository } from '../repositories/UserRepository';
import { OAuthAccountRepository } from '../repositories/OAuthAccountRepository';
import { UserRole, UserAccountStatus } from '../domain/enums';
import { User } from '../domain/entities/User';
import { UserId } from '../domain/value-objects/UserId';
import { Email } from '@lawprotect/shared-ts';
import { userCreationFailed, userUpdateFailed } from '../auth-errors/factories';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { UpsertOnPostAuthInput, UpsertOnPostAuthResult } from '../types/UserServiceTypes';

/**
 * Service for user business logic orchestration
 * 
 * Handles user lifecycle, OAuth linking, and business rules.
 */
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository
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
    const updates: Partial<User> = {};
    
    if (input.email && input.email !== existingUser.getEmail()?.toString()) {
      // Update email if different and allowed
      updates.email = new Email(input.email);
    }
    
    if (input.givenName && input.givenName !== existingUser.getFirstName()) {
      updates.firstName = input.givenName;
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
}
