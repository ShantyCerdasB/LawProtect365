/**
 * @fileoverview CompositionRoot - Main composition root for the notifications service
 * @summary Wires all dependencies and creates the complete object graph
 * @description Coordinates all factories to create the complete application object graph.
 * This is the single point of assembly for all dependencies following the Composition Root pattern.
 */

import { loadConfig } from '../../config/AppConfig';
import { createLogger } from '@lawprotect/shared-ts';
import type { NotificationServiceConfig } from '../../config/types';
import { RepositoryFactory } from './repositories';
import { InfrastructureFactory } from './infrastructure';
import { ServiceFactory } from './services';
import { NotificationOrchestrator } from '../../services/orchestrators';
import { NotificationEventProcessor } from '../../services/orchestrators/processors';
import { StrategyFactory } from './strategies';
import { UseCaseFactory } from './use-cases';
import { TranslationService } from '../../services/i18n';
import { EmailTemplateService } from '../../services/template';
import { NotificationDeliveryService } from '../../services/domain/NotificationDeliveryService';
import { NotificationTemplateService } from '../../services/domain/NotificationTemplateService';

/**
 * Main composition root that assembles the complete object graph for the notifications service.
 * Follows the Composition Root pattern by centralizing all dependency creation and wiring.
 */
export class CompositionRoot {
  public readonly notificationOrchestrator: NotificationOrchestrator;
  public readonly config: NotificationServiceConfig;
  public readonly logger: ReturnType<typeof createLogger>;

  private constructor(
    config: NotificationServiceConfig,
    logger: ReturnType<typeof createLogger>,
    orchestrator: NotificationOrchestrator
  ) {
    this.config = config;
    this.logger = logger;
    this.notificationOrchestrator = orchestrator;
  }

  /**
   * Creates the complete dependency graph for the notifications service
   * @returns Fully configured service instances with all dependencies
   */
  static async build(): Promise<CompositionRoot> {
    const logger = createLogger({
      service: 'notifications-service',
      env: process.env.NODE_ENV || 'development'
    });

    const config = loadConfig();

    const repositories = await RepositoryFactory.createAllAsync();
    const infrastructure = InfrastructureFactory.createAll();
    const services = ServiceFactory.createAll(infrastructure);
    
    const translationService = new TranslationService();
    const emailTemplateService = new EmailTemplateService();
    const strategyRegistry = StrategyFactory.createRegistry(translationService);
    const eventProcessor = new NotificationEventProcessor(strategyRegistry);

    const deliveryService = new NotificationDeliveryService(
      services.emailService,
      services.smsService,
      services.pushNotificationService,
      config
    );

    const templateService = new NotificationTemplateService(
      emailTemplateService,
      logger
    );

    const useCases = UseCaseFactory.createAll({
      notificationRepository: repositories.notificationRepository,
      deliveryService,
      templateService,
      eventProcessor,
      logger
    });

    const orchestrator = new NotificationOrchestrator({
      processNotificationUseCase: useCases.processNotificationUseCase,
      sendNotificationUseCase: useCases.sendNotificationUseCase,
      retryNotificationUseCase: useCases.retryNotificationUseCase
    });

    return new CompositionRoot(config, logger, orchestrator);
  }
}
