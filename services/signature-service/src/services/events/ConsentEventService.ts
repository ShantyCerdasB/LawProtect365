/**
 * @fileoverview ConsentEventService - Event service for consent events
 * @summary Handles consent-specific domain events
 * @description This service handles consent-specific domain events and
 * provides event publishing functionality for consent operations.
 */

import { BaseEventService, DomainEvent } from '@lawprotect/shared-ts';
import { ConsentEventTypes } from '../../domain/enums/ConsentEventTypes';

/**
 * ConsentEventService implementation
 * 
 * Handles consent-specific domain events and provides event publishing
 * functionality for consent operations.
 */
export class ConsentEventService extends BaseEventService {
  /**
   * Publishes a module-specific event
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(event: DomainEvent, traceId?: string): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
  /**
   * Publishes consent given event
   * @param consentId - The consent ID
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   */
  async publishConsentGiven(
    consentId: string,
    signerId: string,
    envelopeId: string,
    userId: string
  ): Promise<void> {
    await this.publishEvent(ConsentEventTypes.GIVEN, {
      consentId,
      signerId,
      envelopeId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publishes consent revoked event
   * @param consentId - The consent ID
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   */
  async publishConsentRevoked(
    consentId: string,
    signerId: string,
    envelopeId: string,
    userId: string
  ): Promise<void> {
    await this.publishEvent(ConsentEventTypes.REVOKED, {
      consentId,
      signerId,
      envelopeId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

}
