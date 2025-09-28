/**
 * @fileoverview ServiceFactory - Factory for domain and application services
 * @summary Creates domain services with their repository dependencies
 * @description Manages service instantiation and dependency injection for domain services.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * service creation and dependency wiring.
 */

import { SignatureEnvelopeService } from '../../../services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '../../../services/EnvelopeSignerService';
import { InvitationTokenService } from '../../../services/InvitationTokenService';
import { ConsentService } from '../../../services/ConsentService';
import { SignerReminderTrackingService } from '../../../services/SignerReminderTrackingService';
import { EnvelopeNotificationService } from '../../../services/events/EnvelopeNotificationService';
import { EnvelopeHashService } from '../../../services/hash/EnvelopeHashService';
import { EnvelopeAccessService } from '../../../services/access/EnvelopeAccessService';
import { RepositoryFactory } from '../repositories';
import { InfrastructureFactory } from '../infrastructure';
import { IntegrationEventFactory } from '../events/IntegrationEventFactory';
import { OutboxEventPublisher } from '@lawprotect/shared-ts';

/**
 * Factory responsible for creating all domain and application service instances.
 * Follows the Single Responsibility Principle by focusing exclusively on service creation.
 */
export class ServiceFactory {
  /**
   * Creates SignatureEnvelopeService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured SignatureEnvelopeService instance
   */
  static createSignatureEnvelopeService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): SignatureEnvelopeService {
    return new SignatureEnvelopeService(
      repositories.signatureEnvelopeRepository,
      infrastructure.auditEventService,
      this.createInvitationTokenService(repositories, infrastructure.auditEventService),
      infrastructure.s3Service
    );
  }

  /**
   * Creates EnvelopeSignerService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured EnvelopeSignerService instance
   */
  static createEnvelopeSignerService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeSignerService {
    return new EnvelopeSignerService(
      repositories.envelopeSignerRepository,
      repositories.signatureEnvelopeRepository,
      infrastructure.auditEventService
    );
  }

  /**
   * Creates InvitationTokenService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param auditEventService - Audit event service instance
   * @returns Configured InvitationTokenService instance
   */
  static createInvitationTokenService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    auditEventService: any
  ): InvitationTokenService {
    return new InvitationTokenService(
      repositories.invitationTokenRepository,
      repositories.envelopeSignerRepository,
      auditEventService
    );
  }

  /**
   * Creates ConsentService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured ConsentService instance
   */
  static createConsentService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): ConsentService {
    return new ConsentService(
      repositories.consentRepository,
      repositories.envelopeSignerRepository,
      infrastructure.auditEventService
    );
  }

  /**
   * Creates SignerReminderTrackingService with required dependencies
   * @param repositories - Object containing all repository instances
   * @returns Configured SignerReminderTrackingService instance
   */
  static createSignerReminderTrackingService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>
  ): SignerReminderTrackingService {
    return new SignerReminderTrackingService(
      repositories.signerReminderTrackingRepository
    );
  }

  /**
   * Creates EnvelopeNotificationService with required dependencies
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured EnvelopeNotificationService instance
   */
  static createEnvelopeNotificationService(
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeNotificationService {
    const eventFactory = new IntegrationEventFactory();
    const eventPublisher = new OutboxEventPublisher(infrastructure.outboxRepository);
    
    return new EnvelopeNotificationService(eventFactory, eventPublisher);
  }

  /**
   * Creates EnvelopeHashService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured EnvelopeHashService instance
   */
  static createEnvelopeHashService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeHashService {
    return new EnvelopeHashService(
      repositories.signatureEnvelopeRepository,
      infrastructure.auditEventService
    );
  }

  /**
   * Creates EnvelopeAccessService with required dependencies
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Configured EnvelopeAccessService instance
   */
  static createEnvelopeAccessService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeAccessService {
    return new EnvelopeAccessService(
      repositories.signatureEnvelopeRepository,
      this.createInvitationTokenService(repositories, infrastructure.auditEventService)
    );
  }

  /**
   * Creates all domain services in a single operation
   * @param repositories - Object containing all repository instances
   * @param infrastructure - Object containing all infrastructure services
   * @returns Object containing all service instances
   */
  static createAll(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ) {
    return {
      signatureEnvelopeService: this.createSignatureEnvelopeService(repositories, infrastructure),
      envelopeSignerService: this.createEnvelopeSignerService(repositories, infrastructure),
      invitationTokenService: this.createInvitationTokenService(repositories, infrastructure.auditEventService),
      consentService: this.createConsentService(repositories, infrastructure),
      signerReminderTrackingService: this.createSignerReminderTrackingService(repositories),
      envelopeNotificationService: this.createEnvelopeNotificationService(infrastructure),
      envelopeHashService: this.createEnvelopeHashService(repositories, infrastructure),
      envelopeAccessService: this.createEnvelopeAccessService(repositories, infrastructure),
    };
  }
}