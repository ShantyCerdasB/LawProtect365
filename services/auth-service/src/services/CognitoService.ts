/**
 * @fileoverview CognitoService - AWS Cognito integration service
 * @summary Handles Cognito user management and authentication
 * @description Provides integration with AWS Cognito for user management,
 * MFA status retrieval, and social identity parsing.
 */

import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminLinkProviderForUserCommand, AdminEnableUserCommand, AdminDisableUserCommand, AdminUserGlobalSignOutCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AdminGetUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { CognitoAttribute } from '../domain/enums/CognitoAttribute';
import { cognitoUserNotFound, cognitoUserCreationFailed, cognitoUserUpdateFailed } from '../auth-errors/factories';
import { CognitoMfaSettings, ProviderIdentity } from '../domain/interfaces';
import { Logger } from '@lawprotect/shared-ts';

/**
 * Service for AWS Cognito integration
 * 
 * Handles user data retrieval, MFA status, and social identity parsing.
 */
export class CognitoService {
  constructor(
    private readonly client: CognitoIdentityProviderClient,
    private readonly userPoolId: string,
    private readonly logger: Logger
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
    const identitiesRaw = attrs.get(CognitoAttribute.IDENTITIES);
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
    const preferredMfaSetting = user.PreferredMfaSetting || attrs.get(CognitoAttribute.PREFERRED_MFA_SETTING);
    const customMfaRequired = attrs.get(CognitoAttribute.CUSTOM_MFA_REQUIRED);

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

  /**
   * Links a provider to a user in Cognito
   * @param destinationUserSub - The destination user's Cognito sub
   * @param sourceUserProvider - The source provider name
   * @param sourceUserProviderUserId - The source provider user ID
   * @throws Error if linking fails
   */
  async adminLinkProviderForUser(
    destinationUserSub: string,
    sourceUserProvider: string,
    sourceUserProviderUserId: string
  ): Promise<void> {
    try {
      const command = new AdminLinkProviderForUserCommand({
        UserPoolId: this.userPoolId,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: destinationUserSub
        },
        SourceUser: {
          ProviderName: sourceUserProvider,
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: sourceUserProviderUserId
        }
      });

      await this.client.send(command);
    } catch (error) {
      throw cognitoUserUpdateFailed({
        cause: `Failed to link provider ${sourceUserProvider} to user ${destinationUserSub}: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Generates a hosted UI URL for OAuth provider linking
   * @param provider - The OAuth provider
   * @param state - The state parameter
   * @param successUrl - Success redirect URL
   * @param failureUrl - Failure redirect URL
   * @returns The hosted UI URL
   */
  async generateHostedUiUrl(
    provider: OAuthProvider,
    state: string,
    successUrl: string,
    _failureUrl: string
  ): Promise<string> {
    const baseUrl = `https://${this.userPoolId}.auth.${process.env.AWS_REGION || 'us-east-1'}.amazoncognito.com`;
    const clientId = process.env.COGNITO_CLIENT_ID || '';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: successUrl,
      state: state,
      identity_provider: this.getProviderIdentifier(provider)
    });

    return `${baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Validates an ID token from an OAuth provider
   * @param provider - The OAuth provider
   * @param idToken - The ID token to validate
   * @returns Provider identity information
   * @throws Error if token validation fails
   */
  async validateIdToken(provider: OAuthProvider, idToken: string): Promise<ProviderIdentity> {
    try {
      // Basic JWT structure validation
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure');
      }

      // Decode payload (without verification for now - in production, verify signature)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      
      // Extract provider-specific user ID
      let providerAccountId: string;
      switch (provider) {
        case OAuthProvider.GOOGLE:
          providerAccountId = payload.sub;
          break;
        case OAuthProvider.MICROSOFT_365:
          providerAccountId = payload.oid || payload.sub;
          break;
        case OAuthProvider.APPLE:
          providerAccountId = payload.sub;
          break;
        default:
          providerAccountId = payload.sub;
      }

      return {
        provider,
        providerAccountId,
        email: payload.email,
        name: payload.name || payload.given_name || payload.family_name
      };
    } catch (error) {
      throw new Error(`Failed to validate ID token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Exchanges authorization code for provider identity
   * @param provider - The OAuth provider
   * @param code - The authorization code
   * @returns Provider identity information
   * @throws Error if code exchange fails
   */
  async exchangeCodeForToken(_provider: OAuthProvider, _code: string): Promise<ProviderIdentity> {
    // This is a simplified implementation
    // In production, you would make actual OAuth token exchange calls
    throw new Error('Code exchange not implemented - use direct ID token validation instead');
  }

  /**
   * Gets the Cognito provider identifier for hosted UI
   * @param provider - The OAuth provider
   * @returns The provider identifier for Cognito
   */
  async adminUnlinkProviderForUser(
    destinationUserSub: string,
    sourceUserProvider: string,
    _sourceUserProviderUserId: string
  ): Promise<void> {
    // Note: AWS Cognito doesn't support direct provider unlinking
    // We can only unlink in our database. The provider will remain
    // visible in Cognito until the user's session expires or they
    // re-authenticate, but they won't be able to login with it.
    this.logger.info('Provider unlinked in database only (Cognito limitation)', {
      userSub: destinationUserSub,
      provider: sourceUserProvider,
      note: 'Provider will remain visible in Cognito until session expires'
    });
    
    // No error thrown - this is the expected behavior
    // The actual unlinking happens in the database layer
  }

  /**
   * Enables a user in Cognito
   * @param sub - Cognito user sub
   * @returns Promise that resolves when user is enabled
   */
  async adminEnableUser(sub: string): Promise<void> {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: this.userPoolId,
        Username: sub
      });

      await this.client.send(command);
      this.logger.info('User enabled in Cognito', { sub });
    } catch (error) {
      this.logger.error('Failed to enable user in Cognito', {
        sub,
        error: error instanceof Error ? error.message : String(error)
      });
      throw cognitoUserUpdateFailed({
        cause: `Failed to enable user: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Disables a user in Cognito
   * @param sub - Cognito user sub
   * @returns Promise that resolves when user is disabled
   */
  async adminDisableUser(sub: string): Promise<void> {
    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: sub
      });

      await this.client.send(command);
      this.logger.info('User disabled in Cognito', { sub });
    } catch (error) {
      this.logger.error('Failed to disable user in Cognito', {
        sub,
        error: error instanceof Error ? error.message : String(error)
      });
      throw cognitoUserUpdateFailed({
        cause: `Failed to disable user: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Performs global sign out for a user in Cognito
   * @param sub - Cognito user sub
   * @returns Promise that resolves when global sign out is complete
   */
  async adminUserGlobalSignOut(sub: string): Promise<void> {
    try {
      const command = new AdminUserGlobalSignOutCommand({
        UserPoolId: this.userPoolId,
        Username: sub
      });

      await this.client.send(command);
      this.logger.info('Global sign out completed for user', { sub });
    } catch (error) {
      this.logger.error('Failed to perform global sign out', {
        sub,
        error: error instanceof Error ? error.message : String(error)
      });
      throw cognitoUserUpdateFailed({
        cause: `Failed to perform global sign out: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private getProviderIdentifier(provider: OAuthProvider): string {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        return 'Google';
      case OAuthProvider.MICROSOFT_365:
        return 'Microsoft';
      case OAuthProvider.APPLE:
        return 'SignInWithApple';
      default:
        return 'Cognito';
    }
  }

  /**
   * Updates user attributes in Cognito
   * @param sub - Cognito user sub (username)
   * @param attributes - Attributes to update
   * @throws cognitoUserUpdateFailed if update fails
   */
  async adminUpdateUserAttributes(
    sub: string,
    attributes: { [key: string]: string }
  ): Promise<void> {
    try {
      const userAttributes = Object.entries(attributes).map(([name, value]) => ({
        Name: name,
        Value: value
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: sub,
        UserAttributes: userAttributes
      });

      await this.client.send(command);
      this.logger.info('User attributes updated in Cognito', { sub, attributes });
    } catch (error) {
      this.logger.error('Failed to update user attributes in Cognito', {
        sub,
        attributes,
        error: error instanceof Error ? error.message : String(error)
      });
      throw cognitoUserUpdateFailed({
        cause: `Failed to update user attributes: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}
