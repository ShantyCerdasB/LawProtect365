/**
 * @fileoverview Envelope Notification Service - Application-level service for integration notifications
 * @summary Service that encapsulates all integration notifications emitted by the signature service
 * @description Application-level service that composes events via the factory and publishes them via the event publisher
 */

import { v4 as uuid } from 'uuid';
import { IntegrationEventFactory } from '../../infrastructure/factories/events/IntegrationEventFactory';
import { IntegrationEventPublisher, nowIso, NetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../../domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../domain/entities/EnvelopeSigner';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { SignerId } from '../../domain/value-objects/SignerId';
import { NotificationTemplates } from '../../domain/value-objects/NotificationTemplates';

/**
 * Application-level service that encapsulates all integration notifications
 * emitted by the signature service. It composes events via the factory and
 * publishes them via the event publisher (outbox-backed).
 */
export class EnvelopeNotificationService {
  constructor(
    private readonly eventFactory: IntegrationEventFactory,
    private readonly eventPublisher: IntegrationEventPublisher
  ) {}

  /**
   * Sends invitation notifications for a list of target signers
   * @param envelope Envelope entity with signers loaded
   * @param targetSigners Signers to notify
   * @param tokens Map signerId -> invitation token (optional)
   * @param fallbackMessage Default message when none is provided
   */
  async sendSignerInvitations(
    envelope: SignatureEnvelope,
    targetSigners: EnvelopeSigner[],
    tokens?: Map<string, string | undefined>,
    fallbackMessage?: string
  ): Promise<void> {
    const sentAtISO = nowIso();
    const tokenMap = tokens ?? new Map<string, string | undefined>();

    for (const signer of targetSigners) {
      const invitationToken = tokenMap.get(signer.getId().getValue());
      const message = fallbackMessage || NotificationTemplates.defaultInviteMessage();

      const ev = this.eventFactory.envelopeInvitation({
        envelope,
        signer,
        message,
        invitationToken,
        sentAtISO
      });

      await this.eventPublisher.publish(ev, uuid());
    }
  }

  /**
   * Sends a viewer invitation for read-only access
   * @param envelope Envelope entity
   * @param email Viewer email
   * @param fullName Viewer full name
   * @param token Invitation token
   * @param expiresAt Token expiration date
   * @param message Optional custom message
   */
  async sendViewerInvitation(
    envelope: SignatureEnvelope,
    email: string,
    fullName: string,
    token: string,
    expiresAt: Date,
    message?: string
  ): Promise<void> {
    const ev = this.eventFactory.viewerInvitation({
      envelope,
      email,
      fullName,
      message: message || NotificationTemplates.defaultViewerMessage(),
      token,
      expiresAtISO: expiresAt.toISOString(),
      sentAtISO: nowIso()
    });

    await this.eventPublisher.publish(ev, uuid());
  }

  /**
   * Publishes a signer-declined notification
   * @param envelope Envelope entity
   * @param signer Signer entity
   * @param reason Decline reason
   * @param security Optional security context
   */
  async publishSignerDeclined(
    envelope: SignatureEnvelope,
    signer: EnvelopeSigner,
    reason: string,
    security?: NetworkSecurityContext
  ): Promise<void> {
    const ev = this.eventFactory.signerDeclined({
      envelope,
      signer,
      reason,
      whenISO: nowIso(),
      ipAddress: security?.ipAddress,
      userAgent: security?.userAgent,
      country: security?.country
    });

    await this.eventPublisher.publish(ev, uuid());
  }

  /**
   * Publishes an envelope-cancelled notification
   * @param envelope Envelope entity
   * @param cancelledByUserId User ID who cancelled the envelope
   * @param security Optional security context
   */
  async publishEnvelopeCancelled(
    envelope: SignatureEnvelope,
    cancelledByUserId: string,
    security?: NetworkSecurityContext
  ): Promise<void> {
    const ev = this.eventFactory.envelopeCancelled({
      envelope,
      cancelledByUserId,
      whenISO: nowIso(),
      ipAddress: security?.ipAddress,
      userAgent: security?.userAgent,
      country: security?.country
    });

    await this.eventPublisher.publish(ev, uuid());
  }

  /**
   * Publishes a reminder notification
   * @param envelopeId Envelope ID
   * @param signerId Signer ID
   * @param message Optional reminder message
   * @param reminderCount Current reminder count
   */
  async publishReminder(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    message: string | undefined,
    reminderCount: number
  ): Promise<void> {
    const ev = this.eventFactory.reminderNotification({
      envelopeId: envelopeId.getValue(),
      signerId: signerId.getValue(),
      message: message || NotificationTemplates.defaultReminderMessage(),
      reminderCount,
      whenISO: nowIso()
    });

    await this.eventPublisher.publish(ev, uuid());
  }
}
