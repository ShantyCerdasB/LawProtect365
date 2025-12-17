/**
 * @fileoverview UnlinkProviderUseCase - Application service for unlinking OAuth providers
 * @summary Orchestrates the unlinking of OAuth providers from user accounts
 * @description Handles the business logic for unlinking OAuth providers from user accounts,
 * including validation, conflict detection, and audit trail creation.
 */

import { User } from '../../domain/entities/User';
import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { OAuthAccountRepository } from '../../repositories/OAuthAccountRepository';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { UnlinkProviderRequest, UnlinkProviderResponse } from '../../domain/interfaces';
import { UnlinkingMode, OAuthProvider, ProviderUnlinkingStatus } from '../../domain/enums';
import { ProviderUnlinkingRules } from '../../domain/rules/ProviderUnlinkingRules';
import { AuthServiceConfig } from '../../config/AppConfig';
import { Logger } from '@lawprotect/shared-ts';
import { 
  oauthProviderNotSupported, 
  oauthAccountUnlinkingFailed,
  missingRequiredFields 
} from '../../auth-errors/factories';
import { OAuthAccountId } from '../../domain/value-objects/OAuthAccountId';

export class UnlinkProviderUseCase {
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
   * Executes the provider unlinking use case
   * @param input - The unlinking request
   * @returns The unlinking response
   * @throws Error if unlinking fails
   */
  async execute(input: UnlinkProviderRequest & { cognitoSub: string }): Promise<UnlinkProviderResponse> {
    const { mode, provider } = input;

    try {
      ProviderUnlinkingRules.ensureProviderAllowed(provider, this.config);
      
      ProviderUnlinkingRules.ensureModeEnabled(mode, this.config);

      switch (mode) {
        case UnlinkingMode.DIRECT:
          return await this.handleDirectMode(input);
        case UnlinkingMode.CONFIRM:
          return await this.handleConfirmMode(input);
        default:
          throw oauthProviderNotSupported(`Unsupported mode: ${mode}`);
      }
    } catch (error) {
      this.logger.error('Error in provider unlinking use case', {
        mode,
        provider,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Handles direct mode - processes unlinking directly
   * @param input - The unlinking request
   * @returns Response with unlinking result
   */
  private async handleDirectMode(input: UnlinkProviderRequest & { cognitoSub: string }): Promise<UnlinkProviderResponse> {
    const { provider, providerAccountId, cognitoSub } = input;

    if (!ProviderUnlinkingRules.validateProviderAccountId(provider, providerAccountId)) {
      throw oauthAccountUnlinkingFailed(`Invalid provider account ID format for ${provider}`);
    }

    return await this.performUnlinking(provider, providerAccountId, cognitoSub);
  }

  /**
   * Handles confirm mode - processes unlinking with confirmation
   * @param input - The unlinking request
   * @returns Response with unlinking result
   */
  private async handleConfirmMode(input: UnlinkProviderRequest & { cognitoSub: string }): Promise<UnlinkProviderResponse> {
    const { provider, providerAccountId, confirmationToken, cognitoSub } = input;

    if (!confirmationToken) {
      throw missingRequiredFields('confirmationToken is required for confirm mode');
    }

    if (!ProviderUnlinkingRules.validateProviderAccountId(provider, providerAccountId)) {
      throw oauthAccountUnlinkingFailed(`Invalid provider account ID format for ${provider}`);
    }

    return await this.performUnlinking(provider, providerAccountId, cognitoSub);
  }

  /**
   * Performs the actual provider unlinking
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   * @returns Response with unlinking result
   */
  private async performUnlinking(provider: OAuthProvider, providerAccountId: string, cognitoSub: string): Promise<UnlinkProviderResponse> {
    const currentUser = await this.userService.findByCognitoSub(cognitoSub);
    if (!currentUser) {
      throw oauthAccountUnlinkingFailed('Current user not found');
    }

    const existingAccount = await this.oauthAccountRepository.findByProviderAndAccountId(
      provider,
      providerAccountId
    );

    ProviderUnlinkingRules.checkForConflicts(existingAccount, currentUser.getId());

    const totalProviders = await this.oauthAccountRepository.listByUserId(currentUser.getId().toString()).then(accounts => accounts.length);
    if (!ProviderUnlinkingRules.shouldAllowUnlinking(currentUser, provider, totalProviders)) {
      throw oauthAccountUnlinkingFailed('Cannot unlink provider - insufficient providers or account restrictions');
    }

    await this.unlinkProviderInCognito(currentUser, provider, providerAccountId);
    await this.removeProviderLink(currentUser, provider, providerAccountId);
    await this.createAuditEvent(currentUser, provider, providerAccountId);
    await this.publishIntegrationEvent(currentUser, provider, providerAccountId);

    this.logger.info('Provider unlinked successfully', { 
      provider, 
      userId: currentUser.getId().toString(),
      providerAccountId: providerAccountId.substring(0, 8) + '...'
    });

    return {
      unlinked: true,
      provider,
      providerAccountId,
      unlinkedAt: new Date().toISOString(),
      status: ProviderUnlinkingStatus.SUCCESS
    };
  }

  /**
   * Unlinks provider in Cognito
   * @param user - The user to unlink from
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   */
  private async unlinkProviderInCognito(user: User, provider: OAuthProvider, providerAccountId: string): Promise<void> {
    try {
      await this.cognitoService.adminUnlinkProviderForUser(
        user.getCognitoSub().toString(),
        this.getCognitoProviderName(provider),
        providerAccountId
      );
    } catch (error) {
      this.logger.error('Failed to unlink provider in Cognito', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw oauthAccountUnlinkingFailed(`Failed to unlink provider in Cognito: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Removes provider link from database
   * @param user - The user to unlink from
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   */
  private async removeProviderLink(user: User, provider: OAuthProvider, providerAccountId: string): Promise<void> {
    try {
      const existingAccount = await this.oauthAccountRepository.findByProviderAndAccountId(provider, providerAccountId);
      if (existingAccount) {
        await this.oauthAccountRepository.delete(new OAuthAccountId(existingAccount.getId().toString()));
      }
      this.logger.info('Provider link removed from database', { 
        provider, 
        userId: user.getId().toString() 
      });
    } catch (error) {
      this.logger.error('Failed to remove provider link', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw oauthAccountUnlinkingFailed(`Failed to remove provider link: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates audit event for provider unlinking
   * @param user - The user
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   */
  private async createAuditEvent(user: User, provider: OAuthProvider, providerAccountId: string): Promise<void> {
    try {
      await this._auditService.userProviderUnlinked(
        user.getId().toString(),
        provider,
        providerAccountId
      );
    } catch (error) {
      this.logger.warn('Failed to create audit event for provider unlinking', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Publishes integration event for provider unlinking
   * @param user - The user
   * @param provider - The OAuth provider
   * @param providerAccountId - The provider account ID
   */
  private async publishIntegrationEvent(user: User, provider: OAuthProvider, providerAccountId: string): Promise<void> {
    try {
      await this._eventPublishingService.publishUserProviderUnlinked(user, provider, providerAccountId);
    } catch (error) {
      this.logger.warn('Failed to publish integration event for provider unlinking', {
        provider,
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Gets Cognito provider name for unlinking
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
