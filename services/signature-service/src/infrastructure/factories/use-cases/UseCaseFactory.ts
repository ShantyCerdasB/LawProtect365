/**
 * @fileoverview UseCaseFactory - Factory for application use cases
 * @summary Creates use cases with their service dependencies
 * @description Manages use case instantiation and service dependency injection.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * use case creation and dependency wiring.
 */

import {
  CreateEnvelopeUseCase,
  CancelEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  SendEnvelopeUseCase,
  ShareDocumentViewUseCase,
  SendRemindersUseCase,
  DeclineSignerUseCase,
  DownloadDocumentUseCase,
  GetAuditTrailUseCase,
  GetEnvelopeUseCase,
  ListEnvelopesByUserUseCase,
  SignDocumentUseCase,
} from '../../../services/orchestrators';


import type { Services } from '@/domain/types/infraestructure/container';

/**
 * Factory responsible for creating all use case instances with proper service dependencies.
 * Follows the Single Responsibility Principle by focusing exclusively on use case creation.
 */
export class UseCaseFactory {
  /**
   * Creates CreateEnvelopeUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured CreateEnvelopeUseCase instance
   */
  static createCreateEnvelopeUseCase(services: Services): CreateEnvelopeUseCase {
    return new CreateEnvelopeUseCase(
      services.signatureEnvelopeService,
      services.envelopeHashService,
      services.s3Service
    );
  }

  /**
   * Creates CancelEnvelopeUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured CancelEnvelopeUseCase instance
   */
  static createCancelEnvelopeUseCase(services: Services): CancelEnvelopeUseCase {
    return new CancelEnvelopeUseCase(
      services.signatureEnvelopeService,
      services.envelopeNotificationService
    );
  }

  /**
   * Creates UpdateEnvelopeUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured UpdateEnvelopeUseCase instance
   */
  static createUpdateEnvelopeUseCase(services: Services): UpdateEnvelopeUseCase {
    return new UpdateEnvelopeUseCase(
      services.signatureEnvelopeService,
      services.envelopeSignerService,
      services.s3Service
    );
  }

  /**
   * Creates SendEnvelopeUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured SendEnvelopeUseCase instance
   */
  static createSendEnvelopeUseCase(services: Services): SendEnvelopeUseCase {
    return new SendEnvelopeUseCase(
      services.signatureEnvelopeService,
      services.invitationTokenService,
      services.auditEventService,
      services.envelopeNotificationService
    );
  }

  /**
   * Creates ShareDocumentViewUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured ShareDocumentViewUseCase instance
   */
  static createShareDocumentViewUseCase(services: Services): ShareDocumentViewUseCase {
    return new ShareDocumentViewUseCase(
      services.signatureEnvelopeService,
      services.envelopeSignerService,
      services.invitationTokenService,
      services.auditEventService,
      services.envelopeNotificationService
    );
  }

  /**
   * Creates SendRemindersUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured SendRemindersUseCase instance
   */
  static createSendRemindersUseCase(services: Services): SendRemindersUseCase {
    return new SendRemindersUseCase(
      services.signatureEnvelopeService,
      services.envelopeSignerService,
      services.invitationTokenService,
      services.signerReminderTrackingService,
      services.auditEventService,
      services.envelopeNotificationService
    );
  }

  /**
   * Creates DeclineSignerUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured DeclineSignerUseCase instance
   */
  static createDeclineSignerUseCase(services: Services): DeclineSignerUseCase {
    return new DeclineSignerUseCase(
      services.signatureEnvelopeService,
      services.envelopeSignerService,
      services.envelopeNotificationService,
      services.envelopeAccessService
    );
  }

  /**
   * Creates DownloadDocumentUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured DownloadDocumentUseCase instance
   */
  static createDownloadDocumentUseCase(services: Services): DownloadDocumentUseCase {
    return new DownloadDocumentUseCase(services.signatureEnvelopeService);
  }

  /**
   * Creates GetAuditTrailUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured GetAuditTrailUseCase instance
   */
  static createGetAuditTrailUseCase(services: Services): GetAuditTrailUseCase {
    return new GetAuditTrailUseCase(
      services.signatureEnvelopeService,
      services.auditEventService
    );
  }

  /**
   * Creates GetEnvelopeUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured GetEnvelopeUseCase instance
   */
  static createGetEnvelopeUseCase(services: Services): GetEnvelopeUseCase {
    return new GetEnvelopeUseCase(
      services.signatureEnvelopeService,
      services.invitationTokenService,
      services.envelopeAccessService
    );
  }

  /**
   * Creates ListEnvelopesByUserUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured ListEnvelopesByUserUseCase instance
   */
  static createListEnvelopesByUserUseCase(services: Services): ListEnvelopesByUserUseCase {
    return new ListEnvelopesByUserUseCase(services.signatureEnvelopeService);
  }

  /**
   * Creates SignDocumentUseCase with required services
   * @param services - Object containing all required services
   * @returns Configured SignDocumentUseCase instance
   */
  static createSignDocumentUseCase(services: Services): SignDocumentUseCase {
    return new SignDocumentUseCase(
      services.signatureEnvelopeService,
      services.envelopeSignerService,
      services.invitationTokenService,
      services.consentService,
      services.s3Service,
      services.kmsService,
      services.auditEventService,
      services.envelopeHashService,
      services.envelopeAccessService
    );
  }

  /**
   * Creates all use cases in a single operation
   * @param services - Object containing all required services
   * @returns Object containing all use case instances
   */
  static createAll(services: Services) {
    return {
      createEnvelopeUseCase: this.createCreateEnvelopeUseCase(services),
      cancelEnvelopeUseCase: this.createCancelEnvelopeUseCase(services),
      updateEnvelopeUseCase: this.createUpdateEnvelopeUseCase(services),
      sendEnvelopeUseCase: this.createSendEnvelopeUseCase(services),
      shareDocumentViewUseCase: this.createShareDocumentViewUseCase(services),
      sendRemindersUseCase: this.createSendRemindersUseCase(services),
      declineSignerUseCase: this.createDeclineSignerUseCase(services),
      downloadDocumentUseCase: this.createDownloadDocumentUseCase(services),
      getAuditTrailUseCase: this.createGetAuditTrailUseCase(services),
      getEnvelopeUseCase: this.createGetEnvelopeUseCase(services),
      listEnvelopesByUserUseCase: this.createListEnvelopesByUserUseCase(services),
      signDocumentUseCase: this.createSignDocumentUseCase(services),
    };
  }
}
