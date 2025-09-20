/**
 * @fileoverview EnvelopeEventService - Event service for envelope events
 * @summary Handles envelope-specific domain events
 * @description This service handles envelope-specific domain events and
 * provides event publishing functionality for envelope operations.
 */

import { BaseEventService, DomainEvent } from '@lawprotect/shared-ts';
import { Envelope } from '../../domain/entities/Envelope';
import { EnvelopeStatus } from '../../domain/enums/EnvelopeStatus';

/**
 * EnvelopeEventService implementation
 * 
 * Handles envelope-specific domain events and provides event publishing
 * functionality for envelope operations.
 */
export class EnvelopeEventService extends BaseEventService {
  /**
   * Publishes a module-specific event
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(event: DomainEvent, traceId?: string): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
  /**
   * Publishes envelope created event
   * @param envelope - The created envelope
   * @param userId - The user who created the envelope
   */
  async publishEnvelopeCreated(envelope: Envelope, userId: string): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.created', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      description: metadata.description,
      status: envelope.getStatus(),
      ownerId: envelope.getOwnerId(),
      documentId: envelope.getDocumentId(),
      expiresAt: metadata.expiresAt?.toISOString(),
      createdAt: envelope.getCreatedAt().toISOString(),
      userId
    });
  }

  /**
   * Publishes envelope updated event
   * @param envelope - The updated envelope
   * @param userId - The user who updated the envelope
   * @param changes - The changes made to the envelope
   */
  async publishEnvelopeUpdated(envelope: Envelope, userId: string, changes: Record<string, unknown>): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.updated', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      description: metadata.description,
      status: envelope.getStatus(),
      ownerId: envelope.getOwnerId(),
      changes,
      updatedAt: envelope.getUpdatedAt().toISOString(),
      userId
    });
  }

  /**
   * Publishes envelope status changed event
   * @param envelope - The envelope
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   * @param userId - The user who changed the status
   */
  async publishEnvelopeStatusChanged(
    envelope: Envelope,
    oldStatus: EnvelopeStatus,
    newStatus: EnvelopeStatus,
    userId: string
  ): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.status_changed', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      ownerId: envelope.getOwnerId(),
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes envelope deleted event
   * @param envelopeId - The deleted envelope ID
   * @param title - The envelope title
   * @param ownerId - The envelope owner ID
   * @param userId - The user who deleted the envelope
   */
  async publishEnvelopeDeleted(
    envelopeId: string,
    title: string,
    ownerId: string,
    userId: string
  ): Promise<void> {
    await this.publishEvent('envelope.deleted', {
      envelopeId,
      title,
      ownerId,
      deletedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes envelope expired event
   * @param envelope - The expired envelope
   */
  async publishEnvelopeExpired(envelope: Envelope): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.expired', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      ownerId: envelope.getOwnerId(),
      expiresAt: metadata.expiresAt?.toISOString(),
      expiredAt: new Date().toISOString()
    });
  }

  /**
   * Publishes envelope completed event
   * @param envelope - The completed envelope
   * @param completedAt - When the envelope was completed
   */
  async publishEnvelopeCompleted(envelope: Envelope, completedAt: Date): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.completed', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      ownerId: envelope.getOwnerId(),
      completedAt: completedAt.toISOString()
    });
  }

  /**
   * Publishes envelope cancelled event
   * @param envelope - The cancelled envelope
   * @param cancelledAt - When the envelope was cancelled
   * @param reason - The reason for cancellation
   */
  async publishEnvelopeCancelled(envelope: Envelope, cancelledAt: Date, reason?: string): Promise<void> {
    const metadata = envelope.getMetadata();
    await this.publishEvent('envelope.cancelled', {
      envelopeId: envelope.getId().getValue(),
      title: metadata.title,
      ownerId: envelope.getOwnerId(),
      cancelledAt: cancelledAt.toISOString(),
      reason
    });
  }

}

