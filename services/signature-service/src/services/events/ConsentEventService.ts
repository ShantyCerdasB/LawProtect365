/**
 * @fileoverview ConsentEventService - Event service for consent events
 * @summary Handles consent-specific domain events
 * @description This service handles consent-specific domain events and
 * provides event publishing functionality for consent operations.
 */

import { EventService, DomainEvent } from './EventService';

/**
 * ConsentEventService implementation
 * 
 * Handles consent-specific domain events and provides event publishing
 * functionality for consent operations.
 */
export class ConsentEventService extends EventService {
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
    const event: DomainEvent = {
      id: consentId,
      type: 'consent.given',
      payload: {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: new Date().toISOString()
      },
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
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
    const event: DomainEvent = {
      id: consentId,
      type: 'consent.revoked',
      payload: {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: new Date().toISOString()
      },
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
  }

}
