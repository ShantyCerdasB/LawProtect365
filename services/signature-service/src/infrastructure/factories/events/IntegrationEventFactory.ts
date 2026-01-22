/**
 * @fileoverview Integration Event Factory - Factory for building integration events
 * @summary Pure factory that constructs integration events from domain entities
 * @description Builds integration events with stable payload shapes for backward compatibility
 */

import { makeEvent, NetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../../../domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../domain/entities/EnvelopeSigner';
import { EventNames } from '../../../domain/enums/EventNames';
import {
  IntegrationEvent,
  EnvelopeInvitationPayload,
  ViewerInvitationPayload,
  SignerDeclinedPayload,
  EnvelopeCancelledPayload,
  ReminderNotificationPayload,
  DocumentSignedPayload
} from '../../../domain/types/events/IntegrationEventTypes';
import { ParticipantRole } from '@prisma/client';

/**
 * Factory for building integration events emitted by the signature service
 * Produces event payloads with a stable shape (backward compatible)
 */
export class IntegrationEventFactory {
  /**
   * Builds an ENVELOPE_INVITATION event for a specific signer
   * @param args Event arguments
   * @returns Integration event ready to be published
   */
  envelopeInvitation(args: {
    envelope: SignatureEnvelope;
    signer: EnvelopeSigner;
    message: string;
    invitationToken?: string;
    sentAtISO: string;
  }): IntegrationEvent<'ENVELOPE_INVITATION', EnvelopeInvitationPayload> {
    const domainEvent = makeEvent(EventNames.ENVELOPE_INVITATION, {
      envelopeId: args.envelope.getId().getValue(),
      signerId: args.signer.getId().getValue(),
      signerEmail: args.signer.getEmail()?.getValue(),
      signerName: args.signer.getFullName(),
      message: args.message,
      invitationToken: args.invitationToken,
      metadata: {
        envelopeTitle: args.envelope.getTitle(),
        envelopeId: args.envelope.getId().getValue(),
        sentBy: args.envelope.getCreatedBy(),
        sentAt: args.sentAtISO
      }
    });
    
    return {
      name: EventNames.ENVELOPE_INVITATION,
      payload: domainEvent.payload
    };
  }

  /**
   * Builds a DOCUMENT_VIEW_INVITATION event for a viewer
   * @param args Event arguments
   * @returns Integration event ready to be published
   */
  viewerInvitation(args: {
    envelope: SignatureEnvelope;
    email: string;
    fullName: string;
    message: string;
    token: string;
    expiresAtISO: string;
    sentAtISO: string;
  }): IntegrationEvent<'DOCUMENT_VIEW_INVITATION', ViewerInvitationPayload> {
    const domainEvent = makeEvent(EventNames.DOCUMENT_VIEW_INVITATION, {
      envelopeId: args.envelope.getId().getValue(),
      viewerEmail: args.email,
      viewerName: args.fullName,
      message: args.message,
      invitationToken: args.token,
      expiresAt: args.expiresAtISO,
      metadata: {
        envelopeTitle: args.envelope.getTitle(),
        envelopeId: args.envelope.getId().getValue(),
        sentBy: args.envelope.getCreatedBy(),
        sentAt: args.sentAtISO,
        participantRole: ParticipantRole.VIEWER
      }
    });
    
    return {
      name: EventNames.DOCUMENT_VIEW_INVITATION,
      payload: domainEvent.payload
    };
  }

  /**
   * Builds a SIGNER_DECLINED event for a signer
   * @param args Event arguments
   * @returns Integration event ready to be published
   */
  signerDeclined(args: {
    envelope: SignatureEnvelope;
    signer: EnvelopeSigner;
    reason: string;
    whenISO: string;
  } & NetworkSecurityContext): IntegrationEvent<'SIGNER_DECLINED', SignerDeclinedPayload> {
    const domainEvent = makeEvent(EventNames.SIGNER_DECLINED, {
      envelopeId: args.envelope.getId().getValue(),
      signerId: args.signer.getId().getValue(),
      signerEmail: args.signer.getEmail()?.getValue(),
      signerName: args.signer.getFullName(),
      declineReason: args.reason,
      metadata: {
        envelopeTitle: args.envelope.getTitle(),
        envelopeId: args.envelope.getId().getValue(),
        declinedAt: args.whenISO,
        declinedBy: args.signer.getFullName() || args.signer.getEmail()?.getValue() || 'Unknown',
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        country: args.country
      }
    });
    
    return {
      name: EventNames.SIGNER_DECLINED,
      payload: domainEvent.payload
    };
  }

  /**
   * Builds an ENVELOPE_CANCELLED event
   * @param args Event arguments
   * @returns Integration event ready to be published
   */
  envelopeCancelled(args: {
    envelope: SignatureEnvelope;
    cancelledByUserId: string;
    whenISO: string;
  } & NetworkSecurityContext): IntegrationEvent<'ENVELOPE_CANCELLED', EnvelopeCancelledPayload> {
    const domainEvent = makeEvent(EventNames.ENVELOPE_CANCELLED, {
      envelopeId: args.envelope.getId().getValue(),
      cancelledByUserId: args.cancelledByUserId,
      envelopeTitle: args.envelope.getTitle(),
      envelopeStatus: args.envelope.getStatus().getValue(),
      metadata: {
        envelopeId: args.envelope.getId().getValue(),
        cancelledAt: args.whenISO,
        cancelledBy: args.cancelledByUserId,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        country: args.country
      }
    });
    
    return {
      name: EventNames.ENVELOPE_CANCELLED,
      payload: domainEvent.payload
    };
  }

  /**
   * Builds a REMINDER_NOTIFICATION event
   * @param args Event arguments
   * @returns Integration event ready to be published
   */
  reminderNotification(args: {
    envelopeId: string;
    signerId: string;
    message: string;
    reminderCount: number;
    whenISO: string;
  }): IntegrationEvent<'REMINDER_NOTIFICATION', ReminderNotificationPayload> {
    const domainEvent = makeEvent(EventNames.REMINDER_NOTIFICATION, {
      envelopeId: args.envelopeId,
      signerId: args.signerId,
      message: args.message,
      reminderCount: args.reminderCount,
      timestamp: args.whenISO,
      source: 'signature-service' as const,
      version: '1.0' as const
    });
    
    return {
      name: EventNames.REMINDER_NOTIFICATION,
      payload: domainEvent.payload
    };
  }

  /**
   * @description
   * Builds a DOCUMENT_SIGNED event when a document is successfully signed.
   * This event is published as a fallback when synchronous HTTP notification to
   * Document Service fails, ensuring eventual consistency.
   * @param {object} args - Event arguments
   * @param {string} args.documentId - Document ID in Document Service
   * @param {string} args.envelopeId - Envelope ID
   * @param {string} args.signedPdfS3Key - S3 key where signed PDF is stored
   * @param {string} args.signatureHash - SHA-256 hash of the signature
   * @param {string} args.signedAt - ISO timestamp when signature was created
   * @returns {IntegrationEvent<'DOCUMENT_SIGNED', DocumentSignedPayload>} Integration event ready to be published
   */
  documentSigned(args: {
    documentId: string;
    envelopeId: string;
    signedPdfS3Key: string;
    signatureHash: string;
    signedAt: string;
  }): IntegrationEvent<'DOCUMENT_SIGNED', DocumentSignedPayload> {
    const domainEvent = makeEvent(EventNames.DOCUMENT_SIGNED, {
      documentId: args.documentId,
      envelopeId: args.envelopeId,
      signedPdfS3Key: args.signedPdfS3Key,
      signatureHash: args.signatureHash,
      signedAt: args.signedAt,
    });
    
    return {
      name: EventNames.DOCUMENT_SIGNED,
      payload: domainEvent.payload
    };
  }
}
