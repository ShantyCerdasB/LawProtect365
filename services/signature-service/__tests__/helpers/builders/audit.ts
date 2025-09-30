/**
 * @fileoverview Audit Test Builders - Reusable test data builders for audit events
 * @summary Provides builders for creating test data related to audit events
 * @description This module provides builders for creating audit-related test data including
 * audit events, network security contexts, and email objects used in unit tests.
 */

import { Email, NetworkSecurityContext } from '@lawprotect/shared-ts';
import { AuditEventData } from '../../../src/services/orchestrators/utils/audit/auditHelpers';
import { AuditEventType } from '../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../testUtils';
import { networkSecurityContext as commonNetworkContext } from './common';

/**
 * Creates an Email object with test data
 * @param value - Email value (defaults to test email)
 * @returns Email object with test data
 */
export function emailObject(value: string = 'test@example.com'): Email {
  return new Email(value);
}

/**
 * Creates a NetworkSecurityContext with test data
 * @param overrides - Optional overrides for network context
 * @returns NetworkSecurityContext with test data
 */
export function networkSecurityContext(overrides: Partial<NetworkSecurityContext> = {}): NetworkSecurityContext {
  return commonNetworkContext(overrides);
}

/**
 * Creates audit event data with test values
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData with test values
 */
export function auditEventData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  const envelopeId = TestUtils.generateEnvelopeId().getValue();
  const userId = TestUtils.generateUuid();
  
  return {
    envelopeId: overrides.envelopeId || envelopeId,
    signerId: overrides.signerId || TestUtils.generateSignerId().getValue(),
    eventType: overrides.eventType || AuditEventType.ENVELOPE_CREATED,
    description: overrides.description || 'Test audit event',
    userId: overrides.userId || userId,
    userEmail: overrides.userEmail || 'test@example.com',
    networkContext: overrides.networkContext || networkSecurityContext(),
    metadata: overrides.metadata || {
      envelopeId,
      testData: 'metadata'
    }
  };
}

/**
 * Creates audit event data for envelope creation
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData for envelope creation
 */
export function envelopeCreatedAuditData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  return auditEventData({
    eventType: AuditEventType.ENVELOPE_CREATED,
    description: 'Envelope "Test Document" created',
    ...overrides
  });
}

/**
 * Creates audit event data for envelope update
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData for envelope update
 */
export function envelopeUpdatedAuditData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  return auditEventData({
    eventType: AuditEventType.ENVELOPE_UPDATED,
    description: 'Envelope "Test Document" updated',
    metadata: {
      updatedFields: ['title', 'description'],
      title: 'Test Document'
    },
    ...overrides
  });
}

/**
 * Creates audit event data for envelope cancellation
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData for envelope cancellation
 */
export function envelopeCancelledAuditData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  return auditEventData({
    eventType: AuditEventType.ENVELOPE_CANCELLED,
    description: 'Envelope "Test Document" cancelled',
    metadata: {
      title: 'Test Document',
      cancelledAt: new Date().toISOString()
    },
    ...overrides
  });
}

/**
 * Creates audit event data for document access
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData for document access
 */
export function documentAccessedAuditData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  return auditEventData({
    eventType: AuditEventType.DOCUMENT_ACCESSED,
    description: 'External user accessed envelope document via invitation token',
    signerId: TestUtils.generateSignerId().getValue(),
    metadata: {
      signerId: TestUtils.generateSignerId().getValue(),
      externalUserIdentifier: 'test@example.com_user123',
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    },
    ...overrides
  });
}

/**
 * Creates audit event data for document download
 * @param overrides - Optional overrides for audit event data
 * @returns AuditEventData for document download
 */
export function documentDownloadedAuditData(overrides: Partial<AuditEventData> = {}): AuditEventData {
  return auditEventData({
    eventType: AuditEventType.DOCUMENT_DOWNLOADED,
    description: 'Document downloaded',
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    },
    ...overrides
  });
}
