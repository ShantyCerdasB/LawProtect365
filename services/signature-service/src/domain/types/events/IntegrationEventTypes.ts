/**
 * @fileoverview Integration Event Types - Type definitions for signature service events
 * @summary Type definitions for integration events emitted by the signature service
 * @description Defines the contracts and payload structures for all integration events
 * that are published by the signature service to other microservices.
 */

import { EventNames } from '../../enums/EventNames';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { ParticipantRole } from '@prisma/client';

/**
 * Integration event names supported by the signature service
 */
export type EventName = `${EventNames}`;

/**
 * Generic integration event envelope
 * @template TName Event name
 * @template TPayload Event payload type
 */
export interface IntegrationEvent<TName extends EventName = EventName, TPayload = unknown> {
  name: TName;
  payload: TPayload;
}

/**
 * Payload for ENVELOPE_INVITATION events
 */
export interface EnvelopeInvitationPayload {
  envelopeId: string;
  signerId: string;
  signerEmail?: string;
  signerName?: string;
  message: string;
  invitationToken?: string;
  metadata: {
    envelopeTitle: string;
    envelopeId: string;
    sentBy: string;
    sentAt: string;
  };
}

/**
 * Payload for DOCUMENT_VIEW_INVITATION events
 */
export interface ViewerInvitationPayload {
  envelopeId: string;
  viewerEmail: string;
  viewerName: string;
  message: string;
  invitationToken: string;
  expiresAt: string;
  metadata: {
    envelopeTitle: string;
    envelopeId: string;
    sentBy: string;
    sentAt: string;
    participantRole: ParticipantRole;
  };
}

/**
 * Payload for SIGNER_DECLINED events
 */
export interface SignerDeclinedPayload {
  envelopeId: string;
  signerId: string;
  signerEmail?: string;
  signerName?: string;
  declineReason: string;
  metadata: {
    envelopeTitle: string;
    envelopeId: string;
    declinedAt: string;
    declinedBy: string;
  } & NetworkSecurityContext;
}

/**
 * Payload for ENVELOPE_CANCELLED events
 */
export interface EnvelopeCancelledPayload {
  envelopeId: string;
  cancelledByUserId: string;
  envelopeTitle: string;
  envelopeStatus: string;
  metadata: {
    envelopeId: string;
    cancelledAt: string;
    cancelledBy: string;
  } & NetworkSecurityContext;
}

/**
 * Payload for REMINDER_NOTIFICATION events
 */
export interface ReminderNotificationPayload {
  envelopeId: string;
  signerId: string;
  message: string;
  reminderCount: number;
  timestamp: string;
  source: 'signature-service';
  version: '1.0';
}

/**
 * Payload for DOCUMENT_SIGNED events
 */
export interface DocumentSignedPayload {
  documentId: string;
  envelopeId: string;
  signedPdfS3Key: string;
  signatureHash: string;
  signedAt: string;
}