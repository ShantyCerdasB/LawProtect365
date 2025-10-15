import { OAuthProvider, UnlinkingMode } from '../enums';
import { OAuthAccount } from '../entities/OAuthAccount';
import { User } from '../entities/User';
import { UserId } from '../value-objects/UserId';
import { AuthServiceConfig } from '../../config/AppConfig';
import { oauthAccountNotFound, oauthAccountUnlinkingFailed } from '../../auth-errors/factories';

export class ProviderUnlinkingRules {
  static ensureProviderAllowed(_provider: OAuthProvider, _config: AuthServiceConfig): void {
    // All providers can be unlinked (no restrictions)
  }

  static ensureModeEnabled(_mode: UnlinkingMode, _config: AuthServiceConfig): void {
    // All modes are enabled (no restrictions)
  }

  static validateProviderAccountId(_provider: OAuthProvider, accountId: string): boolean {
    return Boolean(accountId && accountId.length > 0);
  }

  static checkForConflicts(existingAccount: OAuthAccount | null, currentUserId: UserId): void {
    if (!existingAccount) {
      throw oauthAccountNotFound(`OAuth account not found for unlinking`);
    }

    if (!existingAccount.getUserId().equals(currentUserId)) {
      throw oauthAccountUnlinkingFailed(`OAuth account belongs to different user`);
    }
  }

  static shouldAllowUnlinking(_user: User, _provider: OAuthProvider, totalProviders: number): boolean {
    // Must have at least 2 providers to unlink one (minimum 1 remaining)
    return totalProviders > 1;
  }

}
