/**
 * @fileoverview ServiceFactory - Factory for service instances
 * @summary Creates and configures service instances
 * @description Manages service creation and dependency injection for business logic layer.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * service instantiation and dependency wiring.
 */

import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { EventPublisherService, EventServiceFactory, OutboxEventPublisher } from '@lawprotect/shared-ts';
import { UserRepository } from '../../repositories/UserRepository';
import { OAuthAccountRepository } from '../../repositories/OAuthAccountRepository';
import { UserAuditEventRepository } from '../../repositories/UserAuditEventRepository';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { loadConfig } from '../../config/AppConfig';

/**
 * Factory responsible for creating all service instances.
 * Follows the Single Responsibility Principle by focusing exclusively on service creation.
 */
export class ServiceFactory {
  private static readonly config = loadConfig();

  /**
   * Creates UserService instance
   * @param userRepository - User repository instance
   * @param oauthAccountRepository - OAuth account repository instance
   * @returns Configured UserService instance
   */
  static createUserService(
    userRepository: UserRepository,
    oauthAccountRepository: OAuthAccountRepository,
    userPersonalInfoRepository: any
  ): UserService {
    return new UserService(userRepository, oauthAccountRepository, userPersonalInfoRepository);
  }

  /**
   * Creates CognitoService instance
   * @param cognitoClient - Cognito Identity Provider client
   * @returns Configured CognitoService instance
   */
  static createCognitoService(cognitoClient: CognitoIdentityProviderClient, logger: any): CognitoService {
    return new CognitoService(cognitoClient, this.config.aws.cognito.userPoolId, logger);
  }

  /**
   * Creates AuditService instance
   * @param userAuditEventRepository - User audit event repository instance
   * @returns Configured AuditService instance
   */
  static createAuditService(userAuditEventRepository: UserAuditEventRepository): AuditService {
    return new AuditService(userAuditEventRepository);
  }

  /**
   * Creates EventPublisherService instance using Outbox pattern
   * @param outboxRepository - Outbox repository instance
   * @param eventBridgeAdapter - EventBridge adapter instance
   * @returns Configured EventPublisherService instance
   */
  static createEventPublisherService(outboxRepository: any, eventBridgeAdapter: any): EventPublisherService {
    return EventServiceFactory.createEventPublisherService({
      outboxRepository,
      eventBridgeAdapter,
    });
  }

  /**
   * Creates IntegrationEventPublisher instance using Outbox pattern
   * @param outboxRepository - Outbox repository instance
   * @returns Configured IntegrationEventPublisher instance
   */
  static createIntegrationEventPublisher(outboxRepository: any): OutboxEventPublisher {
    return new OutboxEventPublisher(outboxRepository);
  }

  /**
   * Creates EventPublishingService instance
   * @param integrationEventPublisher - Integration event publisher instance
   * @returns Configured EventPublishingService instance
   */
  static createEventPublishingService(integrationEventPublisher: OutboxEventPublisher): EventPublishingService {
    return new EventPublishingService(integrationEventPublisher);
  }

  /**
   * Creates all services in a single operation
   * @param repositories - Repository instances
   * @param infrastructure - Infrastructure services
   * @returns Object containing all service instances
   */
  static createAll(repositories: any, infrastructure: any, logger: any) {
    return {
      userService: this.createUserService(
        repositories.userRepository,
        repositories.oauthAccountRepository,
        repositories.userPersonalInfoRepository
      ),
      cognitoService: this.createCognitoService(infrastructure.cognitoClient, logger),
      auditService: this.createAuditService(repositories.userAuditEventRepository),
      eventPublisherService: infrastructure.eventPublisherService,
      integrationEventPublisher: this.createIntegrationEventPublisher(infrastructure.outboxRepository),
      eventPublishingService: this.createEventPublishingService(this.createIntegrationEventPublisher(infrastructure.outboxRepository)),
    };
  }
}
