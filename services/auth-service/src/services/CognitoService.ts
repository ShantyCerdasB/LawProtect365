/**
 * @fileoverview CognitoService - AWS Cognito integration service
 * @summary Handles Cognito user management and authentication
 * @description Provides integration with AWS Cognito for user management,
 * MFA status retrieval, and social identity parsing.
 */

import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AdminGetUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { cognitoUserNotFound, cognitoUserCreationFailed } from '../auth-errors/factories';

/**
 * Service for AWS Cognito integration
 * 
 * Handles user data retrieval, MFA status, and social identity parsing.
 */
export class CognitoService {
  constructor(
    private readonly client: CognitoIdentityProviderClient,
    private readonly userPoolId: string
  ) {}

  /**
   * Retrieves user data from Cognito using AdminGetUser
   * @param sub - Cognito user sub (username)
   * @returns AdminGetUser command output
   * @throws Error if user not found or API call fails
   */
  async adminGetUser(sub: string): Promise<AdminGetUserCommandOutput> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: sub
      });

      return await this.client.send(command);
    } catch (error) {
      if (error instanceof Error && error.name === 'UserNotFoundException') {
        throw cognitoUserNotFound({ sub });
      }
      throw cognitoUserCreationFailed({ 
        cause: `Failed to get user from Cognito: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Parses AdminGetUser output to extract MFA status and social identities
   * @param user - AdminGetUser command output
   * @returns Parsed MFA status and social identities
   */
  parseAdminUser(user: AdminGetUserCommandOutput): {
    mfaEnabled: boolean;
    identities: Array<{ provider: OAuthProvider; providerAccountId: string }>;
  } {
    const attrs = new Map((user.UserAttributes || []).map(a => [a.Name!, a.Value!]));
    const userMFASettingList = user.UserMFASettingList || [];
    const preferredMfaSetting = user.PreferredMfaSetting || attrs.get('preferred_mfa_setting');

    // Determine MFA status
    const mfaEnabled = Boolean(
      userMFASettingList.includes('SOFTWARE_TOKEN_MFA') || 
      preferredMfaSetting
    );

    // Parse social identities
    const identitiesRaw = attrs.get('identities');
    const identitiesParsed = identitiesRaw ? JSON.parse(identitiesRaw) as Array<any> : [];
    
    const identities = identitiesParsed
      .map(identity => {
        const providerName = (identity.providerName || '').toLowerCase();
        const provider = this.mapProviderName(providerName);
        const providerAccountId = String(identity.userId || identity.user_id || '');
        
        return { provider, providerAccountId };
      })
      .filter(identity => identity.providerAccountId);

    return { mfaEnabled, identities };
  }

  /**
   * Maps Cognito provider names to our OAuthProvider enum
   * @param providerName - Cognito provider name
   * @returns Mapped OAuthProvider
   */
  private mapProviderName(providerName: string): OAuthProvider {
    if (providerName.includes('google')) {
      return OAuthProvider.GOOGLE;
    }
    if (providerName.includes('microsoft') || providerName.includes('azure')) {
      return OAuthProvider.MICROSOFT_365;
    }
    if (providerName.includes('apple')) {
      return OAuthProvider.APPLE;
    }
    return OAuthProvider.COGNITO;
  }
}
