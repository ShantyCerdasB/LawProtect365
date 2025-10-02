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
import { networkSecurityContext } from './common';

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
  // Use the new entity create method with NetworkSecurityContext
  return SignatureAuditEvent.create({
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId === undefined ? TestUtils.generateSignerId() : overrides.signerId,
    eventType: overrides.eventType || AuditEventType.SIGNER_ADDED,
    description: overrides.description || 'Test audit event',
    userId: overrides.userId || TestUtils.generateUuid(),
    userEmail: overrides.userEmail || 'test@example.com',
    networkContext: networkSecurityContext({
      ipAddress: overrides.ipAddress,
      userAgent: overrides.userAgent,
      country: overrides.country
    }),
    metadata: overrides.metadata || { test: 'data' }
  });
}

export function envelopeEventEntity(overrides: any = {}) {
  // Use the new entity create method with NetworkSecurityContext for envelope events
  return SignatureAuditEvent.create({
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId === undefined ? undefined : overrides.signerId,
    eventType: overrides.eventType || AuditEventType.ENVELOPE_CREATED,
    description: overrides.description || 'Test envelope event',
    userId: overrides.userId || TestUtils.generateUuid(),
    userEmail: overrides.userEmail || 'test@example.com',
    networkContext: networkSecurityContext({
      ipAddress: overrides.ipAddress,
      userAgent: overrides.userAgent,
      country: overrides.country
    }),
    metadata: overrides.metadata || { test: 'data' }
  });
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
    ipAddress: () => generateTestIpAddress(),
    userAgent: () => 'TestAgent/1.0',
    country: () => 'US',
    metadata: () => ({ sampleData: 'metadata' }),
    createdAt: () => new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a signer-specific audit event entity
 * @param overrides - Optional overrides for the event
 * @returns SignatureAuditEvent for signer operations
 */
export function signerEventEntity(overrides: any = {}) {
  return auditEventEntity({
    eventType: AuditEventType.SIGNER_ADDED,
    signerId: TestUtils.generateSignerId(),
    description: 'Signer added to envelope',
    ...overrides
  });
}


/**
 * Creates an audit event with network context
 * @param overrides - Optional overrides for the event
 * @returns SignatureAuditEvent with network security context
 */
export function auditEventWithNetwork(overrides: any = {}) {
  return auditEventEntity({
    ipAddress: generateTestIpAddress(),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    country: 'US',
    ...overrides
  });
}

/**
 * Creates a minimal audit event with only required fields
 * @param overrides - Optional overrides for the event
 * @returns SignatureAuditEvent with minimal data
 */
export function auditEventMinimal(overrides: any = {}) {
  const params: any = {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    eventType: overrides.eventType || AuditEventType.ENVELOPE_CREATED,
    description: overrides.description || 'Minimal test event'
  };

  // Only add overrides that are explicitly provided
  if (overrides.userId !== undefined) params.userId = overrides.userId;
  if (overrides.userEmail !== undefined) params.userEmail = overrides.userEmail;
  if (overrides.networkContext !== undefined) params.networkContext = overrides.networkContext;
  if (overrides.signerId !== undefined) params.signerId = overrides.signerId;
  if (overrides.metadata !== undefined) params.metadata = overrides.metadata;
  // Don't add metadata if not provided - let it be undefined

  return SignatureAuditEvent.create(params);
}
