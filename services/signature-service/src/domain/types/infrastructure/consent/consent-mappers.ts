/**
 * @fileoverview Consent DynamoDB mappers - Mappers for consent DynamoDB operations
 * @summary Mappers for converting between consent domain entities and DynamoDB items
 * @description Provides mappers for converting consent entities to/from DynamoDB items,
 * including type guards and validation functions.
 */

import { Consent } from '../../../entities/Consent';
import { ConsentId } from '../../../value-objects/ConsentId';
import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { SignerId } from '../../../value-objects/SignerId';
import { SignatureId } from '../../../value-objects/SignatureId';
import type { ConsentDdbItem } from './consent-ddb-types';
import { ConsentKeyBuilders } from './consent-ddb-types';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Type guard for consent DynamoDB items
 * Validates that an object has the structure of a ConsentDdbItem
 */
export function isConsentDdbItem(item: unknown): item is ConsentDdbItem {
  const obj = item as Partial<ConsentDdbItem> | null | undefined;
  
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const stringFields: Array<keyof ConsentDdbItem> = [
    'pk', 'sk', 'type', 'consentId', 'envelopeId', 'signerId', 'signatureId',
    'consentTimestamp', 'consentText', 'ipAddress', 'userAgent',
    'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk', 'createdAt', 'updatedAt'
  ];

  for (const field of stringFields) {
    if (typeof obj[field] !== 'string') {
      return false;
    }
  }

  if (typeof obj.consentGiven !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Converts consent entity to DynamoDB item
 * @param consent - The consent entity
 * @returns DynamoDB item
 */
export function consentToDdbItem(consent: Consent): ConsentDdbItem {
  const consentId = consent.getId().getValue();
  const envelopeId = consent.getEnvelopeId().getValue();
  const signerId = consent.getSignerId().getValue();
  const signatureId = consent.getSignatureId().getValue();

  const gsi1Key = ConsentKeyBuilders.buildEnvelopeGsi1Key(envelopeId, consentId);
  const gsi2Key = ConsentKeyBuilders.buildSignerGsi2Key(signerId, consentId);

  return {
    pk: `${DynamoDbPrefixes.CONSENT}${consentId}`,
    sk: `META#${consentId}`,
    type: 'Consent',
    consentId,
    envelopeId,
    signerId,
    signatureId,
    consentGiven: consent.getConsentGiven(),
    consentTimestamp: consent.getConsentTimestamp().toISOString(),
    consentText: consent.getConsentText(),
    ipAddress: consent.getIpAddress(),
    userAgent: consent.getUserAgent(),
    gsi1pk: gsi1Key.gsi1pk,
    gsi1sk: gsi1Key.gsi1sk,
    gsi2pk: gsi2Key.gsi2pk,
    gsi2sk: gsi2Key.gsi2sk,
    createdAt: consent.getCreatedAt().toISOString(),
    updatedAt: consent.getUpdatedAt().toISOString()
  };
}

/**
 * Converts DynamoDB item to consent entity
 * @param item - The DynamoDB item
 * @returns Consent entity
 */
export function consentFromDdbItem(item: ConsentDdbItem): Consent {
  return new Consent(
    new ConsentId(item.consentId),
    new EnvelopeId(item.envelopeId),
    new SignerId(item.signerId),
    new SignatureId(item.signatureId),
    item.consentGiven,
    new Date(item.consentTimestamp),
    item.consentText,
    item.ipAddress,
    item.userAgent,
    new Date(item.createdAt),
    new Date(item.updatedAt)
  );
}

/**
 * Creates a new consent entity from creation request
 * @param request - Consent creation request
 * @returns New consent entity
 */
export function createConsentFromRequest(request: {
  id: ConsentId;
  envelopeId: EnvelopeId;
  signerId: SignerId;
  signatureId: SignatureId;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentText: string;
  ipAddress: string;
  userAgent: string;
}): Consent {
  return Consent.create(request);
}
