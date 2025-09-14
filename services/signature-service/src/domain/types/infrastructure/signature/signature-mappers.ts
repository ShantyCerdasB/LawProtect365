/**
 * @fileoverview Signature DynamoDB mappers - Mappers for signature DynamoDB operations
 * @summary Mappers for converting between signature domain entities and DynamoDB items
 * @description Provides mappers for converting signature entities to/from DynamoDB items,
 * including type guards and validation functions.
 */

import { Signature } from '../../../entities/Signature';
import { SignatureId } from '../../../value-objects/SignatureId';
import type { SignatureDdbItem } from './signature-ddb-types';
import { SignatureKeyBuilders } from './signature-ddb-types';
import { DdbMapperUtils } from '../common/dynamodb-mappers';

/**
 * Type guard for signature DynamoDB items
 * Validates that an object has the structure of a SignatureDdbItem
 */
export function isSignatureDdbItem(item: unknown): item is SignatureDdbItem {
  const obj = item as Partial<SignatureDdbItem> | null | undefined;
  
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const requiredFields = [
    'pk', 'sk', 'type', 'signatureId', 'envelopeId', 'signerId',
    'documentHash', 'signatureHash', 's3Key', 'kmsKeyId', 'algorithm',
    'timestamp', 'status', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk',
    'gsi3pk', 'gsi3sk', 'createdAt', 'updatedAt'
  ];

  return requiredFields.every(field => 
    typeof obj[field as keyof SignatureDdbItem] === 'string'
  );
}

/**
 * Converts signature entity to DynamoDB item
 * @param signature - The signature entity
 * @returns DynamoDB item
 */
export function signatureToDdbItem(signature: Signature): SignatureDdbItem {
  const signatureId = signature.getId().getValue();
  const envelopeId = signature.getEnvelopeId();
  const signerId = signature.getSignerId();
  const timestamp = signature.getTimestamp().toISOString();
  const status = signature.getStatus();
  const metadata = signature.getMetadata();

  return {
    pk: SignatureKeyBuilders.buildPrimaryKey(signatureId).pk,
    sk: SignatureKeyBuilders.buildPrimaryKey(signatureId).sk,
    type: 'Signature',
    signatureId,
    envelopeId,
    signerId,
    documentHash: signature.getDocumentHash(),
    signatureHash: signature.getSignatureHash(),
    s3Key: signature.getS3Key(),
    kmsKeyId: signature.getKmsKeyId(),
    algorithm: signature.getAlgorithm(),
    timestamp,
    status,
    reason: metadata.reason,
    location: metadata.location,
    certificateInfo: metadata.certificateInfo ? {
      issuer: metadata.certificateInfo.issuer,
      subject: metadata.certificateInfo.subject,
      validFrom: metadata.certificateInfo.validFrom.toISOString(),
      validTo: metadata.certificateInfo.validTo.toISOString(),
      certificateHash: metadata.certificateInfo.certificateHash
    } : undefined,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    gsi1pk: SignatureKeyBuilders.buildGsi1Key(envelopeId, signatureId).gsi1pk,
    gsi1sk: SignatureKeyBuilders.buildGsi1Key(envelopeId, signatureId).gsi1sk,
    gsi2pk: SignatureKeyBuilders.buildGsi2Key(signerId, signatureId).gsi2pk,
    gsi2sk: SignatureKeyBuilders.buildGsi2Key(signerId, signatureId).gsi2sk,
    gsi3pk: SignatureKeyBuilders.buildGsi3Key(status, signatureId).gsi3pk,
    gsi3sk: SignatureKeyBuilders.buildGsi3Key(status, signatureId).gsi3sk,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Converts DynamoDB item to signature entity
 * @param item - The DynamoDB item
 * @returns Signature entity
 */
export function signatureFromDdbItem(item: SignatureDdbItem): Signature {
  const metadata = {
    reason: item.reason,
    location: item.location,
    certificateInfo: item.certificateInfo ? {
      issuer: item.certificateInfo.issuer,
      subject: item.certificateInfo.subject,
      validFrom: new Date(item.certificateInfo.validFrom),
      validTo: new Date(item.certificateInfo.validTo),
      certificateHash: item.certificateInfo.certificateHash
    } : undefined,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent
  };

  return new Signature(
    new SignatureId(item.signatureId),
    item.envelopeId,
    item.signerId,
    item.documentHash,
    item.signatureHash,
    item.s3Key,
    item.kmsKeyId,
    item.algorithm,
    new Date(item.timestamp),
    item.status as any, // Will be properly typed when SignatureStatus enum is imported
    metadata
  );
}

/**
 * Creates a signature entity from a create request
 * @param request - The create signature request
 * @returns Signature entity
 */
export function createSignatureFromRequest(request: {
  id: SignatureId;
  envelopeId: string;
  signerId: string;
  documentHash: string;
  signatureHash: string;
  s3Key: string;
  kmsKeyId: string;
  algorithm: string;
  timestamp: Date;
  status: string;
  reason?: string;
  location?: string;
  certificateInfo?: {
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    certificateHash: string;
  };
  ipAddress?: string;
  userAgent?: string;
}): Signature {
  const metadata = {
    reason: request.reason,
    location: request.location,
    certificateInfo: request.certificateInfo,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent
  };

  return new Signature(
    request.id,
    request.envelopeId,
    request.signerId,
    request.documentHash,
    request.signatureHash,
    request.s3Key,
    request.kmsKeyId,
    request.algorithm,
    request.timestamp,
    request.status as any, // Will be properly typed when SignatureStatus enum is imported
    metadata
  );
}

/**
 * Generic mapper for signature DynamoDB operations
 * Uses DdbMapperUtils.createMapper for consistent mapping behavior
 */
export const signatureDdbMapper = DdbMapperUtils.createMapper(
  'Signature',
  ['pk', 'sk', 'type', 'signatureId', 'envelopeId', 'signerId', 'documentHash', 'signatureHash', 's3Key', 'kmsKeyId', 'algorithm', 'timestamp', 'status', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk', 'gsi3pk', 'gsi3sk', 'createdAt', 'updatedAt'],
  signatureToDdbItem,
  signatureFromDdbItem
);
