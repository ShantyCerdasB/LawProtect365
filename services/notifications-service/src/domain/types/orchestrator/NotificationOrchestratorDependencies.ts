/**
 * @fileoverview NotificationOrchestratorDependencies - Dependencies interface for NotificationOrchestrator
 * @summary Defines the dependency structure for NotificationOrchestrator
 * @description This interface defines all use case dependencies required by the NotificationOrchestrator.
 * It follows dependency injection principles by explicitly declaring all dependencies.
 */

import type { ProcessNotificationUseCase } from '../../../services/orchestrators/use-cases/ProcessNotificationUseCase';
import type { SendNotificationUseCase } from '../../../services/orchestrators/use-cases/SendNotificationUseCase';
import type { RetryNotificationUseCase } from '../../../services/orchestrators/use-cases/RetryNotificationUseCase';

/**
 * Dependencies for NotificationOrchestrator
 * 
 * Defines all use case dependencies required by the orchestrator.
 * The orchestrator acts as a thin façade that delegates to these use cases.
 */
export interface NotificationOrchestratorDependencies {
  processNotificationUseCase: ProcessNotificationUseCase;
  sendNotificationUseCase: SendNotificationUseCase;
  retryNotificationUseCase: RetryNotificationUseCase;
}

