/**
 * @fileoverview CanLinkOAuthAccount - OAuth account linking rule
 * @summary Business rule for validating OAuth account linking
 * @description Validates if an OAuth account can be linked to a user.
 */

import { User } from "../Entities/User";
import { OAuthAccount } from "../Entities/OAuthAccount";
import { ExternalIdpClaims } from "../ValueObjects/ExternalIdpClaims";
import { 
  oauthLinkEmailMismatch, 
  oauthAccountAlreadyLinked, 
  oauthProviderAlreadyAttached 
} from "../../UserServiceErrors";

/**
 * Link lookup interface for checking if provider account is taken
 */
export interface LinkLookup {
  /**
   * Checks if a provider account ID is already taken by another user
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   * @returns Promise that resolves to true if the account is taken
   */
  isProviderSubTaken(provider: string, providerAccountId: string): Promise<boolean>;
}

/**
 * OAuth account linking rule
 * 
 * Validates if an OAuth account can be linked to a user based on business rules.
 * Ensures email matching, no duplicate linking, and no provider conflicts.
 * 
 * @example
 * ```ts
 * const rule = new CanLinkOAuthAccount(lookupService);
 * await rule.assert({ user, claims, account }); // Throws if linking is not allowed
 * ```
 */
export class CanLinkOAuthAccount {
  constructor(private readonly lookup: LinkLookup) {}

  /**
   * Asserts that an OAuth account can be linked to a user
   * @param params - The linking parameters
   * @throws Various OAuth linking errors when validation fails
   */
  async assert(params: {
    user: User;
    claims: ExternalIdpClaims;
    account: OAuthAccount;
  }): Promise<void> {
    const { user, claims, account } = params;

    // Ensure email matches (case-insensitive)
    if (!user.getEmail().getValue().toLowerCase().includes(claims.getEmail().getValue().toLowerCase())) {
      throw oauthLinkEmailMismatch({
        userEmail: user.getEmail().getValue(),
        claimsEmail: claims.getEmail().getValue(),
        userId: user.getId().getValue()
      });
    }

    // Check if provider account is already taken by another user
    const isTaken = await this.lookup.isProviderSubTaken(
      account.getProvider().getValue(),
      account.getProviderAccountId().getValue()
    );

    if (isTaken) {
      throw oauthAccountAlreadyLinked({
        provider: account.getProvider().getValue(),
        providerAccountId: account.getProviderAccountId().getValue(),
        userId: user.getId().getValue()
      });
    }

    // Check if user already has the same provider linked
    const existingProvider = user.getOauthAccounts().find(
      existing => existing.getProvider().equals(account.getProvider())
    );

    if (existingProvider) {
      throw oauthProviderAlreadyAttached({
        provider: account.getProvider().getValue(),
        userId: user.getId().getValue(),
        existingProviderAccountId: existingProvider.getProviderAccountId().getValue()
      });
    }
  }
}
