/**
 * @fileoverview InvitationToken mappers - DTO to Entity conversion utilities
 * @summary Mappers for invitation token data transformation
 * @description Provides mappers and type guards for converting between
 * DynamoDB items and InvitationToken domain entities.
 */

import { DdbMapperUtils } from '../common/dynamodb-mappers';
import { InvitationToken } from '../../../entities/InvitationToken';
import { InvitationTokenId } from '../../../value-objects/InvitationTokenId';
import { SignerId } from '../../../value-objects/SignerId';
import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { InvitationTokenDdbItem } from './invitation-token-ddb-types';

/**
 * Mapper utility for invitation token DDB items
 */
export const invitationTokenDdbMapper = DdbMapperUtils.createMapper<InvitationToken, InvitationTokenDdbItem>(
  'INVITATION_TOKEN',
  ['pk', 'sk', 'token', 'signerId', 'envelopeId', 'expiresAt', 'createdAt', 'entityType'],
  (entity: InvitationToken): InvitationTokenDdbItem => ({
    pk: `INVITATION_TOKEN#${entity.getToken()}`,
    sk: `INVITATION_TOKEN#${entity.getToken()}`,
    type: 'INVITATION_TOKEN',
    gsi1pk: `SIGNER#${entity.getSignerId().getValue()}`,
    gsi1sk: `INVITATION_TOKEN#${entity.getToken()}`,
    gsi2pk: `ENVELOPE#${entity.getEnvelopeId().getValue()}`,
    gsi2sk: `INVITATION_TOKEN#${entity.getToken()}`,
    gsi3pk: 'INVITATION_TOKEN',
    gsi3sk: `EXPIRES_AT#${entity.getExpiresAt().toISOString()}#${entity.getToken()}`,
    entityType: 'INVITATION_TOKEN',
    token: entity.getToken(),
    signerId: entity.getSignerId().getValue(),
    envelopeId: entity.getEnvelopeId().getValue(),
    expiresAt: entity.getExpiresAt().toISOString(),
    createdAt: entity.getCreatedAt().toISOString(),
    usedAt: entity.getUsedAt()?.toISOString(),
    metadata: entity.getMetadata(),
    ttl: Math.floor(entity.getExpiresAt().getTime() / 1000) + (30 * 24 * 60 * 60) // 30 days after expiration
  }),
  (item: InvitationTokenDdbItem): InvitationToken => {
    return new InvitationToken(
      new InvitationTokenId(item.token), // Use token as ID since they're the same
      item.token,
      new SignerId(item.signerId),
      new EnvelopeId(item.envelopeId),
      new Date(item.expiresAt),
      new Date(item.createdAt),
      item.usedAt ? new Date(item.usedAt) : undefined,
      item.metadata
    );
  }
);

/**
 * Type guard to check if an item is an invitation token DDB item
 */
export function isInvitationTokenDdbItem(item: any): item is InvitationTokenDdbItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.pk === 'string' &&
    typeof item.sk === 'string' &&
    typeof item.token === 'string' &&
    typeof item.signerId === 'string' &&
    typeof item.envelopeId === 'string' &&
    typeof item.expiresAt === 'string' &&
    typeof item.createdAt === 'string' &&
    item.entityType === 'INVITATION_TOKEN'
  );
}
