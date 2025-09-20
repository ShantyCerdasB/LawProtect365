/**
 * @fileoverview EnvelopeService utilities - Utility functions for EnvelopeService operations
 * @summary Helper functions for envelope business logic
 * @description Provides utility functions for EnvelopeService operations including
 * event publishing, validation, and common business logic patterns.
 */

import { SignerRepository } from '@/repositories/SignerRepository';
import { EnvelopeEventService } from '@/services/events/EnvelopeEventService';
import { EnvelopeEventTypes } from '@/domain/enums/EnvelopeEventTypes';
import { EventPublishResult } from '@/domain/types/envelope-service';

/**
 * Utility class for EnvelopeService operations
 */
export class EnvelopeServiceUtils {
  /**
   * Determines if an event should be published based on signer count
   * @param signerRepository - Repository for signer operations
   * @param envelopeId - The envelope ID to check
   * @returns Promise that resolves to true if event should be published
   */
  static async shouldPublishEvent(
    signerRepository: SignerRepository,
    envelopeId: string
  ): Promise<boolean> {
    const signers = await signerRepository.getByEnvelope(envelopeId);
    return (signers.items?.length ?? 0) > 1;
  }

  /**
   * Publishes an event safely with error handling
   * @param eventService - Event service for publishing
   * @param eventType - Type of event to publish
   * @param payload - Event payload data
   * @returns Promise that resolves to publish result
   */
  static async publishEventSafely(
    eventService: EnvelopeEventService,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<EventPublishResult> {
    try {
      await eventService.publishEvent(eventType, payload);
      return { published: true };
    } catch (error) {
      console.warn(`Failed to publish event ${eventType}:`, error);
      return { 
        published: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Publishes an event conditionally based on signer count
   * @param signerRepository - Repository for signer operations
   * @param eventService - Event service for publishing
   * @param envelopeId - The envelope ID
   * @param eventType - Type of event to publish
   * @param payload - Event payload data
   * @returns Promise that resolves to publish result
   */
  static async publishEventConditionally(
    signerRepository: SignerRepository,
    eventService: EnvelopeEventService,
    envelopeId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<EventPublishResult> {
    const shouldPublish = await this.shouldPublishEvent(signerRepository, envelopeId);
    if (!shouldPublish) {
      return { published: false, error: 'Not enough signers to publish event' };
    }
    
    return this.publishEventSafely(eventService, eventType, payload);
  }

  /**
   * Publishes envelope created event conditionally
   * @param signerRepository - Repository for signer operations
   * @param eventService - Event service for publishing
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @param title - The envelope title
   * @param status - The envelope status
   * @returns Promise that resolves to publish result
   */
  static async publishEnvelopeCreatedEvent(
    signerRepository: SignerRepository,
    eventService: EnvelopeEventService,
    envelopeId: string,
    userId: string,
    title: string,
    status: string
  ): Promise<EventPublishResult> {
    return this.publishEventConditionally(
      signerRepository,
      eventService,
      envelopeId,
      EnvelopeEventTypes.CREATED,
      {
        envelopeId,
        userId,
        title,
        status
      }
    );
  }

  /**
   * Publishes envelope updated event conditionally
   * @param signerRepository - Repository for signer operations
   * @param eventService - Event service for publishing
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @param changes - The changes made to the envelope
   * @returns Promise that resolves to publish result
   */
  static async publishEnvelopeUpdatedEvent(
    signerRepository: SignerRepository,
    eventService: EnvelopeEventService,
    envelopeId: string,
    userId: string,
    changes: Record<string, unknown>
  ): Promise<EventPublishResult> {
    return this.publishEventConditionally(
      signerRepository,
      eventService,
      envelopeId,
      EnvelopeEventTypes.UPDATED,
      {
        envelopeId,
        userId,
        changes
      }
    );
  }

  /**
   * Publishes envelope status changed event conditionally
   * @param signerRepository - Repository for signer operations
   * @param eventService - Event service for publishing
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   * @returns Promise that resolves to publish result
   */
  static async publishEnvelopeStatusChangedEvent(
    signerRepository: SignerRepository,
    eventService: EnvelopeEventService,
    envelopeId: string,
    userId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<EventPublishResult> {
    return this.publishEventConditionally(
      signerRepository,
      eventService,
      envelopeId,
      EnvelopeEventTypes.STATUS_CHANGED,
      {
        envelopeId,
        userId,
        oldStatus,
        newStatus
      }
    );
  }

  /**
   * Publishes envelope deleted event
   * @param eventService - Event service for publishing
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @returns Promise that resolves to publish result
   */
  static async publishEnvelopeDeletedEvent(
    eventService: EnvelopeEventService,
    envelopeId: string,
    userId: string
  ): Promise<EventPublishResult> {
    return this.publishEventSafely(
      eventService,
      EnvelopeEventTypes.DELETED,
      {
        envelopeId,
        userId
      }
    );
  }
}
