/**
 * @fileoverview envelopeAuditHelpers - Envelope-specific audit event utilities
 * @summary Specialized audit helpers for envelope operations
 * @description This module provides specific audit event creation functions
 * for envelope-related operations with domain-specific metadata.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { createAuditEvent, AuditEventData } from './auditHelpers';
import { Email, NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Creates audit event for envelope creation
 * @param envelope - The created envelope
 * @param userId - The user creating the envelope
 * @returns Audit event data for envelope creation
 */
export function createEnvelopeCreatedAudit(
  envelope: SignatureEnvelope,
  userId: string
): AuditEventData {
  return createAuditEvent(
    envelope.getId().getValue(),
    AuditEventType.ENVELOPE_CREATED,
    `Envelope "${envelope.getTitle()}" created`,
    userId,
    undefined,
    undefined,
    {
      title: envelope.getTitle(),
      signingOrder: envelope.getSigningOrder().toString(),
      originType: envelope.getOrigin().getType(),
      expiresAt: envelope.getExpiresAt()?.toISOString()
    }
  );
}

/**
 * Creates audit event for envelope updates
 * @param envelope - The updated envelope
 * @param userId - The user updating the envelope
 * @param updatedFields - List of fields that were updated
 * @returns Audit event data for envelope update
 */
export function createEnvelopeUpdatedAudit(
  envelope: SignatureEnvelope,
  userId: string,
  updatedFields: string[]
): AuditEventData {
  return createAuditEvent(
    envelope.getId().getValue(),
    AuditEventType.ENVELOPE_UPDATED,
    `Envelope "${envelope.getTitle()}" updated`,
    userId,
    undefined,
    undefined,
    {
      updatedFields,
      title: envelope.getTitle()
    }
  );
}

/**
 * Creates audit event for envelope cancellation
 * @param envelope - The cancelled envelope
 * @param userId - The user cancelling the envelope
 * @returns Audit event data for envelope cancellation
 */
export function createEnvelopeCancelledAudit(
  envelope: SignatureEnvelope,
  userId: string
): AuditEventData {
  return createAuditEvent(
    envelope.getId().getValue(),
    AuditEventType.ENVELOPE_CANCELLED,
    `Envelope "${envelope.getTitle()}" cancelled`,
    userId,
    undefined,
    undefined,
    {
      title: envelope.getTitle(),
      cancelledAt: envelope.getUpdatedAt().toISOString()
    }
  );
}

/**
 * Creates audit event for document access by external users
 * @param envelopeId - The envelope ID
 * @param signerId - The signer ID
 * @param userId - The external user identifier
 * @param userEmail - The external user email
 * @param securityContext - Security context information
 * @returns Audit event data for document access
 */
export function createDocumentAccessedAudit(
  envelopeId: string,
  signerId: string,
  userId: string,
  userEmail?: Email,
  securityContext?: NetworkSecurityContext
): AuditEventData {
  return createAuditEvent(
    envelopeId,
    AuditEventType.DOCUMENT_ACCESSED,
    'External user accessed envelope document via invitation token',
    userId,
    signerId,
    userEmail,
    {
      signerId,
      externalUserIdentifier: userEmail ? `${userEmail.getValue()}_${userId}` : userId,
      ipAddress: securityContext?.ipAddress,
      userAgent: securityContext?.userAgent,
      country: securityContext?.country
    }
  );
}

/**
 * Creates audit event for document download
 * @param envelopeId - The envelope ID
 * @param userId - The user downloading the document
 * @param userEmail - The user email
 * @param securityContext - Security context information
 * @returns Audit event data for document download
 */
export function createDocumentDownloadedAudit(
  envelopeId: string,
  userId: string,
  userEmail?: Email,
  securityContext?: NetworkSecurityContext
): AuditEventData {
  return createAuditEvent(
    envelopeId,
    AuditEventType.DOCUMENT_DOWNLOADED,
    'Document downloaded',
    userId,
    undefined,
    userEmail,
    {
      ipAddress: securityContext?.ipAddress,
      userAgent: securityContext?.userAgent,
      country: securityContext?.country
    }
  );
}
