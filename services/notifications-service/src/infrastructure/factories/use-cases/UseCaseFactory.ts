/**
 * @fileoverview UseCaseFactory - Factory for use cases
 * @summary Creates use cases with their dependencies
 * @description Manages use case instantiation and dependency injection.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * use case creation and dependency wiring.
 */

import { ProcessNotificationUseCase } from '../../../services/orchestrators/use-cases/ProcessNotificationUseCase';
import { SendNotificationUseCase } from '../../../services/orchestrators/use-cases/SendNotificationUseCase';
import { RetryNotificationUseCase } from '../../../services/orchestrators/use-cases/RetryNotificationUseCase';
import type { UseCaseDependencies } from '../../../domain/types/orchestrator';

/**
 * Factory responsible for creating all use case instances.
 * Follows the Single Responsibility Principle by focusing exclusively on use case creation.
 */
export class UseCaseFactory {
  /**
   * @description Creates ProcessNotificationUseCase
   * @param {UseCaseDependencies} deps - Use case dependencies
   * @returns {ProcessNotificationUseCase} Configured ProcessNotificationUseCase instance
   */
  static createProcessNotificationUseCase(deps: UseCaseDependencies): ProcessNotificationUseCase {
    return new ProcessNotificationUseCase(
      deps.notificationRepository,
      deps.deliveryService,
      deps.templateService,
      deps.eventProcessor,
      deps.logger
    );
  }

  /**
   * @description Creates SendNotificationUseCase
   * @param {UseCaseDependencies} deps - Use case dependencies
   * @returns {SendNotificationUseCase} Configured SendNotificationUseCase instance
   */
  static createSendNotificationUseCase(deps: UseCaseDependencies): SendNotificationUseCase {
    return new SendNotificationUseCase(
      deps.notificationRepository,
      deps.deliveryService,
      deps.templateService,
      deps.logger
    );
  }

  /**
   * @description Creates RetryNotificationUseCase
   * @param {UseCaseDependencies} deps - Use case dependencies
   * @returns {RetryNotificationUseCase} Configured RetryNotificationUseCase instance
   */
  static createRetryNotificationUseCase(deps: UseCaseDependencies): RetryNotificationUseCase {
    return new RetryNotificationUseCase(
      deps.notificationRepository,
      deps.deliveryService,
      deps.templateService,
      deps.logger
    );
  }

  /**
   * @description Creates all use cases in a single operation
   * @param {UseCaseDependencies} deps - Use case dependencies
   * @returns {Object} Object containing all use case instances
   */
  static createAll(deps: UseCaseDependencies) {
    return {
      processNotificationUseCase: this.createProcessNotificationUseCase(deps),
      sendNotificationUseCase: this.createSendNotificationUseCase(deps),
      retryNotificationUseCase: this.createRetryNotificationUseCase(deps)
    };
  }
}

