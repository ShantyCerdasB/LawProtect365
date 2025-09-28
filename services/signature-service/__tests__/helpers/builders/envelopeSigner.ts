/**
 * @fileoverview EnvelopeSigner Test Builders - Reusable test data builders for envelope signer repository tests
 * @summary Provides builders for creating test data related to envelope signer entities
 * @description This module provides builders for creating envelope signer-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { EnvelopeSigner } from '../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { Email } from '@lawprotect/shared-ts';
import { SignerSpec } from '../../../src/domain/types/signer/SignerSpec';
import { TestUtils } from '../testUtils';
import { SignerStatus, ParticipantRole } from '@prisma/client';

/**
 * Creates a persistence row for envelope signer with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns EnvelopeSigner persistence row with includes
 */
export function signerPersistenceRow(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const envelopeId = overrides.envelopeId || TestUtils.generateUuid();
  const userId = overrides.userId || TestUtils.generateUuid();
  
  return {
    id,
    envelopeId,
    userId,
    isExternal: false,
    email: 'test@example.com',
    fullName: 'Test Signer',
    invitedByUserId: TestUtils.generateUuid(),
    participantRole: ParticipantRole.SIGNER,
    order: 1,
    status: SignerStatus.PENDING,
    signedAt: null,
    declinedAt: null,
    declineReason: null,
    consentGiven: null,
    consentTimestamp: null,
    documentHash: null,
    signatureHash: null,
    signedS3Key: null,
    kmsKeyId: null,
    algorithm: null,
    ipAddress: null,
    userAgent: null,
    reason: null,
    location: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    // Includes
    envelope: {
      id: envelopeId,
      title: 'Test Envelope',
      status: 'DRAFT'
    },
    user: {
      id: userId,
      email: 'user@example.com',
      fullName: 'Test User'
    },
    ...overrides
  };
}

/**
 * Creates an EnvelopeSigner domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns EnvelopeSigner domain entity
 */
export function signerEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateSignerId();
  const envelopeId = overrides.envelopeId || TestUtils.generateEnvelopeId();
  const userId = overrides.userId || TestUtils.generateUuid();
  
  return new EnvelopeSigner(
    id,
    envelopeId,
    userId,
    overrides.isExternal ?? false,
    overrides.email ?? Email.fromString('test@example.com'),
    overrides.fullName ?? 'Test Signer',
    overrides.invitedByUserId ?? TestUtils.generateUuid(),
    overrides.participantRole ?? 'SIGNER',
    overrides.order ?? 1,
    overrides.status ?? SignerStatus.PENDING,
    overrides.signedAt ?? undefined,
    overrides.declinedAt ?? undefined,
    overrides.declineReason ?? undefined,
    overrides.consentGiven ?? undefined,
    overrides.consentTimestamp ?? undefined,
    overrides.documentHash ?? undefined,
    overrides.signatureHash ?? undefined,
    overrides.signedS3Key ?? undefined,
    overrides.kmsKeyId ?? undefined,
    overrides.algorithm ?? undefined,
    overrides.ipAddress ?? undefined,
    overrides.userAgent ?? undefined,
    overrides.reason ?? undefined,
    overrides.location ?? undefined,
    overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z')
  );
}

/**
 * Creates a SignerSpec with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns SignerSpec object
 */
export function signerSpec(overrides: any = {}): SignerSpec {
  return {
    envelopeId: TestUtils.generateUuid(),
    userId: TestUtils.generateUuid(),
    email: 'test@example.com',
    status: SignerStatus.PENDING,
    isExternal: false,
    participantRole: 'SIGNER',
    hasSigned: false,
    hasDeclined: false,
    consentGiven: false,
    ...overrides
  };
}

/**
 * Creates a DTO for signer updates with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Signer DTO object
 */
export function signerDto(overrides: any = {}) {
  return {
    envelopeId: TestUtils.generateUuid(),
    userId: TestUtils.generateUuid(),
    isExternal: false,
    email: 'test@example.com',
    fullName: 'Test Signer',
    invitedByUserId: TestUtils.generateUuid(),
    participantRole: 'SIGNER',
    order: 1,
    status: SignerStatus.PENDING,
    signedAt: null,
    declinedAt: null,
    declineReason: null,
    consentGiven: null,
    consentTimestamp: null,
    documentHash: null,
    signatureHash: null,
    signedS3Key: null,
    kmsKeyId: null,
    algorithm: null,
    ipAddress: null,
    userAgent: null,
    reason: null,
    location: null,
    ...overrides
  };
}

/**
 * Creates a partial EnvelopeSigner entity for updates
 * @param overrides - Partial data to override defaults
 * @returns Partial EnvelopeSigner entity
 */
export function partialSignerEntity(overrides: any = {}) {
  return {
    getEnvelopeId: () => TestUtils.generateEnvelopeId(),
    getUserId: () => TestUtils.generateUuid(),
    getIsExternal: () => false,
    getEmail: () => Email.fromString('test@example.com'),
    getFullName: () => 'Test Signer',
    getInvitedByUserId: () => TestUtils.generateUuid(),
    getParticipantRole: () => 'SIGNER',
    getOrder: () => 1,
    getStatus: () => SignerStatus.PENDING,
    getSignedAt: () => undefined,
    getDeclinedAt: () => undefined,
    getDeclineReason: () => undefined,
    getConsentGiven: () => undefined,
    getConsentTimestamp: () => undefined,
    getDocumentHash: () => undefined,
    getSignatureHash: () => undefined,
    getSignedS3Key: () => undefined,
    getKmsKeyId: () => undefined,
    getAlgorithm: () => undefined,
    getIpAddress: () => undefined,
    getUserAgent: () => undefined,
    getReason: () => undefined,
    getLocation: () => undefined,
    ...overrides
  };
}

/**
 * Creates value objects for signer tests
 * @param overrides - Partial data to override defaults
 * @returns Object containing signer value objects
 */
export function signerVO(overrides: any = {}) {
  return {
    id: () => TestUtils.generateSignerId(),
    envelopeId: () => TestUtils.generateEnvelopeId(),
    userId: () => TestUtils.generateUuid(),
    email: () => Email.fromString('test@example.com'),
    ...overrides
  };
}
