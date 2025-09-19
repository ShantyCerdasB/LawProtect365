/**
 * @fileoverview Envelope DynamoDB mappers - Mappers for envelope DynamoDB operations
 * @summary Mappers for converting between envelope domain entities and DynamoDB items
 * @description Provides mappers for converting envelope entities to/from DynamoDB items,
 * including type guards and validation functions.
 */

import { Envelope } from '../../../entities/Envelope';
import type { EnvelopeDdbItem, EnvelopeListCursorPayload } from './envelope-ddb-types';
import { EnvelopeKeyBuilders } from './envelope-ddb-types';
import { DdbMapperUtils } from '../common/dynamodb-mappers';
import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { SigningOrder } from '../../../value-objects/SigningOrder';
import { Signer } from '../../../entities/Signer';
import { SignerId } from '../../../value-objects/SignerId';
import { Email } from '../../../value-objects/Email';
import { SignerStatus } from '@/domain/enums/SignerStatus';

/**
 * Type guard for envelope DynamoDB items
 * Validates that an object has the structure of an EnvelopeDdbItem.
 */
export function isEnvelopeDdbItem(item: unknown): item is EnvelopeDdbItem {
  const obj = item as Partial<EnvelopeDdbItem> | null | undefined;
  
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check entity type
  if (obj.type !== 'ENVELOPE') {
    return false;
  }

  // Check required fields
  const requiredFields = [
    'pk', 'sk', 'envelopeId', 'documentId', 'ownerId', 'status',
    'signingOrder', 'createdAt', 'updatedAt', 'metadata', 'signers',
    'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk'
  ];

  for (const field of requiredFields) {
    if (!(field in obj) || obj[field as keyof EnvelopeDdbItem] === undefined || obj[field as keyof EnvelopeDdbItem] === null) {
      return false;
    }
  }

  // Check signing order structure
  if (!obj.signingOrder || typeof obj.signingOrder.type !== 'string') {
    return false;
  }

  // Check signers array
  if (!Array.isArray(obj.signers)) {
    return false;
  }

  return true;
}

/**
 * Converts envelope entity to DynamoDB item
 * @param envelope - The envelope entity
 * @returns DynamoDB item
 */
export function envelopeToDdbItem(envelope: Envelope): EnvelopeDdbItem {
  const createdAt = envelope.getCreatedAt().toISOString();
  const updatedAt = envelope.getUpdatedAt().toISOString();
  const envelopeId = envelope.getId().getValue();
  const ownerId = envelope.getOwnerId();
  const status = envelope.getStatus();
  const completedAt = envelope.getCompletedAt()?.toISOString();
  const metadata = envelope.getMetadata();
  const signers = envelope.getSigners().map(signer => ({
    id: signer.getId().getValue(),
    email: signer.getEmail().getValue(),
    fullName: signer.getFullName(),
    status: signer.getStatus(),
    order: signer.getOrder(),
    signedAt: signer.getSignedAt()?.toISOString(),
    declinedAt: signer.getDeclinedAt()?.toISOString(),
    invitationToken: signer.getInvitationToken(),
    metadata: {
      ipAddress: signer.getMetadata().ipAddress,
      userAgent: signer.getMetadata().userAgent,
      consentGiven: signer.getMetadata().consentGiven,
      consentTimestamp: signer.getMetadata().consentTimestamp?.toISOString(),
      declineReason: signer.getMetadata().declineReason
    }
  }));

  // Calculate TTL if envelope has expiration
  const ttl = DdbMapperUtils.calculateTTL(metadata.expiresAt);

  return {
    pk: EnvelopeKeyBuilders.buildPk(envelopeId),
    sk: EnvelopeKeyBuilders.buildMetaSk(),
    type: 'ENVELOPE',
    gsi1pk: EnvelopeKeyBuilders.buildGsi1Pk(),
    gsi1sk: EnvelopeKeyBuilders.buildGsi1Sk(createdAt, envelopeId),
    gsi2pk: EnvelopeKeyBuilders.buildGsi2Pk(ownerId),
    gsi2sk: EnvelopeKeyBuilders.buildGsi2Sk(status, createdAt, envelopeId),
    envelopeId,
    documentId: envelope.getDocumentId(),
    ownerId,
    status,
    signingOrder: {
      type: envelope.getSigningOrder().getType()
    },
    createdAt,
    updatedAt,
    completedAt,
    metadata,
    signers,
    ttl
  };
}

/**
 * Converts DynamoDB item to envelope entity
 * @param item - The DynamoDB item
 * @returns Envelope entity
 */
export function envelopeFromDdbItem(item: EnvelopeDdbItem): Envelope {

  const envelopeId = new EnvelopeId(item.envelopeId);
  const signingOrder = new SigningOrder(item.signingOrder.type);
  
  const signers = item.signers.map(signerData => {
    const signerId = new SignerId(signerData.id);
    const email = new Email(signerData.email);
    const status = signerData.status as typeof SignerStatus[keyof typeof SignerStatus];
    
    const signer = new Signer(
      signerId,
      item.envelopeId,
      email,
      signerData.fullName,
      status,
      signerData.order,
      signerData.signedAt ? new Date(signerData.signedAt) : undefined,
      signerData.declinedAt ? new Date(signerData.declinedAt) : undefined,
      signerData.invitationToken,
      {
        ipAddress: signerData.metadata.ipAddress,
        userAgent: signerData.metadata.userAgent,
        consentGiven: signerData.metadata.consentGiven,
        consentTimestamp: signerData.metadata.consentTimestamp ? new Date(signerData.metadata.consentTimestamp) : undefined,
        declineReason: signerData.metadata.declineReason
      }
    );

    return signer;
  });

  const envelope = new Envelope(
    envelopeId,
    item.documentId,
    item.ownerId,
    item.status,
    signers,
    signingOrder,
    new Date(item.createdAt),
    new Date(item.updatedAt),
    {
      ...item.metadata,
      expiresAt: item.metadata.expiresAt ? new Date(item.metadata.expiresAt) : undefined
    },
    item.completedAt ? new Date(item.completedAt) : undefined
  );

  return envelope;
}

/**
 * Creates envelope list cursor payload
 * @param envelope - The envelope entity
 * @returns Cursor payload
 */
export function createEnvelopeCursorPayload(envelope: Envelope): EnvelopeListCursorPayload {
  return {
    createdAt: envelope.getCreatedAt().toISOString(),
    envelopeId: envelope.getId().getValue(),
    id: envelope.getId().getValue()
  };
}

/**
 * Envelope DynamoDB mapper
 * Complete mapper for envelope DynamoDB operations with type guard.
 */
export const envelopeDdbMapper = DdbMapperUtils.createMapper(
  'ENVELOPE',
  ['pk', 'sk', 'envelopeId', 'documentId', 'ownerId', 'status', 'signingOrder', 'createdAt', 'updatedAt', 'metadata', 'signers'],
  envelopeToDdbItem,
  envelopeFromDdbItem
);
