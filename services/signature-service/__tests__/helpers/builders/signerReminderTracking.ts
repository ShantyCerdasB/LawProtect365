/**
 * @fileoverview SignerReminderTracking Builders - Test data builders for SignerReminderTracking entities
 * @summary Provides builders for creating test data for SignerReminderTracking entities and related objects
 * @description This file contains builders for creating test data for SignerReminderTracking entities,
 * including persistence rows, domain entities, specifications, DTOs, and value objects.
 */

import { SignerReminderTracking } from '../../../src/domain/entities/SignerReminderTracking';
import { TestUtils } from '../testUtils';

/**
 * Creates a persistence row for SignerReminderTracking
 * @param overrides - Optional overrides for the row data
 * @returns Prisma persistence row
 */
export function trackingPersistenceRow(overrides: any = {}) {
  return {
    id: overrides.id || TestUtils.generateUuid(),
    signerId: overrides.signerId || TestUtils.generateUuid(),
    envelopeId: overrides.envelopeId || TestUtils.generateUuid(),
    lastReminderAt: overrides.lastReminderAt || new Date('2024-01-01T10:00:00Z'),
    reminderCount: overrides.reminderCount || 0,
    lastReminderMessage: overrides.lastReminderMessage || null,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
  };
}

/**
 * Creates a SignerReminderTracking domain entity
 * @param overrides - Optional overrides for the entity
 * @returns SignerReminderTracking domain entity
 */
export function trackingEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateReminderTrackingId();
  const envelopeId = overrides.envelopeId || TestUtils.generateEnvelopeId();
  const signerId = overrides.signerId || TestUtils.generateSignerId();

  return SignerReminderTracking.create({
    id: id.getValue(),
    signerId: signerId.getValue(),
    envelopeId: envelopeId.getValue(),
    lastReminderAt: overrides.lastReminderAt ?? new Date('2024-01-01T10:00:00Z'),
    reminderCount: overrides.reminderCount ?? 0,
    lastReminderMessage: overrides.lastReminderMessage ?? null,
    createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z'),
  });
}

/**
 * Creates a SignerReminderTracking domain entity using createNew
 * @param overrides - Optional overrides for the entity
 * @returns SignerReminderTracking domain entity
 */
export function trackingEntityNew(overrides: any = {}) {
  const envelopeId = overrides.envelopeId || TestUtils.generateEnvelopeId();
  const signerId = overrides.signerId || TestUtils.generateSignerId();

  return SignerReminderTracking.createNew(signerId, envelopeId, overrides.clock);
}

/**
 * Creates a TrackingSpec for queries
 * @param overrides - Optional overrides for the spec
 * @returns TrackingSpec
 */
export function trackingSpec(overrides: any = {}) {
  return {
    signerId: overrides.signerId,
    envelopeId: overrides.envelopeId,
    minReminderCount: overrides.minReminderCount,
    maxReminderCount: overrides.maxReminderCount,
    createdBefore: overrides.createdBefore,
    createdAfter: overrides.createdAfter,
    updatedBefore: overrides.updatedBefore,
    updatedAfter: overrides.updatedAfter,
  };
}

/**
 * Creates a DTO for SignerReminderTracking
 * @param overrides - Optional overrides for the DTO
 * @returns Tracking DTO
 */
export function trackingDto(overrides: any = {}) {
  return trackingPersistenceRow(overrides);
}

/**
 * Creates a partial SignerReminderTracking entity for updates
 * @param overrides - Optional overrides for the partial entity
 * @returns Partial tracking entity
 */
export function partialTrackingEntity(overrides: any = {}) {
  return {
    getSignerId: () => overrides.signerId || TestUtils.generateSignerId(),
    getEnvelopeId: () => overrides.envelopeId || TestUtils.generateEnvelopeId(),
    getLastReminderAt: () => overrides.lastReminderAt,
    getReminderCount: () => overrides.reminderCount,
    getLastReminderMessage: () => overrides.lastReminderMessage,
    getUpdatedAt: () => overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
  };
}

/**
 * Creates value objects for tracking
 * @param overrides - Optional overrides for the value objects
 * @returns Object with tracking value objects
 */
export function trackingVO(overrides: any = {}) {
  return {
    id: () => overrides.id || TestUtils.generateReminderTrackingId(),
    signerId: () => overrides.signerId || TestUtils.generateSignerId(),
    envelopeId: () => overrides.envelopeId || TestUtils.generateEnvelopeId(),
  };
}
