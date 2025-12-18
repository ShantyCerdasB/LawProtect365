/**
 * @fileoverview UserService Mock - Mock implementation for UserService
 * @summary Provides mock implementations for UserService methods
 * @description Reusable mock factory for UserService in unit tests
 */

import { jest } from '@jest/globals';
import type { UserService } from '../../../../src/services/UserService';
import type { User } from '../../../../src/domain/entities/User';

/**
 * @description Creates a mock UserService with all methods mocked.
 * @returns {jest.Mocked<UserService>} Mocked UserService instance
 */
export function createMockUserService(): jest.Mocked<UserService> {
  return {
    findByCognitoSub: jest.fn(),
    upsertOnPostAuth: jest.fn(),
    registerUser: jest.fn(),
    linkProviderIdentities: jest.fn(),
    unlinkProvider: jest.fn(),
    updateUserProfile: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    setUserRole: jest.fn(),
    setUserStatus: jest.fn()
  } as unknown as jest.Mocked<UserService>;
}

/**
 * @description Creates a mock User entity.
 * @param {Partial<User>} overrides - Properties to override
 * @returns {User} Mock User entity
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    getId: jest.fn(() => ({ toString: () => 'user-id-123' })),
    getRole: jest.fn(() => 'USER' as any),
    getStatus: jest.fn(() => 'ACTIVE' as any),
    isMfaEnabled: jest.fn(() => false),
    getEmail: jest.fn(() => ({ getValue: () => 'test@example.com' })),
    ...overrides
  } as unknown as User;
}

