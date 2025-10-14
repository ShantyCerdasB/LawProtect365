/**
 * @fileoverview OAuthAccount entity - Represents an OAuth provider account linked to a user
 * @summary Manages OAuth provider account information and linking
 * @description The OAuthAccount entity handles OAuth provider account linking,
 * including provider-specific data and account status management.
 */

import { UserId } from '../value-objects/UserId';
import { OAuthProvider } from '../enums/OAuthProvider';

/**
 * OAuthAccount entity representing a linked OAuth provider account
 * 
 * Manages OAuth provider account information and linking status.
 */
export class OAuthAccount {
  constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly provider: OAuthProvider,
    private readonly providerId: string,
    private readonly providerEmail: string,
    private readonly providerName: string,
    private readonly isPrimary: boolean,
    private readonly linkedAt: Date,
    private readonly lastUsedAt: Date | undefined
  ) {}

  /**
   * Creates an OAuthAccount from persistence data
   * @param data - Prisma OAuthAccount data
   * @returns OAuthAccount instance
   */
  static fromPersistence(data: any): OAuthAccount {
    return new OAuthAccount(
      data.id,
      UserId.fromString(data.userId),
      data.provider as OAuthProvider,
      data.providerId,
      data.providerEmail,
      data.providerName,
      data.isPrimary || false,
      data.linkedAt,
      data.lastUsedAt
    );
  }

  /**
   * Gets the OAuth account unique identifier
   * @returns The OAuth account ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the user ID this account is linked to
   * @returns The user ID value object
   */
  getUserId(): UserId {
    return this.userId;
  }

  /**
   * Gets the OAuth provider
   * @returns The OAuth provider
   */
  getProvider(): OAuthProvider {
    return this.provider;
  }

  /**
   * Gets the provider-specific account ID
   * @returns The provider account ID
   */
  getProviderId(): string {
    return this.providerId;
  }

  /**
   * Gets the email from the OAuth provider
   * @returns The provider email
   */
  getProviderEmail(): string {
    return this.providerEmail;
  }

  /**
   * Gets the name from the OAuth provider
   * @returns The provider name
   */
  getProviderName(): string {
    return this.providerName;
  }

  /**
   * Checks if this is the primary OAuth account
   * @returns True if this is the primary account
   */
  getIsPrimary(): boolean {
    return this.isPrimary;
  }

  /**
   * Gets the linking timestamp
   * @returns The linking timestamp
   */
  getLinkedAt(): Date {
    return this.linkedAt;
  }

  /**
   * Gets the last used timestamp
   * @returns The last used timestamp or undefined if never used
   */
  getLastUsedAt(): Date | undefined {
    return this.lastUsedAt;
  }

  /**
   * Updates the last used timestamp
   */
  updateLastUsed(): void {
    (this as any).lastUsedAt = new Date();
  }

  /**
   * Sets this account as primary
   */
  setAsPrimary(): void {
    (this as any).isPrimary = true;
  }

  /**
   * Removes primary status from this account
   */
  removePrimaryStatus(): void {
    (this as any).isPrimary = false;
  }

  /**
   * Gets the creation date of the OAuth account
   * @returns The creation date
   */
  getCreatedAt(): Date {
    return this.linkedAt;
  }
}
