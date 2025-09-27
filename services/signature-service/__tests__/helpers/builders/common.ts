/**
 * @fileoverview Common builders - Reusable builders for common patterns
 * @summary Generic builders for frequently used test data patterns
 * @description Provides reusable builders for common patterns like NetworkSecurityContext
 * and other frequently repeated test data structures.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { TestUtils } from '../testUtils';
import { generateTestIpAddress } from '../../integration/helpers/testHelpers';

/**
 * Creates a NetworkSecurityContext with test data
 * @param overrides - Optional overrides for network context
 * @returns NetworkSecurityContext with test data
 */
export function networkSecurityContext(overrides: Partial<NetworkSecurityContext> = {}): NetworkSecurityContext {
  return {
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || TestUtils.createTestUserAgent(),
    country: overrides.country || 'US',
    ...overrides
  };
}

/**
 * Creates core audit event data with test values
 * @param overrides - Optional overrides for core data
 * @returns Core audit event data with test values
 */
export function auditEventCore(overrides: {
  envelopeId?: string;
  signerId?: string;
  eventType?: string;
  description?: string;
} = {}) {
  return {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId().getValue(),
    signerId: overrides.signerId || TestUtils.generateSignerId().getValue(),
    eventType: overrides.eventType || 'SIGNER_ADDED',
    description: overrides.description || 'Test audit event',
    ...overrides
  };
}

/**
 * Creates a complete audit event test data object
 * @param overrides - Optional overrides for any field
 * @returns Complete audit event test data
 */
export function completeAuditEventData(overrides: {
  core?: {
    envelopeId?: string;
    signerId?: string;
    eventType?: string;
    description?: string;
  };
  user?: {
    userId?: string;
    userEmail?: string;
  };
  network?: Partial<NetworkSecurityContext>;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
} = {}) {
  return {
    ...auditEventCore(overrides.core),
    userId: overrides.user?.userId || TestUtils.generateUuid(),
    userEmail: overrides.user?.userEmail || TestUtils.createTestEmail(),
    ...networkSecurityContext(overrides.network),
    metadata: overrides.metadata || { test: 'data' },
    createdAt: overrides.createdAt || new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}
