/**
 * @fileoverview OAuthAccount - OAuth account entity
 * @summary OAuth account linked to a user
 * @description Represents an OAuth account linked to a user with provider and account ID.
 */

import { OAuthProviderVO } from "../value-objects/OAuthProviderVO";
import { ProviderAccountId } from "../value-objects/ProviderAccountId";
import { ExternalIdpClaims } from "../value-objects/ExternalIdpClaims";
import { OAuthProvider } from "@prisma/client";

/**
 * OAuth account data interface
 */
export interface OAuthAccountData {
  readonly provider: OAuthProviderVO;
  readonly providerAccountId: ProviderAccountId;
  readonly createdAt: Date;
}

/**
 * OAuth account entity
 * 
 * Represents an OAuth account linked to a user with provider and account ID.
 * Provides equality comparison and primitive conversion.
 * 
 * @example
 * ```ts
 * const account = OAuthAccount.fromClaims(claims);
 * console.log(account.getProvider().getValue()); // "GOOGLE"
 * ```
 */
export class OAuthAccount {
  private readonly _data: OAuthAccountData;

  /**
   * Creates an OAuth account from external IdP claims
   * @param claims - The external IdP claims
   * @returns A new OAuthAccount instance
   */
  static fromClaims(claims: ExternalIdpClaims): OAuthAccount {
    // Determine provider from issuer
    const provider = OAuthAccount.determineProvider(claims.getIssuer());
    const providerAccountId = ProviderAccountId.create(claims.getSubject());
    const now = new Date();

    return new OAuthAccount({
      provider,
      providerAccountId,
      createdAt: now
    });
  }

  /**
   * Creates an OAuth account from data
   * @param data - The OAuth account data
   * @returns A new OAuthAccount instance
   */
  static fromData(data: OAuthAccountData): OAuthAccount {
    return new OAuthAccount(data);
  }

  /**
   * Determines the OAuth provider from the issuer
   * @param issuer - The issuer string from claims
   * @returns The OAuth provider value object
   */
  private static determineProvider(issuer: string): OAuthProviderVO {
    if (issuer.includes('google')) {
      return OAuthProviderVO.fromString(OAuthProvider.GOOGLE);
    } else if (issuer.includes('microsoft') || issuer.includes('login.microsoftonline.com')) {
      return OAuthProviderVO.fromString(OAuthProvider.MICROSOFT_365);
    } else if (issuer.includes('apple') || issuer.includes('appleid.apple.com')) {
      return OAuthProviderVO.fromString(OAuthProvider.APPLE);
    } else {
      throw new Error(`Unsupported OAuth provider issuer: ${issuer}`);
    }
  }

  /**
   * Private constructor - use static factory methods instead
   * @param data - The OAuth account data
   */
  private constructor(data: OAuthAccountData) {
    this._data = data;
  }

  /**
   * Gets the OAuth provider
   * @returns The OAuth provider value object
   */
  getProvider(): OAuthProviderVO {
    return this._data.provider;
  }

  /**
   * Gets the provider account ID
   * @returns The provider account ID value object
   */
  getProviderAccountId(): ProviderAccountId {
    return this._data.providerAccountId;
  }

  /**
   * Gets the creation date
   * @returns The creation date
   */
  getCreatedAt(): Date {
    return this._data.createdAt;
  }

  /**
   * Checks if this OAuthAccount equals another OAuthAccount
   * @param other - The other OAuthAccount to compare with
   * @returns True if both accounts have the same provider and account ID
   */
  equals(other: OAuthAccount | undefined | null): boolean {
    if (!other) return false;
    
    return this._data.provider.equals(other._data.provider) &&
           this._data.providerAccountId.equals(other._data.providerAccountId);
  }

  /**
   * Returns a primitive representation of the OAuth account
   * @returns Object with primitive values
   */
  toPrimitives(): Readonly<{
    provider: string;
    providerAccountId: string;
    createdAt: Date;
  }> {
    return {
      provider: this._data.provider.getValue(),
      providerAccountId: this._data.providerAccountId.getValue(),
      createdAt: this._data.createdAt
    };
  }
}
