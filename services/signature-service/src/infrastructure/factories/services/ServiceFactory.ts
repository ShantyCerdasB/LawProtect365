/**
 * @fileoverview ServiceFactory - Factory for domain and application services
 * @summary Creates domain services with their repository dependencies
 * @description Manages service instantiation and dependency injection for domain services.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * service creation and dependency wiring.
 */

import { EnvelopeSignerService } from '../../../services/EnvelopeSignerService';
import { InvitationTokenService } from '../../../services/InvitationTokenService';
import { ConsentService } from '../../../services/ConsentService';
import { SignerReminderTrackingService } from '../../../services/SignerReminderTrackingService';
import { EnvelopeNotificationService } from '../../../services/notification/EnvelopeNotificationService';
import { EnvelopeHashService } from '../../../services/envelopeHashService/EnvelopeHashService';
import { EnvelopeAccessService } from '../../../services/envelopeAccess/EnvelopeAccessService';
import { EnvelopeStateService } from '../../../services/envelopeStates/EnvelopeStateService';
import { EnvelopeCrudService } from '../../../services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeDownloadService } from '../../../services/envelopeDownload/EnvelopeDownloadService';
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

  static createEnvelopeStateService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeStateService {
    return new EnvelopeStateService(
      repositories.signatureEnvelopeRepository,
      infrastructure.auditEventService
    );
  }

  static createEnvelopeCrudService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeCrudService {
    return new EnvelopeCrudService(
      repositories.signatureEnvelopeRepository,
      this.createInvitationTokenService(repositories, infrastructure.auditEventService)
    );
  }

  static createEnvelopeDownloadService(
    repositories: ReturnType<typeof RepositoryFactory.createAll>,
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EnvelopeDownloadService {
    return new EnvelopeDownloadService(
      repositories.signatureEnvelopeRepository,
      infrastructure.s3Service
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
      envelopeSignerService: this.createEnvelopeSignerService(repositories, infrastructure),
      invitationTokenService: this.createInvitationTokenService(repositories, infrastructure.auditEventService),
      consentService: this.createConsentService(repositories, infrastructure),
      signerReminderTrackingService: this.createSignerReminderTrackingService(repositories),
      envelopeNotificationService: this.createEnvelopeNotificationService(infrastructure),
      envelopeHashService: this.createEnvelopeHashService(repositories, infrastructure),
      envelopeAccessService: this.createEnvelopeAccessService(repositories, infrastructure),
      envelopeStateService: this.createEnvelopeStateService(repositories, infrastructure),
      envelopeCrudService: this.createEnvelopeCrudService(repositories, infrastructure),
      envelopeDownloadService: this.createEnvelopeDownloadService(repositories, infrastructure),
    };
  }
}