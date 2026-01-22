/**
 * @fileoverview UserPersonalInfo Test Builders - Reusable test data builders for user personal info repository tests
 * @summary Provides builders for creating test data related to user personal info entities
 * @description This module provides builders for creating user personal info-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { UserPersonalInfo } from '../../../src/domain/entities/UserPersonalInfo';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../testUtils';
import { uuid } from '@lawprotect/shared-ts';

/**
 * Creates a persistence row for user personal info with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns User personal info persistence row
 */
export function userPersonalInfoPersistenceRow(overrides: any = {}) {
  const id = overrides.id || uuid();
  const userId = overrides.userId || TestUtils.generateUuid();
  
  return {
    id,
    userId,
    phone: overrides.phone || null,
    locale: overrides.locale || null,
    timeZone: overrides.timeZone || null,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Creates a UserPersonalInfo domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns UserPersonalInfo domain entity
 */
export function userPersonalInfoEntity(overrides: any = {}) {
  const id = overrides.id || uuid();
  const userId = overrides.userId || UserId.fromString(TestUtils.generateUuid());
  
  return new UserPersonalInfo(
    id,
    userId,
    overrides.phone ?? null,
    overrides.locale ?? null,
    overrides.timeZone ?? null,
    overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z')
  );
}












