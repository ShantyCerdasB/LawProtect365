/**
 * @fileoverview SignerEventService - Event service for signer events
 * @summary Handles signer-specific domain events
 * @description This service handles signer-specific domain events and
 * provides event publishing functionality for signer operations.
 */

import { EventService, DomainEvent } from './EventService';
import { Signer } from '../../domain/entities/Signer';
import { SignerStatus } from '@/domain/enums/SignerStatus';

/**
 * SignerEventService implementation
 * 
 * Handles signer-specific domain events and provides event publishing
 * functionality for signer operations.
 */
export class SignerEventService extends EventService {
  /**
   * Publishes a module-specific event
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(event: DomainEvent, traceId?: string): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
  /**
   * Publishes signer created event
   * @param signer - The created signer
   * @param userId - The user who created the signer
   */
  async publishSignerCreated(signer: Signer, userId: string): Promise<void> {
    await this.publishEvent('signer.created', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      status: signer.getStatus(),
      order: signer.getOrder(),
      invitationToken: signer.getInvitationToken(),
      createdAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signer updated event
   * @param signer - The updated signer
   * @param userId - The user who updated the signer
   * @param changes - The changes made to the signer
   */
  async publishSignerUpdated(signer: Signer, userId: string, changes: Record<string, unknown>): Promise<void> {
    await this.publishEvent('signer.updated', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      status: signer.getStatus(),
      order: signer.getOrder(),
      changes,
      updatedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signer status changed event
   * @param signer - The signer
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   * @param userId - The user who changed the status
   */
  async publishSignerStatusChanged(
    signer: Signer,
    oldStatus: SignerStatus,
    newStatus: SignerStatus,
    userId: string
  ): Promise<void> {
    await this.publishEvent('signer.status_changed', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signer deleted event
   * @param signerId - The deleted signer ID
   * @param envelopeId - The envelope ID
   * @param email - The signer email
   * @param userId - The user who deleted the signer
   */
  async publishSignerDeleted(
    signerId: string,
    envelopeId: string,
    email: string,
    userId: string
  ): Promise<void> {
    await this.publishEvent('signer.deleted', {
      signerId,
      envelopeId,
      email,
      deletedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signer invited event
   * @param signer - The invited signer
   * @param invitationToken - The invitation token
   * @param userId - The user who sent the invitation
   */
  async publishSignerInvited(signer: Signer, invitationToken: string, userId: string): Promise<void> {
    await this.publishEvent('signer.invited', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      invitationToken,
      invitedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signer reminder event
   * @param signer - The signer to remind
   * @param userId - The user initiating the reminder
   */
  async publishSignerReminder(signer: Signer, userId: string): Promise<void> {
    await this.publishEvent('signer.reminder', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      status: signer.getStatus(),
      remindedAt: new Date().toISOString(),
      userId
    });
  }


  /**
   * Publishes signer signed event
   * @param signer - The signed signer
   * @param signedAt - When the signer signed
   */
  async publishSignerSigned(signer: Signer, signedAt: Date): Promise<void> {
    await this.publishEvent('signer.signed', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      signedAt: signedAt.toISOString()
    });
  }

  /**
   * Publishes signer declined event
   * @param signer - The declined signer
   * @param declinedAt - When the signer declined
   * @param declineReason - The reason for declining
   */
  async publishSignerDeclined(signer: Signer, declinedAt: Date, declineReason?: string): Promise<void> {
    await this.publishEvent('signer.declined', {
      signerId: signer.getId().getValue(),
      envelopeId: signer.getEnvelopeId(),
      email: signer.getEmail().getValue(),
      fullName: signer.getFullName(),
      declinedAt: declinedAt.toISOString(),
      declineReason
    });
  }
}

