/**
 * @fileoverview SignatureAuditEvent builders for unit tests
 * @summary Provides test data builders for SignatureAuditEvent entities and related objects
 * @description This file contains builders for creating test data for SignatureAuditEvent
 * entities, persistence rows, specifications, and DTOs used in unit tests.
 */

import { SignatureAuditEvent } from '../../../src/domain/entities/SignatureAuditEvent';
import { SignatureAuditEventId } from '../../../src/domain/value-objects/SignatureAuditEventId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { AuditEventType } from '../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../testUtils';
import { generateTestIpAddress } from '../../integration/helpers/testHelpers';

export function auditEventPersistenceRow(overrides: any = {}) {
  return {
    id: overrides.id || TestUtils.generateUuid(),
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId().getValue(),
    signerId: overrides.signerId || TestUtils.generateSignerId().getValue(),
    eventType: overrides.eventType || AuditEventType.SIGNER_ADDED,
    description: overrides.description || 'Test audit event',
    userId: overrides.userId || TestUtils.generateUuid(),
    userEmail: overrides.userEmail || 'test@example.com',
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || 'TestAgent/1.0',
    country: overrides.country || 'US',
    metadata: overrides.metadata || { sampleData: 'metadata' },
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
  };
}

export function auditEventEntity(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateSignatureAuditEventId();
  const envelopeId = overrides.envelopeId || TestUtils.generateEnvelopeId();
  const signerId = overrides.signerId !== undefined ? overrides.signerId : TestUtils.generateSignerId();

  return new SignatureAuditEvent(
    id,
    envelopeId,
    signerId,
    overrides.eventType || AuditEventType.SIGNER_ADDED,
    overrides.description || 'Test audit event',
    overrides.userId || TestUtils.generateUuid(),
    overrides.userEmail || 'test@example.com',
    overrides.ipAddress || '127.0.0.1',
    overrides.userAgent || 'TestAgent/1.0',
    overrides.country || 'US',
    overrides.metadata || { test: 'data' },
    overrides.createdAt || new Date('2024-01-01T00:00:00Z')
  );
}

export function auditEventSpec(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId,
    signerId: overrides.signerId,
    eventType: overrides.eventType,
    userId: overrides.userId,
    userEmail: overrides.userEmail,
    ipAddress: overrides.ipAddress,
    userAgent: overrides.userAgent,
    country: overrides.country,
    createdBefore: overrides.createdBefore,
    createdAfter: overrides.createdAfter,
    description: overrides.description,
  };
}

export function partialAuditEventEntity(overrides: any = {}) {
  return {
    getId: () => overrides.id ? SignatureAuditEventId.fromString(overrides.id) : undefined,
    getEnvelopeId: () => overrides.envelopeId ? EnvelopeId.fromString(overrides.envelopeId) : undefined,
    getSignerId: () => overrides.signerId ? SignerId.fromString(overrides.signerId) : undefined,
    getEventType: () => overrides.eventType,
    getDescription: () => overrides.description,
    getUserId: () => overrides.userId,
    getUserEmail: () => overrides.userEmail,
    getIpAddress: () => overrides.ipAddress,
    getUserAgent: () => overrides.userAgent,
    getCountry: () => overrides.country,
    getMetadata: () => overrides.metadata,
    getCreatedAt: () => overrides.createdAt,
    ...overrides,
  };
}

export function auditEventDto(overrides: any = {}) {
  return {
    id: overrides.id || TestUtils.generateUuid(),
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId().getValue(),
    signerId: overrides.signerId || TestUtils.generateSignerId().getValue(),
    eventType: overrides.eventType || AuditEventType.SIGNER_ADDED,
    description: overrides.description || 'Test audit event',
    userId: overrides.userId || TestUtils.generateUuid(),
    userEmail: overrides.userEmail || 'test@example.com',
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || 'TestAgent/1.0',
    country: overrides.country || 'US',
    metadata: overrides.metadata || { sampleData: 'metadata' },
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}

export function auditEventVO(overrides: any = {}) {
  return {
    id: () => TestUtils.generateSignatureAuditEventId(),
    envelopeId: () => TestUtils.generateEnvelopeId(),
    signerId: () => TestUtils.generateSignerId(),
    eventType: () => AuditEventType.SIGNER_ADDED,
    description: () => 'Test audit event',
    userId: () => TestUtils.generateUuid(),
    userEmail: () => 'test@example.com',
    ipAddress: () => '127.0.0.1',
    userAgent: () => 'TestAgent/1.0',
    country: () => 'US',
    metadata: () => ({ sampleData: 'metadata' }),
    createdAt: () => new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}
