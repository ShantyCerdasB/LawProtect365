/**
 * @fileoverview EventPublishingService Mock - Mock implementation for EventPublishingService
 * @summary Provides mock implementations for EventPublishingService methods
 * @description Reusable mock factory for EventPublishingService in unit tests
 */

import { jest } from '@jest/globals';
import type { EventPublishingService } from '../../../../src/services/EventPublishingService';

/**
 * @description Creates a mock EventPublishingService with all methods mocked.
 * @returns {jest.Mocked<EventPublishingService>} Mocked EventPublishingService instance
 */
export function createMockEventPublishingService(): jest.Mocked<EventPublishingService> {
  return {
    publishUserRegistered: jest.fn(),
    publishUserUpdated: jest.fn(),
    publishUserDeleted: jest.fn(),
    publishMfaEnabled: jest.fn(),
    publishMfaDisabled: jest.fn(),
    publishProviderLinked: jest.fn(),
    publishProviderUnlinked: jest.fn()
  } as unknown as jest.Mocked<EventPublishingService>;
}

