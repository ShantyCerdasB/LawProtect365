/**
 * @fileoverview LinkProviderUseCase - Application service for linking OAuth providers
 * @summary Orchestrates the linking of OAuth providers to user accounts
 * @description Handles the business logic for linking OAuth providers to user accounts,
 * including validation, conflict detection, and audit trail creation.
 */

import { User } from '../domain/entities/User';
import { UserService } from '../services/UserService';
import { CognitoService } from '../services/CognitoService';
import { OAuthAccountRepository } from '../repositories/OAuthAccountRepository';
import { AuditService } from '../services/AuditService';
import { EventPublishingService } from '../services/EventPublishingService';
import { LinkProviderRequest, LinkProviderResponse, ProviderIdentity } from '../domain/interfaces';
import { LinkingMode, OAuthProvider } from '../domain/enums';
import { ProviderLinkingRules } from '../domain/rules/ProviderLinkingRules';
import { AuthServiceConfig } from '../config/AppConfig';
import { Logger } from '@lawprotect/shared-ts';
import { 
  oauthProviderNotSupported, 
  oauthAccountLinkingFailed,
  missingRequiredFields 
} from '../auth-errors/factories';

export class LinkProviderUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly _auditService: AuditService,
    private readonly _eventPublishingService: EventPublishingService,
    private readonly config: AuthServiceConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the provider linking use case
   * @param input - The linking request
   * @returns The linking response
   * @throws Error if linking fails
   */
  async execute(input: LinkProviderRequest): Promise<LinkProviderResponse> {
    const { mode, provider } = input;
    
    this.logger.info('Starting provider linking use case', { 
      mode, 
      provider,
      userId: 'extracted-from-token' // Will be extracted from security context
    });

    try {
      // Validate provider and mode
      ProviderLinkingRules.ensureProviderAllowed(provider, this.config);
      
      if (!ProviderLinkingRules.isModeSupported(mode, this.config)) {
        throw oauthProviderNotSupported(`Mode ${mode} is not supported`);
      }

      // Route to appropriate handler based on mode
      switch (mode) {
        case LinkingMode.REDIRECT:
          return await this.handleRedirectMode(input);
        case LinkingMode.DIRECT:
          return await this.handleDirectMode(input);
        case LinkingMode.FINALIZE:
          return await this.handleFinalizeMode(input);
        default:
          throw oauthProviderNotSupported(`Unsupported mode: ${mode}`);
      }
    } catch (error) {
      this.logger.error('Error in provider linking use case', {
        mode,
        provider,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Handles redirect mode - generates hosted UI URL
   * @param input - The linking request
   * @returns Response with link URL
   */
  private async handleRedirectMode(input: LinkProviderRequest): Promise<LinkProviderResponse> {
    const { provider, successUrl, failureUrl } = input;
    
    if (!successUrl || !failureUrl) {
      throw missingRequiredFields('successUrl and failureUrl are required for redirect mode');
    }

    // Generate state parameter
    const state = ProviderLinkingRules.generateState('user-id', provider, this.config);
    
    // Generate hosted UI URL
    const linkUrl = await this.cognitoService.generateHostedUiUrl(
      provider,
      state,
      successUrl,
      failureUrl
    );

    this.logger.info('Generated hosted UI URL for provider linking', { 
      provider,
      stateLength: state.length 
    });

    return {
      linkUrl
    };
  }

  /**
   * Handles direct mode - processes tokens directly
   * @param input - The linking request
   * @returns Response with linking result
   */
  private async handleDirectMode(input: LinkProviderRequest): Promise<LinkProviderResponse> {
    const { authorizationCode, idToken } = input;
    
    if (!authorizationCode && !idToken) {
      throw missingRequiredFields('authorizationCode or idToken is required for direct mode');
    }

    // Validate and extract provider identity
    const identity = await this.validateAndExtractProviderIdentity(input);
    
    // Perform the linking
    return await this.performLinking(identity);
  }

  /**
   * Handles finalize mode - completes OAuth flow
   * @param input - The linking request
   * @returns Response with linking result
   */
  private async handleFinalizeMode(input: LinkProviderRequest): Promise<LinkProviderResponse> {
    const { code, idToken, state } = input;
    
    if (!code && !idToken) {
      throw missingRequiredFields('code or idToken is required for finalize mode');
    }

    if (!state) {
      throw missingRequiredFields('state is required for finalize mode');
    }

    // Validate state parameter
    if (!ProviderLinkingRules.validateState(state, this.config)) {
      throw new Error('Invalid or expired state parameter');
    }

    // Validate and extract provider identity
    const identity = await this.validateAndExtractProviderIdentity(input);
    
    // Perform the linking
    return await this.performLinking(identity);
  }

  /**
   * Validates and extracts provider identity from tokens
   * @param input - The linking request
   * @returns Provider identity information
   */
  private async validateAndExtractProviderIdentity(input: LinkProviderRequest): Promise<ProviderIdentity> {
    const { provider, authorizationCode, idToken } = input;

    if (idToken) {
      // Validate ID token directly
      return await this.cognitoService.validateIdToken(provider, idToken);
    } else if (authorizationCode) {
      // Exchange code for token (not implemented in this example)
      return await this.cognitoService.exchangeCodeForToken(provider, authorizationCode);
    } else {
      throw missingRequiredFields('Either idToken or authorizationCode is required');
    }
  }

  /**
   * Performs the actual provider linking
   * @param identity - The provider identity
   * @returns Response with linking result
   */
  private async performLinking(identity: ProviderIdentity): Promise<LinkProviderResponse> {
    const { provider, providerAccountId } = identity;

    // Validate provider account ID format
    if (!ProviderLinkingRules.validateProviderAccountId(provider, providerAccountId)) {
      throw new Error(`Invalid provider account ID format for ${provider}`);
    }

    // Get current user (this would come from security context in real implementation)
    const currentUser = await this.userService.findByCognitoSub('current-user-sub');
    if (!currentUser) {
      throw new Error('Current user not found');
    }

    // Check if linking is allowed for this user
    if (!ProviderLinkingRules.shouldAllowLinking(currentUser, provider)) {
      throw new Error('Linking not allowed for this user');
    }

    // Check for existing OAuth account
    const existingAccount = await this.oauthAccountRepository.findByProviderAndAccountId(
      provider,
      providerAccountId
    );

    // Check for conflicts
    ProviderLinkingRules.checkForConflicts(existingAccount, currentUser.getId());

    // If account already exists for this user, return idempotent response
    if (existingAccount && existingAccount.getUserId().toString() === currentUser.getId().toString()) {
      this.logger.info('Provider already linked to user', { 
        provider, 
        userId: currentUser.getId().toString() 
      });

      return {
        linked: true,
        provider,
        providerAccountId,
        linkedAt: existingAccount.getCreatedAt().toISOString()
      };
    }

    // Link provider in Cognito
    await this.linkProviderInCognito(currentUser, identity);

    // Persist provider link in database
    await this.persistProviderLink(currentUser, identity);

    // Create audit event
    await this.createAuditEvent(currentUser, identity);

    // Publish integration event
    await this.publishIntegrationEvent(currentUser, identity);

    this.logger.info('Provider linked successfully', { 
      provider, 
      userId: currentUser.getId().toString(),
      providerAccountId: providerAccountId.substring(0, 8) + '...' // Partial for logging
    });

    return {
      linked: true,
      provider,
      providerAccountId,
      linkedAt: new Date().toISOString()
    };
  }

  /**
   * Links provider in Cognito
   * @param user - The user to link to
   * @param identity - The provider identity
   */
  private async linkProviderInCognito(user: User, identity: ProviderIdentity): Promise<void> {
    const { provider, providerAccountId } = identity;

    try {
      await this.cognitoService.adminLinkProviderForUser(
        user.getCognitoSub().toString(),
        this.getCognitoProviderName(provider),
        providerAccountId
      );
    } catch (error) {
      this.logger.error('Failed to link provider in Cognito', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw oauthAccountLinkingFailed(`Failed to link provider in Cognito: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Persists provider link in database
   * @param user - The user to link to
   * @param identity - The provider identity
   */
  private async persistProviderLink(user: User, identity: ProviderIdentity): Promise<void> {
    const { provider } = identity;

    try {
      await this.oauthAccountRepository.upsert(
        user.getId().toString(), 
        provider, 
        identity.providerAccountId
      );
      this.logger.info('Provider link persisted in database', { 
        provider, 
        userId: user.getId().toString() 
      });
    } catch (error) {
      this.logger.error('Failed to persist provider link', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw oauthAccountLinkingFailed(`Failed to persist provider link: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates audit event for provider linking
   * @param user - The user
   * @param identity - The provider identity
   */
  private async createAuditEvent(user: User, identity: ProviderIdentity): Promise<void> {
    try {
      await this._auditService.userProviderLinked(
        user.getId().toString(),
        identity.provider,
        identity.providerAccountId
      );
    } catch (error) {
      this.logger.warn('Failed to create audit event for provider linking', {
        provider: identity.provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - audit failure shouldn't block the operation
    }
  }

  /**
   * Publishes integration event for provider linking
   * @param user - The user
   * @param identity - The provider identity
   */
  private async publishIntegrationEvent(user: User, identity: ProviderIdentity): Promise<void> {
    try {
      await this._eventPublishingService.publishUserProviderLinked(user, identity);
    } catch (error) {
      this.logger.warn('Failed to publish integration event for provider linking', {
        provider: identity.provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - event publishing failure shouldn't block the operation
    }
  }

  /**
   * Gets Cognito provider name for linking
   * @param provider - The OAuth provider
   * @returns The Cognito provider name
   */
  private getCognitoProviderName(provider: OAuthProvider): string {
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
}
