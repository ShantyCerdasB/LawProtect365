/**
 * @fileoverview EventBridgeHandler - Lambda handler for processing EventBridge events
 * @summary Handles EventBridge events and delegates to NotificationOrchestrator
 * @description This handler processes events from EventBridge (e.g., ENVELOPE_INVITATION,
 * SIGNER_DECLINED, KYC_COMPLETED) and delegates notification processing to the orchestrator.
 * It follows the LambdaTriggerBase pattern for consistent error handling and logging.
 */

import { LambdaTriggerBase, createLogger, type Logger } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';
import type { EventBridgeEvent } from '../domain/types/events';
import type { ProcessNotificationResult } from '../domain/types/orchestrator';
import { EventBridgeEventMapper } from '../domain/mappers';
import { EventBridgeEventSchema, validateEventPayload } from '../domain/schemas';
import { eventMalformed } from '../notification-errors';

/**
 * Handler result type (alias for ProcessNotificationResult)
 */
export type EventBridgeHandlerResult = ProcessNotificationResult;

/**
 * EventBridge handler that processes notification events
 * @summary Processes EventBridge events and delegates to NotificationOrchestrator
 * @description This handler follows SRP by only handling Lambda trigger concerns
 * and delegating all business logic to the NotificationOrchestrator.
 * Uses structured logging via shared-ts logger for CloudWatch integration.
 */
export class EventBridgeHandler extends LambdaTriggerBase<EventBridgeEvent, EventBridgeHandlerResult> {
  private orchestrator!: CompositionRoot['notificationOrchestrator'];
  private logger!: Logger;
  private compositionRoot!: CompositionRoot;

  /**
   * Process the EventBridge event
   * @param event - The EventBridge event
   * @returns Promise that resolves to the processing result
   */
  protected async processEvent(event: EventBridgeEvent): Promise<EventBridgeHandlerResult> {
    const requestId = this.getRequestId(event) || event.id || 'unknown';

    // Lazy initialization of composition root and logger
    if (!this.compositionRoot) {
      this.compositionRoot = await CompositionRoot.build();
      this.orchestrator = this.compositionRoot.notificationOrchestrator;
      this.logger = this.compositionRoot.logger.child({ requestId, component: 'EventBridgeHandler' });
    }

    this.logger.info('Processing EventBridge event', {
      eventId: event.id,
      source: event.source,
      detailType: event['detail-type'],
      time: event.time
    });

    try {
      // Validate EventBridge event structure
      const validationResult = EventBridgeEventSchema.safeParse(event);
      if (!validationResult.success) {
        this.logger.warn('EventBridge event validation failed', {
          eventId: event.id,
          source: event.source,
          errors: validationResult.error.errors
        });
        throw eventMalformed({
          eventId: event.id,
          source: event.source,
          validationErrors: validationResult.error.errors
        });
      }

      // Validate event payload against specific schema for this event type
      const validatedPayload = validateEventPayload(
        event.source,
        event['detail-type'],
        event.detail as Record<string, unknown>
      );
      
      // Replace detail with validated payload
      const validatedEvent = {
        ...event,
        detail: validatedPayload
      };

      // Transform EventBridge event to domain request using mapper
      const request = EventBridgeEventMapper.toProcessNotificationRequest(validatedEvent);

      // Process the event through the orchestrator and get the result
      const result = await this.orchestrator.processNotification(request);

      // Use the result from orchestrator (not hardcoded)
      const handlerResult: EventBridgeHandlerResult = {
        ...result,
        requestId // Ensure requestId is set from handler context
      };

      this.logger.info('EventBridge event processed', {
        eventId: event.id,
        eventType: event['detail-type'],
        success: result.success,
        processedCount: result.processedCount,
        failedCount: result.failedCount,
        notificationsSent: result.notificationsSent,
        notificationsFailed: result.notificationsFailed
      });

      return handlerResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Failed to process EventBridge event', {
        eventId: event.id,
        eventType: event['detail-type'],
        source: event.source,
        error: errorMessage,
        stack: errorStack
      });

      // Re-throw to ensure Lambda knows the event failed
      throw error;
    }
  }

  /**
   * Extract request ID from the event for logging purposes
   * @param event - The EventBridge event
   * @returns Request ID if available, undefined otherwise
   */
  protected getRequestId(event: EventBridgeEvent): string | undefined {
    // EventBridge events have an 'id' field that can be used as request ID
    return event.id;
  }
}

/**
 * Lambda handler function for EventBridge events
 * @param event - The EventBridge event (can be a single event or an array of events)
 * @returns Promise that resolves to the processing result
 */
export const handler = async (
  event: EventBridgeEvent | EventBridgeEvent[]
): Promise<EventBridgeHandlerResult | EventBridgeHandlerResult[]> => {
  // Create logger for batch processing
  const logger = createLogger({
    service: 'notifications-service',
    component: 'EventBridgeHandler',
    env: process.env.NODE_ENV || 'development'
  });

  const trigger = new EventBridgeHandler();

  // EventBridge can send a single event or an array of events
  if (Array.isArray(event)) {
    logger.info('Processing batch of EventBridge events', {
      batchSize: event.length
    });

    const results: EventBridgeHandlerResult[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const singleEvent of event) {
      try {
        const result = await trigger.handler(singleEvent);
        results.push(result);
        processedCount += result.processedCount;
        failedCount += result.failedCount;
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to process event in batch', {
          eventId: singleEvent.id,
          error: errorMessage
        });
        // Continue processing other events even if one fails
      }
    }

    logger.info('Batch processing completed', {
      totalEvents: event.length,
      processedCount,
      failedCount
    });

    return results;
  }

  // Single event
  return trigger.handler(event);
};

