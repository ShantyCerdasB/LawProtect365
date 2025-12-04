/**
 * @fileoverview InvitationToken Builders - Test data builders for InvitationToken entities
 * @summary Provides builders for creating test data for InvitationToken entities and related objects
 * @description This file contains builders for creating test data for InvitationToken entities,
 * including persistence rows, domain entities, specifications, DTOs, and value objects.
 */

import { InvitationToken } from '../../../src/domain/entities/InvitationToken';
import { InvitationTokenStatus } from '@prisma/client';
import { TestUtils } from '../testUtils';
import { generateTestIpAddress } from '../testUtils';

/**
 * Creates a persistence row for InvitationToken
 * @param overrides - Optional overrides for the row data
 * @returns Prisma persistence row
 */
export function tokenPersistenceRow(overrides: any = {}) {
  return {
    id: overrides.id || TestUtils.generateUuid(),
    envelopeId: overrides.envelopeId || TestUtils.generateUuid(),
    signerId: overrides.signerId || TestUtils.generateUuid(),
    tokenHash: overrides.tokenHash || 'hashed-token-123',
    status: overrides.status || InvitationTokenStatus.ACTIVE,
    expiresAt: overrides.expiresAt || new Date('2024-12-31T23:59:59Z'),
    sentAt: overrides.sentAt || new Date('2024-01-01T10:00:00Z'),
    lastSentAt: overrides.lastSentAt || new Date('2024-01-01T10:00:00Z'),
    resendCount: overrides.resendCount || 0,
    usedAt: overrides.usedAt || null,
    usedBy: overrides.usedBy || null,
    viewCount: overrides.viewCount || 0,
    lastViewedAt: overrides.lastViewedAt || null,
    signedAt: overrides.signedAt || null,
    signedBy: overrides.signedBy || null,
    revokedAt: overrides.revokedAt || null,
    revokedReason: overrides.revokedReason || null,
    createdBy: overrides.createdBy || TestUtils.generateUuid(),
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || 'Mozilla/5.0...',
    country: overrides.country || 'US',
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
  };
}

/**
 * Creates an InvitationToken domain entity
 * @param overrides - Optional overrides for the entity
 * @returns InvitationToken domain entity
 */
export function tokenEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateInvitationTokenId();
  const envelopeId = overrides.envelopeId || TestUtils.generateEnvelopeId();
  const signerId = overrides.signerId || TestUtils.generateSignerId();

  return new InvitationToken(
    id,
    envelopeId,
    signerId,
    overrides.tokenHash ?? 'hashed-token-123',
    overrides.status ?? InvitationTokenStatus.ACTIVE,
    overrides.expiresAt ?? new Date('2024-12-31T23:59:59Z'),
    overrides.sentAt ?? new Date('2024-01-01T10:00:00Z'),
    overrides.lastSentAt ?? new Date('2024-01-01T10:00:00Z'),
    overrides.resendCount ?? 0,
    overrides.usedAt ?? null,
    overrides.usedBy ?? null,
    overrides.viewCount ?? 0,
    overrides.lastViewedAt ?? null,
    overrides.signedAt ?? null,
    overrides.signedBy ?? null,
    overrides.revokedAt ?? null,
    overrides.revokedReason ?? null,
    overrides.createdBy ?? TestUtils.generateUuid(),
    overrides.ipAddress ?? generateTestIpAddress(),
    overrides.userAgent ?? 'Mozilla/5.0...',
    overrides.country ?? 'US',
    overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z')
  );
}

/**
 * Creates an InvitationTokenSpec for queries
 * @param overrides - Optional overrides for the spec
 * @returns InvitationTokenSpec
 */
export function tokenSpec(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId,
    signerId: overrides.signerId,
    status: overrides.status,
    tokenHash: overrides.tokenHash,
    createdBy: overrides.createdBy,
    usedBy: overrides.usedBy,
    expiresBefore: overrides.expiresBefore,
    expiresAfter: overrides.expiresAfter,
    usedBefore: overrides.usedBefore,
    usedAfter: overrides.usedAfter,
    createdBefore: overrides.createdBefore,
    createdAfter: overrides.createdAfter,
    isExpired: overrides.isExpired,
    isActive: overrides.isActive,
    isUsed: overrides.isUsed,
    isRevoked: overrides.isRevoked,
  };
}

/**
 * Creates a partial InvitationToken entity for updates
 * @param overrides - Optional overrides for the partial entity
 * @returns Partial InvitationToken entity
 */
export function partialTokenEntity(overrides: any = {}) {
  return {
    getStatus: () => overrides.status || InvitationTokenStatus.ACTIVE,
    getExpiresAt: () => overrides.expiresAt || new Date('2024-12-31T23:59:59Z'),
    getSentAt: () => overrides.sentAt || new Date('2024-01-01T10:00:00Z'),
    getLastSentAt: () => overrides.lastSentAt || new Date('2024-01-01T10:00:00Z'),
    getResendCount: () => overrides.resendCount || 0,
    getUsedAt: () => overrides.usedAt || null,
    getUsedBy: () => overrides.usedBy || null,
    getViewCount: () => overrides.viewCount || 0,
    getLastViewedAt: () => overrides.lastViewedAt || null,
    getSignedAt: () => overrides.signedAt || null,
    getSignedBy: () => overrides.signedBy || null,
    getRevokedAt: () => overrides.revokedAt || null,
    getRevokedReason: () => overrides.revokedReason || null,
    getCreatedBy: () => overrides.createdBy || TestUtils.generateUuid(),
    getIpAddress: () => overrides.ipAddress || generateTestIpAddress(),
    getUserAgent: () => overrides.userAgent || 'Mozilla/5.0...',
    getCountry: () => overrides.country || 'US',
    ...overrides,
  };
}

/**
 * Creates a DTO for InvitationToken
 * @param overrides - Optional overrides for the DTO
 * @returns InvitationToken DTO
 */
export function tokenDto(overrides: any = {}) {
  return {
    status: overrides.status || InvitationTokenStatus.ACTIVE,
    expiresAt: overrides.expiresAt || new Date('2024-12-31T23:59:59Z'),
    sentAt: overrides.sentAt || new Date('2024-01-01T10:00:00Z'),
    lastSentAt: overrides.lastSentAt || new Date('2024-01-01T10:00:00Z'),
    resendCount: overrides.resendCount || 0,
    usedAt: overrides.usedAt || null,
    usedBy: overrides.usedBy || null,
    viewCount: overrides.viewCount || 0,
    lastViewedAt: overrides.lastViewedAt || null,
    signedAt: overrides.signedAt || null,
    signedBy: overrides.signedBy || null,
    revokedAt: overrides.revokedAt || null,
    revokedReason: overrides.revokedReason || null,
    createdBy: overrides.createdBy || TestUtils.generateUuid(),
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || 'Mozilla/5.0...',
    country: overrides.country || 'US',
    ...overrides,
  };
}

/**
 * Creates value objects for InvitationToken
 * @param overrides - Optional overrides for the value objects
 * @returns Object with value objects
 */
export function tokenVO(overrides: any = {}) {
  return {
    id: () => TestUtils.generateInvitationTokenId(),
    envelopeId: () => TestUtils.generateEnvelopeId(),
    signerId: () => TestUtils.generateSignerId(),
    ...overrides,
  };
}
