/**
 * @fileoverview EventBridgeEventMapper - Mapper for transforming EventBridge events
 * @summary Transforms EventBridge events to domain request types
 * @description This mapper is responsible for converting AWS EventBridge event structures
 * to domain-specific request types. It follows SRP by isolating transformation logic.
 */

import type { EventBridgeEvent } from '../types/events';
import type { ProcessNotificationRequest } from '../types/orchestrator';
import { PayloadExtractor } from '../utils';

/**
 * Mapper for transforming EventBridge events to notification processing requests
 * @summary Converts EventBridge event format to ProcessNotificationRequest
 * @description This mapper handles the transformation between the AWS EventBridge
 * event structure and the domain request type used by the NotificationOrchestrator.
 */
export class EventBridgeEventMapper {
  /**
   * @description Transforms an EventBridge event to a ProcessNotificationRequest
   * @param {EventBridgeEvent} event - The EventBridge event to transform
   * @returns {ProcessNotificationRequest} ProcessNotificationRequest ready for orchestrator processing
   */
  static toProcessNotificationRequest(event: EventBridgeEvent): ProcessNotificationRequest {
    const detail = event.detail as Record<string, unknown>;
    const metadata = PayloadExtractor.extractPayloadMetadata(detail);
    
    return {
      eventId: event.id,
      eventType: event['detail-type'],
      source: event.source,
      payload: detail,
      occurredAt: new Date(event.time),
      metadata: {
        account: event.account,
        region: event.region,
        resources: event.resources,
        userId: PayloadExtractor.extractString(detail, 'userId') || 
                PayloadExtractor.extractString(detail, 'cancelledByUserId'),
        envelopeId: PayloadExtractor.extractString(detail, 'envelopeId'),
        signerId: PayloadExtractor.extractString(detail, 'signerId'),
        recipientLanguage: PayloadExtractor.extractString(detail, 'recipientLanguage') || 
                          PayloadExtractor.extractString(metadata, 'recipientLanguage') ||
                          PayloadExtractor.extractString(detail, 'language') ||
                          PayloadExtractor.extractString(metadata, 'language'),
        source: event.source,
        eventType: event['detail-type']
      }
    };
  }
}

