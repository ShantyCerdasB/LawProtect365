/**
 * @fileoverview AuditService Mock - Mock implementation for AuditService
 * @summary Provides mock implementations for AuditService methods
 * @description Reusable mock factory for AuditService in unit tests
 */

import { jest } from '@jest/globals';
import type { AuditService } from '../../../../src/services/AuditService';

/**
 * @description Creates a mock AuditService with all methods mocked.
 * @returns {jest.Mocked<AuditService>} Mocked AuditService instance
 */
export function createMockAuditService(): jest.Mocked<AuditService> {
  return {
    userRegistered: jest.fn(),
    userUpdated: jest.fn(),
    userDeleted: jest.fn(),
    mfaEnabled: jest.fn(),
    mfaDisabled: jest.fn(),
    providerLinked: jest.fn(),
    providerUnlinked: jest.fn(),
    roleChanged: jest.fn(),
    statusChanged: jest.fn()
  } as unknown as jest.Mocked<AuditService>;
}

