/**
 * @fileoverview User Test Builders - Reusable test data builders for user repository tests
 * @summary Provides builders for creating test data related to user entities
 * @description This module provides builders for creating user-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { User } from '../../../src/domain/entities/User';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { CognitoSub } from '../../../src/domain/value-objects/CognitoSub';
import { Email } from '@lawprotect/shared-ts';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';
import { UserSpec } from '../../../src/domain/interfaces/UserSpec';
import { TestUtils } from '../testUtils';

/**
 * Creates a persistence row for user with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns User persistence row
 */
export function userPersistenceRow(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const cognitoSub = overrides.cognitoSub || TestUtils.generateCognitoSub();
  const email = overrides.email || TestUtils.createTestEmail();
  
  return {
    id,
    cognitoSub,
    email,
    name: overrides.name || 'John Doe',
    givenName: overrides.givenName || 'John',
    lastName: overrides.lastName || 'Doe',
    role: overrides.role || UserRole.CUSTOMER,
    status: overrides.status || UserAccountStatus.ACTIVE,
    mfaEnabled: overrides.mfaEnabled ?? false,
    lastLoginAt: overrides.lastLoginAt || null,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
    deletedAt: overrides.deletedAt || null,
    ...overrides
  };
}

/**
 * Creates a User domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns User domain entity
 */
export function userEntity(overrides: any = {}) {
  const id = overrides.id || UserId.fromString(TestUtils.generateUuid());
  const cognitoSub = overrides.cognitoSub || CognitoSub.fromString(TestUtils.generateCognitoSub());
  const email = overrides.email || Email.fromString(TestUtils.createTestEmail());
  
  return new User(
    id,
    cognitoSub,
    email,
    overrides.firstName ?? 'John',
    overrides.lastName ?? 'Doe',
    overrides.status ?? UserAccountStatus.ACTIVE,
    overrides.role ?? UserRole.CUSTOMER,
    overrides.mfaEnabled ?? false,
    overrides.lastLoginAt ?? undefined,
    overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z')
  );
}

/**
 * Creates a UserSpec with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns UserSpec object
 */
export function userSpec(overrides: any = {}): UserSpec {
  return {
    email: TestUtils.createTestEmail(),
    role: UserRole.CUSTOMER,
    status: UserAccountStatus.ACTIVE,
    ...overrides
  };
}

/**
 * Creates a partial User entity for updates
 * @param overrides - Partial data to override defaults
 * @returns Partial User entity
 */
export function partialUserEntity(overrides: any = {}) {
  return {
    getFullName: () => 'John Doe',
    getEmail: () => Email.fromString(TestUtils.createTestEmail()),
    getFirstName: () => 'John',
    getLastName: () => 'Doe',
    getRole: () => UserRole.CUSTOMER,
    getStatus: () => UserAccountStatus.ACTIVE,
    isMfaEnabled: () => false,
    getLastLoginAt: () => undefined,
    ...overrides
  };
}


