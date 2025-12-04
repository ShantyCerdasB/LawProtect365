/**
 * @fileoverview Consent Test Builders - Reusable test data builders for consent repository tests
 * @summary Provides builders for creating test data related to consent entities
 * @description This module provides builders for creating consent-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { Consent } from '../../../src/domain/entities/Consent';
import { ConsentId } from '../../../src/domain/value-objects/ConsentId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { ConsentSpec } from '../../../src/domain/types/consent';
import { TestUtils } from '../testUtils';
import { generateTestIpAddress } from '../testUtils';

/**
 * Creates a persistence row for consent with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Consent persistence row
 * @example
 * const row = consentPersistenceRow({ consentGiven: false });
 */
export function consentPersistenceRow(overrides: Partial<any> = {}) {
  const base = {
    id: TestUtils.generateUuid(),
    envelopeId: TestUtils.generateUuid(),
    signerId: TestUtils.generateUuid(),
    signatureId: null as string | null,
    consentGiven: true,
    consentTimestamp: new Date('2024-01-01T00:00:00.000Z'),
    consentText: 'I agree to the terms and conditions',
    ipAddress: generateTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
  return { ...base, ...overrides };
}

/**
 * Creates a consent entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Consent entity
 * @example
 * const entity = consentEntity({ consentGiven: false });
 */
export function consentEntity(overrides: Partial<{
  id: string;
  envelopeId: string;
  signerId: string;
  signatureId?: string | null;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentText: string;
  ipAddress: string;
  userAgent: string;
  country?: string | null;
}> = {}) {
  const id = ConsentId.fromString(overrides.id ?? TestUtils.generateUuid());
  const envelopeId = EnvelopeId.fromString(overrides.envelopeId ?? TestUtils.generateUuid());
  const signerId = SignerId.fromString(overrides.signerId ?? TestUtils.generateUuid());
  let signatureId: SignerId | undefined;
  if (overrides.signatureId === undefined || overrides.signatureId === null) {
    signatureId = undefined;
  } else {
    signatureId = SignerId.fromString(overrides.signatureId);
  }

  return Consent.create({
    id,
    envelopeId,
    signerId,
    signatureId,
    consentGiven: overrides.consentGiven ?? true,
    consentTimestamp: overrides.consentTimestamp ?? new Date('2024-01-01T00:00:00.000Z'),
    consentText: overrides.consentText ?? 'I agree to the terms and conditions',
    ipAddress: overrides.ipAddress ?? generateTestIpAddress(),
    userAgent: overrides.userAgent ?? TestUtils.createTestUserAgent(),
    country: overrides.country ?? 'US',
  });
}

/**
 * Creates a consent specification for filtering
 * @param overrides - Partial data to override defaults
 * @returns ConsentSpec object
 * @example
 * const spec = consentSpec({ consentGiven: false });
 */
export function consentSpec(overrides: Partial<ConsentSpec> = {}): ConsentSpec {
  return {
    envelopeId: TestUtils.generateUuid(),
    signerId: TestUtils.generateUuid(),
    signatureId: TestUtils.generateUuid(),
    consentGiven: true,
    consentText: 'test consent',
    ipAddress: generateTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    // after < before
    consentAfter: new Date('2024-01-01T00:00:00.000Z'),
    consentBefore: new Date('2024-12-31T23:59:59.999Z'),
    createdAfter: new Date('2024-01-01T00:00:00.000Z'),
    createdBefore: new Date('2024-12-31T23:59:59.999Z'),
    ...overrides,
  };
}

/**
 * Creates a partial consent entity for updates (getters only for present fields)
 * @param overrides - Partial data to override defaults
 * @returns Partial consent entity with getters
 * @example
 * const partial = partialConsentEntity({ consentGiven: false });
 */
export function partialConsentEntity(overrides: Partial<{
  consentGiven: boolean;
  consentText: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
}> = {}) {
  const partial: any = {};
  if (overrides.consentGiven !== undefined) partial.getConsentGiven = () => overrides.consentGiven;
  if (overrides.consentText !== undefined) partial.getConsentText = () => overrides.consentText;
  if (overrides.ipAddress !== undefined) partial.getIpAddress = () => overrides.ipAddress;
  if (overrides.userAgent !== undefined) partial.getUserAgent = () => overrides.userAgent;
  if (overrides.country !== undefined) partial.getCountry = () => overrides.country;
  return partial;
}

/**
 * Creates a consent DTO for updates
 * @param overrides - Partial data to override defaults
 * @returns Consent DTO object
 * @example
 * const dto = consentDto({ consentGiven: false });
 */
export function consentDto(overrides: Partial<{
  consentGiven: boolean;
  consentText: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
}> = {}) {
  return {
    consentGiven: overrides.consentGiven ?? true,
    consentText: overrides.consentText ?? 'Updated consent text',
    ipAddress: overrides.ipAddress ?? generateTestIpAddress(),
    userAgent: overrides.userAgent ?? TestUtils.createTestUserAgent(),
    country: overrides.country ?? 'CA',
    ...overrides,
  };
}

/**
 * Convenience value object builders
 */
export const consentVO = {
  id: (v?: string) => ConsentId.fromString(v ?? TestUtils.generateUuid()),
  envId: (v?: string) => EnvelopeId.fromString(v ?? TestUtils.generateUuid()),
  signerId: (v?: string) => SignerId.fromString(v ?? TestUtils.generateUuid()),
};
