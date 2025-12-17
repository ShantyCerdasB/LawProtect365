/**
 * @fileoverview UseCaseDependencies - Dependencies for use case factories
 * @summary Defines the dependency structure for use case creation
 * @description This interface specifies all dependencies required to create
 * use case instances, promoting clean dependency injection and testability.
 */

import type { NotificationRepository } from '../repository';
import type { NotificationDeliveryService } from '../../../services/domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../../services/domain/NotificationTemplateService';
import type { NotificationEventProcessor } from '../../../services/orchestrators/processors/NotificationEventProcessor';
import type { Logger } from '@lawprotect/shared-ts';

/**
 * Dependencies required for use case creation
 */
export interface UseCaseDependencies {
  notificationRepository: NotificationRepository;
  deliveryService: NotificationDeliveryService;
  templateService: NotificationTemplateService;
  eventProcessor: NotificationEventProcessor;
  logger: Logger;
}

