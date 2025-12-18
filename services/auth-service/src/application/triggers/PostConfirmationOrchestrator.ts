/**
 * @fileoverview PostConfirmationOrchestrator - Application service for PostConfirmation trigger
 * @summary Orchestrates PostConfirmation trigger business logic
 * @description This application service coordinates the PostConfirmation trigger flow,
 * including user registration, role assignment, and provider linking.
 */

import { User } from '../../domain/entities/User';
import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { PostConfirmationEvent, PostConfirmationResult } from '../../types/cognito/PostConfirmationEvent';
import { UserRegistrationRules } from '../../domain/rules/UserRegistrationRules';
import { UserRole, CognitoAttribute } from '../../domain/enums';
import { AuthServiceConfig } from '../../config/AppConfig';
import { authenticationFailed } from '../../auth-errors/factories';
import { Logger } from '@lawprotect/shared-ts';
import { CognitoEventData } from '../../domain/value-objects/CognitoEventData';

/**
 * Application service that orchestrates the PostConfirmation flow
 * 
 * Coordinates user registration, role assignment, provider linking, and event publishing
 * following the Single Responsibility Principle by delegating to specific services.
 */
export class PostConfirmationOrchestrator {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly auditService: AuditService,
    private readonly eventPublishingService: EventPublishingService,
    private readonly config: AuthServiceConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Process the complete PostConfirmation flow
   * @param event - The Cognito PostConfirmation event
   * @returns Promise that resolves to the processed event
   */
  async processPostConfirmation(event: PostConfirmationEvent): Promise<PostConfirmationResult> {
    const eventData = this.extractUserData(event);
    return this.processPostConfirmationWithData(event, eventData);
  }

  async processPostConfirmationWithData(event: PostConfirmationEvent, eventData: CognitoEventData): Promise<PostConfirmationResult> {
    this.logger.info('Starting PostConfirmation flow', {
      cognitoSub: eventData.cognitoSub,
      hasEmail: !!eventData.email,
      hasPhone: !!eventData.phoneNumber,
      hasLocale: !!eventData.locale
    });
    
    try {
      const cognitoData = await this.getCognitoData(eventData.cognitoSub);
      
      const registrationResult = await this.registerUser({
        cognitoSub: eventData.cognitoSub,
        email: eventData.email,
        givenName: eventData.givenName,
        familyName: eventData.familyName,
        phoneNumber: eventData.phoneNumber,
        locale: eventData.locale,
        intendedRole: this.getIntendedRole(eventData.userAttributes)
      });
      
      if (this.config.features.postConfirmationLinkProviders && cognitoData.identities.length > 0) {
        await this.linkProviderIdentities(registrationResult.user, cognitoData.identities);
      }
      
      await this.createAuditEvents(registrationResult.user, registrationResult.created);
      await this.publishIntegrationEvents(registrationResult.user, registrationResult.created);
      
      this.logRegistrationSuccess(eventData.cognitoSub, registrationResult.user, registrationResult.created);
      
      return event;
      
    } catch (error) {
      this.logRegistrationError(eventData.cognitoSub, error);
      
      if (this.isCriticalError(error)) {
        throw authenticationFailed({
          cause: `Critical error during user registration: ${error instanceof Error ? error.message : String(error)}`
        });
      }
      
      this.logger.warn('Non-critical error during PostConfirmation', {
        cognitoSub: eventData.cognitoSub,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return event;
    }
  }

  private extractUserData(event: PostConfirmationEvent): CognitoEventData {
    const userAttributes = event.request.userAttributes;
    
    return new CognitoEventData(
      event.userName,
      userAttributes as Record<string, string>,
      userAttributes.email,
      userAttributes.given_name,
      userAttributes.family_name,
      userAttributes.phone_number,
      userAttributes.locale,
      event.request.clientMetadata,
      event.requestContext?.awsRequestId
    );
  }

  /**
   * Get Cognito data for provider linking
   * @param cognitoSub - Cognito user sub
   * @returns Cognito data including identities
   */
  private async getCognitoData(cognitoSub: string) {
    try {
      const cognitoUser = await this.cognitoService.adminGetUser(cognitoSub);
      return this.cognitoService.parseAdminUser(cognitoUser);
    } catch (error) {
      this.logger.warn('Failed to retrieve Cognito data', {
        cognitoSub,
        error: error instanceof Error ? error.message : String(error)
      });
      return { mfaEnabled: false, identities: [] };
    }
  }

  /**
   * Register user with appropriate role and status
   * @param input - User registration input
   * @returns Registration result
   */
  private async registerUser(input: {
    cognitoSub: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    phoneNumber?: string;
    locale?: string;
    intendedRole?: UserRole;
  }) {
    // Determine initial role and status
    const initialRole = UserRegistrationRules.determineInitialRole(
      input.intendedRole,
      this.config.defaultRole as UserRole
    );
    
    const initialStatus = UserRegistrationRules.determineInitialStatus(initialRole);
    
    return await this.userService.registerOnConfirmation({
      cognitoSub: input.cognitoSub,
      email: input.email,
      givenName: input.givenName,
      familyName: input.familyName,
      phoneNumber: input.phoneNumber,
      locale: input.locale,
      role: initialRole,
      status: initialStatus
    });
  }

  /**
   * Get intended role from user attributes
   * @param userAttributes - User attributes from event
   * @returns Intended role or undefined
   */
  private getIntendedRole(userAttributes: Record<string, string | undefined>): UserRole | undefined {
    const intendedRole = userAttributes[CognitoAttribute.CUSTOM_ROLE];
    if (intendedRole && Object.values(UserRole).includes(intendedRole as UserRole)) {
      return intendedRole as UserRole;
    }
    return undefined;
  }

  /**
   * Link provider identities to user
   * @param user - User entity
   * @param identities - Provider identities from Cognito
   */
  private async linkProviderIdentities(
    user: User,
    identities: Array<{ provider: string; providerAccountId: string }>
  ) {
    try {
      await this.userService.linkProviderIdentities(
        user.getId().toString(),
        identities.map(id => ({
          provider: id.provider as any, // Convert string to OAuthProvider enum
          providerAccountId: id.providerAccountId
        }))
      );
      
      this.logger.info('Linked provider identities', {
        userId: user.getId().toString(),
        providersCount: identities.length
      });
    } catch (error) {
      this.logger.warn('Failed to link provider identities', {
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create audit events for registration
   * @param user - User entity
   * @param created - Whether user was created
   */
  private async createAuditEvents(user: User, created: boolean) {
    try {
      if (created) {
        await this.auditService.userRegistered(user.getId().toString(), {
          source: 'PostConfirmation',
          role: user.getRole(),
          status: user.getStatus()
        });
      } else {
        await this.auditService.userUpdated(user.getId().toString(), {
          source: 'PostConfirmation',
          role: user.getRole(),
          status: user.getStatus()
        });
      }
    } catch (error) {
      this.logger.warn('Failed to create audit events', {
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Publish integration events
   * @param user - User entity
   * @param created - Whether user was created
   */
  private async publishIntegrationEvents(user: User, created: boolean) {
    try {
      if (created) {
        await this.eventPublishingService.publishUserRegistered(user, {
          source: 'PostConfirmation'
        });
      } else {
        await this.eventPublishingService.publishUserUpdated(user, {
          source: 'PostConfirmation'
        });
      }
    } catch (error) {
      this.logger.warn('Failed to publish integration events', {
        userId: user.getId().toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if error is critical and should block confirmation
   * @param error - Error to check
   * @returns True if error is critical
   */
  private isCriticalError(error: unknown): boolean {
    // Only block on critical integrity violations
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Critical errors that should block confirmation
    const criticalPatterns = [
      'duplicate key',
      'unique constraint',
      'integrity constraint',
      'foreign key constraint'
    ];
    
    return criticalPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern)
    );
  }

  /**
   * Log successful registration
   * @param cognitoSub - Cognito user sub
   * @param user - User entity
   * @param created - Whether user was created
   */
  private logRegistrationSuccess(cognitoSub: string, user: User, created: boolean) {
    this.logger.info('PostConfirmation successful', {
      cognitoSub,
      userId: user.getId().toString(),
      role: user.getRole(),
      status: user.getStatus(),
      created,
      nextSteps: UserRegistrationRules.getNextSteps(user.getRole(), user.getStatus())
    });
  }

  /**
   * Log registration error
   * @param cognitoSub - Cognito user sub
   * @param error - Error that occurred
   */
  private logRegistrationError(cognitoSub: string, error: unknown) {
    this.logger.error('PostConfirmation error', {
      cognitoSub,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
