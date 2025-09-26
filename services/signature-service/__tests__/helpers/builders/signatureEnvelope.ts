/**
 * @fileoverview SignatureEnvelope Test Builders - Reusable test data builders for signature envelope repository tests
 * @summary Provides builders for creating test data related to signature envelope entities
 * @description This module provides builders for creating signature envelope-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { SignatureEnvelope } from '../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../../../src/domain/value-objects/EnvelopeStatus';
import { S3Key } from '../../../src/domain/value-objects/S3Key';
import { DocumentHash } from '../../../src/domain/value-objects/DocumentHash';
import { SigningOrder } from '../../../src/domain/value-objects/SigningOrder';
import { DocumentOrigin } from '../../../src/domain/value-objects/DocumentOrigin';
import { EnvelopeSpec } from '../../../src/domain/types/envelope';
import { TestUtils } from '../testUtils';
import { generateTestIpAddress } from '../../integration/helpers/testHelpers';
import { EnvelopeSigner } from '../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { Email } from '../../../src/domain/value-objects/Email';
import { SignerStatus, ParticipantRole } from '@prisma/client';

/**
 * Creates a persistence row for signature envelope with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns SignatureEnvelope persistence row
 * @example
 * const row = signatureEnvelopePersistenceRow({ status: 'DRAFT' });
 */
export function signatureEnvelopePersistenceRow(overrides: Partial<any> = {}) {
  const base = {
    id: TestUtils.generateUuid(),
    createdBy: TestUtils.generateUuid(),
    title: 'Test Document',
    description: 'Test document description',
    status: 'DRAFT',
    signingOrderType: 'OWNER_FIRST',
    originType: 'UPLOAD',
    templateId: null as string | null,
    templateVersion: null as string | null,
    sourceKey: 'test/source/document.pdf',
    metaKey: 'test/meta/document.pdf',
    flattenedKey: null as string | null,
    signedKey: null as string | null,
    sourceSha256: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    flattenedSha256: null as string | null,
    signedSha256: null as string | null,
    sentAt: null as Date | null,
    completedAt: null as Date | null,
    cancelledAt: null as Date | null,
    declinedAt: null as Date | null,
    declinedBySignerId: null as string | null,
    declinedReason: null as string | null,
    expiresAt: null as Date | null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    signers: [],
  };
  return { ...base, ...overrides };
}

/**
 * Creates a signature envelope entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns SignatureEnvelope entity
 * @example
 * const entity = signatureEnvelopeEntity({ title: 'Custom Title' });
 */
export function signatureEnvelopeEntity(overrides: Partial<{
  id: string;
  createdBy: string;
  title: string;
  description: string;
  status: string;
  signingOrder: string;
  origin: string;
  templateId: string;
  templateVersion: string;
  sourceKey: string;
  metaKey: string;
  flattenedKey: string;
  signedKey: string;
  sourceSha256: string;
  flattenedSha256: string;
  signedSha256: string;
  sentAt: Date;
  completedAt: Date;
  cancelledAt: Date;
  declinedAt: Date;
  declinedBySignerId: string;
  declinedReason: string;
  expiresAt: Date;
  signers: EnvelopeSigner[];
}> = {}) {
  const id = EnvelopeId.fromString(overrides.id || TestUtils.generateUuid());
  const createdBy = overrides.createdBy || TestUtils.generateUuid();
  const title = overrides.title || 'Test Document';
  const description = overrides.description || 'Test document description';
  const status = EnvelopeStatus.fromString(overrides.status || 'DRAFT');
  const signingOrder = SigningOrder.fromString(overrides.signingOrder || 'OWNER_FIRST');
  const origin = DocumentOrigin.fromString(overrides.origin || 'UPLOAD');
  const templateId = overrides.templateId || undefined;
  const templateVersion = overrides.templateVersion || undefined;
  const sourceKey = overrides.sourceKey ? S3Key.fromString(overrides.sourceKey) : undefined;
  const metaKey = overrides.metaKey ? S3Key.fromString(overrides.metaKey) : undefined;
  const flattenedKey = overrides.flattenedKey ? S3Key.fromString(overrides.flattenedKey) : undefined;
  const signedKey = overrides.signedKey ? S3Key.fromString(overrides.signedKey) : undefined;
  const sourceSha256 = overrides.sourceSha256 ? DocumentHash.fromString(overrides.sourceSha256) : undefined;
  const flattenedSha256 = overrides.flattenedSha256 ? DocumentHash.fromString(overrides.flattenedSha256) : undefined;
  const signedSha256 = overrides.signedSha256 ? DocumentHash.fromString(overrides.signedSha256) : undefined;
  const sentAt = overrides.sentAt || undefined;
  const completedAt = overrides.completedAt || undefined;
  const cancelledAt = overrides.cancelledAt || undefined;
  const declinedAt = overrides.declinedAt || undefined;
  const declinedBySignerId = overrides.declinedBySignerId ? SignerId.fromString(overrides.declinedBySignerId) : undefined;
  const declinedReason = overrides.declinedReason || undefined;
  const expiresAt = overrides.expiresAt || undefined;
  const signers = overrides.signers || [];

  return SignatureEnvelope.fromPersistence({
    id: id.getValue(),
    createdBy,
    title,
    description,
    status: status.getValue(),
    signingOrderType: signingOrder.getType(),
    originType: origin.getType(),
    templateId,
    templateVersion,
    sourceKey: sourceKey?.getValue(),
    metaKey: metaKey?.getValue(),
    flattenedKey: flattenedKey?.getValue(),
    signedKey: signedKey?.getValue(),
    sourceSha256: sourceSha256?.getValue(),
    flattenedSha256: flattenedSha256?.getValue(),
    signedSha256: signedSha256?.getValue(),
    sentAt,
    completedAt,
    cancelledAt,
    declinedAt,
    declinedBySignerId: declinedBySignerId?.getValue(),
    declinedReason,
    expiresAt,
    signers,
  });
}

/**
 * Creates an envelope specification for testing
 * @param overrides - Partial data to override defaults
 * @returns EnvelopeSpec
 * @example
 * const spec = signatureEnvelopeSpec({ createdBy: 'user123' });
 */
export function signatureEnvelopeSpec(overrides: Partial<EnvelopeSpec> = {}): EnvelopeSpec {
  return {
    createdBy: TestUtils.generateUuid(),
    status: EnvelopeStatus.fromString('DRAFT'),
    title: 'Test Document',
    isExpired: false,
    ...overrides,
  };
}

/**
 * Creates a partial signature envelope entity for testing updates
 * @param overrides - Partial data to override defaults
 * @returns Partial SignatureEnvelope entity
 * @example
 * const partial = partialSignatureEnvelopeEntity({ title: 'Updated Title' });
 */
export function partialSignatureEnvelopeEntity(overrides: Partial<{
  id: string;
  createdBy: string;
  title: string;
  description: string;
  status: string;
  signingOrder: string;
  origin: string;
  templateId: string;
  templateVersion: string;
  sourceKey: string;
  metaKey: string;
  flattenedKey: string;
  signedKey: string;
  sourceSha256: string;
  flattenedSha256: string;
  signedSha256: string;
  sentAt: Date;
  completedAt: Date;
  cancelledAt: Date;
  declinedAt: Date;
  declinedBySignerId: string;
  declinedReason: string;
  expiresAt: Date;
}> = {}) {
  return {
    getId: () => EnvelopeId.fromString(overrides.id || TestUtils.generateUuid()),
    getCreatedBy: () => overrides.createdBy || TestUtils.generateUuid(),
    getTitle: () => overrides.title || 'Test Document',
    getDescription: () => overrides.description || 'Test document description',
    getStatus: () => EnvelopeStatus.fromString(overrides.status || 'DRAFT'),
    getSigningOrder: () => SigningOrder.fromString(overrides.signingOrder || 'OWNER_FIRST'),
    getOrigin: () => DocumentOrigin.fromString(overrides.origin || 'UPLOAD'),
    getTemplateId: () => overrides.templateId || undefined,
    getTemplateVersion: () => overrides.templateVersion || undefined,
    getSourceKey: () => overrides.sourceKey ? S3Key.fromString(overrides.sourceKey) : undefined,
    getMetaKey: () => overrides.metaKey ? S3Key.fromString(overrides.metaKey) : undefined,
    getFlattenedKey: () => overrides.flattenedKey ? S3Key.fromString(overrides.flattenedKey) : undefined,
    getSignedKey: () => overrides.signedKey ? S3Key.fromString(overrides.signedKey) : undefined,
    getSourceSha256: () => overrides.sourceSha256 ? DocumentHash.fromString(overrides.sourceSha256) : undefined,
    getFlattenedSha256: () => overrides.flattenedSha256 ? DocumentHash.fromString(overrides.flattenedSha256) : undefined,
    getSignedSha256: () => overrides.signedSha256 ? DocumentHash.fromString(overrides.signedSha256) : undefined,
    getSentAt: () => overrides.sentAt || undefined,
    getCompletedAt: () => overrides.completedAt || undefined,
    getCancelledAt: () => overrides.cancelledAt || undefined,
    getDeclinedAt: () => overrides.declinedAt || undefined,
    getDeclinedBySignerId: () => overrides.declinedBySignerId ? SignerId.fromString(overrides.declinedBySignerId) : undefined,
    getDeclinedReason: () => overrides.declinedReason || undefined,
    getExpiresAt: () => overrides.expiresAt || undefined,
    getCreatedAt: () => new Date('2024-01-01T00:00:00.000Z'),
    getUpdatedAt: () => new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * Creates a simple envelope signer for testing
 * @param overrides - Partial data to override defaults
 * @returns EnvelopeSigner entity
 * @example
 * const signer = createTestSigner({ email: 'test@example.com' });
 */
export function createTestSigner(overrides: Partial<{
  id: string;
  envelopeId: string;
  userId: string;
  email: string;
  fullName: string;
  status: string;
  participantRole: string;
  order: number;
}> = {}): EnvelopeSigner {
  const id = SignerId.fromString(overrides.id || TestUtils.generateUuid());
  const envelopeId = EnvelopeId.fromString(overrides.envelopeId || TestUtils.generateUuid());
  const userId = overrides.userId || TestUtils.generateUuid();
  const email = Email.fromString(overrides.email || 'test@example.com');
  const fullName = overrides.fullName || 'Test Signer';
  const status = (overrides.status || 'PENDING') as SignerStatus;
  const participantRole = (overrides.participantRole || 'SIGNER') as ParticipantRole;
  const order = overrides.order || 1;

  return EnvelopeSigner.fromPersistence({
    id: id.getValue(),
    envelopeId: envelopeId.getValue(),
    userId,
    isExternal: true,
    email: email.getValue(),
    fullName,
    invitedByUserId: null,
    participantRole: participantRole,
    order,
    status: status,
    signedAt: null,
    declinedAt: null,
    declineReason: null,
    consentGiven: false,
    consentTimestamp: null,
    documentHash: null,
    signatureHash: null,
    signedS3Key: null,
    kmsKeyId: null,
    algorithm: null,
    ipAddress: generateTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    reason: null,
    location: null,
  });
}
