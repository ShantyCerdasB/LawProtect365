/**
 * @fileoverview CompositionRoot Mock - Mock implementation for CompositionRoot
 * @summary Provides mock implementations for CompositionRoot
 * @description Reusable mock factory for CompositionRoot in unit tests
 */

import { jest } from '@jest/globals';
import type { CompositionRoot } from '../../../../src/infrastructure/factories/CompositionRoot';
import { createMockUserService } from './UserService.mock';
import { createMockCognitoService } from './CognitoService.mock';
import { createMockAuditService } from './AuditService.mock';
import { createMockEventPublishingService } from './EventPublishingService.mock';
import type { Logger } from '@lawprotect/shared-ts';

/**
 * @description Creates a mock CompositionRoot with all services mocked.
 * @param {Partial<CompositionRoot>} overrides - Properties to override
 * @returns {jest.Mocked<CompositionRoot>} Mocked CompositionRoot instance
 */
export function createMockCompositionRoot(overrides: Partial<CompositionRoot> = {}): jest.Mocked<CompositionRoot> {
  const mockLogger: Logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  } as unknown as Logger;

  return {
    logger: mockLogger,
    config: {
      features: {
        allowLoginWhenPendingVerification: true,
        postConfirmationLinkProviders: true
      }
    },
    userService: createMockUserService(),
    cognitoService: createMockCognitoService(),
    auditService: createMockAuditService(),
    eventPublishingService: createMockEventPublishingService(),
    userRepository: {} as any,
    oauthAccountRepository: {} as any,
    userAuditEventRepository: {} as any,
    getMeUseCase: {} as any,
    linkProviderUseCase: {} as any,
    unlinkProviderUseCase: {} as any,
    ...overrides
  } as unknown as jest.Mocked<CompositionRoot>;
}

