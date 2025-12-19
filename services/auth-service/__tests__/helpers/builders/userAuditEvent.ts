/**
 * @fileoverview UserAuditEvent Test Builders - Reusable test data builders for user audit event repository tests
 * @summary Provides builders for creating test data related to user audit event entities
 * @description This module provides builders for creating user audit event-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { UserAuditEvent } from '../../../src/domain/entities/UserAuditEvent';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { UserAuditAction } from '../../../src/domain/enums/UserAuditAction';
import { UserAuditEventSpec } from '../../../src/domain/interfaces/UserAuditEventSpec';
import { TestUtils } from '../testUtils';

/**
 * Creates a persistence row for user audit event with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns User audit event persistence row
 */
export function userAuditEventPersistenceRow(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const userId = overrides.userId || TestUtils.generateUuid();
  
  return {
    id,
    userId,
    action: overrides.action || UserAuditAction.USER_REGISTERED,
    description: overrides.description || null,
    actorId: overrides.actorId || null,
    ipAddress: overrides.ipAddress || null,
    userAgent: overrides.userAgent || null,
    metadata: overrides.metadata || null,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Creates a UserAuditEvent domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns UserAuditEvent domain entity
 */
export function userAuditEventEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const userId = overrides.userId || UserId.fromString(TestUtils.generateUuid());
  
  return new UserAuditEvent(
    id,
    userId,
    overrides.action ?? UserAuditAction.USER_REGISTERED,
    overrides.description ?? undefined,
    overrides.actorId ?? undefined,
    overrides.ipAddress ?? undefined,
    overrides.userAgent ?? undefined,
    overrides.metadata ?? undefined,
    overrides.createdAt ?? new Date('2024-01-01T00:00:00Z')
  );
}

/**
 * Creates a UserAuditEventSpec with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns UserAuditEventSpec object
 */
export function userAuditEventSpec(overrides: any = {}): UserAuditEventSpec {
  return {
    userId: TestUtils.generateUuid(),
    action: UserAuditAction.USER_REGISTERED as any,
    ...overrides
  };
}

/**
 * Creates a partial UserAuditEvent entity for updates
 * @param overrides - Partial data to override defaults
 * @returns Partial UserAuditEvent entity
 */
export function partialUserAuditEventEntity(overrides: any = {}) {
  return {
    getUserId: () => UserId.fromString(TestUtils.generateUuid()),
    getAction: () => UserAuditAction.USER_REGISTERED,
    getDescription: () => undefined,
    getActorId: () => undefined,
    getIpAddress: () => undefined,
    getUserAgent: () => undefined,
    getMetadata: () => undefined,
    ...overrides
  };
}

