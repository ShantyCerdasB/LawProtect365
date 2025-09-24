/**
 * @fileoverview User - User entity
 * @summary Core user entity with business logic
 * @description Represents a user in the system with all business operations and invariants.
 */

import { UserId } from "../ValueObjects/UserId";
import { EmailAddress } from "../ValueObjects/EmailAddress";
import { DisplayName } from "../ValueObjects/DisplayName";
import { GivenName } from "../ValueObjects/GivenName";
import { FamilyName } from "../ValueObjects/FamilyName";
import { UserRoleVO } from "../ValueObjects/UserRoleVO";
import { AccountStatusVO } from "../ValueObjects/AccountStatusVO";
import { ExternalIdpClaims } from "../ValueObjects/ExternalIdpClaims";
import { OAuthAccount } from "./OAuthAccount";
import { UserAccountStatus, UserRole } from "@prisma/client";
import { 
  accountAlreadyExists, 
  accountCreationFailed, 
  accountUpdateFailed,
  mfaDisableNotAllowed 
} from "@/UserServiceErrors";

/**
 * User entity interface
 */
export interface UserData {
  readonly id: UserId;
  readonly email: EmailAddress;
  readonly name: DisplayName;
  readonly givenName?: GivenName;
  readonly familyName?: FamilyName;
  readonly role: UserRoleVO;
  readonly mfaEnabled: boolean;
  readonly status: AccountStatusVO;
  readonly suspendedUntil?: Date;
  readonly deletedAt?: Date;
  readonly deactivationReason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
  readonly oauthAccounts: OAuthAccount[];
}

/**
 * User entity
 * 
 * Represents a user in the system with all business operations and invariants.
 * Handles user lifecycle, OAuth account linking, role changes, and status transitions.
 * 
 * @example
 * ```ts
 * const user = User.provisionFromIdp(claims);
 * const updatedUser = user.linkOAuthAccount(oauthAccount, policy);
 * ```
 */
export class User {
  private readonly _data: UserData;

  /**
   * Provisions a new user from external IdP claims (JIT provisioning)
   * @param claims - The external IdP claims
   * @returns A new User instance
   */
  static provisionFromIdp(claims: ExternalIdpClaims): User {
    const now = new Date();
    const id = UserId.create(crypto.randomUUID());
    const email = EmailAddress.create(claims.getEmail().getValue());
    
    // Derive display name from claims
    const displayName = claims.getDisplayName() 
      ? DisplayName.create(claims.getDisplayName())
      : DisplayName.create(`${claims.getGivenName() || ''} ${claims.getFamilyName() || ''}`.trim());
    
    const givenName = claims.getGivenName() ? GivenName.create(claims.getGivenName()) : undefined;
    const familyName = claims.getFamilyName() ? FamilyName.create(claims.getFamilyName()) : undefined;
    
    const role = UserRoleVO.fromString(UserRole.CUSTOMER); // Default role
    const status = AccountStatusVO.fromString(UserAccountStatus.ACTIVE);

    return new User({
      id,
      email,
      name: displayName,
      givenName,
      familyName,
      role,
      mfaEnabled: false,
      status,
      createdAt: now,
      updatedAt: now,
      oauthAccounts: []
    });
  }

  /**
   * Creates a user from existing data
   * @param data - The user data
   * @returns A new User instance
   */
  static fromData(data: UserData): User {
    return new User(data);
  }

  /**
   * Private constructor - use static factory methods instead
   * @param data - The user data
   */
  private constructor(data: UserData) {
    this._data = data;
  }

  // Getters
  getId(): UserId { return this._data.id; }
  getEmail(): EmailAddress { return this._data.email; }
  getName(): DisplayName { return this._data.name; }
  getGivenName(): GivenName | undefined { return this._data.givenName; }
  getFamilyName(): FamilyName | undefined { return this._data.familyName; }
  getRole(): UserRoleVO { return this._data.role; }
  getMfaEnabled(): boolean { return this._data.mfaEnabled; }
  getStatus(): AccountStatusVO { return this._data.status; }
  getSuspendedUntil(): Date | undefined { return this._data.suspendedUntil; }
  getDeletedAt(): Date | undefined { return this._data.deletedAt; }
  getDeactivationReason(): string | undefined { return this._data.deactivationReason; }
  getCreatedAt(): Date { return this._data.createdAt; }
  getUpdatedAt(): Date { return this._data.updatedAt; }
  getLastLoginAt(): Date | undefined { return this._data.lastLoginAt; }
  getOauthAccounts(): OAuthAccount[] { return [...this._data.oauthAccounts]; }

  /**
   * Links an OAuth account to this user
   * @param account - The OAuth account to link
   * @param policy - The linking policy to validate against
   * @returns A new User instance with the linked account
   */
  linkOAuthAccount(account: OAuthAccount, policy: any): User {
    // This would be implemented with proper policy validation
    const updatedAccounts = [...this._data.oauthAccounts, account];
    
    return new User({
      ...this._data,
      oauthAccounts: updatedAccounts,
      updatedAt: new Date()
    });
  }

  /**
   * Unlinks an OAuth account from this user
   * @param provider - The OAuth provider to unlink
   * @returns A new User instance without the specified account
   */
  unlinkOAuthAccount(provider: any): User {
    const updatedAccounts = this._data.oauthAccounts.filter(
      account => !account.getProvider().equals(provider)
    );
    
    return new User({
      ...this._data,
      oauthAccounts: updatedAccounts,
      updatedAt: new Date()
    });
  }

  /**
   * Activates the user account
   * @returns A new User instance with ACTIVE status
   */
  activate(): User {
    return new User({
      ...this._data,
      status: AccountStatusVO.fromString(UserAccountStatus.ACTIVE),
      updatedAt: new Date()
    });
  }

  /**
   * Deactivates the user account
   * @param reason - Optional deactivation reason
   * @returns A new User instance with INACTIVE status
   */
  deactivate(reason?: string): User {
    return new User({
      ...this._data,
      status: AccountStatusVO.fromString(UserAccountStatus.INACTIVE),
      deactivationReason: reason,
      updatedAt: new Date()
    });
  }

  /**
   * Suspends the user account
   * @param until - Optional suspension end date
   * @param reason - Suspension reason
   * @returns A new User instance with SUSPENDED status
   */
  suspend(until: Date | undefined, reason: string): User {
    return new User({
      ...this._data,
      status: AccountStatusVO.fromString(UserAccountStatus.SUSPENDED),
      suspendedUntil: until,
      deactivationReason: reason,
      updatedAt: new Date()
    });
  }

  /**
   * Unsuspends the user account
   * @returns A new User instance with ACTIVE status
   */
  unsuspend(): User {
    return new User({
      ...this._data,
      status: AccountStatusVO.fromString(UserAccountStatus.ACTIVE),
      suspendedUntil: undefined,
      deactivationReason: undefined,
      updatedAt: new Date()
    });
  }

  /**
   * Marks the user as deleted and anonymizes data
   * @returns A new User instance with DELETED status and anonymized data
   */
  markDeletedAndAnonymize(): User {
    const anonymizedEmail = EmailAddress.create(`deleted-${this._data.id.getValue()}@example.invalid`);
    const anonymizedName = DisplayName.create("Deleted User");
    
    return new User({
      ...this._data,
      email: anonymizedEmail,
      name: anonymizedName,
      givenName: undefined,
      familyName: undefined,
      status: AccountStatusVO.fromString(UserAccountStatus.DELETED),
      deletedAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Enables MFA for the user
   * @returns A new User instance with MFA enabled
   */
  enableMfa(): User {
    return new User({
      ...this._data,
      mfaEnabled: true,
      updatedAt: new Date()
    });
  }

  /**
   * Disables MFA for the user (not allowed for SUPER_ADMIN)
   * @returns A new User instance with MFA disabled
   * @throws mfaDisableNotAllowed when user is SUPER_ADMIN
   */
  disableMfa(): User {
    if (this._data.role.getValue() === UserRole.SUPER_ADMIN) {
      throw mfaDisableNotAllowed({
        userId: this._data.id.getValue(),
        role: this._data.role.getValue()
      });
    }
    
    return new User({
      ...this._data,
      mfaEnabled: false,
      updatedAt: new Date()
    });
  }

  /**
   * Changes the user's role
   * @param newRole - The new role
   * @param policy - The role change policy to validate against
   * @returns A new User instance with the new role
   */
  changeRole(newRole: UserRoleVO, policy: any): User {
    // This would be implemented with proper policy validation
    return new User({
      ...this._data,
      role: newRole,
      updatedAt: new Date()
    });
  }

  /**
   * Updates the last login timestamp
   * @param now - The current timestamp
   * @returns A new User instance with updated last login
   */
  updateLastLoginAt(now: Date): User {
    return new User({
      ...this._data,
      lastLoginAt: now,
      updatedAt: now
    });
  }

  /**
   * Returns a primitive representation of the user
   * @returns Object with primitive values
   */
  toPrimitives(): Readonly<{
    id: string;
    email: string;
    name: string;
    givenName?: string;
    familyName?: string;
    role: string;
    mfaEnabled: boolean;
    status: string;
    suspendedUntil?: Date;
    deletedAt?: Date;
    deactivationReason?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    oauthAccounts: Array<{
      provider: string;
      providerAccountId: string;
      createdAt: Date;
    }>;
  }> {
    return {
      id: this._data.id.getValue(),
      email: this._data.email.getValue(),
      name: this._data.name.getValue(),
      givenName: this._data.givenName?.getValue(),
      familyName: this._data.familyName?.getValue(),
      role: this._data.role.getValue(),
      mfaEnabled: this._data.mfaEnabled,
      status: this._data.status.getValue(),
      suspendedUntil: this._data.suspendedUntil,
      deletedAt: this._data.deletedAt,
      deactivationReason: this._data.deactivationReason,
      createdAt: this._data.createdAt,
      updatedAt: this._data.updatedAt,
      lastLoginAt: this._data.lastLoginAt,
      oauthAccounts: this._data.oauthAccounts.map(account => account.toPrimitives())
    };
  }
}
