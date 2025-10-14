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
import { CognitoMfaSettings } from '../domain/rules/MfaPolicyRules';

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
   * Parses AdminGetUser output to extract detailed MFA settings for policy evaluation
   * @param user - AdminGetUser command output
   * @returns Detailed MFA settings for policy evaluation
   */
  parseMfaSettings(user: AdminGetUserCommandOutput): CognitoMfaSettings {
    const attrs = new Map((user.UserAttributes || []).map(a => [a.Name!, a.Value!]));
    const userMFASettingList = user.UserMFASettingList || [];
    const preferredMfaSetting = user.PreferredMfaSetting || attrs.get('preferred_mfa_setting');
    const customMfaRequired = attrs.get('custom:is_mfa_required');

    // Determine MFA status
    const mfaEnabled = Boolean(
      userMFASettingList.includes('SOFTWARE_TOKEN_MFA') || 
      preferredMfaSetting
    );

    return {
      mfaEnabled,
      isMfaRequiredAttr: customMfaRequired === 'true',
      preferredMfaSetting: preferredMfaSetting || undefined,
      userMfaSettingList: userMFASettingList.length > 0 ? userMFASettingList : undefined
    };
  }

  /**
   * Gets user attributes from AdminGetUser output
   * @param user - AdminGetUser command output
   * @returns Map of user attributes
   */
  getUserAttributes(user: AdminGetUserCommandOutput): Map<string, string> {
    return new Map((user.UserAttributes || []).map(a => [a.Name!, a.Value!]));
  }

  /**
   * Gets custom attributes from AdminGetUser output
   * @param user - AdminGetUser command output
   * @returns Map of custom attributes
   */
  getCustomAttributes(user: AdminGetUserCommandOutput): Map<string, string> {
    const attrs = this.getUserAttributes(user);
    const customAttrs = new Map<string, string>();
    
    for (const [key, value] of attrs) {
      if (key.startsWith('custom:')) {
        customAttrs.set(key, value);
      }
    }
    
    return customAttrs;
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
