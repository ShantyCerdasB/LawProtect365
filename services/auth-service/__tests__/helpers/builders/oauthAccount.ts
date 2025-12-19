/**
 * @fileoverview OAuthAccount Test Builders - Reusable test data builders for OAuth account repository tests
 * @summary Provides builders for creating test data related to OAuth account entities
 * @description This module provides builders for creating OAuth account-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { OAuthAccount } from '../../../src/domain/entities/OAuthAccount';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { OAuthAccountSpec } from '../../../src/domain/interfaces/OAuthAccountSpec';
import { TestUtils } from '../testUtils';

/**
 * Creates a persistence row for OAuth account with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns OAuth account persistence row
 */
export function oauthAccountPersistenceRow(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const userId = overrides.userId || TestUtils.generateUuid();
  
  return {
    id,
    userId,
    provider: overrides.provider || OAuthProvider.GOOGLE,
    providerAccountId: overrides.providerAccountId || 'provider-id-123',
    providerEmail: overrides.providerEmail || 'user@google.com',
    providerName: overrides.providerName || 'John Doe',
    isPrimary: overrides.isPrimary ?? false,
    linkedAt: overrides.linkedAt || new Date('2024-01-01T00:00:00Z'),
    lastUsedAt: overrides.lastUsedAt || null,
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt || new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Creates an OAuthAccount domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns OAuthAccount domain entity
 */
export function oauthAccountEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const userId = overrides.userId || UserId.fromString(TestUtils.generateUuid());
  
  return new OAuthAccount(
    id,
    userId,
    overrides.provider ?? OAuthProvider.GOOGLE,
    overrides.providerId ?? 'provider-id-123',
    overrides.providerEmail ?? 'user@google.com',
    overrides.providerName ?? 'John Doe',
    overrides.isPrimary ?? false,
    overrides.linkedAt ?? new Date('2024-01-01T00:00:00Z'),
    overrides.lastUsedAt ?? undefined
  );
}

/**
 * Creates an OAuthAccountSpec with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns OAuthAccountSpec object
 */
export function oauthAccountSpec(overrides: any = {}): OAuthAccountSpec {
  return {
    userId: TestUtils.generateUuid(),
    provider: OAuthProvider.GOOGLE,
    ...overrides
  };
}

/**
 * Creates a partial OAuthAccount entity for updates
 * @param overrides - Partial data to override defaults
 * @returns Partial OAuthAccount entity
 */
export function partialOAuthAccountEntity(overrides: any = {}) {
  return {
    getUserId: () => UserId.fromString(TestUtils.generateUuid()),
    getProvider: () => OAuthProvider.GOOGLE,
    getProviderId: () => 'provider-id-123',
    ...overrides
  };
}

