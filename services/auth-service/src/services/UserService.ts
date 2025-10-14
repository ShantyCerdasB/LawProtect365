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
