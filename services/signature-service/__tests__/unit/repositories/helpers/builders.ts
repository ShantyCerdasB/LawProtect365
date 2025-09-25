/**
 * @fileoverview Test Builders - Reusable test data builders for repository tests
 */

import { Consent } from '../../../../src/domain/entities/Consent';
import { ConsentId } from '../../../../src/domain/value-objects/ConsentId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { ConsentSpec } from '../../../../src/domain/types/consent';
import { TestUtils } from '../../../helpers/testUtils';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';

/** Persistence row (determinístico) */
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

/** Entidad de dominio (determinística) */
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
  const signatureId =
    overrides.signatureId === undefined
      ? undefined
      : overrides.signatureId === null
        ? undefined
        : SignerId.fromString(overrides.signatureId);

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

/** Spec de filtros (rangos coherentes) */
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

/** Parcial de entidad para updates (getters solamente en campos presentes) */
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

/** DTO plano para updates */
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

/** VOs de conveniencia */
export const consentVO = {
  id: (v?: string) => ConsentId.fromString(v ?? TestUtils.generateUuid()),
  envId: (v?: string) => EnvelopeId.fromString(v ?? TestUtils.generateUuid()),
  signerId: (v?: string) => SignerId.fromString(v ?? TestUtils.generateUuid()),
};
