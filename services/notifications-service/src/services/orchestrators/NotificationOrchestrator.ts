/**
 * @fileoverview NotificationOrchestrator - Application-layer orchestrator for notification processing
 * @summary Thin façade that delegates to use cases
 * @description Application-layer orchestrator that delegates notification processing
 * to use cases. This class should remain free of business logic and act as a thin
 * façade for use cases, similar to SignatureOrchestrator in signature-service.
 */

import type {
  ProcessNotificationRequest,
  ProcessNotificationResult,
  NotificationRequest,
  NotificationOrchestratorDependencies
} from '../../domain/types/orchestrator';

/**
 * Application-layer orchestrator that delegates to use cases.
 * 
 * This class follows the same pattern as SignatureOrchestrator:
 * - Thin façade that delegates to use cases
 * - No business logic
 * - No construction inside (all instantiation in composition builders)
 * - Behavioral parity with use cases
 */
export class NotificationOrchestrator {
  constructor(
    private readonly deps: NotificationOrchestratorDependencies
  ) {}

  /**
   * @description Processes an EventBridge event and sends notifications via appropriate channels
   * @param {ProcessNotificationRequest} request - EventBridge event data
   * @returns {Promise<ProcessNotificationResult>} Processing result with counts and errors
   * @throws {eventTypeUnknown} When event type is not recognized
   * @throws {eventValidationFailed} When event payload is invalid
   * @throws {eventAlreadyProcessed} When event was already processed (idempotency)
   */
  async processNotification(request: ProcessNotificationRequest): Promise<ProcessNotificationResult> {
    return this.deps.processNotificationUseCase.execute(request);
  }

  /**
   * @description Sends a single notification request
   * @param {NotificationRequest} request - Notification request
   * @param {string} eventId - Event ID
   * @param {string} eventType - Event type
   * @param {Record<string, unknown>} [metadata] - Optional metadata
   * @returns {Promise<object>} Send result
   */
  async sendNotification(
    request: NotificationRequest,
    eventId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ) {
    return this.deps.sendNotificationUseCase.execute(request, eventId, eventType, metadata);
  }

  /**
   * @description Retries a failed notification
   * @param {string} notificationId - Notification ID to retry
   * @returns {Promise<object>} Retry result
   */
  async retryNotification(notificationId: string) {
    return this.deps.retryNotificationUseCase.execute(notificationId);
  }
}
