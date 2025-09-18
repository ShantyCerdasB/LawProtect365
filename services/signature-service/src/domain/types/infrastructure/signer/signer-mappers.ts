/**
 * @fileoverview Signer DynamoDB mappers - Mappers for signer DynamoDB operations
 * @summary Mappers for converting between signer domain entities and DynamoDB items
 * @description Provides mappers for converting signer entities to/from DynamoDB items,
 * including type guards and validation functions.
 */

import { Signer } from '../../../entities/Signer';
import { SignerId } from '../../../value-objects/SignerId';
import { Email } from '../../../value-objects/Email';
import type { SignerDdbItem } from './signer-ddb-types';
import { SignerKeyBuilders } from './signer-ddb-types';
import { DdbMapperUtils } from '../common/dynamodb-mappers';

/**
 * Type guard for signer DynamoDB items
 * Validates that an object has the structure of a SignerDdbItem
 */
export function isSignerDdbItem(item: unknown): item is SignerDdbItem {
  const obj = item as Partial<SignerDdbItem> | null | undefined;
  
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const requiredStringFields: Array<keyof SignerDdbItem> = [
    'pk', 'sk', 'type', 'signerId', 'envelopeId', 'email', 'fullName',
    'status', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk',
    'gsi3pk', 'gsi3sk', 'createdAt', 'updatedAt'
  ];

  const stringsOk = requiredStringFields.every((field) => typeof (obj as any)[field] === 'string');
  const orderOk = typeof (obj as any).order === 'number';
  const consentOk = typeof (obj as any).consentGiven === 'boolean';

  return stringsOk && orderOk && consentOk;
}

/**
 * Converts signer entity to DynamoDB item
 * @param signer - The signer entity
 * @returns DynamoDB item
 */
export function signerToDdbItem(signer: Signer): SignerDdbItem {
  const signerId = signer.getId().getValue();
  const envelopeId = signer.getEnvelopeId();
  const email = signer.getEmail().getValue();
  const status = signer.getStatus();
  const metadata = signer.getMetadata();

  const item: SignerDdbItem = {
    pk: SignerKeyBuilders.buildPrimaryKey(signerId).pk,
    sk: SignerKeyBuilders.buildPrimaryKey(signerId).sk,
    type: 'Signer',
    signerId,
    envelopeId,
    email,
    fullName: signer.getFullName(),
    status,
    order: signer.getOrder(),
    signedAt: signer.getSignedAt()?.toISOString(),
    declinedAt: signer.getDeclinedAt()?.toISOString(),
    invitationToken: signer.getInvitationToken(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    consentGiven: metadata.consentGiven,
    consentTimestamp: metadata.consentTimestamp?.toISOString(),
    declineReason: metadata.declineReason,
    gsi1pk: SignerKeyBuilders.buildGsi1Key(envelopeId, signerId).gsi1pk,
    gsi1sk: SignerKeyBuilders.buildGsi1Key(envelopeId, signerId).gsi1sk,
    gsi2pk: SignerKeyBuilders.buildGsi2Key(email, signerId).gsi2pk,
    gsi2sk: SignerKeyBuilders.buildGsi2Key(email, signerId).gsi2sk,
    gsi3pk: SignerKeyBuilders.buildGsi3Key(status, signerId).gsi3pk,
    gsi3sk: SignerKeyBuilders.buildGsi3Key(status, signerId).gsi3sk,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add GSI4 key if invitation token exists
  if (signer.getInvitationToken()) {
    const gsi4Key = SignerKeyBuilders.buildGsi4Key(signer.getInvitationToken()!, signerId);
    item.gsi4pk = gsi4Key.gsi4pk;
    item.gsi4sk = gsi4Key.gsi4sk;
  }

  return item;
}

/**
 * Converts DynamoDB item to signer entity
 * @param item - The DynamoDB item
 * @returns Signer entity
 */
export function signerFromDdbItem(item: SignerDdbItem): Signer {
  const metadata = {
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    consentGiven: item.consentGiven,
    consentTimestamp: item.consentTimestamp ? new Date(item.consentTimestamp) : undefined,
    declineReason: item.declineReason
  };

  return new Signer(
    new SignerId(item.signerId),
    item.envelopeId,
    new Email(item.email),
    item.fullName,
    item.status as any, // Will be properly typed when SignerStatus enum is imported
    item.order,
    item.signedAt ? new Date(item.signedAt) : undefined,
    item.declinedAt ? new Date(item.declinedAt) : undefined,
    item.invitationToken,
    metadata
  );
}

/**
 * Creates a signer entity from a create request
 * @param request - The create signer request
 * @returns Signer entity
 */
export function createSignerFromRequest(request: {
  id: SignerId;
  envelopeId: string;
  email: string;
  fullName: string;
  status: string;
  order: number;
  signedAt?: Date;
  declinedAt?: Date;
  invitationToken?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    consentGiven: boolean;
    consentTimestamp?: Date;
    declineReason?: string;
  };
}): Signer {
  return new Signer(
    request.id,
    request.envelopeId,
    new Email(request.email),
    request.fullName,
    request.status as any, // Will be properly typed when SignerStatus enum is imported
    request.order,
    request.signedAt,
    request.declinedAt,
    request.invitationToken,
    request.metadata
  );
}

/**
 * Generic mapper for signer DynamoDB operations
 * Uses DdbMapperUtils.createMapper for consistent mapping behavior
 */
export const signerDdbMapper = DdbMapperUtils.createMapper(
  'Signer',
  ['pk', 'sk', 'type', 'signerId', 'envelopeId', 'email', 'fullName', 'status', 'order', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk', 'gsi3pk', 'gsi3sk', 'createdAt', 'updatedAt'],
  signerToDdbItem,
  signerFromDdbItem
);
